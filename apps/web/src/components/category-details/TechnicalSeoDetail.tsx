'use client';

import { useState } from 'react';
import {
    Zap, AlertTriangle, CheckCircle, Timer, Smartphone,
    Shield, Globe, Activity, Gauge, Info, FileText, Image,
    Link2, Accessibility, BookOpen, TrendingUp, TrendingDown, Minus,
    ChevronDown, ChevronUp, Sparkles, Award, Target
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

interface TechnicalSeoData {
    score: number;
    subcategories: Record<string, SubcategoryData>;
    insights: string[];
    recommendations: string[];
}

interface PerformanceData {
    scores?: { performance: number; accessibility: number; seo: number; bestPractices: number };
    metrics?: { lcp: number; cls: number; fcp: number; ttfb: number; tti: number; si: number };
    opportunities?: { title: string; savings?: number }[];
    diagnostics?: { title: string; description: string }[];
}

// Backlink Quality Analysis Types
interface ReferringDomain {
    domain: string;
    domainRank: number;
    backlinks: number;
    firstSeen: string;
    isDoFollow: boolean;
}

interface BacklinkQualityResult {
    domain: string;
    domainRank: number;
    totalBacklinks: number;
    referringDomains: number;
    referringDomainsDofollow: number;
    toxicScore: number;
    spamScore: number;
    newBacklinks30d: number;
    lostBacklinks30d: number;
    topReferringDomains: ReferringDomain[];
    anchorTextDistribution: { type: 'branded' | 'exact' | 'partial' | 'naked_url' | 'other'; percentage: number; count: number }[];
    linkTypes: { text: number; image: number; redirect: number; other: number };
}

interface BacklinkComparison {
    you: BacklinkQualityResult | null;
    competitor: BacklinkQualityResult | null;
    winner: 'you' | 'competitor' | 'tie' | 'insufficient-data';
    insights: string[];
}

// SERP Features Types
interface SerpFeatures {
    featuredSnippetCount: number;
    peopleAlsoAskCount: number;
    localPackPresent: boolean;
    imageCarouselCount: number;
    videoResultsCount: number;
    knowledgePanelPresent: boolean;
    sitelinksPresent: boolean;
    faqSchemaCount: number;
    reviewSchemaCount: number;
    productSchemaCount: number;
    recipeSchemaCount: number;
    eventSchemaCount: number;
    aiOverviewMentioned: boolean;
    featuredSnippetKeywords: string[];
    paaQuestions: string[];
}

interface SerpComparison {
    you: SerpFeatures;
    competitor: SerpFeatures;
    winner: 'you' | 'competitor' | 'tie';
    insights: string[];
    featureGaps: string[];
}

interface Props {
    yourData: TechnicalSeoData;
    competitorData: TechnicalSeoData;
    yourPerformance?: PerformanceData;
    competitorPerformance?: PerformanceData;
    yourDomain: string;
    competitorDomain: string;
    backlinkComparison?: BacklinkComparison;
    serpComparison?: SerpComparison;
}

// ============================================
// SUBCATEGORY METADATA - With Business-Friendly Explanations
// ============================================
const SUBCATEGORY_CONFIG: Record<string, {
    icon: any;
    label: string;
    description: string;
    whyItMatters: string;
    gradient: string;
    bgGradient: string;
}> = {
    pageSpeed: {
        icon: Timer,
        label: 'Page Speed',
        description: 'How fast your website loads',
        whyItMatters: 'Slow websites lose customers. 53% of visitors leave if a page takes longer than 3 seconds to load.',
        gradient: 'from-blue-500 to-cyan-500',
        bgGradient: 'from-blue-50 to-cyan-50'
    },
    coreWebVitals: {
        icon: Activity,
        label: 'Core Web Vitals',
        description: 'Google\'s page experience scores',
        whyItMatters: 'These are the exact metrics Google uses to rank your site. Better scores = higher rankings.',
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50'
    },
    mobileUsability: {
        icon: Smartphone,
        label: 'Mobile Usability',
        description: 'How well your site works on phones',
        whyItMatters: 'Over 60% of searches happen on mobile. If your site is hard to use on phones, you\'re losing most of your potential customers.',
        gradient: 'from-green-500 to-emerald-500',
        bgGradient: 'from-green-50 to-emerald-50'
    },
    security: {
        icon: Shield,
        label: 'Security',
        description: 'Website safety and trust signals',
        whyItMatters: 'Browsers show warnings on insecure sites. Visitors won\'t trust or buy from a site flagged as "Not Secure".',
        gradient: 'from-amber-500 to-orange-500',
        bgGradient: 'from-amber-50 to-orange-50'
    },
    crawlability: {
        icon: Globe,
        label: 'Crawlability',
        description: 'Can Google find your pages?',
        whyItMatters: 'If Google can\'t read your site, you won\'t show up in search results at all - no matter how good your content is.',
        gradient: 'from-indigo-500 to-violet-500',
        bgGradient: 'from-indigo-50 to-violet-50'
    },
    onPageStructure: {
        icon: FileText,
        label: 'On-Page Structure',
        description: 'Title tags, headings, and descriptions',
        whyItMatters: 'These elements tell Google what your page is about. Poor structure means Google may rank you for the wrong searches.',
        gradient: 'from-rose-500 to-pink-500',
        bgGradient: 'from-rose-50 to-pink-50'
    },
    imageOptimization: {
        icon: Image,
        label: 'Image Optimization',
        description: 'Are images slowing you down?',
        whyItMatters: 'Unoptimized images are the #1 cause of slow websites. Faster images = faster site = more conversions.',
        gradient: 'from-teal-500 to-cyan-500',
        bgGradient: 'from-teal-50 to-cyan-50'
    },
    internalLinking: {
        icon: Link2,
        label: 'Internal Linking',
        description: 'How pages connect to each other',
        whyItMatters: 'Good linking helps visitors find what they need and helps Google understand which pages are most important.',
        gradient: 'from-sky-500 to-blue-500',
        bgGradient: 'from-sky-50 to-blue-50'
    },
    accessibilityBestPractices: {
        icon: Accessibility,
        label: 'Accessibility',
        description: 'Can everyone use your site?',
        whyItMatters: 'Accessible sites reach more customers (including those with disabilities) and avoid potential legal issues.',
        gradient: 'from-violet-500 to-purple-500',
        bgGradient: 'from-violet-50 to-purple-50'
    },
    contentDepth: {
        icon: BookOpen,
        label: 'Content Depth',
        description: 'Is your content thorough enough?',
        whyItMatters: 'Thin content rarely ranks. Pages with comprehensive, helpful information outperform competitors and earn more trust.',
        gradient: 'from-fuchsia-500 to-pink-500',
        bgGradient: 'from-fuchsia-50 to-pink-50'
    },
};

// ============================================
// HELPER COMPONENTS
// ============================================

function AnimatedScoreRing({ score, size = 120, isYou = true, animate = true }: {
    score: number;
    size?: number;
    isYou?: boolean;
    animate?: boolean;
}) {
    const radius = (size - 12) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 80) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' };
        if (s >= 60) return { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' };
        if (s >= 40) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' };
        return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
    };

    const colors = getColor(score);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Glow effect */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-50"
                style={{ background: colors.glow }}
            />
            <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={isYou ? '#e2e8f0' : '#f1f5f9'}
                    strokeWidth={10}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={10}
                    strokeDasharray={circumference}
                    strokeDashoffset={animate ? offset : circumference}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 8px ${colors.glow})`,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span
                    className="text-3xl font-black"
                    style={{ color: colors.stroke }}
                >
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
        description: 'Performance metric',
        whyItMatters: 'This factor affects your site\'s search visibility and user experience.',
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
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />

            <div className="p-5">
                {/* Header */}
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

                {/* Why It Matters - Plain English */}
                <div className="mb-4 p-3 rounded-lg bg-white/60 border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-700">Why this matters: </span>
                        {config.whyItMatters}
                    </p>
                </div>

                {/* Score comparison */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Your score */}
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

                    {/* Competitor score */}
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

                {/* Expand button */}
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

                {/* Expanded details */}
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

function CoreWebVitalCard({ metric, value, unit, threshold, compValue, explanation }: {
    metric: string;
    value: number;
    unit: string;
    threshold: { good: number; ok: number };
    compValue: number;
    explanation: string;
}) {
    const displayValue = unit === 's' ? (value / 1000).toFixed(2) : value.toFixed(3);
    const compDisplayValue = unit === 's' ? (compValue / 1000).toFixed(2) : compValue.toFixed(3);
    const status = value <= threshold.good ? 'good' : value <= threshold.ok ? 'needs-improvement' : 'poor';
    const isWinning = value < compValue;

    const statusConfig = {
        good: { bg: 'from-emerald-500 to-green-500', text: 'text-emerald-600', label: 'GOOD', badgeBg: 'bg-emerald-500' },
        'needs-improvement': { bg: 'from-amber-500 to-orange-500', text: 'text-amber-600', label: 'NEEDS WORK', badgeBg: 'bg-amber-500' },
        poor: { bg: 'from-rose-500 to-red-500', text: 'text-rose-600', label: 'POOR', badgeBg: 'bg-rose-500' },
    };
    const config = statusConfig[status];

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 hover:shadow-lg transition-all duration-300">
            {/* Top gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.bg}`} />

            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">{metric}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.badgeBg} text-white`}>
                    {config.label}
                </span>
            </div>

            {/* Plain English explanation */}
            <p className="text-xs text-slate-500 mb-4">{explanation}</p>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className={`text-3xl font-black ${config.text}`}>{displayValue}{unit}</div>
                    <div className="text-xs text-slate-400 mt-1">Your site</div>
                </div>
                <div className="border-l border-slate-200 pl-4">
                    <div className="text-2xl font-bold text-slate-400">{compDisplayValue}{unit}</div>
                    <div className="text-xs text-slate-400 mt-1">Competitor</div>
                </div>
            </div>

            {isWinning && (
                <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    You're {((compValue - value) / 1000).toFixed(2)}s faster
                </div>
            )}
        </div>
    );
}

