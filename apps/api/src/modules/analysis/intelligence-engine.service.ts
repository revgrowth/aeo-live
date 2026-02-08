import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// INTELLIGENCE ENGINE - Brain-Melting Competitive Analysis
// =============================================================================
// This service generates the RICH, OPINIONATED analysis that makes v3.0 
// dramatically better than v1.0. Every output is specific, actionable, 
// and tells a compelling competitive narrative.
// =============================================================================

// Types for all the rich analysis outputs
export interface CopyForensics {
    youVsWeRatio: {
        you: number; // percentage
        we: number;
        analysis: string; // "Heavy focus on 'We Provide', 'Our technicians'"
    };
    readingLevel: {
        grade: number; // Flesch-Kincaid grade
        description: string; // "Grade 9 - Accessible but slightly formal"
    };
    emotionalDrivers: string[]; // ["Safety ('roots run deep')", "Reliability ('superior service')"]
    powerWords: string[]; // ["Superior", "Seasoned", "Certified", "Guaranteed"]
    // v3.0: Cliché detection for brain-melting insights
    clichesDetected?: {
        phrase: string;
        count: number;
        competitorUsage: number; // how many competitors use this
    }[];
    uniquePhrases?: string[]; // phrases only on your site
    verdict: {
        winner: string; // domain name
        headline: string; // "BES wins because they write with specificity"
        reasoning: string;
        improvements: {
            title: string;
            action: string;
            example?: string;
        }[];
    };
}

export interface BrandIdentityAnalysis {
    yourBrand: {
        archetype: string; // "The Builder / The Creator"
        tagline: string; // detected or generated
        positioningStatement: string;
        voiceScore: number; // 0-100
        personality: {
            confident: number; // 0-100 (humble to bold)
            serious: number; // 0-100 (serious to playful)
            established: number; // 0-100 (challenger to established)
            technical: number; // 0-100 (accessible to technical)
            safe?: number; // 0-100 (safe to provocative) - for voice map
            energy?: number; // 0-100 (calm to energetic)
        };
        strengths: string[];
        weaknesses: string[];
    };
    competitorBrand: {
        archetype: string;
        tagline: string;
        positioningStatement: string;
        voiceScore: number;
        personality: {
            confident: number;
            serious: number;
            established: number;
            technical: number;
            safe?: number;
            energy?: number;
        };
        strengths: string[];
        weaknesses: string[];
    };
    brandGapAnalysis: string;
    competitiveAdvantageVerdict: string;
    // v3.0: Proprietary frameworks and signature phrases
    proprietaryFrameworks?: {
        yours: string[];
        competitor: string[];
    };
    signaturePhrases?: {
        yours: string[];
        competitor: string[];
    };
    authenticMoments?: {
        yours: string[];
        competitor: string[];
    };
}

export interface AIVerdict {
    winner: string;
    winnerScore: number;
    loserScore: number;
    headline: string; // "BES wins because they write with specificity"
    summary: string; // 2-3 sentences explaining the verdict
    keyDifferentiators: string[];
    specificImprovements: {
        number: number;
        title: string;
        action: string;
        example?: string;
        impact: 'high' | 'medium' | 'low';
    }[];
}

export interface ContentStrategy {
    yourSite: {
        publishingFrequency: string; // "Low (1 blog post detected)"
        contentDepth: number; // 0-10
        topicClusters: { name: string; status: string; postCount: number }[];
        wordCount: number;
        avgWordsPerPage: number;
    };
    competitorSite: {
        publishingFrequency: string;
        contentDepth: number;
        topicClusters: { name: string; status: string; postCount: number }[];
        wordCount: number;
        avgWordsPerPage: number;
    };
    contentVerdict: {
        winner: string;
        winReason: string;
        strategyShift: string;
    };
}

export interface TechnicalForensics {
    yourSite: {
        schemaTypes: string[];
        schemaDetected: boolean;
        imageSeoStatus: string; // "3 missing alt tags"
        imageSeoCount: { total: number; missing: number };
        contentDepth: { words: number; avgPerPage: number };
        domSize: string; // "308KB"
        mobileFirst: 'ready' | 'needs-work';
    };
    competitorSite: {
        schemaTypes: string[];
        schemaDetected: boolean;
        imageSeoStatus: string;
        imageSeoCount: { total: number; missing: number };
        contentDepth: { words: number; avgPerPage: number };
        domSize: string;
        mobileFirst: 'ready' | 'needs-work';
    };
    forensicsConsensus: string; // "Google ranks Lean & Targeted over Fat & Unstructured"
}

export interface TrustAuthorityAnalysis {
    yourScore: number;
    competitorScore: number;
    yourCredibilityIndicators: string[];
    competitorCredibilityIndicators: string[];
    eeatMetrics: {
        experience: { you: number; competitor: number };
        expertise: { you: number; competitor: number };
        authoritativeness: { you: number; competitor: number };
        trustworthiness: { you: number; competitor: number };
    };
    trustVerdict: string; // "Coastal Wins on Humanity, Holy City Wins on Badges"
    actionItem: string;
}

export interface AeoReadinessAnalysis {
    yourScore: number; // 0-10
    competitorScore: number;
    yourLlmMatch: string; // "Perplexity"
    competitorLlmMatch: string; // "Google SGE (Local Pack)"
    yourCitationLikelihood: 'high' | 'medium' | 'low';
    competitorCitationLikelihood: 'high' | 'medium' | 'low';
    yourAnalysis: string; // Why they're likely/unlikely to be cited
    competitorAnalysis: string;
}

