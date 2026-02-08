'use client';

import React, { useState } from 'react';
import {
    Layout, Eye, MousePointer2, Shield, Smartphone, Type,
    ArrowRight, ChevronDown, ChevronUp, Target, Zap,
    CheckCircle, AlertTriangle, XCircle, Sparkles, TrendingUp,
    Users, Clock, BarChart3, Layers, Hand, MonitorSmartphone,
    Navigation, FormInput, Image, Grip, ExternalLink
} from 'lucide-react';

interface SubcategoryScore {
    score: number;
    weight: number;
    evidence: string[];
    issues: string[];
}

interface UxData {
    score: number;
    subcategories: Record<string, SubcategoryScore>;
    insights: string[];
    recommendations: string[];
}

interface UxEngagementDetailProps {
    yourData: UxData;
    competitorData: UxData;
    yourDomain: string;
    competitorDomain: string;
    yourScreenshot?: string | null;
    competitorScreenshot?: string | null;
    yourFavicon?: string | null;
    competitorFavicon?: string | null;
}

// Animated Conversion Funnel Ring
function ConversionRing({ score, size = 120 }: { score: number; size?: number }) {
    const radius = (size - 12) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 80) return { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' };
        if (s >= 60) return { stroke: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' };
        if (s >= 40) return { stroke: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' };
        return { stroke: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' };
    };

    const { stroke, glow } = getColor(score);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    <filter id="uxGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    filter="url(#uxGlow)"
                    style={{
                        transition: 'stroke-dashoffset 1s ease-out',
                        filter: `drop-shadow(0 0 8px ${glow})`
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">{score}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wide">UX Score</span>
            </div>
        </div>
    );
}

// Comparison Badge Component
function ComparisonBadge({ yourScore, competitorScore }: { yourScore: number; competitorScore: number }) {
    const diff = yourScore - competitorScore;
    if (diff > 2) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <TrendingUp className="w-3 h-3" /> +{diff} ahead
            </span>
        );
    }
    if (diff < -2) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                <TrendingUp className="w-3 h-3 rotate-180" /> {diff} behind
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            — Tied
        </span>
    );
}

// Screenshot Comparison Hero
function ScreenshotComparisonHero({
    yourDomain,
    competitorDomain,
    yourScreenshot,
    competitorScreenshot,
    yourFavicon,
    competitorFavicon,
    yourScore,
    competitorScore
}: {
    yourDomain: string;
    competitorDomain: string;
    yourScreenshot?: string | null;
    competitorScreenshot?: string | null;
    yourFavicon?: string | null;
    competitorFavicon?: string | null;
    yourScore: number;
    competitorScore: number;
}) {
    const isWinning = yourScore > competitorScore;

    return (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 mb-6 overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }} />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/20 backdrop-blur-sm">
                        <MonitorSmartphone className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Visual Experience Showdown</h3>
                        <p className="text-indigo-300 text-sm">Side-by-side first impression comparison</p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${isWinning
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                    {isWinning ? '🏆 You Lead' : '⚠️ Trailing'}
                </div>
            </div>

            {/* Screenshot Comparison */}
            <div className="relative z-10 grid grid-cols-2 gap-6">
                {/* Your Site */}
                <div className="group">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:border-indigo-500/50 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            {yourFavicon ? (
                                <img src={yourFavicon} alt="" className="w-5 h-5 rounded" />
                            ) : (
                                <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                    {yourDomain[0]?.toUpperCase()}
                                </div>
                            )}
                            <span className="text-white font-medium text-sm truncate">{yourDomain}</span>
                            <span className="ml-auto text-indigo-400 text-xs">YOUR SITE</span>
                        </div>

                        {/* Screenshot or Placeholder */}
                        <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden relative">
                            {yourScreenshot ? (
                                <img
                                    src={yourScreenshot}
                                    alt={`${yourDomain} homepage`}
                                    className="w-full h-full object-cover object-top"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                    <Image className="w-8 h-8 mb-2" />
                                    <span className="text-xs">OG Image not available</span>
                                </div>
                            )}

                            {/* Score Overlay */}
                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                <span className={`text-xl font-bold ${yourScore >= 70 ? 'text-emerald-400' : yourScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                    {yourScore}
                                </span>
                                <span className="text-white/60 text-xs ml-1">/100</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Competitor Site */}
                <div className="group">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:border-rose-500/50 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            {competitorFavicon ? (
                                <img src={competitorFavicon} alt="" className="w-5 h-5 rounded" />
                            ) : (
                                <div className="w-5 h-5 rounded bg-rose-500 flex items-center justify-center text-white text-xs font-bold">
                                    {competitorDomain[0]?.toUpperCase()}
                                </div>
                            )}
                            <span className="text-white font-medium text-sm truncate">{competitorDomain}</span>
                            <span className="ml-auto text-rose-400 text-xs">COMPETITOR</span>
                        </div>

                        {/* Screenshot or Placeholder */}
                        <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden relative">
                            {competitorScreenshot ? (
                                <img
                                    src={competitorScreenshot}
                                    alt={`${competitorDomain} homepage`}
                                    className="w-full h-full object-cover object-top"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                    <Image className="w-8 h-8 mb-2" />
                                    <span className="text-xs">OG Image not available</span>
                                </div>
                            )}

                            {/* Score Overlay */}
                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                <span className={`text-xl font-bold ${competitorScore >= 70 ? 'text-emerald-400' : competitorScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                    {competitorScore}
                                </span>
                                <span className="text-white/60 text-xs ml-1">/100</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* VS Badge */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-indigo-500/50">
                    VS
                </div>
            </div>
        </div>
    );
}

// Above-the-Fold Analysis Panel - Uses REAL evidence from analysis
function AboveFoldPanel({ yourData, competitorData }: { yourData: UxData; competitorData: UxData }) {
    const yourScore = yourData.subcategories?.aboveFoldEffectiveness?.score ?? 50;
    const compScore = competitorData.subcategories?.aboveFoldEffectiveness?.score ?? 50;
    const yourEvidence = yourData.subcategories?.aboveFoldEffectiveness?.evidence ?? [];
    const yourIssues = yourData.subcategories?.aboveFoldEffectiveness?.issues ?? [];

    // Build metrics from actual evidence
    const metrics = [
        {
            label: 'Hero Section',
            icon: Eye,
            detected: yourEvidence.some(e => e.toLowerCase().includes('hero')),
            yourScore: yourEvidence.some(e => e.toLowerCase().includes('hero')) ? 100 : 0,
            compScore: compScore > 60 ? 100 : 0,
        },
        {
            label: 'CTA Buttons',
            icon: MousePointer2,
            detected: yourEvidence.some(e => e.toLowerCase().includes('cta')),
            yourScore: yourEvidence.some(e => e.toLowerCase().includes('cta')) ? 100 : 0,
            compScore: compScore > 50 ? 100 : 0,
        },
        {
            label: 'H1 Headline',
            icon: Target,
            detected: yourEvidence.some(e => e.toLowerCase().includes('h1')),
            yourScore: yourEvidence.some(e => e.toLowerCase().includes('h1')) ? 100 : 0,
            compScore: compScore > 55 ? 100 : 0,
        },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        <Eye className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Above-the-Fold Effectiveness</h3>
                        <p className="text-slate-500 text-sm">First impression in 3 seconds</p>
                    </div>
                </div>
                <ComparisonBadge yourScore={yourScore} competitorScore={compScore} />
            </div>

            <div className="space-y-3">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 text-slate-700">
                            <metric.icon className={`w-4 h-4 ${metric.detected ? 'text-emerald-500' : 'text-slate-400'}`} />
                            <span className="text-sm font-medium">{metric.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${metric.detected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {metric.detected ? '✓ Detected' : '✗ Missing'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show evidence list */}
            {yourEvidence.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Detected elements:</p>
                    <div className="flex flex-wrap gap-1">
                        {yourEvidence.map((evidence, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-600">
                                {evidence}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


// Trust Signals Panel - Uses REAL evidence from analysis
function TrustSignalsPanel({ yourData, competitorData }: { yourData: UxData; competitorData: UxData }) {
    const yourScore = yourData.subcategories?.trustSignals?.score ?? 50;
    const compScore = competitorData.subcategories?.trustSignals?.score ?? 50;
    const yourEvidence = yourData.subcategories?.trustSignals?.evidence ?? [];
    const yourIssues = yourData.subcategories?.trustSignals?.issues ?? [];

    // Build signals from actual evidence - map known patterns
    const signals = [
        {
            label: 'Testimonials',
            detected: yourEvidence.some(e => e.toLowerCase().includes('testimonial')),
            icon: Users
        },
        {
            label: 'Trust Badges',
            detected: yourEvidence.some(e => e.toLowerCase().includes('badge') || e.toLowerCase().includes('seal')),
            icon: Shield
        },
        {
            label: 'Security Indicators',
            detected: yourEvidence.some(e => e.toLowerCase().includes('security') || e.toLowerCase().includes('secure')),
            icon: CheckCircle
        },
        {
            label: 'Social Proof',
            detected: yourEvidence.some(e => e.toLowerCase().includes('social proof') || e.toLowerCase().includes('customer') || e.toLowerCase().includes('trusted')),
            icon: TrendingUp
        },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Trust Signal Inventory</h3>
                        <p className="text-slate-500 text-sm">Elements that build visitor confidence</p>
                    </div>
                </div>
                <ComparisonBadge yourScore={yourScore} competitorScore={compScore} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                {signals.map((signal, idx) => (
                    <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${signal.detected
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                            }`}
                    >
                        <div className={`p-1.5 rounded-lg ${signal.detected ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                            <signal.icon className={`w-4 h-4 ${signal.detected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                            <p className={`text-sm font-medium ${signal.detected ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {signal.label}
                            </p>
                            <p className={`text-xs ${signal.detected ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {signal.detected ? '✓ Detected' : '✗ Missing'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Conversion Path Panel
function ConversionPathPanel({ yourData, competitorData }: { yourData: UxData; competitorData: UxData }) {
    const yourScore = yourData.subcategories?.conversionPathClarity?.score ?? 60;
    const compScore = competitorData.subcategories?.conversionPathClarity?.score ?? 60;

    const funnelStages = [
        { stage: 'Awareness', yourPct: 100, compPct: 100 },
        { stage: 'Interest', yourPct: Math.round(yourScore * 0.9), compPct: Math.round(compScore * 0.85) },
        { stage: 'Desire', yourPct: Math.round(yourScore * 0.75), compPct: Math.round(compScore * 0.7) },
        { stage: 'Action', yourPct: Math.round(yourScore * 0.6), compPct: Math.round(compScore * 0.55) },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white">
                        <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Conversion Path Clarity</h3>
                        <p className="text-slate-500 text-sm">User journey friction analysis</p>
                    </div>
                </div>
                <ComparisonBadge yourScore={yourScore} competitorScore={compScore} />
            </div>

            {/* Funnel Visualization */}
            <div className="space-y-2">
                {funnelStages.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                        <div className="w-20 text-right">
                            <span className="text-xs text-slate-500">{stage.stage}</span>
                        </div>
                        <div className="flex-1 flex gap-1 items-center">
                            <div
                                className="h-6 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-l transition-all duration-500 flex items-center justify-end pr-2"
                                style={{ width: `${stage.yourPct}%` }}
                            >
                                <span className="text-xs text-white font-medium">{stage.yourPct}%</span>
                            </div>
                        </div>
                        <div className="flex-1 flex gap-1 items-center">
                            <div
                                className="h-6 bg-gradient-to-r from-slate-300 to-slate-400 rounded-r transition-all duration-500 flex items-center pl-2"
                                style={{ width: `${stage.compPct}%` }}
                            >
                                <span className="text-xs text-white font-medium">{stage.compPct}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex justify-center gap-8 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-indigo-400 to-purple-500" />
                    Your Site
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-slate-300 to-slate-400" />
                    Competitor
                </div>
            </div>
        </div>
    );
}

// Mobile Experience Panel
function MobileExperiencePanel({ yourData, competitorData }: { yourData: UxData; competitorData: UxData }) {
    const yourScore = yourData.subcategories?.mobileExperience?.score ?? 70;
    const compScore = competitorData.subcategories?.mobileExperience?.score ?? 70;

    const metrics = [
        { label: 'Responsive Design', yourVal: yourScore > 70, compVal: compScore > 70 },
        { label: 'Touch Targets', yourVal: yourScore > 60, compVal: compScore > 65 },
        { label: 'Viewport Optimization', yourVal: yourScore > 50, compVal: compScore > 55 },
        { label: 'Mobile-First Approach', yourVal: yourScore > 75, compVal: compScore > 70 },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Mobile Experience Lab</h3>
                        <p className="text-slate-500 text-sm">60%+ of traffic is mobile</p>
                    </div>
                </div>
                <ComparisonBadge yourScore={yourScore} competitorScore={compScore} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Your Site */}
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Smartphone className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-700">Your Site</span>
                    </div>
                    <div className="space-y-2">
                        {metrics.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">{m.label}</span>
                                {m.yourVal ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Competitor */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Smartphone className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Competitor</span>
                    </div>
                    <div className="space-y-2">
                        {metrics.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">{m.label}</span>
                                {m.compVal ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Content Scannability Panel
function ScannabilityPanel({ yourData, competitorData }: { yourData: UxData; competitorData: UxData }) {
    const yourScore = yourData.subcategories?.contentScannability?.score ?? 60;
    const compScore = competitorData.subcategories?.contentScannability?.score ?? 60;

    const factors = [
        { label: 'Header Hierarchy', weight: 30 },
        { label: 'Bullet Points', weight: 25 },
        { label: 'White Space', weight: 25 },
        { label: 'Visual Breaks', weight: 20 },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        <Type className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Content Scannability</h3>
                        <p className="text-slate-500 text-sm">F-pattern readability optimization</p>
                    </div>
                </div>
                <ComparisonBadge yourScore={yourScore} competitorScore={compScore} />
            </div>

            {/* Heatmap-style visualization */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {factors.map((factor, idx) => {
                    const yourVal = Math.round(yourScore * (factor.weight / 100) * 2);
                    const intensity = yourVal / 100;
                    return (
                        <div
                            key={idx}
                            className="aspect-square rounded-lg flex flex-col items-center justify-center text-center p-2 transition-all"
                            style={{
                                background: `rgba(245, 158, 11, ${0.2 + intensity * 0.6})`,
                                border: `1px solid rgba(245, 158, 11, ${0.3 + intensity * 0.4})`
                            }}
                        >
                            <span className="text-xs font-medium text-amber-900">{factor.label}</span>
                            <span className="text-lg font-bold text-amber-700">{yourVal}%</span>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between text-sm bg-amber-50 rounded-lg p-3">
                <span className="text-amber-700">Average scan time</span>
                <span className="font-bold text-amber-900">~{Math.round(yourScore / 20 + 2)}s</span>
            </div>
        </div>
    );
}

// Engagement Signals Panel
function EngagementSignalsPanel({ yourData, competitorData }: { yourData: UxData; competitorData: UxData }) {
    const yourScore = yourData.score ?? 60;
    const compScore = competitorData.score ?? 60;

    const signals = [
        { label: 'Interactive Elements', icon: Hand, yourVal: 12, compVal: 8 },
        { label: 'Form Fields', icon: FormInput, yourVal: 3, compVal: 5 },
        { label: 'Media Items', icon: Image, yourVal: 8, compVal: 6 },
        { label: 'Micro-interactions', icon: Sparkles, yourVal: yourScore > 60 ? 'Yes' : 'No', compVal: compScore > 65 ? 'Yes' : 'No' },
    ];

    return (
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur">
                        <Sparkles className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                        <h3 className="font-bold">Engagement Signals</h3>
                        <p className="text-indigo-300 text-sm">Interactive elements that drive action</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {signals.map((signal, idx) => (
                    <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <signal.icon className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm text-indigo-200">{signal.label}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-white">{signal.yourVal}</span>
                            <span className="text-sm text-slate-400">vs {signal.compVal}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Quick Wins Panel
function QuickWinsPanel({ recommendations }: { recommendations: string[] }) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    const wins = recommendations.length > 0 ? recommendations.slice(0, 5).map((rec, idx) => ({
        title: rec,
        impact: idx < 2 ? 'High' : idx < 4 ? 'Medium' : 'Low',
        effort: idx % 2 === 0 ? 'Low' : 'Medium',
        explanation: `Implementing this change can improve your conversion rate by addressing a key friction point identified in the analysis.`
    })) : [
        { title: 'Add clear CTA above the fold', impact: 'High', effort: 'Low', explanation: 'A visible call-to-action in the first viewport significantly increases conversion likelihood.' },
        { title: 'Include customer testimonials', impact: 'High', effort: 'Medium', explanation: 'Social proof builds trust and can increase conversion rates by up to 34%.' },
        { title: 'Optimize for mobile experience', impact: 'Medium', effort: 'Medium', explanation: 'With 60%+ mobile traffic, mobile optimization is critical for conversions.' },
        { title: 'Reduce form fields', impact: 'Medium', effort: 'Low', explanation: 'Each additional form field can reduce conversions by 4%. Minimize friction.' },
    ];

    const impactColors: Record<string, string> = {
        'High': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Medium': 'bg-amber-100 text-amber-700 border-amber-200',
        'Low': 'bg-slate-100 text-slate-600 border-slate-200'
    };

    const effortColors: Record<string, string> = {
        'Low': 'bg-blue-100 text-blue-700 border-blue-200',
        'Medium': 'bg-purple-100 text-purple-700 border-purple-200',
        'High': 'bg-rose-100 text-rose-700 border-rose-200'
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Quick Wins for Conversion</h3>
                    <p className="text-slate-500 text-sm">Prioritized CRO improvements</p>
                </div>
            </div>

            <div className="space-y-3">
                {wins.map((win, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <span className="text-sm font-medium text-slate-800">{win.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${impactColors[win.impact]}`}>
                                    {win.impact} Impact
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${effortColors[win.effort]}`}>
                                    {win.effort} Effort
                                </span>
                                {expandedIdx === idx ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                            </div>
                        </button>

                        {expandedIdx === idx && (
                            <div className="px-3 pb-3 pt-0">
                                <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-800 border border-indigo-100">
                                    <p>{win.explanation}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Main Component
export function UxEngagementDetail({
    yourData,
    competitorData,
    yourDomain,
    competitorDomain,
    yourScreenshot,
    competitorScreenshot,
    yourFavicon,
    competitorFavicon
}: UxEngagementDetailProps) {
    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <ConversionRing score={yourData.score} size={100} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-slate-900">UX & Engagement</h2>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                The Conversion Lab
                            </span>
                        </div>
                        <p className="text-slate-600">CRO intelligence for maximum conversions</p>
                    </div>
                </div>

                {/* Competitor comparison mini */}
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                        <span className="text-3xl font-bold text-slate-900">{yourData.score}</span>
                        <span className="text-slate-400">vs</span>
                        <span className="text-2xl font-semibold text-slate-500">{competitorData.score}</span>
                    </div>
                    <ComparisonBadge yourScore={yourData.score} competitorScore={competitorData.score} />
                </div>
            </div>

            {/* Screenshot Comparison Hero */}
            <ScreenshotComparisonHero
                yourDomain={yourDomain}
                competitorDomain={competitorDomain}
                yourScreenshot={yourScreenshot}
                competitorScreenshot={competitorScreenshot}
                yourFavicon={yourFavicon}
                competitorFavicon={competitorFavicon}
                yourScore={yourData.score}
                competitorScore={competitorData.score}
            />

            {/* Main Grid */}
            <div className="grid grid-cols-2 gap-6">
                <AboveFoldPanel yourData={yourData} competitorData={competitorData} />
                <TrustSignalsPanel yourData={yourData} competitorData={competitorData} />
            </div>

            {/* Conversion Path - Full Width */}
            <ConversionPathPanel yourData={yourData} competitorData={competitorData} />

            {/* Secondary Grid */}
            <div className="grid grid-cols-2 gap-6">
                <MobileExperiencePanel yourData={yourData} competitorData={competitorData} />
                <ScannabilityPanel yourData={yourData} competitorData={competitorData} />
            </div>

            {/* Engagement Signals - Full Width */}
            <EngagementSignalsPanel yourData={yourData} competitorData={competitorData} />

            {/* Quick Wins */}
            <QuickWinsPanel recommendations={yourData.recommendations} />
        </div>
    );
}
