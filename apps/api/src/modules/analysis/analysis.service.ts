import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
    StartAnalysisDto,
    SelectCompetitorDto,
    CompetitorSuggestion,
    AnalysisTeaserResponse,
    AnalysisStatusResponse,
    CategoryTeaser,
    BusinessInfo
} from './dto';
import { randomBytes } from 'crypto';
import { AICompetitorDiscoveryService, BusinessAnalysis } from './ai-competitor-discovery.service';
import { AnalysisEngine, FullAnalysisResult, CategoryScore } from './analysis-engine.service';

interface FreeAnalysisData {
    id: string;
    token: string;
    url: string;
    competitorUrl?: string;
    scope?: 'local' | 'national';
    status: 'pending' | 'selecting_competitor' | 'crawling' | 'analyzing' | 'complete' | 'failed';
    progress: number;
    statusMessage?: string;
    result?: FullAnalysisResult;
    businessAnalysis?: BusinessAnalysis;
    createdAt: Date;
    // Lead info
    leadId?: string;
    analysisRunId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    businessName: string;
    // AI/Cost tracking
    aiConversations?: any[];
    apiCosts?: { service: string; operation: string; costCents: number; tokensUsed?: number }[];
}

@Injectable()
export class AnalysisService {
    // In-memory store for free analyses (in production, use Redis)
    private freeAnalyses = new Map<string, FreeAnalysisData>();

    private aiDiscovery = new AICompetitorDiscoveryService();
    private analysisEngine = new AnalysisEngine();

    constructor(private prisma: PrismaService) { }

    /**
     * Start a new free analysis - no auth required, but requires lead info
     */
    async startFreeAnalysis(dto: StartAnalysisDto): Promise<{ analysisId: string; token: string }> {
        // Normalize URL
        let normalizedUrl = dto.url.trim().toLowerCase();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        // Validate URL
        try {
            new URL(normalizedUrl);
        } catch {
            throw new BadRequestException('Invalid URL format');
        }

        // Extract domain
        const domain = new URL(normalizedUrl).hostname;

        // Generate unique ID and token
        const analysisId = 'free_' + Date.now().toString(36) + '_' + randomBytes(4).toString('hex');
        const token = randomBytes(32).toString('hex');

        // Save lead to database (upsert by email)
        let leadId: string | undefined;
        let analysisRunId: string | undefined;

        try {
            const lead = await this.prisma.lead.upsert({
                where: { email: dto.email },
                update: {
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    phone: dto.phone,
                    businessName: dto.businessName,
                    businessUrl: normalizedUrl,
                    updatedAt: new Date(),
                },
                create: {
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    email: dto.email,
                    phone: dto.phone,
                    businessName: dto.businessName,
                    businessUrl: normalizedUrl,
                    source: 'free_analysis',
                },
            });
            leadId = lead.id;

            // Create analysis run record
            const analysisRun = await this.prisma.analysisRun.create({
                data: {
                    leadId: lead.id,
                    businessName: dto.businessName,
                    businessUrl: normalizedUrl,
                    competitorUrl: '', // Will be updated when competitor is selected
                    scope: dto.scope || 'local',
                    status: 'pending',
                },
            });
            analysisRunId = analysisRun.id;

            console.log(`[Analysis] Lead saved: ${lead.id}, AnalysisRun: ${analysisRun.id}`);
        } catch (error) {
            console.error('[Analysis] Failed to save lead to database:', error);
            // Continue without DB - still allow analysis
        }

        // Store analysis in memory
        this.freeAnalyses.set(analysisId, {
            id: analysisId,
            token,
            url: normalizedUrl,
            scope: dto.scope,
            status: 'selecting_competitor',
            progress: 0,
            createdAt: new Date(),
            // Lead info
            leadId,
            analysisRunId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phone,
            businessName: dto.businessName,
            // Cost tracking
            apiCosts: [],
            aiConversations: [],
        });

        console.log(`[Analysis] Started free analysis ${analysisId} for ${domain} (Lead: ${dto.firstName} ${dto.lastName})`);

        return { analysisId, token };
    }

