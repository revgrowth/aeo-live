import { Injectable } from '@nestjs/common';

// =============================================================================
// SERP FEATURE DETECTION SERVICE
// =============================================================================
// Detects presence in Google SERP features: Featured Snippets, PAA, Local Pack,
// Knowledge Panel, Image Carousel, Video Results, AI Overview, etc.

export interface SerpFeatures {
    // Traditional SERP features
    featuredSnippetCount: number; // Number of featured snippet appearances
    peopleAlsoAskCount: number; // PAA appearances
    localPackPresent: boolean;
    imageCarouselCount: number;
    videoResultsCount: number;
    knowledgePanelPresent: boolean;
    sitelinksPresent: boolean;

    // Rich results
    faqSchemaCount: number;
    reviewSchemaCount: number;
    productSchemaCount: number;
    recipeSchemaCount: number;
    eventSchemaCount: number;

    // New features
    aiOverviewMentioned: boolean; // Appears in Google's AI Overview

    // Raw data for display
    featuredSnippetKeywords: string[];
    paaQuestions: string[];
}

export interface SerpComparison {
    you: SerpFeatures;
    competitor: SerpFeatures;
    winner: 'you' | 'competitor' | 'tie';
    insights: string[];
    // Which features you're missing that competitor has
    featureGaps: string[];
}

@Injectable()
export class SerpFeatureService {
    private baseUrl = 'https://api.dataforseo.com/v3';
    private auth: string | null = null;

    constructor() {
        const login = process.env.DATAFORSEO_LOGIN;
        const password = process.env.DATAFORSEO_PASSWORD;

        if (login && password) {
            this.auth = Buffer.from(`${login}:${password}`).toString('base64');
            console.log('[SerpFeature] Service initialized with credentials');
        } else {
            console.log('[SerpFeature] No credentials - service will be limited');
        }
    }

    /**
     * Detect SERP features for a domain across its top keywords
     */
    async detectSerpFeatures(domain: string, keywords?: string[]): Promise<SerpFeatures> {
        const features: SerpFeatures = {
            featuredSnippetCount: 0,
            peopleAlsoAskCount: 0,
            localPackPresent: false,
            imageCarouselCount: 0,
            videoResultsCount: 0,
            knowledgePanelPresent: false,
            sitelinksPresent: false,
            faqSchemaCount: 0,
            reviewSchemaCount: 0,
            productSchemaCount: 0,
            recipeSchemaCount: 0,
            eventSchemaCount: 0,
            aiOverviewMentioned: false,
            featuredSnippetKeywords: [],
            paaQuestions: [],
        };

        if (!this.auth) {
            console.log('[SerpFeature] No credentials - returning empty features');
            return features;
        }

        try {
            console.log(`[SerpFeature] Detecting features for: ${domain}`);

            // If no keywords provided, get the domain's top ranking keywords first
            let checkKeywords = keywords;
            if (!checkKeywords || checkKeywords.length === 0) {
                checkKeywords = await this.getTopKeywords(domain, 10);
            }

            if (checkKeywords.length === 0) {
                console.log('[SerpFeature] No keywords to check');
                return features;
            }

            // Check SERP features for each keyword
            for (const keyword of checkKeywords.slice(0, 5)) { // Limit to 5 to control costs
                const serpData = await this.getSerpForKeyword(keyword, domain);
                if (serpData) {
                    this.aggregateFeatures(features, serpData, keyword);
                }
            }

            console.log(`[SerpFeature] Detection complete: ${features.featuredSnippetCount} snippets, ${features.peopleAlsoAskCount} PAA`);
            return features;

        } catch (error) {
            console.error('[SerpFeature] Detection failed:', error);
            return features;
        }
    }

