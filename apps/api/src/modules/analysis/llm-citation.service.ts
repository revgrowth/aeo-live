import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// LLM CITATION TESTING SERVICE
// =============================================================================
// This service actually tests whether AI models will cite your content vs
// competitor content by asking domain-relevant questions and analyzing responses.
// =============================================================================

export interface CitationTest {
    question: string;
    category: 'general' | 'specific' | 'comparison' | 'howto';
    yourDomainCited: boolean;
    competitorDomainCited: boolean;
    citationContext?: string; // The snippet where citation occurred
    confidenceScore: number; // 0-100 how confident we are in detection
}

export interface CitationTestResult {
    yourDomain: string;
    competitorDomain: string;
    industry: string;
    questionsAsked: number;
    yourCitationCount: number;
    competitorCitationCount: number;
    yourCitationRate: number; // percentage
    competitorCitationRate: number;
    citationTests: CitationTest[];
    citabilityScore: number; // 0-100 overall score
    competitorCitabilityScore: number;
    citabilityVerdict: {
        winner: 'you' | 'competitor' | 'tie';
        headline: string;
        explanation: string;
        topReasons: string[];
    };
    // Detailed breakdown
    factDensityScore: number; // How many citable facts per 1000 words
    definitiveStatementsScore: number; // Clear, quotable statements
    uniqueInsightsScore: number; // Novel information not found elsewhere
    structuredDataBonus: number; // Schema markup bonus
}

export interface BusinessContext {
    name: string;
    industry: string;
    services: string[];
    location?: string;
    niche?: string;
}

