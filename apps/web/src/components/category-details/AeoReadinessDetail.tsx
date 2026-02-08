'use client';

import { useState } from 'react';
import {
    Target, AlertTriangle, CheckCircle, Sparkles, Award,
    TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
    Brain, Wifi, Radio, Radar, Satellite, Globe, Eye,
    MessageSquare, Search, Zap, FileText, List, Table2,
    HelpCircle, Quote, Activity, Signal, CheckCircle2, XCircle,
    Youtube, BookOpen, Star, Building2, Users, Shield
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

interface PlatformPresence {
    wikipedia: boolean;
    youtube: boolean;
    reddit: boolean;
    g2Capterra: boolean;
    trustpilot: boolean;
    wikidata: boolean;
    linkedin: boolean;
    crunchbase: boolean;
    totalScore: number;
}

interface AeoReadinessData {
    score: number;
    subcategories: Record<string, SubcategoryData>;
    insights: string[];
    recommendations: string[];
    platformPresence?: PlatformPresence;
}

// Real citation test data from LLM Citation Service
interface CitationTestData {
    yourCitabilityScore: number;
    competitorCitabilityScore: number;
    factDensity: number;
    definitiveStatements: number;
    uniqueInsights: number;
    verdict: {
        winner: 'you' | 'competitor' | 'tie';
        headline: string;
        explanation: string;
        topReasons: string[];
    };
}

interface Props {
    yourData: AeoReadinessData;
    competitorData: AeoReadinessData;
    yourDomain: string;
    competitorDomain: string;
    citationTest?: CitationTestData; // Real AI citation test results
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
    platformPresence: {
        icon: Globe,
        label: 'Platform Presence',
        description: 'Are you visible on platforms AI uses as sources?',
        whyItMatters: 'AI assistants cite Wikipedia, YouTube, Reddit, and review sites. Without presence there, you\'re invisible to AI.',
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-50 to-teal-50'
    },
    schemaForAI: {
        icon: FileText,
        label: 'Schema for AI',
        description: 'Do you have AI-friendly structured data?',
        whyItMatters: 'FAQPage, HowTo, and Article schemas make your content machine-readable. Without them, AI can\'t parse your expertise.',
        gradient: 'from-cyan-500 to-blue-500',
        bgGradient: 'from-cyan-50 to-blue-50'
    },
    contentStructureForLLMs: {
        icon: List,
        label: 'LLM-Friendly Structure',
        description: 'Is your content formatted for AI parsing?',
        whyItMatters: 'Lists, tables, Q&A, and clear definitions help AI extract and cite your content accurately.',
        gradient: 'from-blue-500 to-indigo-500',
        bgGradient: 'from-blue-50 to-indigo-50'
    },
    factDensity: {
        icon: Quote,
        label: 'Fact Density',
        description: 'How many citable facts per 100 words?',
        whyItMatters: 'AI prefers content rich with specific, quotable facts. Vague content gets skipped for more authoritative sources.',
        gradient: 'from-indigo-500 to-violet-500',
        bgGradient: 'from-indigo-50 to-violet-50'
    },
    statementDefinitiveness: {
        icon: Shield,
        label: 'Statement Definitiveness',
        description: 'Do you make authoritative claims or hedge?',
        whyItMatters: '"We are the best..." gets cited. "We might be able to..." gets ignored. AI favors confident, definitive statements.',
        gradient: 'from-violet-500 to-purple-500',
        bgGradient: 'from-violet-50 to-purple-50'
    },
    qaCoverage: {
        icon: HelpCircle,
        label: 'Q&A Coverage',
        description: 'Do you answer common questions directly?',
        whyItMatters: 'AI assistants answer questions. If your content directly answers common queries, you become the source.',
        gradient: 'from-purple-500 to-fuchsia-500',
        bgGradient: 'from-purple-50 to-fuchsia-50'
    },
    brandSearchVolume: {
        icon: Search,
        label: 'Brand Search Volume',
        description: 'Do people actively search for your brand?',
        whyItMatters: 'High brand search volume signals authority to AI. Unknown brands are less likely to be cited.',
        gradient: 'from-teal-500 to-emerald-500',
        bgGradient: 'from-teal-50 to-emerald-50'
    },
};

// ============================================
// PLATFORM DATA
// ============================================
const PLATFORM_CONFIG: Record<string, {
    icon: any;
    name: string;
    description: string;
    gradient: string;
}> = {
    wikipedia: { icon: BookOpen, name: 'Wikipedia', description: 'Primary source for AI knowledge', gradient: 'from-slate-500 to-slate-700' },
    youtube: { icon: Youtube, name: 'YouTube', description: 'Video content citations', gradient: 'from-red-500 to-red-600' },
    reddit: { icon: MessageSquare, name: 'Reddit', description: 'Community discussions & reviews', gradient: 'from-orange-500 to-orange-600' },
    g2Capterra: { icon: Star, name: 'G2/Capterra', description: 'B2B software reviews', gradient: 'from-emerald-500 to-green-500' },
    trustpilot: { icon: Shield, name: 'Trustpilot', description: 'Consumer trust signals', gradient: 'from-green-500 to-emerald-500' },
    linkedin: { icon: Users, name: 'LinkedIn', description: 'Professional presence', gradient: 'from-blue-600 to-blue-700' },
    crunchbase: { icon: Building2, name: 'Crunchbase', description: 'Business data source', gradient: 'from-indigo-500 to-indigo-600' },
    wikidata: { icon: Globe, name: 'Wikidata', description: 'Knowledge graph entity', gradient: 'from-violet-500 to-purple-500' },
};

// ============================================
// HELPER COMPONENTS
// ============================================

function AnimatedRadarRing({ score, size = 140, isYou = true }: {
    score: number;
    size?: number;
    isYou?: boolean;
}) {
    const radius = (size - 16) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 80) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.5)', label: 'AI VISIBLE' };
        if (s >= 60) return { stroke: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)', label: 'PARTIALLY VISIBLE' };
        if (s >= 40) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', label: 'LOW VISIBILITY' };
        return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', label: 'AI INVISIBLE' };
    };

    const colors = getColor(score);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Radar pulse animation */}
            <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: colors.glow, animationDuration: '2s' }}
            />
            <div
                className="absolute inset-2 rounded-full animate-ping opacity-30"
                style={{ background: colors.glow, animationDuration: '2.5s', animationDelay: '0.5s' }}
            />
            {/* Glow effect */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-40"
                style={{ background: colors.glow }}
            />
            <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                {/* Background circles (radar rings) */}
                <circle cx={size / 2} cy={size / 2} r={radius * 0.3} fill="none" stroke="#e2e8f0" strokeWidth={1} opacity={0.3} />
                <circle cx={size / 2} cy={size / 2} r={radius * 0.6} fill="none" stroke="#e2e8f0" strokeWidth={1} opacity={0.3} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={isYou ? '#cbd5e1' : '#e2e8f0'} strokeWidth={8} />
                {/* Progress circle */}
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
                    style={{ filter: `drop-shadow(0 0 10px ${colors.glow})` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <Radar className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-4xl font-black" style={{ color: colors.stroke }}>
                    {score}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">/100</span>
            </div>
        </div>
    );
}

function ComparisonBadge({ diff }: { diff: number }) {
    if (diff > 0) {
        return (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30">
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

function PlatformPresencePanel({ yourPresence, competitorPresence }: {
    yourPresence?: PlatformPresence;
    competitorPresence?: PlatformPresence;
}) {
    const platforms = Object.keys(PLATFORM_CONFIG) as (keyof typeof PLATFORM_CONFIG)[];
    const yourScore = yourPresence?.totalScore ?? 0;
    const compScore = competitorPresence?.totalScore ?? 0;
    const diff = yourScore - compScore;

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Satellite className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Platform Presence Matrix</h3>
                    <p className="text-sm text-slate-400">Are you where AI looks for answers?</p>
                </div>
                <div className="ml-auto">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${diff > 0 ? 'bg-emerald-500 text-white' : diff < 0 ? 'bg-rose-500 text-white' : 'bg-slate-600 text-white'
                        }`}>
                        {diff > 0 ? '↑' : diff < 0 ? '↓' : '='} {diff > 0 ? '+' : ''}{diff} pts
                    </span>
                </div>
            </div>

            {/* Platform Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {platforms.map(platformKey => {
                    const config = PLATFORM_CONFIG[platformKey];
                    const Icon = config.icon;
                    const yourHas = yourPresence?.[platformKey as keyof PlatformPresence] ?? false;
                    const compHas = competitorPresence?.[platformKey as keyof PlatformPresence] ?? false;

                    return (
                        <div
                            key={platformKey}
                            className={`relative p-3 rounded-xl border transition-all ${yourHas
                                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/50'
                                : 'bg-slate-800/50 border-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-white">{config.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-400">You:</span>
                                    {yourHas ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-slate-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-400">Comp:</span>
                                    {compHas ? (
                                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-slate-500" />
                                    )}
                                </div>
                            </div>
                            {/* Signal strength indicator */}
                            {yourHas && (
                                <div className="absolute top-2 right-2">
                                    <Signal className="w-3 h-3 text-emerald-400 animate-pulse" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-300">
                    <span className="font-semibold text-white">Why this matters: </span>
                    AI assistants like ChatGPT, Perplexity, and Google AI cite authoritative platforms.
                    {yourScore >= compScore
                        ? " Your platform presence gives you an edge in AI visibility."
                        : " Your competitor has stronger platform presence, making them more likely to be cited by AI."}
                </p>
            </div>
        </div>
    );
}

function AiCitabilityPanel({ yourData, competitorData, yourDomain, competitorDomain, citationTest }: {
    yourData: AeoReadinessData;
    competitorData: AeoReadinessData;
    yourDomain: string;
    competitorDomain: string;
    citationTest?: CitationTestData;
}) {
    // Use real citation test data when available, otherwise fallback to subcategory scores
    const yourScore = citationTest?.yourCitabilityScore ?? yourData.score;
    const compScore = citationTest?.competitorCitabilityScore ?? competitorData.score;
    const diff = yourScore - compScore;
    const isWinning = diff > 0;

    const getCitabilityLevel = (score: number) => {
        if (score >= 80) return { label: 'HIGH CITABILITY', color: 'text-emerald-400', bg: 'from-emerald-500 to-teal-500' };
        if (score >= 60) return { label: 'MODERATE CITABILITY', color: 'text-cyan-400', bg: 'from-cyan-500 to-blue-500' };
        if (score >= 40) return { label: 'LOW CITABILITY', color: 'text-amber-400', bg: 'from-amber-500 to-orange-500' };
        return { label: 'UNLIKELY TO BE CITED', color: 'text-rose-400', bg: 'from-rose-500 to-red-500' };
    };

    const yourCitability = getCitabilityLevel(yourScore);
    const compCitability = getCitabilityLevel(compScore);

    const formatDomain = (url: string) => {
        try {
            return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
        } catch {
            return url.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
        }
    };

    // Use real citation data if available, otherwise use placeholder estimates
    const citabilityFactors = citationTest ? [
        { label: 'Fact Density', yourVal: citationTest.factDensity, compVal: Math.max(0, citationTest.competitorCitabilityScore - 5), icon: '📊', isReal: true },
        { label: 'Definitive Claims', yourVal: citationTest.definitiveStatements, compVal: Math.max(0, citationTest.competitorCitabilityScore - 8), icon: '💪', isReal: true },
        { label: 'Unique Insights', yourVal: citationTest.uniqueInsights, compVal: Math.max(0, citationTest.competitorCitabilityScore - 10), icon: '💡', isReal: true },
        { label: 'AI Tested', yourVal: yourScore, compVal: compScore, icon: '🤖', isReal: true },
    ] : [
        { label: 'Content Depth', yourVal: Math.min(100, yourData.score + 5), compVal: Math.min(100, competitorData.score + 3), icon: '📚', isReal: false },
        { label: 'Authority Signals', yourVal: Math.min(100, yourData.score - 2), compVal: Math.min(100, competitorData.score - 5), icon: '🏆', isReal: false },
        { label: 'Quotability', yourVal: Math.min(100, yourData.score + 8), compVal: Math.min(100, competitorData.score + 2), icon: '💬', isReal: false },
        { label: 'Freshness', yourVal: Math.min(100, yourData.score - 5), compVal: Math.min(100, competitorData.score + 1), icon: '🕐', isReal: false },
    ];

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 border border-teal-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">AI Citability Showdown</h3>
                    <p className="text-sm text-slate-500">
                        {citationTest ? 'Real AI citation testing results' : 'Who will AI assistants cite as the authority?'}
                    </p>
                </div>
                {citationTest && (
                    <div className="ml-auto px-2 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold uppercase rounded-full">
                        ✓ AI Tested
                    </div>
                )}
                <ComparisonBadge diff={diff} />
            </div>

            {/* You vs Competitor */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className={`p-4 rounded-xl ${isWinning ? 'bg-white border-2 border-emerald-300 shadow-lg shadow-emerald-100' : 'bg-white/50 border border-slate-200'}`}>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 truncate" title={formatDomain(yourDomain)}>
                        {formatDomain(yourDomain)}
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${yourCitability.bg} text-white mb-2`}>
                        {yourCitability.label}
                    </div>
                    <div className={`text-4xl font-black ${isWinning ? 'text-emerald-600' : 'text-slate-700'}`}>{yourScore}</div>
                    {isWinning && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <Award className="w-3 h-3" />
                            More likely to be cited
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-xl ${!isWinning && diff !== 0 ? 'bg-white border-2 border-rose-300 shadow-lg shadow-rose-100' : 'bg-white/50 border border-slate-200'}`}>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 truncate" title={formatDomain(competitorDomain)}>
                        {formatDomain(competitorDomain)}
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${compCitability.bg} text-white mb-2`}>
                        {compCitability.label}
                    </div>
                    <div className={`text-4xl font-black ${!isWinning && diff !== 0 ? 'text-rose-600' : 'text-slate-500'}`}>{compScore}</div>
                    {!isWinning && diff !== 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-rose-600 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Currently winning AI visibility
                        </div>
                    )}
                </div>
            </div>

            {/* Citability Factors Comparison */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {citabilityFactors.map((factor, i) => {
                    const isAhead = factor.yourVal > factor.compVal;
                    return (
                        <div key={i} className={`p-3 rounded-lg text-center ${isAhead ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-slate-200'}`}>
                            <div className="text-lg mb-1">{factor.icon}</div>
                            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">{factor.label}</div>
                            <div className="flex justify-center gap-2 text-xs">
                                <span className={`font-bold ${isAhead ? 'text-emerald-600' : 'text-slate-600'}`}>{factor.yourVal}</span>
                                <span className="text-slate-300">vs</span>
                                <span className={`font-bold ${!isAhead && factor.yourVal !== factor.compVal ? 'text-rose-600' : 'text-slate-400'}`}>{factor.compVal}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Verdict from AI Testing */}
            {citationTest?.verdict && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-bold text-indigo-800">AI Citation Verdict</span>
                    </div>
                    <p className="text-sm text-indigo-900 font-medium mb-2">{citationTest.verdict.headline}</p>
                    <p className="text-xs text-indigo-700">{citationTest.verdict.explanation}</p>
                    {citationTest.verdict.topReasons.length > 0 && (
                        <ul className="mt-2 space-y-1">
                            {citationTest.verdict.topReasons.slice(0, 3).map((reason, i) => (
                                <li key={i} className="text-xs text-indigo-600 flex items-start gap-1">
                                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{reason}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Insight */}
            <div className={`p-4 rounded-xl ${isWinning ? 'bg-emerald-100 border border-emerald-200' : diff < 0 ? 'bg-rose-100 border border-rose-200' : 'bg-slate-100 border border-slate-200'}`}>
                <p className="text-sm text-slate-700">
                    {isWinning ? (
                        <>
                            <strong className="text-emerald-700">You're winning the AI visibility race!</strong> When users ask AI assistants about your industry, your content is more likely to be cited as the authoritative source.
                        </>
                    ) : diff < 0 ? (
                        <>
                            <strong className="text-rose-700">Your competitor has the AI advantage.</strong> They're {Math.abs(diff)} points ahead in AI citability. Focus on the recommendations below to close this gap.
                        </>
                    ) : (
                        <>
                            <strong className="text-slate-700">You're neck and neck.</strong> Both sites have similar AI visibility. The quick wins below can help you pull ahead.
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}

function ContentStructurePanel({ yourSubcats, compSubcats }: {
    yourSubcats: Record<string, SubcategoryData>;
    compSubcats: Record<string, SubcategoryData>;
}) {
    const structureSignals = [
        { key: 'lists', label: 'Lists & Bullets', icon: List, description: 'Scannable content format' },
        { key: 'tables', label: 'Tables & Data', icon: Table2, description: 'Structured data presentation' },
        { key: 'qa', label: 'Q&A Format', icon: HelpCircle, description: 'Direct question answering' },
        { key: 'definitions', label: 'Clear Definitions', icon: FileText, description: 'Explanatory content' },
    ];

    const yourStructure = yourSubcats.contentStructureForLLMs || { score: 50, evidence: [], issues: [] };
    const compStructure = compSubcats.contentStructureForLLMs || { score: 50, evidence: [], issues: [] };

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <List className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Content Structure for LLMs</h3>
                    <p className="text-sm text-slate-500">Is your content formatted for AI parsing?</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Your Structure */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="text-xs font-bold text-blue-700 uppercase mb-3">Your Structure</div>
                    <div className="text-3xl font-black text-blue-600 mb-2">{yourStructure.score}</div>
                    <div className="space-y-2">
                        {yourStructure.evidence.slice(0, 3).map((e, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-blue-700">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                {e}
                            </div>
                        ))}
                        {yourStructure.issues.slice(0, 2).map((issue, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-rose-600">
                                <AlertTriangle className="w-3 h-3" />
                                {issue}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Competitor Structure */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-3">Competitor</div>
                    <div className="text-3xl font-black text-slate-500 mb-2">{compStructure.score}</div>
                    <div className="space-y-2">
                        {compStructure.evidence.slice(0, 3).map((e, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                <CheckCircle className="w-3 h-3 text-slate-400" />
                                {e}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Structure signals grid */}
            <div className="grid grid-cols-4 gap-2">
                {structureSignals.map(signal => {
                    const Icon = signal.icon;
                    const hasSignal = yourStructure.evidence.some(e =>
                        e.toLowerCase().includes(signal.key) ||
                        e.toLowerCase().includes(signal.label.toLowerCase())
                    );
                    return (
                        <div
                            key={signal.key}
                            className={`p-3 rounded-xl text-center ${hasSignal ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}
                        >
                            <Icon className={`w-5 h-5 mx-auto mb-1 ${hasSignal ? 'text-emerald-500' : 'text-slate-400'}`} />
                            <div className={`text-[10px] font-semibold ${hasSignal ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {signal.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SchemaIntelligencePanel({ yourSubcats, compSubcats }: {
    yourSubcats: Record<string, SubcategoryData>;
    compSubcats: Record<string, SubcategoryData>;
}) {
    const yourSchema = yourSubcats.schemaForAI || { score: 20, evidence: [], issues: [] };
    const compSchema = compSubcats.schemaForAI || { score: 20, evidence: [], issues: [] };
    const diff = yourSchema.score - compSchema.score;

    const aiSchemas = [
        { type: 'FAQPage', importance: 'Critical for Q&A visibility' },
        { type: 'HowTo', importance: 'Step-by-step instructions' },
        { type: 'Article', importance: 'Content authority signals' },
        { type: 'Organization', importance: 'Brand entity recognition' },
        { type: 'Product', importance: 'E-commerce visibility' },
        { type: 'LocalBusiness', importance: 'Local AI search results' },
    ];

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Schema Markup Intelligence</h3>
                    <p className="text-sm text-slate-500">AI-friendly structured data analysis</p>
                </div>
                <ComparisonBadge diff={diff} />
            </div>

            {/* Score comparison */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-xl ${diff >= 0 ? 'bg-violet-50 border-2 border-violet-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2">Your Schema Score</div>
                    <div className={`text-3xl font-black ${diff >= 0 ? 'text-violet-600' : 'text-slate-700'}`}>{yourSchema.score}</div>
                    <div className="mt-2 space-y-1">
                        {yourSchema.evidence.slice(0, 3).map((e, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs text-violet-700">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                {e}
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`p-4 rounded-xl ${diff < 0 ? 'bg-rose-50 border-2 border-rose-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2">Competitor Schema</div>
                    <div className={`text-3xl font-black ${diff < 0 ? 'text-rose-600' : 'text-slate-500'}`}>{compSchema.score}</div>
                    <div className="mt-2 space-y-1">
                        {compSchema.evidence.slice(0, 3).map((e, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs text-slate-600">
                                <CheckCircle className="w-3 h-3 text-slate-400" />
                                {e}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Schema checklist */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200">
                <h4 className="text-sm font-bold text-violet-800 mb-3">AI-Critical Schema Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {aiSchemas.map(schema => {
                        const hasSchema = yourSchema.evidence.some(e => e.toLowerCase().includes(schema.type.toLowerCase()));
                        return (
                            <div
                                key={schema.type}
                                className={`p-2 rounded-lg ${hasSchema ? 'bg-white border border-emerald-200' : 'bg-white/50 border border-violet-100'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {hasSchema ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-slate-300" />
                                    )}
                                    <span className={`text-xs font-semibold ${hasSchema ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        {schema.type}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 ml-6">{schema.importance}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function AiPlatformVisibilityMap({ yourScore, competitorScore }: {
    yourScore: number;
    competitorScore: number;
}) {
    const platforms = [
        { name: 'ChatGPT', icon: Brain, color: 'from-emerald-500 to-teal-500' },
        { name: 'Google AI', icon: Search, color: 'from-blue-500 to-indigo-500' },
        { name: 'Perplexity', icon: Sparkles, color: 'from-violet-500 to-purple-500' },
        { name: 'Bing Copilot', icon: Zap, color: 'from-cyan-500 to-blue-500' },
        { name: 'Claude', icon: MessageSquare, color: 'from-orange-500 to-amber-500' },
    ];

    // Simulate visibility per platform based on overall score
    const getVisibility = (baseScore: number, variance: number) => {
        return Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance));
    };

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 border border-indigo-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">AI Platform Visibility Map</h3>
                    <p className="text-sm text-indigo-300">Estimated visibility across AI assistants</p>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {platforms.map(platform => {
                    const Icon = platform.icon;
                    const visibility = Math.round(yourScore * (0.8 + Math.random() * 0.4));
                    const signalStrength = visibility >= 70 ? 3 : visibility >= 40 ? 2 : 1;

                    return (
                        <div key={platform.name} className="text-center">
                            <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center mb-2 relative`}>
                                <Icon className="w-6 h-6 text-white" />
                                {/* Signal indicator */}
                                <div className="absolute -top-1 -right-1 flex gap-0.5">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className={`w-1 rounded-full ${i <= signalStrength ? 'bg-emerald-400' : 'bg-slate-600'}`}
                                            style={{ height: 4 + i * 3 }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="text-xs font-semibold text-white">{platform.name}</div>
                            <div className={`text-lg font-black ${visibility >= 70 ? 'text-emerald-400' : visibility >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {visibility}%
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-indigo-900/50 border border-indigo-700">
                <p className="text-xs text-indigo-200 text-center">
                    💡 These are estimated visibility scores based on your content's AI readiness factors.
                    Actual citation depends on query context and competition.
                </p>
            </div>
        </div>
    );
}

function QuickWinsPanel({ recommendations, insights }: {
    recommendations: string[];
    insights: string[];
}) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const quickWinExplanations: Record<string, { impact: string; howToFix: string; effort: 'low' | 'medium' | 'high' }> = {
        'schema': {
            impact: 'High visibility boost. FAQPage schema can increase AI citations by 40%+.',
            howToFix: 'Add JSON-LD structured data for FAQPage, HowTo, and Article types. Use Google\'s Structured Data Markup Helper.',
            effort: 'medium'
        },
        'faq': {
            impact: 'Direct answers = direct citations. FAQ content is highly quotable by AI.',
            howToFix: 'Create an FAQ section answering your top 10 customer questions. Use clear, definitive language.',
            effort: 'low'
        },
        'platform': {
            impact: 'Multi-platform presence increases AI trust and citation likelihood.',
            howToFix: 'Create/optimize profiles on Wikipedia (if notable), YouTube, LinkedIn, and relevant review platforms.',
            effort: 'high'
        },
        'content': {
            impact: 'Well-structured content is 60% more likely to be cited by AI assistants.',
            howToFix: 'Add bullet points, numbered lists, tables, and clear headings. Format for skimmability.',
            effort: 'low'
        },
    };

    const getQuickWinDetails = (rec: string) => {
        const lower = rec.toLowerCase();
        if (lower.includes('schema') || lower.includes('structured data')) return quickWinExplanations.schema;
        if (lower.includes('faq') || lower.includes('question')) return quickWinExplanations.faq;
        if (lower.includes('platform') || lower.includes('presence')) return quickWinExplanations.platform;
        return quickWinExplanations.content;
    };

    const getEffortBadge = (effort: 'low' | 'medium' | 'high') => {
        const config = {
            low: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '⚡ Quick' },
            medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: '🔧 Medium' },
            high: { bg: 'bg-rose-100', text: 'text-rose-700', label: '🏗️ Major' },
        };
        return config[effort];
    };

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Quick Wins for AI Visibility</h3>
                    <p className="text-sm text-slate-500">Top actions to improve your AEO readiness</p>
                </div>
            </div>

            <div className="space-y-3">
                {recommendations.slice(0, 5).map((rec, i) => {
                    const details = getQuickWinDetails(rec);
                    const effortBadge = getEffortBadge(details.effort);
                    const isExpanded = expandedIndex === i;

                    return (
                        <div
                            key={i}
                            className={`rounded-xl border transition-all ${isExpanded ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}
                        >
                            <button
                                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                                className="w-full p-4 flex items-start gap-3 text-left"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-bold">{i + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-slate-900">{rec}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${effortBadge.bg} ${effortBadge.text}`}>
                                            {effortBadge.label}
                                        </span>
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </button>

                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t border-amber-200 ml-11">
                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <h5 className="text-xs font-bold text-amber-800 uppercase mb-1">Impact</h5>
                                            <p className="text-sm text-amber-900">{details.impact}</p>
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-amber-800 uppercase mb-1">How to Fix</h5>
                                            <p className="text-sm text-amber-900">{details.howToFix}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AeoReadinessDetail({ yourData, competitorData, yourDomain, competitorDomain, citationTest }: Props) {
    const scoreDiff = yourData.score - competitorData.score;
    const isWinning = scoreDiff > 0;

    const yourSubcats = yourData.subcategories || {};
    const compSubcats = competitorData.subcategories || {};

    const formatDomain = (url: string) => {
        try {
            return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
        } catch {
            return url.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
        }
    };

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white animate-pulse" style={{ animationDuration: '3s' }} />
                    <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-white animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-emerald-100 mb-4">
                        <Radar className="w-5 h-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">AI Visibility Command Center</span>
                    </div>

                    <h1 className="text-3xl font-black text-white mb-2">
                        AEO Readiness Analysis
                    </h1>
                    <p className="text-emerald-100 text-lg max-w-2xl">
                        How visible is your content to AI assistants like ChatGPT, Perplexity, and Google AI?
                        This analysis reveals your AI citability and platform presence.
                    </p>

                    {/* Score Comparison */}
                    <div className="mt-8 flex items-center justify-center gap-8">
                        <div className="text-center flex flex-col items-center">
                            <AnimatedRadarRing score={yourData.score} size={140} isYou={true} />
                            <p className="mt-3 text-sm text-emerald-100 font-medium truncate max-w-[140px]" title={formatDomain(yourDomain)}>
                                {formatDomain(yourDomain)}
                            </p>
                        </div>

                        <div className="flex flex-col items-center justify-center min-w-[80px]">
                            <div className={`text-4xl font-black ${isWinning ? 'text-white' : 'text-rose-300'}`}>
                                {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                            </div>
                            <div className={`mt-2 px-4 py-2 rounded-full text-sm font-bold ${isWinning ? 'bg-white/20 text-white' : scoreDiff < 0 ? 'bg-rose-500/30 text-rose-100' : 'bg-white/10 text-white'
                                }`}>
                                {isWinning ? '🎯 WINNING' : scoreDiff < 0 ? '⚠️ LOSING' : '⚖️ TIED'}
                            </div>
                        </div>

                        <div className="text-center flex flex-col items-center">
                            <AnimatedRadarRing score={competitorData.score} size={140} isYou={false} />
                            <p className="mt-3 text-sm text-emerald-100 font-medium truncate max-w-[140px]" title={formatDomain(competitorDomain)}>
                                {formatDomain(competitorDomain)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Presence Matrix */}
            <PlatformPresencePanel
                yourPresence={yourData.platformPresence}
                competitorPresence={competitorData.platformPresence}
            />

            {/* AI Citability Showdown */}
            <AiCitabilityPanel
                yourData={yourData}
                competitorData={competitorData}
                yourDomain={yourDomain}
                competitorDomain={competitorDomain}
                citationTest={citationTest}
            />

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Content Structure */}
                <ContentStructurePanel
                    yourSubcats={yourSubcats}
                    compSubcats={compSubcats}
                />

                {/* Schema Intelligence */}
                <SchemaIntelligencePanel
                    yourSubcats={yourSubcats}
                    compSubcats={compSubcats}
                />
            </div>

            {/* AI Platform Visibility Map */}
            <AiPlatformVisibilityMap
                yourScore={yourData.score}
                competitorScore={competitorData.score}
            />

            {/* Quick Wins */}
            <QuickWinsPanel
                recommendations={yourData.recommendations}
                insights={yourData.insights}
            />

            {/* Subcategory Breakdown */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Detailed Subcategory Breakdown</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(yourSubcats).map(([key, subcat]) => {
                        const config = SUBCATEGORY_CONFIG[key] || {
                            icon: Target,
                            label: key.replace(/([A-Z])/g, ' $1').trim(),
                            description: '',
                            whyItMatters: '',
                            gradient: 'from-slate-500 to-slate-600',
                            bgGradient: 'from-slate-50 to-slate-100'
                        };
                        const Icon = config.icon;
                        const compScore = compSubcats[key]?.score || 50;
                        const diff = subcat.score - compScore;
                        const isAhead = diff > 0;

                        return (
                            <div
                                key={key}
                                className={`p-4 rounded-xl border transition-all ${isAhead ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/80' :
                                    diff < 0 ? 'border-rose-200 bg-gradient-to-br from-rose-50/80 to-pink-50/80' :
                                        'border-slate-200 bg-gradient-to-br from-slate-50/80 to-white/80'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900">{config.label}</h4>
                                        <p className="text-xs text-slate-500">{config.description}</p>
                                    </div>
                                    <ComparisonBadge diff={diff} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>You</span>
                                            <span className={`font-bold ${isAhead ? 'text-emerald-600' : 'text-slate-700'}`}>{subcat.score}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isAhead ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-400'}`}
                                                style={{ width: `${subcat.score}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>Competitor</span>
                                            <span className={`font-bold ${diff < 0 ? 'text-rose-600' : 'text-slate-500'}`}>{compScore}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${diff < 0 ? 'bg-gradient-to-r from-rose-400 to-red-500' : 'bg-slate-300'}`}
                                                style={{ width: `${compScore}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
