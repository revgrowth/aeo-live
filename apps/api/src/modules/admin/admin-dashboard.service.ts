import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export interface AnalysisRunSummary {
    id: string;
    businessName: string;
    businessUrl: string;
    competitorName?: string;
    competitorUrl: string;
    scope: string;
    yourScore?: number;
    competitorScore?: number;
    status: string;
    createdAt: Date;
    completedAt?: Date;
    totalCostCents?: number;
    purchasedFullReport: boolean;
    lead: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        purchasedReport: boolean;
        subscribedMonthly: boolean;
    };
}

export interface DashboardStats {
    totalAnalyses: number;
    completedAnalyses: number;
    totalLeads: number;
    convertedLeads: number;
    subscribedLeads: number;
    conversionRate: number;
    subscriptionRate: number;
    totalCostCents: number;
    totalRevenueCents: number;
}

export interface CostBreakdown {
    service: string;
    totalCostCents: number;
    callCount: number;
}

@Injectable()
export class AdminDashboardService {
    constructor(private prisma: PrismaService) { }

    /**
     * Auto-fail analyses stuck in running/pending status for more than 10 minutes
     */
    private async cleanupStuckAnalyses(): Promise<void> {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        const stuckResult = await this.prisma.analysisRun.updateMany({
            where: {
                status: { in: ['running', 'pending'] },
                createdAt: { lt: tenMinutesAgo },
            },
            data: {
                status: 'failed',
            },
        });

        if (stuckResult.count > 0) {
            console.log(`[AdminDashboard] Auto-failed ${stuckResult.count} stuck analyses (>10 min)`);
        }
    }

    /**
     * Get dashboard statistics
     */
    async getStats(): Promise<DashboardStats> {
        const [
            totalAnalyses,
            completedAnalyses,
            totalLeads,
            convertedLeads,
            subscribedLeads,
            costSum,
            revenueSum,
        ] = await Promise.all([
            this.prisma.analysisRun.count(),
            this.prisma.analysisRun.count({ where: { status: 'complete' } }),
            this.prisma.lead.count(),
            this.prisma.lead.count({ where: { purchasedReport: true } }),
            this.prisma.lead.count({ where: { subscribedMonthly: true } }),
            this.prisma.analysisCost.aggregate({ _sum: { costCents: true } }),
            this.prisma.analysisRun.aggregate({
                where: { purchasedFullReport: true },
                _sum: { purchaseAmountCents: true }
            }),
        ]);

        const totalCostCents = costSum._sum.costCents || 0;
        const totalRevenueCents = revenueSum._sum.purchaseAmountCents || 0;

        return {
            totalAnalyses,
            completedAnalyses,
            totalLeads,
            convertedLeads,
            subscribedLeads,
            conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
            subscriptionRate: totalLeads > 0 ? (subscribedLeads / totalLeads) * 100 : 0,
            totalCostCents,
            totalRevenueCents,
        };
    }

