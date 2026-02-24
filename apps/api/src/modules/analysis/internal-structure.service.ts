import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';

// ============================================
// INTERFACES
// ============================================

export interface InternalStructureData {
    // Sitemap
    hasRobotsTxt: boolean;
    hasXmlSitemap: boolean;
    sitemapReferencedInRobots: boolean;
    sitemapUrlCount: number;

    // Links
    totalPagesDiscovered: number;
    totalInternalLinks: number;
    averageInternalLinksPerPage: number;
    maxClickDepth: number;
    orphanPageCount: number;

    // URLs
    averageUrlSegments: number;
    cleanUrlPercentage: number;
    parameterUrlPercentage: number;
    descriptiveSlugPercentage: number;
    hasConsistentHierarchy: boolean;

    // Schema
    schemaTypes: string[];
    hasJsonLd: boolean;
    hasMicrodata: boolean;
    localBusinessComplete: boolean;
    totalSchemaInstances: number;

    // Navigation
    mainNavItemCount: number;
    hasFooterNav: boolean;
    hasBreadcrumbs: boolean;
    hasBreadcrumbSchema: boolean;
}

export interface InternalStructureInsight {
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    action: string;
    impact: string;
}

export interface InternalStructurePillar {
    name: string;
    score: number;
}

export interface InternalStructureResult {
    data: InternalStructureData;
    overall: number;
    pillars: InternalStructurePillar[];
}

// ============================================
// SERVICE
// ============================================

const USER_AGENT = 'Mozilla/5.0 (compatible; AEOBot/1.0; +https://aeo.live)';
const FETCH_TIMEOUT = 10000;
const MAX_CRAWL_PAGES = 20;

@Injectable()
export class InternalStructureService {

    // --------------------------------------------------
    // PUBLIC: Analyze a site's internal structure
    // --------------------------------------------------

    async analyze(url: string): Promise<InternalStructureResult> {
        console.log(`[InternalStructure] Starting analysis for: ${url}`);
        const data = await this.collectData(url);
        const scored = this.score(data);
        return { data, ...scored };
    }

    // --------------------------------------------------
    // PUBLIC: Generate comparative insights
    // --------------------------------------------------

    generateInsights(
        yours: InternalStructureData,
        theirs: InternalStructureData,
    ): InternalStructureInsight[] {
        const insights: InternalStructureInsight[] = [];

        // Schema gap
        const yourSchemas = new Set(yours.schemaTypes);
        const theirSchemas = new Set(theirs.schemaTypes);
        const missing = [...theirSchemas].filter(s => !yourSchemas.has(s));
        if (missing.length > 0) {
            insights.push({
                severity: 'high',
                title: `Competitor uses ${missing.length} schema types you're missing`,
                detail: `They have ${missing.join(', ')} markup. Adding these helps AI systems understand your content.`,
                action: `Priority: add ${missing[0]} schema to your site.`,
                impact: '+5-10 points',
            });
        }

        // Sitemap gap
        if (!yours.hasXmlSitemap && theirs.hasXmlSitemap) {
            insights.push({
                severity: 'critical',
                title: 'You have no XML sitemap — competitor does',
                detail: 'AI crawlers and search engines may miss pages on your site.',
                action: 'Generate and submit an XML sitemap immediately.',
                impact: '+3-8 points',
            });
        }

        // Internal linking gap
        if (yours.averageInternalLinksPerPage < theirs.averageInternalLinksPerPage * 0.7) {
            insights.push({
                severity: 'high',
                title: `Weak internal linking: ${yours.averageInternalLinksPerPage.toFixed(1)} links/page vs their ${theirs.averageInternalLinksPerPage.toFixed(1)}`,
                detail: 'Low interlinking means AI and search engines discover less of your content.',
                action: 'Add contextual internal links on your top 10 pages.',
                impact: '+5-12 points',
            });
        }

        // Breadcrumbs
        if (!yours.hasBreadcrumbs && theirs.hasBreadcrumbs) {
            insights.push({
                severity: 'medium',
                title: "Competitor uses breadcrumb navigation — you don't",
                detail: 'Breadcrumbs help AI understand site hierarchy and improve search appearance.',
                action: 'Add breadcrumb nav with BreadcrumbList schema.',
                impact: '+2-5 points',
            });
        }

        // URL structure
        if (yours.cleanUrlPercentage < 70 && theirs.cleanUrlPercentage >= 80) {
            insights.push({
                severity: 'medium',
                title: `${Math.round(100 - yours.cleanUrlPercentage)}% of your URLs are not clean`,
                detail: 'Parameter-heavy URLs are harder for AI to parse and remember.',
                action: 'Implement clean URL rewrites for key pages.',
                impact: '+2-4 points',
            });
        }

        // Orphan pages
        if (yours.orphanPageCount > 3) {
            insights.push({
                severity: 'medium',
                title: `${yours.orphanPageCount} orphan pages found on your site`,
                detail: "These pages exist in your sitemap but aren't linked from other pages. AI may never find them.",
                action: 'Add internal links to these pages from related content.',
                impact: '+2-5 points',
            });
        }

        // No robots.txt
        if (!yours.hasRobotsTxt && theirs.hasRobotsTxt) {
            insights.push({
                severity: 'medium',
                title: 'Missing robots.txt — competitor has one',
                detail: 'robots.txt helps search engines understand how to crawl your site efficiently.',
                action: 'Create a robots.txt that references your sitemap.',
                impact: '+1-3 points',
            });
        }

        return insights.slice(0, 5);
    }

