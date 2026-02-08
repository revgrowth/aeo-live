import { Injectable } from '@nestjs/common';

export interface CoreWebVitals {
    lcp: number; // Largest Contentful Paint (ms)
    fid: number; // First Input Delay (ms)
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint (ms)
    ttfb: number; // Time to First Byte (ms)
    si: number; // Speed Index
    tti: number; // Time to Interactive (ms)
}

export interface PerformanceScore {
    overall: number; // 0-100
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
}

export interface PageSpeedResult {
    url: string;
    scores: PerformanceScore;
    metrics: CoreWebVitals;
    opportunities: {
        id: string;
        title: string;
        description: string;
        savings?: number; // Potential ms savings
    }[];
    diagnostics: {
        id: string;
        title: string;
        description: string;
    }[];
}

@Injectable()
export class PageSpeedService {
    private apiKey: string | null = null;

    constructor() {
        this.apiKey = process.env.PAGESPEED_API_KEY || null;
        if (this.apiKey) {
            console.log('[PageSpeed] Service initialized');
        } else {
            console.warn('[PageSpeed] No API key found - service unavailable');
        }
    }

    /**
     * Check if service is available
     */
    isAvailable(): boolean {
        return this.apiKey !== null;
    }

    /**
     * Analyze a URL with PageSpeed Insights
     */
    async analyze(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<PageSpeedResult | null> {
        if (!this.apiKey) {
            console.warn('[PageSpeed] Service not available');
            return null;
        }

        try {
            console.log(`[PageSpeed] Analyzing ${url} (${strategy})`);

            const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
            apiUrl.searchParams.set('url', url);
            apiUrl.searchParams.set('key', this.apiKey);
            apiUrl.searchParams.set('strategy', strategy);
            apiUrl.searchParams.append('category', 'performance');
            apiUrl.searchParams.append('category', 'accessibility');
            apiUrl.searchParams.append('category', 'best-practices');
            apiUrl.searchParams.append('category', 'seo');

            const response = await fetch(apiUrl.toString());

            if (!response.ok) {
                console.error(`[PageSpeed] API error: ${response.status}`);
                return null;
            }

            const data = await response.json() as any;
            const lighthouse = data.lighthouseResult;

            if (!lighthouse) {
                console.error('[PageSpeed] No Lighthouse result');
                return null;
            }

            // Extract scores
            const scores: PerformanceScore = {
                overall: Math.round((lighthouse.categories?.performance?.score || 0) * 100),
                performance: Math.round((lighthouse.categories?.performance?.score || 0) * 100),
                accessibility: Math.round((lighthouse.categories?.accessibility?.score || 0) * 100),
                bestPractices: Math.round((lighthouse.categories?.['best-practices']?.score || 0) * 100),
                seo: Math.round((lighthouse.categories?.seo?.score || 0) * 100),
            };

            // Extract Core Web Vitals
            const audits = lighthouse.audits || {};
            const metrics: CoreWebVitals = {
                lcp: audits['largest-contentful-paint']?.numericValue || 0,
                fid: audits['max-potential-fid']?.numericValue || 0,
                cls: audits['cumulative-layout-shift']?.numericValue || 0,
                fcp: audits['first-contentful-paint']?.numericValue || 0,
                ttfb: audits['server-response-time']?.numericValue || 0,
                si: audits['speed-index']?.numericValue || 0,
                tti: audits['interactive']?.numericValue || 0,
            };

            // Extract opportunities (things to fix)
            const opportunities = Object.values(audits)
                .filter((audit: any) =>
                    audit.details?.type === 'opportunity' &&
                    audit.score !== null &&
                    audit.score < 1
                )
                .map((audit: any) => ({
                    id: audit.id,
                    title: audit.title,
                    description: audit.description,
                    savings: audit.details?.overallSavingsMs || 0,
                }))
                .sort((a, b) => (b.savings || 0) - (a.savings || 0))
                .slice(0, 5);

            // Extract diagnostics
            const diagnostics = Object.values(audits)
                .filter((audit: any) =>
                    audit.details?.type === 'table' &&
                    audit.score !== null &&
                    audit.score < 1
                )
                .map((audit: any) => ({
                    id: audit.id,
                    title: audit.title,
                    description: audit.description,
                }))
                .slice(0, 5);

            console.log(`[PageSpeed] Analysis complete - Performance: ${scores.performance}`);

            return {
                url,
                scores,
                metrics,
                opportunities,
                diagnostics,
            };

        } catch (error) {
            console.error('[PageSpeed] Analysis failed:', error);
            return null;
        }
    }

    /**
     * Compare two URLs
     */
    async compare(url1: string, url2: string): Promise<{
        url1: PageSpeedResult | null;
        url2: PageSpeedResult | null;
        winner: 'url1' | 'url2' | 'tie';
        comparison: {
            metric: string;
            url1Value: number;
            url2Value: number;
            winner: 'url1' | 'url2' | 'tie';
        }[];
    }> {
        const [result1, result2] = await Promise.all([
            this.analyze(url1),
            this.analyze(url2),
        ]);

        const comparison = [];

        if (result1 && result2) {
            comparison.push(
                {
                    metric: 'Performance Score',
                    url1Value: result1.scores.performance,
                    url2Value: result2.scores.performance,
                    winner: result1.scores.performance > result2.scores.performance ? 'url1' as const :
                        result1.scores.performance < result2.scores.performance ? 'url2' as const : 'tie' as const,
                },
                {
                    metric: 'LCP (Lower is better)',
                    url1Value: result1.metrics.lcp,
                    url2Value: result2.metrics.lcp,
                    winner: result1.metrics.lcp < result2.metrics.lcp ? 'url1' as const :
                        result1.metrics.lcp > result2.metrics.lcp ? 'url2' as const : 'tie' as const,
                },
                {
                    metric: 'CLS (Lower is better)',
                    url1Value: result1.metrics.cls,
                    url2Value: result2.metrics.cls,
                    winner: result1.metrics.cls < result2.metrics.cls ? 'url1' as const :
                        result1.metrics.cls > result2.metrics.cls ? 'url2' as const : 'tie' as const,
                },
                {
                    metric: 'SEO Score',
                    url1Value: result1.scores.seo,
                    url2Value: result2.scores.seo,
                    winner: result1.scores.seo > result2.scores.seo ? 'url1' as const :
                        result1.scores.seo < result2.scores.seo ? 'url2' as const : 'tie' as const,
                },
            );
        }

        const url1Wins = comparison.filter(c => c.winner === 'url1').length;
        const url2Wins = comparison.filter(c => c.winner === 'url2').length;

        return {
            url1: result1,
            url2: result2,
            winner: url1Wins > url2Wins ? 'url1' : url2Wins > url1Wins ? 'url2' : 'tie',
            comparison,
        };
    }
}
