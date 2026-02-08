import { Injectable } from '@nestjs/common';

// =============================================================================
// SOCIAL PROOF METRICS SERVICE
// =============================================================================
// Aggregates social proof signals: reviews (Trustpilot, Google), social media
// presence, and trust indicators to measure brand credibility.

export interface ReviewMetrics {
    platform: 'trustpilot' | 'google' | 'yelp' | 'bbb' | 'other';
    rating: number; // 0-5 scale
    reviewCount: number;
    url?: string;
}

export interface SocialMediaMetrics {
    platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'tiktok';
    followers?: number;
    engagement?: number; // If available
    verified?: boolean;
    url?: string;
    present: boolean;
}

export interface SocialProofResult {
    domain: string;

    // Review platforms
    reviews: ReviewMetrics[];
    averageRating: number;
    totalReviews: number;

    // Social media presence
    socialMedia: SocialMediaMetrics[];
    totalFollowers: number;
    platformCount: number;

    // Trust indicators
    trustIndicators: {
        hasPrivacyPolicy: boolean;
        hasTermsOfService: boolean;
        hasContactPage: boolean;
        hasPhysicalAddress: boolean;
        hasPhoneNumber: boolean;
        hasSSL: boolean;
        bbbAccredited: boolean;
    };

    // Overall social proof score (0-100)
    socialProofScore: number;
}

export interface SocialProofComparison {
    you: SocialProofResult;
    competitor: SocialProofResult;
    winner: 'you' | 'competitor' | 'tie';
    insights: string[];
    gaps: string[];
}

@Injectable()
export class SocialProofService {
    constructor() {
        console.log('[SocialProof] Service initialized');
    }

    /**
     * Analyze social proof from scraped content and metadata
     * Note: This uses content analysis rather than API calls to keep costs down
     */
    async analyzeSocialProof(
        domain: string,
        content: string,
        html: string,
        metadata?: any
    ): Promise<SocialProofResult> {
        console.log(`[SocialProof] Analyzing: ${domain}`);

        const reviews = this.detectReviewPlatforms(content, html, domain);
        const socialMedia = this.detectSocialMedia(content, html);
        const trustIndicators = this.detectTrustIndicators(content, html);

        const totalReviews = reviews.reduce((sum, r) => sum + r.reviewCount, 0);
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating * r.reviewCount, 0) / (totalReviews || 1)
            : 0;

        const totalFollowers = socialMedia.reduce((sum, s) => sum + (s.followers || 0), 0);
        const platformCount = socialMedia.filter(s => s.present).length;

        // Calculate social proof score
        const socialProofScore = this.calculateSocialProofScore(
            reviews,
            socialMedia,
            trustIndicators
        );

