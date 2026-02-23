import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { GenerateClaimCodeDto } from './dto/generate-claim-code.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ClaimCodesService {
    private readonly logger = new Logger(ClaimCodesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate a new claim code for a target domain (admin only).
     */
    async generate(dto: GenerateClaimCodeDto) {
        const code = dto.customCode || this.generateCode();

        // Verify code uniqueness
        const existing = await this.prisma.claimCode.findUnique({
            where: { code },
        });

        if (existing) {
            throw new ConflictException(`Claim code "${code}" already exists`);
        }

        // Optionally verify lead exists
        if (dto.leadId) {
            const lead = await this.prisma.lead.findUnique({
                where: { id: dto.leadId },
            });
            if (!lead) {
                throw new NotFoundException(`Lead ${dto.leadId} not found`);
            }
        }

        const claimCode = await this.prisma.claimCode.create({
            data: {
                code,
                targetDomain: this.normalizeDomain(dto.domain),
                leadId: dto.leadId || null,
            },
        });

        this.logger.log(`Generated claim code "${code}" for domain ${claimCode.targetDomain}`);

        return { code: claimCode.code, id: claimCode.id };
    }

    /**
     * Validate a claim code — public, no auth required.
     */
    async validate(code: string) {
        const claimCode = await this.prisma.claimCode.findUnique({
            where: { code },
        });

        if (!claimCode) {
            return { valid: false, domain: null };
        }

        return {
            valid: claimCode.status === 'ACTIVE',
            domain: claimCode.targetDomain,
            status: claimCode.status,
        };
    }

    /**
     * Redeem a claim code — creates a Project in the user's organization.
     * Called during registration or as a standalone POST.
     */
    async redeem(code: string, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Find and lock the claim code
            const claimCode = await tx.claimCode.findUnique({
                where: { code },
            });

            if (!claimCode) {
                throw new NotFoundException(`Claim code "${code}" not found`);
            }

            if (claimCode.status !== 'ACTIVE') {
                throw new BadRequestException(
                    `Claim code "${code}" is ${claimCode.status.toLowerCase()}, not redeemable`,
                );
            }

            // 2. Get the user + their organization
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { id: true, organizationId: true },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            if (!user.organizationId) {
                throw new BadRequestException('User does not belong to an organization');
            }

            // 3. Mark the code as REDEEMED
            await tx.claimCode.update({
                where: { id: claimCode.id },
                data: {
                    status: 'REDEEMED',
                    redeemedByUserId: userId,
                    redeemedAt: new Date(),
                },
            });

            // 4. Create a Project for the target domain
            const project = await tx.project.create({
                data: {
                    organizationId: user.organizationId,
                    name: claimCode.targetDomain,
                    primaryDomain: claimCode.targetDomain,
                },
            });

            this.logger.log(
                `Redeemed claim code "${code}" → Project ${project.id} for user ${userId}`,
            );

            return {
                projectId: project.id,
                domain: claimCode.targetDomain,
            };
        });
    }

    /**
     * List all claim codes with optional status filter (admin).
     */
    async findAll(status?: string) {
        const where = status ? { status: status as any } : {};

        return this.prisma.claimCode.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                redeemedByUser: {
                    select: { id: true, name: true, email: true },
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }

    /**
     * Generate a URL-friendly random code (e.g., "A7K3-XM92-PQ1R").
     */
    private generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I for clarity
        const segments = 3;
        const segmentLength = 4;
        const parts: string[] = [];

        for (let s = 0; s < segments; s++) {
            let segment = '';
            const bytes = randomBytes(segmentLength);
            for (let i = 0; i < segmentLength; i++) {
                segment += chars[bytes[i] % chars.length];
            }
            parts.push(segment);
        }

        return parts.join('-');
    }

    private normalizeDomain(domain: string): string {
        return domain
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');
    }
}
