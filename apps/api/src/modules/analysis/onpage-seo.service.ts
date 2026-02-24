import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';

// ============================================
// INTERFACES
// ============================================

export interface PageSeoData {
    url: string;
    title: string;
    titleLength: number;
    hasMetaDescription: boolean;
    metaDescriptionLength: number;
    metaDescription: string;
    h1Count: number;
    h1Content: string[];
    h2Count: number;
    h3PlusCount: number;
    hasProperHeadingHierarchy: boolean;
    totalImages: number;
    imagesWithAlt: number;
    imagesWithDescriptiveAlt: number;
    wordCount: number;
    hasCanonical: boolean;
    hasOpenGraph: boolean;
    hasTwitterCard: boolean;
    hasViewport: boolean;
    hasLangAttribute: boolean;
    internalLinksInContent: number;
    externalLinksInContent: number;
    hasLists: boolean;
    hasTables: boolean;
}

export interface OnPageSeoData {
    pagesAnalyzed: number;
    pages: PageSeoData[];

    // Aggregated stats
    avgTitleLength: number;
    pagesWithMetaDescription: number;
    pagesWithSingleH1: number;
    pagesWithProperHierarchy: number;
    avgImagesWithAlt: number; // percentage
    avgWordCount: number;
    pagesWithCanonical: number;
    pagesWithOpenGraph: number;
    duplicateTitles: number;
    duplicateDescriptions: number;
}

export interface OnPageSeoInsight {
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    action: string;
    impact: string;
}

export interface OnPageSeoPillar {
    name: string;
    score: number;
}

export interface OnPageSeoResult {
    data: OnPageSeoData;
    overall: number;
    pillars: OnPageSeoPillar[];
}

// ============================================
// SERVICE
// ============================================

const USER_AGENT = 'Mozilla/5.0 (compatible; AEOBot/1.0; +https://aeo.live)';
const FETCH_TIMEOUT = 10000;
const MAX_INTERIOR_PAGES = 5;

@Injectable()
export class OnPageSeoService {

    // --------------------------------------------------
    // PUBLIC: Analyze a site's on-page SEO
    // --------------------------------------------------

    async analyze(url: string): Promise<OnPageSeoResult> {
        console.log(`[OnPageSeo] Starting analysis for: ${url}`);
        const data = await this.collectData(url);
        const scored = this.score(data);
        return { data, ...scored };
    }

    // --------------------------------------------------
    // PUBLIC: Generate comparative insights
    // --------------------------------------------------

