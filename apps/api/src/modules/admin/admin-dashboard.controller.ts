import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Body,
    UseGuards,
    Res,
    NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';
import { AdminDashboardService } from './admin-dashboard.service';
import { ClaimCodesService } from '../claim-codes/claim-codes.service';
import { PdfService } from '../analysis/pdf.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'OWNER') // Only super admins, admins and owners can access
export class AdminDashboardController {
    constructor(
        private adminService: AdminDashboardService,
        private claimCodesService: ClaimCodesService,
        private pdfService: PdfService,
    ) { }

    /**
     * Get dashboard statistics
     */
    @Get('stats')
    async getStats() {
        const stats = await this.adminService.getStats();
        return { success: true, data: stats };
    }

    /**
     * Get analysis runs with pagination and filters
     */
    @Get('analyses')
    async getAnalysisRuns(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        console.log('[AdminDashboard] getAnalysisRuns called');
        const result = await this.adminService.getAnalysisRuns({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            status,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        console.log('[AdminDashboard] Found', result.total, 'analyses');
        return { success: true, data: result };
    }

    /**
     * Get full analysis details
     */
    @Get('analyses/:id')
    async getAnalysisDetails(@Param('id') id: string) {
        const analysis = await this.adminService.getAnalysisDetails(id);
        if (!analysis) {
            throw new NotFoundException('Analysis not found');
        }
        return { success: true, data: analysis };
    }

    /**
     * Get leads with pagination
     */
    @Get('leads')
    async getLeads(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('converted') converted?: string,
        @Query('subscribed') subscribed?: string,
    ) {
        const result = await this.adminService.getLeads({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            converted: converted ? converted === 'true' : undefined,
            subscribed: subscribed ? subscribed === 'true' : undefined,
        });
        return { success: true, data: result };
    }

    /**
     * Get all analyses for a specific lead (user)
     */
    @Get('leads/:id/analyses')
    async getLeadAnalyses(@Param('id') id: string) {
        const result = await this.adminService.getLeadAnalyses(id);
        if (!result) {
            throw new NotFoundException('Lead not found');
        }
        return { success: true, data: result };
    }

    /**
     * Export leads as CSV
     */
    @Get('leads/export')
    async exportLeads(@Res() res: Response) {
        const csv = await this.adminService.exportLeads();

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
        res.send(csv);
    }

    /**
     * Get cost breakdown by service
     */
    @Get('costs')
    async getCostBreakdown(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const result = await this.adminService.getCostBreakdown({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        return { success: true, data: result };
    }

    /**
     * Generate a claim code linked to an analysis and optionally return teaser PDF.
     */
    @Post('reports/:analysisId/generate-claim')
    @Roles('SUPER_ADMIN')
    async generateClaimForReport(
        @Param('analysisId') analysisId: string,
        @Body() body: { domain?: string },
        @Res() res: Response,
    ) {
        // Get analysis to extract domain
        const analysis = await this.adminService.getAnalysisDetails(analysisId);
        if (!analysis) {
            throw new NotFoundException('Analysis not found');
        }

        const domain = body.domain || (analysis as any).businessUrl || 'unknown';

        // Generate claim code linked to this analysis
        const result = await this.claimCodesService.generate({
            domain,
            analysisRunId: analysisId,
        });

        // Generate teaser PDF
        const teaser = await this.claimCodesService.getTeaser(result.code);
        let pdfBuffer: Buffer | null = null;

        if (teaser) {
            pdfBuffer = await this.pdfService.generateTeaserPdf(teaser, result.code);
        }

        // Return JSON with optional PDF as base64
        res.json({
            success: true,
            data: {
                ...result,
                domain,
                analysisId,
                teaser,
                pdfBase64: pdfBuffer ? pdfBuffer.toString('base64') : null,
            },
        });
    }

    /**
     * Download a 2-page sales teaser PDF for emailing to prospects.
     * Auto-generates a claim code if one doesn't already exist for this analysis.
     */
    @Get('reports/:analysisId/teaser-pdf')
    async downloadTeaserPdf(
        @Param('analysisId') analysisId: string,
        @Query('claimCode') existingCode: string | undefined,
        @Res() res: Response,
    ) {
        const analysis = await this.adminService.getAnalysisDetails(analysisId);
        if (!analysis) {
            throw new NotFoundException('Analysis not found');
        }

        // Resolve or create a claim code
        let claimCode = existingCode || '';
        if (!claimCode) {
            const domainStr = (analysis as any).businessUrl
                ? (analysis as any).businessUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
                : 'unknown';
            const result = await this.claimCodesService.generate({
                domain: domainStr,
                analysisRunId: analysisId,
            });
            claimCode = result.code;
        }

        // Build enriched teaser data from the full analysis
        const run = analysis as any;
        let categories: import('../analysis/pdf.service').SalesTeaserCategory[] = [];

        if (run.categoryScores) {
            try {
                const parsed = typeof run.categoryScores === 'string'
                    ? JSON.parse(run.categoryScores)
                    : run.categoryScores;
                categories = parsed.map((cat: any) => ({
                    name: cat.name || 'Unknown',
                    icon: cat.icon || '📊',
                    yourScore: Math.round(cat.score || cat.yourScore || 0),
                    competitorScore: Math.round(cat.competitorScore || 0),
                    status: cat.status || 'tied',
                    insightCount: Array.isArray(cat.insights) ? cat.insights.length : 0,
                    recommendationCount: Array.isArray(cat.recommendations) ? cat.recommendations.length : 0,
                }));
            } catch (e) {
                // fall through with empty categories
            }
        }

        const yourScore = run.yourScore || 0;
        const competitorScore = run.competitorScore || 0;
        const scoreDiff = yourScore - competitorScore;

        const salesData: import('../analysis/pdf.service').SalesTeaserData = {
            analysisId,
            yourUrl: run.businessUrl || '',
            competitorUrl: run.competitorUrl || '',
            yourScore,
            competitorScore,
            status: scoreDiff > 0 ? 'winning' : scoreDiff < 0 ? 'losing' : 'tied',
            categories,
            aiSummary: run.aiSummary || `This analysis compares ${run.businessUrl} against ${run.competitorUrl} across key competitive dimensions.`,
            businessName: run.businessProfile?.name,
            createdAt: run.createdAt
                ? new Date(run.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        };

        const pdfBuffer = await this.pdfService.generateSalesPdf(salesData, claimCode);

        const domainSlug = salesData.yourUrl
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/[^a-zA-Z0-9.-]/g, '')
            || 'report';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="AEO-Report-Preview-${domainSlug}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    }
}