        return {
            domain,
            reviews,
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews,
            socialMedia,
            totalFollowers,
            platformCount,
            trustIndicators,
            socialProofScore,
        };
    }

    /**
     * Compare social proof between two domains
     */
    async compare(
        yourDomain: string,
        yourContent: string,
        yourHtml: string,
        competitorDomain: string,
        competitorContent: string,
        competitorHtml: string
    ): Promise<SocialProofComparison> {
        console.log(`[SocialProof] Comparing: ${yourDomain} vs ${competitorDomain}`);

        const [you, competitor] = await Promise.all([
            this.analyzeSocialProof(yourDomain, yourContent, yourHtml),
            this.analyzeSocialProof(competitorDomain, competitorContent, competitorHtml),
        ]);

        const insights: string[] = [];
        const gaps: string[] = [];
        let yourScore = 0;
        let competitorScore = 0;

        // Compare reviews
        if (you.totalReviews > competitor.totalReviews * 1.5) {
            yourScore += 25;
            insights.push(`More reviews (${you.totalReviews} vs ${competitor.totalReviews})`);
        } else if (competitor.totalReviews > you.totalReviews * 1.5) {
            competitorScore += 25;
            gaps.push('Need more reviews');
        }

        if (you.averageRating > competitor.averageRating + 0.3) {
            yourScore += 20;
            insights.push(`Higher rating (${you.averageRating} vs ${competitor.averageRating})`);
        } else if (competitor.averageRating > you.averageRating + 0.3) {
            competitorScore += 20;
        }

        // Compare social presence
        if (you.platformCount > competitor.platformCount) {
            yourScore += 15;
            insights.push('Wider social media presence');
        } else if (competitor.platformCount > you.platformCount) {
            competitorScore += 15;
            const missingPlatforms = competitor.socialMedia
                .filter(cs => cs.present && !you.socialMedia.find(ys => ys.platform === cs.platform && ys.present))
                .map(cs => cs.platform);
            if (missingPlatforms.length > 0) {
                gaps.push(`Missing: ${missingPlatforms.join(', ')}`);
            }
        }

        if (you.totalFollowers > competitor.totalFollowers * 1.5) {
            yourScore += 15;
            insights.push('Larger social following');
        } else if (competitor.totalFollowers > you.totalFollowers * 1.5) {
            competitorScore += 15;
        }

        // Compare trust indicators
        const yourTrustScore = this.countTrustIndicators(you.trustIndicators);
        const compTrustScore = this.countTrustIndicators(competitor.trustIndicators);

        if (yourTrustScore > compTrustScore + 1) {
            yourScore += 15;
            insights.push('More trust indicators present');
        } else if (compTrustScore > yourTrustScore + 1) {
            competitorScore += 15;
            gaps.push('Add more trust signals (privacy policy, contact info, etc.)');
        }

        let winner: SocialProofComparison['winner'] = 'tie';
        if (yourScore > competitorScore + 10) {
            winner = 'you';
        } else if (competitorScore > yourScore + 10) {
            winner = 'competitor';
        }

        return { you, competitor, winner, insights, gaps };
    }

    private detectReviewPlatforms(content: string, html: string, domain: string): ReviewMetrics[] {
        const reviews: ReviewMetrics[] = [];
        const combined = (content + html).toLowerCase();

        // Trustpilot
        if (combined.includes('trustpilot')) {
            const rating = this.extractRating(combined, 'trustpilot');
            const count = this.extractReviewCount(combined, 'trustpilot');
            if (rating > 0 || count > 0) {
                reviews.push({
                    platform: 'trustpilot',
                    rating: rating || 4.0,
                    reviewCount: count || 0,
                    url: `https://www.trustpilot.com/review/${domain}`,
                });
            }
        }

        // Google Reviews
        if (combined.includes('google review') || combined.includes('google rating') || combined.match(/\d+\s*google\s*review/)) {
            const rating = this.extractRating(combined, 'google');
            const count = this.extractReviewCount(combined, 'google review');
            reviews.push({
                platform: 'google',
                rating: rating || 4.5,
                reviewCount: count || 0,
            });
        }

        // Yelp
        if (combined.includes('yelp')) {
            const rating = this.extractRating(combined, 'yelp');
            reviews.push({
                platform: 'yelp',
                rating: rating || 4.0,
                reviewCount: this.extractReviewCount(combined, 'yelp'),
            });
        }

        // BBB
        if (combined.includes('bbb') || combined.includes('better business bureau')) {
            reviews.push({
                platform: 'bbb',
                rating: combined.includes('a+') ? 5 : combined.includes('a-') ? 4.5 : 4,
                reviewCount: 0,
            });
        }

        return reviews;
    }

    private detectSocialMedia(content: string, html: string): SocialMediaMetrics[] {
        const platforms: SocialMediaMetrics[] = [];
        const combined = (content + html).toLowerCase();

        const platformPatterns: { platform: SocialMediaMetrics['platform']; patterns: RegExp[] }[] = [
            { platform: 'facebook', patterns: [/facebook\.com\/[a-z0-9._-]+/i, /fb\.com\/[a-z0-9._-]+/i] },
            { platform: 'twitter', patterns: [/twitter\.com\/[a-z0-9_]+/i, /x\.com\/[a-z0-9_]+/i] },
            { platform: 'linkedin', patterns: [/linkedin\.com\/company\/[a-z0-9-]+/i, /linkedin\.com\/in\/[a-z0-9-]+/i] },
            { platform: 'instagram', patterns: [/instagram\.com\/[a-z0-9._]+/i] },
            { platform: 'youtube', patterns: [/youtube\.com\/(c\/|channel\/|@)[a-z0-9_-]+/i] },
            { platform: 'tiktok', patterns: [/tiktok\.com\/@[a-z0-9._]+/i] },
        ];

        for (const { platform, patterns } of platformPatterns) {
            let present = false;
            let url: string | undefined;

            for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match) {
                    present = true;
                    url = match[0];
                    break;
                }
            }

            // Also check for platform mentions in content
            if (!present && combined.includes(platform)) {
                present = true;
            }

            // Try to extract follower counts from content
            const followers = this.extractFollowerCount(combined, platform);

            platforms.push({
                platform,
                present,
                url,
                followers: followers || undefined,
            });
        }

        return platforms;
    }

    private detectTrustIndicators(content: string, html: string): SocialProofResult['trustIndicators'] {
        const combined = (content + html).toLowerCase();

        return {
            hasPrivacyPolicy: combined.includes('privacy policy') || combined.includes('privacy-policy'),
            hasTermsOfService: combined.includes('terms of service') || combined.includes('terms-of-service') || combined.includes('terms and conditions'),
            hasContactPage: combined.includes('contact us') || combined.includes('contact-us') || combined.includes('get in touch'),
            hasPhysicalAddress: /\d{1,5}\s+[a-z\s]+,?\s*(suite|ste|#)?\s*\d*,?\s*[a-z\s]+,?\s*[a-z]{2}\s*\d{5}/i.test(combined),
            hasPhoneNumber: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(combined),
            hasSSL: html.includes('https://') || !html.includes('http://'),
            bbbAccredited: combined.includes('bbb accredited') || combined.includes('bbb a+'),
        };
    }

    private extractRating(text: string, platform: string): number {
        // Look for patterns like "4.5 out of 5", "4.5/5", "4.5 stars"
        const patterns = [
            new RegExp(`${platform}[^0-9]*(\\d+\\.?\\d*)\\s*(out of|/)\\s*5`, 'i'),
            new RegExp(`(\\d+\\.?\\d*)\\s*stars?[^0-9]*${platform}`, 'i'),
            new RegExp(`${platform}[^0-9]*(\\d+\\.?\\d*)\\s*stars?`, 'i'),
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const rating = parseFloat(match[1]);
                if (rating >= 0 && rating <= 5) {
                    return rating;
                }
            }
        }

        return 0;
    }

    private extractReviewCount(text: string, platform: string): number {
        const patterns = [
            new RegExp(`(\\d+,?\\d*)\\s*(${platform})?\\s*reviews?`, 'i'),
            new RegExp(`${platform}[^0-9]*(\\d+,?\\d*)\\s*reviews?`, 'i'),
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return parseInt(match[1].replace(',', ''), 10);
            }
        }

        return 0;
    }

    private extractFollowerCount(text: string, platform: string): number {
        const patterns = [
            new RegExp(`${platform}[^0-9]*(\\d+[,.]?\\d*)[km]?\\s*followers?`, 'i'),
            new RegExp(`(\\d+[,.]?\\d*)[km]?\\s*${platform}\\s*followers?`, 'i'),
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let count = parseFloat(match[1].replace(',', ''));
                const fullMatch = match[0].toLowerCase();
                if (fullMatch.includes('k')) count *= 1000;
                if (fullMatch.includes('m')) count *= 1000000;
                return Math.round(count);
            }
        }

        return 0;
    }

    private countTrustIndicators(indicators: SocialProofResult['trustIndicators']): number {
        return Object.values(indicators).filter(v => v === true).length;
    }

    private calculateSocialProofScore(
        reviews: ReviewMetrics[],
        socialMedia: SocialMediaMetrics[],
        trustIndicators: SocialProofResult['trustIndicators']
    ): number {
        let score = 0;

        // Reviews (up to 40 points)
        const totalReviews = reviews.reduce((sum, r) => sum + r.reviewCount, 0);
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating * r.reviewCount, 0) / (totalReviews || 1)
            : 0;

        score += Math.min(20, reviews.length * 5); // Up to 20 for having multiple platforms
        score += Math.min(10, totalReviews / 10); // Up to 10 for review count
        score += avgRating >= 4 ? 10 : avgRating >= 3 ? 5 : 0; // Up to 10 for good rating

        // Social media (up to 30 points)
        const present = socialMedia.filter(s => s.present).length;
        score += Math.min(15, present * 3); // Up to 15 for platform presence

        const totalFollowers = socialMedia.reduce((sum, s) => sum + (s.followers || 0), 0);
        score += Math.min(15, Math.log10(totalFollowers + 1) * 3); // Up to 15 for followers

        // Trust indicators (up to 30 points)
        const trustCount = this.countTrustIndicators(trustIndicators);
        score += Math.min(30, trustCount * 5); // Up to 30 for trust signals

        return Math.min(100, Math.round(score));
    }
}