export interface StrategicRoadmap {
    primaryOpportunity: string;
    primaryThreat: string;
    immediateActions: {
        number: number;
        title: string;
        description: string;
        category: 'technical' | 'content' | 'aeo' | 'brand';
        impact: 'high' | 'medium' | 'low';
        effort: 'low' | 'medium' | 'high';
        timeline: string;
    }[];
    contentToCreate: {
        title: string;
        format: string;
        targetWordCount: number;
        keyInclusion: string;
    }[];
    aeoPhases: {
        phase: number;
        name: string;
        items: string[];
    }[];
    successMetrics: {
        days: number;
        kpis: string[];
    }[];
    // v3.0: Quick wins matrix (High Impact, Low Effort)
    quickWins?: {
        number: number;
        title: string;
        action: string;
        example?: string;
        effort: 'low' | 'medium' | 'high';
        impact: 'low' | 'medium' | 'high';
        pointsGain: number;
    }[];
}

export interface FullIntelligenceReport {
    executiveSummary: {
        yourScore: number;
        competitorScore: number;
        verdict: string; // One-liner
        topOpportunity: string;
        topThreat: string;
    };
    copyForensics: CopyForensics;
    brandIdentity: BrandIdentityAnalysis;
    aiVerdict: AIVerdict;
    contentStrategy: ContentStrategy;
    technicalForensics: TechnicalForensics;
    trustAuthority: TrustAuthorityAnalysis;
    aeoReadiness: AeoReadinessAnalysis;
    strategicRoadmap: StrategicRoadmap;
    generatedAt: Date;
}