    // --------------------------------------------------
    // PRIVATE: Data collection
    // --------------------------------------------------

    private async collectData(url: string): Promise<InternalStructureData> {
        const baseUrl = new URL(url).origin;

        // Parallel fetch: robots.txt, sitemap, homepage HTML
        const [robotsResult, sitemapResult, homepageHtml] = await Promise.all([
            this.fetchText(`${baseUrl}/robots.txt`),
            this.fetchText(`${baseUrl}/sitemap.xml`),
            this.fetchText(url),
        ]);

        // --- A. Robots & Sitemap ---
        const hasRobotsTxt = robotsResult.ok;
        let sitemapReferencedInRobots = false;
        let sitemapUrl = `${baseUrl}/sitemap.xml`;

        if (hasRobotsTxt && robotsResult.text) {
            const sitemapMatch = robotsResult.text.match(/Sitemap:\s*(.+)/i);
            if (sitemapMatch) {
                sitemapReferencedInRobots = true;
                sitemapUrl = sitemapMatch[1].trim();
            }
        }

        // If /sitemap.xml failed but robots references a different URL, try that
        let sitemapText = sitemapResult.ok ? sitemapResult.text : null;
        if (!sitemapText && sitemapReferencedInRobots && sitemapUrl !== `${baseUrl}/sitemap.xml`) {
            const altSitemap = await this.fetchText(sitemapUrl);
            if (altSitemap.ok) sitemapText = altSitemap.text;
        }

        const hasXmlSitemap = !!sitemapText;
        const sitemapUrls = this.parseSitemapUrls(sitemapText || '');
        const sitemapUrlCount = sitemapUrls.length;

        // --- B. Internal link crawl ---
        const crawlResult = await this.crawlSite(url, homepageHtml.text || '', MAX_CRAWL_PAGES);

        // Orphan detection: sitemap URLs not discovered during crawl
        const crawledSet = new Set(crawlResult.crawledUrls.map(u => this.normalizeUrl(u)));
        const orphanPageCount = sitemapUrls.filter(
            su => !crawledSet.has(this.normalizeUrl(su)),
        ).length;

        // --- C. URL structure analysis ---
        const allUrls = [...new Set([...crawlResult.crawledUrls, ...sitemapUrls])];
        const urlAnalysis = this.analyzeUrls(allUrls, baseUrl);

        // --- D. Schema markup (from crawled pages) ---
        const schemaAnalysis = this.analyzeSchemas(crawlResult.htmlPages);

        // --- E. Navigation (from homepage) ---
        const navAnalysis = this.analyzeNavigation(homepageHtml.text || '');

        return {
            hasRobotsTxt,
            hasXmlSitemap,
            sitemapReferencedInRobots,
            sitemapUrlCount,

            totalPagesDiscovered: crawlResult.crawledUrls.length,
            totalInternalLinks: crawlResult.totalInternalLinks,
            averageInternalLinksPerPage: crawlResult.crawledUrls.length > 0
                ? crawlResult.totalInternalLinks / crawlResult.crawledUrls.length
                : 0,
            maxClickDepth: crawlResult.maxDepth,
            orphanPageCount,

            ...urlAnalysis,
            ...schemaAnalysis,
            ...navAnalysis,
        };
    }

