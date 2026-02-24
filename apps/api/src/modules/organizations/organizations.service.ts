import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class OrganizationsService {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        avatarUrl: true,
                    },
                },
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    take: 1,
                },
            },
        });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        return org;
    }

    async update(id: string, userId: string, data: { name?: string }) {
        // Verify user has permission
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                organizationId: id,
                role: { in: ['SUPER_ADMIN', 'ADMIN', 'OWNER'] },
            },
        });

        if (!user) {
            throw new ForbiddenException('You do not have permission to update this organization');
        }

        return this.prisma.organization.update({
            where: { id },
            data,
        });
    }

    async getMembers(orgId: string) {
        return this.prisma.user.findMany({
            where: { organizationId: orgId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                lastLoginAt: true,
                createdAt: true,
            },
        });
    }
}
