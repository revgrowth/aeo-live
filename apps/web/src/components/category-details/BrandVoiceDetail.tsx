'use client';

import { useState } from 'react';
import {
    MessageSquare, AlertTriangle, CheckCircle, Sparkles, Award,
    Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
    Brain, Fingerprint, Heart, Mic, Shield, Zap, Eye, Users,
    Volume2, Lightbulb, Quote, Star, Flame, Ghost, Copy, XCircle
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface SubcategoryData {
    score: number;
    weight: number;
    evidence: string[];
    issues: string[];
}

interface BrandPersonality {
    confidence: number;
    tone: number;
    position: number;
    complexity: number;
    risk: number;
    energy: number;
    label: string;
    description: string;
}

interface VoiceDetails {
    distinctiveness?: {
        score: number;
        uniquePhrases: string[];
        memorableExpressions: string[];
        genericElements: string[];
        identifiability: 'high' | 'medium' | 'low';
    };
    vocabulary?: {
        score: number;
        proprietaryFrameworks: string[];
        signaturePhrases: string[];
        clicheInventory: Array<{ phrase: string; count: number }>;
        uniqueTerms: string[];
    };
    toneConsistency?: {
        score: number;
        toneByPageType: Record<string, string>;
        inconsistencies: string[];
        dominantTone: string;
    };
    authenticity?: {
        score: number;
        genuineMoments: number;
        corporateFiller: number;
        specificStories: number;
        opinionsExpressed: number;
    };
    personality?: BrandPersonality;
    // NEW: Multi-Perspective Analysis Fields
    aiReadability?: {
        score: number;
        structureClarity: number;
        quotability: number;
        factDensity: number;
        definitiveStatements: number;
    };
    searchEngineQuality?: {
        score: number;
        eeatSignals: number;
        contentDepth: number;
        originalityScore: number;
        helpfulnessScore: number;
    };
    humanResonance?: {
        score: number;
        emotionalConnection: number;
        memorability: number;
        shareability: number;
        authenticity: number;
    };
    slopIndicators?: {
        antiGenericScore: number;
        corporateBuzzwordCount: number;
        aiGeneratedMarkers: string[];
        slopDensity: number;
        templatePhrases: string[];
    };
    brandDnaClarity?: {
        missionClarity: number;
        valueAlignment: number;
        purposeExpression: number;
        positioningStrength: number;
    };
    voiceMemorabilityIndex?: number;
}

interface BrandVoiceData {
    score: number;
    subcategories: Record<string, SubcategoryData>;
    insights: string[];
    recommendations: string[];
    voiceDetails?: VoiceDetails | null;
}

interface Props {
    yourData: BrandVoiceData;
    competitorData: BrandVoiceData;
    yourDomain: string;
    competitorDomain: string;
}

// ============================================
// SUBCATEGORY METADATA
// ============================================
const SUBCATEGORY_CONFIG: Record<string, {
    icon: any;
    label: string;
    description: string;
    whyItMatters: string;
    gradient: string;
    bgGradient: string;
}> = {
    voiceDistinctiveness: {
        icon: Fingerprint,
        label: 'Voice Distinctiveness',
        description: 'How unique and recognizable is your brand voice?',
        whyItMatters: 'A distinctive voice makes your brand instantly recognizable. Without it, you blend into a sea of generic competitors.',
        gradient: 'from-violet-500 to-purple-500',
        bgGradient: 'from-violet-50 to-purple-50'
    },
    vocabularyUniqueness: {
        icon: Quote,
        label: 'Vocabulary Uniqueness',
        description: 'Do you have proprietary terms and signature phrases?',
        whyItMatters: 'Unique vocabulary creates mental real estate. Think "Just Do It" or "Think Different" - ownable phrases become assets.',
        gradient: 'from-fuchsia-500 to-pink-500',
        bgGradient: 'from-fuchsia-50 to-pink-50'
    },
    toneConsistency: {
        icon: Volume2,
        label: 'Tone Consistency',
        description: 'Is your voice consistent across all touchpoints?',
        whyItMatters: 'Inconsistent tone confuses customers and erodes trust. Every page should sound like it came from the same brand.',
        gradient: 'from-blue-500 to-cyan-500',
        bgGradient: 'from-blue-50 to-cyan-50'
    },
    authenticitySignals: {
        icon: Heart,
        label: 'Authenticity Signals',
        description: 'Does your content feel genuine or corporate?',
        whyItMatters: 'AI and humans can detect inauthentic content. Real stories, opinions, and specifics build trust; corporate filler destroys it.',
        gradient: 'from-rose-500 to-red-500',
        bgGradient: 'from-rose-50 to-red-50'
    },
    competitiveDifferentiation: {
        icon: Shield,
        label: 'Competitive Differentiation',
        description: 'How different is your voice from competitors?',
        whyItMatters: 'If you sound like everyone else, you\'ll compete on price alone. A differentiated voice creates preference.',
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-50 to-teal-50'
    },
    aiReadability: {
        icon: Brain,
        label: 'AI Readability',
        description: 'Can AI assistants understand and cite your content?',
        whyItMatters: 'ChatGPT, Perplexity, and Google AI need clear, structured content to recommend you. Poor AI readability means invisibility.',
        gradient: 'from-indigo-500 to-violet-500',
        bgGradient: 'from-indigo-50 to-violet-50'
    },
    humanResonance: {
        icon: Users,
        label: 'Human Resonance',
        description: 'Does your content create emotional connection?',
        whyItMatters: 'Humans buy on emotion. Content that resonates gets shared, remembered, and acted upon.',
        gradient: 'from-amber-500 to-orange-500',
        bgGradient: 'from-amber-50 to-orange-50'
    },
    brandDnaClarity: {
        icon: Lightbulb,
        label: 'Brand DNA Clarity',
        description: 'Is your mission, values, and purpose clear?',
        whyItMatters: 'When your "why" is crystal clear, customers become advocates. Fuzzy purpose = forgettable brand.',
        gradient: 'from-sky-500 to-blue-500',
        bgGradient: 'from-sky-50 to-blue-50'
    },
    antiGenericScore: {
        icon: Ghost,
        label: 'Anti-Generic Score',
        description: 'How original is your content vs. template slop?',
        whyItMatters: 'Generic AI-generated content is flooding the web. Standing out requires originality that AI detectors notice.',
        gradient: 'from-slate-500 to-gray-600',
        bgGradient: 'from-slate-50 to-gray-50'
    },
};

// ============================================
// HELPER COMPONENTS
// ============================================

function AnimatedScoreRing({ score, size = 120, isYou = true }: {
    score: number;
    size?: number;
    isYou?: boolean;
}) {
    const radius = (size - 12) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 80) return { stroke: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' }; // Purple for brand voice
        if (s >= 60) return { stroke: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' };
        if (s >= 40) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' };
        return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
    };

    const colors = getColor(score);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-50"
                style={{ background: colors.glow }}
            />
            <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={isYou ? '#e2e8f0' : '#f1f5f9'}
                    strokeWidth={10}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={10}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className="text-3xl font-black" style={{ color: colors.stroke }}>
                    {score}
                </span>
                <span className="text-xs text-slate-500 font-medium">/100</span>
            </div>
        </div>
    );
}

