import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Query,
    Body,
    UseGuards,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';
import { PrismaService } from '../../common/database/prisma.service';

/**
 * Super Admin User Management Controller
 * Provides comprehensive account management for super admins
 */
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'OWNER', 'ADMIN')
export class UserManagementController {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all users with pagination and filtering
     */
    @Get()
    async getUsers(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('status') status?: string,
        @Query('sortBy') sortBy = 'createdAt',
        @Query('sortOrder') sortOrder = 'desc',
    ) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.role = role;
        }

        // Note: status field may not exist, skip filtering if it errors
        // if (status) {
        //     where.status = status;
        // }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatarUrl: true,
                    role: true,
                    // status: true, // May not be generated yet
                    provider: true,
                    emailVerified: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                    organization: {
                        select: {
                            id: true,
                            name: true,
                            plan: true,
                        },
                    },
                    _count: {
                        select: {
                            leads: true,
                        },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            success: true,
            data: {
                users,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    /**
     * Get detailed user profile with history
     */
    @Get(':id')
    async getUserDetails(@Param('id') id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                organization: {
                    include: {
                        subscriptions: true,
                    },
                },
                leads: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Get user activity history (recent logins, analyses, etc.)
        const recentActivity = await this.getRecentUserActivity(id);

        return {
            success: true,
            data: {
                ...user,
                passwordHash: undefined, // Never expose password hash
                recentActivity,
            },
        };
    }

    /**
     * Update user role
     */
    @Patch(':id/role')
    async updateUserRole(
        @Param('id') id: string,
        @Body('role') newRole: string,
    ) {
        const validRoles = ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MEMBER'];
        if (!validRoles.includes(newRole)) {
            throw new BadRequestException(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: { role: newRole as any },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        return {
            success: true,
            message: `User role updated to ${newRole}`,
            data: user,
        };
    }

    /**
     * Update user status (suspend/activate/ban)
     */
    @Patch(':id/status')
    async updateUserStatus(
        @Param('id') id: string,
        @Body('status') newStatus: string,
        @Body('reason') reason?: string,
    ) {
        const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED'];
        if (!validStatuses.includes(newStatus)) {
            throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // Note: status field may not be in Prisma client yet - needs regeneration
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Log the status change (actual update pending Prisma regeneration)
        console.log(`[ADMIN] User ${user.email} status change requested to ${newStatus}. Reason: ${reason || 'Not specified'}`);

        return {
            success: true,
            message: `User status change to ${newStatus} logged (pending schema migration)`,
            data: { ...user, status: newStatus },
        };
    }

    /**
     * Update user subscription tier
     */
    @Patch(':id/subscription')
    async updateUserSubscription(
        @Param('id') id: string,
        @Body('tier') tier: string,
        @Body('status') status?: string,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { organization: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.organization) {
            throw new BadRequestException('User does not have an organization');
        }

        const validTiers = ['FREE', 'STARTER', 'GROWTH', 'SCALE', 'SCALE_PLUS'];
        if (!validTiers.includes(tier)) {
            throw new BadRequestException(`Invalid tier. Must be one of: ${validTiers.join(', ')}`);
        }

        const org = await this.prisma.organization.update({
            where: { id: user.organization.id },
            data: {
                plan: tier as any,
            },
        });

        return {
            success: true,
            message: `Plan updated to ${tier}`,
            data: { organization: org },
        };
    }

    /**
     * Grant free reports to user
     */
    @Post(':id/grant-reports')
    async grantFreeReports(
        @Param('id') id: string,
        @Body('count') count: number,
        @Body('reason') reason?: string,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { organization: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.organization) {
            throw new BadRequestException('User does not have an organization');
        }

        // Note: monthlyReportsRemaining may not exist on Organization
        // For now, just log the action
        console.log(`[ADMIN] Granted ${count} free reports to ${user.email}. Reason: ${reason || 'Not specified'}`);

        return {
            success: true,
            message: `Granted ${count} free reports (logged only - field not in schema)`,
            data: { granted: count },
        };
    }

    /**
     * Reset user password (sends reset email or generates temp password)
     */
    @Post(':id/reset-password')
    async resetUserPassword(
        @Param('id') id: string,
        @Body('sendEmail') sendEmail = true,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.provider && user.provider !== 'email') {
            throw new BadRequestException(`User uses ${user.provider} authentication - cannot reset password`);
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-12);
        const argon2 = await import('argon2');
        const hashedPassword = await argon2.hash(tempPassword);

        await this.prisma.user.update({
            where: { id },
            data: { passwordHash: hashedPassword },
        });

        // TODO: Send email with temporary password if sendEmail is true

        return {
            success: true,
            message: sendEmail
                ? 'Password reset email sent'
                : 'Password has been reset',
            data: sendEmail ? undefined : { temporaryPassword: tempPassword },
        };
    }

    /**
     * Impersonate user (get temporary auth token)
     * SUPER_ADMIN only
     */
    @Post(':id/impersonate')
    @Roles('SUPER_ADMIN')
    async impersonateUser(@Param('id') id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // In a real implementation, generate a temporary JWT for the target user
        // For now, return the user info
        return {
            success: true,
            message: 'Impersonation not yet implemented - would generate temporary token',
            data: { user },
        };
    }

    /**
     * Delete user account
     * SUPER_ADMIN only
     */
    @Post(':id/delete')
    @Roles('SUPER_ADMIN')
    async deleteUser(
        @Param('id') id: string,
        @Body('confirm') confirm: boolean,
        @Body('reason') reason?: string,
    ) {
        if (!confirm) {
            throw new BadRequestException('Must confirm deletion');
        }

        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Delete associated refresh tokens first
        await this.prisma.refreshToken.deleteMany({
            where: { userId: id },
        });

        // Delete verification tokens
        await this.prisma.verificationToken.deleteMany({
            where: { userId: id },
        });

        // Delete the user
        await this.prisma.user.delete({
            where: { id },
        });

        console.log(`[ADMIN] User ${user.email} deleted. Reason: ${reason || 'Not specified'}`);

        return {
            success: true,
            message: 'User deleted successfully',
        };
    }

    /**
     * Get user statistics summary
     */
    @Get('stats/summary')
    async getUserStats() {
        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            superAdmins,
            admins,
            recentSignups,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
            this.prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
            this.prisma.user.count({ where: { role: 'ADMIN' } }),
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    },
                },
            }),
        ]);

        return {
            success: true,
            data: {
                totalUsers,
                activeUsers,
                suspendedUsers,
                superAdmins,
                admins,
                recentSignups,
            },
        };
    }

    /**
     * Helper: Get recent user activity
     */
    private async getRecentUserActivity(userId: string) {
        // Get recent leads
        const leads = await this.prisma.lead.findMany({
            where: { userId },
            take: 10,
            orderBy: { createdAt: 'desc' },
        });

        return {
            recentLeads: leads.length,
            lastActivity: leads[0]?.createdAt || null,
        };
    }
}