    /**
     * Get top ranking keywords for a domain
     */
    private async getTopKeywords(domain: string, limit: number): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/dataforseo_labs/google/ranked_keywords/live`, {
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
                    order_by: ['keyword_data.keyword_info.search_volume,desc'],
                }]),
            });

            if (!response.ok) {
                return [];
            }

            const data = await response.json() as { tasks?: { result?: any[] }[] };
            const items = data.tasks?.[0]?.result || [];

            return items
                .filter((item: any) => item.keyword_data?.keyword)
                .map((item: any) => item.keyword_data.keyword)
                .slice(0, limit);

        } catch {
            return [];
        }
    }

    /**
     * Get SERP data for a specific keyword
     */
    private async getSerpForKeyword(keyword: string, targetDomain: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/serp/google/organic/live/advanced`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{
                    keyword: keyword,
                    location_code: 2840,
                    language_code: 'en',
                    device: 'desktop',
                    depth: 30,
                }]),
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json() as { tasks?: { result?: any[] }[] };
            return {
                items: data.tasks?.[0]?.result?.[0]?.items || [],
                targetDomain,
                keyword,
            };

        } catch {
            return null;
        }
    }

    /**
     * Aggregate SERP features from a keyword's result
     */
    private aggregateFeatures(features: SerpFeatures, serpData: any, keyword: string): void {
        const items = serpData.items || [];
        const targetDomain = serpData.targetDomain?.toLowerCase();

        for (const item of items) {
            const itemDomain = this.extractDomain(item.url || item.domain || '');
            const isTargetDomain = itemDomain.includes(targetDomain);

            switch (item.type) {
                case 'featured_snippet':
                    if (isTargetDomain) {
                        features.featuredSnippetCount++;
                        features.featuredSnippetKeywords.push(keyword);
                    }
                    break;

                case 'people_also_ask':
                    if (item.items) {
                        for (const paaItem of item.items) {
                            const paaDomain = this.extractDomain(paaItem.url || '');
                            if (paaDomain.includes(targetDomain)) {
                                features.peopleAlsoAskCount++;
                                features.paaQuestions.push(paaItem.title || paaItem.question || '');
                            }
                        }
                    }
                    break;

                case 'local_pack':
                    if (item.items?.some((local: any) =>
                        this.extractDomain(local.url || local.domain || '').includes(targetDomain)
                    )) {
                        features.localPackPresent = true;
                    }
                    break;

                case 'images':
                case 'image_carousel':
                    if (item.items?.some((img: any) =>
                        this.extractDomain(img.source_url || img.url || '').includes(targetDomain)
                    )) {
                        features.imageCarouselCount++;
                    }
                    break;

                case 'video':
                case 'video_carousel':
                    if (item.items?.some((vid: any) =>
                        this.extractDomain(vid.url || vid.source_url || '').includes(targetDomain)
                    )) {
                        features.videoResultsCount++;
                    }
                    break;

                case 'knowledge_graph':
                case 'knowledge_panel':
                    if (item.title?.toLowerCase().includes(targetDomain) ||
                        this.extractDomain(item.url || '').includes(targetDomain)) {
                        features.knowledgePanelPresent = true;
                    }
                    break;

                case 'organic':
                    if (isTargetDomain && item.sitelinks) {
                        features.sitelinksPresent = true;
                    }
                    // Check for rich results
                    if (isTargetDomain && item.faq) {
                        features.faqSchemaCount++;
                    }
                    if (isTargetDomain && item.rating) {
                        features.reviewSchemaCount++;
                    }
                    break;

                case 'ai_overview':
                case 'generative_ai':
                    // Check if domain is mentioned in AI overview
                    const aiContent = JSON.stringify(item).toLowerCase();
                    if (aiContent.includes(targetDomain)) {
                        features.aiOverviewMentioned = true;
                    }
                    break;
            }
        }
    }

    /**
     * Compare SERP features between two domains
     */
    async compare(yourDomain: string, competitorDomain: string, sharedKeywords?: string[]): Promise<SerpComparison> {
        console.log(`[SerpFeature] Comparing: ${yourDomain} vs ${competitorDomain}`);

        // Use shared keywords if available, otherwise use competitor's top keywords
        let keywords = sharedKeywords;
        if (!keywords || keywords.length === 0) {
            keywords = await this.getTopKeywords(competitorDomain, 5);
        }

        const [you, competitor] = await Promise.all([
            this.detectSerpFeatures(yourDomain, keywords),
            this.detectSerpFeatures(competitorDomain, keywords),
        ]);

        const insights: string[] = [];
        const featureGaps: string[] = [];
        let yourScore = 0;
        let competitorScore = 0;

        // Featured snippets (high value)
        if (you.featuredSnippetCount > competitor.featuredSnippetCount) {
            yourScore += 25;
            insights.push(`More featured snippets (${you.featuredSnippetCount} vs ${competitor.featuredSnippetCount})`);
        } else if (competitor.featuredSnippetCount > you.featuredSnippetCount) {
            competitorScore += 25;
            featureGaps.push('Featured snippets');
        }

        // People Also Ask
        if (you.peopleAlsoAskCount > competitor.peopleAlsoAskCount) {
            yourScore += 20;
            insights.push(`More PAA appearances (${you.peopleAlsoAskCount} vs ${competitor.peopleAlsoAskCount})`);
        } else if (competitor.peopleAlsoAskCount > you.peopleAlsoAskCount) {
            competitorScore += 20;
            featureGaps.push('People Also Ask');
        }

        // Local pack
        if (you.localPackPresent && !competitor.localPackPresent) {
            yourScore += 15;
            insights.push('Present in local pack');
        } else if (competitor.localPackPresent && !you.localPackPresent) {
            competitorScore += 15;
            featureGaps.push('Local pack presence');
        }

        // Knowledge panel
        if (you.knowledgePanelPresent && !competitor.knowledgePanelPresent) {
            yourScore += 20;
            insights.push('Has knowledge panel');
        } else if (competitor.knowledgePanelPresent && !you.knowledgePanelPresent) {
            competitorScore += 20;
            featureGaps.push('Knowledge panel');
        }

        // Sitelinks
        if (you.sitelinksPresent && !competitor.sitelinksPresent) {
            yourScore += 10;
            insights.push('Has sitelinks');
        } else if (competitor.sitelinksPresent && !you.sitelinksPresent) {
            competitorScore += 10;
            featureGaps.push('Sitelinks');
        }

        // AI Overview (new and valuable!)
        if (you.aiOverviewMentioned && !competitor.aiOverviewMentioned) {
            yourScore += 25;
            insights.push('Mentioned in Google AI Overview');
        } else if (competitor.aiOverviewMentioned && !you.aiOverviewMentioned) {
            competitorScore += 25;
            featureGaps.push('AI Overview presence');
        }

        // Video/Image carousels
        const yourMediaScore = you.imageCarouselCount + you.videoResultsCount;
        const competitorMediaScore = competitor.imageCarouselCount + competitor.videoResultsCount;
        if (yourMediaScore > competitorMediaScore) {
            yourScore += 10;
            insights.push('More visual SERP presence');
        } else if (competitorMediaScore > yourMediaScore) {
            competitorScore += 10;
        }

        // Rich results (FAQ, reviews)
        const yourRichScore = you.faqSchemaCount + you.reviewSchemaCount;
        const competitorRichScore = competitor.faqSchemaCount + competitor.reviewSchemaCount;
        if (yourRichScore > competitorRichScore) {
            yourScore += 10;
            insights.push('More rich result appearances');
        } else if (competitorRichScore > yourRichScore) {
            competitorScore += 10;
            featureGaps.push('Rich results (FAQ/Reviews)');
        }

        let winner: SerpComparison['winner'] = 'tie';
        if (yourScore > competitorScore + 5) {
            winner = 'you';
        } else if (competitorScore > yourScore + 5) {
            winner = 'competitor';
        }

        return {
            you,
            competitor,
            winner,
            insights,
            featureGaps,
        };
    }

    private extractDomain(url: string): string {
        try {
            const parsed = new URL(url);
            return parsed.hostname.replace(/^www\./, '').toLowerCase();
        } catch {
            return url.replace(/^www\./, '').toLowerCase();
        }
    }
}