function ComparisonBadge({ diff }: { diff: number }) {
    if (diff > 0) {
        return (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30">
                <TrendingUp className="w-4 h-4" />
                <span>+{diff}</span>
            </div>
        );
    } else if (diff < 0) {
        return (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm font-bold shadow-lg shadow-rose-500/30">
                <TrendingDown className="w-4 h-4" />
                <span>{diff}</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-200 text-slate-600 text-sm font-bold">
            <Minus className="w-4 h-4" />
            <span>Tied</span>
        </div>
    );
}

function PersonalityRadarChart({ personality }: { personality: BrandPersonality }) {
    const dimensions = [
        { key: 'confidence', label: 'Confidence', lowLabel: 'Humble', highLabel: 'Bold' },
        { key: 'tone', label: 'Tone', lowLabel: 'Serious', highLabel: 'Playful' },
        { key: 'position', label: 'Position', lowLabel: 'Established', highLabel: 'Challenger' },
        { key: 'complexity', label: 'Complexity', lowLabel: 'Technical', highLabel: 'Accessible' },
        { key: 'risk', label: 'Risk', lowLabel: 'Safe', highLabel: 'Provocative' },
        { key: 'energy', label: 'Energy', lowLabel: 'Calm', highLabel: 'Energetic' },
    ];

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Brand Personality DNA</h3>
                    <p className="text-sm text-slate-500">Your voice archetype across 6 dimensions</p>
                </div>
                {personality.label && (
                    <span className="ml-auto px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-bold shadow-lg shadow-violet-500/30">
                        {personality.label}
                    </span>
                )}
            </div>

            <div className="grid gap-4">
                {dimensions.map(dim => {
                    const value = personality[dim.key as keyof BrandPersonality] as number || 50;
                    return (
                        <div key={dim.key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">{dim.lowLabel}</span>
                                <span className="text-sm font-bold text-slate-800">{dim.label}</span>
                                <span className="text-xs font-medium text-slate-500">{dim.highLabel}</span>
                            </div>
                            <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                                {/* Center marker */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300" />
                                {/* Value indicator */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/40 transition-all duration-700"
                                    style={{ left: `calc(${value}% - 8px)` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {personality.description && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200">
                    <p className="text-sm text-violet-800 italic">"{personality.description}"</p>
                </div>
            )}
        </div>
    );
}

function AuthenticityMeter({ authenticity, cliches }: {
    authenticity?: VoiceDetails['authenticity'];
    cliches?: Array<{ phrase: string; count: number }>;
}) {
    const score = authenticity?.score ?? 50;
    const genuineMoments = authenticity?.genuineMoments ?? 0;
    const corporateFiller = authenticity?.corporateFiller ?? 0;
    const specificStories = authenticity?.specificStories ?? 0;

    const getScoreColor = (s: number) => {
        if (s >= 80) return { bg: 'from-emerald-500 to-green-500', text: 'text-emerald-600', label: 'AUTHENTIC' };
        if (s >= 60) return { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-600', label: 'GENUINE' };
        if (s >= 40) return { bg: 'from-amber-500 to-orange-500', text: 'text-amber-600', label: 'MIXED' };
        return { bg: 'from-rose-500 to-red-500', text: 'text-rose-600', label: 'CORPORATE SLOP' };
    };

    const config = getScoreColor(score);

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Authenticity Analysis</h3>
                    <p className="text-sm text-slate-500">Real voice vs. corporate template</p>
                </div>
            </div>

            {/* Main Score */}
            <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${config.bg} text-white font-bold shadow-lg`}>
                    {config.label}
                </div>
                <div className={`text-5xl font-black mt-4 ${config.text}`}>{score}</div>
                <div className="text-sm text-slate-500 mt-1">Authenticity Score</div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-2xl font-black text-emerald-600">{genuineMoments}</div>
                    <div className="text-xs text-emerald-700">Genuine Moments</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-sky-50 border border-sky-200">
                    <div className="text-2xl font-black text-sky-600">{specificStories}</div>
                    <div className="text-xs text-sky-700">Specific Stories</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="text-2xl font-black text-rose-600">{corporateFiller}</div>
                    <div className="text-xs text-rose-700">Corporate Filler</div>
                </div>
            </div>

            {/* Clichés Found */}
            {cliches && cliches.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Copy className="w-4 h-4 text-rose-500" />
                        Overused Clichés Detected
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {cliches.slice(0, 6).map((c, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-medium border border-rose-200"
                            >
                                "{c.phrase}" <span className="font-bold">×{c.count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function VoiceDNAHelix({ vocabulary }: { vocabulary?: VoiceDetails['vocabulary'] }) {
    const frameworks = vocabulary?.proprietaryFrameworks ?? [];
    const signaturePhrases = vocabulary?.signaturePhrases ?? [];
    const uniqueTerms = vocabulary?.uniqueTerms ?? [];

    const hasContent = frameworks.length > 0 || signaturePhrases.length > 0 || uniqueTerms.length > 0;

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 border border-violet-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                    <Fingerprint className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Voice DNA Signature</h3>
                    <p className="text-sm text-slate-500">Your unique linguistic fingerprint</p>
                </div>
            </div>

            {hasContent ? (
                <div className="space-y-4">
                    {frameworks.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                Proprietary Frameworks
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {frameworks.map((f, i) => (
                                    <span key={i} className="px-3 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-800 text-sm font-medium shadow-sm">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {signaturePhrases.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Quote className="w-4 h-4" />
                                Signature Phrases
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {signaturePhrases.map((p, i) => (
                                    <span key={i} className="px-3 py-2 rounded-xl bg-white border border-violet-200 text-violet-800 text-sm font-medium shadow-sm italic">
                                        "{p}"
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {uniqueTerms.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Unique Terminology
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {uniqueTerms.map((t, i) => (
                                    <span key={i} className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold border border-purple-200">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Ghost className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No unique voice signatures detected</p>
                    <p className="text-sm text-slate-400 mt-1">Develop proprietary frameworks and signature phrases to stand out</p>
                </div>
            )}
        </div>
    );
}

function DistinctivenessPanel({ distinctiveness }: { distinctiveness?: VoiceDetails['distinctiveness'] }) {
    const score = distinctiveness?.score ?? 50;
    const identifiability = distinctiveness?.identifiability ?? 'medium';
    const uniquePhrases = distinctiveness?.uniquePhrases ?? [];
    const memorableExpressions = distinctiveness?.memorableExpressions ?? [];
    const genericElements = distinctiveness?.genericElements ?? [];

    const identifiabilityConfig = {
        high: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: '🎯 Highly Identifiable' },
        medium: { color: 'text-amber-600', bg: 'bg-amber-100', label: '⚠️ Somewhat Generic' },
        low: { color: 'text-rose-600', bg: 'bg-rose-100', label: '❌ Blend-In Voice' },
    };

    const config = identifiabilityConfig[identifiability];

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Voice Recognition Test</h3>
                    <p className="text-sm text-slate-500">Could someone identify your brand without seeing the logo?</p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="text-4xl font-black text-slate-900">{score}<span className="text-lg text-slate-400">/100</span></div>
                    <div className="text-sm text-slate-500">Distinctiveness Score</div>
                </div>
                <span className={`px-4 py-2 rounded-full ${config.bg} ${config.color} font-bold text-sm`}>
                    {config.label}
                </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Unique Elements */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Unique Elements ({uniquePhrases.length + memorableExpressions.length})
                    </h4>
                    <div className="space-y-2">
                        {[...uniquePhrases, ...memorableExpressions].slice(0, 4).map((item, i) => (
                            <div key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                "{item}"
                            </div>
                        ))}
                        {uniquePhrases.length + memorableExpressions.length === 0 && (
                            <p className="text-sm text-emerald-600 italic">No unique phrases detected yet</p>
                        )}
                    </div>
                </div>

                {/* Generic Elements */}
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                    <h4 className="text-sm font-bold text-rose-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Generic Phrases ({genericElements.length})
                    </h4>
                    <div className="space-y-2">
                        {genericElements.slice(0, 4).map((item, i) => (
                            <div key={i} className="text-sm text-rose-700 flex items-start gap-2">
                                <span className="text-rose-500 mt-0.5">✗</span>
                                "{item}"
                            </div>
                        ))}
                        {genericElements.length === 0 && (
                            <p className="text-sm text-rose-600 italic">No generic phrases detected</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AiHumanScorePanel({ yourVoiceDetails, competitorVoiceDetails }: {
    yourVoiceDetails?: VoiceDetails;
    competitorVoiceDetails?: VoiceDetails;
}) {
    const yourAiScore = yourVoiceDetails?.aiReadability?.score ?? 50;
    const yourHumanScore = yourVoiceDetails?.humanResonance?.score ?? 50;
    const yourSearchScore = yourVoiceDetails?.searchEngineQuality?.score ?? 50;

    const compAiScore = competitorVoiceDetails?.aiReadability?.score ?? 50;
    const compHumanScore = competitorVoiceDetails?.humanResonance?.score ?? 50;
    const compSearchScore = competitorVoiceDetails?.searchEngineQuality?.score ?? 50;

    const getDiffBadge = (yours: number, theirs: number) => {
        const diff = yours - theirs;
        if (diff > 0) return { label: `+${diff}`, color: 'bg-emerald-500 text-white', icon: '↑' };
        if (diff < 0) return { label: `${diff}`, color: 'bg-rose-500 text-white', icon: '↓' };
        return { label: 'Tied', color: 'bg-slate-300 text-slate-700', icon: '=' };
    };

    const getScoreConfig = (score: number) => {
        if (score >= 80) return { color: 'text-emerald-600', bg: 'bg-emerald-100' };
        if (score >= 60) return { color: 'text-blue-600', bg: 'bg-blue-100' };
        if (score >= 40) return { color: 'text-amber-600', bg: 'bg-amber-100' };
        return { color: 'text-rose-600', bg: 'bg-rose-100' };
    };

    const renderScoreCard = (
        icon: React.ReactNode,
        title: string,
        subtitle: string,
        yourScore: number,
        compScore: number,
        borderColor: string,
        iconColor: string
    ) => {
        const diff = getDiffBadge(yourScore, compScore);
        const isWinning = yourScore > compScore;

        return (
            <div className={`p-4 rounded-xl bg-white border ${borderColor}`}>
                <div className="text-center mb-3">
                    <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${iconColor}`}>
                        {icon}
                    </div>
                    <div className="text-sm font-bold text-slate-800">{title}</div>
                    <p className="text-[10px] text-slate-500">{subtitle}</p>
                </div>

                {/* Comparison */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className={`text-center p-2 rounded-lg ${isWinning ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">You</div>
                        <div className={`text-2xl font-black ${isWinning ? 'text-emerald-600' : getScoreConfig(yourScore).color}`}>{yourScore}</div>
                    </div>
                    <div className={`text-center p-2 rounded-lg ${!isWinning && yourScore !== compScore ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50 border border-slate-200'}`}>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">Them</div>
                        <div className={`text-2xl font-black ${!isWinning && yourScore !== compScore ? 'text-rose-600' : 'text-slate-500'}`}>{compScore}</div>
                    </div>
                </div>

                {/* Difference Badge */}
                <div className="text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${diff.color}`}>
                        {diff.icon} {diff.label}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-indigo-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Three-Way Voice Analysis</h3>
                    <p className="text-sm text-slate-500">How AI, Search Engines, and Humans perceive your content</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {renderScoreCard(
                    <Brain className="w-5 h-5 text-white" />,
                    'AI Readability',
                    'Can ChatGPT cite you?',
                    yourAiScore,
                    compAiScore,
                    'border-indigo-200',
                    'bg-gradient-to-br from-indigo-500 to-violet-500'
                )}
                {renderScoreCard(
                    <Sparkles className="w-5 h-5 text-white" />,
                    'Search Quality',
                    'E-E-A-T signals',
                    yourSearchScore,
                    compSearchScore,
                    'border-blue-200',
                    'bg-gradient-to-br from-blue-500 to-cyan-500'
                )}
                {renderScoreCard(
                    <Heart className="w-5 h-5 text-white" />,
                    'Human Resonance',
                    'Emotional connection',
                    yourHumanScore,
                    compHumanScore,
                    'border-rose-200',
                    'bg-gradient-to-br from-rose-500 to-pink-500'
                )}
            </div>
        </div>
    );
}


function SlopDetectorPanel({ yourSlopIndicators, competitorSlopIndicators }: {
    yourSlopIndicators?: VoiceDetails['slopIndicators'];
    competitorSlopIndicators?: VoiceDetails['slopIndicators'];
}) {
    const yourScore = yourSlopIndicators?.antiGenericScore ?? 50;
    const compScore = competitorSlopIndicators?.antiGenericScore ?? 50;
    const diff = yourScore - compScore;
    const isWinning = diff > 0;

    const yourBuzzwords = yourSlopIndicators?.corporateBuzzwordCount ?? 0;
    const compBuzzwords = competitorSlopIndicators?.corporateBuzzwordCount ?? 0;
    const yourSlopDensity = (yourSlopIndicators?.slopDensity ?? 0) * 100;
    const compSlopDensity = (competitorSlopIndicators?.slopDensity ?? 0) * 100;
    const templatePhrases = yourSlopIndicators?.templatePhrases ?? [];

    const getScoreLabel = (score: number) => {
        if (score >= 80) return { label: '🎯 HIGHLY ORIGINAL', color: 'text-emerald-600', bg: 'from-emerald-500 to-green-500' };
        if (score >= 60) return { label: '✅ MOSTLY ORIGINAL', color: 'text-blue-600', bg: 'from-blue-500 to-cyan-500' };
        if (score >= 40) return { label: '⚠️ SOME GENERIC', color: 'text-amber-600', bg: 'from-amber-500 to-orange-500' };
        return { label: '❌ AI SLOP', color: 'text-rose-600', bg: 'from-rose-500 to-red-500' };
    };

    const yourConfig = getScoreLabel(yourScore);
    const compConfig = getScoreLabel(compScore);

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center">
                    <Ghost className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">AI Slop Detector</h3>
                    <p className="text-sm text-slate-500">Originality comparison</p>
                </div>
                {/* Difference Badge */}
                <div className="ml-auto">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${isWinning ? 'bg-emerald-500 text-white' : diff < 0 ? 'bg-rose-500 text-white' : 'bg-slate-300 text-slate-700'
                        }`}>
                        {isWinning ? '↑' : diff < 0 ? '↓' : '='} {diff > 0 ? '+' : ''}{diff}
                    </span>
                </div>
            </div>

            {/* You vs Competitor Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-xl ${isWinning ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2">Your Originality</div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${yourConfig.bg} text-white mb-2`}>
                        {yourConfig.label}
                    </div>
                    <div className={`text-4xl font-black ${isWinning ? 'text-emerald-600' : yourConfig.color}`}>{yourScore}</div>
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Buzzwords</span>
                            <span className={`font-bold ${yourBuzzwords <= compBuzzwords ? 'text-emerald-600' : 'text-rose-600'}`}>{yourBuzzwords}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Slop %</span>
                            <span className={`font-bold ${yourSlopDensity <= compSlopDensity ? 'text-emerald-600' : 'text-rose-600'}`}>{yourSlopDensity.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <div className={`p-4 rounded-xl ${!isWinning && diff !== 0 ? 'bg-rose-50 border-2 border-rose-300' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2">Competitor</div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${compConfig.bg} text-white mb-2`}>
                        {compConfig.label}
                    </div>
                    <div className={`text-4xl font-black ${!isWinning && diff !== 0 ? 'text-rose-600' : 'text-slate-500'}`}>{compScore}</div>
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Buzzwords</span>
                            <span className="font-bold text-slate-500">{compBuzzwords}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Slop %</span>
                            <span className="font-bold text-slate-500">{compSlopDensity.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Phrases - or Tips if none */}
            {templatePhrases.length > 0 ? (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Copy className="w-4 h-4 text-rose-500" />
                        Your Generic Phrases to Eliminate
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {templatePhrases.slice(0, 4).map((phrase, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-medium border border-rose-200">
                                "{phrase}"
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Originality Insight - Always shows */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    Originality Insight
                </h4>

                {/* Visual originality gauge */}
                <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>AI Slop</span>
                        <span>Original</span>
                    </div>
                    <div className="h-3 rounded-full bg-gradient-to-r from-rose-200 via-amber-200 to-emerald-200 overflow-hidden relative">
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-slate-800 rounded-full shadow-lg"
                            style={{ left: `${yourScore}%`, transform: 'translateX(-50%)' }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                    </div>
                </div>

                {/* Quick tip based on score */}
                <div className={`p-3 rounded-lg ${yourScore >= 70 ? 'bg-emerald-50 border border-emerald-200' :
                    yourScore >= 40 ? 'bg-amber-50 border border-amber-200' :
                        'bg-rose-50 border border-rose-200'
                    }`}>
                    <div className="text-xs font-medium">
                        {yourScore >= 70 ? (
                            <span className="text-emerald-700">
                                ✓ Great job! Your content stands out from generic AI output. Keep using specific examples, data, and unique perspectives.
                            </span>
                        ) : yourScore >= 40 ? (
                            <span className="text-amber-700">
                                ⚠ Your content has some generic patterns. Try replacing vague claims with specific examples and adding your unique POV.
                            </span>
                        ) : (
                            <span className="text-rose-700">
                                ✗ High AI/template markers detected. Rewrite with specific stories, data points, and opinions that only you can provide.
                            </span>
                        )}
                    </div>
                </div>

                {/* Originality Checklist */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <h5 className="text-xs font-bold text-slate-600 uppercase mb-3">What Makes Content Original</h5>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'Specific data/stats', icon: '📊' },
                            { label: 'Personal stories', icon: '💬' },
                            { label: 'Unique opinions', icon: '💡' },
                            { label: 'Real examples', icon: '🎯' },
                            { label: 'Industry jargon', icon: '🔧' },
                            { label: 'Named sources', icon: '📝' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-600 p-2 rounded-lg bg-white border border-slate-100">
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Slop Phrases to Avoid */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <h5 className="text-xs font-bold text-rose-600 uppercase mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Common AI Slop to Avoid
                    </h5>
                    <div className="space-y-2">
                        {[
                            '"In today\'s digital landscape..."',
                            '"Unlock the power of..."',
                            '"At the end of the day..."',
                            '"It\'s important to note..."',
                            '"Dive deep into..."',
                            '"Synergy / leverage / optimize"',
                        ].map((phrase, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700">
                                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="italic">{phrase}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}



function SubcategoryCard({
    subcatKey,
    yourScore,
    compScore,
    weight,
    evidence,
    issues
}: {
    subcatKey: string;
    yourScore: number;
    compScore: number;
    weight: number;
    evidence: string[];
    issues: string[];
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const config = SUBCATEGORY_CONFIG[subcatKey] || {
        icon: Zap,
        label: subcatKey.replace(/([A-Z])/g, ' $1').trim(),
        description: 'Voice quality metric',
        whyItMatters: 'This factor affects your brand\'s voice perception.',
        gradient: 'from-slate-500 to-slate-600',
        bgGradient: 'from-slate-50 to-slate-100'
    };
    const Icon = config.icon;
    const diff = yourScore - compScore;
    const isWinning = diff > 0;
    const hasDetails = evidence.length > 0 || issues.length > 0;

    return (
        <div
            className={`
                relative overflow-hidden rounded-2xl border transition-all duration-300
                ${isWinning ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-green-50/80' :
                    diff < 0 ? 'border-rose-200 bg-gradient-to-br from-rose-50/80 to-pink-50/80' :
                        'border-slate-200 bg-gradient-to-br from-slate-50/80 to-white/80'}
                hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5
            `}
        >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />

            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`
                            w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} 
                            flex items-center justify-center shadow-lg
                        `}
                            style={{ boxShadow: `0 8px 20px -4px ${isWinning ? 'rgba(16, 185, 129, 0.3)' : diff < 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(100, 116, 139, 0.2)'}` }}
                        >
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">{config.label}</h4>
                            <p className="text-xs text-slate-500">{config.description}</p>
                        </div>
                    </div>
                    <ComparisonBadge diff={diff} />
                </div>

                <div className="mb-4 p-3 rounded-lg bg-white/60 border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-700">Why this matters: </span>
                        {config.whyItMatters}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">You</span>
                            <span className={`text-2xl font-black ${isWinning ? 'text-emerald-600' : 'text-slate-700'}`}>
                                {yourScore}
                            </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isWinning ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-slate-400 to-slate-500'
                                    }`}
                                style={{ width: `${yourScore}%` }}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Competitor</span>
                            <span className={`text-2xl font-black ${diff < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                {compScore}
                            </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${diff < 0 ? 'bg-gradient-to-r from-rose-400 to-red-500' : 'bg-gradient-to-r from-slate-300 to-slate-400'
                                    }`}
                                style={{ width: `${compScore}%` }}
                            />
                        </div>
                    </div>
                </div>

                {hasDetails && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        {isExpanded ? (
                            <>Hide Details <ChevronUp className="w-4 h-4" /></>
                        ) : (
                            <>View Details <ChevronDown className="w-4 h-4" /></>
                        )}
                    </button>
                )}

                {isExpanded && hasDetails && (
                    <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-3">
                        {evidence.map((e, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-emerald-100/50 border border-emerald-200/50">
                                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-emerald-800">{e}</span>
                            </div>
                        ))}
                        {issues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-rose-100/50 border border-rose-200/50">
                                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-rose-800">{issue}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BrandVoiceDetail({ yourData, competitorData, yourDomain, competitorDomain }: Props) {
    const scoreDiff = yourData.score - competitorData.score;
    const isWinning = scoreDiff > 0;

    const subcats = yourData.subcategories || {};
    const compSubcats = competitorData.subcategories || {};
    const voiceDetails = yourData.voiceDetails;

    // Count wins/losses
    const wins = Object.entries(subcats).filter(([key]) => {
        const compScore = compSubcats[key]?.score || 50;
        return subcats[key].score > compScore;
    }).length;
    const losses = Object.entries(subcats).filter(([key]) => {
        const compScore = compSubcats[key]?.score || 50;
        return subcats[key].score < compScore;
    }).length;

    // Format domain for display
    const formatDomain = (url: string) => {
        try {
            return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
        } catch {
            return url.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
        }
    };

    return (
        <div className="space-y-8">
            {/* ============================================ */}
            {/* HERO SECTION */}
            {/* ============================================ */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 md:p-10">
                {/* Animated gradient orbs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-500/30">
                            <MessageSquare className="w-7 h-7 md:w-8 md:h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-white">Brand Voice/DNA Analysis</h2>
                            <p className="text-slate-400 text-sm md:text-base">Deep analysis of what makes your brand unique</p>
                        </div>
                    </div>

                    {/* Score comparison */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                        {/* Your score */}
                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: '180px' }}>
                            <div className="flex items-center justify-center" style={{ height: '160px' }}>
                                <AnimatedScoreRing score={yourData.score} size={140} isYou={true} />
                            </div>
                            <div className="mt-4 text-center w-full">
                                <p className="text-white font-bold text-sm leading-tight max-w-full overflow-hidden" style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    wordBreak: 'break-word'
                                }} title={yourDomain}>
                                    {formatDomain(yourDomain)}
                                </p>
                                <p className="text-violet-400 text-sm font-medium mt-1">Your Voice Score</p>
                            </div>
                        </div>

                        {/* VS badge */}
                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: '140px' }}>
                            <div className="flex items-center justify-center" style={{ height: '160px' }}>
                                <div className={`
                                    flex flex-col items-center justify-center w-28 h-28 rounded-full
                                    ${isWinning ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-2xl shadow-emerald-500/40' :
                                        scoreDiff < 0 ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-2xl shadow-rose-500/40' :
                                            'bg-gradient-to-br from-slate-500 to-slate-600 shadow-2xl shadow-slate-500/40'}
                                `}>
                                    <span className="text-white/80 text-[10px] font-semibold uppercase tracking-widest">Difference</span>
                                    <span className="text-4xl font-black text-white">{scoreDiff > 0 ? '+' : ''}{scoreDiff}</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-1.5 text-center">
                                {isWinning ? (
                                    <><Award className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span className="text-emerald-400 font-bold text-sm">Stronger Voice!</span></>
                                ) : scoreDiff < 0 ? (
                                    <><Target className="w-4 h-4 text-amber-400 flex-shrink-0" /><span className="text-amber-400 font-bold text-sm">Room to Improve</span></>
                                ) : (
                                    <span className="text-slate-400 font-bold text-sm">Evenly Matched</span>
                                )}
                            </div>
                        </div>

                        {/* Competitor score */}
                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: '180px' }}>
                            <div className="flex items-center justify-center" style={{ height: '160px' }}>
                                <AnimatedScoreRing score={competitorData.score} size={140} isYou={false} />
                            </div>
                            <div className="mt-4 text-center w-full">
                                <p className="text-white font-bold text-sm leading-tight max-w-full overflow-hidden" style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    wordBreak: 'break-word'
                                }} title={competitorDomain}>
                                    {formatDomain(competitorDomain)}
                                </p>
                                <p className="text-slate-400 text-sm font-medium mt-1">Competitor</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-white/10">
                        <div className="text-center">
                            <div className="text-4xl font-black text-emerald-400">{wins}</div>
                            <div className="text-sm text-slate-400 mt-1">Voice Categories Won</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-black text-rose-400">{losses}</div>
                            <div className="text-sm text-slate-400 mt-1">Voice Categories Lost</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-black text-slate-300">{Object.keys(subcats).length - wins - losses}</div>
                            <div className="text-sm text-slate-400 mt-1">Tied</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* EXECUTIVE SUMMARY */}
            {/* ============================================ */}
            <div className={`
                relative overflow-hidden rounded-2xl border p-6
                ${isWinning ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' :
                    scoreDiff < 0 ? 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200' :
                        'bg-gradient-to-r from-slate-50 to-white border-slate-200'}
            `}>
                <div className="flex items-start gap-4">
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        ${isWinning ? 'bg-emerald-500' : scoreDiff < 0 ? 'bg-rose-500' : 'bg-slate-500'}
                    `}>
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Executive Summary</h3>
                        <p className="text-slate-700 leading-relaxed">
                            {isWinning ? (
                                <>Your brand <strong className="text-emerald-600">outshines</strong> the competition in Voice/DNA by <strong>{scoreDiff} points</strong>.
                                    You have a more distinctive, memorable voice that helps you stand out in the market. This competitive advantage creates brand preference
                                    and makes it harder for competitors to win on messaging alone.</>
                            ) : scoreDiff < 0 ? (
                                <>Your competitor <strong className="text-rose-600">leads</strong> by <strong>{Math.abs(scoreDiff)} points</strong> in Brand Voice/DNA.
                                    Their messaging is more distinctive and memorable than yours. This gap means customers may remember them more easily and perceive them as more authentic.
                                    The insights below show exactly where to strengthen your brand voice.</>
                            ) : (
                                <>You're <strong>evenly matched</strong> with your competitor on Brand Voice. Neither brand has a clear voice advantage.
                                    Focus on developing proprietary frameworks, signature phrases, and authentic stories to pull ahead.</>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* BRAND PERSONALITY RADAR */}
            {/* ============================================ */}
            {voiceDetails?.personality && (
                <PersonalityRadarChart personality={voiceDetails.personality} />
            )}

            {/* ============================================ */}
            {/* VOICE DNA & AUTHENTICITY - Side by Side */}
            {/* ============================================ */}
            <div className="grid md:grid-cols-2 gap-6">
                <VoiceDNAHelix vocabulary={voiceDetails?.vocabulary} />
                <AuthenticityMeter
                    authenticity={voiceDetails?.authenticity}
                    cliches={voiceDetails?.vocabulary?.clicheInventory}
                />
            </div>

            {/* ============================================ */}
            {/* DISTINCTIVENESS PANEL */}
            {/* ============================================ */}
            <DistinctivenessPanel distinctiveness={voiceDetails?.distinctiveness} />

            {/* ============================================ */}
            {/* AI + HUMAN + SEARCH ENGINE ANALYSIS */}
            {/* ============================================ */}
            <AiHumanScorePanel
                yourVoiceDetails={voiceDetails}
                competitorVoiceDetails={competitorData.voiceDetails ?? undefined}
            />

            {/* ============================================ */}
            {/* SLOP DETECTOR - Side by Side with Brand DNA */}
            {/* ============================================ */}
            <div className="grid md:grid-cols-2 gap-6">
                <SlopDetectorPanel
                    yourSlopIndicators={voiceDetails?.slopIndicators}
                    competitorSlopIndicators={competitorData.voiceDetails?.slopIndicators}
                />
                {/* Brand DNA Clarity Panel - with Competitive Comparison */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900">Brand DNA Clarity</h3>
                            <p className="text-sm text-slate-500">Purpose & mission comparison</p>
                        </div>
                        {/* Overall difference badge */}
                        {(() => {
                            const yourTotal = (
                                (voiceDetails?.brandDnaClarity?.missionClarity ?? 50) +
                                (voiceDetails?.brandDnaClarity?.valueAlignment ?? 50) +
                                (voiceDetails?.brandDnaClarity?.purposeExpression ?? 50) +
                                (voiceDetails?.brandDnaClarity?.positioningStrength ?? 50)
                            ) / 4;
                            const compTotal = (
                                (competitorData.voiceDetails?.brandDnaClarity?.missionClarity ?? 50) +
                                (competitorData.voiceDetails?.brandDnaClarity?.valueAlignment ?? 50) +
                                (competitorData.voiceDetails?.brandDnaClarity?.purposeExpression ?? 50) +
                                (competitorData.voiceDetails?.brandDnaClarity?.positioningStrength ?? 50)
                            ) / 4;
                            const diff = Math.round(yourTotal - compTotal);
                            return (
                                <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${diff > 0 ? 'bg-emerald-500 text-white' : diff < 0 ? 'bg-rose-500 text-white' : 'bg-slate-300 text-slate-700'
                                    }`}>
                                    {diff > 0 ? '↑' : diff < 0 ? '↓' : '='} {diff > 0 ? '+' : ''}{diff}
                                </span>
                            );
                        })()}
                    </div>

                    {/* Comparison metrics - showing both You and Competitor */}
                    <div className="space-y-3">
                        {[
                            { label: 'Mission Clarity', yourVal: voiceDetails?.brandDnaClarity?.missionClarity ?? 50, compVal: competitorData.voiceDetails?.brandDnaClarity?.missionClarity ?? 50 },
                            { label: 'Value Alignment', yourVal: voiceDetails?.brandDnaClarity?.valueAlignment ?? 50, compVal: competitorData.voiceDetails?.brandDnaClarity?.valueAlignment ?? 50 },
                            { label: 'Purpose Expression', yourVal: voiceDetails?.brandDnaClarity?.purposeExpression ?? 50, compVal: competitorData.voiceDetails?.brandDnaClarity?.purposeExpression ?? 50 },
                            { label: 'Positioning', yourVal: voiceDetails?.brandDnaClarity?.positioningStrength ?? 50, compVal: competitorData.voiceDetails?.brandDnaClarity?.positioningStrength ?? 50 },
                        ].map((metric, i) => {
                            const isWinning = metric.yourVal > metric.compVal;
                            const diff = metric.yourVal - metric.compVal;
                            return (
                                <div key={i} className="p-3 rounded-xl bg-white border border-sky-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-slate-600">{metric.label}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isWinning ? 'bg-emerald-100 text-emerald-700' : diff < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {diff > 0 ? '+' : ''}{diff}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                <span>You</span>
                                                <span className={`font-bold ${isWinning ? 'text-emerald-600' : 'text-slate-600'}`}>{metric.yourVal}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                                <div className={`h-full rounded-full ${isWinning ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${metric.yourVal}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                <span>Them</span>
                                                <span className={`font-bold ${!isWinning && diff !== 0 ? 'text-rose-600' : 'text-slate-400'}`}>{metric.compVal}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                                <div className={`h-full rounded-full ${!isWinning && diff !== 0 ? 'bg-rose-500' : 'bg-slate-300'}`} style={{ width: `${metric.compVal}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Voice Memorability Index with Comparison */}
                    <div className="mt-4 p-4 rounded-xl bg-white border border-sky-200">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Voice Memorability Index</div>
                        <div className="grid grid-cols-2 gap-4">
                            {(() => {
                                const yourMem = voiceDetails?.voiceMemorabilityIndex ?? 50;
                                const compMem = competitorData.voiceDetails?.voiceMemorabilityIndex ?? 50;
                                const isWinning = yourMem > compMem;
                                return (
                                    <>
                                        <div className={`text-center p-3 rounded-lg ${isWinning ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                                            <div className="text-[10px] font-semibold text-slate-500 uppercase">You</div>
                                            <div className={`text-3xl font-black ${isWinning ? 'text-emerald-600' : 'text-slate-600'}`}>{yourMem}</div>
                                        </div>
                                        <div className={`text-center p-3 rounded-lg ${!isWinning && yourMem !== compMem ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50 border border-slate-200'}`}>
                                            <div className="text-[10px] font-semibold text-slate-500 uppercase">Them</div>
                                            <div className={`text-3xl font-black ${!isWinning && yourMem !== compMem ? 'text-rose-600' : 'text-slate-400'}`}>{compMem}</div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Brand DNA Insight - Always shows */}
                    {(() => {
                        const avgScore = (
                            (voiceDetails?.brandDnaClarity?.missionClarity ?? 50) +
                            (voiceDetails?.brandDnaClarity?.valueAlignment ?? 50) +
                            (voiceDetails?.brandDnaClarity?.purposeExpression ?? 50) +
                            (voiceDetails?.brandDnaClarity?.positioningStrength ?? 50)
                        ) / 4;
                        return (
                            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200">
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-blue-500" />
                                    Brand DNA Insight
                                </h4>

                                {/* Quick tip based on score */}
                                <div className={`p-3 rounded-lg mb-4 ${avgScore >= 70 ? 'bg-emerald-50 border border-emerald-200' :
                                    avgScore >= 40 ? 'bg-amber-50 border border-amber-200' :
                                        'bg-rose-50 border border-rose-200'
                                    }`}>
                                    <div className="text-xs font-medium">
                                        {avgScore >= 70 ? (
                                            <span className="text-emerald-700">
                                                ✓ Excellent! Your brand DNA is crystal clear. Customers understand your why and connect with it.
                                            </span>
                                        ) : avgScore >= 40 ? (
                                            <span className="text-amber-700">
                                                ⚠ Your brand purpose has some clarity. Sharpen your mission statement and ensure values show in all content.
                                            </span>
                                        ) : (
                                            <span className="text-rose-700">
                                                ✗ Brand DNA is unclear. Define your mission, articulate values, and express them consistently.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Brand DNA Checklist */}
                                <div className="pt-3 border-t border-sky-200">
                                    <h5 className="text-xs font-bold text-slate-600 uppercase mb-3">Strong Brand DNA Includes</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: 'Clear mission', icon: '🎯' },
                                            { label: 'Core values', icon: '💎' },
                                            { label: 'Unique POV', icon: '👁️' },
                                            { label: 'Origin story', icon: '📖' },
                                            { label: 'Customer focus', icon: '❤️' },
                                            { label: 'Future vision', icon: '🔮' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-slate-600 p-2 rounded-lg bg-white border border-sky-100">
                                                <span>{item.icon}</span>
                                                <span>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* ============================================ */}
            {/* SUBCATEGORY BREAKDOWN */}
            {/* ============================================ */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Voice DNA Breakdown</h3>
                        <p className="text-sm text-slate-500">Detailed analysis of each voice dimension</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(subcats).map(([key, subcat]) => (
                        <SubcategoryCard
                            key={key}
                            subcatKey={key}
                            yourScore={subcat.score}
                            compScore={compSubcats[key]?.score || 50}
                            weight={subcat.weight}
                            evidence={subcat.evidence || []}
                            issues={subcat.issues || []}
                        />
                    ))}
                </div>
            </div>

            {/* ============================================ */}
            {/* RECOMMENDATIONS */}
            {/* ============================================ */}
            {yourData.recommendations && yourData.recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Voice Improvement Actions</h3>
                            <p className="text-sm text-slate-500">Priority recommendations to strengthen your brand voice</p>
                        </div>
                        <span className="ml-auto px-3 py-1 rounded-full bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-500/30">
                            {yourData.recommendations.length} ACTIONS
                        </span>
                    </div>

                    <div className="space-y-3">
                        {yourData.recommendations.slice(0, 5).map((rec, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 rounded-xl bg-white border border-violet-200 hover:shadow-md transition-all duration-300"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30">
                                    {i + 1}
                                </div>
                                <span className="font-semibold text-slate-800">{rec}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
