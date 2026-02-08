import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// CONTENT GAP ANALYSIS SERVICE
// =============================================================================
// Uses Claude to analyze what content/topics competitor covers that you don't,
// identifying opportunities for content creation and improvement.

export interface TopicGap {
    topic: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
}

export interface ContentGapResult {
    // Topics competitor covers that you're missing
    topicsMissing: TopicGap[];

    // Areas where your content is less detailed than competitor
    depthGaps: {
        area: string;
        yourDepth: 'none' | 'shallow' | 'moderate' | 'detailed';
        competitorDepth: 'none' | 'shallow' | 'moderate' | 'detailed';
        suggestion: string;
    }[];

    // Content formats competitor uses that you don't
    formatGaps: {
        format: string;
        present: boolean;
        competitorHas: boolean;
        impact: 'high' | 'medium' | 'low';
    }[];

    // Quick wins - easy improvements you can make
    quickWins: string[];

    // Strategic recommendations
    strategicPriorities: string[];

    // Overall content gap score (0-100, higher = more gaps)
    gapScore: number;
}

export interface ContentGapComparison {
    result: ContentGapResult;
    analysisDate: string;
    yourWordCount: number;
    competitorWordCount: number;
}

@Injectable()
export class ContentGapService {
    private anthropic: Anthropic | null = null;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.anthropic = new Anthropic({ apiKey });
            console.log('[ContentGap] Service initialized with Claude');
        } else {
            console.log('[ContentGap] No API key - service disabled');
        }
    }

    /**
     * Analyze content gaps between your site and competitor
     */
    async analyzeContentGaps(
        yourContent: string,
        competitorContent: string,
        yourDomain: string,
        competitorDomain: string,
        industry?: string
    ): Promise<ContentGapComparison> {
        const defaultResult: ContentGapResult = {
            topicsMissing: [],
            depthGaps: [],
            formatGaps: [],
            quickWins: [],
            strategicPriorities: [],
            gapScore: 50,
        };

        if (!this.anthropic) {
            console.log('[ContentGap] No API key - returning default result');
            return {
                result: defaultResult,
                analysisDate: new Date().toISOString(),
                yourWordCount: yourContent.split(/\s+/).length,
                competitorWordCount: competitorContent.split(/\s+/).length,
            };
        }

        try {
            console.log(`[ContentGap] Analyzing gaps: ${yourDomain} vs ${competitorDomain}`);

            // Truncate content to avoid token limits while keeping meaningful context
            const yourTruncated = this.truncateContent(yourContent, 8000);
            const competitorTruncated = this.truncateContent(competitorContent, 8000);

            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: `You are analyzing two competing websites to identify content gaps.

**Your Site (${yourDomain}):**
${yourTruncated}

---

**Competitor Site (${competitorDomain}):**
${competitorTruncated}

---

${industry ? `Industry Context: ${industry}` : ''}

Analyze the content and respond in this exact JSON format:
{
    "topicsMissing": [
        {"topic": "Topic name", "importance": "critical|high|medium|low", "description": "Why this matters", "recommendation": "How to address it"}
    ],
    "depthGaps": [
        {"area": "Topic area", "yourDepth": "none|shallow|moderate|detailed", "competitorDepth": "none|shallow|moderate|detailed", "suggestion": "How to improve"}
    ],
    "formatGaps": [
        {"format": "Format type (video, FAQ, case studies, etc)", "present": false, "competitorHas": true, "impact": "high|medium|low"}
    ],
    "quickWins": ["Easy improvement 1", "Easy improvement 2"],
    "strategicPriorities": ["Major strategic recommendation 1", "Major strategic recommendation 2"],
    "gapScore": 65
}

Focus on actionable, specific gaps. The gapScore should be 0-100 where higher means more critical gaps exist.
Identify 3-5 missing topics, 2-4 depth gaps, and check for these formats: FAQ, case studies, testimonials, pricing, video, infographics, calculator/tools.

Respond ONLY with valid JSON, no other text.`
                }],
            });

            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }

            // Parse JSON response
            const parsed = this.parseJsonResponse(content.text);

            console.log(`[ContentGap] Analysis complete: ${parsed.topicsMissing?.length || 0} missing topics, gap score ${parsed.gapScore}`);

            return {
                result: {
                    topicsMissing: parsed.topicsMissing || [],
                    depthGaps: parsed.depthGaps || [],
                    formatGaps: parsed.formatGaps || [],
                    quickWins: parsed.quickWins || [],
                    strategicPriorities: parsed.strategicPriorities || [],
                    gapScore: parsed.gapScore || 50,
                },
                analysisDate: new Date().toISOString(),
                yourWordCount: yourContent.split(/\s+/).length,
                competitorWordCount: competitorContent.split(/\s+/).length,
            };

        } catch (error) {
            console.error('[ContentGap] Analysis failed:', error);
            return {
                result: defaultResult,
                analysisDate: new Date().toISOString(),
                yourWordCount: yourContent.split(/\s+/).length,
                competitorWordCount: competitorContent.split(/\s+/).length,
            };
        }
    }

    /**
     * Quick content comparison without deep analysis
     */
    async quickCompare(yourContent: string, competitorContent: string): Promise<{
        yourTopics: string[];
        competitorTopics: string[];
        sharedTopics: string[];
        uniqueToCompetitor: string[];
        uniqueToYou: string[];
    }> {
        if (!this.anthropic) {
            return {
                yourTopics: [],
                competitorTopics: [],
                sharedTopics: [],
                uniqueToCompetitor: [],
                uniqueToYou: [],
            };
        }

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: `Extract the main topics/themes from these two content pieces.

Content 1:
${this.truncateContent(yourContent, 4000)}

Content 2:
${this.truncateContent(competitorContent, 4000)}

Respond in JSON format:
{
    "content1Topics": ["topic1", "topic2"],
    "content2Topics": ["topic1", "topic2"],
    "sharedTopics": ["shared1"],
    "uniqueToContent2": ["unique1"]
    "uniqueToContent1": ["unique1"]
}

Only respond with JSON.`
                }],
            });

            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }

            const parsed = this.parseJsonResponse(content.text);

            return {
                yourTopics: parsed.content1Topics || [],
                competitorTopics: parsed.content2Topics || [],
                sharedTopics: parsed.sharedTopics || [],
                uniqueToCompetitor: parsed.uniqueToContent2 || [],
                uniqueToYou: parsed.uniqueToContent1 || [],
            };

        } catch {
            return {
                yourTopics: [],
                competitorTopics: [],
                sharedTopics: [],
                uniqueToCompetitor: [],
                uniqueToYou: [],
            };
        }
    }

    private truncateContent(content: string, maxChars: number): string {
        if (content.length <= maxChars) {
            return content;
        }
        return content.substring(0, maxChars) + '\n\n[Content truncated for analysis...]';
    }

    private parseJsonResponse(text: string): any {
        try {
            // Try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(text);
        } catch {
            console.error('[ContentGap] Failed to parse JSON response');
            return {};
        }
    }
}