    generateInsights(
        yours: OnPageSeoData,
        theirs: OnPageSeoData,
    ): OnPageSeoInsight[] {
        const insights: OnPageSeoInsight[] = [];

        // Missing meta descriptions
        const yourMetaRate = yours.pagesWithMetaDescription / yours.pagesAnalyzed;
        const compMetaRate = theirs.pagesWithMetaDescription / theirs.pagesAnalyzed;
        if (yourMetaRate < 0.8) {
            const missing = yours.pagesAnalyzed - yours.pagesWithMetaDescription;
            insights.push({
                severity: yourMetaRate < 0.5 ? 'critical' : 'high',
                title: `${missing} of your pages are missing meta descriptions`,
                detail: compMetaRate >= 0.9
                    ? `Your competitor has descriptions on ${Math.round(compMetaRate * 100)}% of their pages.`
                    : 'Neither of you is doing this well — first-mover advantage is available.',
                action: `Write unique, compelling meta descriptions for all ${missing} pages.`,
                impact: '+3-8 points',
            });
        }

        // Duplicate titles
        if (yours.duplicateTitles > 0) {
            insights.push({
                severity: 'high',
                title: `${yours.duplicateTitles} pages share duplicate title tags`,
                detail: 'Duplicate titles confuse search engines about which page to rank for a query.',
                action: 'Write unique titles for each page targeting specific keywords.',
                impact: '+3-6 points',
            });
        }

        // H1 issues
        const multiH1 = yours.pages.filter(p => p.h1Count !== 1);
        if (multiH1.length > 0) {
            const hasMissing = multiH1.some(p => p.h1Count === 0);
            const hasMultiple = multiH1.some(p => p.h1Count > 1);
            insights.push({
                severity: 'medium',
                title: `${multiH1.length} pages have ${hasMissing ? 'missing' : ''}${hasMissing && hasMultiple ? ' or ' : ''}${hasMultiple ? 'multiple' : ''} H1 tags`,
                detail: 'Each page should have exactly one H1 that clearly describes the page topic.',
                action: 'Ensure every page has a single, descriptive H1 tag.',
                impact: '+2-5 points',
            });
        }

        // Image alt text gap
        const pagesWithImages = yours.pages.filter(p => p.totalImages > 0);
        if (pagesWithImages.length > 0) {
            const yourAltRate = pagesWithImages.reduce(
                (s, p) => s + p.imagesWithAlt / p.totalImages, 0,
            ) / pagesWithImages.length;
            const compPagesWithImages = theirs.pages.filter(p => p.totalImages > 0);
            const compAltRate = compPagesWithImages.length > 0
                ? compPagesWithImages.reduce(
                    (s, p) => s + p.imagesWithAlt / p.totalImages, 0,
                ) / compPagesWithImages.length
                : 1;

            if (yourAltRate < 0.8) {
                insights.push({
                    severity: 'medium',
                    title: `${Math.round((1 - yourAltRate) * 100)}% of your images are missing alt text`,
                    detail: compAltRate >= 0.9
                        ? 'Your competitor has alt text on nearly all their images — giving them an accessibility and SEO edge.'
                        : 'Alt text helps AI systems understand image content and improves accessibility.',
                    action: 'Add descriptive alt text to all images, especially on key service pages.',
                    impact: '+2-5 points',
                });
            }
        }

        // Content depth comparison
        if (yours.avgWordCount < theirs.avgWordCount * 0.7) {
            insights.push({
                severity: 'high',
                title: `Your pages average ${Math.round(yours.avgWordCount)} words vs competitor's ${Math.round(theirs.avgWordCount)}`,
                detail: 'Thinner content provides less value to users and gives AI less to work with when generating answers.',
                action: 'Expand your top service pages with more detailed, helpful content.',
                impact: '+5-10 points',
            });
        }

        // Missing Open Graph
        if (
            yours.pagesWithOpenGraph < yours.pagesAnalyzed * 0.5 &&
            theirs.pagesWithOpenGraph >= theirs.pagesAnalyzed * 0.8
        ) {
            insights.push({
                severity: 'low',
                title: "Competitor has Open Graph tags — you mostly don't",
                detail: 'OG tags control how your pages appear when shared on social media and in AI previews.',
                action: 'Add og:title, og:description, og:image to all key pages.',
                impact: '+1-3 points',
            });
        }

        // Missing canonical tags
        if (yours.pagesWithCanonical < yours.pagesAnalyzed * 0.5) {
            insights.push({
                severity: 'medium',
                title: 'Most of your pages are missing canonical tags',
                detail: 'Without canonical tags, search engines may split ranking signals across duplicate URLs.',
                action: 'Add self-referencing canonical tags to all pages.',
                impact: '+2-4 points',
            });
        }

        // Heading hierarchy issues
        const badHierarchy = yours.pages.filter(p => !p.hasProperHeadingHierarchy);
        if (badHierarchy.length >= yours.pagesAnalyzed * 0.5) {
            insights.push({
                severity: 'medium',
                title: `${badHierarchy.length} pages have broken heading hierarchy`,
                detail: 'Skipping heading levels (e.g., H1 → H4) hurts content structure for both users and AI.',
                action: 'Fix heading hierarchy to follow H1 → H2 → H3 order.',
                impact: '+2-4 points',
            });
        }

        return insights.slice(0, 5);
    }

    // --------------------------------------------------
    // PRIVATE: Data collection
    // --------------------------------------------------