    // --------------------------------------------------
    // PRIVATE: Lightweight BFS crawl
    // --------------------------------------------------

    private async crawlSite(
        startUrl: string,
        homepageHtml: string,
        maxPages: number,
    ): Promise<{
        crawledUrls: string[];
        totalInternalLinks: number;
        maxDepth: number;
        htmlPages: { url: string; html: string }[];
    }> {
        const origin = new URL(startUrl).origin;
        const visited = new Set<string>();
        const queue: { url: string; depth: number }[] = [];
        let totalInternalLinks = 0;
        let maxDepth = 0;
        const htmlPages: { url: string; html: string }[] = [];

        // Process homepage first
        const normalizedStart = this.normalizeUrl(startUrl);
        visited.add(normalizedStart);

        if (homepageHtml) {
            htmlPages.push({ url: startUrl, html: homepageHtml });
            const links = this.extractInternalLinks(homepageHtml, origin);
            totalInternalLinks += links.length;

            for (const link of links) {
                const norm = this.normalizeUrl(link);
                if (!visited.has(norm)) {
                    visited.add(norm);
                    queue.push({ url: link, depth: 1 });
                }
            }
        }

        // BFS crawl
        let crawled = 1; // homepage already processed
        while (queue.length > 0 && crawled < maxPages) {
            // Process up to 5 pages in parallel per batch
            const batch = queue.splice(0, Math.min(5, maxPages - crawled));
            const results = await Promise.allSettled(
                batch.map(async item => {
                    const result = await this.fetchText(item.url);
                    return { ...item, html: result.ok ? result.text : null };
                }),
            );

            for (const r of results) {
                if (r.status !== 'fulfilled' || !r.value.html) continue;
                crawled++;
                maxDepth = Math.max(maxDepth, r.value.depth);
                htmlPages.push({ url: r.value.url, html: r.value.html! });

                const links = this.extractInternalLinks(r.value.html!, origin);
                totalInternalLinks += links.length;

                for (const link of links) {
                    const norm = this.normalizeUrl(link);
                    if (!visited.has(norm) && queue.length + crawled < maxPages * 3) {
                        visited.add(norm);
                        queue.push({ url: link, depth: r.value.depth + 1 });
                    }
                }
            }
        }

        return {
            crawledUrls: htmlPages.map(p => p.url),
            totalInternalLinks,
            maxDepth,
            htmlPages,
        };
    }

    // --------------------------------------------------
    // PRIVATE: Parse links from HTML
    // --------------------------------------------------

