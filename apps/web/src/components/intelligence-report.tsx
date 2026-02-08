'use client';

import { useState } from 'react';
import {
    Brain, Zap, Target, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
    MessageSquare, Fingerprint, Volume2, ShieldCheck, Sparkles, Award,
    Lightbulb, ArrowRight, Quote, Flame, Trophy, Star, Eye, Clock,
    ThumbsUp, ThumbsDown, XCircle, Mic2
} from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CopyForensics {
    youVsWeRatio: {
        you: number;
        we: number;
        analysis: string;
    };
    readingLevel: {
        grade: number;
        description: string;
    };
    emotionalDrivers: string[];
    powerWords: string[];
    clichesDetected?: {
        phrase: string;
        count: number;
        competitorUsage: number;
    }[];
    uniquePhrases?: string[];
    verdict: {
        winner: string;
        headline: string;
        reasoning: string;
        improvements: {
            title: string;
            action: string;
            example?: string;
        }[];
    };
}

export interface BrandPersonality {
    confident: number; // 0=humble, 100=bold
    serious: number; // 0=serious, 100=playful
    established: number; // 0=challenger, 100=established
    technical: number; // 0=accessible, 100=technical
    safe?: number; // 0=safe, 100=provocative
    energy?: number; // 0=calm, 100=energetic
}

export interface BrandIdentityAnalysis {
    yourBrand: {
        archetype: string;
        tagline: string;
        positioningStatement: string;
        voiceScore: number;
        personality: BrandPersonality;
        strengths: string[];
        weaknesses: string[];
    };
    competitorBrand: {
        archetype: string;
        tagline: string;
        positioningStatement: string;
        voiceScore: number;
        personality: BrandPersonality;
        strengths: string[];
        weaknesses: string[];
    };
    brandGapAnalysis: string;
    competitiveAdvantageVerdict: string;
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
    trustVerdict: string;
    actionItem: string;
}

interface QuickWin {
    number: number;
    title: string;
    action: string;
    example?: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    pointsGain: number;
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
    quickWins?: QuickWin[];
}

export interface IntelligenceReportData {
    executiveSummary: {
        yourScore: number;
        competitorScore: number;
        verdict: string;
        topOpportunity: string;
        topThreat: string;
    };
    copyForensics: CopyForensics;
    brandIdentity: BrandIdentityAnalysis;
    aiVerdict: {
        winner: string;
        winnerScore: number;
        loserScore: number;
        headline: string;
        summary: string;
        keyDifferentiators: string[];
        specificImprovements: {
            number: number;
            title: string;
            action: string;
            example?: string;
            impact: 'high' | 'medium' | 'low';
        }[];
    };
    trustAuthority: TrustAuthorityAnalysis;
    aeoReadiness: {
        yourScore: number;
        competitorScore: number;
        yourLlmMatch: string;
        competitorLlmMatch: string;
        yourCitationLikelihood: 'high' | 'medium' | 'low';
        competitorCitationLikelihood: 'high' | 'medium' | 'low';
        yourAnalysis: string;
        competitorAnalysis: string;
    };
    strategicRoadmap: StrategicRoadmap;
    generatedAt: Date;
}

// ============================================
// HELPER COMPONENTS
// ============================================

// Personality Slider - The Spectrum Visualization
function PersonalitySlider({
    leftLabel,
    rightLabel,
    yourValue,
    competitorValue,
    showComparison = true
}: {
    leftLabel: string;
    rightLabel: string;
    yourValue: number;
    competitorValue?: number;
    showComparison?: boolean;
}) {
    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{leftLabel}</span>
                <span>{rightLabel}</span>
            </div>
            <div className="relative h-3 bg-slate-800/80 rounded-full overflow-hidden">
                {/* Track gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 via-slate-700/30 to-cyan-900/50" />

                {/* Your marker */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white shadow-lg shadow-emerald-500/50 z-20 transition-all duration-500"
                    style={{ left: `calc(${yourValue}% - 8px)` }}
                />

                {/* Competitor marker */}
                {showComparison && competitorValue !== undefined && (
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border border-white/50 shadow-lg shadow-rose-500/30 z-10 transition-all duration-500 opacity-70"
                        style={{ left: `calc(${competitorValue}% - 6px)` }}
                    />
                )}
            </div>
            {showComparison && competitorValue !== undefined && (
                <div className="flex justify-end gap-4 mt-1 text-[10px]">
                    <span className="text-emerald-400">● You: {yourValue}</span>
                    <span className="text-rose-400">● Them: {competitorValue}</span>
                </div>
            )}
        </div>
    );
}