@Injectable()
export class LLMCitationService {
    private anthropic: Anthropic | null = null;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.anthropic = new Anthropic({ apiKey });
            console.log('[LLMCitation] Service initialized');
        } else {
            console.warn('[LLMCitation] No Claude API key - citation testing unavailable');
        }
    }

    isAvailable(): boolean {
        return this.anthropic !== null;
    }

    /**
     * Generate industry-relevant questions that an AI might be asked
     */
    async generateTestQuestions(
        business: BusinessContext,
        count: number = 8
    ): Promise<{ question: string; category: CitationTest['category'] }[]> {
        if (!this.anthropic) {
            return this.getFallbackQuestions(business);
        }

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `You are helping test AI citation likelihood. Generate ${count} questions that someone might ask an AI assistant about the following business's industry:

Business: ${business.name}
Industry: ${business.industry}
Services: ${business.services.join(', ')}
${business.location ? `Location: ${business.location}` : ''}
${business.niche ? `Niche: ${business.niche}` : ''}

Generate questions in these categories:
1. General industry questions (2 questions)
2. Specific service questions (2 questions)  
3. Comparison/recommendation questions (2 questions)
4. How-to/guide questions (2 questions)

Return ONLY valid JSON array:
[
    {"question": "What is the best way to...", "category": "howto"},
    {"question": "How does X compare to Y...", "category": "comparison"}
]`
                }]
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('[LLMCitation] Failed to generate questions:', error);
        }

        return this.getFallbackQuestions(business);
    }

    /**
     * Fallback questions if AI generation fails
     */
    private getFallbackQuestions(business: BusinessContext): { question: string; category: CitationTest['category'] }[] {
        const industry = business.industry.toLowerCase();
        const service = business.services[0] || 'services';

        return [
            { question: `What should I look for when choosing a ${industry} company?`, category: 'general' },
            { question: `How much does ${service} typically cost?`, category: 'specific' },
            { question: `What are the best ${industry} companies${business.location ? ` in ${business.location}` : ''}?`, category: 'comparison' },
            { question: `How do I know if I need ${service}?`, category: 'howto' },
            { question: `What questions should I ask a ${industry} provider?`, category: 'general' },
            { question: `What are common mistakes when hiring for ${service}?`, category: 'specific' },
            { question: `Is ${service} worth the investment?`, category: 'comparison' },
            { question: `How long does ${service} usually take?`, category: 'howto' },
        ];
    }

    /**
     * Test if Claude cites either domain when answering a question
     */
    async testCitation(
        question: string,
        yourDomain: string,
        competitorDomain: string,
        yourContent: string,
        competitorContent: string
    ): Promise<CitationTest> {
        if (!this.anthropic) {
            return {
                question,
                category: 'general',
                yourDomainCited: false,
                competitorDomainCited: false,
                confidenceScore: 0,
            };
        }

        try {
            // First, ask Claude the question WITHOUT any context to see natural citation
            const naturalResponse = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `${question}

When answering, if you reference any specific websites, companies, or sources, please mention them by name or domain.`
                }]
            });

            const naturalText = naturalResponse.content[0].type === 'text'
                ? naturalResponse.content[0].text.toLowerCase()
                : '';

            // Check for domain mentions in natural response
            const yourDomainClean = yourDomain.replace(/^www\./, '').toLowerCase();
            const compDomainClean = competitorDomain.replace(/^www\./, '').toLowerCase();

            const yourNaturalCited = naturalText.includes(yourDomainClean) ||
                naturalText.includes(yourDomain.toLowerCase());
            const compNaturalCited = naturalText.includes(compDomainClean) ||
                naturalText.includes(competitorDomain.toLowerCase());

            // Second, provide both sites' content and ask which would be cited
            const contextResponse = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `I'm evaluating two websites for their likelihood to be cited by AI assistants. Given this question: "${question}"

SITE A (${yourDomain}):
${yourContent.substring(0, 3000)}

SITE B (${competitorDomain}):
${competitorContent.substring(0, 3000)}

Analyze which site would more likely be cited by an AI when answering this question. Consider:
1. Fact density - specific, citable facts vs vague claims
2. Authoritative tone - expertise signals
3. Structured information - clear organization
4. Unique insights - information not found elsewhere

Return ONLY valid JSON:
{
    "siteACitationLikely": true/false,
    "siteBCitationLikely": true/false,
    "reason": "Brief explanation",
    "siteAStrengths": ["strength1"],
    "siteBStrengths": ["strength1"],
    "confidenceScore": 0-100
}`
                }]
            });

            const contextText = contextResponse.content[0].type === 'text'
                ? contextResponse.content[0].text
                : '';

            const jsonMatch = contextText.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                return {
                    question,
                    category: 'general', // Will be set by caller
                    yourDomainCited: yourNaturalCited || analysis.siteACitationLikely,
                    competitorDomainCited: compNaturalCited || analysis.siteBCitationLikely,
                    citationContext: analysis.reason,
                    confidenceScore: analysis.confidenceScore || 70,
                };
            }

            return {
                question,
                category: 'general',
                yourDomainCited: yourNaturalCited,
                competitorDomainCited: compNaturalCited,
                confidenceScore: 50,
            };

        } catch (error) {
            console.error('[LLMCitation] Citation test failed:', error);
            return {
                question,
                category: 'general',
                yourDomainCited: false,
                competitorDomainCited: false,
                confidenceScore: 0,
            };
        }
    }

    /**
     * Analyze content for citable characteristics
     */
    async analyzeContentCitability(
        content: string,
        domain: string
    ): Promise<{
        factDensity: number;
        definitiveStatements: number;
        uniqueInsights: number;
        structuredDataBonus: number;
        overallScore: number;
    }> {
        if (!this.anthropic) {
            return {
                factDensity: 50,
                definitiveStatements: 50,
                uniqueInsights: 50,
                structuredDataBonus: 0,
                overallScore: 50,
            };
        }

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `Analyze this website content for "AI citability" - how likely is an AI assistant to cite this content when answering user questions?

Content from ${domain}:
${content.substring(0, 5000)}

Score each factor 0-100:

1. FACT DENSITY: Specific, verifiable facts vs vague marketing claims
   - High: "We've completed 2,847 projects since 2005"
   - Low: "We have years of experience"

2. DEFINITIVE STATEMENTS: Clear, quotable expert statements
   - High: "The optimal water pressure for residential is 40-60 PSI"
   - Low: "We provide quality service"

3. UNIQUE INSIGHTS: Novel information not found on every competitor site
   - High: Original research, proprietary methods, unique case studies
   - Low: Generic industry information

4. STRUCTURED DATA BONUS: Schema markup, FAQ sections, how-to guides
   - Presence of structured content AI can easily parse

Return ONLY valid JSON:
{
    "factDensity": 0-100,
    "definitiveStatements": 0-100,
    "uniqueInsights": 0-100,
    "structuredDataBonus": 0-20,
    "examples": {
        "bestCitableFact": "example quote",
        "worstGenericStatement": "example quote"
    }
}`
                }]
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                const overallScore = Math.round(
                    (analysis.factDensity * 0.35) +
                    (analysis.definitiveStatements * 0.30) +
                    (analysis.uniqueInsights * 0.25) +
                    (analysis.structuredDataBonus * 0.5) // Bonus up to 10 points
                );

                return {
                    factDensity: analysis.factDensity,
                    definitiveStatements: analysis.definitiveStatements,
                    uniqueInsights: analysis.uniqueInsights,
                    structuredDataBonus: analysis.structuredDataBonus,
                    overallScore: Math.min(100, overallScore),
                };
            }
        } catch (error) {
            console.error('[LLMCitation] Content analysis failed:', error);
        }

        return {
            factDensity: 50,
            definitiveStatements: 50,
            uniqueInsights: 50,
            structuredDataBonus: 0,
            overallScore: 50,
        };
    }

    /**
     * Run full citation testing suite
     */
    async runFullCitationTest(
        yourDomain: string,
        competitorDomain: string,
        yourContent: string,
        competitorContent: string,
        business: BusinessContext
    ): Promise<CitationTestResult> {
        console.log(`[LLMCitation] Starting full citation test: ${yourDomain} vs ${competitorDomain}`);
        const startTime = Date.now();

        // Generate questions
        const questions = await this.generateTestQuestions(business, 8);
        console.log(`[LLMCitation] Generated ${questions.length} test questions`);

        // Run citation tests in parallel (batches of 2 to avoid rate limits)
        const citationTests: CitationTest[] = [];
        for (let i = 0; i < questions.length; i += 2) {
            const batch = questions.slice(i, i + 2);
            const results = await Promise.all(
                batch.map(q =>
                    this.testCitation(q.question, yourDomain, competitorDomain, yourContent, competitorContent)
                        .then(result => ({ ...result, category: q.category }))
                )
            );
            citationTests.push(...results);
        }

        // Analyze content citability
        const [yourCitability, competitorCitability] = await Promise.all([
            this.analyzeContentCitability(yourContent, yourDomain),
            this.analyzeContentCitability(competitorContent, competitorDomain),
        ]);

        // Calculate results
        const yourCitationCount = citationTests.filter(t => t.yourDomainCited).length;
        const competitorCitationCount = citationTests.filter(t => t.competitorDomainCited).length;
        const yourCitationRate = (yourCitationCount / citationTests.length) * 100;
        const competitorCitationRate = (competitorCitationCount / citationTests.length) * 100;

        // Calculate overall citability scores (weighted)
        const yourCitabilityScore = Math.round(
            (yourCitability.overallScore * 0.6) + // Content quality
            (yourCitationRate * 0.4) // Actual citation rate
        );
        const competitorCitabilityScore = Math.round(
            (competitorCitability.overallScore * 0.6) +
            (competitorCitationRate * 0.4)
        );

        // Determine winner
        const scoreDiff = yourCitabilityScore - competitorCitabilityScore;
        let winner: 'you' | 'competitor' | 'tie';
        let headline: string;
        let explanation: string;

        if (scoreDiff > 5) {
            winner = 'you';
            headline = `Your content is ${scoreDiff} points more citable`;
            explanation = `AI assistants are more likely to cite your content when answering questions about ${business.industry}. Your content has stronger fact density and more quotable statements.`;
        } else if (scoreDiff < -5) {
            winner = 'competitor';
            headline = `Competitor leads by ${Math.abs(scoreDiff)} points in AI citability`;
            explanation = `Your competitor's content is currently more likely to be cited by AI assistants. Focus on adding specific facts, statistics, and definitive expert statements.`;
        } else {
            winner = 'tie';
            headline = `Neck and neck in AI citability`;
            explanation = `Both sites have similar likelihood of being cited by AI. Small improvements in fact density could tip the scales in your favor.`;
        }

        // Top reasons based on differences
        const topReasons: string[] = [];
        if (yourCitability.factDensity > competitorCitability.factDensity) {
            topReasons.push('Higher fact density with specific, verifiable claims');
        } else if (yourCitability.factDensity < competitorCitability.factDensity) {
            topReasons.push('Competitor has more specific, citable facts');
        }
        if (yourCitability.definitiveStatements > competitorCitability.definitiveStatements) {
            topReasons.push('More definitive, quotable expert statements');
        } else if (yourCitability.definitiveStatements < competitorCitability.definitiveStatements) {
            topReasons.push('Competitor has more authoritative statements');
        }
        if (yourCitability.uniqueInsights > competitorCitability.uniqueInsights) {
            topReasons.push('Contains unique insights not found elsewhere');
        } else if (yourCitability.uniqueInsights < competitorCitability.uniqueInsights) {
            topReasons.push('Competitor offers more unique information');
        }
        if (yourCitability.structuredDataBonus > competitorCitability.structuredDataBonus) {
            topReasons.push('Better structured content (FAQs, how-tos)');
        }

        const totalTime = Date.now() - startTime;
        console.log(`[LLMCitation] Test complete in ${(totalTime / 1000).toFixed(1)}s`);
        console.log(`[LLMCitation] Your citability: ${yourCitabilityScore}, Competitor: ${competitorCitabilityScore}`);

        return {
            yourDomain,
            competitorDomain,
            industry: business.industry,
            questionsAsked: citationTests.length,
            yourCitationCount,
            competitorCitationCount,
            yourCitationRate,
            competitorCitationRate,
            citationTests,
            citabilityScore: yourCitabilityScore,
            competitorCitabilityScore,
            citabilityVerdict: {
                winner,
                headline,
                explanation,
                topReasons,
            },
            factDensityScore: yourCitability.factDensity,
            definitiveStatementsScore: yourCitability.definitiveStatements,
            uniqueInsightsScore: yourCitability.uniqueInsights,
            structuredDataBonus: yourCitability.structuredDataBonus,
        };
    }
}