    private async collectData(url: string): Promise<OnPageSeoData> {
        const origin = new URL(url).origin;

        // Fetch homepage
        const homepageHtml = await this.fetchHtml(url);
        if (!homepageHtml) {
            console.error(`[OnPageSeo] Failed to fetch homepage: ${url}`);
            return this.emptyData();
        }

        // Find key interior pages from navigation
        const interiorUrls = this.findKeyPages(homepageHtml, origin, url);
        console.log(`[OnPageSeo] Found ${interiorUrls.length} interior pages to analyze`);

        // Fetch interior pages in parallel
        const interiorResults = await Promise.allSettled(
            interiorUrls.slice(0, MAX_INTERIOR_PAGES).map(async (pageUrl) => {
                const html = await this.fetchHtml(pageUrl);
                return html ? { url: pageUrl, html } : null;
            }),
        );

        // Build page data
        const pages: PageSeoData[] = [];
        pages.push(this.analyzePage(url, homepageHtml, origin));

        for (const r of interiorResults) {
            if (r.status === 'fulfilled' && r.value) {
                pages.push(this.analyzePage(r.value.url, r.value.html, origin));
            }
        }

        // Aggregate
        return this.aggregate(pages);
    }

    // --------------------------------------------------
    // PRIVATE: Analyze a single page
    // --------------------------------------------------

    private analyzePage(url: string, html: string, origin: string): PageSeoData {
        const $ = cheerio.load(html);

        // Title
        const title = $('title').text().trim();
        const titleLength = title.length;

        // Meta description
        const metaDesc = $('meta[name="description"]').attr('content') || '';
        const hasMetaDescription = metaDesc.length > 0;
        const metaDescriptionLength = metaDesc.length;

        // Headings
        const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
        const h2Count = $('h2').length;
        const h3PlusCount = $('h3').length + $('h4').length + $('h5').length + $('h6').length;

        // Heading hierarchy check
        const hasProperHeadingHierarchy = this.checkHeadingHierarchy($);

        // Images
        const images = $('img');
        let totalImages = 0;
        let imagesWithAlt = 0;
        let imagesWithDescriptiveAlt = 0;

        images.each((_, el) => {
            const img = $(el);
            // Filter out tracking pixels (1x1, very small)
            const width = parseInt(img.attr('width') || '999', 10);
            const height = parseInt(img.attr('height') || '999', 10);
            if (width < 50 && height < 50) return;
            // Skip SVG data URIs and inline SVGs
            const src = img.attr('src') || '';
            if (src.startsWith('data:image/svg')) return;

            totalImages++;
            const alt = img.attr('alt');
            if (alt !== undefined && alt !== null) {
                imagesWithAlt++;
                // Descriptive = not empty, not just a filename, has real words
                if (
                    alt.length > 3 &&
                    !/^(img|image|photo|picture|banner|logo)\s*\d*$/i.test(alt) &&
                    !/\.\w{3,4}$/.test(alt) // not ending with .jpg, .png etc
                ) {
                    imagesWithDescriptiveAlt++;
                }
            }
        });

        // Content word count — prefer <main> or <article>, else body minus nav/header/footer
        let contentArea = $('main').text() || $('article').text();
        if (!contentArea || contentArea.trim().length < 50) {
            // Clone body and remove structural elements
            const bodyClone = $('body').clone();
            bodyClone.find('nav, header, footer, script, style, noscript').remove();
            contentArea = bodyClone.text();
        }
        const wordCount = contentArea.trim().split(/\s+/).filter(w => w.length > 0).length;

        // Technical tags
        const hasCanonical = $('link[rel="canonical"]').length > 0;
        const hasOpenGraph = $('meta[property="og:title"]').length > 0 ||
            $('meta[property="og:description"]').length > 0;
        const hasTwitterCard = $('meta[name="twitter:card"]').length > 0 ||
            $('meta[property="twitter:card"]').length > 0;
        const hasViewport = $('meta[name="viewport"]').length > 0;
        const hasLangAttribute = !!$('html').attr('lang');

        // Links in content area
        let internalLinksInContent = 0;
        let externalLinksInContent = 0;
        const contentEl = $('main, article, [role="main"]').first();
        const contentLinks = contentEl.length ? contentEl.find('a[href]') : $('body a[href]');
        contentLinks.each((_, el) => {
            const href = $(el).attr('href') || '';
            try {
                const resolved = new URL(href, origin);
                if (resolved.origin === origin) internalLinksInContent++;
                else externalLinksInContent++;
            } catch {
                if (href.startsWith('/') || href.startsWith('#')) internalLinksInContent++;
            }
        });

        // Structured content
        const hasLists = $('main ul, main ol, article ul, article ol').length > 0 ||
            $('body ul, body ol').length > 0;
        const hasTables = $('main table, article table').length > 0 ||
            $('body table').length > 0;

        return {
            url,
            title,
            titleLength,
            hasMetaDescription,
            metaDescriptionLength,
            metaDescription: metaDesc,
            h1Count: h1s.length,
            h1Content: h1s,
            h2Count,
            h3PlusCount,
            hasProperHeadingHierarchy,
            totalImages,
            imagesWithAlt,
            imagesWithDescriptiveAlt,
            wordCount,
            hasCanonical,
            hasOpenGraph,
            hasTwitterCard,
            hasViewport,
            hasLangAttribute,
            internalLinksInContent,
            externalLinksInContent,
            hasLists,
            hasTables,
        };
    }

