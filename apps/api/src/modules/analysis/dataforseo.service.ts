import { Injectable } from '@nestjs/common';

export interface DataForSEOCompetitor {
    domain: string;
    rank: number;
    intersections: number;
    etv: number; // Estimated traffic value
    keywords: number;
    relevance: number;
}

export interface DataForSEODomainInfo {
    domain: string;
    organicKeywords: number;
    organicTraffic: number;
    organicCost: number;
    backlinks: number;
    referringDomains: number;
}

// DataForSEO API response type
interface DataForSEOResponse {
    tasks?: {
        id?: string;
        result?: any[];
    }[];
}

// Keyword Gap Analysis Types
export interface KeywordGapItem {
    keyword: string;
    searchVolume: number;
    yourPosition: number | null; // null = you don't rank
    competitorPosition: number | null; // null = they don't rank
    keywordDifficulty: number;
    cpc: number;
    trafficPotential: number;
    intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | 'unknown';
}

export interface KeywordGapResult {
    // Keywords competitor ranks for that you don't
    keywordsYouAreMissing: KeywordGapItem[];
    // Keywords only you rank for
    keywordsOnlyYouHave: KeywordGapItem[];
    // Keywords both rank for
    sharedKeywords: KeywordGapItem[];
    // Top opportunities (high volume, low difficulty)
    topOpportunities: KeywordGapItem[];
    // Aggregated stats
    summary: {
        yourTotalKeywords: number;
        competitorTotalKeywords: number;
        missedOpportunityTraffic: number; // Estimated traffic you're missing
        sharedKeywordsCount: number;
        quickWins: number; // Keywords where you're close to page 1
    };
}

// Backlink Quality Analysis Types
export interface ReferringDomain {
    domain: string;
    domainRank: number; // 0-100, similar to Domain Rating
    backlinks: number;
    firstSeen: string;
    isDoFollow: boolean;
}

export interface BacklinkQualityResult {
    domain: string;
    // Core metrics
    domainRank: number; // 0-100 (DataForSEO's domain rank)
    totalBacklinks: number;
    referringDomains: number;
    referringDomainsDofollow: number;

    // Quality indicators
    toxicScore: number; // 0-100, higher = more toxic
    spamScore: number; // 0-100

    // Trends
    newBacklinks30d: number;
    lostBacklinks30d: number;

    // Top referring domains
    topReferringDomains: ReferringDomain[];

    // Anchor text distribution
    anchorTextDistribution: {
        type: 'branded' | 'exact' | 'partial' | 'naked_url' | 'other';
        percentage: number;
        count: number;
    }[];

    // Link types
    linkTypes: {
        text: number;
        image: number;
        redirect: number;
        other: number;
    };
}

export interface BacklinkComparison {
    you: BacklinkQualityResult | null;
    competitor: BacklinkQualityResult | null;
    winner: 'you' | 'competitor' | 'tie' | 'insufficient-data';
    insights: string[];
}

@Injectable()
export class DataForSEOService {
    private baseUrl = 'https://api.dataforseo.com/v3';
    private auth: string | null = null;

    constructor() {
        const login = process.env.DATAFORSEO_LOGIN;
        const password = process.env.DATAFORSEO_PASSWORD;

        if (login && password) {
            this.auth = Buffer.from(`${login}:${password}`).toString('base64');
            console.log('[DataForSEO] Client initialized');
        } else {
            console.warn('[DataForSEO] No credentials found - service unavailable');
        }
    }

    /**
     * Check if service is available
     */
    isAvailable(): boolean {
        return this.auth !== null;
    }