    /**
     * Get analysis runs with pagination
     */
    async getAnalysisRuns(options: {
        page?: number;
        limit?: number;
        status?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{ runs: AnalysisRunSummary[]; total: number; page: number; totalPages: number }> {
        // Auto-cleanup stuck analyses before returning results
        await this.cleanupStuckAnalyses();

        const page = options.page || 1;
        const limit = Math.min(options.limit || 20, 100);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (options.status) {
            where.status = options.status;
        }
        if (options.startDate || options.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const [runs, total] = await Promise.all([
            this.prisma.analysisRun.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    lead: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            purchasedReport: true,
                            subscribedMonthly: true,
                        },
                    },
                },
            }),
            this.prisma.analysisRun.count({ where }),
        ]);

        return {
            runs: runs.map((run) => ({
                id: run.id,
                businessName: run.businessName,
                businessUrl: run.businessUrl,
                competitorName: run.competitorName || undefined,
                competitorUrl: run.competitorUrl,
                scope: run.scope,
                yourScore: run.yourScore || undefined,
                competitorScore: run.competitorScore || undefined,
                status: run.status,
                createdAt: run.createdAt,
                completedAt: run.completedAt || undefined,
                totalCostCents: run.totalCostCents || undefined,
                purchasedFullReport: run.purchasedFullReport,
                lead: run.lead,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get full analysis details including AI conversations and costs
     */
    async getAnalysisDetails(id: string) {
        const run = await this.prisma.analysisRun.findUnique({
            where: { id },
            include: {
                lead: true,
                costs: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!run) {
            return null;
        }

        return {
            ...run,
            rawData: run.rawData as any,
            aiConversations: run.aiConversations as any,
            scoringFactors: run.scoringFactors as any,
            categoryScores: run.categoryScores as any,
        };
    }

    /**
     * Get leads with pagination
     */
    async getLeads(options: {
        page?: number;
        limit?: number;
        converted?: boolean;
        subscribed?: boolean;
    }) {
        const page = options.page || 1;
        const limit = Math.min(options.limit || 20, 100);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (options.converted !== undefined) {
            where.purchasedReport = options.converted;
        }
        if (options.subscribed !== undefined) {
            where.subscribedMonthly = options.subscribed;
        }

        const [leads, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { analyses: true },
                    },
                },
            }),
            this.prisma.lead.count({ where }),
        ]);

        return {
            leads: leads.map((lead) => ({
                ...lead,
                analysisCount: lead._count.analyses,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get cost breakdown by service
     */
    async getCostBreakdown(options: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<CostBreakdown[]> {
        const where: any = {};
        if (options.startDate || options.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const costs = await this.prisma.analysisCost.groupBy({
            by: ['service'],
            where,
            _sum: { costCents: true },
            _count: true,
        });

        return costs.map((c) => ({
            service: c.service,
            totalCostCents: c._sum.costCents || 0,
            callCount: c._count,
        }));
    }

    /**
     * Get all analyses for a specific lead
     */
    async getLeadAnalyses(leadId: string): Promise<{
        lead: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            businessName: string;
            businessUrl: string;
            purchasedReport: boolean;
            subscribedMonthly: boolean;
            createdAt: Date;
        };
        analyses: {
            id: string;
            businessName: string;
            businessUrl: string;
            competitorName: string | null;
            competitorUrl: string;
            yourScore: number | null;
            competitorScore: number | null;
            status: string;
            createdAt: Date;
            completedAt: Date | null;
            purchasedFullReport: boolean;
        }[];
    } | null> {
        const lead = await this.prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                analyses: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        businessName: true,
                        businessUrl: true,
                        competitorName: true,
                        competitorUrl: true,
                        yourScore: true,
                        competitorScore: true,
                        status: true,
                        createdAt: true,
                        completedAt: true,
                        purchasedFullReport: true,
                    },
                },
            },
        });

        if (!lead) {
            return null;
        }

        return {
            lead: {
                id: lead.id,
                firstName: lead.firstName,
                lastName: lead.lastName,
                email: lead.email,
                phone: lead.phone,
                businessName: lead.businessName,
                businessUrl: lead.businessUrl,
                purchasedReport: lead.purchasedReport,
                subscribedMonthly: lead.subscribedMonthly,
                createdAt: lead.createdAt,
            },
            analyses: lead.analyses,
        };
    }

    /**
     * Export leads as CSV
     */
    async exportLeads(): Promise<string> {
        const leads = await this.prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { analyses: true },
                },
            },
        });

        const header = 'First Name,Last Name,Email,Phone,Business Name,Business URL,Source,Created At,Purchased Report,Subscribed,Analysis Count\n';
        const rows = leads.map((lead) =>
            `"${lead.firstName}","${lead.lastName}","${lead.email}","${lead.phone}","${lead.businessName}","${lead.businessUrl}","${lead.source}","${lead.createdAt.toISOString()}",${lead.purchasedReport},${lead.subscribedMonthly},${lead._count.analyses}`
        ).join('\n');

        return header + rows;
    }
}
