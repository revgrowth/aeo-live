import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// E-E-A-T SIGNAL DETECTION SERVICE
// =============================================================================
// Analyzes content for Google's E-E-A-T signals:
// - Experience: First-hand knowledge and practical examples
// - Expertise: Credentials, qualifications, specialized knowledge
// - Authoritativeness: Recognition, citations, industry standing
// - Trustworthiness: Transparency, accuracy, security signals
// =============================================================================

export interface AuthorInfo {
    name: string;
    bio?: string;
    credentials: string[]; // PhD, Certified, CPA, etc.
    socialProfiles: string[];
    isVerified: boolean;
}

export interface EEATSignals {
    // Overall score
    overallScore: number; // 0-100

    // Experience signals
    experience: {
        score: number;
        firstPersonNarratives: number;
        caseStudies: number;
        practicalExamples: number;
        beforeAfterContent: boolean;
        clientTestimonials: number;
        evidence: string[];
    };

    // Expertise signals
    expertise: {
        score: number;
        authorsDetected: AuthorInfo[];
        credentialsFound: string[];
        technicalDepth: number; // 0-100
        specializationClarity: number; // 0-100
        industryTerminology: number; // count
        evidence: string[];
    };

    // Authoritativeness signals
    authoritativeness: {
        score: number;
        wikipediaPresence: boolean;
        wikidataEntity: boolean;
        pressmentions: number;
        industryAwards: string[];
        partnerships: string[];
        mediaCoverage: boolean;
        evidence: string[];
    };

    // Trustworthiness signals
    trustworthiness: {
        score: number;
        contactInfoVisible: boolean;
        physicalAddress: boolean;
        phoneNumber: boolean;
        privacyPolicy: boolean;
        termsOfService: boolean;
        secureConnection: boolean; // https
        reviewsIntegration: boolean;
        bbbRating?: string;
        trustpilotScore?: number;
        transparencyScore: number; // 0-100
        evidence: string[];
    };

    // Comparative analysis
    comparison?: {
        yourEEATScore: number;
        competitorEEATScore: number;
        yourStrengths: string[];
        competitorStrengths: string[];
        recommendations: string[];
    };
}

export interface EEATAnalysisInput {
    content: string;
    html?: string;
    url: string;
    metadata?: Record<string, any>;
}