    // --------------------------------------------------
    // PRIVATE: Check heading hierarchy (H1→H2→H3, no skipping)
    // --------------------------------------------------

    private checkHeadingHierarchy($: cheerio.CheerioAPI): boolean {
        const headings = $('h1, h2, h3, h4, h5, h6')
            .map((_, el) => {
                const tag = ((el as any).tagName || (el as any).name || '').toLowerCase();
                return parseInt(tag.replace('h', ''), 10);
            })
            .get()
            .filter((n: number) => !isNaN(n));

        if (headings.length <= 1) return true;

        for (let i = 1; i < headings.length; i++) {
            // A jump of more than 1 level (e.g. H1 → H3) is a hierarchy break
            if (headings[i] > headings[i - 1] + 1) {
                return false;
            }
        }
        return true;
    }

    // --------------------------------------------------
    // PRIVATE: Find key pages from homepage nav
    // --------------------------------------------------

    private findKeyPages(html: string, origin: string, currentUrl: string): string[] {
        const $ = cheerio.load(html);
        const links: string[] = [];
        const seen = new Set<string>();
        const normalizedCurrent = this.normalizeUrl(currentUrl);
        seen.add(normalizedCurrent);

        // Prioritize nav + header links
        const navLinks = $('nav a[href], header a[href]');
        navLinks.each((_, el) => {
            const href = $(el).attr('href');
            if (!href) return;
            try {
                const resolved = new URL(href, origin);
                if (resolved.origin !== origin) return;
                const path = resolved.pathname.toLowerCase();
                // Skip assets
                if (/\.(jpg|png|gif|svg|pdf|css|js|ico|woff|woff2)$/i.test(path)) return;
                // Skip anchors to same page
                if (resolved.pathname === '/' && resolved.hash) return;

                const norm = this.normalizeUrl(resolved.href);
                if (!seen.has(norm)) {
                    seen.add(norm);
                    links.push(resolved.href);
                }
            } catch { /* skip */ }
        });

        return links.slice(0, MAX_INTERIOR_PAGES);
    }

    // --------------------------------------------------
    // PRIVATE: Aggregate page data
    // --------------------------------------------------

