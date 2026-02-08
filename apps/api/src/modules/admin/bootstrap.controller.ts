import { Controller, Post, Body, Get } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Bootstrap controller for initial setup tasks
 * WARNING: This should be removed or secured in production
 */
@Controller('bootstrap')
export class BootstrapController {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    /**
     * Upgrade a user to SUPER_ADMIN status
     * Checks against SUPER_ADMIN_EMAILS env var for authorization
     */
    @Post('upgrade-super-admin')
    async upgradeSuperAdmin(@Body('email') email: string) {
        // Get allowed super admin emails from env
        const allowedEmails = this.configService
            .get<string>('SUPER_ADMIN_EMAILS', '')
            .split(',')
            .map((e) => e.trim().toLowerCase());

        if (!allowedEmails.includes(email.toLowerCase())) {
            return {
                success: false,
                message: `Email ${email} is not in SUPER_ADMIN_EMAILS list`,
            };
        }

        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return {
                success: false,
                message: `User with email ${email} not found`,
            };
        }

        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
            },
        });

        return {
            success: true,
            message: `User ${email} upgraded to SUPER_ADMIN`,
            data: updated,
        };
    }

    /**
     * List all users (for debugging)
     */
    @Get('users')
    async listUsers() {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                createdAt: true,
            },
            take: 50,
        });

        return {
            success: true,
            data: users,
        };
    }
}
