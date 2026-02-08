import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { nanoid } from 'nanoid';
import { PrismaService } from '@/common/database/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokens, AuthUser } from '@aeo-live/shared';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService
    ) { }

    async register(dto: RegisterDto): Promise<{ user: AuthUser; tokens: AuthTokens }> {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const passwordHash = await argon2.hash(dto.password);

        // Create organization for user
        const orgSlug = this.generateSlug(dto.name || dto.email);

        const organization = await this.prisma.organization.create({
            data: {
                name: dto.organizationName || `${dto.name || dto.email}'s Team`,
                slug: orgSlug,
                plan: 'STARTER',
            },
        });

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                name: dto.name,
                organizationId: organization.id,
                role: 'OWNER',
                provider: 'email',
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id);

        // Create verification token
        await this.createVerificationToken(user.id, 'EMAIL_VERIFICATION');

        return {
            user: this.formatUser(user),
            tokens,
        };
    }

    async login(dto: LoginDto): Promise<{ user: AuthUser; tokens: AuthTokens }> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const tokens = await this.generateTokens(user.id);

        return {
            user: this.formatUser(user),
            tokens,
        };
    }

    async refreshTokens(refreshToken: string): Promise<AuthTokens> {
        // Find and validate refresh token
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Revoke old token
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        // Generate new tokens
        return this.generateTokens(storedToken.userId);
    }

    async logout(userId: string, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            // Revoke specific token
            await this.prisma.refreshToken.updateMany({
                where: { userId, token: refreshToken },
                data: { revokedAt: new Date() },
            });
        } else {
            // Revoke all tokens for user
            await this.prisma.refreshToken.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
    }

    async deleteAccount(userId: string): Promise<void> {
        // Get user with organization info
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { organization: true },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Use transaction to delete all related data
        await this.prisma.$transaction(async (tx) => {
            // Delete refresh tokens
            await tx.refreshToken.deleteMany({
                where: { userId },
            });

            // Delete verification tokens
            await tx.verificationToken.deleteMany({
                where: { userId },
            });

            // Delete user's analysis-related data (if any foreign key relationships exist)
            // Note: This may need to be expanded based on your schema

            // Delete the user
            await tx.user.delete({
                where: { id: userId },
            });

            // If user is the only member and owner of the organization, delete it too
            if (user.organizationId && user.role === 'OWNER') {
                const remainingMembers = await tx.user.count({
                    where: { organizationId: user.organizationId },
                });

                if (remainingMembers === 0) {
                    // Clean up organization-related data first
                    await tx.organization.delete({
                        where: { id: user.organizationId },
                    });
                }
            }
        });
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Don't reveal if user exists
            return;
        }

        await this.createVerificationToken(user.id, 'PASSWORD_RESET');

        // TODO: Send email with reset link
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const verificationToken = await this.prisma.verificationToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (
            !verificationToken ||
            verificationToken.type !== 'PASSWORD_RESET' ||
            verificationToken.usedAt ||
            verificationToken.expiresAt < new Date()
        ) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        const passwordHash = await argon2.hash(newPassword);

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: verificationToken.userId },
                data: { passwordHash },
            }),
            this.prisma.verificationToken.update({
                where: { id: verificationToken.id },
                data: { usedAt: new Date() },
            }),
            // Revoke all refresh tokens for security
            this.prisma.refreshToken.updateMany({
                where: { userId: verificationToken.userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);
    }

    async verifyEmail(token: string): Promise<void> {
        const verificationToken = await this.prisma.verificationToken.findUnique({
            where: { token },
        });

        if (
            !verificationToken ||
            verificationToken.type !== 'EMAIL_VERIFICATION' ||
            verificationToken.usedAt ||
            verificationToken.expiresAt < new Date()
        ) {
            throw new BadRequestException('Invalid or expired verification token');
        }

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: verificationToken.userId },
                data: { emailVerified: true },
            }),
            this.prisma.verificationToken.update({
                where: { id: verificationToken.id },
                data: { usedAt: new Date() },
            }),
        ]);
    }

    async validateOAuthUser(profile: {
        provider: string;
        providerId: string;
        email: string;
        name?: string;
        avatarUrl?: string;
    }): Promise<{ user: AuthUser; tokens: AuthTokens }> {
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: profile.email.toLowerCase() },
                    { provider: profile.provider, providerId: profile.providerId },
                ],
            },
        });

        if (!user) {
            // Create new user and organization
            const orgSlug = this.generateSlug(profile.name || profile.email);

            const organization = await this.prisma.organization.create({
                data: {
                    name: `${profile.name || profile.email}'s Team`,
                    slug: orgSlug,
                    plan: 'STARTER',
                },
            });

            user = await this.prisma.user.create({
                data: {
                    email: profile.email.toLowerCase(),
                    name: profile.name,
                    avatarUrl: profile.avatarUrl,
                    emailVerified: true, // OAuth emails are pre-verified
                    organizationId: organization.id,
                    role: 'OWNER',
                    provider: profile.provider,
                    providerId: profile.providerId,
                },
            });
        } else if (!user.providerId) {
            // Link OAuth to existing email-based account
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    provider: profile.provider,
                    providerId: profile.providerId,
                    emailVerified: true,
                    avatarUrl: user.avatarUrl || profile.avatarUrl,
                },
            });
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const tokens = await this.generateTokens(user.id);

        return {
            user: this.formatUser(user),
            tokens,
        };
    }

    async validateUserById(userId: string): Promise<AuthUser | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        return user ? this.formatUser(user) : null;
    }

    private async generateTokens(userId: string): Promise<AuthTokens> {
        const payload = { sub: userId };

        const accessToken = this.jwtService.sign(payload);

        const refreshToken = nanoid(64);
        const refreshExpirationDays = parseInt(
            this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d').replace('d', ''),
            10
        );

        await this.prisma.refreshToken.create({
            data: {
                userId,
                token: refreshToken,
                expiresAt: new Date(Date.now() + refreshExpirationDays * 24 * 60 * 60 * 1000),
            },
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60, // 15 minutes in seconds
        };
    }

    private async createVerificationToken(
        userId: string,
        type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
    ): Promise<string> {
        const token = nanoid(32);
        const expirationHours = type === 'EMAIL_VERIFICATION' ? 24 : 1;

        await this.prisma.verificationToken.create({
            data: {
                userId,
                token,
                type,
                expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
            },
        });

        return token;
    }

    private formatUser(user: {
        id: string;
        email: string;
        name: string | null;
        avatarUrl: string | null;
        role: string;
        organizationId: string | null;
        emailVerified: boolean;
    }): AuthUser {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role as AuthUser['role'],
            organizationId: user.organizationId,
            emailVerified: user.emailVerified,
        };
    }

    private generateSlug(name: string): string {
        const baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50);

        return `${baseSlug}-${nanoid(6)}`;
    }
}
