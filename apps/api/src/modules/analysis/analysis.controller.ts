import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { StartAnalysisDto, SelectCompetitorDto } from './dto';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) { }

    /**
     * Start a new free analysis
     * No authentication required
     */
    @Post('free')
    @HttpCode(HttpStatus.CREATED)
    async startFreeAnalysis(@Body() dto: StartAnalysisDto) {
        return this.analysisService.startFreeAnalysis(dto);
    }

    /**
     * Get competitor suggestions for an analysis using AI-powered discovery
     */
    @Get(':id/competitors')
    async getCompetitorSuggestions(
        @Param('id') id: string,
        @Query('token') token: string,
        @Query('scope') scope?: 'local' | 'national',
    ) {
        return this.analysisService.getCompetitorSuggestions(id, token, scope || 'local');
    }

    /**
     * Select a competitor and start the comparison analysis
     */
    @Post(':id/competitor')
    @HttpCode(HttpStatus.OK)
    async selectCompetitor(
        @Param('id') id: string,
        @Query('token') token: string,
        @Body() dto: SelectCompetitorDto,
    ) {
        return this.analysisService.selectCompetitorAndAnalyze(id, token, dto);
    }

    /**
     * Get analysis status (for polling during analysis)
     */
    @Get(':id/status')
    async getAnalysisStatus(
        @Param('id') id: string,
        @Query('token') token: string,
    ) {
        return this.analysisService.getAnalysisStatus(id, token);
    }

    /**
     * Get teaser results (after analysis completes)
     */
    @Get(':id/teaser')
    async getTeaserResults(
        @Param('id') id: string,
        @Query('token') token: string,
    ) {
        return this.analysisService.getTeaserResults(id, token);
    }

    /**
     * Get full report (for purchased reports or admin preview)
     */
    @Get(':id/full')
    async getFullReport(
        @Param('id') id: string,
        @Query('token') token?: string,
        @Query('admin') admin?: string,
    ) {
        const isAdmin = admin === 'true';
        return this.analysisService.getFullReport(id, token, isAdmin);
    }

    /**
     * Check if user can refresh this report
     * Returns user type, credits remaining, and add-on pricing
     */
    @Get(':id/refresh/check')
    async checkRefreshEligibility(
        @Param('id') id: string,
        @Query('userId') userId?: string,
    ) {
        return this.analysisService.checkRefreshEligibility(id, userId);
    }

    /**
     * Execute a report refresh (re-run analysis)
     * Admin: immediate execution, bypasses paywall
     * Subscriber: deduct 1 credit
     * Non-subscriber: must provide payment token
     */
    @Post(':id/refresh')
    @HttpCode(HttpStatus.OK)
    async refreshReport(
        @Param('id') id: string,
        @Query('userId') userId?: string,
        @Query('admin') admin?: string,
        @Body() body?: { paymentToken?: string },
    ) {
        const isAdmin = admin === 'true';
        return this.analysisService.refreshReport(id, userId, body?.paymentToken, isAdmin);
    }
}