    private aggregate(pages: PageSeoData[]): OnPageSeoData {
        const n = pages.length;
        if (n === 0) return this.emptyData();

        // Duplicate titles
        const titleCounts = new Map<string, number>();
        for (const p of pages) {
            if (p.title) {
                titleCounts.set(p.title, (titleCounts.get(p.title) || 0) + 1);
            }
        }
        const duplicateTitles = [...titleCounts.values()].filter(c => c > 1).length;

        // Duplicate descriptions
        const descCounts = new Map<string, number>();
        for (const p of pages) {
            if (p.metaDescription) {
                descCounts.set(p.metaDescription, (descCounts.get(p.metaDescription) || 0) + 1);
            }
        }
        const duplicateDescriptions = [...descCounts.values()].filter(c => c > 1).length;

        // Alt rate
        const pagesWithImgs = pages.filter(p => p.totalImages > 0);
        const avgImagesWithAlt = pagesWithImgs.length > 0
            ? pagesWithImgs.reduce((s, p) => s + (p.imagesWithAlt / p.totalImages) * 100, 0) / pagesWithImgs.length
            : 100;

        return {
            pagesAnalyzed: n,
            pages,
            avgTitleLength: pages.reduce((s, p) => s + p.titleLength, 0) / n,
            pagesWithMetaDescription: pages.filter(p => p.hasMetaDescription).length,
            pagesWithSingleH1: pages.filter(p => p.h1Count === 1).length,
            pagesWithProperHierarchy: pages.filter(p => p.hasProperHeadingHierarchy).length,
            avgImagesWithAlt,
            avgWordCount: pages.reduce((s, p) => s + p.wordCount, 0) / n,
            pagesWithCanonical: pages.filter(p => p.hasCanonical).length,
            pagesWithOpenGraph: pages.filter(p => p.hasOpenGraph).length,
            duplicateTitles,
            duplicateDescriptions,
        };
    }

    // --------------------------------------------------
    // PRIVATE: Scoring
    // --------------------------------------------------

