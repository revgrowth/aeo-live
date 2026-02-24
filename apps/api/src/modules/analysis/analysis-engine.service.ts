import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { FirecrawlService, FirecrawlDocument } from './firecrawl.service';
import { DataForSEOService, KeywordGapResult, BacklinkComparison } from './dataforseo.service';
import { PageSpeedService, PageSpeedResult } from './pagespeed.service';
import { V3AnalysisService, V3Analysis, VoiceAnalysis, CategoryAnalysis, PlatformPresence } from './v3-analysis.service';
import { IntelligenceEngine, FullIntelligenceReport } from './intelligence-engine.service';
import { LLMCitationService, CitationTestResult } from './llm-citation.service';
import { EEATService, EEATSignals } from './eeat.service';
import { CruxService, CruxComparison } from './crux.service';
import { SerpFeatureService, SerpComparison } from './serp-feature.service';
import { ContentGapService, ContentGapComparison } from './content-gap.service';
import { SocialProofService, SocialProofComparison } from './social-proof.service';
import { InternalStructureService, InternalStructureResult, InternalStructureInsight } from './internal-structure.service';
import { OnPageSeoService, OnPageSeoResult, OnPageSeoInsight } from './onpage-seo.service';
import { CATEGORY_WEIGHTS, ScoreCategory } from '@aeo-live/shared';

// ============================================
// TYPES
// ============================================

export interface CategoryScore {
    name: string;
    icon: string;
    score: number; // 0-100
    competitorScore: number;
    status: 'winning' | 'losing' | 'tied';
    insights: string[];
    recommendations: string[];
    details: Record<string, any>;
    subcategories?: Record<string, {
        score: number;
        weight: number;
        evidence: string[];
        issues: string[];
    }>;
}

export interface FullAnalysisResult {
    yourUrl: string;
    competitorUrl: string;
    yourScore: number;
    competitorScore: number;
    status: 'winning' | 'losing' | 'tied';
    categories: CategoryScore[];
    businessProfile: {
        name: string;
        industry: string;
        services: string[];
        location?: string;
    };
    seoMetrics: {
        yourKeywords: number;
        competitorKeywords: number;
        yourBacklinks: number;
        competitorBacklinks: number;
        yourTraffic: number;
        competitorTraffic: number;
    };
    performanceComparison: {
        yourPerformance: number;
        competitorPerformance: number;
        yourLCP: number;
        competitorLCP: number;
    };
    // v3.0 Enhanced Data
    v3Analysis?: {
        your: V3Analysis;
        competitor: V3Analysis;
        yourPerformance?: PageSpeedResult | null;
        competitorPerformance?: PageSpeedResult | null;
        voiceDetails?: VoiceAnalysis;
        platformPresence?: PlatformPresence;
        // Screenshot/OG images and favicons for UX comparison
        yourScreenshot?: string | null;
        competitorScreenshot?: string | null;
        yourFavicon?: string | null;
        competitorFavicon?: string | null;
    };
    // v3.0 INTELLIGENCE REPORT - Brain-melting analysis
    intelligenceReport?: FullIntelligenceReport;
    // v4.0 LLM CITATION TESTING - Real AI citation likelihood
    citationTestResult?: CitationTestResult;
    // v4.1 E-E-A-T ANALYSIS - Experience, Expertise, Authoritativeness, Trustworthiness
    eeatResult?: { you: EEATSignals; competitor: EEATSignals };
    // v4.1 CrUX - Real user performance metrics (not lab data)
    cruxComparison?: CruxComparison;
    // v4.2 KEYWORD GAP - Competitive keyword opportunities
    keywordGap?: KeywordGapResult;
    // v4.3 BACKLINK QUALITY - Domain authority, toxic score, referring domains
    backlinkComparison?: BacklinkComparison;
    // v4.3 SERP FEATURES - Featured snippets, PAA, local pack, AI Overview
    serpComparison?: SerpComparison;
    // v4.4 CONTENT GAPS - Missing topics, depth gaps, format gaps
    contentGap?: ContentGapComparison;
    // v4.4 SOCIAL PROOF - Reviews, social media, trust indicators
    socialProof?: SocialProofComparison;
    analyzedAt: Date;
}

export interface AnalysisProgress {
    stage: 'crawling' | 'analyzing_content' | 'checking_seo' | 'measuring_performance' | 'analyzing_voice' | 'scoring' | 'complete';
    progress: number;
    message: string;
}

// ============================================
// MAIN ENGINE
// ============================================

@Injectable()
export class AnalysisEngine {
    private anthropic: Anthropic | null = null;
    private firecrawl = new FirecrawlService();
    private dataForSEO = new DataForSEOService();
    private pageSpeed = new PageSpeedService();
    private v3Analysis = new V3AnalysisService();
    private intelligence = new IntelligenceEngine();
    private llmCitation = new LLMCitationService();
    private eeat = new EEATService();
    private crux = new CruxService();
    private serpFeature = new SerpFeatureService();
    private contentGap = new ContentGapService();
    private socialProof = new SocialProofService();
    private internalStructure = new InternalStructureService();
    private onPageSeo = new OnPageSeoService();

