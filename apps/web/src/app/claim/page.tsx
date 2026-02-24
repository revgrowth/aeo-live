'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { ReportTeaser } from '@aeo-live/shared';
import Link from 'next/link';
import {
    ArrowRight, CheckCircle, AlertCircle, Shield, Sparkles,
    BarChart3, Trophy, TrendingDown, Brain, Zap,
} from 'lucide-react';

// =============================================================================
// TEASER PREVIEW COMPONENT
// =============================================================================

function TeaserPreview({ teaser }: { teaser: ReportTeaser }) {
    const scoreDiff = teaser.yourScore - teaser.competitorScore;
    const isWinning = scoreDiff > 0;

    const yourDomain = teaser.yourUrl
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
    const competitorDomain = teaser.competitorUrl
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');

    return (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Score Comparison Hero */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs mb-3">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Report Preview
                    </div>
                    <h3 className="text-lg font-bold">
                        {yourDomain} <span className="text-slate-500">vs</span> {competitorDomain}
                    </h3>
                </div>

                <div className="flex items-center justify-center gap-8 md:gap-12">
                    {/* Your Score */}
                    <div className="text-center">
                        <div className={`text-5xl font-black ${isWinning ? 'text-emerald-400' : 'text-sky-400'}`}>
                            {Math.round(teaser.yourScore)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{yourDomain}</div>
                    </div>

                    {/* VS Badge */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                            <span className="text-sm font-black text-slate-400">VS</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${isWinning
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                            {isWinning ? '+' : ''}{Math.round(scoreDiff)}
                        </div>
                    </div>

                    {/* Competitor Score */}
                    <div className="text-center">
                        <div className={`text-5xl font-black ${!isWinning ? 'text-rose-400' : 'text-slate-400'}`}>
                            {Math.round(teaser.competitorScore)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{competitorDomain}</div>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-sky-600" />
                        Category Breakdown
                    </h4>
                </div>
                <div className="divide-y divide-slate-100">
                    {teaser.categories.map((cat) => {
                        const diff = cat.yourScore - cat.competitorScore;
                        const catWinning = diff > 0;
                        return (
                            <div key={cat.name} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{cat.icon}</span>
                                    <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-sm font-bold ${catWinning ? 'text-emerald-600' : 'text-slate-600'}`}>
                                        {Math.round(cat.yourScore)}
                                    </span>
                                    <span className="text-xs text-slate-400">vs</span>
                                    <span className={`text-sm font-bold ${!catWinning ? 'text-rose-600' : 'text-slate-600'}`}>
                                        {Math.round(cat.competitorScore)}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${catWinning
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : diff < 0
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {catWinning ? '+' : ''}{Math.round(diff)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* AI Summary */}
            <div className="rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 p-5">
                <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">AI Summary</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{teaser.aiSummary}</p>
                    </div>
                </div>
            </div>

            {/* Blurred sections hint */}
            <div className="relative rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-6 blur-sm">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                    <div className="text-center">
                        <Shield className="w-8 h-8 text-sky-600 mx-auto mb-2" />
                        <p className="font-bold text-slate-900">Deep-dive insights, recommendations & roadmap</p>
                        <p className="text-sm text-slate-500">Create a free account to unlock the full report</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// CLAIM PAGE CONTENT
// =============================================================================

function ClaimPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [code, setCode] = useState(searchParams?.get('code') || '');
    const [isValidating, setIsValidating] = useState(false);
    const [isLoadingTeaser, setIsLoadingTeaser] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        domain: string | null;
        status?: string;
    } | null>(null);
    const [teaser, setTeaser] = useState<ReportTeaser | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleValidate = async () => {
        if (!code.trim()) return;

        setIsValidating(true);
        setError(null);
        setValidationResult(null);
        setTeaser(null);

        try {
            const response = await api.validateClaimCode(code.trim());

            if (response.success && response.data) {
                setValidationResult(response.data);

                if (response.data.valid) {
                    // Load teaser preview
                    setIsLoadingTeaser(true);
                    try {
                        const teaserResponse = await api.getClaimTeaser(code.trim());
                        if (teaserResponse.success && teaserResponse.data) {
                            setTeaser(teaserResponse.data);
                        }
                    } catch {
                        // Teaser is optional, don't block the flow
                    } finally {
                        setIsLoadingTeaser(false);
                    }
                } else {
                    setError(
                        response.data.status === 'REDEEMED'
                            ? 'This code has already been redeemed.'
                            : response.data.status === 'EXPIRED'
                                ? 'This code has expired.'
                                : 'Invalid claim code. Please check and try again.'
                    );
                }
            } else {
                setError(response.error?.message || 'Failed to validate code');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleContinueToRegister = () => {
        router.push(`/register?code=${encodeURIComponent(code.trim())}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 mb-6">
                        <span className="text-sky-600">AEO</span>.LIVE
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                        Claim Your Report
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Enter your claim code to preview and access your competitive intelligence report
                    </p>
                </div>

                {/* Input Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 md:p-8">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setError(null);
                                setValidationResult(null);
                                setTeaser(null);
                            }}
                            placeholder="Enter claim code (e.g., A7K3-XM92-PQ1R)"
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-lg font-mono tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                            maxLength={14}
                        />
                        <button
                            onClick={handleValidate}
                            disabled={isValidating || !code.trim()}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {isValidating ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Validate
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 animate-in fade-in duration-300">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* Success — Valid code */}
                    {validationResult?.valid && (
                        <div className="mt-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 animate-in fade-in duration-300">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">
                                Valid code for <strong>{validationResult.domain}</strong>
                            </span>
                        </div>
                    )}

                    {/* Loading teaser */}
                    {isLoadingTeaser && (
                        <div className="mt-6 text-center py-8">
                            <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-slate-500">Loading your report preview...</p>
                        </div>
                    )}
                </div>

                {/* Teaser Preview */}
                {teaser && <TeaserPreview teaser={teaser} />}

                {/* CTA Button */}
                {validationResult?.valid && !isLoadingTeaser && (
                    <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <button
                            onClick={handleContinueToRegister}
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-3 mx-auto"
                        >
                            Create Account to See Full Report
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <p className="mt-3 text-sm text-slate-500">
                            Free account — no credit card required
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// EXPORT
// =============================================================================

export default function ClaimPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
            </div>
        }>
            <ClaimPageContent />
        </Suspense>
    );
}
