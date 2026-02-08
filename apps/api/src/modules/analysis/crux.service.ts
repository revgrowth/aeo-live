import { Injectable } from '@nestjs/common';

// =============================================================================
// CHROME UX REPORT (CrUX) SERVICE
// =============================================================================
// Fetches REAL USER metrics from Chrome UX Report API - FREE from Google!
// This provides actual field data vs PageSpeed's lab data.
// =============================================================================

export interface CruxMetrics {
    url: string;
    origin: string;
    formFactor: 'PHONE' | 'DESKTOP' | 'TABLET' | 'ALL';

    // Core Web Vitals - real user data
    largestContentfulPaint: {
        p75: number; // 75th percentile in ms
        good: number; // % of users with good experience
        needsImprovement: number;
        poor: number;
    };

    firstInputDelay: {
        p75: number; // 75th percentile in ms
        good: number;
        needsImprovement: number;
        poor: number;
    };

    cumulativeLayoutShift: {
        p75: number; // 75th percentile (unitless)
        good: number;
        needsImprovement: number;
        poor: number;
    };

    // Interaction to Next Paint (new Core Web Vital)
    interactionToNextPaint?: {
        p75: number;
        good: number;
        needsImprovement: number;
        poor: number;
    };

    // First Contentful Paint
    firstContentfulPaint: {
        p75: number;
        good: number;
        needsImprovement: number;
        poor: number;
    };

    // Time to First Byte
    timeToFirstByte?: {
        p75: number;
        good: number;
        needsImprovement: number;
        poor: number;
    };

    // Overall scores
    overallCoreWebVitals: 'good' | 'needs-improvement' | 'poor' | 'unknown';
    hasEnoughData: boolean;
    collectionPeriod?: {
        firstDate: string;
        lastDate: string;
    };
}

export interface CruxComparison {
    yourMetrics: CruxMetrics | null;
    competitorMetrics: CruxMetrics | null;
    winner: 'you' | 'competitor' | 'tie' | 'insufficient-data';
    breakdown: {
        metric: string;
        you: number | null;
        competitor: number | null;
        winner: 'you' | 'competitor' | 'tie' | 'unknown';
    }[];
    realUserAdvantage?: string;
}

@Injectable()
export class CruxService {
    private apiKey: string | null = null;
    private baseUrl = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

    constructor() {
        // CrUX uses the same API key as PageSpeed Insights
        this.apiKey = process.env.PAGESPEED_API_KEY || null;
        if (this.apiKey) {
            console.log('[CrUX] Service initialized with API key');
        } else {
            console.warn('[CrUX] No PageSpeed API key - CrUX data unavailable');
        }
    }

    isAvailable(): boolean {
        return this.apiKey !== null;
    }

