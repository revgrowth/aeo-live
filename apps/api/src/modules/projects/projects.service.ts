import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(orgId: string, dto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                organizationId: orgId,
                name: dto.name,
                primaryDomain: this.normalizeDomain(dto.primaryDomain),
                competitors: dto.competitors?.map(this.normalizeDomain) || [],
                monitoringFrequency: dto.monitoringFrequency,
            },
        });
    }

    async findAll(orgId: string) {
        return this.prisma.project.findMany({
            where: { organizationId: orgId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string, orgId: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, organizationId: orgId },
            include: {
                audits: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
                alerts: {
                    where: { isRead: false },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        return project;
    }

    async update(id: string, orgId: string, dto: UpdateProjectDto) {
        // Verify project belongs to org
        const project = await this.prisma.project.findFirst({
            where: { id, organizationId: orgId },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        return this.prisma.project.update({
            where: { id },
            data: {
                name: dto.name,
                primaryDomain: dto.primaryDomain ? this.normalizeDomain(dto.primaryDomain) : undefined,
                competitors: dto.competitors?.map(this.normalizeDomain),
                monitoringFrequency: dto.monitoringFrequency,
                isActive: dto.isActive,
            },
        });
    }

    async delete(id: string, orgId: string) {
        // Verify project belongs to org
        const project = await this.prisma.project.findFirst({
            where: { id, organizationId: orgId },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // Soft delete by setting isActive to false
        return this.prisma.project.update({
            where: { id },
            data: { isActive: false },
        });
    }

    private normalizeDomain(domain: string): string {
        return domain
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');
    }
}