function LighthouseScoreCard({ label, score, compScore, icon: IconLabel }: {
    label: string;
    score: number;
    compScore: number;
    icon: string;
}) {
    const diff = score - compScore;
    const getColor = (s: number) => {
        if (s >= 90) return { ring: '#10b981', bg: 'from-emerald-500 to-green-500' };
        if (s >= 50) return { ring: '#f59e0b', bg: 'from-amber-500 to-orange-500' };
        return { ring: '#ef4444', bg: 'from-rose-500 to-red-500' };
    };
    const colors = getColor(score);

    return (
        <div className="text-center p-4 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all duration-300">
            <div className="relative w-20 h-20 mx-auto mb-3">
                <svg width={80} height={80} className="transform -rotate-90">
                    <circle cx={40} cy={40} r={34} fill="none" stroke="#e2e8f0" strokeWidth={6} />
                    <circle
                        cx={40} cy={40} r={34}
                        fill="none"
                        stroke={colors.ring}
                        strokeWidth={6}
                        strokeDasharray={34 * 2 * Math.PI}
                        strokeDashoffset={34 * 2 * Math.PI * (1 - score / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                        style={{ filter: `drop-shadow(0 0 6px ${colors.ring}50)` }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black" style={{ color: colors.ring }}>{score}</span>
                </div>
            </div>
            <p className="font-semibold text-slate-800 mb-1">{label}</p>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${diff > 0 ? 'bg-emerald-100 text-emerald-700' : diff < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                }`}>
                {diff > 0 ? '+' : ''}{diff} vs comp
            </div>
        </div>
    );
}

// ============================================
// SPEED COMPARISON PANEL - Like Slop Detector
// ============================================
function SpeedComparisonPanel({ yourMetrics, compMetrics, yourDomain, competitorDomain }: {
    yourMetrics: { lcp: number; cls: number; fcp: number; ttfb: number };
    compMetrics: { lcp: number; cls: number; fcp: number; ttfb: number };
    yourDomain: string;
    competitorDomain: string;
}) {
    // Calculate overall speed score
    const yourSpeedScore = Math.round(100 - ((yourMetrics.lcp / 100) + (yourMetrics.fcp / 50) + (yourMetrics.ttfb / 20)) / 3);
    const compSpeedScore = Math.round(100 - ((compMetrics.lcp / 100) + (compMetrics.fcp / 50) + (compMetrics.ttfb / 20)) / 3);
    const diff = yourSpeedScore - compSpeedScore;
    const isWinning = diff > 0;

    const getSpeedLabel = (score: number) => {
        if (score >= 80) return { label: '🚀 BLAZING FAST', color: 'text-emerald-600', bg: 'from-emerald-500 to-green-500' };
        if (score >= 60) return { label: '✅ GOOD SPEED', color: 'text-blue-600', bg: 'from-blue-500 to-cyan-500' };
        if (score >= 40) return { label: '⚠️ NEEDS WORK', color: 'text-amber-600', bg: 'from-amber-500 to-orange-500' };
        return { label: '🐌 SLOW SITE', color: 'text-rose-600', bg: 'from-rose-500 to-red-500' };
    };

    const yourConfig = getSpeedLabel(yourSpeedScore);
    const compConfig = getSpeedLabel(compSpeedScore);

    const formatDomain = (url: string) => {
        try {
            return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
        } catch {
            return url.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
        }
    };

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Speed Showdown</h3>
                    <p className="text-sm text-slate-500">Head-to-head performance comparison</p>
                </div>
                <div className="ml-auto">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${isWinning ? 'bg-emerald-500 text-white' : diff < 0 ? 'bg-rose-500 text-white' : 'bg-slate-300 text-slate-700'
                        }`}>
                        {isWinning ? '↑' : diff < 0 ? '↓' : '='} {diff > 0 ? '+' : ''}{diff} pts
                    </span>
                </div>
            </div>

            {/* You vs Competitor Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-xl ${isWinning ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 truncate" title={formatDomain(yourDomain)}>
                        {formatDomain(yourDomain)}
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${yourConfig.bg} text-white mb-2`}>
                        {yourConfig.label}
                    </div>
                    <div className={`text-4xl font-black ${isWinning ? 'text-emerald-600' : yourConfig.color}`}>{yourSpeedScore}</div>
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>LCP</span>
                            <span className={`font-bold ${yourMetrics.lcp <= compMetrics.lcp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {(yourMetrics.lcp / 1000).toFixed(2)}s
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>FCP</span>
                            <span className={`font-bold ${yourMetrics.fcp <= compMetrics.fcp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {(yourMetrics.fcp / 1000).toFixed(2)}s
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>CLS</span>
                            <span className={`font-bold ${yourMetrics.cls <= compMetrics.cls ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {yourMetrics.cls.toFixed(3)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={`p-4 rounded-xl ${!isWinning && diff !== 0 ? 'bg-rose-50 border-2 border-rose-300' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 truncate" title={formatDomain(competitorDomain)}>
                        {formatDomain(competitorDomain)}
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${compConfig.bg} text-white mb-2`}>
                        {compConfig.label}
                    </div>
                    <div className={`text-4xl font-black ${!isWinning && diff !== 0 ? 'text-rose-600' : 'text-slate-500'}`}>{compSpeedScore}</div>
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>LCP</span>
                            <span className="font-bold text-slate-500">{(compMetrics.lcp / 1000).toFixed(2)}s</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>FCP</span>
                            <span className="font-bold text-slate-500">{(compMetrics.fcp / 1000).toFixed(2)}s</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>CLS</span>
                            <span className="font-bold text-slate-500">{compMetrics.cls.toFixed(3)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Winner Summary */}
            <div className={`p-4 rounded-xl ${isWinning ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200' : diff < 0 ? 'bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200' : 'bg-slate-50 border border-slate-200'}`}>
                <p className="text-sm text-slate-700 leading-relaxed">
                    {isWinning ? (
                        <>
                            <strong className="text-emerald-600">Your site is faster!</strong> Visitors will experience {Math.abs(diff)} points better loading performance.
                            Faster sites convert better and rank higher in Google search results.
                        </>
                    ) : diff < 0 ? (
                        <>
                            <strong className="text-rose-600">Your competitor loads faster.</strong> This {Math.abs(diff)}-point speed gap means they may capture impatient visitors who leave slow-loading sites.
                            Each 1-second delay can reduce conversions by 7%.
                        </>
                    ) : (
                        <>
                            <strong className="text-slate-600">Speed is evenly matched.</strong> Neither site has a significant performance advantage.
                            Focus on the Quick Wins below to pull ahead.
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}

// ============================================
// PERFORMANCE HEALTH METER - Visual health indicators
// ============================================
function PerformanceHealthMeter({ yourScores, compScores }: {
    yourScores: { performance: number; accessibility: number; seo: number; bestPractices: number };
    compScores: { performance: number; accessibility: number; seo: number; bestPractices: number };
}) {
    const metrics = [
        { key: 'performance', label: 'Performance', icon: Zap, description: 'How fast your site loads' },
        { key: 'accessibility', label: 'Accessibility', icon: Accessibility, description: 'Can everyone use your site?' },
        { key: 'seo', label: 'SEO Score', icon: Globe, description: 'Search engine optimization' },
        { key: 'bestPractices', label: 'Best Practices', icon: Shield, description: 'Modern web standards' },
    ];

    const avgYour = Math.round((yourScores.performance + yourScores.accessibility + yourScores.seo + yourScores.bestPractices) / 4);
    const avgComp = Math.round((compScores.performance + compScores.accessibility + compScores.seo + compScores.bestPractices) / 4);
    const diff = avgYour - avgComp;

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Site Health Overview</h3>
                    <p className="text-sm text-slate-500">Four pillars of technical excellence</p>
                </div>
                <div className="ml-auto text-center">
                    <div className={`text-3xl font-black ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {avgYour}
                        <span className="text-xs text-slate-400">/100</span>
                    </div>
                    <div className={`text-xs font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {diff > 0 ? `+${diff} ahead` : diff < 0 ? `${diff} behind` : 'Even'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {metrics.map(({ key, label, icon: Icon, description }) => {
                    const yourVal = yourScores[key as keyof typeof yourScores];
                    const compVal = compScores[key as keyof typeof compScores];
                    const metricDiff = yourVal - compVal;
                    const isAhead = metricDiff > 0;

                    const getColor = (score: number) => {
                        if (score >= 90) return 'from-emerald-500 to-green-500';
                        if (score >= 50) return 'from-amber-500 to-orange-500';
                        return 'from-rose-500 to-red-500';
                    };

                    return (
                        <div key={key} className="p-4 rounded-xl bg-white border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getColor(yourVal)} flex items-center justify-center`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{label}</div>
                                    <div className="text-[10px] text-slate-500">{description}</div>
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <div className={`text-2xl font-black ${isAhead ? 'text-emerald-600' : metricDiff < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                                        {yourVal}
                                    </div>
                                    <div className="text-[10px] text-slate-400">vs {compVal}</div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${isAhead ? 'bg-emerald-100 text-emerald-700' : metricDiff < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {metricDiff > 0 ? '+' : ''}{metricDiff}
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${getColor(yourVal)} transition-all duration-700`}
                                    style={{ width: `${yourVal}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================
// QUICK WIN EXPLANATIONS - Detailed guidance
// ============================================
const QUICK_WIN_EXPLANATIONS: Record<string, {
    explanation: string;
    impact: string;
    howToFix: string;
}> = {
    'Reduce unused JavaScript': {
        explanation: 'Your site is loading JavaScript code that isn\'t being used on this page. This extra code slows down your site.',
        impact: 'Removing unused JavaScript can make your site load significantly faster, improving user experience and SEO rankings.',
        howToFix: 'Use code-splitting to load only the JavaScript needed for each page. Consider lazy-loading non-critical scripts.',
    },
    'Reduce unused CSS': {
        explanation: 'Your stylesheets contain CSS rules that aren\'t applied to any elements on this page.',
        impact: 'Extra CSS blocks page rendering. Removing it can improve First Contentful Paint significantly.',
        howToFix: 'Use PurgeCSS or similar tools to remove unused styles. Consider critical CSS extraction for above-the-fold content.',
    },
    'Properly size images': {
        explanation: 'Some images on your page are larger than necessary for their display size.',
        impact: 'Oversized images waste bandwidth and slow loading. Proper sizing can save megabytes of data.',
        howToFix: 'Resize images to match their display dimensions. Use responsive images with srcset for different screen sizes.',
    },
    'Serve images in next-gen formats': {
        explanation: 'Your images are in older formats like JPEG or PNG. Modern formats like WebP are 25-35% smaller.',
        impact: 'Switching to WebP or AVIF can dramatically reduce image file sizes without quality loss.',
        howToFix: 'Convert images to WebP format. Use <picture> tags with fallbacks for older browsers.',
    },
    'Defer offscreen images': {
        explanation: 'Images below the fold are loading immediately, blocking other resources.',
        impact: 'Lazy-loading offscreen images prioritizes visible content, improving initial load time.',
        howToFix: 'Add loading="lazy" attribute to images below the fold. Use Intersection Observer for more control.',
    },
    'Eliminate render-blocking resources': {
        explanation: 'CSS and JavaScript files are preventing your page from rendering quickly.',
        impact: 'Render-blocking resources delay First Contentful Paint. Eliminating them improves perceived speed.',
        howToFix: 'Inline critical CSS, defer non-critical CSS, and add async/defer to scripts.',
    },
    'Preconnect to required origins': {
        explanation: 'Your page makes requests to external domains. Early connections can save time.',
        impact: 'Preconnect hints reduce connection time to third-party resources by 100-300ms.',
        howToFix: 'Add <link rel="preconnect"> tags for frequently used external domains.',
    },
    'Efficiently encode images': {
        explanation: 'Some images could be compressed further without visible quality loss.',
        impact: 'Better compression reduces file sizes by 20-50% with no perceptible difference.',
        howToFix: 'Use image optimization tools like ImageOptim, TinyPNG, or automated build-time compression.',
    },
    'Enable text compression': {
        explanation: 'Your text-based resources (HTML, CSS, JS) aren\'t being compressed during transfer.',
        impact: 'Gzip/Brotli compression reduces transfer sizes by 60-80%, significantly speeding up loading.',
        howToFix: 'Enable gzip or Brotli compression on your web server. Most CDNs offer this automatically.',
    },
    'Minify JavaScript': {
        explanation: 'Your JavaScript files contain unnecessary whitespace and comments.',
        impact: 'Minification typically reduces JS file sizes by 30-40%.',
        howToFix: 'Use a build tool like Webpack, Rollup, or esbuild to minify JavaScript during production builds.',
    },
    'Minify CSS': {
        explanation: 'Your CSS files contain unnecessary whitespace and comments.',
        impact: 'Minified CSS loads faster and reduces bandwidth usage by 15-25%.',
        howToFix: 'Use CSS minifiers like cssnano in your build process.',
    },
    'Avoid enormous network payloads': {
        explanation: 'Your page is transferring a large amount of data, slowing down the experience.',
        impact: 'Large payloads especially hurt mobile users on slow connections.',
        howToFix: 'Audit large resources, compress assets, consider code-splitting for JavaScript.',
    },
    'Reduce initial server response time': {
        explanation: 'Your server takes too long to start sending the page.',
        impact: 'TTFB directly affects every other metric. A fast server is foundational.',
        howToFix: 'Optimize database queries, use caching, consider a CDN, or upgrade hosting.',
    },
};

// ============================================
// BACKLINK QUALITY PANEL
// ============================================

function BacklinkQualityPanel({ data, yourDomain, competitorDomain }: {
    data: BacklinkComparison;
    yourDomain: string;
    competitorDomain: string;
}) {
    const you = data.you;
    const comp = data.competitor;

    const formatNumber = (n: number) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
    };

    const getQualityColor = (score: number, inverse = false) => {
        const effective = inverse ? 100 - score : score;
        if (effective >= 70) return 'text-emerald-600';
        if (effective >= 40) return 'text-amber-600';
        return 'text-rose-600';
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Backlink Profile Comparison</h3>
                        <p className="text-slate-500 text-sm">Domain authority and link quality analysis</p>
                    </div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${data.winner === 'you' ? 'bg-emerald-100 text-emerald-700' :
                    data.winner === 'competitor' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                    {data.winner === 'you' ? '🏆 Winning' : data.winner === 'competitor' ? '⚠️ Behind' : '➖ Tie'}
                </div>
            </div>

            {(!you && !comp) ? (
                <div className="text-center py-8 text-slate-500">
                    <Link2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Backlink data not available</p>
                    <p className="text-sm">DataForSEO integration required</p>
                </div>
            ) : (
                <>
                    {/* Main Metrics Comparison */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Your Profile */}
                        <div className="bg-white rounded-xl p-4 border border-blue-200">
                            <p className="text-xs font-bold text-blue-600 uppercase mb-3">{yourDomain}</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Domain Rank</span>
                                    <span className={`font-black text-xl ${getQualityColor(you?.domainRank || 0)}`}>
                                        {you?.domainRank || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Total Backlinks</span>
                                    <span className="font-bold text-slate-900">{formatNumber(you?.totalBacklinks || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Referring Domains</span>
                                    <span className="font-bold text-slate-900">{formatNumber(you?.referringDomains || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">DoFollow %</span>
                                    <span className="font-bold text-emerald-600">
                                        {you?.referringDomains ? Math.round((you.referringDomainsDofollow / you.referringDomains) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Competitor Profile */}
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">{competitorDomain}</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Domain Rank</span>
                                    <span className="font-bold text-xl text-slate-600">
                                        {comp?.domainRank || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Total Backlinks</span>
                                    <span className="font-bold text-slate-600">{formatNumber(comp?.totalBacklinks || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Referring Domains</span>
                                    <span className="font-bold text-slate-600">{formatNumber(comp?.referringDomains || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">DoFollow %</span>
                                    <span className="font-bold text-slate-600">
                                        {comp?.referringDomains ? Math.round((comp.referringDomainsDofollow / comp.referringDomains) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Health Indicators */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                            <div className={`text-2xl font-black ${getQualityColor(100 - (you?.toxicScore || 0))}`}>
                                {you?.toxicScore || 0}%
                            </div>
                            <div className="text-xs text-slate-500">Toxic Score</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                            <div className={`text-2xl font-black ${getQualityColor(100 - (you?.spamScore || 0))}`}>
                                {you?.spamScore || 0}%
                            </div>
                            <div className="text-xs text-slate-500">Spam Score</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-center">
                            <div className="text-2xl font-black text-emerald-600">+{you?.newBacklinks30d || 0}</div>
                            <div className="text-xs text-emerald-600">New (30d)</div>
                        </div>
                        <div className="bg-rose-50 rounded-lg p-3 border border-rose-200 text-center">
                            <div className="text-2xl font-black text-rose-600">-{you?.lostBacklinks30d || 0}</div>
                            <div className="text-xs text-rose-600">Lost (30d)</div>
                        </div>
                    </div>

                    {/* Top Referring Domains */}
                    {you?.topReferringDomains && you.topReferringDomains.length > 0 && (
                        <div className="mb-6">
                            <h4 className="font-bold text-slate-700 mb-3 text-sm">Top Referring Domains</h4>
                            <div className="space-y-2">
                                {you.topReferringDomains.slice(0, 5).map((rd, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                {i + 1}
                                            </span>
                                            <span className="font-medium text-slate-800 text-sm">{rd.domain}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className={`font-bold ${getQualityColor(rd.domainRank)}`}>DR {rd.domainRank}</span>
                                            <span className="text-slate-500">{rd.backlinks} links</span>
                                            <span className={rd.isDoFollow ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                                                {rd.isDoFollow ? '✓ DoFollow' : 'NoFollow'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Insights */}
                    {data.insights && data.insights.length > 0 && (
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                            <h4 className="font-bold text-indigo-700 mb-2 text-sm">💡 Key Insights</h4>
                            <ul className="space-y-1">
                                {data.insights.map((insight, i) => (
                                    <li key={i} className="text-sm text-indigo-600 flex items-start gap-2">
                                        <span className="text-indigo-400 mt-1">•</span>
                                        {insight}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ============================================
// SERP FEATURES PANEL
// ============================================

function SerpFeaturesPanel({ data, yourDomain, competitorDomain }: {
    data: SerpComparison;
    yourDomain: string;
    competitorDomain: string;
}) {
    const you = data.you;
    const comp = data.competitor;

    const features = [
        { key: 'featuredSnippetCount', label: 'Featured Snippets', icon: '⭐', yours: you.featuredSnippetCount, theirs: comp.featuredSnippetCount },
        { key: 'peopleAlsoAskCount', label: 'People Also Ask', icon: '❓', yours: you.peopleAlsoAskCount, theirs: comp.peopleAlsoAskCount },
        { key: 'localPackPresent', label: 'Local Pack', icon: '📍', yours: you.localPackPresent ? 1 : 0, theirs: comp.localPackPresent ? 1 : 0, isBool: true },
        { key: 'knowledgePanelPresent', label: 'Knowledge Panel', icon: '🧠', yours: you.knowledgePanelPresent ? 1 : 0, theirs: comp.knowledgePanelPresent ? 1 : 0, isBool: true },
        { key: 'sitelinksPresent', label: 'Sitelinks', icon: '🔗', yours: you.sitelinksPresent ? 1 : 0, theirs: comp.sitelinksPresent ? 1 : 0, isBool: true },
        { key: 'aiOverviewMentioned', label: 'AI Overview', icon: '🤖', yours: you.aiOverviewMentioned ? 1 : 0, theirs: comp.aiOverviewMentioned ? 1 : 0, isBool: true, isNew: true },
        { key: 'imageCarouselCount', label: 'Image Carousel', icon: '🖼️', yours: you.imageCarouselCount, theirs: comp.imageCarouselCount },
        { key: 'videoResultsCount', label: 'Video Results', icon: '🎬', yours: you.videoResultsCount, theirs: comp.videoResultsCount },
        { key: 'faqSchemaCount', label: 'FAQ Schema', icon: '📝', yours: you.faqSchemaCount, theirs: comp.faqSchemaCount },
        { key: 'reviewSchemaCount', label: 'Review Schema', icon: '⭐', yours: you.reviewSchemaCount, theirs: comp.reviewSchemaCount },
    ];

    return (
        <div className="bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 rounded-2xl border border-purple-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-xl">
                        🎯
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">SERP Features Comparison</h3>
                        <p className="text-slate-500 text-sm">Google search result enhancements</p>
                    </div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${data.winner === 'you' ? 'bg-emerald-100 text-emerald-700' :
                    data.winner === 'competitor' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                    {data.winner === 'you' ? '🏆 Winning' : data.winner === 'competitor' ? '⚠️ Behind' : '➖ Tie'}
                </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {features.map((f) => {
                    const diff = f.yours - f.theirs;
                    const isWinning = diff > 0;
                    const isLosing = diff < 0;

                    return (
                        <div key={f.key} className={`bg-white rounded-xl p-3 border text-center relative ${isWinning ? 'border-emerald-200' : isLosing ? 'border-rose-200' : 'border-slate-200'
                            }`}>
                            {f.isNew && (
                                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                            )}
                            <div className="text-2xl mb-1">{f.icon}</div>
                            <div className="text-xs font-medium text-slate-500 mb-2">{f.label}</div>
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <span className={`font-bold ${isWinning ? 'text-emerald-600' : isLosing ? 'text-rose-600' : 'text-slate-600'}`}>
                                    {f.isBool ? (f.yours ? '✓' : '✗') : f.yours}
                                </span>
                                <span className="text-slate-300">vs</span>
                                <span className="text-slate-500">
                                    {f.isBool ? (f.theirs ? '✓' : '✗') : f.theirs}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Feature Gaps */}
            {data.featureGaps && data.featureGaps.length > 0 && (
                <div className="bg-rose-50 rounded-xl p-4 border border-rose-200 mb-4">
                    <h4 className="font-bold text-rose-700 mb-2 text-sm">🚨 Features You&apos;re Missing</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.featureGaps.map((gap, i) => (
                            <span key={i} className="px-3 py-1 bg-white rounded-full text-rose-600 text-sm border border-rose-200">
                                {gap}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Insights */}
            {data.insights && data.insights.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <h4 className="font-bold text-purple-700 mb-2 text-sm">💡 Your SERP Wins</h4>
                    <ul className="space-y-1">
                        {data.insights.map((insight, i) => (
                            <li key={i} className="text-sm text-purple-600 flex items-start gap-2">
                                <span className="text-purple-400 mt-1">✓</span>
                                {insight}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Featured Snippet Keywords */}
            {you.featuredSnippetKeywords && you.featuredSnippetKeywords.length > 0 && (
                <div className="mt-4 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <h4 className="font-bold text-emerald-700 mb-2 text-sm">🌟 Your Featured Snippet Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                        {you.featuredSnippetKeywords.map((kw, i) => (
                            <span key={i} className="px-2 py-1 bg-white rounded text-emerald-600 text-xs border border-emerald-200">
                                {kw}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TechnicalSeoDetail({ yourData, competitorData, yourPerformance, competitorPerformance, yourDomain, competitorDomain, backlinkComparison, serpComparison }: Props) {
    const scoreDiff = yourData.score - competitorData.score;
    const isWinning = scoreDiff > 0;

    const subcats = yourData.subcategories || {};
    const compSubcats = competitorData.subcategories || {};

    const yourMetrics = yourPerformance?.metrics || { lcp: 5000, cls: 0.25, fcp: 3000, ttfb: 800, tti: 5000, si: 4000 };
    const compMetrics = competitorPerformance?.metrics || { lcp: 5000, cls: 0.25, fcp: 3000, ttfb: 800, tti: 5000, si: 4000 };

    const yourScores = yourPerformance?.scores || { performance: 50, accessibility: 50, seo: 50, bestPractices: 50 };
    const compScores = competitorPerformance?.scores || { performance: 50, accessibility: 50, seo: 50, bestPractices: 50 };

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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-10">
                {/* Animated gradient orbs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/30">
                            <Zap className="w-7 h-7 md:w-8 md:h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-white">Technical SEO Analysis</h2>
                            <p className="text-slate-400 text-sm md:text-base">Comprehensive audit of 10 critical performance factors</p>
                        </div>
                    </div>

                    {/* Score comparison - Improved layout */}
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
                                <p className="text-emerald-400 text-sm font-medium mt-1">Your Score</p>
                            </div>
                        </div>

                        {/* VS badge - Center column */}
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
                                    <><Award className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span className="text-emerald-400 font-bold text-sm">You're Winning!</span></>
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
                    {/* Performance Summary */}
                    <div className="mt-10 pt-8 border-t border-white/10">
                        <div className="flex items-center justify-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
                                <span className="text-white">
                                    <span className="text-2xl font-black text-emerald-400">{wins}</span>
                                    <span className="text-slate-400 ml-2">{wins === 1 ? 'area' : 'areas'} ahead</span>
                                </span>
                            </div>
                            <div className="text-slate-600">|</div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-rose-400 shadow-lg shadow-rose-400/50"></div>
                                <span className="text-white">
                                    <span className="text-2xl font-black text-rose-400">{losses}</span>
                                    <span className="text-slate-400 ml-2">{losses === 1 ? 'area' : 'areas'} to improve</span>
                                </span>
                            </div>
                        </div>
                        <p className="text-center text-slate-500 text-xs mt-4">
                            Based on {Object.keys(subcats).length} performance factors analyzed below
                        </p>
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
                                <>Your site <strong className="text-emerald-600">outperforms</strong> the competition in Technical SEO by <strong>{scoreDiff} points</strong>.
                                    You're winning in {wins} out of {Object.keys(subcats).length} subcategories. This technical advantage helps search engines crawl and index
                                    your content more efficiently, directly contributing to better rankings.</>
                            ) : scoreDiff < 0 ? (
                                <>Your competitor <strong className="text-rose-600">leads</strong> by <strong>{Math.abs(scoreDiff)} points</strong> in Technical SEO.
                                    They're outperforming you in {losses} subcategories. This gap is likely impacting your search rankings and user experience.
                                    The detailed breakdown below shows exactly where to focus your optimization efforts.</>
                            ) : (
                                <>You're <strong>evenly matched</strong> with your competitor on Technical SEO. Focus on the improvement opportunities
                                    in each subcategory to pull ahead and gain a competitive advantage.</>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* CORE WEB VITALS */}
            {/* ============================================ */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Core Web Vitals</h3>
                        <p className="text-sm text-slate-500">Google's key page experience metrics</p>
                    </div>
                    <span className="ml-auto px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                        RANKING FACTOR
                    </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <CoreWebVitalCard
                        metric="LCP (Largest Contentful Paint)"
                        value={yourMetrics.lcp}
                        compValue={compMetrics.lcp}
                        unit="s"
                        threshold={{ good: 2500, ok: 4000 }}
                        explanation="How long until visitors see your main content. Slow = frustrated visitors who leave."
                    />
                    <CoreWebVitalCard
                        metric="CLS (Cumulative Layout Shift)"
                        value={yourMetrics.cls}
                        compValue={compMetrics.cls}
                        unit=""
                        threshold={{ good: 0.1, ok: 0.25 }}
                        explanation="Does your page 'jump around' while loading? Shifting layouts frustrate users and hurt rankings."
                    />
                    <CoreWebVitalCard
                        metric="FCP (First Contentful Paint)"
                        value={yourMetrics.fcp}
                        compValue={compMetrics.fcp}
                        unit="s"
                        threshold={{ good: 1800, ok: 3000 }}
                        explanation="How quickly visitors see something on screen. Faster = better first impressions."
                    />
                </div>
                {/* ============================================ */}
                {/* SPEED SHOWDOWN - Visual Comparison Panel */}
                {/* ============================================ */}
                <SpeedComparisonPanel
                    yourMetrics={yourMetrics}
                    compMetrics={compMetrics}
                    yourDomain={yourDomain}
                    competitorDomain={competitorDomain}
                />

                {/* ============================================ */}
                {/* SITE HEALTH OVERVIEW - Four Pillars */}
                {/* ============================================ */}
                <PerformanceHealthMeter
                    yourScores={yourScores}
                    compScores={compScores}
                />

                {/* ============================================ */}
                {/* CORE WEB VITALS */}
                {/* ============================================ */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                            <Timer className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Core Web Vitals</h3>
                            <p className="text-sm text-slate-500">Google's essential speed metrics that affect rankings</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <CoreWebVitalCard
                            metric="LCP (Largest Contentful Paint)"
                            value={yourMetrics.lcp}
                            compValue={compMetrics.lcp}
                            unit="s"
                            threshold={{ good: 2500, ok: 4000 }}
                            explanation="How long until visitors see your main content. Slow = frustrated visitors who leave."
                        />
                        <CoreWebVitalCard
                            metric="CLS (Cumulative Layout Shift)"
                            value={yourMetrics.cls}
                            compValue={compMetrics.cls}
                            unit=""
                            threshold={{ good: 0.1, ok: 0.25 }}
                            explanation="Does your page 'jump around' while loading? Shifting layouts frustrate users and hurt rankings."
                        />
                        <CoreWebVitalCard
                            metric="FCP (First Contentful Paint)"
                            value={yourMetrics.fcp}
                            compValue={compMetrics.fcp}
                            unit="s"
                            threshold={{ good: 1800, ok: 3000 }}
                            explanation="How quickly visitors see something on screen. Faster = better first impressions."
                        />
                    </div>
                </div>

                {/* ============================================ */}
                {/* SUBCATEGORY BREAKDOWN */}
                {/* ============================================ */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">10-Point Technical Analysis</h3>
                            <p className="text-sm text-slate-500">Detailed breakdown of each scoring factor</p>
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
                {/* QUICK WIN OPPORTUNITIES - Enhanced with Explanations */}
                {/* ============================================ */}
                {yourPerformance?.opportunities && yourPerformance.opportunities.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Quick Win Opportunities</h3>
                                <p className="text-sm text-slate-500">Actionable improvements with detailed guidance</p>
                            </div>
                            <span className="ml-auto px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
                                {yourPerformance.opportunities.length} FIXES
                            </span>
                        </div>

                        <div className="space-y-4">
                            {yourPerformance.opportunities.slice(0, 5).map((opp, i) => {
                                const explanation = QUICK_WIN_EXPLANATIONS[opp.title] || {
                                    explanation: 'This optimization can help improve your site performance.',
                                    impact: 'Implementing this fix can lead to faster load times and better user experience.',
                                    howToFix: 'Consult with your developer to implement this recommendation.',
                                };

                                return (
                                    <QuickWinCard
                                        key={i}
                                        index={i}
                                        title={opp.title}
                                        savings={opp.savings}
                                        explanation={explanation.explanation}
                                        impact={explanation.impact}
                                        howToFix={explanation.howToFix}
                                    />
                                );
                            })}
                        </div>

                        {/* Total Potential Savings */}
                        {(() => {
                            const totalSavings = yourPerformance.opportunities
                                .filter(o => o.savings && o.savings > 0)
                                .reduce((sum, o) => sum + (o.savings || 0), 0);

                            if (totalSavings > 0) {
                                return (
                                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-lg">Total Potential Time Savings</div>
                                                <div className="text-emerald-100 text-sm">By implementing all recommended fixes</div>
                                            </div>
                                            <div className="text-4xl font-black">
                                                {(totalSavings / 1000).toFixed(1)}s
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                )}
            </div>

            {/* Backlink Quality Panel (when available) */}
            {backlinkComparison && (
                <BacklinkQualityPanel
                    data={backlinkComparison}
                    yourDomain={yourDomain}
                    competitorDomain={competitorDomain}
                />
            )}

            {/* SERP Features Panel (when available) */}
            {serpComparison && (
                <SerpFeaturesPanel
                    data={serpComparison}
                    yourDomain={yourDomain}
                    competitorDomain={competitorDomain}
                />
            )}
        </div>
    );
}

// ============================================
// QUICK WIN CARD COMPONENT - Expandable with details
// ============================================
function QuickWinCard({ index, title, savings, explanation, impact, howToFix }: {
    index: number;
    title: string;
    savings?: number;
    explanation: string;
    impact: string;
    howToFix: string;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="rounded-xl bg-white border border-amber-200 overflow-hidden hover:shadow-md transition-all duration-300">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-amber-50/50 transition-colors"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/30 flex-shrink-0">
                    {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-slate-800 block">{title}</span>
                    <span className="text-xs text-slate-500 block mt-0.5 truncate">{explanation}</span>
                </div>
                {savings && savings > 0 && (
                    <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold flex-shrink-0">
                        Save {(savings / 1000).toFixed(1)}s
                    </div>
                )}
                <div className="flex-shrink-0 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-amber-100">
                    {/* What is this? */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mt-3">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Info className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">What is this?</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{explanation}</p>
                    </div>

                    {/* Why it matters */}
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center gap-2 mb-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Why it matters</span>
                        </div>
                        <p className="text-sm text-amber-800 leading-relaxed">{impact}</p>
                    </div>

                    {/* How to fix */}
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center gap-2 mb-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">How to fix</span>
                        </div>
                        <p className="text-sm text-emerald-800 leading-relaxed">{howToFix}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