    /**
     * Get competitor suggestions for a domain using AI-powered discovery
     */
    async getCompetitorSuggestions(
        analysisId: string,
        token: string,
        scope: 'local' | 'national' = 'local'
    ): Promise<{ business: BusinessInfo; suggestions: CompetitorSuggestion[] }> {
        const analysis = this.freeAnalyses.get(analysisId);
        if (!analysis || analysis.token !== token) {
            console.error(`[Analysis] Analysis not found: ${analysisId}`);
            throw new NotFoundException('Analysis not found. Please start a new analysis.');
        }

        const domain = new URL(analysis.url).hostname;
        console.log(`[Analysis] AI-powered competitor discovery for ${domain} (${scope} scope)...`);

        // Use AI-powered discovery
        const { analysis: businessAnalysis, competitors } = await this.aiDiscovery.discoverCompetitorsForDomain(
            domain,
            { scope }
        );

        // Store the business analysis for later use
        analysis.businessAnalysis = businessAnalysis;
        analysis.scope = scope;

        // Build location string
        const locationParts = [];
        if (businessAnalysis.location?.city) locationParts.push(businessAnalysis.location.city);
        if (businessAnalysis.location?.state) locationParts.push(businessAnalysis.location.state);

        const business: BusinessInfo = {
            name: businessAnalysis.businessName,
            industry: businessAnalysis.industry,
            niche: businessAnalysis.niche,
            services: businessAnalysis.primaryServices,
            location: locationParts.join(', ') || undefined,
            targetMarket: businessAnalysis.targetMarket,
        };

        const suggestions: CompetitorSuggestion[] = competitors.map(c => ({
            domain: c.domain,
            name: c.name,
            description: c.description,
            similarity: c.similarity,
            source: c.source,
        }));

        console.log(`[Analysis] Found ${suggestions.length} AI-suggested competitors for ${businessAnalysis.businessName}`);
        return { business, suggestions };
    }

    /**
     * Select competitor and start analysis
     */
    async selectCompetitorAndAnalyze(
        analysisId: string,
        token: string,
        dto: SelectCompetitorDto
    ): Promise<{ status: string }> {
        const analysis = this.freeAnalyses.get(analysisId);
        if (!analysis || analysis.token !== token) {
            throw new NotFoundException('Analysis not found');
        }

        // Normalize competitor URL
        let competitorUrl = dto.competitorUrl.trim().toLowerCase();
        if (!competitorUrl.startsWith('http://') && !competitorUrl.startsWith('https://')) {
            competitorUrl = 'https://' + competitorUrl;
        }

        // Update analysis
        analysis.competitorUrl = competitorUrl;
        analysis.status = 'crawling';
        analysis.progress = 0;

        // Start async analysis (simulated)
        this.runAnalysis(analysisId);

        return { status: 'started' };
    }