@Injectable()
export class EEATService {
    private anthropic: Anthropic | null = null;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.anthropic = new Anthropic({ apiKey });
            console.log('[EEAT] Service initialized');
        } else {
            console.warn('[EEAT] No Claude API key - E-E-A-T analysis unavailable');
        }
    }

    isAvailable(): boolean {
        return this.anthropic !== null;
    }

    /**
     * Analyze content for Experience signals
     */
    private async analyzeExperience(content: string, url: string): Promise<EEATSignals['experience']> {
        if (!this.anthropic) {
            return this.getDefaultExperience();
        }

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `Analyze this website content for EXPERIENCE signals (the first "E" in E-E-A-T).
Look for evidence of first-hand, practical experience with the topic.

Website: ${url}
Content:
${content.substring(0, 6000)}

Evaluate:
1. First-person narratives ("I have", "We worked with", "In my experience")
2. Case studies with specific details (names, dates, outcomes)
3. Practical examples and how-to content
4. Before/after demonstrations
5. Client testimonials with specifics
6. Evidence of hands-on work

Return ONLY valid JSON:
{
    "score": 0-100,
    "firstPersonNarratives": <count>,
    "caseStudies": <count>,
    "practicalExamples": <count>,
    "beforeAfterContent": true/false,
    "clientTestimonials": <count>,
    "evidence": ["specific quote or finding 1", "finding 2", "finding 3"]
}`
                }]
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('[EEAT] Experience analysis failed:', error);
        }

        return this.getDefaultExperience();
    }

    private getDefaultExperience(): EEATSignals['experience'] {
        return {
            score: 50,
            firstPersonNarratives: 0,
            caseStudies: 0,
            practicalExamples: 0,
            beforeAfterContent: false,
            clientTestimonials: 0,
            evidence: [],
        };
    }

    /**
     * Analyze content for Expertise signals
     */
    private async analyzeExpertise(content: string, url: string): Promise<EEATSignals['expertise']> {
        if (!this.anthropic) {
            return this.getDefaultExpertise();
        }

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1500,
                messages: [{
                    role: 'user',
                    content: `Analyze this website content for EXPERTISE signals (the first "E" in E-E-A-T after Experience).
Look for evidence of specialized knowledge and credentials.

Website: ${url}
Content:
${content.substring(0, 6000)}

Evaluate:
1. Author names and bios
2. Professional credentials (PhD, MD, CPA, PE, Attorney, etc.)
3. Certifications (AWS Certified, Google Partner, etc.)
4. Technical depth and accuracy
5. Industry-specific terminology usage
6. Educational background mentions
7. Years of experience claims

Return ONLY valid JSON:
{
    "score": 0-100,
    "authorsDetected": [
        {
            "name": "John Smith",
            "bio": "brief bio if found",
            "credentials": ["PhD", "Certified"],
            "socialProfiles": ["linkedin.com/in/jsmith"],
            "isVerified": true/false
        }
    ],
    "credentialsFound": ["PhD", "Certified Public Accountant", "Licensed Contractor"],
    "technicalDepth": 0-100,
    "specializationClarity": 0-100,
    "industryTerminology": <count of specialized terms>,
    "evidence": ["Author Dr. Jane Doe mentioned with credentials", "Uses advanced terminology"]
}`
                }]
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('[EEAT] Expertise analysis failed:', error);
        }

        return this.getDefaultExpertise();
    }

    private getDefaultExpertise(): EEATSignals['expertise'] {
        return {
            score: 50,
            authorsDetected: [],
            credentialsFound: [],
            technicalDepth: 50,
            specializationClarity: 50,
            industryTerminology: 0,
            evidence: [],
        };
    }

    /**
     * Analyze content for Authoritativeness signals
     */
    private async analyzeAuthoritativeness(content: string, url: string, domain: string): Promise<EEATSignals['authoritativeness']> {
        if (!this.anthropic) {
            return this.getDefaultAuthoritativeness();
        }

        try {
            // Check Wikipedia for entity
            const wikipediaPresence = await this.checkWikipedia(domain);

            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `Analyze this website content for AUTHORITATIVENESS signals (the "A" in E-E-A-T).
Look for evidence of industry recognition and authority.

Website: ${url}
Content:
${content.substring(0, 6000)}

Evaluate:
1. Mentions of press/media coverage
2. Industry awards or recognition
3. Partnerships with known brands
4. Speaking engagements or conference mentions
5. Being cited by others
6. Client logos or notable customers
7. Industry association memberships

Return ONLY valid JSON:
{
    "score": 0-100,
    "pressmentions": <count of press/media mentions>,
    "industryAwards": ["Award Name 2023", "Recognition 2022"],
    "partnerships": ["Google Partner", "Microsoft Partner"],
    "mediaCoverage": true/false,
    "evidence": ["Featured in TechCrunch", "Google Premier Partner mentioned"]
}`
                }]
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    ...parsed,
                    wikipediaPresence: wikipediaPresence.found,
                    wikidataEntity: wikipediaPresence.wikidataId !== null,
                };
            }
        } catch (error) {
            console.error('[EEAT] Authoritativeness analysis failed:', error);
        }

        return this.getDefaultAuthoritativeness();
    }

    /**
     * Check Wikipedia for entity presence
     */
    private async checkWikipedia(domain: string): Promise<{ found: boolean; wikidataId: string | null }> {
        try {
            // Extract brand name from domain
            const brandName = domain
                .replace(/^www\./, '')
                .replace(/\.(com|net|org|io|co|ai)$/, '')
                .split('.')[0];

            const response = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(brandName)}&format=json&origin=*`,
                { headers: { 'Accept': 'application/json' } }
            );

            if (response.ok) {
                const data = await response.json() as { query?: { search?: Array<{ title: string }> } };
                const results = data?.query?.search || [];
                // Check if any result title closely matches the brand
                const found = results.some((r: any) =>
                    r.title.toLowerCase().includes(brandName.toLowerCase())
                );
                return { found, wikidataId: found ? 'potential' : null };
            }
        } catch (error) {
            console.error('[EEAT] Wikipedia check failed:', error);
        }
        return { found: false, wikidataId: null };
    }

    private getDefaultAuthoritativeness(): EEATSignals['authoritativeness'] {
        return {
            score: 50,
            wikipediaPresence: false,
            wikidataEntity: false,
            pressmentions: 0,
            industryAwards: [],
            partnerships: [],
            mediaCoverage: false,
            evidence: [],
        };
    }

    /**
     * Analyze content for Trustworthiness signals
     */
    private async analyzeTrustworthiness(content: string, html: string, url: string): Promise<EEATSignals['trustworthiness']> {
        // Check for common trust signals in HTML/content
        const htmlLower = html.toLowerCase();
        const contentLower = content.toLowerCase();

        const contactInfoVisible =
            htmlLower.includes('contact') ||
            htmlLower.includes('mailto:') ||
            /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(content);

        const physicalAddress =
            /\d+\s+[\w\s]+,\s*[\w\s]+,\s*[A-Z]{2}\s*\d{5}/.test(content) ||
            contentLower.includes('address') ||
            contentLower.includes('location');

        const phoneNumber = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(content);

        const privacyPolicy =
            htmlLower.includes('privacy policy') ||
            htmlLower.includes('privacy-policy') ||
            htmlLower.includes('/privacy');

        const termsOfService =
            htmlLower.includes('terms of service') ||
            htmlLower.includes('terms-of-service') ||
            htmlLower.includes('/terms');

        const secureConnection = url.startsWith('https://');

        const reviewsIntegration =
            htmlLower.includes('trustpilot') ||
            htmlLower.includes('google reviews') ||
            htmlLower.includes('yelp') ||
            htmlLower.includes('reviews');

        const bbbMention = htmlLower.includes('better business bureau') || htmlLower.includes('bbb');

        // Calculate transparency score
        const trustSignals = [
            contactInfoVisible,
            physicalAddress,
            phoneNumber,
            privacyPolicy,
            termsOfService,
            secureConnection,
            reviewsIntegration,
        ];
        const transparencyScore = Math.round((trustSignals.filter(Boolean).length / trustSignals.length) * 100);

        // Calculate overall trust score
        const score = Math.round(
            (transparencyScore * 0.6) +
            (secureConnection ? 20 : 0) +
            (reviewsIntegration ? 10 : 0) +
            (bbbMention ? 10 : 0)
        );

        const evidence: string[] = [];
        if (contactInfoVisible) evidence.push('Contact information found');
        if (physicalAddress) evidence.push('Physical address present');
        if (phoneNumber) evidence.push('Phone number visible');
        if (privacyPolicy) evidence.push('Privacy policy linked');
        if (termsOfService) evidence.push('Terms of service present');
        if (secureConnection) evidence.push('HTTPS enabled');
        if (reviewsIntegration) evidence.push('Reviews integration detected');
        if (bbbMention) evidence.push('BBB mentioned');

        return {
            score: Math.min(100, score),
            contactInfoVisible,
            physicalAddress,
            phoneNumber,
            privacyPolicy,
            termsOfService,
            secureConnection,
            reviewsIntegration,
            bbbRating: bbbMention ? 'Mentioned' : undefined,
            transparencyScore,
            evidence,
        };
    }

    /**
     * Run full E-E-A-T analysis
     */
    async analyzeEEAT(input: EEATAnalysisInput): Promise<EEATSignals> {
        console.log(`[EEAT] Starting E-E-A-T analysis for ${input.url}`);
        const startTime = Date.now();

        const domain = new URL(input.url.startsWith('http') ? input.url : `https://${input.url}`).hostname;

        // Run all analyses in parallel
        const [experience, expertise, authoritativeness, trustworthiness] = await Promise.all([
            this.analyzeExperience(input.content, input.url),
            this.analyzeExpertise(input.content, input.url),
            this.analyzeAuthoritativeness(input.content, input.url, domain),
            this.analyzeTrustworthiness(input.content, input.html || input.content, input.url),
        ]);

        // Calculate overall E-E-A-T score (weighted)
        const overallScore = Math.round(
            (experience.score * 0.20) +
            (expertise.score * 0.30) +
            (authoritativeness.score * 0.25) +
            (trustworthiness.score * 0.25)
        );

        const totalTime = Date.now() - startTime;
        console.log(`[EEAT] Analysis complete in ${(totalTime / 1000).toFixed(1)}s - Overall score: ${overallScore}`);

        return {
            overallScore,
            experience,
            expertise,
            authoritativeness,
            trustworthiness,
        };
    }

    /**
     * Compare E-E-A-T signals between two sites
     */
    async compareEEAT(
        yourInput: EEATAnalysisInput,
        competitorInput: EEATAnalysisInput
    ): Promise<{ you: EEATSignals; competitor: EEATSignals }> {
        console.log(`[EEAT] Comparing E-E-A-T: ${yourInput.url} vs ${competitorInput.url}`);

        const [yourSignals, competitorSignals] = await Promise.all([
            this.analyzeEEAT(yourInput),
            this.analyzeEEAT(competitorInput),
        ]);

        // Add comparison data to your signals
        const yourStrengths: string[] = [];
        const competitorStrengths: string[] = [];
        const recommendations: string[] = [];

        // Experience comparison
        if (yourSignals.experience.score > competitorSignals.experience.score) {
            yourStrengths.push('Stronger practical experience signals');
        } else if (yourSignals.experience.score < competitorSignals.experience.score) {
            competitorStrengths.push('More evidence of hands-on experience');
            recommendations.push('Add more case studies and first-person narratives');
        }

        // Expertise comparison
        if (yourSignals.expertise.score > competitorSignals.expertise.score) {
            yourStrengths.push('Better demonstrated expertise');
        } else if (yourSignals.expertise.score < competitorSignals.expertise.score) {
            competitorStrengths.push('Stronger expertise signals');
            recommendations.push('Highlight author credentials and add expert bios');
        }

        // Authoritativeness comparison
        if (yourSignals.authoritativeness.score > competitorSignals.authoritativeness.score) {
            yourStrengths.push('Greater industry authority');
        } else if (yourSignals.authoritativeness.score < competitorSignals.authoritativeness.score) {
            competitorStrengths.push('More authoritative presence');
            recommendations.push('Build press mentions and partnerships');
        }

        // Trustworthiness comparison
        if (yourSignals.trustworthiness.score > competitorSignals.trustworthiness.score) {
            yourStrengths.push('Higher trust signals');
        } else if (yourSignals.trustworthiness.score < competitorSignals.trustworthiness.score) {
            competitorStrengths.push('Better trust indicators');
            recommendations.push('Add contact info, privacy policy, and review integration');
        }

        yourSignals.comparison = {
            yourEEATScore: yourSignals.overallScore,
            competitorEEATScore: competitorSignals.overallScore,
            yourStrengths,
            competitorStrengths,
            recommendations,
        };

        return { you: yourSignals, competitor: competitorSignals };
    }
}
