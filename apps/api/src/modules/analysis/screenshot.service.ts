import { Injectable } from '@nestjs/common';

/**
 * Screenshot Service - Captures full-page screenshots of websites
 * Uses thum.io free tier (no API key required, up to 1000/month)
 */
@Injectable()
export class ScreenshotService {
    // thum.io provides free website screenshots
    // Format: https://image.thum.io/get/width/URL
    private baseUrl = 'https://image.thum.io/get';

    /**
     * Generate a screenshot URL for a given website
     * @param url The website URL to screenshot
     * @param width Optional width (default 1280)
     * @returns The screenshot URL (can be used directly as img src)
     */
    getScreenshotUrl(url: string, width: number = 1280): string {
        // Clean the URL
        const cleanUrl = url.startsWith('http') ? url : `https://${url}`;

        // thum.io options:
        // /width/{px} - set width
        // /noanimate - static screenshot
        // /crop/{height} - crop to specific height
        // /maxAge/{seconds} - cache duration
        // /fullpage - capture full page (premium only)

        // Free tier: viewport screenshot at specified width
        return `${this.baseUrl}/width/${width}/noanimate/maxAge/86400/${encodeURIComponent(cleanUrl)}`;
    }

    /**
     * Generate a full-page screenshot URL (uses screenshotmachine.com as alternative)
     * @param url The website URL to screenshot
     * @returns The screenshot URL
     */
    getFullPageScreenshotUrl(url: string): string {
        // Alternative free service that captures more of the page
        // Using microlink.io screenshot API (has generous free tier)
        const cleanUrl = url.startsWith('http') ? url : `https://${url}`;

        // Microlink screenshot URL
        // Provides 50 free requests/day which should be enough for most use cases
        return `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
    }

    /**
     * Get both screenshot URLs (primary + fallback)
     */
    getScreenshotUrls(url: string): { primary: string; fallback: string } {
        return {
            primary: this.getScreenshotUrl(url),
            fallback: this.getThumbnailUrl(url)
        };
    }

    /**
     * Simple thumbnail URL using Google's PageSpeed API screenshot
     * (Free and reliable, but lower quality)
     */
    getThumbnailUrl(url: string): string {
        const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
        // Uses Google's PageSpeed Insights which returns a screenshot as part of the analysis
        return `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(cleanUrl)}&screenshot=true`;
    }
}
