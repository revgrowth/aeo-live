import { Injectable } from '@nestjs/common';

export interface FirecrawlDocument {
    markdown: string;
    html?: string;
    metadata: {
        title?: string;
        description?: string;
        language?: string;
        ogImage?: string;
        favicon?: string;
        [key: string]: any;
    };
    url: string;
}

export interface FirecrawlScrapeResult {
    success: boolean;
    data?: FirecrawlDocument;
    error?: string;
}

@Injectable()
export class FirecrawlService {
    private baseUrl = 'https://api.firecrawl.dev/v1';
    private apiKey: string | null = null;

    constructor() {
        this.apiKey = process.env.FIRECRAWL_API_KEY || null;
        if (this.apiKey) {
            console.log('[Firecrawl] Client initialized');
        } else {
            console.warn('[Firecrawl] No API key found - using fallback scraping');
        }
    }

    /**
     * Check if service is available
     */
    isAvailable(): boolean {
        return this.apiKey !== null;
    }

    /**
     * Scrape a single URL with JS rendering
     */
    async scrape(url: string): Promise<FirecrawlScrapeResult> {
        if (!this.apiKey) {
            return this.fallbackScrape(url);
        }

        try {
            console.log(`[Firecrawl] Scraping: ${url}`);

            const response = await fetch(`${this.baseUrl}/scrape`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    formats: ['markdown', 'html'],
                    onlyMainContent: true,
                    waitFor: 2000, // Wait for JS to render
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Firecrawl] API error: ${response.status}`, errorText);
                return { success: false, error: `Firecrawl API error: ${response.status}` };
            }

            const result = await response.json() as { success: boolean; data?: FirecrawlDocument; error?: string };

            if (result.success && result.data) {
                console.log(`[Firecrawl] Successfully scraped: ${result.data.metadata?.title || url}`);
                return { success: true, data: result.data };
            }

            return { success: false, error: result.error || 'Unknown error' };

        } catch (error) {
            console.error('[Firecrawl] Scrape failed:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Scrape multiple URLs (batch) - useful for comparing your site vs competitor
     */
    async scrapeMultiple(urls: string[]): Promise<Map<string, FirecrawlScrapeResult>> {
        const results = new Map<string, FirecrawlScrapeResult>();

        // Process in parallel (max 3 concurrent)
        const chunks = [];
        for (let i = 0; i < urls.length; i += 3) {
            chunks.push(urls.slice(i, i + 3));
        }

        for (const chunk of chunks) {
            const promises = chunk.map(async (url) => {
                const result = await this.scrape(url);
                results.set(url, result);
            });
            await Promise.all(promises);
        }

        return results;
    }

    /**
     * Extract key SEO elements from scraped content
     */
    extractSEOElements(doc: FirecrawlDocument): {
        title: string;
        description: string;
        headings: { h1: string[]; h2: string[]; h3: string[] };
        wordCount: number;
        hasSchema: boolean;
        images: number;
        links: { internal: number; external: number };
    } {
        const html = doc.html || '';
        const markdown = doc.markdown || '';

        // Extract headings from markdown
        const h1Matches = markdown.match(/^# .+$/gm) || [];
        const h2Matches = markdown.match(/^## .+$/gm) || [];
        const h3Matches = markdown.match(/^### .+$/gm) || [];

        // Count words in markdown (excluding code blocks)
        const textOnly = markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
        const wordCount = textOnly.split(/\s+/).filter(w => w.length > 0).length;

        // Check for schema markup
        const hasSchema = html.includes('application/ld+json') || html.includes('itemtype=');

        // Count images (from markdown)
        const images = (markdown.match(/!\[.*?\]\(.*?\)/g) || []).length;

        // Links (simplified - would need full HTML parsing for accurate count)
        const allLinks = markdown.match(/\[.*?\]\((.*?)\)/g) || [];
        let domain = '';
        try {
            domain = doc.url ? new URL(doc.url).hostname : '';
        } catch {
            domain = '';
        }
        let internal = 0;
        let external = 0;
        allLinks.forEach(link => {
            const urlMatch = link.match(/\((.*?)\)/);
            if (urlMatch) {
                const linkUrl = urlMatch[1];
                if (linkUrl.startsWith('/') || (domain && linkUrl.includes(domain))) {
                    internal++;
                } else if (linkUrl.startsWith('http')) {
                    external++;
                }
            }
        });

        return {
            title: doc.metadata.title || '',
            description: doc.metadata.description || '',
            headings: {
                h1: h1Matches.map(h => h.replace(/^# /, '')),
                h2: h2Matches.map(h => h.replace(/^## /, '')),
                h3: h3Matches.map(h => h.replace(/^### /, '')),
            },
            wordCount,
            hasSchema,
            images,
            links: { internal, external },
        };
    }

    /**
     * Fallback scraping when Firecrawl is not available
     */
    private async fallbackScrape(url: string): Promise<FirecrawlScrapeResult> {
        try {
            console.log(`[Firecrawl] Using fallback scrape for: ${url}`);

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; AEOBot/1.0; +https://aeo.live)',
                    'Accept': 'text/html,application/xhtml+xml',
                },
            });
            clearTimeout(timeout);

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }

            const html = await response.text();

            // Extract basic metadata
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);

            // Convert HTML to basic markdown (simplified)
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            const bodyHtml = bodyMatch?.[1] || html;
            const markdown = bodyHtml
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            return {
                success: true,
                data: {
                    markdown: markdown.substring(0, 10000),
                    html,
                    metadata: {
                        title: titleMatch?.[1] || '',
                        description: descMatch?.[1] || '',
                    },
                    url,
                },
            };

        } catch (error) {
            console.error('[Firecrawl] Fallback scrape failed:', error);
            return { success: false, error: String(error) };
        }
    }
}