    /**
     * Get organic competitors for a domain
     */
    async getOrganicCompetitors(domain: string, limit = 10): Promise<DataForSEOCompetitor[]> {
        if (!this.auth) {
            console.warn('[DataForSEO] Service not available');
            return [];
        }

        try {
            console.log(`[DataForSEO] Getting organic competitors for: ${domain}`);

            const response = await fetch(`${this.baseUrl}/dataforseo_labs/google/competitors_domain/live`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    target: domain,
                    location_code: 2840, // USA
                    language_code: 'en',
                    limit: limit,
                    filters: [
                        ['intersections', '>', 5] // At least 5 shared keywords
                    ],
                    order_by: ['intersections,desc'],
                }]),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[DataForSEO] API error: ${response.status}`, errorText);
                return [];
            }

            const data = await response.json() as DataForSEOResponse;

            if (data.tasks?.[0]?.result?.[0]?.items) {
                const items = data.tasks[0].result[0].items;
                console.log(`[DataForSEO] Found ${items.length} competitors`);

                return items.map((item: any) => ({
                    domain: item.domain,
                    rank: item.rank || 0,
                    intersections: item.intersections || 0,
                    etv: item.metrics?.organic?.etv || 0,
                    keywords: item.metrics?.organic?.count || 0,
                    relevance: Math.min(1, (item.intersections || 0) / 100),
                }));
            }

            console.log('[DataForSEO] No competitor data returned');
            return [];

        } catch (error) {
            console.error('[DataForSEO] Request failed:', error);
            return [];
        }
    }

    /**
     * Get domain info (traffic, keywords, backlinks)
     */
    async getDomainInfo(domain: string): Promise<DataForSEODomainInfo | null> {
        if (!this.auth) {
            return null;
        }

        try {
            console.log(`[DataForSEO] Getting domain info for: ${domain}`);

            const response = await fetch(`${this.baseUrl}/dataforseo_labs/google/domain_rank_overview/live`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    target: domain,
                    location_code: 2840, // USA
                    language_code: 'en',
                }]),
            });

            if (!response.ok) {
                console.error(`[DataForSEO] Domain info error: ${response.status}`);
                return null;
            }

            const data = await response.json() as DataForSEOResponse;
            console.log(`[DataForSEO] Response for ${domain}:`, JSON.stringify(data.tasks?.[0]?.result?.[0], null, 2)?.substring(0, 500));
            const result = data.tasks?.[0]?.result?.[0];

            if (result) {
                const domainInfo = {
                    domain: domain,
                    organicKeywords: result.metrics?.organic?.count || 0,
                    organicTraffic: result.metrics?.organic?.etv || 0,
                    organicCost: result.metrics?.organic?.estimated_paid_traffic_cost || 0,
                    backlinks: result.backlinks_info?.backlinks || 0,
                    referringDomains: result.backlinks_info?.referring_domains || 0,
                };
                console.log(`[DataForSEO] Parsed domain info:`, domainInfo);
                return domainInfo;
            }

            console.log(`[DataForSEO] No result found for ${domain}`);
            return null;

        } catch (error) {
            console.error('[DataForSEO] Domain info request failed:', error);
            return null;
        }
    }

    /**
     * Get on-page SEO analysis for a URL
     */
    async getOnPageAnalysis(url: string): Promise<any> {
        if (!this.auth) {
            return null;
        }

        try {
            console.log(`[DataForSEO] Running on-page analysis for: ${url}`);

            // First, create a task
            const taskResponse = await fetch(`${this.baseUrl}/on_page/task_post`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    target: url,
                    max_crawl_pages: 10,
                    load_resources: true,
                    enable_javascript: true,
                    custom_js: 'meta = {}; meta.title = document.title; meta;',
                }]),
            });

            if (!taskResponse.ok) {
                console.error(`[DataForSEO] On-page task creation failed: ${taskResponse.status}`);
                return null;
            }

            const taskData = await taskResponse.json() as DataForSEOResponse;
            const taskId = taskData.tasks?.[0]?.id;

            if (!taskId) {
                console.error('[DataForSEO] No task ID returned');
                return null;
            }

            console.log(`[DataForSEO] On-page task created: ${taskId}`);

            // Wait a bit for analysis to complete (in real usage, you'd poll or use callbacks)
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Get summary
            const summaryResponse = await fetch(`${this.baseUrl}/on_page/summary/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                },
            });

            if (!summaryResponse.ok) {
                console.error(`[DataForSEO] On-page summary failed: ${summaryResponse.status}`);
                return null;
            }

            const summaryData = await summaryResponse.json() as DataForSEOResponse;
            return summaryData.tasks?.[0]?.result?.[0] || null;

        } catch (error) {
            console.error('[DataForSEO] On-page analysis failed:', error);
            return null;
        }
    }

    /**
     * Search for businesses by keyword and location (SERP)
     */
    async searchLocalCompetitors(
        keywords: string[],
        location: string
    ): Promise<{ domain: string; title: string; description: string }[]> {
        if (!this.auth) {
            return [];
        }

        try {
            const searchQuery = `${keywords.join(' ')} ${location}`;
            console.log(`[DataForSEO] Searching SERP for: ${searchQuery}`);

            const response = await fetch(`${this.baseUrl}/serp/google/organic/live/regular`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    keyword: searchQuery,
                    location_name: 'United States',
                    language_code: 'en',
                    depth: 30,
                }]),
            });

            if (!response.ok) {
                console.error(`[DataForSEO] SERP search failed: ${response.status}`);
                return [];
            }

            const data = await response.json() as DataForSEOResponse;
            const items = data.tasks?.[0]?.result?.[0]?.items || [];

            // Filter to organic results only
            const organicResults = items
                .filter((item: any) => item.type === 'organic')
                .map((item: any) => ({
                    domain: new URL(item.url).hostname,
                    title: item.title || '',
                    description: item.description || '',
                }));

            console.log(`[DataForSEO] Found ${organicResults.length} SERP results`);
            return organicResults;

        } catch (error) {
            console.error('[DataForSEO] SERP search failed:', error);
            return [];
        }
    }

    /**
     * Get keyword gap analysis between two domains
     * Finds keywords competitor ranks for that you don't, and vice versa
     */
    async getKeywordGap(yourDomain: string, competitorDomain: string, limit = 50): Promise<KeywordGapResult | null> {
        if (!this.auth) {
            console.log('[DataForSEO] Skipping keyword gap - no credentials');
            return null;
        }

        try {
            console.log(`[DataForSEO] Getting keyword gap: ${yourDomain} vs ${competitorDomain}`);

            // Get keywords unique to competitor (keywords you're missing)
            const missingResponse = await fetch(`${this.baseUrl}/dataforseo_labs/google/domain_intersection/live`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    target1: competitorDomain,
                    target2: yourDomain,
                    intersection_mode: 'unique_to_target1', // Keywords competitor has that you don't
                    location_code: 2840, // USA
                    language_code: 'en',
                    limit: limit,
                    order_by: ['keyword_data.keyword_info.search_volume,desc'],
                }]),
            });

            // Get keywords unique to you
            const uniqueResponse = await fetch(`${this.baseUrl}/dataforseo_labs/google/domain_intersection/live`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    target1: yourDomain,
                    target2: competitorDomain,
                    intersection_mode: 'unique_to_target1', // Keywords you have that competitor doesn't
                    location_code: 2840,
                    language_code: 'en',
                    limit: limit,
                    order_by: ['keyword_data.keyword_info.search_volume,desc'],
                }]),
            });

            // Get shared keywords
            const sharedResponse = await fetch(`${this.baseUrl}/dataforseo_labs/google/domain_intersection/live`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    target1: yourDomain,
                    target2: competitorDomain,
                    intersection_mode: 'intersection', // Keywords both rank for
                    location_code: 2840,
                    language_code: 'en',
                    limit: 30,
                    order_by: ['keyword_data.keyword_info.search_volume,desc'],
                }]),
            });

            // Parse responses
            const missingData = await missingResponse.json() as DataForSEOResponse;
            const uniqueData = await uniqueResponse.json() as DataForSEOResponse;
            const sharedData = await sharedResponse.json() as DataForSEOResponse;

            const parseKeywords = (items: any[], isYours: boolean): KeywordGapItem[] => {
                if (!items) return [];
                return items.slice(0, limit).map((item: any) => ({
                    keyword: item.keyword_data?.keyword || item.keyword || '',
                    searchVolume: item.keyword_data?.keyword_info?.search_volume || 0,
                    yourPosition: isYours ? (item.first_domain_serp_element?.rank_group || null) : (item.second_domain_serp_element?.rank_group || null),
                    competitorPosition: isYours ? (item.second_domain_serp_element?.rank_group || null) : (item.first_domain_serp_element?.rank_group || null),
                    keywordDifficulty: item.keyword_data?.keyword_info?.keyword_difficulty || 50,
                    cpc: item.keyword_data?.keyword_info?.cpc || 0,
                    trafficPotential: item.keyword_data?.keyword_info?.search_volume || 0,
                    intent: this.mapSearchIntent(item.keyword_data?.search_intent_info?.main_intent),
                }));
            };

            const keywordsYouAreMissing = parseKeywords(missingData.tasks?.[0]?.result || [], false);
            const keywordsOnlyYouHave = parseKeywords(uniqueData.tasks?.[0]?.result || [], true);
            const sharedKeywords = parseKeywords(sharedData.tasks?.[0]?.result || [], true);

            // Calculate top opportunities (high volume, reasonable difficulty, you're missing them)
            const topOpportunities = keywordsYouAreMissing
                .filter(kw => kw.searchVolume > 100 && kw.keywordDifficulty < 70)
                .sort((a, b) => (b.searchVolume / (b.keywordDifficulty + 1)) - (a.searchVolume / (a.keywordDifficulty + 1)))
                .slice(0, 10);

            // Calculate quick wins (keywords where you're on page 2, could be pushed to page 1)
            const quickWins = sharedKeywords.filter(
                kw => kw.yourPosition && kw.yourPosition > 10 && kw.yourPosition <= 20
            ).length;

            // Calculate missed traffic opportunity
            const missedOpportunityTraffic = keywordsYouAreMissing.reduce(
                (sum, kw) => sum + (kw.competitorPosition && kw.competitorPosition <= 10 ? kw.searchVolume * 0.1 : 0),
                0
            );

            const result: KeywordGapResult = {
                keywordsYouAreMissing,
                keywordsOnlyYouHave,
                sharedKeywords,
                topOpportunities,
                summary: {
                    yourTotalKeywords: keywordsOnlyYouHave.length + sharedKeywords.length,
                    competitorTotalKeywords: keywordsYouAreMissing.length + sharedKeywords.length,
                    missedOpportunityTraffic: Math.round(missedOpportunityTraffic),
                    sharedKeywordsCount: sharedKeywords.length,
                    quickWins,
                },
            };

            console.log(`[DataForSEO] Keyword gap complete: ${keywordsYouAreMissing.length} missing, ${keywordsOnlyYouHave.length} unique, ${sharedKeywords.length} shared`);
            return result;

        } catch (error) {
            console.error('[DataForSEO] Keyword gap analysis failed:', error);
            return null;
        }
    }

    private mapSearchIntent(intent: string | undefined): KeywordGapItem['intent'] {
        if (!intent) return 'unknown';
        const intentLower = intent.toLowerCase();
        if (intentLower.includes('informational')) return 'informational';
        if (intentLower.includes('navigational')) return 'navigational';
        if (intentLower.includes('commercial')) return 'commercial';
        if (intentLower.includes('transactional')) return 'transactional';
        return 'unknown';
    }

    /**
     * Get comprehensive backlink quality analysis for a domain
     */
    async getBacklinkQuality(domain: string): Promise<BacklinkQualityResult | null> {
        if (!this.auth) {
            console.log('[DataForSEO] Skipping backlink quality - no credentials');
            return null;
        }

        try {
            console.log(`[DataForSEO] Getting backlink quality for: ${domain}`);

            // Get backlink summary
            const summaryResponse = await fetch(`${this.baseUrl}/backlinks/summary/live`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    target: domain,
                    include_subdomains: true,
                }]),
            });

            // Get top referring domains
            const referringResponse = await fetch(`${this.baseUrl}/backlinks/referring_domains/live`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    target: domain,
                    limit: 10,
                    order_by: ['rank,desc'],
                }]),
            });

            // Get anchor text distribution
            const anchorResponse = await fetch(`${this.baseUrl}/backlinks/anchors/live`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    target: domain,
                    limit: 20,
                    order_by: ['backlinks,desc'],
                }]),
            });

            const summaryData = await summaryResponse.json() as DataForSEOResponse;
            const referringData = await referringResponse.json() as DataForSEOResponse;
            const anchorData = await anchorResponse.json() as DataForSEOResponse;

            const summary = summaryData.tasks?.[0]?.result?.[0];
            if (!summary) {
                console.log(`[DataForSEO] No backlink data for ${domain}`);
                return null;
            }

            // Parse referring domains
            const topReferringDomains: ReferringDomain[] = (referringData.tasks?.[0]?.result || [])
                .slice(0, 10)
                .map((item: any) => ({
                    domain: item.domain || '',
                    domainRank: item.rank || 0,
                    backlinks: item.backlinks || 0,
                    firstSeen: item.first_seen || '',
                    isDoFollow: item.dofollow > 0,
                }));

            // Categorize anchor texts
            const anchorItems = anchorData.tasks?.[0]?.result || [];
            const totalAnchors = anchorItems.reduce((sum: number, item: any) => sum + (item.backlinks || 0), 0);

            const anchorCategories = {
                branded: 0,
                exact: 0,
                partial: 0,
                naked_url: 0,
                other: 0,
            };

            const domainWithoutTld = domain.replace(/\.[^.]+$/, '').toLowerCase();

            for (const item of anchorItems) {
                const anchor = (item.anchor || '').toLowerCase();
                const count = item.backlinks || 0;

                if (anchor.includes(domainWithoutTld) || anchor.includes(domain.toLowerCase())) {
                    anchorCategories.branded += count;
                } else if (anchor.match(/^https?:\/\//)) {
                    anchorCategories.naked_url += count;
                } else if (anchor.length > 50) {
                    anchorCategories.partial += count;
                } else {
                    anchorCategories.other += count;
                }
            }

            const anchorTextDistribution = Object.entries(anchorCategories).map(([type, count]) => ({
                type: type as 'branded' | 'exact' | 'partial' | 'naked_url' | 'other',
                percentage: totalAnchors > 0 ? Math.round((count / totalAnchors) * 100) : 0,
                count,
            }));

            // Calculate toxic/spam score (simplified heuristic based on available data)
            const spamSignals = [
                summary.broken_backlinks > summary.backlinks * 0.1 ? 20 : 0,
                summary.referring_domains_nofollow > summary.referring_domains * 0.7 ? 15 : 0,
                topReferringDomains.filter(d => d.domainRank < 10).length > 7 ? 15 : 0,
            ];
            const toxicScore = Math.min(100, spamSignals.reduce((a, b) => a + b, 0));
            const spamScore = Math.min(100, Math.round((summary.referring_domains_nofollow / (summary.referring_domains || 1)) * 50) + toxicScore / 2);

            const result: BacklinkQualityResult = {
                domain,
                domainRank: summary.rank || 0,
                totalBacklinks: summary.backlinks || 0,
                referringDomains: summary.referring_domains || 0,
                referringDomainsDofollow: summary.referring_domains - (summary.referring_domains_nofollow || 0),
                toxicScore,
                spamScore,
                newBacklinks30d: summary.new_backlinks || 0,
                lostBacklinks30d: summary.lost_backlinks || 0,
                topReferringDomains,
                anchorTextDistribution,
                linkTypes: {
                    text: summary.referring_links_types?.anchor || 0,
                    image: summary.referring_links_types?.image || 0,
                    redirect: summary.referring_links_types?.redirect || 0,
                    other: summary.referring_links_types?.meta || 0,
                },
            };

            console.log(`[DataForSEO] Backlink quality complete: ${result.referringDomains} referring domains, rank ${result.domainRank}`);
            return result;

        } catch (error) {
            console.error('[DataForSEO] Backlink quality failed:', error);
            return null;
        }
    }

    /**
     * Compare backlink profiles between two domains
     */
    async compareBacklinks(yourDomain: string, competitorDomain: string): Promise<BacklinkComparison> {
        console.log(`[DataForSEO] Comparing backlinks: ${yourDomain} vs ${competitorDomain}`);

        const [you, competitor] = await Promise.all([
            this.getBacklinkQuality(yourDomain),
            this.getBacklinkQuality(competitorDomain),
        ]);

        const insights: string[] = [];
        let winner: BacklinkComparison['winner'] = 'tie';

        if (!you && !competitor) {
            return { you: null, competitor: null, winner: 'insufficient-data', insights: ['Unable to fetch backlink data for either domain'] };
        }

        if (!you) {
            return { you: null, competitor, winner: 'competitor', insights: ['Unable to fetch your backlink profile'] };
        }

        if (!competitor) {
            return { you, competitor: null, winner: 'you', insights: ['Unable to fetch competitor backlink profile'] };
        }

        // Determine winner based on multiple factors
        let yourScore = 0;
        let competitorScore = 0;

        // Domain rank (weighted heavily)
        if (you.domainRank > competitor.domainRank) {
            yourScore += 30;
            insights.push(`Higher domain authority (${you.domainRank} vs ${competitor.domainRank})`);
        } else if (competitor.domainRank > you.domainRank) {
            competitorScore += 30;
            insights.push(`Competitor has higher domain authority (${competitor.domainRank} vs ${you.domainRank})`);
        }

        // Referring domains (important)
        if (you.referringDomains > competitor.referringDomains * 1.2) {
            yourScore += 20;
            insights.push(`More referring domains (${you.referringDomains.toLocaleString()} vs ${competitor.referringDomains.toLocaleString()})`);
        } else if (competitor.referringDomains > you.referringDomains * 1.2) {
            competitorScore += 20;
        }

        // Quality of referring domains
        const avgYourReferrerRank = you.topReferringDomains.reduce((sum, d) => sum + d.domainRank, 0) / (you.topReferringDomains.length || 1);
        const avgCompetitorReferrerRank = competitor.topReferringDomains.reduce((sum, d) => sum + d.domainRank, 0) / (competitor.topReferringDomains.length || 1);

        if (avgYourReferrerRank > avgCompetitorReferrerRank * 1.2) {
            yourScore += 15;
            insights.push('Higher quality referring domains on average');
        } else if (avgCompetitorReferrerRank > avgYourReferrerRank * 1.2) {
            competitorScore += 15;
        }

        // DoFollow ratio
        const yourDofollowRatio = you.referringDomainsDofollow / (you.referringDomains || 1);
        const competitorDofollowRatio = competitor.referringDomainsDofollow / (competitor.referringDomains || 1);

        if (yourDofollowRatio > competitorDofollowRatio + 0.1) {
            yourScore += 10;
            insights.push('Better dofollow link ratio');
        } else if (competitorDofollowRatio > yourDofollowRatio + 0.1) {
            competitorScore += 10;
        }

        // Toxic score (lower is better)
        if (you.toxicScore < competitor.toxicScore - 10) {
            yourScore += 10;
            insights.push('Lower toxic backlink score');
        } else if (competitor.toxicScore < you.toxicScore - 10) {
            competitorScore += 10;
            insights.push('Competitor has lower toxic backlinks');
        }

        // Growth trend
        const yourNetGrowth = you.newBacklinks30d - you.lostBacklinks30d;
        const competitorNetGrowth = competitor.newBacklinks30d - competitor.lostBacklinks30d;

        if (yourNetGrowth > competitorNetGrowth + 100) {
            yourScore += 10;
            insights.push('Stronger backlink growth momentum');
        } else if (competitorNetGrowth > yourNetGrowth + 100) {
            competitorScore += 10;
        }

        if (yourScore > competitorScore + 5) {
            winner = 'you';
        } else if (competitorScore > yourScore + 5) {
            winner = 'competitor';
        }

        return { you, competitor, winner, insights };
    }
}