// Circular Score - For E-E-A-T Metrics
function CircularScore({
    label,
    yourScore,
    competitorScore,
    size = 'normal'
}: {
    label: string;
    yourScore: number;
    competitorScore: number;
    size?: 'normal' | 'large';
}) {
    const isSmall = size === 'normal';
    const circumference = 2 * Math.PI * (isSmall ? 36 : 54);
    const yourOffset = circumference - (yourScore / 100) * circumference;
    const diff = yourScore - competitorScore;
    const isWinning = diff > 0;

    return (
        <div className="flex flex-col items-center">
            <div className={`relative ${isSmall ? 'w-24 h-24' : 'w-36 h-36'}`}>
                <svg className="w-full h-full -rotate-90" viewBox={isSmall ? "0 0 80 80" : "0 0 120 120"}>
                    {/* Background circle */}
                    <circle
                        cx={isSmall ? "40" : "60"}
                        cy={isSmall ? "40" : "60"}
                        r={isSmall ? "36" : "54"}
                        fill="none"
                        stroke="rgb(51 65 85 / 0.5)"
                        strokeWidth={isSmall ? "6" : "8"}
                    />
                    {/* Score arc */}
                    <circle
                        cx={isSmall ? "40" : "60"}
                        cy={isSmall ? "40" : "60"}
                        r={isSmall ? "36" : "54"}
                        fill="none"
                        stroke={isWinning ? "url(#greenGradient)" : "url(#redGradient)"}
                        strokeWidth={isSmall ? "6" : "8"}
                        strokeDasharray={circumference}
                        strokeDashoffset={yourOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                    />
                    <defs>
                        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#06d6a0" />
                        </linearGradient>
                        <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-black ${isSmall ? 'text-2xl' : 'text-4xl'} ${isWinning ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {yourScore}
                    </span>
                    <span className={`text-slate-500 ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
                        vs {competitorScore}
                    </span>
                </div>
            </div>
            <span className={`mt-2 text-slate-300 font-medium ${isSmall ? 'text-xs' : 'text-sm'}`}>{label}</span>
            <span className={`text-xs ${isWinning ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isWinning ? '+' : ''}{diff}
            </span>
        </div>
    );
}

// Cliché Detector Card
function ClicheCard({ phrase, count, competitorUsage }: { phrase: string; count: number; competitorUsage: number }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">"{phrase}"</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
                <span className="text-amber-400 font-bold">{count}x</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 text-xs">{competitorUsage} competitors use this</span>
            </div>
        </div>
    );
}

// Quick Win Card with Effort/Impact
function QuickWinCard({ win }: { win: QuickWin }) {
    const impactColor = win.impact === 'high' ? 'emerald' : win.impact === 'medium' ? 'amber' : 'slate';
    const effortColor = win.effort === 'low' ? 'emerald' : win.effort === 'medium' ? 'amber' : 'rose';

    return (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/30 transition-all group">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {win.number}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {win.title}
                        </h4>
                        <span className="text-emerald-400 font-bold text-sm">
                            +{win.pointsGain} pts
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{win.action}</p>
                    {win.example && (
                        <div className="p-2 rounded-lg bg-slate-900/50 text-xs text-slate-500 italic">
                            Example: {win.example}
                        </div>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                            <Zap className={`w-3 h-3 text-${impactColor}-400`} />
                            <span className={`text-xs text-${impactColor}-400 uppercase font-medium`}>
                                {win.impact} impact
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className={`w-3 h-3 text-${effortColor}-400`} />
                            <span className={`text-xs text-${effortColor}-400 uppercase font-medium`}>
                                {win.effort} effort
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Voice Differentiation Map (2D Chart)
function VoiceDifferentiationMap({
    yourScore,
    competitorScore,
    yourProvocative = 30,
    competitorProvocative = 70
}: {
    yourScore: number;
    competitorScore: number;
    yourProvocative?: number;
    competitorProvocative?: number;
}) {
    return (
        <div className="relative aspect-square max-w-md mx-auto p-6">
            {/* Grid background */}
            <div className="absolute inset-6 border border-slate-700/50 rounded-lg">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    <div className="border-r border-b border-slate-700/30 flex items-center justify-center text-xs text-slate-600">
                        Generic + Safe
                    </div>
                    <div className="border-b border-slate-700/30 flex items-center justify-center text-xs text-slate-600">
                        Generic + Bold
                    </div>
                    <div className="border-r border-slate-700/30 flex items-center justify-center text-xs text-slate-600">
                        Distinctive + Safe
                    </div>
                    <div className="flex items-center justify-center">
                        <span className="text-xs text-emerald-400/80 font-medium px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                            🏆 MOAT ZONE
                        </span>
                    </div>
                </div>
            </div>

            {/* Axis labels */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-500 whitespace-nowrap">
                ← Generic ... Distinctive →
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-slate-500 whitespace-nowrap">
                ← Safe ... Provocative →
            </div>

            {/* Your position */}
            <div
                className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white shadow-lg shadow-emerald-500/50 flex items-center justify-center text-white font-bold text-xs z-20 transition-all duration-700"
                style={{
                    left: `calc(${6 + (yourProvocative / 100) * (100 - 12)}%)`,
                    bottom: `calc(${6 + (yourScore / 100) * (100 - 12)}%)`
                }}
            >
                YOU
            </div>

            {/* Competitor position */}
            <div
                className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border border-white/50 shadow-lg shadow-rose-500/30 flex items-center justify-center text-white font-bold text-[10px] z-10 transition-all duration-700"
                style={{
                    left: `calc(${6 + (competitorProvocative / 100) * (100 - 12)}%)`,
                    bottom: `calc(${6 + (competitorScore / 100) * (100 - 12)}%)`
                }}
            >
                C1
            </div>

            {/* Arrow showing direction to move */}
            <div className="absolute right-10 top-10 flex items-center gap-1 text-xs text-purple-400">
                <span>Move here</span>
                <ArrowRight className="w-3 h-3" />
            </div>
        </div>
    );
}

// ============================================
// MAIN SECTIONS
// ============================================

// Copy Forensics Section
export function CopyForensicsSection({ data }: { data: CopyForensics }) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Copy & Voice Forensics</h3>
                    <p className="text-slate-400 text-sm">How your content speaks to customers</p>
                </div>
            </div>

            {/* You vs We Ratio */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Customer Focus (You vs We)
                    </h4>
                    <div className="flex items-center gap-6 mb-4">
                        <div className="text-center">
                            <div className="text-3xl font-black text-cyan-400">{data.youVsWeRatio.you}%</div>
                            <div className="text-xs text-slate-500">You/Your</div>
                        </div>
                        <div className="flex-1 h-4 bg-slate-900/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                                style={{ width: `${data.youVsWeRatio.you}%` }}
                            />
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-amber-400">{data.youVsWeRatio.we}%</div>
                            <div className="text-xs text-slate-500">We/Our</div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-400">{data.youVsWeRatio.analysis}</p>
                </div>

                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Reading Level
                    </h4>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                            <span className="text-2xl font-black text-purple-400">{data.readingLevel.grade}</span>
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-white">Grade {data.readingLevel.grade}</div>
                            <div className="text-sm text-slate-400">{data.readingLevel.description}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Emotional Drivers & Power Words */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Flame className="w-4 h-4" /> Emotional Drivers
                    </h4>
                    <div className="space-y-2">
                        {data.emotionalDrivers.map((driver, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-amber-400">•</span>
                                <span>{driver}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Power Words Detected
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {data.powerWords.map((word, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium border border-emerald-500/30">
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Clichés Detected */}
            {data.clichesDetected && data.clichesDetected.length > 0 && (
                <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Industry Clichés Detected
                    </h4>
                    <div className="space-y-2">
                        {data.clichesDetected.map((cliche, i) => (
                            <ClicheCard key={i} {...cliche} />
                        ))}
                    </div>
                    <p className="mt-4 text-sm text-amber-400/80">
                        Replace these generic phrases with specific, memorable language unique to your brand.
                    </p>
                </div>
            )}

            {/* Verdict */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white mb-2">{data.verdict.headline}</h4>
                        <p className="text-slate-300 mb-4">{data.verdict.reasoning}</p>

                        <h5 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
                            Improvements to Make
                        </h5>
                        <div className="space-y-3">
                            {data.verdict.improvements.map((imp, i) => (
                                <div key={i} className="p-4 rounded-lg bg-slate-900/50">
                                    <div className="font-semibold text-white mb-1">{imp.title}</div>
                                    <div className="text-sm text-slate-400 mb-2">{imp.action}</div>
                                    {imp.example && (
                                        <div className="text-xs text-cyan-400/80 italic">
                                            → {imp.example}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Brand Identity Section with Personality Sliders
export function BrandIdentitySection({ data, yourDomain, competitorDomain }: {
    data: BrandIdentityAnalysis;
    yourDomain: string;
    competitorDomain: string;
}) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Fingerprint className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Brand Identity & Personality</h3>
                    <p className="text-slate-400 text-sm">Your brand archetype and voice profile</p>
                </div>
            </div>

            {/* Archetype Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Your Brand */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Star className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-400 uppercase">{yourDomain}</span>
                    </div>

                    <div className="text-2xl font-bold text-white mb-2">{data.yourBrand.archetype}</div>
                    <div className="text-cyan-400 text-sm font-medium mb-4">"{data.yourBrand.tagline}"</div>
                    <p className="text-slate-400 text-sm mb-4">{data.yourBrand.positioningStatement}</p>

                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-slate-400 text-sm">Voice Score:</span>
                        <span className="text-2xl font-black text-emerald-400">{data.yourBrand.voiceScore}</span>
                        <span className="text-slate-500">/100</span>
                    </div>

                    {/* Personality Sliders */}
                    <div className="space-y-1">
                        <PersonalitySlider
                            leftLabel="Humble"
                            rightLabel="Bold"
                            yourValue={data.yourBrand.personality.confident}
                            competitorValue={data.competitorBrand.personality.confident}
                            showComparison={false}
                        />
                        <PersonalitySlider
                            leftLabel="Serious"
                            rightLabel="Playful"
                            yourValue={data.yourBrand.personality.serious}
                            showComparison={false}
                        />
                        <PersonalitySlider
                            leftLabel="Challenger"
                            rightLabel="Established"
                            yourValue={data.yourBrand.personality.established}
                            showComparison={false}
                        />
                        <PersonalitySlider
                            leftLabel="Accessible"
                            rightLabel="Technical"
                            yourValue={data.yourBrand.personality.technical}
                            showComparison={false}
                        />
                    </div>
                </div>

                {/* Competitor Brand */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-rose-900/20 to-rose-800/10 border border-rose-500/30">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                            <Target className="w-4 h-4 text-rose-400" />
                        </div>
                        <span className="text-sm font-semibold text-rose-400 uppercase">{competitorDomain}</span>
                    </div>

                    <div className="text-2xl font-bold text-white mb-2">{data.competitorBrand.archetype}</div>
                    <div className="text-cyan-400 text-sm font-medium mb-4">"{data.competitorBrand.tagline}"</div>
                    <p className="text-slate-400 text-sm mb-4">{data.competitorBrand.positioningStatement}</p>

                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-slate-400 text-sm">Voice Score:</span>
                        <span className="text-2xl font-black text-rose-400">{data.competitorBrand.voiceScore}</span>
                        <span className="text-slate-500">/100</span>
                    </div>

                    {/* Personality Sliders */}
                    <div className="space-y-1">
                        <PersonalitySlider
                            leftLabel="Humble"
                            rightLabel="Bold"
                            yourValue={data.competitorBrand.personality.confident}
                            showComparison={false}
                        />
                        <PersonalitySlider
                            leftLabel="Serious"
                            rightLabel="Playful"
                            yourValue={data.competitorBrand.personality.serious}
                            showComparison={false}
                        />
                        <PersonalitySlider
                            leftLabel="Challenger"
                            rightLabel="Established"
                            yourValue={data.competitorBrand.personality.established}
                            showComparison={false}
                        />
                        <PersonalitySlider
                            leftLabel="Accessible"
                            rightLabel="Technical"
                            yourValue={data.competitorBrand.personality.technical}
                            showComparison={false}
                        />
                    </div>
                </div>
            </div>

            {/* Voice Differentiation Map */}
            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-400" /> Voice Differentiation Map
                </h4>
                <p className="text-slate-400 text-sm mb-4">Where you stand in the competitive landscape</p>
                <VoiceDifferentiationMap
                    yourScore={data.yourBrand.voiceScore}
                    competitorScore={data.competitorBrand.voiceScore}
                    yourProvocative={data.yourBrand.personality.safe || 30}
                    competitorProvocative={data.competitorBrand.personality.safe || 70}
                />
            </div>

            {/* Proprietary Frameworks & Signature Phrases */}
            {(data.proprietaryFrameworks || data.signaturePhrases) && (
                <div className="grid md:grid-cols-2 gap-6">
                    {data.proprietaryFrameworks && (
                        <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Award className="w-4 h-4" /> Proprietary Frameworks
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-emerald-400 mb-2">Your Frameworks:</div>
                                    {data.proprietaryFrameworks.yours.length > 0 ? (
                                        <div className="space-y-1">
                                            {data.proprietaryFrameworks.yours.map((f, i) => (
                                                <div key={i} className="text-sm text-slate-300">• {f}</div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-500 italic">None detected</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs text-rose-400 mb-2">Competitor Frameworks:</div>
                                    {data.proprietaryFrameworks.competitor.length > 0 ? (
                                        <div className="space-y-1">
                                            {data.proprietaryFrameworks.competitor.map((f, i) => (
                                                <div key={i} className="text-sm text-slate-300">• {f}</div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-500 italic">None detected</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {data.signaturePhrases && (
                        <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Quote className="w-4 h-4" /> Signature Phrases
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-emerald-400 mb-2">Your Phrases:</div>
                                    {data.signaturePhrases.yours.length > 0 ? (
                                        <div className="space-y-1">
                                            {data.signaturePhrases.yours.map((p, i) => (
                                                <div key={i} className="text-sm text-slate-300 italic">"{p}"</div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-500 italic">None detected</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs text-rose-400 mb-2">Competitor Phrases:</div>
                                    {data.signaturePhrases.competitor.length > 0 ? (
                                        <div className="space-y-1">
                                            {data.signaturePhrases.competitor.map((p, i) => (
                                                <div key={i} className="text-sm text-slate-300 italic">"{p}"</div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-500 italic">None detected</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Gap Analysis */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/30">
                <h4 className="text-lg font-bold text-white mb-3">Brand Gap Analysis</h4>
                <p className="text-slate-300 mb-4">{data.brandGapAnalysis}</p>
                <div className="p-4 rounded-lg bg-slate-900/50">
                    <h5 className="text-sm font-semibold text-amber-400 mb-2">Competitive Advantage Verdict</h5>
                    <p className="text-slate-400 text-sm">{data.competitiveAdvantageVerdict}</p>
                </div>
            </div>
        </div>
    );
}

// E-E-A-T Section
export function TrustAuthoritySection({ data }: { data: TrustAuthorityAnalysis }) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Trust & Authority (E-E-A-T)</h3>
                    <p className="text-slate-400 text-sm">Experience, Expertise, Authoritativeness, Trustworthiness</p>
                </div>
            </div>

            {/* E-E-A-T Circles */}
            <div className="flex justify-center gap-8 flex-wrap py-4">
                <CircularScore
                    label="Experience"
                    yourScore={data.eeatMetrics.experience.you}
                    competitorScore={data.eeatMetrics.experience.competitor}
                />
                <CircularScore
                    label="Expertise"
                    yourScore={data.eeatMetrics.expertise.you}
                    competitorScore={data.eeatMetrics.expertise.competitor}
                />
                <CircularScore
                    label="Authority"
                    yourScore={data.eeatMetrics.authoritativeness.you}
                    competitorScore={data.eeatMetrics.authoritativeness.competitor}
                />
                <CircularScore
                    label="Trust"
                    yourScore={data.eeatMetrics.trustworthiness.you}
                    competitorScore={data.eeatMetrics.trustworthiness.competitor}
                />
            </div>

            {/* Credibility Indicators */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Your Credibility Signals
                    </h4>
                    <div className="space-y-2">
                        {data.yourCredibilityIndicators.map((indicator, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-emerald-400 mt-0.5">✓</span>
                                <span>{indicator}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <h4 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4" /> Competitor Credibility Signals
                    </h4>
                    <div className="space-y-2">
                        {data.competitorCredibilityIndicators.map((indicator, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-rose-400 mt-0.5">•</span>
                                <span>{indicator}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Verdict & Action */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/20 to-cyan-900/10 border border-blue-500/30">
                <h4 className="text-lg font-bold text-white mb-2">{data.trustVerdict}</h4>
                <div className="p-4 rounded-lg bg-slate-900/50 mt-4">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="text-sm font-semibold text-amber-400 mb-1">Action Required</div>
                            <p className="text-slate-300 text-sm">{data.actionItem}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Strategic Roadmap Section
export function StrategicRoadmapSection({ data }: { data: StrategicRoadmap }) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">90-Day Strategic Roadmap</h3>
                    <p className="text-slate-400 text-sm">Your action plan to dominate</p>
                </div>
            </div>

            {/* Opportunity & Threat */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-semibold text-emerald-400">Primary Opportunity</h4>
                    </div>
                    <p className="text-slate-300">{data.primaryOpportunity}</p>
                </div>

                <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                        <h4 className="font-semibold text-rose-400">Primary Threat</h4>
                    </div>
                    <p className="text-slate-300">{data.primaryThreat}</p>
                </div>
            </div>

            {/* Quick Wins */}
            {data.quickWins && data.quickWins.length > 0 && (
                <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" /> Quick Wins (High Impact, Low Effort)
                    </h4>
                    <div className="space-y-4">
                        {data.quickWins.map((win) => (
                            <QuickWinCard key={win.number} win={win} />
                        ))}
                    </div>
                </div>
            )}

            {/* Immediate Actions */}
            <div>
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" /> Immediate Actions
                </h4>
                <div className="space-y-3">
                    {data.immediateActions.map((action) => (
                        <div key={action.number} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <div className="flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${action.category === 'brand' ? 'bg-purple-500' :
                                    action.category === 'content' ? 'bg-blue-500' :
                                        action.category === 'aeo' ? 'bg-emerald-500' :
                                            'bg-amber-500'
                                    }`}>
                                    {action.number}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h5 className="font-semibold text-white">{action.title}</h5>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${action.impact === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                                            action.impact === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-slate-600/30 text-slate-400'
                                            }`}>
                                            {action.impact} impact
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-2">{action.description}</p>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-slate-500">Timeline: {action.timeline}</span>
                                        <span className={`${action.effort === 'low' ? 'text-emerald-400' :
                                            action.effort === 'medium' ? 'text-amber-400' :
                                                'text-rose-400'
                                            }`}>
                                            {action.effort} effort
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AEO Phases */}
            {data.aeoPhases && data.aeoPhases.length > 0 && (
                <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-400" /> AEO Implementation Phases
                    </h4>
                    <div className="grid md:grid-cols-3 gap-4">
                        {data.aeoPhases.map((phase) => (
                            <div key={phase.phase} className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                                        {phase.phase}
                                    </div>
                                    <h5 className="font-semibold text-white">{phase.name}</h5>
                                </div>
                                <div className="space-y-2">
                                    {phase.items.map((item, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                            <span className="text-purple-400">→</span>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Success Metrics */}
            {data.successMetrics && data.successMetrics.length > 0 && (
                <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/30">
                    <h4 className="text-lg font-bold text-white mb-4">Success Metrics Timeline</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                        {data.successMetrics.map((metric) => (
                            <div key={metric.days} className="p-4 rounded-lg bg-slate-900/50">
                                <div className="text-2xl font-black text-indigo-400 mb-2">Day {metric.days}</div>
                                <div className="space-y-1">
                                    {metric.kpis.map((kpi, i) => (
                                        <div key={i} className="text-sm text-slate-400">• {kpi}</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// MAIN EXPORT COMPONENT
// ============================================

export function IntelligenceReport({
    data,
    yourDomain,
    competitorDomain
}: {
    data: IntelligenceReportData;
    yourDomain: string;
    competitorDomain: string;
}) {
    const [activeSection, setActiveSection] = useState<string>('copy');

    const sections = [
        { id: 'copy', label: 'Copy Forensics', icon: MessageSquare },
        { id: 'brand', label: 'Brand Identity', icon: Fingerprint },
        { id: 'trust', label: 'E-E-A-T', icon: ShieldCheck },
        { id: 'roadmap', label: '90-Day Roadmap', icon: Sparkles },
    ];

    return (
        <div className="space-y-8">
            {/* AI Verdict Banner */}
            {data.aiVerdict && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-purple-900/40 border border-purple-500/30">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">AI Analysis Verdict</div>
                            <h3 className="text-xl font-bold text-white mb-2">{data.aiVerdict.headline}</h3>
                            <p className="text-slate-300">{data.aiVerdict.summary}</p>
                            {data.aiVerdict.keyDifferentiators && data.aiVerdict.keyDifferentiators.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {data.aiVerdict.keyDifferentiators.map((diff, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30">
                                            {diff}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Section Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${activeSection === section.id
                                ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/50 text-white'
                                : 'bg-slate-800/50 border border-slate-700/30 text-slate-400 hover:text-white hover:border-slate-600/50'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${activeSection === section.id ? 'text-purple-400' : ''}`} />
                            <span className="font-medium text-sm">{section.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Active Section Content */}
            <div className="min-h-[500px]">
                {activeSection === 'copy' && data.copyForensics && (
                    <CopyForensicsSection data={data.copyForensics} />
                )}
                {activeSection === 'brand' && data.brandIdentity && (
                    <BrandIdentitySection
                        data={data.brandIdentity}
                        yourDomain={yourDomain}
                        competitorDomain={competitorDomain}
                    />
                )}
                {activeSection === 'trust' && data.trustAuthority && (
                    <TrustAuthoritySection data={data.trustAuthority} />
                )}
                {activeSection === 'roadmap' && data.strategicRoadmap && (
                    <StrategicRoadmapSection data={data.strategicRoadmap} />
                )}
            </div>
        </div>
    );
}

export default IntelligenceReport;