@Injectable()
export class IntelligenceEngine {
    private anthropic: Anthropic | null = null;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.anthropic = new Anthropic({ apiKey });
            console.log('[IntelligenceEngine] Initialized - Ready to generate brain-melting analysis');
        } else {
            console.warn('[IntelligenceEngine] No Claude API key - Intelligence features disabled');
        }
    }

    /**
     * Generate the FULL intelligence report with all v1.0+ features
     */
    async generateFullIntelligence(
        yourUrl: string,
        competitorUrl: string,
        yourContent: { html: string; markdown: string; metadata: Record<string, any> },
        competitorContent: { html: string; markdown: string; metadata: Record<string, any> },
        additionalData?: {
            yourSeoMetrics?: any;
            competitorSeoMetrics?: any;
            yourPerformance?: any;
            competitorPerformance?: any;
        }
    ): Promise<FullIntelligenceReport> {
        if (!this.anthropic) {
            throw new Error('Intelligence Engine requires Claude API key');
        }

        const yourDomain = new URL(yourUrl).hostname.replace('www.', '');
        const competitorDomain = new URL(competitorUrl).hostname.replace('www.', '');

        console.log(`[IntelligenceEngine] Generating full intelligence: ${yourDomain} vs ${competitorDomain}`);

        // Run all analyses in parallel for speed
        const [
            copyForensics,
            brandIdentity,
            contentStrategy,
            technicalForensics,
            trustAuthority,
            aeoReadiness,
        ] = await Promise.all([
            this.analyzeCopyForensics(yourDomain, competitorDomain, yourContent.markdown, competitorContent.markdown),
            this.analyzeBrandIdentity(yourDomain, competitorDomain, yourContent, competitorContent),
            this.analyzeContentStrategy(yourDomain, competitorDomain, yourContent, competitorContent),
            this.analyzeTechnicalForensics(yourDomain, competitorDomain, yourContent, competitorContent, additionalData),
            this.analyzeTrustAuthority(yourDomain, competitorDomain, yourContent, competitorContent),
            this.analyzeAeoReadiness(yourDomain, competitorDomain, yourContent, competitorContent),
        ]);

        // Generate AI Verdict based on all analyses
        const aiVerdict = await this.generateAIVerdict(
            yourDomain, competitorDomain,
            copyForensics, brandIdentity, contentStrategy, technicalForensics, trustAuthority, aeoReadiness
        );

        // Generate Strategic Roadmap based on all findings
        const strategicRoadmap = await this.generateStrategicRoadmap(
            yourDomain, competitorDomain,
            copyForensics, brandIdentity, contentStrategy, technicalForensics, trustAuthority, aeoReadiness
        );

        // Calculate overall scores
        const yourScore = this.calculateOverallScore(copyForensics, brandIdentity, contentStrategy, technicalForensics, trustAuthority, aeoReadiness, true);
        const competitorScore = this.calculateOverallScore(copyForensics, brandIdentity, contentStrategy, technicalForensics, trustAuthority, aeoReadiness, false);

        return {
            executiveSummary: {
                yourScore,
                competitorScore,
                verdict: aiVerdict.headline,
                topOpportunity: strategicRoadmap.primaryOpportunity,
                topThreat: strategicRoadmap.primaryThreat,
            },
            copyForensics,
            brandIdentity,
            aiVerdict,
            contentStrategy,
            technicalForensics,
            trustAuthority,
            aeoReadiness,
            strategicRoadmap,
            generatedAt: new Date(),
        };
    }

    /**
     * COPY & VOICE FORENSICS
     * Analyzes writing style, You vs We ratio, reading level, emotional drivers, power words, CLICHÉS
     */
    private async analyzeCopyForensics(
        yourDomain: string,
        competitorDomain: string,
        yourMarkdown: string,
        competitorMarkdown: string
    ): Promise<CopyForensics> {
        const prompt = `You are an elite copywriter and brand voice forensics expert. Analyze these two websites' copy with extreme precision.

SITE A (${yourDomain}):
${yourMarkdown.substring(0, 10000)}

SITE B (${competitorDomain}):
${competitorMarkdown.substring(0, 10000)}

Provide a JSON response with this EXACT structure:
{
    "siteA": {
        "youVsWeRatio": {
            "you": <percentage 0-100 of customer-focused language>,
            "we": <percentage 0-100 of company-focused language>,
            "analysis": "<describe the focus, e.g., 'Heavy focus on Our Team, Our Skills - self-centered copy'>"
        },
        "readingLevel": {
            "grade": <Flesch-Kincaid grade 1-16>,
            "description": "<e.g., 'Grade 9 - Professional but accessible'>"
        },
        "emotionalDrivers": ["<driver with actual quote>", "<driver with quote>", "<driver>"],
        "powerWords": ["<word>", "<word>", "<word>", "<word>", "<word>"]
    },
    "siteB": {
        "youVsWeRatio": {
            "you": <percentage>,
            "we": <percentage>,
            "analysis": "<describe the focus>"
        },
        "readingLevel": {
            "grade": <number>,
            "description": "<description>"
        },
        "emotionalDrivers": ["<driver with quote>", "<driver>"],
        "powerWords": ["<word>", "<word>", "<word>", "<word>", "<word>"]
    },
    "clichesDetected": [
        {"phrase": "innovative solutions", "count": <times found on site A>, "competitorUsage": 1},
        {"phrase": "customer-centric", "count": <times found>, "competitorUsage": 1},
        {"phrase": "best-in-class", "count": <times found>, "competitorUsage": 1},
        {"phrase": "cutting-edge", "count": <times found>, "competitorUsage": 1},
        {"phrase": "industry-leading", "count": <times found>, "competitorUsage": 1}
    ],
    "uniquePhrases": ["<phrase only found on site A, not generic>", "<unique ownable phrase>"],
    "verdict": {
        "winner": "<domain name of winner>",
        "headline": "<compelling one-liner, e.g., 'Site B wins because they write with specificity and data'>",
        "reasoning": "<2-3 sentences explaining why with specific evidence>",
        "improvements": [
            {
                "title": "Kill the Corporate Speak",
                "action": "<specific action with exact phrases to remove>",
                "example": "<specific before/after example from their actual content>"
            },
            {
                "title": "<improvement title>",
                "action": "<specific action>",
                "example": "<specific example>"
            },
            {
                "title": "<improvement title>",
                "action": "<specific action>",
                "example": "<specific example>"
            }
        ]
    }
}

CRITICAL: For clichesDetected, find ACTUAL industry clichés used on Site A. Common offenders: "innovative", "solutions", "leverage", "synergy", "cutting-edge", "best-in-class", "customer-centric", "world-class", "state-of-the-art". Count real occurrences.`;

        try {
            const response = await this.anthropic!.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 3000,
                messages: [{ role: 'user', content: prompt }],
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON in response');

            const data = JSON.parse(jsonMatch[0]);

            return {
                youVsWeRatio: data.siteA.youVsWeRatio,
                readingLevel: data.siteA.readingLevel,
                emotionalDrivers: data.siteA.emotionalDrivers || [],
                powerWords: data.siteA.powerWords || [],
                clichesDetected: data.clichesDetected || [],
                uniquePhrases: data.uniquePhrases || [],
                verdict: {
                    winner: data.verdict.winner,
                    headline: data.verdict.headline,
                    reasoning: data.verdict.reasoning,
                    improvements: data.verdict.improvements || [],
                },
            };
        } catch (error) {
            console.error('[IntelligenceEngine] Copy forensics failed:', error);
            return this.getDefaultCopyForensics(yourDomain);
        }
    }

    /**
     * BRAND IDENTITY ANALYSIS
     * Archetypes, positioning, personality traits, voice scores
     */
    private async analyzeBrandIdentity(
        yourDomain: string,
        competitorDomain: string,
        yourContent: { markdown: string; metadata: Record<string, any> },
        competitorContent: { markdown: string; metadata: Record<string, any> }
    ): Promise<BrandIdentityAnalysis> {
        const prompt = `You are an elite brand strategist specializing in competitive voice analysis. Analyze these two brands deeply.

BRAND A (${yourDomain}):
Title: ${yourContent.metadata?.title || 'Unknown'}
${yourContent.markdown.substring(0, 8000)}

BRAND B (${competitorDomain}):
Title: ${competitorContent.metadata?.title || 'Unknown'}
${competitorContent.markdown.substring(0, 8000)}

Provide a JSON response with this EXACT structure (be thorough and specific):
{
    "brandA": {
        "archetype": "<e.g., 'The Builder / The Creator' or 'The Caregiver / The Helper'>",
        "tagline": "<detected tagline or create one that fits their positioning>",
        "positioningStatement": "<one sentence: We help [target] achieve [benefit] through [method]>",
        "voiceScore": <0-100, rate how distinctive and memorable the voice is>,
        "personality": {
            "confident": <0-100, 0=humble, 100=bold>,
            "serious": <0-100, 0=serious, 100=playful>,
            "established": <0-100, 0=challenger, 100=established>,
            "technical": <0-100, 0=accessible, 100=technical>,
            "safe": <0-100, 0=safe/conservative, 100=provocative/edgy>,
            "energy": <0-100, 0=calm/measured, 100=high-energy/enthusiastic>
        },
        "strengths": ["<specific strength with evidence>", "<strength>", "<strength>"],
        "weaknesses": ["<specific weakness>", "<weakness>", "<weakness>"]
    },
    "brandB": {
        "archetype": "<archetype>",
        "tagline": "<tagline>",
        "positioningStatement": "<statement>",
        "voiceScore": <0-100>,
        "personality": {
            "confident": <0-100>,
            "serious": <0-100>,
            "established": <0-100>,
            "technical": <0-100>,
            "safe": <0-100>,
            "energy": <0-100>
        },
        "strengths": ["<strength>", "<strength>", "<strength>"],
        "weaknesses": ["<weakness>", "<weakness>", "<weakness>"]
    },
    "proprietaryFrameworks": {
        "yours": ["<named methodology or framework they've created, if any>"],
        "competitor": ["<The Trust Triangle>", "<Revenue Architecture>", "<any named frameworks>"]
    },
    "signaturePhrases": {
        "yours": ["<memorable, ownable phrases used repeatedly>"],
        "competitor": ["<We believe boring is broken>", "<Built for the impatient>"]
    },
    "authenticMoments": {
        "yours": ["<specific personal stories, failures shared, real numbers mentioned>"],
        "competitor": ["<Founder story about X>", "<We turned down $2M because...>"]
    },
    "brandGapAnalysis": "<2-3 sentences comparing the two brands' positioning and voice distinctiveness>",
    "competitiveAdvantageVerdict": "<who has the stronger brand MOAT and why - focus on if their voice is hard to copy, 2-3 sentences>"
}

CRITICAL: Look for proprietary frameworks (named methodologies), signature phrases (ownable expressions), and authentic moments (real stories, specific numbers, honest admissions). These create voice moats. Be specific with quotes. If none found, use empty arrays.`;

        try {
            const response = await this.anthropic!.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 3000,
                messages: [{ role: 'user', content: prompt }],
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON in response');

            const data = JSON.parse(jsonMatch[0]);

            return {
                yourBrand: {
                    archetype: data.brandA.archetype,
                    tagline: data.brandA.tagline,
                    positioningStatement: data.brandA.positioningStatement,
                    voiceScore: data.brandA.voiceScore,
                    personality: {
                        confident: data.brandA.personality.confident,
                        serious: data.brandA.personality.serious,
                        established: data.brandA.personality.established,
                        technical: data.brandA.personality.technical,
                        safe: data.brandA.personality.safe || 50,
                        energy: data.brandA.personality.energy || 50,
                    },
                    strengths: data.brandA.strengths || [],
                    weaknesses: data.brandA.weaknesses || [],
                },
                competitorBrand: {
                    archetype: data.brandB.archetype,
                    tagline: data.brandB.tagline,
                    positioningStatement: data.brandB.positioningStatement,
                    voiceScore: data.brandB.voiceScore,
                    personality: {
                        confident: data.brandB.personality.confident,
                        serious: data.brandB.personality.serious,
                        established: data.brandB.personality.established,
                        technical: data.brandB.personality.technical,
                        safe: data.brandB.personality.safe || 50,
                        energy: data.brandB.personality.energy || 50,
                    },
                    strengths: data.brandB.strengths || [],
                    weaknesses: data.brandB.weaknesses || [],
                },
                brandGapAnalysis: data.brandGapAnalysis,
                competitiveAdvantageVerdict: data.competitiveAdvantageVerdict,
                proprietaryFrameworks: data.proprietaryFrameworks || { yours: [], competitor: [] },
                signaturePhrases: data.signaturePhrases || { yours: [], competitor: [] },
                authenticMoments: data.authenticMoments || { yours: [], competitor: [] },
            };
        } catch (error) {
            console.error('[IntelligenceEngine] Brand identity analysis failed:', error);
            return this.getDefaultBrandIdentity(yourDomain, competitorDomain);
        }
    }

    /**
     * CONTENT STRATEGY ANALYSIS
     * Publishing frequency, content depth, topic clusters, word counts
     */
    private async analyzeContentStrategy(
        yourDomain: string,
        competitorDomain: string,
        yourContent: { markdown: string; metadata: Record<string, any> },
        competitorContent: { markdown: string; metadata: Record<string, any> }
    ): Promise<ContentStrategy> {
        const yourWordCount = yourContent.markdown.split(/\s+/).length;
        const competitorWordCount = competitorContent.markdown.split(/\s+/).length;

        const prompt = `Analyze the content strategy of these two websites based on their content.

SITE A (${yourDomain}) - ${yourWordCount} words:
${yourContent.markdown.substring(0, 5000)}

SITE B (${competitorDomain}) - ${competitorWordCount} words:
${competitorContent.markdown.substring(0, 5000)}

Provide a JSON response:
{
    "siteA": {
        "publishingFrequency": "<e.g., 'Low (1 blog post detected)' or 'High (weekly updates)'>",
        "contentDepth": <0-10 score>,
        "topicClusters": [
            {"name": "<topic name>", "status": "<Gap/Weak/Strong>", "postCount": <estimated>}
        ]
    },
    "siteB": {
        "publishingFrequency": "<frequency>",
        "contentDepth": <0-10>,
        "topicClusters": [
            {"name": "<topic>", "status": "<status>", "postCount": <count>}
        ]
    },
    "verdict": {
        "winner": "<domain>",
        "winReason": "<e.g., 'Coastal Carolina Comfort wins on Volume, Holy City wins on Intent'>",
        "strategyShift": "<specific strategic recommendation, e.g., 'Stop writing general essays. Start writing 500-word targeted pages for: AC Repair Holly Beach, Heat Pump Install Hollywood SC'>"
    }
}`;

        try {
            const response = await this.anthropic!.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }],
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON in response');

            const data = JSON.parse(jsonMatch[0]);

            return {
                yourSite: {
                    publishingFrequency: data.siteA.publishingFrequency,
                    contentDepth: data.siteA.contentDepth,
                    topicClusters: data.siteA.topicClusters || [],
                    wordCount: yourWordCount,
                    avgWordsPerPage: yourWordCount,
                },
                competitorSite: {
                    publishingFrequency: data.siteB.publishingFrequency,
                    contentDepth: data.siteB.contentDepth,
                    topicClusters: data.siteB.topicClusters || [],
                    wordCount: competitorWordCount,
                    avgWordsPerPage: competitorWordCount,
                },
                contentVerdict: {
                    winner: data.verdict.winner,
                    winReason: data.verdict.winReason,
                    strategyShift: data.verdict.strategyShift,
                },
            };
        } catch (error) {
            console.error('[IntelligenceEngine] Content strategy analysis failed:', error);
            return this.getDefaultContentStrategy(yourDomain, competitorDomain, yourWordCount, competitorWordCount);
        }
    }

    /**
     * TECHNICAL FORENSICS
     * Schema markup, image SEO, DOM size, mobile-first status
     */
    private async analyzeTechnicalForensics(
        yourDomain: string,
        competitorDomain: string,
        yourContent: { html: string; markdown: string; metadata: Record<string, any> },
        competitorContent: { html: string; markdown: string; metadata: Record<string, any> },
        additionalData?: any
    ): Promise<TechnicalForensics> {
        // Extract schema types from HTML
        const yourSchemaTypes = this.extractSchemaTypes(yourContent.html);
        const competitorSchemaTypes = this.extractSchemaTypes(competitorContent.html);

        // Count images and missing alt tags
        const yourImages = this.countImages(yourContent.html);
        const competitorImages = this.countImages(competitorContent.html);

        // Estimate DOM size
        const yourDomSize = Math.round(yourContent.html.length / 1024);
        const competitorDomSize = Math.round(competitorContent.html.length / 1024);

        const yourWordCount = yourContent.markdown.split(/\s+/).length;
        const competitorWordCount = competitorContent.markdown.split(/\s+/).length;

        // Determine mobile readiness based on DOM size and content structure
        const yourMobileFirst = yourDomSize < 400 ? 'ready' : 'needs-work';
        const competitorMobileFirst = competitorDomSize < 400 ? 'ready' : 'needs-work';

        // Generate consensus
        let consensus = '';
        if (yourDomSize < competitorDomSize && yourWordCount > competitorWordCount * 0.7) {
            consensus = `${yourDomain} is a 'Lean' site—targeted content, fast code, efficient structure. Google ranks Lean & Targeted over Fat & Unstructured. Maintain content depth but keep code lean.`;
        } else if (yourDomSize > competitorDomSize) {
            consensus = `${competitorDomain} has a leaner codebase. Your HTML is bloated (${yourDomSize}KB). Consider reducing unused JavaScript/CSS and page builder weight.`;
        } else {
            consensus = `Both sites have comparable technical footprints. Focus on schema markup and content quality to differentiate.`;
        }

        return {
            yourSite: {
                schemaTypes: yourSchemaTypes,
                schemaDetected: yourSchemaTypes.length > 0,
                imageSeoStatus: yourImages.missing > 0 ? `${yourImages.missing} missing alt tags` : 'All images optimized',
                imageSeoCount: yourImages,
                contentDepth: { words: yourWordCount, avgPerPage: yourWordCount },
                domSize: `${yourDomSize}KB`,
                mobileFirst: yourMobileFirst,
            },
            competitorSite: {
                schemaTypes: competitorSchemaTypes,
                schemaDetected: competitorSchemaTypes.length > 0,
                imageSeoStatus: competitorImages.missing > 0 ? `${competitorImages.missing} missing alt tags` : 'All images optimized',
                imageSeoCount: competitorImages,
                contentDepth: { words: competitorWordCount, avgPerPage: competitorWordCount },
                domSize: `${competitorDomSize}KB`,
                mobileFirst: competitorMobileFirst,
            },
            forensicsConsensus: consensus,
        };
    }

    /**
     * TRUST & AUTHORITY ANALYSIS
     * E-E-A-T metrics, credibility indicators, trust signals
     */
    private async analyzeTrustAuthority(
        yourDomain: string,
        competitorDomain: string,
        yourContent: { markdown: string; metadata: Record<string, any> },
        competitorContent: { markdown: string; metadata: Record<string, any> }
    ): Promise<TrustAuthorityAnalysis> {
        const prompt = `Analyze the E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals of these two websites.

SITE A (${yourDomain}):
${yourContent.markdown.substring(0, 5000)}

SITE B (${competitorDomain}):
${competitorContent.markdown.substring(0, 5000)}

Provide a JSON response:
{
    "siteA": {
        "score": <0-100 trust score>,
        "credibilityIndicators": ["<e.g., '20 years experience'>", "<'Licensed: MT53404'>", "<'Daikin Comfort Promise'>"],
        "eeat": {
            "experience": <0-100>,
            "expertise": <0-100>,
            "authoritativeness": <0-100>,
            "trustworthiness": <0-100>
        }
    },
    "siteB": {
        "score": <0-100>,
        "credibilityIndicators": ["<indicator>", "<indicator>"],
        "eeat": {
            "experience": <0-100>,
            "expertise": <0-100>,
            "authoritativeness": <0-100>,
            "trustworthiness": <0-100>
        }
    },
    "trustVerdict": "<compelling headline, e.g., 'Coastal Wins on Humanity, Holy City Wins on Badges'>",
    "actionItem": "<specific action, e.g., 'Add your License Number to the footer. Add a Meet Derrick video to weaponize that superior personal story.'>"
}

Look for: certifications, years in business, team bios, customer testimonials, professional affiliations, license numbers, manufacturer partnerships.`;

        try {
            const response = await this.anthropic!.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }],
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON in response');

            const data = JSON.parse(jsonMatch[0]);

            return {
                yourScore: data.siteA.score,
                competitorScore: data.siteB.score,
                yourCredibilityIndicators: data.siteA.credibilityIndicators || [],
                competitorCredibilityIndicators: data.siteB.credibilityIndicators || [],
                eeatMetrics: {
                    experience: { you: data.siteA.eeat.experience, competitor: data.siteB.eeat.experience },
                    expertise: { you: data.siteA.eeat.expertise, competitor: data.siteB.eeat.expertise },
                    authoritativeness: { you: data.siteA.eeat.authoritativeness, competitor: data.siteB.eeat.authoritativeness },
                    trustworthiness: { you: data.siteA.eeat.trustworthiness, competitor: data.siteB.eeat.trustworthiness },
                },
                trustVerdict: data.trustVerdict,
                actionItem: data.actionItem,
            };
        } catch (error) {
            console.error('[IntelligenceEngine] Trust authority analysis failed:', error);
            return this.getDefaultTrustAuthority(yourDomain, competitorDomain);
        }
    }

    /**
     * AEO READINESS ANALYSIS
     * AI citation likelihood, LLM match, structured data readiness
     */
    private async analyzeAeoReadiness(
        yourDomain: string,
        competitorDomain: string,
        yourContent: { markdown: string; metadata: Record<string, any> },
        competitorContent: { markdown: string; metadata: Record<string, any> }
    ): Promise<AeoReadinessAnalysis> {
        const prompt = `Analyze how likely these websites are to be cited by AI systems (ChatGPT, Perplexity, Google SGE, Claude).

SITE A (${yourDomain}):
${yourContent.markdown.substring(0, 4000)}

SITE B (${competitorDomain}):
${competitorContent.markdown.substring(0, 4000)}

Consider: structured data, clear answers to questions, entity clarity, topical authority, content format.

Provide a JSON response:
{
    "siteA": {
        "aeoScore": <0-10>,
        "bestLlmMatch": "<e.g., 'Perplexity' or 'Google SGE (Local Pack)' or 'ChatGPT'>",
        "citationLikelihood": "<high/medium/low>",
        "analysis": "<why they are or aren't likely to be cited, 2-3 sentences>"
    },
    "siteB": {
        "aeoScore": <0-10>,
        "bestLlmMatch": "<LLM name>",
        "citationLikelihood": "<high/medium/low>",
        "analysis": "<analysis>"
    }
}

Be specific about which AI systems would most likely cite each site and why.`;

        try {
            const response = await this.anthropic!.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1200,
                messages: [{ role: 'user', content: prompt }],
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON in response');

            const data = JSON.parse(jsonMatch[0]);

            return {
                yourScore: data.siteA.aeoScore,
                competitorScore: data.siteB.aeoScore,
                yourLlmMatch: data.siteA.bestLlmMatch,
                competitorLlmMatch: data.siteB.bestLlmMatch,
                yourCitationLikelihood: data.siteA.citationLikelihood,
                competitorCitationLikelihood: data.siteB.citationLikelihood,
                yourAnalysis: data.siteA.analysis,
                competitorAnalysis: data.siteB.analysis,
            };
        } catch (error) {
            console.error('[IntelligenceEngine] AEO readiness analysis failed:', error);
            return this.getDefaultAeoReadiness(yourDomain, competitorDomain);
        }
    }

    /**
     * GENERATE AI VERDICT
     * The final winner declaration with specific improvements
     */
    private async generateAIVerdict(
        yourDomain: string,
        competitorDomain: string,
        copyForensics: CopyForensics,
        brandIdentity: BrandIdentityAnalysis,
        contentStrategy: ContentStrategy,
        technicalForensics: TechnicalForensics,
        trustAuthority: TrustAuthorityAnalysis,
        aeoReadiness: AeoReadinessAnalysis
    ): Promise<AIVerdict> {
        // Calculate aggregate scores
        const yourScoreComponents = [
            brandIdentity.yourBrand.voiceScore,
            contentStrategy.yourSite.contentDepth * 10,
            trustAuthority.yourScore,
            aeoReadiness.yourScore * 10,
        ];
        const competitorScoreComponents = [
            brandIdentity.competitorBrand.voiceScore,
            contentStrategy.competitorSite.contentDepth * 10,
            trustAuthority.competitorScore,
            aeoReadiness.competitorScore * 10,
        ];

        const yourAvgScore = Math.round(yourScoreComponents.reduce((a, b) => a + b, 0) / yourScoreComponents.length);
        const competitorAvgScore = Math.round(competitorScoreComponents.reduce((a, b) => a + b, 0) / competitorScoreComponents.length);

        const winner = yourAvgScore >= competitorAvgScore ? yourDomain : competitorDomain;
        const loser = winner === yourDomain ? competitorDomain : yourDomain;

        const prompt = `Based on this competitive analysis, generate a compelling AI Verdict.

${yourDomain} Score: ${yourAvgScore}/100
${competitorDomain} Score: ${competitorAvgScore}/100

Key findings:
- Copy & Voice: ${copyForensics.verdict.headline}
- Brand Identity: ${brandIdentity.competitiveAdvantageVerdict}
- Content Strategy: ${contentStrategy.contentVerdict.winReason}
- Trust & Authority: ${trustAuthority.trustVerdict}
- AEO Readiness: ${yourDomain} ${aeoReadiness.yourScore}/10 vs ${competitorDomain} ${aeoReadiness.competitorScore}/10

Provide a JSON response:
{
    "headline": "<punchy one-liner verdict, e.g., '${winner} wins because they write with specificity'>",
    "summary": "<2-3 sentences explaining the overall competitive situation>",
    "keyDifferentiators": ["<key difference 1>", "<key difference 2>", "<key difference 3>"],
    "specificImprovements": [
        {
            "number": 1,
            "title": "<improvement title>",
            "action": "<specific action to take>",
            "example": "<specific example if applicable>",
            "impact": "<high/medium/low>"
        }
    ]
}

Be opinionated and specific. The improvements should be immediately actionable.`;

        try {
            const response = await this.anthropic!.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }],
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON in response');

            const data = JSON.parse(jsonMatch[0]);

            return {
                winner,
                winnerScore: winner === yourDomain ? yourAvgScore : competitorAvgScore,
                loserScore: winner === yourDomain ? competitorAvgScore : yourAvgScore,
                headline: data.headline,
                summary: data.summary,
                keyDifferentiators: data.keyDifferentiators || [],
                specificImprovements: data.specificImprovements || [],
            };
        } catch (error) {
            console.error('[IntelligenceEngine] AI Verdict generation failed:', error);
            return {
                winner,
                winnerScore: winner === yourDomain ? yourAvgScore : competitorAvgScore,
                loserScore: winner === yourDomain ? competitorAvgScore : yourAvgScore,
                headline: `${winner} has a stronger overall presence`,
                summary: `Based on our analysis, ${winner} demonstrates stronger signals across multiple dimensions.`,
                keyDifferentiators: ['Brand voice clarity', 'Content depth', 'Trust signals'],
                specificImprovements: [
                    { number: 1, title: 'Improve content specificity', action: 'Add more data-driven claims', impact: 'high' },
                ],
            };
        }
    }

    /**
     * GENERATE STRATEGIC ROADMAP
     * 90-day plan with prioritized actions and QUICK WINS
     */
    private async generateStrategicRoadmap(
        yourDomain: string,
        competitorDomain: string,
        copyForensics: CopyForensics,
        brandIdentity: BrandIdentityAnalysis,
        contentStrategy: ContentStrategy,
        technicalForensics: TechnicalForensics,
        trustAuthority: TrustAuthorityAnalysis,
        aeoReadiness: AeoReadinessAnalysis
    ): Promise<StrategicRoadmap> {
        const prompt = `Create a 90-day SEO/AEO/Brand Voice roadmap for ${yourDomain} to DOMINATE ${competitorDomain}.

Current situation:
- ${yourDomain} voice score: ${brandIdentity.yourBrand.voiceScore}/100, ${competitorDomain}: ${brandIdentity.competitorBrand.voiceScore}/100
- ${yourDomain} trust score: ${trustAuthority.yourScore}/100, ${competitorDomain}: ${trustAuthority.competitorScore}/100
- ${yourDomain} AEO readiness: ${aeoReadiness.yourScore}/10, ${competitorDomain}: ${aeoReadiness.competitorScore}/10
- ${yourDomain} content: ${contentStrategy.yourSite.wordCount} words, ${competitorDomain}: ${contentStrategy.competitorSite.wordCount} words
- Copy verdict: ${copyForensics.verdict.headline}
- Brand gap: ${brandIdentity.brandGapAnalysis}
- Trust verdict: ${trustAuthority.trustVerdict}

Provide a JSON response:
{
    "primaryOpportunity": "<biggest opportunity in 1-2 sentences>",
    "primaryThreat": "<biggest competitive threat in 1-2 sentences>",
    "quickWins": [
        {
            "number": 1,
            "title": "Create a Proprietary Framework",
            "action": "<specific action>",
            "example": "<specific example, e.g., 'Turn your approach into The [Brand] Method'>",
            "effort": "low",
            "impact": "high",
            "pointsGain": 15
        },
        {
            "number": 2,
            "title": "Develop 3 Signature Phrases",
            "action": "<specific action>",
            "example": "<specific example>",
            "effort": "low",
            "impact": "high",
            "pointsGain": 12
        },
        {
            "number": 3,
            "title": "<quick win title>",
            "action": "<specific action>",
            "example": "<specific example>",
            "effort": "<low/medium>",
            "impact": "<high/medium>",
            "pointsGain": <5-20>
        },
        {
            "number": 4,
            "title": "<quick win title>",
            "action": "<specific action>",
            "example": "<specific example>",
            "effort": "<low/medium>",
            "impact": "<high/medium>",
            "pointsGain": <5-20>
        },
        {
            "number": 5,
            "title": "<quick win title>",
            "action": "<specific action>",
            "example": "<specific example>",
            "effort": "<low/medium>",
            "impact": "<high/medium>",
            "pointsGain": <5-20>
        }
    ],
    "immediateActions": [
        {
            "number": 1,
            "title": "<action title>",
            "description": "<detailed description>",
            "category": "<technical/content/aeo/brand>",
            "impact": "<high/medium/low>",
            "effort": "<low/medium/high>",
            "timeline": "<e.g., 'Week 1-2'>"
        }
    ],
    "contentToCreate": [
        {
            "title": "<content piece title>",
            "format": "<pillar page/blog post/comparison>",
            "targetWordCount": <number>,
            "keyInclusion": "<key element to include>"
        }
    ],
    "aeoPhases": [
        {
            "phase": 1,
            "name": "Schema Foundation",
            "items": ["<schema to implement>", "<schema to implement>"]
        },
        {
            "phase": 2,
            "name": "Content Optimization",
            "items": ["<content action>"]
        },
        {
            "phase": 3,
            "name": "Authority Building",
            "items": ["<authority building action>"]
        }
    ],
    "successMetrics": [
        {
            "days": 30,
            "kpis": ["<kpi>", "<kpi>"]
        },
        {
            "days": 60,
            "kpis": ["<kpi>", "<kpi>"]
        },
        {
            "days": 90,
            "kpis": ["<kpi>", "<kpi>"]
        }
    ]
}

CRITICAL: Quick Wins must be HIGH IMPACT but LOW EFFORT actions that can move the needle fast. Focus on brand voice differentiation, cliché purging, framework creation, signature phrases. Be specific with examples.`;

        try {
            const response = await this.anthropic!.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 3500,
                messages: [{ role: 'user', content: prompt }],
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON in response');

            const data = JSON.parse(jsonMatch[0]);

            return {
                primaryOpportunity: data.primaryOpportunity,
                primaryThreat: data.primaryThreat,
                immediateActions: data.immediateActions || [],
                contentToCreate: data.contentToCreate || [],
                aeoPhases: data.aeoPhases || [],
                successMetrics: data.successMetrics || [],
                quickWins: data.quickWins || [],
            };
        } catch (error) {
            console.error('[IntelligenceEngine] Strategic roadmap generation failed:', error);
            return this.getDefaultRoadmap(yourDomain, competitorDomain);
        }
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private extractSchemaTypes(html: string): string[] {
        const schemaTypes: string[] = [];
        const ldJsonMatches = html.match(/<script[^>]*type=[\"']application\/ld\+json[\"'][^>]*>([\s\S]*?)<\/script>/gi);

        if (ldJsonMatches) {
            for (const match of ldJsonMatches) {
                const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
                try {
                    const schema = JSON.parse(jsonContent);
                    if (schema['@type']) {
                        schemaTypes.push(schema['@type']);
                    }
                    if (schema['@graph']) {
                        for (const item of schema['@graph']) {
                            if (item['@type']) {
                                schemaTypes.push(item['@type']);
                            }
                        }
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }

        return [...new Set(schemaTypes)];
    }

    private countImages(html: string): { total: number; missing: number } {
        const imgMatches = html.match(/<img[^>]*>/gi) || [];
        const total = imgMatches.length;
        const missing = imgMatches.filter(img => !img.includes('alt=')).length;
        return { total, missing };
    }

    private calculateOverallScore(
        copyForensics: CopyForensics,
        brandIdentity: BrandIdentityAnalysis,
        contentStrategy: ContentStrategy,
        technicalForensics: TechnicalForensics,
        trustAuthority: TrustAuthorityAnalysis,
        aeoReadiness: AeoReadinessAnalysis,
        isYours: boolean
    ): number {
        const scores = isYours ? [
            brandIdentity.yourBrand.voiceScore,
            contentStrategy.yourSite.contentDepth * 10,
            trustAuthority.yourScore,
            aeoReadiness.yourScore * 10,
            technicalForensics.yourSite.schemaDetected ? 70 : 40,
        ] : [
            brandIdentity.competitorBrand.voiceScore,
            contentStrategy.competitorSite.contentDepth * 10,
            trustAuthority.competitorScore,
            aeoReadiness.competitorScore * 10,
            technicalForensics.competitorSite.schemaDetected ? 70 : 40,
        ];

        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    // =========================================================================
    // DEFAULT/FALLBACK DATA
    // =========================================================================

    private getDefaultCopyForensics(domain: string): CopyForensics {
        return {
            youVsWeRatio: { you: 40, we: 60, analysis: 'Unable to analyze - check content' },
            readingLevel: { grade: 8, description: 'Grade 8 - Standard reading level' },
            emotionalDrivers: ['Trust', 'Quality'],
            powerWords: ['Professional', 'Reliable'],
            verdict: {
                winner: domain,
                headline: 'Analysis incomplete',
                reasoning: 'Unable to complete copy analysis. Please try again.',
                improvements: [],
            },
        };
    }

    private getDefaultBrandIdentity(yourDomain: string, competitorDomain: string): BrandIdentityAnalysis {
        return {
            yourBrand: {
                archetype: 'The Professional',
                tagline: 'Quality service you can trust',
                positioningStatement: 'We help customers achieve their goals through professional service.',
                voiceScore: 50,
                personality: { confident: 50, serious: 60, established: 50, technical: 40 },
                strengths: ['Professional presentation'],
                weaknesses: ['Generic messaging'],
            },
            competitorBrand: {
                archetype: 'The Professional',
                tagline: 'Competitor tagline',
                positioningStatement: 'Competitor positioning.',
                voiceScore: 50,
                personality: { confident: 50, serious: 60, established: 50, technical: 40 },
                strengths: ['Professional presentation'],
                weaknesses: ['Generic messaging'],
            },
            brandGapAnalysis: 'Both brands present professionally but lack distinctive positioning.',
            competitiveAdvantageVerdict: 'Neither brand has established clear competitive advantage through voice.',
        };
    }

    private getDefaultContentStrategy(yourDomain: string, competitorDomain: string, yourWords: number, competitorWords: number): ContentStrategy {
        return {
            yourSite: {
                publishingFrequency: 'Unknown',
                contentDepth: 5,
                topicClusters: [],
                wordCount: yourWords,
                avgWordsPerPage: yourWords,
            },
            competitorSite: {
                publishingFrequency: 'Unknown',
                contentDepth: 5,
                topicClusters: [],
                wordCount: competitorWords,
                avgWordsPerPage: competitorWords,
            },
            contentVerdict: {
                winner: yourWords > competitorWords ? yourDomain : competitorDomain,
                winReason: 'Higher word count indicates more content depth',
                strategyShift: 'Focus on creating targeted, keyword-specific content',
            },
        };
    }

    private getDefaultTrustAuthority(yourDomain: string, competitorDomain: string): TrustAuthorityAnalysis {
        return {
            yourScore: 50,
            competitorScore: 50,
            yourCredibilityIndicators: [],
            competitorCredibilityIndicators: [],
            eeatMetrics: {
                experience: { you: 50, competitor: 50 },
                expertise: { you: 50, competitor: 50 },
                authoritativeness: { you: 50, competitor: 50 },
                trustworthiness: { you: 50, competitor: 50 },
            },
            trustVerdict: 'Both sites need to strengthen trust signals',
            actionItem: 'Add certifications, testimonials, and proof points to build trust.',
        };
    }

    private getDefaultAeoReadiness(yourDomain: string, competitorDomain: string): AeoReadinessAnalysis {
        return {
            yourScore: 5,
            competitorScore: 5,
            yourLlmMatch: 'General AI',
            competitorLlmMatch: 'General AI',
            yourCitationLikelihood: 'medium',
            competitorCitationLikelihood: 'medium',
            yourAnalysis: 'Moderate AI readiness. Consider adding more structured data and FAQ content.',
            competitorAnalysis: 'Moderate AI readiness. Standard content structure.',
        };
    }

    private getDefaultRoadmap(yourDomain: string, competitorDomain: string): StrategicRoadmap {
        return {
            primaryOpportunity: 'Improve content specificity and SEO targeting',
            primaryThreat: 'Competitor may outpace in content velocity',
            immediateActions: [
                {
                    number: 1,
                    title: 'Implement Schema Markup',
                    description: 'Add LocalBusiness and Service schema to all pages',
                    category: 'technical',
                    impact: 'high',
                    effort: 'low',
                    timeline: 'immediate',
                },
            ],
            contentToCreate: [
                {
                    title: 'Service Area Landing Page',
                    format: 'pillar page',
                    targetWordCount: 1500,
                    keyInclusion: 'Local keywords and service details',
                },
            ],
            aeoPhases: [
                { phase: 1, name: 'Schema', items: ['LocalBusiness', 'FAQPage'] },
                { phase: 2, name: 'Content', items: ['FAQ sections on service pages'] },
                { phase: 3, name: 'Authority', items: ['Earn local citations and reviews'] },
            ],
            successMetrics: [
                { days: 30, kpis: ['Schema implemented', 'Core Web Vitals improved'] },
                { days: 60, kpis: ['3 new content pieces published'] },
                { days: 90, kpis: ['Improved local pack visibility'] },
            ],
        };
    }
}
