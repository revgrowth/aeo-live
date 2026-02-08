import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { AuditStatus } from '@aeo-live/shared';

@Injectable()
export class AuditsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(projectId: string, orgId: string, triggeredBy: 'MANUAL' | 'SCHEDULED' | 'API' = 'MANUAL') {
        // Verify project belongs to org
        const project = await this.prisma.project.findFirst({
            where: { id: projectId, organizationId: orgId, isActive: true },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // Create audit
        const audit = await this.prisma.audit.create({
            data: {
                projectId,
                type: 'FULL',
                status: 'PENDING',
                triggeredBy,
            },
        });

        // Create audit sites (primary + competitors)
        const competitors = (project.competitors as string[]) || [];
        const sites = [
            { domain: project.primaryDomain, isPrimary: true },
            ...competitors.map((domain) => ({ domain, isPrimary: false })),
        ];

        await this.prisma.auditSite.createMany({
            data: sites.map((site) => ({
                auditId: audit.id,
                domain: site.domain,
                isPrimary: site.isPrimary,
            })),
        });

        // TODO: Queue the audit for processing

        return this.findById(audit.id, orgId);
    }

    async findByProject(projectId: string, orgId: string) {
        // Verify project belongs to org
        const project = await this.prisma.project.findFirst({
            where: { id: projectId, organizationId: orgId },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        return this.prisma.audit.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                auditSites: {
                    select: {
                        id: true,
                        domain: true,
                        isPrimary: true,
                        primaryScore: true,
                    },
                },
            },
        });
    }

    async findById(id: string, orgId: string) {
        const audit = await this.prisma.audit.findFirst({
            where: { id },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        organizationId: true,
                    },
                },
                auditSites: true,
                comparisons: true,
                reports: true,
            },
        });

        if (!audit || audit.project.organizationId !== orgId) {
            throw new NotFoundException('Audit not found');
        }

        return audit;
    }

    async getStatus(id: string, orgId: string) {
        const audit = await this.findById(id, orgId);

        return {
            id: audit.id,
            status: audit.status,
            startedAt: audit.startedAt,
            completedAt: audit.completedAt,
            errorMessage: audit.errorMessage,
            sites: audit.auditSites.map((site) => ({
                id: site.id,
                domain: site.domain,
                isPrimary: site.isPrimary,
                pagesDiscovered: site.pagesDiscovered,
                pagesAnalyzed: site.pagesAnalyzed,
                primaryScore: site.primaryScore,
            })),
        };
    }

    async getResults(id: string, orgId: string) {
        const audit = await this.findById(id, orgId);

        if (audit.status !== 'COMPLETE') {
            throw new ForbiddenException('Audit is not yet complete');
        }

        return {
            id: audit.id,
            completedAt: audit.completedAt,
            sites: audit.auditSites.map((site) => ({
                id: site.id,
                domain: site.domain,
                isPrimary: site.isPrimary,
                scores: {
                    primary: site.primaryScore,
                    technicalSeo: site.technicalSeoScore,
                    onpageSeo: site.onpageSeoScore,
                    contentQuality: site.contentQualityScore,
                    aeoReadiness: site.aeoReadinessScore,
                    brandVoice: site.brandVoiceScore,
                    uxEngagement: site.uxEngagementScore,
                    internalStructure: site.internalStructureScore,
                },
                subScores: site.subScores,
                pagesDiscovered: site.pagesDiscovered,
                pagesAnalyzed: site.pagesAnalyzed,
            })),
            comparison: audit.comparisons[0] || null,
        };
    }

    async getComparison(id: string, orgId: string) {
        const audit = await this.findById(id, orgId);

        if (audit.status !== 'COMPLETE') {
            throw new ForbiddenException('Audit is not yet complete');
        }

        const comparison = audit.comparisons[0];
        if (!comparison) {
            throw new NotFoundException('Comparison not found for this audit');
        }

        return comparison;
    }
}