    private progressCallbacks = new Map<string, (progress: AnalysisProgress) => void>();

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.anthropic = new Anthropic({ apiKey });
            console.log('[AnalysisEngine] Initialized with all services including V3 analysis');
        } else {
            console.warn('[AnalysisEngine] No Claude API key - AI features disabled');
        }
    }

    /**
     * Run full comparative analysis
     */
    async runAnalysis(
        yourUrl: string,
        competitorUrl: string,
        analysisId: string,
        onProgress?: (progress: AnalysisProgress) => void
    ): Promise<FullAnalysisResult> {
        const startTime = Date.now();
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[AnalysisEngine] STARTING ANALYSIS: ${analysisId}`);
        console.log(`[AnalysisEngine] Your URL: ${yourUrl}`);
        console.log(`[AnalysisEngine] Competitor URL: ${competitorUrl}`);
        console.log(`[AnalysisEngine] Services available:`);
        console.log(`  - Firecrawl: ${this.firecrawl.isAvailable() ? 'YES' : 'NO (using fallback)'}`);
        console.log(`  - DataForSEO: ${this.dataForSEO.isAvailable() ? 'YES' : 'NO'}`);
        console.log(`  - PageSpeed: ${this.pageSpeed.isAvailable() ? 'YES' : 'NO'}`);
        console.log(`  - Claude AI: ${this.anthropic ? 'YES' : 'NO (using fallback)'}`);
        console.log(`${'='.repeat(60)}\n`);

        if (onProgress) {
            this.progressCallbacks.set(analysisId, onProgress);
        }

        try {
            // Stage 1: Crawl both sites (0-30%)
            console.log(`[AnalysisEngine] STAGE 1: Crawling websites...`);
            this.updateProgress(analysisId, 'crawling', 5, 'Crawling your website...');

            const yourScrapeStart = Date.now();
            const yourScrape = await this.firecrawl.scrape(yourUrl);
            console.log(`[AnalysisEngine] Your site crawl: ${yourScrape.success ? 'SUCCESS' : 'FAILED'} (${Date.now() - yourScrapeStart}ms)`);
            if (!yourScrape.success) {
                console.error(`[AnalysisEngine] Your site error: ${yourScrape.error}`);
            } else {
                console.log(`[AnalysisEngine] Your site title: ${yourScrape.data?.metadata?.title || 'No title'}`);
                console.log(`[AnalysisEngine] Your site content length: ${yourScrape.data?.markdown?.length || 0} chars`);
            }

            this.updateProgress(analysisId, 'crawling', 20, 'Crawling competitor website...');

            const compScrapeStart = Date.now();
            const competitorScrape = await this.firecrawl.scrape(competitorUrl);
            console.log(`[AnalysisEngine] Competitor crawl: ${competitorScrape.success ? 'SUCCESS' : 'FAILED'} (${Date.now() - compScrapeStart}ms)`);
            if (!competitorScrape.success) {
                console.error(`[AnalysisEngine] Competitor error: ${competitorScrape.error}`);
            } else {
                console.log(`[AnalysisEngine] Competitor title: ${competitorScrape.data?.metadata?.title || 'No title'}`);
                console.log(`[AnalysisEngine] Competitor content length: ${competitorScrape.data?.markdown?.length || 0} chars`);
            }

            if (!yourScrape.success || !competitorScrape.success) {
                const errorMsg = `Crawl failed - Your site: ${yourScrape.success ? 'OK' : yourScrape.error}, Competitor: ${competitorScrape.success ? 'OK' : competitorScrape.error}`;
                console.error(`[AnalysisEngine] ${errorMsg}`);
                throw new Error(errorMsg);
            }

            // Stage 2: Analyze content with Claude (30-50%)
            console.log(`\n[AnalysisEngine] STAGE 2: Content Analysis...`);
            this.updateProgress(analysisId, 'analyzing_content', 35, 'Analyzing content quality...');

            const contentStart = Date.now();
            const contentAnalysis = await this.analyzeContentWithClaude(
                yourScrape.data!,
                competitorScrape.data!
            );
            console.log(`[AnalysisEngine] Content analysis complete (${Date.now() - contentStart}ms)`);
            console.log(`[AnalysisEngine] Business detected: ${contentAnalysis.businessProfile.name} (${contentAnalysis.businessProfile.industry})`);

            // Stage 3: Get SEO metrics (50-70%)
            console.log(`\n[AnalysisEngine] STAGE 3: SEO Metrics...`);
            this.updateProgress(analysisId, 'checking_seo', 55, 'Checking SEO metrics...');
            const yourDomain = new URL(yourUrl).hostname;
            const competitorDomain = new URL(competitorUrl).hostname;
            console.log(`[AnalysisEngine] Fetching SEO for: ${yourDomain} vs ${competitorDomain}`);

            const seoStart = Date.now();
            const [yourSEO, competitorSEO] = await Promise.all([
                this.dataForSEO.getDomainInfo(yourDomain),
                this.dataForSEO.getDomainInfo(competitorDomain),
            ]);
            console.log(`[AnalysisEngine] SEO metrics complete (${Date.now() - seoStart}ms)`);
            console.log(`[AnalysisEngine] Your SEO: ${yourSEO ? `${yourSEO.organicKeywords} keywords, ${yourSEO.backlinks} backlinks` : 'No data'}`);
            console.log(`[AnalysisEngine] Competitor SEO: ${competitorSEO ? `${competitorSEO.organicKeywords} keywords, ${competitorSEO.backlinks} backlinks` : 'No data'}`);

            // Stage 4: Performance analysis (70-85%)
            console.log(`\n[AnalysisEngine] STAGE 4: Performance Analysis...`);
            this.updateProgress(analysisId, 'measuring_performance', 75, 'Measuring performance...');

            const perfStart = Date.now();
            const perfComparison = await this.pageSpeed.compare(yourUrl, competitorUrl);
            console.log(`[AnalysisEngine] Performance analysis complete (${Date.now() - perfStart}ms)`);
            console.log(`[AnalysisEngine] Your performance: ${perfComparison.url1?.scores.performance || 'N/A'}`);
            console.log(`[AnalysisEngine] Competitor performance: ${perfComparison.url2?.scores.performance || 'N/A'}`);

            // Stage 5: Brand Voice Analysis (85-90%)
            console.log(`\n[AnalysisEngine] STAGE 5: Brand Voice Analysis...`);
            this.updateProgress(analysisId, 'analyzing_voice', 85, 'Analyzing brand voice...');

            // V3 Brand Voice Analysis (uses yourDomain/competitorDomain from earlier)
            const voiceStart = Date.now();
            const [yourVoice, competitorVoice] = await Promise.all([
                this.v3Analysis.analyzeBrandVoice(
                    [yourScrape.data!.markdown || ''],
                    [competitorScrape.data!.markdown || '']
                ),
                this.v3Analysis.analyzeBrandVoice(
                    [competitorScrape.data!.markdown || ''],
                    [yourScrape.data!.markdown || '']
                ),
            ]);
            console.log(`[AnalysisEngine] Brand voice analysis complete (${Date.now() - voiceStart}ms)`);

            // V3 AEO Readiness with Platform Presence
            const [yourAeo, competitorAeo] = await Promise.all([
                this.v3Analysis.analyzeAeoReadiness(
                    yourScrape.data!.metadata,
                    yourScrape.data!.markdown || '',
                    yourDomain,
                    { keywordCount: yourSEO?.organicKeywords || 0, rawHtml: yourScrape.data!.html || '' },
                ),
                this.v3Analysis.analyzeAeoReadiness(
                    competitorScrape.data!.metadata,
                    competitorScrape.data!.markdown || '',
                    competitorDomain,
                    { keywordCount: competitorSEO?.organicKeywords || 0, rawHtml: competitorScrape.data!.html || '' },
                ),
            ]);

            // Stage 5.05: Internal Structure + On-Page SEO (real crawl-based analysis)
            console.log(`\n[AnalysisEngine] STAGE 5.05: Internal Structure + On-Page SEO...`);
            this.updateProgress(analysisId, 'checking_seo', 87, 'Crawling site structure and on-page elements...');

            const structSeoStart = Date.now();
            let yourInternalStructure: InternalStructureResult | undefined;
            let competitorInternalStructure: InternalStructureResult | undefined;
            let yourOnPageSeo: OnPageSeoResult | undefined;
            let competitorOnPageSeo: OnPageSeoResult | undefined;
            let internalStructureInsights: InternalStructureInsight[] = [];
            let onPageSeoInsights: OnPageSeoInsight[] = [];

            try {
                [yourInternalStructure, competitorInternalStructure, yourOnPageSeo, competitorOnPageSeo] = await Promise.all([
                    this.internalStructure.analyze(yourUrl),
                    this.internalStructure.analyze(competitorUrl),
                    this.onPageSeo.analyze(yourUrl),
                    this.onPageSeo.analyze(competitorUrl),
                ]);

                internalStructureInsights = this.internalStructure.generateInsights(
                    yourInternalStructure.data, competitorInternalStructure.data,
                );
                onPageSeoInsights = this.onPageSeo.generateInsights(
                    yourOnPageSeo.data, competitorOnPageSeo.data,
                );

                console.log(`[AnalysisEngine] Internal Structure: You ${yourInternalStructure.overall} vs Competitor ${competitorInternalStructure.overall}`);
                console.log(`[AnalysisEngine] On-Page SEO: You ${yourOnPageSeo.overall} vs Competitor ${competitorOnPageSeo.overall}`);
                console.log(`[AnalysisEngine] Structure + On-Page complete (${Date.now() - structSeoStart}ms)`);
            } catch (structError) {
                console.error(`[AnalysisEngine] Internal Structure / On-Page SEO failed:`, structError);
                // Continue without â€” the buildCategoryScores fallback will still produce scores
            }

            // Stage 5.5: Generate Intelligence Report (Brain-melting analysis!)
            console.log(`\n[AnalysisEngine] STAGE 5.5: Generating Intelligence Report...`);
            this.updateProgress(analysisId, 'analyzing_voice', 89, 'Generating competitive intelligence report...');

            const intelligenceStart = Date.now();
            let intelligenceReport: FullIntelligenceReport | undefined;
            try {
                intelligenceReport = await this.intelligence.generateFullIntelligence(
                    yourUrl,
                    competitorUrl,
                    {
                        html: yourScrape.data!.html || '',
                        markdown: yourScrape.data!.markdown || '',
                        metadata: yourScrape.data!.metadata || {},
                    },
                    {
                        html: competitorScrape.data!.html || '',
                        markdown: competitorScrape.data!.markdown || '',
                        metadata: competitorScrape.data!.metadata || {},
                    },
                    {
                        yourSeoMetrics: yourSEO,
                        competitorSeoMetrics: competitorSEO,
                        yourPerformance: perfComparison.url1,
                        competitorPerformance: perfComparison.url2,
                    }
                );
                console.log(`[AnalysisEngine] Intelligence report generated (${Date.now() - intelligenceStart}ms)`);
                console.log(`[AnalysisEngine] AI Verdict: ${intelligenceReport.aiVerdict.headline}`);
            } catch (intelligenceError) {
                console.error(`[AnalysisEngine] Intelligence report generation failed:`, intelligenceError);
                // Continue without intelligence report - it's optional enhancement
            }

            // Stage 5.6: LLM Citation Testing (REAL AI citability testing!)
            console.log(`\n[AnalysisEngine] STAGE 5.6: Running LLM Citation Tests...`);
            this.updateProgress(analysisId, 'analyzing_voice', 91, 'Testing AI citation likelihood...');

            let citationTestResult: CitationTestResult | undefined;
            try {
                citationTestResult = await this.llmCitation.runFullCitationTest(
                    yourDomain,
                    competitorDomain,
                    yourScrape.data!.markdown || '',
                    competitorScrape.data!.markdown || '',
                    {
                        name: contentAnalysis.businessProfile.name,
                        industry: contentAnalysis.businessProfile.industry,
                        services: contentAnalysis.businessProfile.services,
                        location: contentAnalysis.businessProfile.location,
                    }
                );
                console.log(`[AnalysisEngine] Citation test complete: Your citability ${citationTestResult.citabilityScore}, Competitor ${citationTestResult.competitorCitabilityScore}`);
            } catch (citationError) {
                console.error(`[AnalysisEngine] Citation testing failed:`, citationError);
                // Continue without citation data - it's an enhancement
            }

            // Stage 5.7: E-E-A-T Signal Detection
            console.log(`\n[AnalysisEngine] STAGE 5.7: Analyzing E-E-A-T Signals...`);
            this.updateProgress(analysisId, 'analyzing_voice', 93, 'Detecting experience & expertise signals...');

            let eeatResult: { you: EEATSignals; competitor: EEATSignals } | undefined;
            try {
                eeatResult = await this.eeat.compareEEAT(
                    {
                        content: yourScrape.data!.markdown || '',
                        html: yourScrape.data!.html || '',
                        url: yourUrl,
                    },
                    {
                        content: competitorScrape.data!.markdown || '',
                        html: competitorScrape.data!.html || '',
                        url: competitorUrl,
                    }
                );
                console.log(`[AnalysisEngine] E-E-A-T complete: Your score ${eeatResult.you.overallScore}, Competitor ${eeatResult.competitor.overallScore}`);
            } catch (eeatError) {
                console.error(`[AnalysisEngine] E-E-A-T analysis failed:`, eeatError);
            }

            // Stage 5.8: CrUX Real User Metrics (FREE - uses same key as PageSpeed)
            console.log(`\n[AnalysisEngine] STAGE 5.8: Fetching Real User Metrics (CrUX)...`);
            this.updateProgress(analysisId, 'measuring_performance', 95, 'Getting real user experience data...');

            let cruxComparison: CruxComparison | undefined;
            try {
                cruxComparison = await this.crux.compare(yourUrl, competitorUrl);
                console.log(`[AnalysisEngine] CrUX complete: Winner is ${cruxComparison.winner}`);
            } catch (cruxError) {
                console.error(`[AnalysisEngine] CrUX fetch failed:`, cruxError);
            }

            // Stage 5.9: Keyword Gap Analysis (competitive keyword opportunities)
            console.log(`\n[AnalysisEngine] STAGE 5.9: Analyzing Keyword Gap...`);
            this.updateProgress(analysisId, 'checking_seo', 97, 'Finding keyword opportunities...');

            let keywordGap: KeywordGapResult | undefined;
            try {
                const keywordGapResult = await this.dataForSEO.getKeywordGap(yourDomain, competitorDomain, 30);
                if (keywordGapResult) {
                    keywordGap = keywordGapResult;
                    console.log(`[AnalysisEngine] Keyword gap complete: ${keywordGap.keywordsYouAreMissing.length} missing, ${keywordGap.topOpportunities.length} opportunities`);
                }
            } catch (keywordError) {
                console.error(`[AnalysisEngine] Keyword gap failed:`, keywordError);
            }

            // Stage 5.10: Backlink Quality Comparison
            console.log(`\n[AnalysisEngine] STAGE 5.10: Comparing Backlink Profiles...`);
            this.updateProgress(analysisId, 'checking_seo', 98, 'Analyzing backlink quality...');

            let backlinkComparison: BacklinkComparison | undefined;
            try {
                backlinkComparison = await this.dataForSEO.compareBacklinks(yourDomain, competitorDomain);
                console.log(`[AnalysisEngine] Backlink comparison complete: Winner is ${backlinkComparison.winner}`);
            } catch (backlinkError) {
                console.error(`[AnalysisEngine] Backlink comparison failed:`, backlinkError);
            }

            // Stage 5.11: SERP Feature Detection
            console.log(`\n[AnalysisEngine] STAGE 5.11: Detecting SERP Features...`);
            this.updateProgress(analysisId, 'checking_seo', 99, 'Checking featured snippets & rich results...');

            let serpComparison: SerpComparison | undefined;
            try {
                // Use shared keywords from keyword gap if available
                const sharedKeywords = keywordGap?.sharedKeywords?.map(k => k.keyword).slice(0, 5);
                serpComparison = await this.serpFeature.compare(yourDomain, competitorDomain, sharedKeywords);
                console.log(`[AnalysisEngine] SERP features complete: Winner is ${serpComparison.winner}, ${serpComparison.featureGaps.length} gaps`);
            } catch (serpError) {
                console.error(`[AnalysisEngine] SERP feature detection failed:`, serpError);
            }

            // Stage 5.12: Content Gap Analysis
            console.log(`\n[AnalysisEngine] STAGE 5.12: Analyzing Content Gaps...`);
            this.updateProgress(analysisId, 'analyzing_content', 100, 'Identifying content gaps...');

            let contentGapResult: ContentGapComparison | undefined;
            try {
                const yourContent = yourScrape.data?.markdown || '';
                const competitorContent = competitorScrape.data?.markdown || '';
                contentGapResult = await this.contentGap.analyzeContentGaps(
                    yourContent,
                    competitorContent,
                    yourDomain,
                    competitorDomain
                );
                console.log(`[AnalysisEngine] Content gap complete: ${contentGapResult.result.topicsMissing.length} missing topics, gap score ${contentGapResult.result.gapScore}`);
            } catch (contentError) {
                console.error(`[AnalysisEngine] Content gap analysis failed:`, contentError);
            }

            // Stage 5.13: Social Proof Analysis
            console.log(`\n[AnalysisEngine] STAGE 5.13: Analyzing Social Proof...`);
            this.updateProgress(analysisId, 'analyzing_content', 101, 'Measuring social proof signals...');

            let socialProofResult: SocialProofComparison | undefined;
            try {
                const yourContent = yourScrape.data?.markdown || '';
                const yourHtml = yourScrape.data?.html || '';
                const competitorContent = competitorScrape.data?.markdown || '';
                const competitorHtml = competitorScrape.data?.html || '';

                socialProofResult = await this.socialProof.compare(
                    yourDomain, yourContent, yourHtml,
                    competitorDomain, competitorContent, competitorHtml
                );
                console.log(`[AnalysisEngine] Social proof complete: Winner is ${socialProofResult.winner}`);
            } catch (socialError) {
                console.error(`[AnalysisEngine] Social proof analysis failed:`, socialError);
            }

            // Stage 6: Calculate Final Scores (90-100%)
            console.log(`\n[AnalysisEngine] STAGE 6: Calculating Final Scores with v3.0 Weights...`);
            this.updateProgress(analysisId, 'scoring', 92, 'Calculating weighted scores...');

            // Pre-compute v3 analysis results so we can use them in overrides
            const yourSeoElements = yourScrape.data ? this.firecrawl.extractSEOElements(yourScrape.data) : undefined;
            const competitorSeoElements = competitorScrape.data ? this.firecrawl.extractSEOElements(competitorScrape.data) : undefined;

            const yourTechSeo = this.v3Analysis.analyzeTechnicalSeo(
                perfComparison.url1, yourScrape.data, yourSeoElements,
            );
            const competitorTechSeo = this.v3Analysis.analyzeTechnicalSeo(
                perfComparison.url2, competitorScrape.data, competitorSeoElements,
            );

            const yourTopicalAuthority = await this.v3Analysis.analyzeTopicalAuthority(
                yourScrape.data!.markdown || '', yourUrl,
                yourSeoElements || { headings: { h1: [], h2: [], h3: [] }, links: { internal: 0, external: 0 }, wordCount: 0, hasSchema: false },
                competitorScrape.data?.markdown || '', competitorSeoElements,
            );
            const competitorTopicalAuthority = await this.v3Analysis.analyzeTopicalAuthority(
                competitorScrape.data!.markdown || '', competitorUrl,
                competitorSeoElements || { headings: { h1: [], h2: [], h3: [] }, links: { internal: 0, external: 0 }, wordCount: 0, hasSchema: false },
                yourScrape.data?.markdown || '', yourSeoElements,
            );

            const yourOnpageSeo = this.v3Analysis.analyzeOnPageSeo(yourScrape.data!.metadata, yourSeoElements);
            const competitorOnpageSeo = this.v3Analysis.analyzeOnPageSeo(competitorScrape.data!.metadata, competitorSeoElements);

            const yourUxEngagement = this.v3Analysis.analyzeUxEngagement(yourScrape.data!.html || '', yourScrape.data!.metadata);
            const competitorUxEngagement = this.v3Analysis.analyzeUxEngagement(competitorScrape.data!.html || '', competitorScrape.data!.metadata);

            console.log(`[AnalysisEngine] V3 pre-compute: TechSEO ${yourTechSeo.score}/${competitorTechSeo.score}, Topical ${yourTopicalAuthority.score}/${competitorTopicalAuthority.score}, UX ${yourUxEngagement.score}/${competitorUxEngagement.score}`);

            // Build category scores with V3 enhanced data
            const categories = this.buildCategoryScores(
                yourScrape.data!,
                competitorScrape.data!,
                contentAnalysis,
                yourSEO,
                competitorSEO,
                perfComparison.url1,
                perfComparison.url2
            );

            // Override with V3 analysis data for enhanced categories
            const brandVoiceCategory = categories.find(c => c.name === 'Brand Voice');
            if (brandVoiceCategory) {
                brandVoiceCategory.score = yourVoice.score;
                brandVoiceCategory.competitorScore = competitorVoice.score;
                brandVoiceCategory.subcategories = yourVoice.subcategories;
                brandVoiceCategory.insights = yourVoice.insights;
                brandVoiceCategory.recommendations = yourVoice.recommendations;
                brandVoiceCategory.details = {
                    ...brandVoiceCategory.details,
                    personality: yourVoice.voiceDetails.personality,
                    distinctiveness: yourVoice.voiceDetails.distinctiveness,
                };
            }

            const aeoCategory = categories.find(c => c.name === 'AEO Readiness');
            if (aeoCategory) {
                aeoCategory.score = yourAeo.score;
                aeoCategory.competitorScore = competitorAeo.score;
                aeoCategory.subcategories = yourAeo.subcategories;
                aeoCategory.insights = yourAeo.insights;
                aeoCategory.recommendations = yourAeo.recommendations;
                aeoCategory.details = {
                    ...aeoCategory.details,
                    platformPresence: yourAeo.platformPresence,
                    citationTest: citationTestResult ? {
                        yourCitabilityScore: citationTestResult.citabilityScore,
                        competitorCitabilityScore: citationTestResult.competitorCitabilityScore,
                        factDensity: citationTestResult.factDensityScore,
                        definitiveStatements: citationTestResult.definitiveStatementsScore,
                        uniqueInsights: citationTestResult.uniqueInsightsScore,
                        verdict: citationTestResult.citabilityVerdict,
                    } : undefined,
                };
            }

            // Override Internal Structure with real crawl-based analysis
            const internalStructureCategory = categories.find(c => c.name === 'Internal Structure');
            if (internalStructureCategory && yourInternalStructure && competitorInternalStructure) {
                internalStructureCategory.score = yourInternalStructure.overall;
                internalStructureCategory.competitorScore = competitorInternalStructure.overall;
                internalStructureCategory.status = yourInternalStructure.overall > competitorInternalStructure.overall
                    ? 'winning' : yourInternalStructure.overall < competitorInternalStructure.overall
                        ? 'losing' : 'tied';
                internalStructureCategory.insights = internalStructureInsights
                    .map(i => `${i.severity === 'critical' ? 'ðŸ”´' : i.severity === 'high' ? 'ðŸŸ¡' : 'ðŸ”µ'} ${i.title}`);
                internalStructureCategory.recommendations = internalStructureInsights
                    .map(i => `${i.action} (${i.impact})`);
                internalStructureCategory.details = {
                    ...internalStructureCategory.details,
                    yourPillars: yourInternalStructure.pillars,
                    competitorPillars: competitorInternalStructure.pillars,
                    yourData: yourInternalStructure.data,
                    competitorData: competitorInternalStructure.data,
                    insights: internalStructureInsights,
                };
            }

            // Override On-Page SEO with real page-level analysis
            const onPageSeoCategory = categories.find(c => c.name === 'On-Page SEO');
            if (onPageSeoCategory && yourOnPageSeo && competitorOnPageSeo) {
                onPageSeoCategory.score = yourOnPageSeo.overall;
                onPageSeoCategory.competitorScore = competitorOnPageSeo.overall;
                onPageSeoCategory.status = yourOnPageSeo.overall > competitorOnPageSeo.overall
                    ? 'winning' : yourOnPageSeo.overall < competitorOnPageSeo.overall
                        ? 'losing' : 'tied';
                onPageSeoCategory.insights = onPageSeoInsights
                    .map(i => `${i.severity === 'critical' ? 'ðŸ”´' : i.severity === 'high' ? 'ðŸŸ¡' : 'ðŸ”µ'} ${i.title}`);
                onPageSeoCategory.recommendations = onPageSeoInsights
                    .map(i => `${i.action} (${i.impact})`);
                onPageSeoCategory.details = {
                    ...onPageSeoCategory.details,
                    yourPillars: yourOnPageSeo.pillars,
                    competitorPillars: competitorOnPageSeo.pillars,
                    yourData: yourOnPageSeo.data,
                    competitorData: competitorOnPageSeo.data,
                    insights: onPageSeoInsights,
                };
            }

            // Override Technical SEO with real v3 Lighthouse-based analysis
            const techCategory = categories.find(c => c.name === 'Technical SEO');
            if (techCategory) {
                techCategory.score = yourTechSeo.score;
                techCategory.competitorScore = competitorTechSeo.score;
                techCategory.status = yourTechSeo.score > competitorTechSeo.score
                    ? 'winning' : yourTechSeo.score < competitorTechSeo.score
                        ? 'losing' : 'tied';
                techCategory.subcategories = yourTechSeo.subcategories;
                techCategory.insights = yourTechSeo.insights;
                techCategory.recommendations = yourTechSeo.recommendations;
            }

            // Override Topical Authority with v3 deep Claude analysis
            const topicalCategory = categories.find(c => c.name === 'Topical Authority');
            if (topicalCategory) {
                topicalCategory.score = yourTopicalAuthority.score;
                topicalCategory.competitorScore = competitorTopicalAuthority.score;
                topicalCategory.status = yourTopicalAuthority.score > competitorTopicalAuthority.score
                    ? 'winning' : yourTopicalAuthority.score < competitorTopicalAuthority.score
                        ? 'losing' : 'tied';
                topicalCategory.subcategories = yourTopicalAuthority.subcategories;
                topicalCategory.insights = yourTopicalAuthority.insights;
                topicalCategory.recommendations = yourTopicalAuthority.recommendations;
                topicalCategory.details = {
                    ...topicalCategory.details,
                    entityAnalysis: (yourTopicalAuthority as any).entityAnalysis,
                    topicAnalysis: (yourTopicalAuthority as any).topicAnalysis,
                    authorityLevel: (yourTopicalAuthority as any).authorityLevel,
                };
            }

            // Override UX & Engagement with v3 HTML-based analysis
            const uxCategory = categories.find(c => c.name === 'UX & Engagement');
            if (uxCategory) {
                uxCategory.score = yourUxEngagement.score;
                uxCategory.competitorScore = competitorUxEngagement.score;
                uxCategory.status = yourUxEngagement.score > competitorUxEngagement.score
                    ? 'winning' : yourUxEngagement.score < competitorUxEngagement.score
                        ? 'losing' : 'tied';
                uxCategory.subcategories = yourUxEngagement.subcategories;
                uxCategory.insights = yourUxEngagement.insights;
                uxCategory.recommendations = yourUxEngagement.recommendations;
            }


            // Calculate WEIGHTED overall scores using v3.0 category weights
            const categoryWeightMap: Record<string, number> = {
                'Technical SEO': 0.12,
                'On-Page SEO': 0.12,
                'Topical Authority': 0.36,  // Merged Content Quality (0.22) + Internal Structure (0.14)
                'AEO Readiness': 0.18,
                'Brand Voice': 0.12,
                'UX & Engagement': 0.10,
            };

            // Helper to safely get a numeric score (handles NaN, undefined, null)
            const safeScore = (score: number | undefined | null): number => {
                if (score === undefined || score === null || Number.isNaN(score)) {
                    return 0;
                }
                return score;
            };

            let yourWeightedSum = 0;
            let competitorWeightedSum = 0;
            for (const cat of categories) {
                const weight = categoryWeightMap[cat.name] || (1 / categories.length);
                yourWeightedSum += safeScore(cat.score) * weight;
                competitorWeightedSum += safeScore(cat.competitorScore) * weight;
            }

            const yourScore = Math.round(safeScore(yourWeightedSum));
            const competitorScore = Math.round(safeScore(competitorWeightedSum));


            this.updateProgress(analysisId, 'complete', 100, 'Analysis complete!');

            const totalTime = Date.now() - startTime;
            console.log(`\n${'='.repeat(60)}`);
            console.log(`[AnalysisEngine] ANALYSIS COMPLETE: ${analysisId}`);
            console.log(`[AnalysisEngine] Total time: ${(totalTime / 1000).toFixed(1)}s`);
            console.log(`[AnalysisEngine] Final scores (WEIGHTED): You ${yourScore} vs Competitor ${competitorScore}`);
            console.log(`[AnalysisEngine] Status: ${yourScore > competitorScore ? 'WINNING' : yourScore < competitorScore ? 'LOSING' : 'TIED'}`);
            console.log(`${'='.repeat(60)}\n`);

            return {
                yourUrl,
                competitorUrl,
                yourScore,
                competitorScore,
                status: yourScore > competitorScore ? 'winning' : yourScore < competitorScore ? 'losing' : 'tied',
                categories,
                businessProfile: contentAnalysis.businessProfile,
                seoMetrics: {
                    yourKeywords: yourSEO?.organicKeywords || 0,
                    competitorKeywords: competitorSEO?.organicKeywords || 0,
                    yourBacklinks: yourSEO?.backlinks || 0,
                    competitorBacklinks: competitorSEO?.backlinks || 0,
                    yourTraffic: yourSEO?.organicTraffic || 0,
                    competitorTraffic: competitorSEO?.organicTraffic || 0,
                },
                performanceComparison: {
                    yourPerformance: perfComparison.url1?.scores.performance || 0,
                    competitorPerformance: perfComparison.url2?.scores.performance || 0,
                    yourLCP: perfComparison.url1?.metrics.lcp || 0,
                    competitorLCP: perfComparison.url2?.metrics.lcp || 0,
                },
                v3Analysis: {
                    your: {
                        technicalSeo: yourTechSeo,
                        onpageSeo: yourOnpageSeo,
                        topicalAuthority: yourTopicalAuthority,
                        aeoReadiness: yourAeo,
                        brandVoice: yourVoice,
                        uxEngagement: yourUxEngagement,
                        primaryScore: yourScore,
                    },
                    competitor: {
                        technicalSeo: competitorTechSeo,
                        onpageSeo: competitorOnpageSeo,
                        topicalAuthority: competitorTopicalAuthority,
                        aeoReadiness: competitorAeo,
                        brandVoice: competitorVoice,
                        uxEngagement: competitorUxEngagement,
                        primaryScore: competitorScore,
                    },
                    // Raw PageSpeed data for rich frontend visualizations
                    yourPerformance: perfComparison.url1,
                    competitorPerformance: perfComparison.url2,
                    voiceDetails: yourVoice.voiceDetails,
                    platformPresence: yourAeo.platformPresence,
                    // Screenshot/OG images and favicons for UX comparison
                    yourScreenshot: yourScrape.data?.metadata?.ogImage || null,
                    competitorScreenshot: competitorScrape.data?.metadata?.ogImage || null,
                    yourFavicon: yourScrape.data?.metadata?.favicon || null,
                    competitorFavicon: competitorScrape.data?.metadata?.favicon || null,
                },
                // v3.0 INTELLIGENCE REPORT - The brain-melting competitive analysis
                intelligenceReport,
                // v4.0 LLM CITATION TESTING - Real AI citation likelihood testing
                citationTestResult,
                // v4.1 E-E-A-T ANALYSIS - Trust signals from Google's ranking factors
                eeatResult,
                // v4.1 CrUX - Real user performance data (not lab benchmarks)
                cruxComparison,
                // v4.2 KEYWORD GAP - Competitive keyword opportunities
                keywordGap,
                // v4.3 BACKLINK QUALITY - Domain authority, toxic score, referring domains
                backlinkComparison,
                // v4.3 SERP FEATURES - Featured snippets, PAA, local pack, AI Overview
                serpComparison,
                // v4.4 CONTENT GAPS - Missing topics, depth gaps, format gaps
                contentGap: contentGapResult,
                // v4.4 SOCIAL PROOF - Reviews, social media, trust indicators
                socialProof: socialProofResult,
                analyzedAt: new Date(),
            };

        } catch (error) {
            const totalTime = Date.now() - startTime;
            console.error(`\n${'!'.repeat(60)}`);
            console.error(`[AnalysisEngine] ANALYSIS FAILED: ${analysisId}`);
            console.error(`[AnalysisEngine] Time elapsed: ${(totalTime / 1000).toFixed(1)}s`);
            console.error(`[AnalysisEngine] Error:`, error);
            console.error(`[AnalysisEngine] Stack:`, error instanceof Error ? error.stack : 'No stack');
            console.error(`${'!'.repeat(60)}\n`);
            throw error;
        } finally {
            this.progressCallbacks.delete(analysisId);
        }
    }

    /**
     * Analyze content with Claude
     */
    private async analyzeContentWithClaude(
        yourDoc: FirecrawlDocument,
        competitorDoc: FirecrawlDocument
    ): Promise<{
        businessProfile: { name: string; industry: string; services: string[]; location?: string };
        yourContent: ContentAnalysis;
        competitorContent: ContentAnalysis;
    }> {
        if (!this.anthropic) {
            return this.fallbackContentAnalysis(yourDoc, competitorDoc);
        }

        try {
            const yourContent = yourDoc.markdown.substring(0, 8000);
            const competitorContent = competitorDoc.markdown.substring(0, 8000);

            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: `You are an expert SEO and AEO (Answer Engine Optimization) analyst. Analyze these two websites and compare them.

=== YOUR SITE ===
URL: ${yourDoc.url}
Title: ${yourDoc.metadata.title || 'Unknown'}
Content:
${yourContent}

=== COMPETITOR SITE ===
URL: ${competitorDoc.url}
Title: ${competitorDoc.metadata.title || 'Unknown'}
Content:
${competitorContent}

Analyze both sites and return ONLY valid JSON with this structure:
{
    "businessProfile": {
        "name": "Business name from YOUR SITE",
        "industry": "Industry category",
        "services": ["Service 1", "Service 2"],
        "location": "City, State or null"
    },
    "yourSite": {
        "contentQuality": {
            "score": 0-100,
            "strengths": ["strength 1", "strength 2"],
            "weaknesses": ["weakness 1"]
        },
        "aeoReadiness": {
            "score": 0-100,
            "hasStructuredAnswers": true/false,
            "hasFAQContent": true/false,
            "hasSchemaReadyContent": true/false,
            "insights": ["insight 1"]
        },
        "brandVoice": {
            "score": 0-100,
            "tone": "professional/casual/authoritative/etc",
            "uniqueness": 0-100,
            "consistency": 0-100
        },
        "technicalSEO": {
            "score": 0-100,
            "hasProperHeadings": true/false,
            "hasMeta": true/false,
            "issues": ["issue 1"]
        }
    },
    "competitorSite": {
        "contentQuality": { "score": 0-100, "strengths": [], "weaknesses": [] },
        "aeoReadiness": { "score": 0-100, "hasStructuredAnswers": false, "hasFAQContent": false, "hasSchemaReadyContent": false, "insights": [] },
        "brandVoice": { "score": 0-100, "tone": "", "uniqueness": 0, "consistency": 0 },
        "technicalSEO": { "score": 0-100, "hasProperHeadings": false, "hasMeta": false, "issues": [] }
    },
    "comparison": {
        "overallWinner": "your_site" or "competitor_site",
        "keyDifferentiators": ["differentiator 1", "differentiator 2"],
        "biggestOpportunity": "The biggest thing YOUR SITE should do to improve"
    }
}`
                }]
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                throw new Error('No JSON in response');
            }

            const analysis = JSON.parse(jsonMatch[0]);

            return {
                businessProfile: analysis.businessProfile,
                yourContent: analysis.yourSite,
                competitorContent: analysis.competitorSite,
            };

        } catch (error) {
            console.error('[AnalysisEngine] Claude analysis failed:', error);
            return this.fallbackContentAnalysis(yourDoc, competitorDoc);
        }
    }

    /**
     * Build category scores from all data sources
     */
    private buildCategoryScores(
        yourDoc: FirecrawlDocument,
        competitorDoc: FirecrawlDocument,
        contentAnalysis: {
            yourContent: ContentAnalysis;
            competitorContent: ContentAnalysis;
            businessProfile: any;
        },
        yourSEO: any,
        competitorSEO: any,
        yourPerf: PageSpeedResult | null,
        competitorPerf: PageSpeedResult | null
    ): CategoryScore[] {
        const categories: CategoryScore[] = [];

        // 1. Technical SEO
        const techScore = contentAnalysis.yourContent.technicalSEO?.score || 50;
        const compTechScore = contentAnalysis.competitorContent.technicalSEO?.score || 50;
        const yourMeta = yourDoc.metadata || {};
        const compMeta = competitorDoc.metadata || {};
        categories.push({
            name: 'Technical SEO',
            icon: 'Zap',
            score: techScore,
            competitorScore: compTechScore,
            status: techScore > compTechScore ? 'winning' : techScore < compTechScore ? 'losing' : 'tied',
            insights: [
                yourMeta.title ? `Title: "${yourMeta.title.substring(0, 50)}${yourMeta.title.length > 50 ? '...' : ''}" (${yourMeta.title.length} chars)` : 'Missing page title',
                yourMeta.description ? `Meta description: ${yourMeta.description.length} chars` : 'Missing meta description',
                yourPerf?.metrics.lcp ? `LCP: ${(yourPerf.metrics.lcp / 1000).toFixed(2)}s` : null,
                yourPerf?.metrics.cls !== undefined ? `CLS: ${yourPerf.metrics.cls.toFixed(3)}` : null,
                ...(contentAnalysis.yourContent.technicalSEO?.issues || []),
            ].filter(Boolean) as string[],
            recommendations: [
                ...(contentAnalysis.yourContent.technicalSEO?.issues || []),
                yourPerf?.metrics.lcp && yourPerf.metrics.lcp > 2500 ? `Improve LCP (currently ${(yourPerf.metrics.lcp / 1000).toFixed(2)}s, target <2.5s)` : null,
                !yourMeta.description ? 'Add meta description (150-160 chars)' : null,
                techScore < compTechScore ? `Close ${compTechScore - techScore}pt gap vs competitor` : null,
            ].filter(Boolean) as string[],
            details: {
                hasProperHeadings: contentAnalysis.yourContent.technicalSEO?.hasProperHeadings,
                hasMeta: contentAnalysis.yourContent.technicalSEO?.hasMeta,
                lcp: yourPerf?.metrics.lcp,
                cls: yourPerf?.metrics.cls,
            },
        });

        // 2. On-Page SEO
        const yourSEOScore = this.calculateSEOScore(yourSEO, competitorSEO);
        const compSEOScore = this.calculateSEOScore(competitorSEO, yourSEO);
        const yourH1Count = (yourDoc.html?.match(/<h1/gi) || []).length;
        const yourH2Count = (yourDoc.html?.match(/<h2/gi) || []).length;
        const yourImgCount = (yourDoc.html?.match(/<img/gi) || []).length;
        const yourWordCount = (yourDoc.markdown?.split(/\s+/) || []).length;
        categories.push({
            name: 'On-Page SEO',
            icon: 'BarChart3',
            score: yourSEOScore,
            competitorScore: compSEOScore,
            status: yourSEOScore > compSEOScore ? 'winning' : yourSEOScore < compSEOScore ? 'losing' : 'tied',
            insights: [
                `H1 tags: ${yourH1Count}`,
                `H2 tags: ${yourH2Count}`,
                `Images: ${yourImgCount}`,
                `Word count: ~${yourWordCount}`,
                yourMeta.title ? `Title length: ${yourMeta.title.length} chars ${yourMeta.title.length >= 50 && yourMeta.title.length <= 60 ? 'âœ“' : ''}` : 'Missing title',
            ].filter(Boolean),
            recommendations: [
                yourH1Count === 0 ? 'Add H1 heading to page' : yourH1Count > 1 ? `Reduce H1 tags (have ${yourH1Count}, should be 1)` : null,
                yourH2Count < 2 ? 'Add more H2 subheadings for structure' : null,
                yourWordCount < 500 ? `Add more content (currently ~${yourWordCount} words, aim for 1000+)` : null,
                yourSEOScore < compSEOScore ? `Close ${compSEOScore - yourSEOScore}pt gap vs competitor` : null,
            ].filter(Boolean) as string[],
            details: {
                h1Count: yourH1Count,
                h2Count: yourH2Count,
                wordCount: yourWordCount,
                yourKeywords: yourSEO?.organicKeywords || 0,
                competitorKeywords: competitorSEO?.organicKeywords || 0,
            },
        });

        // 3. Topical Authority (merged Content Quality + Internal Structure)
        const contentScore = contentAnalysis.yourContent.contentQuality?.score || 50;
        const compContentScore = contentAnalysis.competitorContent.contentQuality?.score || 50;
        categories.push({
            name: 'Topical Authority',
            icon: 'Sparkles',
            score: contentScore,
            competitorScore: compContentScore,
            status: contentScore > compContentScore ? 'winning' : contentScore < compContentScore ? 'losing' : 'tied',
            insights: [
                `Topical authority score: ${contentScore}/100`,
                yourWordCount >= 1000 ? `Strong content depth (~${yourWordCount} words)` : `Could use more depth (~${yourWordCount} words)`,
                ...(contentAnalysis.yourContent.contentQuality?.strengths || []).slice(0, 3),
            ],
            recommendations: [
                ...(contentAnalysis.yourContent.contentQuality?.weaknesses || []).slice(0, 3),
                contentScore < compContentScore ? `Close ${compContentScore - contentScore}pt authority gap vs competitor` : null,
                yourWordCount < 1000 ? 'Expand content with more depth, entities, and examples' : null,
            ].filter(Boolean) as string[],
            details: {
                wordCount: yourWordCount,
                strengths: contentAnalysis.yourContent.contentQuality?.strengths,
                weaknesses: contentAnalysis.yourContent.contentQuality?.weaknesses,
            },
        });

        // 4. AEO Readiness
        const aeoScore = contentAnalysis.yourContent.aeoReadiness?.score || 50;
        const compAeoScore = contentAnalysis.competitorContent.aeoReadiness?.score || 50;
        const hasFAQ = yourDoc.html?.toLowerCase().includes('faq') || yourDoc.markdown?.toLowerCase().includes('frequently asked');
        const hasSchema = yourDoc.html?.includes('application/ld+json');
        categories.push({
            name: 'AEO Readiness',
            icon: 'Target',
            score: aeoScore,
            competitorScore: compAeoScore,
            status: aeoScore > compAeoScore ? 'winning' : aeoScore < compAeoScore ? 'losing' : 'tied',
            insights: [
                hasSchema ? 'Has structured data (JSON-LD)' : 'No structured data detected',
                hasFAQ ? 'Has FAQ content' : 'No FAQ section detected',
                ...(contentAnalysis.yourContent.aeoReadiness?.insights || []).slice(0, 2),
            ],
            recommendations: [
                !hasSchema ? 'Add FAQ and HowTo schema markup for AI visibility' : null,
                !hasFAQ ? 'Add FAQ section with common questions' : null,
                !contentAnalysis.yourContent.aeoReadiness?.hasStructuredAnswers ? 'Structure content with clear Q&A format' : null,
                aeoScore < compAeoScore ? `Close ${compAeoScore - aeoScore}pt AEO gap vs competitor` : null,
            ].filter(Boolean) as string[],
            details: {
                hasFAQ: contentAnalysis.yourContent.aeoReadiness?.hasFAQContent,
                hasStructuredAnswers: contentAnalysis.yourContent.aeoReadiness?.hasStructuredAnswers,
                hasSchema,
            },
        });

        // 5. Brand Voice
        const brandScore = contentAnalysis.yourContent.brandVoice?.score || 50;
        const compBrandScore = contentAnalysis.competitorContent.brandVoice?.score || 50;
        categories.push({
            name: 'Brand Voice',
            icon: 'Shield',
            score: brandScore,
            competitorScore: compBrandScore,
            status: brandScore > compBrandScore ? 'winning' : brandScore < compBrandScore ? 'losing' : 'tied',
            insights: [
                contentAnalysis.yourContent.brandVoice?.tone ? `Detected tone: ${contentAnalysis.yourContent.brandVoice.tone}` : 'Analyzing brand voice...',
                contentAnalysis.yourContent.brandVoice?.uniqueness ? `Voice uniqueness: ${contentAnalysis.yourContent.brandVoice.uniqueness}%` : null,
            ].filter(Boolean) as string[],
            recommendations: [
                brandScore < 70 ? 'Develop a more distinctive brand voice' : null,
                brandScore < compBrandScore ? `Competitor has stronger brand voice (+${compBrandScore - brandScore}pts)` : null,
            ].filter(Boolean) as string[],
            details: {
                tone: contentAnalysis.yourContent.brandVoice?.tone,
                uniqueness: contentAnalysis.yourContent.brandVoice?.uniqueness,
            },
        });

        // 6. UX & Engagement (Performance)
        const perfScore = yourPerf?.scores.performance || 50;
        const compPerfScore = competitorPerf?.scores.performance || 50;
        categories.push({
            name: 'UX & Engagement',
            icon: 'Layout',
            score: perfScore,
            competitorScore: compPerfScore,
            status: perfScore > compPerfScore ? 'winning' : perfScore < compPerfScore ? 'losing' : 'tied',
            insights: [
                yourPerf?.metrics.lcp ? `LCP: ${(yourPerf.metrics.lcp / 1000).toFixed(2)}s ${yourPerf.metrics.lcp < 2500 ? 'âœ“ Good' : 'âš  Needs work'}` : 'LCP not measured',
                yourPerf?.metrics.cls !== undefined ? `CLS: ${yourPerf.metrics.cls.toFixed(3)} ${yourPerf.metrics.cls < 0.1 ? 'âœ“ Good' : 'âš  Needs work'}` : 'CLS not measured',
                yourPerf?.scores.accessibility ? `Accessibility: ${yourPerf.scores.accessibility}/100` : null,
            ].filter(Boolean) as string[],
            recommendations: yourPerf?.opportunities.map(o => o.title).slice(0, 4) || [
                perfScore < compPerfScore ? `Improve performance to match competitor (+${compPerfScore - perfScore}pts needed)` : null,
            ].filter(Boolean) as string[],
            details: {
                lcp: yourPerf?.metrics.lcp,
                cls: yourPerf?.metrics.cls,
                fcp: yourPerf?.metrics.fcp,
                performance: perfScore,
            },
        });

        // 7. Internal Structure (Backlinks as proxy)
        const linkScore = this.calculateLinkScore(yourSEO, competitorSEO);
        const compLinkScore = this.calculateLinkScore(competitorSEO, yourSEO);
        const internalLinkCount = (yourDoc.html?.match(/<a[^>]*href="[^"]*"/gi) || []).length;
        categories.push({
            name: 'Internal Structure',
            icon: 'Link2',
            score: linkScore,
            competitorScore: compLinkScore,
            status: linkScore > compLinkScore ? 'winning' : linkScore < compLinkScore ? 'losing' : 'tied',
            insights: [
                `Internal/external links on page: ${internalLinkCount}`,
                yourSEO?.backlinks ? `Backlinks: ${yourSEO.backlinks}` : 'Backlinks data unavailable',
                yourSEO?.referringDomains ? `Referring domains: ${yourSEO.referringDomains}` : null,
            ].filter(Boolean) as string[],
            recommendations: [
                internalLinkCount < 10 ? 'Add more internal links to related content' : null,
                linkScore < compLinkScore ? `Build more quality backlinks (competitor has +${compLinkScore - linkScore}pt advantage)` : null,
            ].filter(Boolean) as string[],
            details: {
                internalLinks: internalLinkCount,
                backlinks: yourSEO?.backlinks || 0,
                referringDomains: yourSEO?.referringDomains || 0,
            },
        });

        return categories;
    }

    /**
     * Calculate SEO score based on keywords
     */
    private calculateSEOScore(primary: any, comparison: any): number {
        if (!primary) return 30;
        const keywords = primary.organicKeywords || 0;
        const compKeywords = comparison?.organicKeywords || 1;

        // Relative scoring
        const ratio = keywords / Math.max(compKeywords, 1);
        if (ratio >= 2) return 95;
        if (ratio >= 1.5) return 85;
        if (ratio >= 1) return 75;
        if (ratio >= 0.7) return 60;
        if (ratio >= 0.5) return 50;
        return 40;
    }

    /**
     * Calculate link score based on backlinks
     */
    private calculateLinkScore(primary: any, comparison: any): number {
        if (!primary) return 30;
        const links = primary.backlinks || 0;
        const compLinks = comparison?.backlinks || 1;

        const ratio = links / Math.max(compLinks, 1);
        if (ratio >= 2) return 90;
        if (ratio >= 1.5) return 80;
        if (ratio >= 1) return 70;
        if (ratio >= 0.5) return 55;
        return 40;
    }

    /**
     * Fallback content analysis when Claude is unavailable
     */
    private fallbackContentAnalysis(yourDoc: FirecrawlDocument, competitorDoc: FirecrawlDocument) {
        const yourSeo = this.firecrawl.extractSEOElements(yourDoc);
        const compSeo = this.firecrawl.extractSEOElements(competitorDoc);

        return {
            businessProfile: {
                name: yourDoc.metadata.title?.split('|')[0]?.split('-')[0]?.trim() || 'Your Business',
                industry: 'General',
                services: [],
                location: undefined,
            },
            yourContent: {
                contentQuality: {
                    score: Math.min(100, 40 + (yourSeo.wordCount / 50)),
                    strengths: yourSeo.wordCount > 500 ? ['Good content length'] : [],
                    weaknesses: yourSeo.wordCount < 300 ? ['Content too short'] : [],
                },
                aeoReadiness: {
                    score: yourSeo.hasSchema ? 70 : 40,
                    hasStructuredAnswers: false,
                    hasFAQContent: yourSeo.headings.h2.some(h => h.toLowerCase().includes('faq')),
                    hasSchemaReadyContent: yourSeo.hasSchema,
                    insights: [],
                },
                brandVoice: { score: 50, tone: 'neutral', uniqueness: 50, consistency: 50 },
                technicalSEO: {
                    score: yourSeo.title ? 70 : 40,
                    hasProperHeadings: yourSeo.headings.h1.length > 0,
                    hasMeta: !!yourSeo.description,
                    issues: [],
                },
            },
            competitorContent: {
                contentQuality: {
                    score: Math.min(100, 40 + (compSeo.wordCount / 50)),
                    strengths: [],
                    weaknesses: [],
                },
                aeoReadiness: {
                    score: compSeo.hasSchema ? 70 : 40,
                    hasStructuredAnswers: false,
                    hasFAQContent: false,
                    hasSchemaReadyContent: compSeo.hasSchema,
                    insights: [],
                },
                brandVoice: { score: 50, tone: 'neutral', uniqueness: 50, consistency: 50 },
                technicalSEO: {
                    score: compSeo.title ? 70 : 40,
                    hasProperHeadings: compSeo.headings.h1.length > 0,
                    hasMeta: !!compSeo.description,
                    issues: [],
                },
            },
        };
    }

    /**
     * Update progress
     */
    private updateProgress(analysisId: string, stage: AnalysisProgress['stage'], progress: number, message: string) {
        const callback = this.progressCallbacks.get(analysisId);
        if (callback) {
            callback({ stage, progress, message });
        }
        console.log(`[AnalysisEngine] ${analysisId}: ${progress}% - ${message}`);
    }
}

// ============================================
// HELPER TYPES
// ============================================

interface ContentAnalysis {
    contentQuality?: {
        score: number;
        strengths: string[];
        weaknesses: string[];
    };
    aeoReadiness?: {
        score: number;
        hasStructuredAnswers: boolean;
        hasFAQContent: boolean;
        hasSchemaReadyContent: boolean;
        insights: string[];
    };
    brandVoice?: {
        score: number;
        tone: string;
        uniqueness: number;
        consistency: number;
    };
    technicalSEO?: {
        score: number;
        hasProperHeadings: boolean;
        hasMeta: boolean;
        issues: string[];
    };
}