    private score(data: OnPageSeoData): { overall: number; pillars: OnPageSeoPillar[] } {
        const pageCount = data.pagesAnalyzed;
        if (pageCount === 0) {
            return {
                overall: 0,
                pillars: [
                    { name: 'Title Tags', score: 0 },
                    { name: 'Meta Descriptions', score: 0 },
                    { name: 'Heading Structure', score: 0 },
                    { name: 'Image Optimization', score: 0 },
                    { name: 'Content & Technical', score: 0 },
                ],
            };
        }

        // 1. Title Tags (20%)
        let titleScore = 50;
        if (data.avgTitleLength >= 30 && data.avgTitleLength <= 60) titleScore += 20;
        else if (data.avgTitleLength >= 20 && data.avgTitleLength <= 70) titleScore += 10;
        else titleScore -= 10;

        if (data.duplicateTitles === 0) titleScore += 15;
        else titleScore -= data.duplicateTitles * 5;

        const titledPages = data.pages.filter(p => p.title && p.titleLength > 0).length;
        if (titledPages === pageCount) titleScore += 15;
        else titleScore -= 10;
        titleScore = Math.max(0, Math.min(100, titleScore));

        // 2. Meta Descriptions (15%)
        let metaScore = 40;
        const metaRate = data.pagesWithMetaDescription / pageCount;
        if (metaRate >= 1) metaScore += 25;
        else if (metaRate >= 0.8) metaScore += 15;
        else if (metaRate < 0.5) metaScore -= 15;

        const metaPages = data.pages.filter(p => p.hasMetaDescription);
        const avgDescLen = metaPages.length > 0
            ? metaPages.reduce((sum, p) => sum + p.metaDescriptionLength, 0) / metaPages.length
            : 0;
        if (avgDescLen >= 120 && avgDescLen <= 160) metaScore += 20;
        else if (avgDescLen >= 80 && avgDescLen <= 180) metaScore += 10;

        if (data.duplicateDescriptions === 0) metaScore += 15;
        else metaScore -= data.duplicateDescriptions * 5;
        metaScore = Math.max(0, Math.min(100, metaScore));

        // 3. Heading Structure (20%)
        let headingScore = 50;
        const singleH1Rate = data.pagesWithSingleH1 / pageCount;
        if (singleH1Rate >= 1) headingScore += 20;
        else if (singleH1Rate >= 0.8) headingScore += 10;
        else headingScore -= 15;

        const hierarchyRate = data.pagesWithProperHierarchy / pageCount;
        if (hierarchyRate >= 0.9) headingScore += 15;
        else if (hierarchyRate >= 0.7) headingScore += 5;
        else headingScore -= 10;

        const avgH2 = data.pages.reduce((s, p) => s + p.h2Count, 0) / pageCount;
        if (avgH2 >= 3) headingScore += 15;
        else if (avgH2 >= 1) headingScore += 5;
        else headingScore -= 5;
        headingScore = Math.max(0, Math.min(100, headingScore));

        // 4. Image Optimization (15%)
        let imageScore = 60;
        const pagesWithImgs = data.pages.filter(p => p.totalImages > 0);
        if (pagesWithImgs.length > 0) {
            const avgAltRate = pagesWithImgs.reduce(
                (sum, p) => sum + p.imagesWithAlt / p.totalImages, 0,
            ) / pagesWithImgs.length;

            if (avgAltRate >= 0.95) imageScore += 25;
            else if (avgAltRate >= 0.8) imageScore += 15;
            else if (avgAltRate >= 0.5) imageScore += 5;
            else imageScore -= 20;

            const descriptiveRate = pagesWithImgs.reduce(
                (sum, p) => sum + p.imagesWithDescriptiveAlt / Math.max(p.totalImages, 1), 0,
            ) / pagesWithImgs.length;
            if (descriptiveRate >= 0.8) imageScore += 15;
            else if (descriptiveRate < 0.3) imageScore -= 10;
        }
        imageScore = Math.max(0, Math.min(100, imageScore));

        // 5. Content & Technical (30%)
        let contentScore = 50;
        if (data.avgWordCount >= 800) contentScore += 15;
        else if (data.avgWordCount >= 400) contentScore += 8;
        else if (data.avgWordCount < 200) contentScore -= 15;

        const canonicalRate = data.pagesWithCanonical / pageCount;
        if (canonicalRate >= 0.9) contentScore += 10;
        else if (canonicalRate < 0.5) contentScore -= 10;

        const ogRate = data.pagesWithOpenGraph / pageCount;
        if (ogRate >= 0.8) contentScore += 10;
        else if (ogRate < 0.3) contentScore -= 5;

        const structuredRate = data.pages.filter(p => p.hasLists || p.hasTables).length / pageCount;
        if (structuredRate >= 0.5) contentScore += 10;

        const avgContextLinks = data.pages.reduce((s, p) => s + p.internalLinksInContent, 0) / pageCount;
        if (avgContextLinks >= 5) contentScore += 10;
        else if (avgContextLinks >= 2) contentScore += 5;
        else contentScore -= 5;
        contentScore = Math.max(0, Math.min(100, contentScore));

        const overall = Math.round(
            titleScore * 0.20 +
            metaScore * 0.15 +
            headingScore * 0.20 +
            imageScore * 0.15 +
            contentScore * 0.30,
        );

        return {
            overall,
            pillars: [
                { name: 'Title Tags', score: titleScore },
                { name: 'Meta Descriptions', score: metaScore },
                { name: 'Heading Structure', score: headingScore },
                { name: 'Image Optimization', score: imageScore },
                { name: 'Content & Technical', score: contentScore },
            ],
        };
    }

    // --------------------------------------------------
    // HELPERS
    // --------------------------------------------------

    private async fetchHtml(url: string): Promise<string | null> {
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
            if (!response.ok) return null;
            return await response.text();
        } catch {
            return null;
        }
    }

    private normalizeUrl(url: string): string {
        try {
            const parsed = new URL(url);
            parsed.hash = '';
            let path = parsed.pathname;
            if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
            return `${parsed.origin}${path}`.toLowerCase();
        } catch {
            return url.toLowerCase();
        }
    }

    private emptyData(): OnPageSeoData {
        return {
            pagesAnalyzed: 0,
            pages: [],
            avgTitleLength: 0,
            pagesWithMetaDescription: 0,
            pagesWithSingleH1: 0,
            pagesWithProperHierarchy: 0,
            avgImagesWithAlt: 0,
            avgWordCount: 0,
            pagesWithCanonical: 0,
            pagesWithOpenGraph: 0,
            duplicateTitles: 0,
            duplicateDescriptions: 0,
        };
    }
}