    private extractInternalLinks(html: string, origin: string): string[] {
        const $ = cheerio.load(html);
        const links: string[] = [];
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (!href) return;
            try {
                const resolved = new URL(href, origin);
                if (resolved.origin === origin) {
                    // Skip anchors, assets, and non-page URLs
                    const path = resolved.pathname.toLowerCase();
                    if (
                        path.endsWith('.jpg') || path.endsWith('.png') ||
                        path.endsWith('.gif') || path.endsWith('.svg') ||
                        path.endsWith('.pdf') || path.endsWith('.css') ||
                        path.endsWith('.js') || path === ''
                    ) return;
                    resolved.hash = '';
                    links.push(resolved.href);
                }
            } catch { /* ignore malformed URLs */ }
        });
        return links;
    }

    // --------------------------------------------------
    // PRIVATE: Analyze URL patterns
    // --------------------------------------------------

    private analyzeUrls(urls: string[], baseUrl: string): {
        averageUrlSegments: number;
        cleanUrlPercentage: number;
        parameterUrlPercentage: number;
        descriptiveSlugPercentage: number;
        hasConsistentHierarchy: boolean;
    } {
        if (urls.length === 0) {
            return {
                averageUrlSegments: 0,
                cleanUrlPercentage: 100,
                parameterUrlPercentage: 0,
                descriptiveSlugPercentage: 100,
                hasConsistentHierarchy: true,
            };
        }

        let totalSegments = 0;
        let cleanCount = 0;
        let paramCount = 0;
        let descriptiveCount = 0;
        const pathPrefixes = new Set<string>();

        for (const u of urls) {
            try {
                const parsed = new URL(u);
                const segments = parsed.pathname.split('/').filter(Boolean);
                totalSegments += segments.length;

                // Clean URL: no query params, readable slugs
                const hasParams = parsed.search.length > 0;
                if (hasParams) paramCount++;
                const hasCleanSlug = segments.every(s => /^[a-z0-9-]+$/i.test(s));
                if (!hasParams && hasCleanSlug) cleanCount++;

                // Descriptive slug: contains real words (>2 chars), not IDs
                const lastSegment = segments[segments.length - 1] || '';
                const isDescriptive = lastSegment.length > 2 &&
                    /[a-z]{3,}/i.test(lastSegment) &&
                    !/^\d+$/.test(lastSegment);
                if (isDescriptive || segments.length === 0) descriptiveCount++;

                // Track parent paths for hierarchy check
                if (segments.length >= 2) {
                    pathPrefixes.add('/' + segments[0]);
                }
            } catch { /* skip */ }
        }

        // Consistent hierarchy: parent paths are reused (e.g. /services/*, /blog/*)
        const hasConsistentHierarchy = pathPrefixes.size >= 2 || urls.length < 5;

        return {
            averageUrlSegments: urls.length > 0 ? totalSegments / urls.length : 0,
            cleanUrlPercentage: (cleanCount / urls.length) * 100,
            parameterUrlPercentage: (paramCount / urls.length) * 100,
            descriptiveSlugPercentage: (descriptiveCount / urls.length) * 100,
            hasConsistentHierarchy,
        };
    }

    // --------------------------------------------------
    // PRIVATE: Schema analysis across pages
    // --------------------------------------------------

    private analyzeSchemas(pages: { url: string; html: string }[]): {
        schemaTypes: string[];
        hasJsonLd: boolean;
        hasMicrodata: boolean;
        localBusinessComplete: boolean;
        totalSchemaInstances: number;
    } {
        const allTypes = new Set<string>();
        let totalInstances = 0;
        let hasJsonLd = false;
        let hasMicrodata = false;
        let localBusinessComplete = false;

        // Analyze up to 6 pages (homepage + 5)
        for (const page of pages.slice(0, 6)) {
            const $ = cheerio.load(page.html);

            // JSON-LD
            $('script[type="application/ld+json"]').each((_, el) => {
                hasJsonLd = true;
                try {
                    const raw = $(el).html();
                    if (!raw) return;
                    const data = JSON.parse(raw);
                    const items = Array.isArray(data) ? data : [data];
                    for (const item of items) {
                        const type = item['@type'];
                        if (type) {
                            const types = Array.isArray(type) ? type : [type];
                            types.forEach((t: string) => allTypes.add(t));
                            totalInstances += types.length;
                        }
                        // Check LocalBusiness completeness
                        if (type === 'LocalBusiness' || type === 'Organization') {
                            if (item.name && item.address && (item.telephone || item.email)) {
                                localBusinessComplete = true;
                            }
                        }
                        // Handle @graph
                        if (item['@graph'] && Array.isArray(item['@graph'])) {
                            for (const graphItem of item['@graph']) {
                                if (graphItem['@type']) {
                                    const gtypes = Array.isArray(graphItem['@type']) ? graphItem['@type'] : [graphItem['@type']];
                                    gtypes.forEach((t: string) => allTypes.add(t));
                                    totalInstances += gtypes.length;
                                }
                            }
                        }
                    }
                } catch { /* invalid JSON-LD */ }
            });

            // Microdata
            const microdataElements = $('[itemtype]');
            if (microdataElements.length > 0) {
                hasMicrodata = true;
                microdataElements.each((_, el) => {
                    const itemtype = $(el).attr('itemtype') || '';
                    const typeName = itemtype.split('/').pop() || '';
                    if (typeName) {
                        allTypes.add(typeName);
                        totalInstances++;
                    }
                });
            }
        }

        return {
            schemaTypes: [...allTypes],
            hasJsonLd,
            hasMicrodata,
            localBusinessComplete,
            totalSchemaInstances: totalInstances,
        };
    }

    // --------------------------------------------------
    // PRIVATE: Navigation analysis (homepage)
    // --------------------------------------------------

    private analyzeNavigation(html: string): {
        mainNavItemCount: number;
        hasFooterNav: boolean;
        hasBreadcrumbs: boolean;
        hasBreadcrumbSchema: boolean;
    } {
        const $ = cheerio.load(html);

        // Main nav items
        let mainNavItemCount = 0;
        const navEl = $('nav').first();
        if (navEl.length) {
            mainNavItemCount = navEl.find('a').length;
        }
        // Fallback: count header links
        if (mainNavItemCount === 0) {
            mainNavItemCount = $('header a').length;
        }

        // Footer nav
        const hasFooterNav = $('footer a').length >= 3;

        // Breadcrumbs
        const hasBreadcrumbs = $('[aria-label*="breadcrumb" i]').length > 0 ||
            $('[class*="breadcrumb" i]').length > 0;

        // BreadcrumbList schema
        let hasBreadcrumbSchema = false;
        $('script[type="application/ld+json"]').each((_, el) => {
            const raw = $(el).html() || '';
            if (raw.includes('BreadcrumbList')) {
                hasBreadcrumbSchema = true;
            }
        });
        if (!hasBreadcrumbSchema) {
            hasBreadcrumbSchema = $('[itemtype*="BreadcrumbList"]').length > 0;
        }

        return {
            mainNavItemCount,
            hasFooterNav,
            hasBreadcrumbs,
            hasBreadcrumbSchema,
        };
    }

    // --------------------------------------------------
    // PRIVATE: Scoring
    // --------------------------------------------------

    private score(data: InternalStructureData): { overall: number; pillars: InternalStructurePillar[] } {
        // 1. Link Architecture (25%)
        let linkScore = 50;
        if (data.averageInternalLinksPerPage >= 8) linkScore += 20;
        else if (data.averageInternalLinksPerPage >= 5) linkScore += 12;
        else if (data.averageInternalLinksPerPage >= 3) linkScore += 5;
        else if (data.averageInternalLinksPerPage < 2) linkScore -= 15;

        if (data.maxClickDepth <= 3) linkScore += 15;
        else if (data.maxClickDepth <= 4) linkScore += 5;
        else if (data.maxClickDepth > 5) linkScore -= 10;

        const orphanRate = data.orphanPageCount / Math.max(data.totalPagesDiscovered, 1);
        if (orphanRate === 0) linkScore += 15;
        else if (orphanRate < 0.1) linkScore += 5;
        else if (orphanRate > 0.25) linkScore -= 10;
        linkScore = Math.max(0, Math.min(100, linkScore));

        // 2. URL Structure (20%)
        let urlScore = 50;
        if (data.cleanUrlPercentage >= 90) urlScore += 20;
        else if (data.cleanUrlPercentage >= 70) urlScore += 10;
        else if (data.cleanUrlPercentage < 50) urlScore -= 15;

        if (data.descriptiveSlugPercentage >= 80) urlScore += 15;
        else if (data.descriptiveSlugPercentage >= 60) urlScore += 5;
        else urlScore -= 5;

        if (data.averageUrlSegments <= 3) urlScore += 10;
        else if (data.averageUrlSegments > 5) urlScore -= 10;

        if (data.hasConsistentHierarchy) urlScore += 5;
        urlScore = Math.max(0, Math.min(100, urlScore));

        // 3. Navigation (20%)
        let navScore = 50;
        if (data.mainNavItemCount >= 4 && data.mainNavItemCount <= 8) navScore += 15;
        else if (data.mainNavItemCount > 12) navScore -= 10;
        else if (data.mainNavItemCount < 3) navScore -= 10;

        if (data.hasBreadcrumbs) navScore += 15;
        if (data.hasBreadcrumbSchema) navScore += 5;
        if (data.hasFooterNav) navScore += 10;

        if (data.hasXmlSitemap) navScore += 10;
        if (data.sitemapReferencedInRobots) navScore += 5;
        if (!data.hasRobotsTxt) navScore -= 10;
        navScore = Math.max(0, Math.min(100, navScore));

        // 4. Structured Data (20%)
        let schemaScore = 30;
        const typeCount = data.schemaTypes.length;

        if (typeCount >= 5) schemaScore += 30;
        else if (typeCount >= 3) schemaScore += 20;
        else if (typeCount >= 1) schemaScore += 10;
        else schemaScore -= 15;

        if (data.hasJsonLd) schemaScore += 10;
        if (data.localBusinessComplete) schemaScore += 15;
        if (data.schemaTypes.includes('FAQPage')) schemaScore += 5;
        if (data.schemaTypes.includes('Service')) schemaScore += 5;
        if (data.schemaTypes.includes('BreadcrumbList')) schemaScore += 5;
        schemaScore = Math.max(0, Math.min(100, schemaScore));

        // 5. Content Organization (15%)
        let contentScore = 50;
        if (data.sitemapUrlCount >= 30) contentScore += 15;
        else if (data.sitemapUrlCount >= 15) contentScore += 8;
        else if (data.sitemapUrlCount < 5) contentScore -= 10;

        // More pages discovered = more organized content
        if (data.totalPagesDiscovered >= 15) contentScore += 10;
        else if (data.totalPagesDiscovered >= 8) contentScore += 5;

        // Low orphan rate means good organization
        if (orphanRate === 0 && data.sitemapUrlCount > 0) contentScore += 10;
        else if (orphanRate > 0.3) contentScore -= 10;

        contentScore = Math.max(0, Math.min(100, contentScore));

        const overall = Math.round(
            linkScore * 0.25 +
            urlScore * 0.20 +
            navScore * 0.20 +
            schemaScore * 0.20 +
            contentScore * 0.15,
        );

        return {
            overall,
            pillars: [
                { name: 'Link Architecture', score: linkScore },
                { name: 'URL Structure', score: urlScore },
                { name: 'Navigation & IA', score: navScore },
                { name: 'Structured Data', score: schemaScore },
                { name: 'Content Organization', score: contentScore },
            ],
        };
    }

    // --------------------------------------------------
    // HELPERS
    // --------------------------------------------------

    private async fetchText(url: string): Promise<{ ok: boolean; text: string | null }> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': USER_AGENT,
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                redirect: 'follow',
            });
            clearTimeout(timeout);
            if (!response.ok) return { ok: false, text: null };
            const text = await response.text();
            return { ok: true, text };
        } catch {
            return { ok: false, text: null };
        }
    }

    private parseSitemapUrls(xml: string): string[] {
        const urls: string[] = [];
        // Handle sitemap index (has <sitemap> tags)
        const locMatches = xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi);
        for (const match of locMatches) {
            urls.push(match[1]);
        }
        return urls;
    }

    private normalizeUrl(url: string): string {
        try {
            const parsed = new URL(url);
            parsed.hash = '';
            // Remove trailing slash
            let path = parsed.pathname;
            if (path.length > 1 && path.endsWith('/')) {
                path = path.slice(0, -1);
            }
            return `${parsed.origin}${path}`.toLowerCase();
        } catch {
            return url.toLowerCase();
        }
    }
}