    /**
     * Get real user metrics for a URL
     */
    async getMetrics(url: string, formFactor: 'PHONE' | 'DESKTOP' | 'ALL_FORM_FACTORS' = 'DESKTOP'): Promise<CruxMetrics | null> {
        if (!this.apiKey) {
            console.log('[CrUX] Skipping - no API key');
            return null;
        }

        const origin = this.extractOrigin(url);

        try {
            // Try URL-level first
            let response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url.startsWith('http') ? url : `https://${url}`,
                    formFactor,
                }),
            });

            let data = await response.json() as { record?: any };

            // If no URL-level data, try origin-level
            if (!data.record && origin) {
                console.log(`[CrUX] No URL data for ${url}, trying origin ${origin}`);
                response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        origin,
                        formFactor,
                    }),
                });
                data = await response.json() as { record?: any };
            }

            if (!data.record) {
                console.log(`[CrUX] No data available for ${url}`);
                return null;
            }

            return this.parseMetrics(data.record, url, origin);

        } catch (error) {
            console.error(`[CrUX] Error fetching metrics for ${url}:`, error);
            return null;
        }
    }

    private extractOrigin(url: string): string {
        try {
            const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
            return `${parsed.protocol}//${parsed.hostname}`;
        } catch {
            return url;
        }
    }

    private parseMetrics(record: any, url: string, origin: string): CruxMetrics {
        const metrics = record.metrics || {};

        const parseMetric = (metricData: any) => {
            if (!metricData) {
                return { p75: 0, good: 0, needsImprovement: 0, poor: 0 };
            }
            const percentiles = metricData.percentiles || {};
            const histogram = metricData.histogram || [];

            return {
                p75: percentiles.p75 || 0,
                good: Math.round((histogram[0]?.density || 0) * 100),
                needsImprovement: Math.round((histogram[1]?.density || 0) * 100),
                poor: Math.round((histogram[2]?.density || 0) * 100),
            };
        };

        const lcp = parseMetric(metrics.largest_contentful_paint);
        const fid = parseMetric(metrics.first_input_delay);
        const cls = parseMetric(metrics.cumulative_layout_shift);
        const inp = parseMetric(metrics.interaction_to_next_paint);
        const fcp = parseMetric(metrics.first_contentful_paint);
        const ttfb = parseMetric(metrics.experimental_time_to_first_byte || metrics.time_to_first_byte);

        // Determine overall Core Web Vitals pass/fail
        // Good: LCP <= 2.5s, FID <= 100ms, CLS <= 0.1
        const lcpGood = lcp.p75 <= 2500;
        const fidGood = fid.p75 <= 100 || (inp.p75 && inp.p75 <= 200);
        const clsGood = cls.p75 <= 0.1;

        let overallCoreWebVitals: CruxMetrics['overallCoreWebVitals'];
        if (lcpGood && fidGood && clsGood) {
            overallCoreWebVitals = 'good';
        } else if (lcp.p75 > 4000 || fid.p75 > 300 || cls.p75 > 0.25) {
            overallCoreWebVitals = 'poor';
        } else if (lcp.p75 || fid.p75 || cls.p75) {
            overallCoreWebVitals = 'needs-improvement';
        } else {
            overallCoreWebVitals = 'unknown';
        }

        return {
            url,
            origin,
            formFactor: record.key?.formFactor || 'DESKTOP',
            largestContentfulPaint: lcp,
            firstInputDelay: fid,
            cumulativeLayoutShift: cls,
            interactionToNextPaint: inp.p75 ? inp : undefined,
            firstContentfulPaint: fcp,
            timeToFirstByte: ttfb.p75 ? ttfb : undefined,
            overallCoreWebVitals,
            hasEnoughData: !!(lcp.p75 || fid.p75 || cls.p75),
            collectionPeriod: record.collectionPeriod ? {
                firstDate: record.collectionPeriod.firstDate,
                lastDate: record.collectionPeriod.lastDate,
            } : undefined,
        };
    }

    /**
     * Compare real user metrics between two URLs
     */
    async compare(yourUrl: string, competitorUrl: string): Promise<CruxComparison> {
        console.log(`[CrUX] Comparing real user metrics: ${yourUrl} vs ${competitorUrl}`);

        const [yourMetrics, competitorMetrics] = await Promise.all([
            this.getMetrics(yourUrl),
            this.getMetrics(competitorUrl),
        ]);

        const breakdown: CruxComparison['breakdown'] = [];
        let yourWins = 0;
        let compWins = 0;

        // LCP comparison (lower is better)
        const yourLcp = yourMetrics?.largestContentfulPaint.p75;
        const compLcp = competitorMetrics?.largestContentfulPaint.p75;
        if (yourLcp && compLcp) {
            const lcpWinner = yourLcp < compLcp ? 'you' : yourLcp > compLcp ? 'competitor' : 'tie';
            breakdown.push({ metric: 'LCP (Largest Contentful Paint)', you: yourLcp, competitor: compLcp, winner: lcpWinner });
            if (lcpWinner === 'you') yourWins++;
            if (lcpWinner === 'competitor') compWins++;
        } else {
            breakdown.push({ metric: 'LCP (Largest Contentful Paint)', you: yourLcp || null, competitor: compLcp || null, winner: 'unknown' });
        }

        // FID comparison (lower is better)
        const yourFid = yourMetrics?.firstInputDelay.p75;
        const compFid = competitorMetrics?.firstInputDelay.p75;
        if (yourFid && compFid) {
            const fidWinner = yourFid < compFid ? 'you' : yourFid > compFid ? 'competitor' : 'tie';
            breakdown.push({ metric: 'FID (First Input Delay)', you: yourFid, competitor: compFid, winner: fidWinner });
            if (fidWinner === 'you') yourWins++;
            if (fidWinner === 'competitor') compWins++;
        } else {
            breakdown.push({ metric: 'FID (First Input Delay)', you: yourFid || null, competitor: compFid || null, winner: 'unknown' });
        }

        // CLS comparison (lower is better)
        const yourCls = yourMetrics?.cumulativeLayoutShift.p75;
        const compCls = competitorMetrics?.cumulativeLayoutShift.p75;
        if (yourCls !== undefined && compCls !== undefined) {
            const clsWinner = yourCls < compCls ? 'you' : yourCls > compCls ? 'competitor' : 'tie';
            breakdown.push({ metric: 'CLS (Cumulative Layout Shift)', you: yourCls, competitor: compCls, winner: clsWinner });
            if (clsWinner === 'you') yourWins++;
            if (clsWinner === 'competitor') compWins++;
        } else {
            breakdown.push({ metric: 'CLS (Cumulative Layout Shift)', you: yourCls ?? null, competitor: compCls ?? null, winner: 'unknown' });
        }

        // INP comparison if available (lower is better)
        const yourInp = yourMetrics?.interactionToNextPaint?.p75;
        const compInp = competitorMetrics?.interactionToNextPaint?.p75;
        if (yourInp && compInp) {
            const inpWinner = yourInp < compInp ? 'you' : yourInp > compInp ? 'competitor' : 'tie';
            breakdown.push({ metric: 'INP (Interaction to Next Paint)', you: yourInp, competitor: compInp, winner: inpWinner });
            if (inpWinner === 'you') yourWins++;
            if (inpWinner === 'competitor') compWins++;
        }

        // Overall winner
        let winner: CruxComparison['winner'];
        let realUserAdvantage: string | undefined;

        if (!yourMetrics?.hasEnoughData && !competitorMetrics?.hasEnoughData) {
            winner = 'insufficient-data';
        } else if (yourWins > compWins) {
            winner = 'you';
            realUserAdvantage = `Your site provides a better real-user experience (${yourWins} of ${breakdown.length} metrics)`;
        } else if (compWins > yourWins) {
            winner = 'competitor';
            realUserAdvantage = `Competitor has better real-user experience (${compWins} of ${breakdown.length} metrics)`;
        } else {
            winner = 'tie';
            realUserAdvantage = 'Both sites have similar real-user performance';
        }

        console.log(`[CrUX] Comparison complete - Winner: ${winner}`);

        return {
            yourMetrics,
            competitorMetrics,
            winner,
            breakdown,
            realUserAdvantage,
        };
    }
}