    /**
     * Run the actual analysis using real data sources
     */
    private async runAnalysis(analysisId: string): Promise<void> {
        const analysis = this.freeAnalyses.get(analysisId);
        if (!analysis || !analysis.competitorUrl) return;

        try {
            console.log(`[AnalysisService] Starting real analysis for ${analysisId}`);

            // Run the full analysis with progress callbacks
            const result = await this.analysisEngine.runAnalysis(
                analysis.url,
                analysis.competitorUrl,
                analysisId,
                (progress) => {
                    // Update analysis state with progress
                    // NOTE: Do NOT set status to 'complete' here - wait until result is stored
                    if (progress.stage === 'crawling') {
                        analysis.status = 'crawling';
                    } else if (['analyzing_content', 'checking_seo', 'measuring_performance', 'scoring', 'complete'].includes(progress.stage)) {
                        // Keep status as 'analyzing' until result is fully stored
                        analysis.status = 'analyzing';
                    }
                    analysis.progress = progress.progress;
                    analysis.statusMessage = progress.message;
                }
            );

            // Store the full result
            analysis.result = result;
            analysis.status = 'complete';
            analysis.progress = 100;

            console.log(`[AnalysisService] Analysis complete: You ${result.yourScore} vs Competitor ${result.competitorScore}`);

            // Persist to database
            if (analysis.analysisRunId) {
                try {
                    // Record API costs (realistic estimates based on actual pricing)
                    // - Firecrawl: ~$0.01/scrape = 1 cent per page
                    // - Anthropic Claude: ~$0.05-0.15/call (depends on tokens)
                    // - PageSpeed: Free (Google API)
                    // - DataForSEO: ~$0.01/call
                    const apiCosts = [
                        { service: 'firecrawl', operation: 'scrape_your_site', costCents: 1 },
                        { service: 'firecrawl', operation: 'scrape_competitor', costCents: 1 },
                        { service: 'anthropic', operation: 'content_analysis', costCents: 10 },
                        { service: 'anthropic', operation: 'intelligence_report', costCents: 15 },
                        { service: 'anthropic', operation: 'brand_voice', costCents: 8 },
                        { service: 'anthropic', operation: 'aeo_readiness', costCents: 5 },
                        { service: 'pagespeed', operation: 'performance_your_site', costCents: 0 },
                        { service: 'pagespeed', operation: 'performance_competitor', costCents: 0 },
                        { service: 'dataforseo', operation: 'seo_your_domain', costCents: 1 },
                        { service: 'dataforseo', operation: 'seo_competitor', costCents: 1 },
                    ];

                    // Create cost records
                    await this.prisma.analysisCost.createMany({
                        data: apiCosts.map(cost => ({
                            analysisId: analysis.analysisRunId!,
                            service: cost.service,
                            operation: cost.operation,
                            costCents: cost.costCents,
                        })),
                    });

                    // Calculate total cost
                    const totalCostCents = apiCosts.reduce((sum, c) => sum + c.costCents, 0);

                    await this.prisma.analysisRun.update({
                        where: { id: analysis.analysisRunId },
                        data: {
                            status: 'complete',
                            competitorUrl: analysis.competitorUrl,
                            competitorName: result.businessProfile?.name || undefined,
                            yourScore: Math.round(result.yourScore),
                            competitorScore: Math.round(result.competitorScore),
                            categoryScores: JSON.stringify(result.categories),
                            intelligenceReport: result.intelligenceReport ? JSON.stringify(result.intelligenceReport) : undefined,
                            // Store v3Analysis and performance data in rawData for retrieval
                            rawData: JSON.stringify({
                                v3Analysis: result.v3Analysis,
                                performanceComparison: result.performanceComparison,
                            }),
                            totalCostCents,
                            completedAt: new Date(),
                        },
                    });
                    console.log(`[AnalysisService] Results persisted to DB for ${analysis.analysisRunId} (cost: $${(totalCostCents / 100).toFixed(2)})`);
                } catch (dbError) {
                    console.error('[AnalysisService] Failed to persist results to DB:', dbError);
                }
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[AnalysisService] Analysis failed for ${analysisId}:`, errorMessage);
            analysis.status = 'failed';
            analysis.statusMessage = errorMessage || 'Analysis failed. Please try again.';
        }
    }

    /**
     * Generate category teasers
     */
    private generateCategoryTeasers(): CategoryTeaser[] {
        return [
            {
                name: 'Technical SEO',
                icon: 'Zap',
                yourTeaser: `${Math.floor(Math.random() * 5) + 1} critical issues`,
                competitorTeaser: `${Math.floor(Math.random() * 3)} issues`,
                locked: true,
            },
            {
                name: 'On-Page SEO',
                icon: 'BarChart3',
                yourTeaser: `${Math.floor(Math.random() * 8) + 2} elements to optimize`,
                competitorTeaser: 'Better optimized',
                locked: true,
            },
            {
                name: 'Content Quality',
                icon: 'Sparkles',
                yourTeaser: `${['Above', 'Below', 'Near'][Math.floor(Math.random() * 3)]} competitor`,
                competitorTeaser: 'Benchmark set',
                locked: true,
            },
            {
                name: 'AEO Readiness',
                icon: 'Target',
                yourTeaser: `${Math.random() > 0.5 ? 'Behind' : 'Ahead of'} competitor`,
                competitorTeaser: 'Analysis ready',
                locked: true,
            },
            {
                name: 'Brand Voice',
                icon: 'Shield',
                yourTeaser: 'Differentiation analysis ready',
                competitorTeaser: 'Voice profile ready',
                locked: true,
            },
            {
                name: 'UX & Engagement',
                icon: 'Layout',
                yourTeaser: `${Math.floor(Math.random() * 4) + 1} UX gaps`,
                competitorTeaser: 'Patterns identified',
                locked: true,
            },
            {
                name: 'Internal Structure',
                icon: 'Link2',
                yourTeaser: `${Math.floor(Math.random() * 10) + 5} linking opportunities`,
                competitorTeaser: 'Structure mapped',
                locked: true,
            },
        ];
    }

    /**
     * Get analysis status
     */
    async getAnalysisStatus(analysisId: string, token: string): Promise<AnalysisStatusResponse> {
        const analysis = this.freeAnalyses.get(analysisId);
        if (!analysis || analysis.token !== token) {
            throw new NotFoundException('Analysis not found');
        }

        // Use real-time status message if available
        let message = analysis.statusMessage || '';
        if (!message) {
            switch (analysis.status) {
                case 'selecting_competitor':
                    message = 'Waiting for competitor selection';
                    break;
                case 'crawling':
                    message = 'Crawling both sites...';
                    break;
                case 'analyzing':
                    message = 'Analyzing and comparing...';
                    break;
                case 'complete':
                    message = 'Analysis complete';
                    break;
                case 'failed':
                    message = 'Analysis failed';
                    break;
            }
        }

        return {
            analysisId: analysis.id,
            status: analysis.status === 'selecting_competitor' ? 'pending' : analysis.status,
            progress: analysis.progress,
            message,
        };
    }

    /**
     * Get teaser results
     */
    async getTeaserResults(analysisId: string, token: string): Promise<AnalysisTeaserResponse> {
        const analysis = this.freeAnalyses.get(analysisId);
        if (!analysis || analysis.token !== token) {
            throw new NotFoundException('Analysis not found');
        }

        if (analysis.status !== 'complete') {
            throw new BadRequestException('Analysis not yet complete');
        }

        // Safety check: ensure result exists and has categories
        if (!analysis.result || !analysis.result.categories) {
            console.error(`[AnalysisService] getTeaserResults: result or categories missing for ${analysisId}`);
            throw new BadRequestException('Analysis results not ready. Please try again in a moment.');
        }

        // Helper to safely get a numeric score (handles NaN, undefined, null)
        const safeScore = (score: number | undefined | null): number => {
            if (score === undefined || score === null || Number.isNaN(score)) {
                return 0;
            }
            return score;
        };

        // Convert CategoryScore to CategoryTeaser format
        const categories: CategoryTeaser[] = analysis.result.categories.map(cat => {
            const yourScore = safeScore(cat.score);
            const competitorScore = safeScore(cat.competitorScore);
            const scoreDiff = yourScore - competitorScore;

            return {
                name: cat.name,
                icon: cat.icon,
                yourTeaser: cat.status === 'winning'
                    ? `Ahead by ${Math.round(scoreDiff)} points`
                    : cat.status === 'losing'
                        ? `${cat.insights[0] || 'Behind competitor'}`
                        : 'Tied with competitor',
                competitorTeaser: `Score: ${Math.round(competitorScore)}`,
                locked: true, // Teaser mode - full details require payment
            };
        });

        // Use safeScore for the overall scores too
        const overallYourScore = safeScore(analysis.result!.yourScore);
        const overallCompetitorScore = safeScore(analysis.result!.competitorScore);

        return {
            analysisId: analysis.id,
            yourUrl: analysis.url,
            competitorUrl: analysis.competitorUrl,
            yourScore: overallYourScore,
            competitorScore: overallCompetitorScore,
            categories,
            createdAt: analysis.createdAt,
        };
    }

    /**
     * Get full analysis report (for admin preview or purchased reports)
     */
    async getFullReport(analysisId: string, token?: string, isAdmin: boolean = false): Promise<any> {
        // First try in-memory store
        let analysis = this.freeAnalyses.get(analysisId);

        // If not in memory, try database (for ANY user, not just admin)
        if (!analysis) {
            const dbRun = await this.prisma.analysisRun.findUnique({
                where: { id: analysisId },
                include: { lead: true },
            });

            if (dbRun && dbRun.status === 'complete') {
                // Reconstruct categories from JSON
                let categories: any[] = [];
                if (dbRun.categoryScores) {
                    try {
                        const parsedCategories = typeof dbRun.categoryScores === 'string'
                            ? JSON.parse(dbRun.categoryScores)
                            : dbRun.categoryScores;
                        categories = parsedCategories.map((cat: any) => ({
                            name: cat.name,
                            icon: cat.icon || '📊',
                            yourScore: Math.round(cat.score || 0),
                            competitorScore: Math.round(cat.competitorScore || 0),
                            status: cat.status || 'tied',
                            insights: cat.insights || [],
                            recommendations: cat.recommendations || [],
                            subcategories: cat.subcategories || {},
                            details: cat.details || {},
                        }));
                    } catch (e) {
                        console.error('Failed to parse categoryScores:', e);
                    }
                }

                const scoreDiff = (dbRun.yourScore || 0) - (dbRun.competitorScore || 0);
                const isWinning = scoreDiff > 0;

                // Parse intelligenceReport from DB if available
                let intelligenceReport = undefined;
                if ((dbRun as any).intelligenceReport) {
                    try {
                        intelligenceReport = typeof (dbRun as any).intelligenceReport === 'string'
                            ? JSON.parse((dbRun as any).intelligenceReport)
                            : (dbRun as any).intelligenceReport;
                    } catch (e) {
                        console.error('Failed to parse intelligenceReport:', e);
                    }
                }

                // Parse v3Analysis from rawData if available
                let v3Analysis = undefined;
                if (dbRun.rawData) {
                    try {
                        const parsedRawData = typeof dbRun.rawData === 'string'
                            ? JSON.parse(dbRun.rawData)
                            : dbRun.rawData;
                        v3Analysis = parsedRawData?.v3Analysis;
                    } catch (e) {
                        console.error('Failed to parse rawData for v3Analysis:', e);
                    }
                }

                return {
                    analysisId: dbRun.id,
                    yourUrl: dbRun.businessUrl,
                    competitorUrl: dbRun.competitorUrl,
                    yourScore: dbRun.yourScore || 0,
                    competitorScore: dbRun.competitorScore || 0,
                    status: isWinning ? 'winning' : scoreDiff < 0 ? 'losing' : 'tied',
                    categories,
                    aiSummary: isWinning
                        ? `Your site scores ${scoreDiff} points higher than your competitor. Focus on maintaining your lead.`
                        : `Your competitor leads by ${Math.abs(scoreDiff)} points. Follow our recommendations to catch up.`,
                    recommendations: categories
                        .filter(c => c.status === 'losing')
                        .slice(0, 3)
                        .map(c => ({
                            priority: 'high' as const,
                            title: `Improve ${c.name}`,
                            description: c.recommendations[0] || 'Focus on improving this area',
                            impact: `+${c.competitorScore - c.yourScore} potential points`,
                        })),
                    v3Analysis,
                    intelligenceReport,
                    createdAt: dbRun.createdAt,
                };
            }
        }

        if (!analysis) {
            throw new NotFoundException('Analysis not found');
        }

        // For non-admin requests, require token
        if (!isAdmin && analysis.token !== token) {
            throw new NotFoundException('Analysis not found');
        }

        if (analysis.status !== 'complete' || !analysis.result) {
            throw new BadRequestException('Analysis not yet complete');
        }

        // Build full category data with scores, insights, and subcategories
        const categories = analysis.result.categories.map(cat => ({
            name: cat.name,
            icon: cat.icon,
            yourScore: Math.round(cat.score),
            competitorScore: Math.round(cat.competitorScore),
            status: cat.status,
            insights: cat.insights || [],
            recommendations: cat.recommendations || [],
            subcategories: cat.subcategories || {},
            details: cat.details || {},
        }));

        // Generate AI summary and priority recommendations
        const scoreDiff = analysis.result.yourScore - analysis.result.competitorScore;
        const isWinning = scoreDiff > 0;

        const aiSummary = isWinning
            ? `Great news! Your site scores ${Math.round(scoreDiff)} points higher than your competitor. You're excelling in content quality and AEO readiness. Focus on maintaining your lead while addressing the recommendations below.`
            : `Your competitor currently leads by ${Math.round(Math.abs(scoreDiff))} points. The good news is we've identified specific areas where you can catch up and surpass them. Follow the priority recommendations below to close the gap.`;

        // Build priority recommendations from category insights
        const recommendations: { priority: 'high' | 'medium' | 'low'; title: string; description: string; impact: string }[] = [];

        for (const cat of analysis.result.categories) {
            if (cat.status === 'losing' && cat.recommendations?.length > 0) {
                recommendations.push({
                    priority: 'high',
                    title: `Improve ${cat.name}`,
                    description: cat.recommendations[0],
                    impact: `+${Math.round(cat.competitorScore - cat.score)} potential points`,
                });
            } else if (cat.status === 'tied' && cat.recommendations?.length > 0) {
                recommendations.push({
                    priority: 'medium',
                    title: `Enhance ${cat.name}`,
                    description: cat.recommendations[0],
                    impact: 'Break the tie and take the lead',
                });
            }
        }

        return {
            analysisId: analysis.id,
            yourUrl: analysis.url,
            competitorUrl: analysis.competitorUrl,
            yourScore: Math.round(analysis.result.yourScore),
            competitorScore: Math.round(analysis.result.competitorScore),
            status: analysis.result.status,
            categories,
            aiSummary,
            recommendations: recommendations.slice(0, 5), // Top 5 recommendations
            businessProfile: analysis.result.businessProfile,
            performance: (analysis.result as any).performance,
            performanceComparison: analysis.result.performanceComparison,
            // v3.0 Enhanced Analysis - detailed subcategory data for rich visualizations
            v3Analysis: analysis.result.v3Analysis,
            // v3.0 Intelligence Report - the brain-melting analysis
            intelligenceReport: (analysis.result as any).intelligenceReport,
            createdAt: analysis.createdAt,
        };
    }

    /**
     * Plan-based re-audit limits per month
     */
    private readonly PLAN_REAUDIT_LIMITS: Record<string, number> = {
        'STARTER': 1,
        'GROWTH': 2,
        'SCALE': 3,
        'SCALE_PLUS': 5,
    };

    /**
     * Add-on prices by plan type (in cents)
     */
    private readonly ADDON_PRICES: Record<string, number> = {
        'STARTER': 2900,    // $29
        'GROWTH': 2500,     // $25
        'SCALE': 1900,      // $19
        'SCALE_PLUS': 1500, // $15
        'NONE': 2900,       // Non-subscribers pay STARTER price
    };

    /**
     * Check if user can refresh this report
     * Returns user type, credits remaining, and add-on pricing
     */
    async checkRefreshEligibility(analysisId: string, userId?: string): Promise<{
        canRefresh: boolean;
        userType: 'admin' | 'subscriber' | 'one-time';
        creditsRemaining?: number;
        creditsUsed?: number;
        creditsTotal?: number;
        addOnPrice?: number;
        addOnPriceCents?: number;
        planType?: string;
        message?: string;
    }> {
        // Validate the analysis exists
        const dbRun = await this.prisma.analysisRun.findUnique({
            where: { id: analysisId },
            include: { lead: true },
        });

        if (!dbRun) {
            throw new NotFoundException('Analysis not found');
        }

        // If no userId provided, check if the lead has a userId
        const effectiveUserId = userId || dbRun.lead?.userId;

        // If no user at all, this is a one-time purchase scenario
        if (!effectiveUserId) {
            return {
                canRefresh: false,
                userType: 'one-time',
                addOnPrice: 29,
                addOnPriceCents: 2900,
                message: 'Purchase an add-on report or subscribe for refresh access',
            };
        }

        // Get user info with organization and subscription
        const user = await this.prisma.user.findUnique({
            where: { id: effectiveUserId },
            include: {
                organization: {
                    include: {
                        subscriptions: {
                            where: { status: 'ACTIVE' },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!user) {
            return {
                canRefresh: false,
                userType: 'one-time',
                addOnPrice: 29,
                addOnPriceCents: 2900,
                message: 'User not found. Please log in or purchase an add-on report.',
            };
        }

        // Check if user is admin (SUPER_ADMIN, OWNER, or ADMIN roles)
        const adminRoles = ['SUPER_ADMIN', 'OWNER', 'ADMIN'];
        if (adminRoles.includes(user.role)) {
            return {
                canRefresh: true,
                userType: 'admin',
                message: 'Admin access - unlimited refreshes',
            };
        }

        // Check if user has an active subscription
        const activeSubscription = user.organization?.subscriptions?.[0];
        if (activeSubscription) {
            const planType = activeSubscription.plan || 'STARTER';
            const creditsTotal = this.PLAN_REAUDIT_LIMITS[planType] || 1;

            // Count re-audits used this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Count analyses run this month by this lead's user
            const analysesThisMonth = await this.prisma.analysisRun.count({
                where: {
                    lead: { userId: effectiveUserId },
                    createdAt: { gte: startOfMonth },
                },
            });

            const creditsUsed = Math.max(0, analysesThisMonth - 1); // First analysis doesn't count
            const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);

            if (creditsRemaining > 0) {
                return {
                    canRefresh: true,
                    userType: 'subscriber',
                    creditsRemaining,
                    creditsUsed,
                    creditsTotal,
                    planType,
                    message: `${creditsRemaining} refresh credit${creditsRemaining !== 1 ? 's' : ''} remaining this month`,
                };
            } else {
                // Subscriber but out of credits - offer add-on
                const addOnPriceCents = this.ADDON_PRICES[planType] || 2900;
                return {
                    canRefresh: false,
                    userType: 'subscriber',
                    creditsRemaining: 0,
                    creditsUsed,
                    creditsTotal,
                    addOnPrice: addOnPriceCents / 100,
                    addOnPriceCents,
                    planType,
                    message: `You've used all ${creditsTotal} refresh credits this month. Purchase an add-on for $${addOnPriceCents / 100}.`,
                };
            }
        }

        // Non-subscriber (one-time purchase user)
        return {
            canRefresh: false,
            userType: 'one-time',
            addOnPrice: 29,
            addOnPriceCents: 2900,
            message: 'Subscribe for monthly refresh credits, or purchase an add-on report.',
        };
    }

    /**
     * Execute a report refresh (re-run analysis)
     * Admin mode bypasses all checks and executes immediately
     */
    async refreshReport(
        analysisId: string,
        userId?: string,
        paymentToken?: string,
        isAdmin: boolean = false
    ): Promise<{ success: boolean; newAnalysisId?: string; message: string }> {
        // Admin bypass - skip all eligibility checks
        if (!isAdmin) {
            // Check eligibility for non-admin users
            const eligibility = await this.checkRefreshEligibility(analysisId, userId);

            if (!eligibility.canRefresh && !paymentToken) {
                throw new BadRequestException(eligibility.message || 'Not authorized to refresh this report');
            }
        }

        // Get the original analysis to copy parameters
        const originalRun = await this.prisma.analysisRun.findUnique({
            where: { id: analysisId },
            include: { lead: true },
        });

        if (!originalRun) {
            throw new NotFoundException('Original analysis not found');
        }

        // TODO: If payment token provided, process Stripe payment here
        // For now, skip payment processing for add-on purchases

        // Create a new analysis run (refresh = new run with same parameters)
        const newRun = await this.prisma.analysisRun.create({
            data: {
                leadId: originalRun.leadId,
                businessName: originalRun.businessName,
                businessUrl: originalRun.businessUrl,
                competitorUrl: originalRun.competitorUrl,
                competitorName: originalRun.competitorName,
                scope: originalRun.scope,
                status: 'pending',
            },
        });

        // For now, we'll kick off the analysis asynchronously
        // In production, this would queue the job
        this.executeRefreshAnalysis(newRun.id, originalRun.businessUrl, originalRun.competitorUrl);

        return {
            success: true,
            newAnalysisId: newRun.id,
            message: isAdmin
                ? 'Refresh started (admin bypass)'
                : 'Refresh started',
        };
    }

    /**
     * Execute the refresh analysis (async background job)
     */
    private async executeRefreshAnalysis(analysisRunId: string, yourUrl: string, competitorUrl: string): Promise<void> {
        try {
            console.log(`[RefreshAnalysis] Starting refresh for ${analysisRunId}`);

            // Mark as running
            await this.prisma.analysisRun.update({
                where: { id: analysisRunId },
                data: { status: 'running' },
            });

            // Run the full analysis
            const result = await this.analysisEngine.runAnalysis(
                yourUrl,
                competitorUrl,
                analysisRunId,
                () => { } // No progress callback for background jobs
            );

            // Record API costs (realistic estimates based on actual pricing)
            // - Firecrawl: ~$0.01/scrape = 1 cent per page
            // - Anthropic Claude: ~$0.05-0.15/call (depends on tokens)
            // - PageSpeed: Free (Google API)
            // - DataForSEO: ~$0.01/call
            const apiCosts = [
                { service: 'firecrawl', operation: 'scrape_your_site', costCents: 1 },
                { service: 'firecrawl', operation: 'scrape_competitor', costCents: 1 },
                { service: 'anthropic', operation: 'content_analysis', costCents: 10 },
                { service: 'anthropic', operation: 'intelligence_report', costCents: 15 },
                { service: 'anthropic', operation: 'brand_voice', costCents: 8 },
                { service: 'anthropic', operation: 'aeo_readiness', costCents: 5 },
                { service: 'pagespeed', operation: 'performance_your_site', costCents: 0 },
                { service: 'pagespeed', operation: 'performance_competitor', costCents: 0 },
                { service: 'dataforseo', operation: 'seo_your_domain', costCents: 1 },
                { service: 'dataforseo', operation: 'seo_competitor', costCents: 1 },
            ];

            // Create cost records
            await this.prisma.analysisCost.createMany({
                data: apiCosts.map(cost => ({
                    analysisId: analysisRunId,
                    service: cost.service,
                    operation: cost.operation,
                    costCents: cost.costCents,
                })),
            });

            // Calculate total cost
            const totalCostCents = apiCosts.reduce((sum, c) => sum + c.costCents, 0);

            // Store results
            await this.prisma.analysisRun.update({
                where: { id: analysisRunId },
                data: {
                    status: 'complete',
                    yourScore: Math.round(result.yourScore),
                    competitorScore: Math.round(result.competitorScore),
                    categoryScores: JSON.stringify(result.categories),
                    intelligenceReport: result.intelligenceReport ? JSON.stringify(result.intelligenceReport) : undefined,
                    rawData: JSON.stringify({
                        v3Analysis: result.v3Analysis,
                        performanceComparison: result.performanceComparison,
                    }),
                    totalCostCents,
                    completedAt: new Date(),
                },
            });

            console.log(`[RefreshAnalysis] Completed refresh for ${analysisRunId} (cost: $${(totalCostCents / 100).toFixed(2)})`);
        } catch (error) {
            console.error(`[RefreshAnalysis] Failed for ${analysisRunId}:`, error);
            await this.prisma.analysisRun.update({
                where: { id: analysisRunId },
                data: { status: 'failed' },
            });
        }
    }
}
