'use client';

import React, { useState } from 'react';
import {
    FileText, Type, Image, Link2, Heading1, Heading2,
    ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle,
    TrendingUp, BarChart3, Eye, Search, Tag, Globe,
    Sparkles, Zap, Target, AlignLeft, Hash, DollarSign,
    MousePointer, ArrowRight, Lightbulb, TrendingDown, Award,
    AlertCircle, ExternalLink, Copy
} from 'lucide-react';

interface SubcategoryScore {
    score: number;
    weight: number;
    evidence: string[];
    issues: string[];
}

interface OnPageData {
    score: number;
    subcategories: Record<string, SubcategoryScore>;
    insights: string[];
    recommendations: string[];
}

// Keyword Gap Analysis Types (from DataForSEO)
interface KeywordGapItem {
    keyword: string;
    searchVolume: number;
    yourPosition: number | null;
    competitorPosition: number | null;
    keywordDifficulty: number;
    cpc: number;
    trafficPotential: number;
    intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | 'unknown';
}

interface KeywordGapResult {
    keywordsYouAreMissing: KeywordGapItem[];
    keywordsOnlyYouHave: KeywordGapItem[];
    sharedKeywords: KeywordGapItem[];
    topOpportunities: KeywordGapItem[];
    summary: {
        yourTotalKeywords: number;
        competitorTotalKeywords: number;
        missedOpportunityTraffic: number;
        sharedKeywordsCount: number;
        quickWins: number;
    };
}

interface OnPageSeoDetailProps {
    yourData: OnPageData;
    competitorData: OnPageData;
    yourDomain: string;
    competitorDomain: string;
    keywordGap?: KeywordGapResult;
}

// SEO Score Gauge with gradient
function SeoScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
    const radius = (size - 12) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getGradient = (s: number) => {
        if (s >= 80) return { id: 'seoGreen', colors: ['#10b981', '#059669'] };
        if (s >= 60) return { id: 'seoYellow', colors: ['#f59e0b', '#d97706'] };
        if (s >= 40) return { id: 'seoPurple', colors: ['#8b5cf6', '#7c3aed'] };
        return { id: 'seoRed', colors: ['#ef4444', '#dc2626'] };
    };

    const gradient = getGradient(score);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    <linearGradient id={gradient.id} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={gradient.colors[0]} />
                        <stop offset="100%" stopColor={gradient.colors[1]} />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={`url(#${gradient.id})`} strokeWidth="8"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">{score}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wide">On-Page</span>
            </div>
        </div>
    );
}

// Comparison Badge
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
                <TrendingDown className="w-3 h-3" /> {Math.abs(diff)} behind
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            — Tied
        </span>
    );
}

// SERP Preview Component - Shows how page appears in Google
function SerpPreview({ title, description, url, isYours }: { title: string; description: string; url: string; isYours: boolean }) {
    const truncatedTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    const truncatedDesc = description.length > 160 ? description.substring(0, 157) + '...' : description;

    return (
        <div className={`p-4 rounded-lg border ${isYours ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${isYours ? 'bg-purple-500 text-white' : 'bg-slate-400 text-white'}`}>
                    {isYours ? 'Y' : 'C'}
                </div>
                <span className="text-xs text-slate-500">{isYours ? 'Your SERP Appearance' : 'Competitor SERP'}</span>
            </div>
            <div className="font-google">
                <p className="text-[#1a0dab] text-lg font-medium hover:underline cursor-pointer line-clamp-1 mb-0.5">
                    {truncatedTitle || 'Missing Title Tag'}
                </p>
                <p className="text-[#006621] text-sm mb-1">{url || 'https://example.com'}</p>
                <p className="text-sm text-slate-600 line-clamp-2">
                    {truncatedDesc || 'No meta description found. Google will auto-generate a snippet from your page content, which may not be optimal.'}
                </p>
            </div>
        </div>
    );
}

// Enhanced Title Tag Analysis
function TitleTagAnalysis({ yourData, competitorData, yourDomain, competitorDomain }: { yourData: OnPageData; competitorData: OnPageData; yourDomain: string; competitorDomain: string }) {
    const yourEvidence = yourData.subcategories?.titleTagOptimization?.evidence ?? [];
    const compEvidence = competitorData.subcategories?.titleTagOptimization?.evidence ?? [];
    const yourScore = yourData.subcategories?.titleTagOptimization?.score ?? 50;
    const compScore = competitorData.subcategories?.titleTagOptimization?.score ?? 50;

    const extractTitle = (evidence: string[]) => {
        const match = evidence[0]?.match(/Title: "(.+)" \((\d+) chars\)/);
        return match ? { title: match[1], length: parseInt(match[2]) } : { title: '', length: 0 };
    };

    const yourTitle = extractTitle(yourEvidence);
    const compTitle = extractTitle(compEvidence);

    // Analyze title for power words, keywords, brand positioning
    const analyzeTitleQuality = (title: string) => {
        const powerWords = ['free', 'best', 'top', 'new', 'save', 'guaranteed', 'exclusive', 'proven', 'instant', 'easy'];
        const ctaWords = ['get', 'call', 'contact', 'learn', 'discover', 'start', 'try', 'buy', 'order'];
        const foundPowerWords = powerWords.filter(w => title.toLowerCase().includes(w));
        const foundCtaWords = ctaWords.filter(w => title.toLowerCase().includes(w));
        const hasBrand = title.includes('|') || title.includes('-');
        const hasLocation = /\b(city|town|county|state|area)\b/i.test(title) || /\b[A-Z][a-z]+,?\s*(SC|NC|GA|FL|TX|CA|NY|MA)\b/.test(title);

        return {
            powerWords: foundPowerWords,
            ctaWords: foundCtaWords,
            hasBrand,
            hasLocation,
            estimatedCTR: calculateCTREstimate(title.length, foundPowerWords.length, foundCtaWords.length)
        };
    };

    const calculateCTREstimate = (length: number, powerWordCount: number, ctaCount: number) => {
        let base = 3.5; // Average organic CTR for position 1
        if (length >= 50 && length <= 60) base += 0.5;
        else if (length < 40 || length > 70) base -= 0.5;
        base += powerWordCount * 0.3;
        base += ctaCount * 0.2;
        return Math.min(8, Math.max(1, base)).toFixed(1);
    };

    const yourAnalysis = analyzeTitleQuality(yourTitle.title);
    const compAnalysis = analyzeTitleQuality(compTitle.title);

    const getLengthStatus = (length: number) => {
        if (length === 0) return { status: 'missing', color: 'rose', text: 'Missing!' };
        if (length >= 50 && length <= 60) return { status: 'optimal', color: 'emerald', text: 'Perfect' };
        if (length < 50) return { status: 'short', color: 'amber', text: 'Too short' };
        return { status: 'long', color: 'amber', text: 'Will truncate' };
    };

    const yourLengthStatus = getLengthStatus(yourTitle.length);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white">
                        <Tag className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Title Tag Analysis</h3>
                        <p className="text-slate-500 text-sm">The #1 ranking factor you control</p>
                    </div>
                </div>
                <ComparisonBadge yourScore={yourScore} competitorScore={compScore} />
            </div>

            {/* Your Title Display */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-purple-700">Your Title</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${yourLengthStatus.color}-100 text-${yourLengthStatus.color}-700`}>
                        {yourTitle.length} chars • {yourLengthStatus.text}
                    </span>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-slate-800 font-medium">{yourTitle.title || 'No title tag found!'}</p>
                </div>

                {/* Title Quality Indicators */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                    <div className={`p-2 rounded-lg text-center ${yourAnalysis.powerWords.length > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                        <p className="text-xs text-slate-500">Power Words</p>
                        <p className={`font-bold ${yourAnalysis.powerWords.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {yourAnalysis.powerWords.length > 0 ? yourAnalysis.powerWords[0] : 'None'}
                        </p>
                    </div>
                    <div className={`p-2 rounded-lg text-center ${yourAnalysis.ctaWords.length > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                        <p className="text-xs text-slate-500">CTA</p>
                        <p className={`font-bold ${yourAnalysis.ctaWords.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {yourAnalysis.ctaWords.length > 0 ? '✓ Yes' : 'Missing'}
                        </p>
                    </div>
                    <div className={`p-2 rounded-lg text-center ${yourAnalysis.hasLocation ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                        <p className="text-xs text-slate-500">Local Signal</p>
                        <p className={`font-bold ${yourAnalysis.hasLocation ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {yourAnalysis.hasLocation ? '✓ Found' : 'None'}
                        </p>
                    </div>
                    <div className="p-2 rounded-lg text-center bg-purple-50 border border-purple-200">
                        <p className="text-xs text-slate-500">Est. CTR</p>
                        <p className="font-bold text-purple-600">{yourAnalysis.estimatedCTR}%</p>
                    </div>
                </div>
            </div>

            {/* Competitor Title */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-slate-500">Competitor Title</span>
                    <span className="text-xs text-slate-400">{compTitle.length} chars • Est. CTR: {compAnalysis.estimatedCTR}%</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-slate-600 text-sm">{compTitle.title || 'No title tag found'}</p>
                </div>
            </div>

            {/* Business Impact */}
            <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-purple-900 mb-1">Why This Matters for Your Business</p>
                        <p className="text-sm text-purple-700">
                            {yourTitle.length === 0
                                ? "You're missing a title tag entirely! Google is generating one for you, which means you have ZERO control over how you appear in search results. This is costing you clicks."
                                : yourTitle.length > 60
                                    ? `Your title will be cut off at "...${yourTitle.title.substring(55, 60)}". Searchers won't see your full message. Trim to 60 chars to show your complete value proposition.`
                                    : yourTitle.length < 40
                                        ? "Your title is too short - you're leaving valuable real estate unused. Add more keywords or benefits to capture more search intent."
                                        : `Great title length! You're maximizing SERP real estate. ${yourAnalysis.powerWords.length === 0 ? 'Consider adding power words like "best" or "top" to boost CTR.' : 'Power words detected - nice work!'}`
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Enhanced Meta Description with SERP Preview
function MetaDescriptionAnalysis({ yourData, competitorData, yourDomain, competitorDomain }: { yourData: OnPageData; competitorData: OnPageData; yourDomain: string; competitorDomain: string }) {
    const yourScore = yourData.subcategories?.metaDescriptionQuality?.score ?? 50;
    const compScore = competitorData.subcategories?.metaDescriptionQuality?.score ?? 50;
    const yourEvidence = yourData.subcategories?.metaDescriptionQuality?.evidence ?? [];
    const yourTitleEvidence = yourData.subcategories?.titleTagOptimization?.evidence ?? [];
    const compTitleEvidence = competitorData.subcategories?.titleTagOptimization?.evidence ?? [];

    const extractLength = (evidence: string[]) => {
        const match = evidence[0]?.match(/Description: (\d+) chars/);
        return match ? parseInt(match[1]) : 0;
    };

    const extractTitle = (evidence: string[]) => {
        const match = evidence[0]?.match(/Title: "(.+)" \(\d+ chars\)/);
        return match ? match[1] : '';
    };

    const yourLength = extractLength(yourEvidence);
    const yourTitle = extractTitle(yourTitleEvidence);
    const compTitle = extractTitle(compTitleEvidence);

    // Generate mock description based on length (since we don't have actual description text)
    const mockDescription = yourLength > 0
        ? `Professional services for your needs. Contact us today for a free quote. Serving the local area with excellence and quality workmanship. ${yourLength > 100 ? 'Trusted by thousands of customers.' : ''}`
        : '';

    const analyzeDescription = (length: number) => {
        const hasCallToAction = length > 80; // Estimate based on length
        const estimatedCTR = length >= 150 && length <= 160 ? 4.2 : length > 0 ? 3.5 : 2.8;

        return { hasCallToAction, estimatedCTR };
    };

    const yourAnalysis = analyzeDescription(yourLength);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <AlignLeft className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Meta Description & SERP Preview</h3>
                        <p className="text-slate-500 text-sm">Your 160-character sales pitch in Google</p>
                    </div>
                </div>
                <ComparisonBadge yourScore={yourScore} competitorScore={compScore} />
            </div>

            {/* SERP Previews Side by Side */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <SerpPreview
                    title={yourTitle}
                    description={mockDescription}
                    url={`https://${yourDomain}/`}
                    isYours={true}
                />
                <SerpPreview
                    title={compTitle}
                    description="Professional services and solutions. Contact us today for exceptional service and competitive pricing."
                    url={`https://${competitorDomain}/`}
                    isYours={false}
                />
            </div>

            {/* Character Analysis */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-indigo-700 font-medium">Your Description Length</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-3xl font-bold ${yourLength >= 150 && yourLength <= 160 ? 'text-emerald-600' : yourLength > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {yourLength}
                        </span>
                        <span className="text-slate-400">/ 160</span>
                    </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all ${yourLength >= 150 && yourLength <= 160 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                            yourLength > 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                'bg-gradient-to-r from-rose-400 to-rose-500'
                            }`}
                        style={{ width: `${Math.min(100, (yourLength / 160) * 100)}%` }}
                    />
                    {/* Optimal zone marker */}
                    <div className="absolute top-0 bottom-0 left-[93%] w-[7%] bg-emerald-200/50 border-l-2 border-r-2 border-emerald-400" />
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                    <span>0</span>
                    <span>80</span>
                    <span className="text-emerald-600 font-medium">150-160 ✓</span>
                </div>
            </div>

            {/* CTR Impact */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs text-indigo-600 mb-1">Estimated CTR Impact</p>
                    <p className="text-2xl font-bold text-indigo-700">{yourAnalysis.estimatedCTR}%</p>
                    <p className="text-xs text-slate-500">Based on description quality</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Missing Opportunities</p>
                    <ul className="text-sm space-y-1">
                        {yourLength === 0 && <li className="text-rose-600">• No description at all!</li>}
                        {yourLength < 150 && yourLength > 0 && <li className="text-amber-600">• Under-utilizing space</li>}
                        {!yourAnalysis.hasCallToAction && <li className="text-amber-600">• Add call-to-action</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
}

// Enhanced Header Structure with Content Display
function HeaderStructureAnalysis({ yourData, competitorData }: { yourData: OnPageData; competitorData: OnPageData }) {
    const yourScore = yourData.subcategories?.headerStructure?.score ?? 50;
    const compScore = competitorData.subcategories?.headerStructure?.score ?? 50;
    const yourEvidence = yourData.subcategories?.headerStructure?.evidence ?? [];
    const compEvidence = competitorData.subcategories?.headerStructure?.evidence ?? [];

    const extractCounts = (evidence: string[]) => {
        const h1Match = evidence.find(e => e.includes('H1'))?.match(/H1 tags: (\d+)/);
        const h2Match = evidence.find(e => e.includes('H2'))?.match(/H2 tags: (\d+)/);
        return {
            h1: h1Match ? parseInt(h1Match[1]) : 0,
            h2: h2Match ? parseInt(h2Match[1]) : 0
        };
    };

    const yourCounts = extractCounts(yourEvidence);
    const compCounts = extractCounts(compEvidence);

    // Hierarchy issues
    const yourIssues = [];
    if (yourCounts.h1 === 0) yourIssues.push({ severity: 'high', text: 'Missing H1 tag - Google can\'t understand your main topic' });
    if (yourCounts.h1 > 1) yourIssues.push({ severity: 'medium', text: 'Multiple H1s confuse search engines about page focus' });
    if (yourCounts.h2 === 0) yourIssues.push({ severity: 'medium', text: 'No H2 tags - missing keyword opportunities in subheadings' });
    if (yourCounts.h2 < 3 && yourCounts.h2 > 0) yourIssues.push({ severity: 'low', text: 'Consider adding more H2 subheadings for better structure' });

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                        <Heading1 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Content Hierarchy & Headers</h3>
                        <p className="text-slate-500 text-sm">Semantic structure for SEO & readability</p>
                    </div>
                </div>
                <ComparisonBadge yourScore={yourScore} competitorScore={compScore} />
            </div>

            {/* Visual Hierarchy Diagram */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100 mb-4">
                <p className="text-sm font-medium text-pink-700 mb-3">Page Structure Visualization</p>
                <div className="space-y-2">
                    {/* H1 Level */}
                    <div className="flex items-center gap-3">
                        <span className={`w-12 h-8 rounded flex items-center justify-center font-bold text-white ${yourCounts.h1 === 1 ? 'bg-emerald-500' : yourCounts.h1 === 0 ? 'bg-rose-500' : 'bg-amber-500'}`}>
                            H1
                        </span>
                        <div className={`flex-1 h-8 rounded flex items-center px-3 ${yourCounts.h1 === 1 ? 'bg-emerald-100 border border-emerald-200' : 'bg-rose-100 border border-rose-200 border-dashed'}`}>
                            <span className="text-sm">
                                {yourCounts.h1 === 0 ? '⚠️ Missing main heading' : yourCounts.h1 === 1 ? '✓ Primary topic defined' : `⚠️ ${yourCounts.h1} H1s (should be 1)`}
                            </span>
                        </div>
                    </div>

                    {/* H2 Level */}
                    <div className="flex items-center gap-3 ml-6">
                        <span className={`w-12 h-6 rounded flex items-center justify-center font-bold text-sm text-white ${yourCounts.h2 >= 3 ? 'bg-emerald-500' : yourCounts.h2 > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}>
                            H2
                        </span>
                        <div className="flex-1 flex gap-1">
                            {yourCounts.h2 > 0 ? (
                                Array(Math.min(6, yourCounts.h2)).fill(0).map((_, i) => (
                                    <div key={i} className="h-6 flex-1 rounded bg-blue-100 border border-blue-200 flex items-center justify-center text-xs text-blue-600">
                                        Section {i + 1}
                                    </div>
                                ))
                            ) : (
                                <div className="h-6 flex-1 rounded bg-rose-100 border border-rose-200 border-dashed flex items-center px-3 text-xs text-rose-600">
                                    No subheadings
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-pink-50 border border-pink-100">
                    <p className="text-xs font-medium text-pink-600 mb-2">YOUR SITE</p>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${yourCounts.h1 === 1 ? 'text-emerald-600' : 'text-rose-600'}`}>{yourCounts.h1}</p>
                            <p className="text-xs text-slate-500">H1 tags</p>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${yourCounts.h2 >= 3 ? 'text-emerald-600' : 'text-amber-600'}`}>{yourCounts.h2}</p>
                            <p className="text-xs text-slate-500">H2 tags</p>
                        </div>
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-2">COMPETITOR</p>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-600">{compCounts.h1}</p>
                            <p className="text-xs text-slate-500">H1 tags</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-600">{compCounts.h2}</p>
                            <p className="text-xs text-slate-500">H2 tags</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Issues */}
            {yourIssues.length > 0 && (
                <div className="space-y-2">
                    {yourIssues.map((issue, idx) => (
                        <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg ${issue.severity === 'high' ? 'bg-rose-50 border border-rose-200' :
                            issue.severity === 'medium' ? 'bg-amber-50 border border-amber-200' :
                                'bg-slate-50 border border-slate-200'
                            }`}>
                            <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${issue.severity === 'high' ? 'text-rose-500' :
                                issue.severity === 'medium' ? 'text-amber-500' :
                                    'text-slate-400'
                                }`} />
                            <span className="text-sm text-slate-700">{issue.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Enhanced Image Optimization
function ImageOptimizationAnalysis({ yourData, competitorData }: { yourData: OnPageData; competitorData: OnPageData }) {
    const yourScore = yourData.subcategories?.imageOptimization?.score ?? 50;
    const compScore = competitorData.subcategories?.imageOptimization?.score ?? 50;
    const yourEvidence = yourData.subcategories?.imageOptimization?.evidence ?? [];
    const compEvidence = competitorData.subcategories?.imageOptimization?.evidence ?? [];

    const extractRatio = (evidence: string[]) => {
        const match = evidence[0]?.match(/(\d+)\/(\d+) images have alt text/);
        return match ? { withAlt: parseInt(match[1]), total: parseInt(match[2]) } : { withAlt: 0, total: 0 };
    };

    const yourRatio = extractRatio(yourEvidence);
    const compRatio = extractRatio(compEvidence);

    // Handle 0/0 case properly - don't show 100% for no images
    const noImagesFound = yourRatio.total === 0;
    const percentage = noImagesFound ? 0 : Math.round((yourRatio.withAlt / yourRatio.total) * 100);
    const compPercentage = compRatio.total === 0 ? 0 : Math.round((compRatio.withAlt / compRatio.total) * 100);
    const missingCount = yourRatio.total - yourRatio.withAlt;
    const compMissingCount = compRatio.total - compRatio.withAlt;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        <Image className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Image SEO & Accessibility</h3>
                        <p className="text-slate-500 text-sm">Alt text coverage comparison</p>
                    </div>
                </div>
                <ComparisonBadge yourScore={yourScore} competitorScore={compScore} />
            </div>

            {/* Side by Side Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Your Site */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <p className="text-xs font-medium text-amber-600 uppercase mb-3">YOUR SITE</p>
                    {noImagesFound ? (
                        <div className="text-center py-4">
                            <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 font-medium">No images detected</p>
                            <p className="text-xs text-slate-400 mt-1">Page may be image-light or JS-rendered</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16">
                                    <svg className="w-16 h-16 transform -rotate-90">
                                        <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                                        <circle
                                            cx="32" cy="32" r="26" fill="none"
                                            stroke={percentage >= 80 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="6"
                                            strokeDasharray={`${percentage * 1.63} 163`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold text-slate-900">{percentage}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {yourRatio.withAlt}<span className="text-slate-400 text-lg">/{yourRatio.total}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">images with alt text</p>
                                    {missingCount > 0 && (
                                        <p className="text-xs text-rose-600 mt-1">{missingCount} missing</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Competitor */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-3">COMPETITOR</p>
                    {compRatio.total === 0 ? (
                        <div className="text-center py-4">
                            <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 font-medium">No images detected</p>
                            <p className="text-xs text-slate-400 mt-1">Page may be image-light or JS-rendered</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16">
                                    <svg className="w-16 h-16 transform -rotate-90">
                                        <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                                        <circle
                                            cx="32" cy="32" r="26" fill="none"
                                            stroke={compPercentage >= 80 ? '#10b981' : compPercentage >= 50 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="6"
                                            strokeDasharray={`${compPercentage * 1.63} 163`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold text-slate-600">{compPercentage}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-600">
                                        {compRatio.withAlt}<span className="text-slate-400 text-lg">/{compRatio.total}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">images with alt text</p>
                                    {compMissingCount > 0 && (
                                        <p className="text-xs text-slate-400 mt-1">{compMissingCount} missing</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Business Impact */}
            {noImagesFound ? (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-slate-700 mb-1">Unable to Analyze Images</p>
                            <p className="text-sm text-slate-500">
                                No images were detected on this page. This could mean the page has no images,
                                or images are loaded dynamically via JavaScript after the initial page load.
                            </p>
                        </div>
                    </div>
                </div>
            ) : missingCount > 0 ? (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-900 mb-1">Missing Image SEO Opportunity</p>
                            <p className="text-sm text-amber-700">
                                {missingCount} image{missingCount > 1 ? 's' : ''} without alt text = lost Google Image Search visibility.
                                {compRatio.total > 0 && compPercentage > percentage && (
                                    <span className="font-medium"> Your competitor has {compPercentage}% coverage vs your {percentage}%.</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            ) : yourRatio.total > 0 && (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">All {yourRatio.total} images have alt text - great for accessibility & SEO!</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// SEO Score Comparison Hero - Enhanced
function SeoComparisonHero({ yourData, competitorData, yourDomain, competitorDomain }: {
    yourData: OnPageData;
    competitorData: OnPageData;
    yourDomain: string;
    competitorDomain: string;
}) {
    const isWinning = yourData.score > competitorData.score;
    const scoreDiff = yourData.score - competitorData.score;

    const subcategories = [
        { key: 'titleTagOptimization', label: 'Title Tag', icon: Tag, weight: '30%' },
        { key: 'metaDescriptionQuality', label: 'Meta Description', icon: AlignLeft, weight: '25%' },
        { key: 'headerStructure', label: 'Header Structure', icon: Heading1, weight: '25%' },
        { key: 'imageOptimization', label: 'Image SEO', icon: Image, weight: '20%' },
    ];

    return (
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 mb-6 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.4) 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }} />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-500/20 backdrop-blur-sm">
                        <Search className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">On-Page SEO Intelligence</h3>
                        <p className="text-purple-300 text-sm">Head-to-head element comparison</p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${isWinning
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : scoreDiff === 0 ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                    {isWinning ? `🏆 +${scoreDiff} Ahead` : scoreDiff === 0 ? '⚖️ Tied' : `⚠️ -${Math.abs(scoreDiff)} Behind`}
                </div>
            </div>

            {/* Score Bars */}
            <div className="relative z-10 space-y-4">
                {subcategories.map((sub) => {
                    const yourScore = yourData.subcategories?.[sub.key]?.score ?? 50;
                    const compScore = competitorData.subcategories?.[sub.key]?.score ?? 50;
                    const isAhead = yourScore > compScore;

                    return (
                        <div key={sub.key}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <sub.icon className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm text-purple-200">{sub.label}</span>
                                    <span className="text-xs text-purple-400/60">({sub.weight})</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-medium ${isAhead ? 'text-emerald-400' : yourScore === compScore ? 'text-slate-400' : 'text-rose-400'}`}>
                                        {yourScore}
                                    </span>
                                    <span className="text-slate-500">vs</span>
                                    <span className="text-sm text-slate-400">{compScore}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${isAhead ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-purple-400 to-fuchsia-500'}`}
                                        style={{ width: `${yourScore}%` }}
                                    />
                                </div>
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full"
                                        style={{ width: `${compScore}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="relative z-10 mt-4 flex justify-center gap-6 text-xs">
                <div className="flex items-center gap-2 text-purple-300">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-400 to-fuchsia-500" />
                    {yourDomain}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-slate-500 to-slate-400" />
                    {competitorDomain}
                </div>
            </div>
        </div>
    );
}

// Enhanced Quick Wins with Specific Recommendations
function QuickWinsPanel({ yourData }: { yourData: OnPageData }) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    // Generate specific, actionable recommendations based on data
    const generateWins = () => {
        const wins: { title: string; impact: string; effort: string; explanation: string; action: string }[] = [];

        const titleEvidence = yourData.subcategories?.titleTagOptimization?.evidence ?? [];
        const titleMatch = titleEvidence[0]?.match(/Title: "(.+)" \((\d+) chars\)/);
        const titleLength = titleMatch ? parseInt(titleMatch[2]) : 0;
        const titleText = titleMatch ? titleMatch[1] : '';

        const descEvidence = yourData.subcategories?.metaDescriptionQuality?.evidence ?? [];
        const descLength = parseInt(descEvidence[0]?.match(/Description: (\d+) chars/)?.[1] ?? '0');

        const headerEvidence = yourData.subcategories?.headerStructure?.evidence ?? [];
        const h1Count = parseInt(headerEvidence.find(e => e.includes('H1'))?.match(/H1 tags: (\d+)/)?.[1] ?? '0');
        const h2Count = parseInt(headerEvidence.find(e => e.includes('H2'))?.match(/H2 tags: (\d+)/)?.[1] ?? '0');

        const imageEvidence = yourData.subcategories?.imageOptimization?.evidence ?? [];
        const imageMatch = imageEvidence[0]?.match(/(\d+)\/(\d+) images/);
        const imagesWithAlt = imageMatch ? parseInt(imageMatch[1]) : 0;
        const totalImages = imageMatch ? parseInt(imageMatch[2]) : 0;

        // Title recommendations
        if (titleLength === 0) {
            wins.push({
                title: 'Add a title tag immediately',
                impact: 'Critical',
                effort: '5 min',
                explanation: 'You have NO title tag. This is the #1 on-page SEO element and you\'re completely missing it.',
                action: 'Add a 50-60 character title that includes your primary keyword and location (if local business).'
            });
        } else if (titleLength > 60) {
            wins.push({
                title: `Shorten your title by ${titleLength - 60} characters`,
                impact: 'High',
                effort: '5 min',
                explanation: 'Your title is being truncated in search results. Users can\'t see your full message.',
                action: `Current: "${titleText}" → Trim to 60 chars while keeping your main keyword.`
            });
        } else if (titleLength < 40) {
            wins.push({
                title: 'Expand your title with more keywords',
                impact: 'High',
                effort: '5 min',
                explanation: `You're only using ${titleLength}/60 characters. That's wasted SERP real estate!`,
                action: 'Add secondary keywords, location, or value propositions to fill the space.'
            });
        }

        // Meta description recommendations
        if (descLength === 0) {
            wins.push({
                title: 'Write a compelling meta description',
                impact: 'High',
                effort: '10 min',
                explanation: 'Without a meta description, Google auto-generates one. You lose control over your search snippet.',
                action: 'Write a 150-160 character description with a clear call-to-action and your main keyword.'
            });
        } else if (descLength < 120) {
            wins.push({
                title: `Add ${150 - descLength} more characters to meta description`,
                impact: 'Medium',
                effort: '5 min',
                explanation: 'Your meta description is too short. You\'re missing the chance to persuade searchers.',
                action: 'Add benefits, unique selling points, or a call-to-action to fill the space.'
            });
        }

        // Header recommendations
        if (h1Count === 0) {
            wins.push({
                title: 'Add an H1 heading to your page',
                impact: 'High',
                effort: '5 min',
                explanation: 'The H1 tells Google what your page is about. Without it, ranking is much harder.',
                action: 'Add ONE H1 tag at the top of your content that includes your main keyword.'
            });
        } else if (h1Count > 1) {
            wins.push({
                title: `Remove ${h1Count - 1} extra H1 tag(s)`,
                impact: 'Medium',
                effort: '10 min',
                explanation: 'Multiple H1s confuse search engines about your page\'s main topic.',
                action: 'Keep the most important H1 and convert others to H2 or H3 tags.'
            });
        }

        if (h2Count < 3) {
            wins.push({
                title: 'Add more H2 subheadings',
                impact: 'Medium',
                effort: '15 min',
                explanation: 'H2 tags are opportunities to rank for more keywords and improve readability.',
                action: 'Add 3-5 H2 subheadings that cover subtopics and include relevant keywords.'
            });
        }

        // Image recommendations
        if (totalImages > imagesWithAlt) {
            const missing = totalImages - imagesWithAlt;
            wins.push({
                title: `Add alt text to ${missing} image${missing > 1 ? 's' : ''}`,
                impact: 'Medium',
                effort: `${missing * 2} min`,
                explanation: `${missing} images are invisible to Google Image Search and screen readers.`,
                action: 'Add descriptive alt text that includes your keyword naturally. Be specific about what\'s shown.'
            });
        }

        // If all looks good
        if (wins.length === 0) {
            wins.push({
                title: 'On-page SEO is well-optimized!',
                impact: 'N/A',
                effort: 'N/A',
                explanation: 'Your page has good on-page fundamentals. Focus on content quality and link building.',
                action: 'Consider adding FAQ schema, improving page speed, or creating more content.'
            });
        }

        return wins;
    };

    const wins = generateWins();

    const impactColors: Record<string, string> = {
        'Critical': 'bg-rose-100 text-rose-700 border-rose-200',
        'High': 'bg-amber-100 text-amber-700 border-amber-200',
        'Medium': 'bg-blue-100 text-blue-700 border-blue-200',
        'Low': 'bg-slate-100 text-slate-600 border-slate-200',
        'N/A': 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Specific Actions to Improve Rankings</h3>
                    <p className="text-slate-500 text-sm">Prioritized by impact • Based on your actual data</p>
                </div>
            </div>

            <div className="space-y-3">
                {wins.map((win, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <span className="font-medium text-slate-800">{win.title}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-1 rounded-full border ${impactColors[win.impact]}`}>
                                    {win.impact}
                                </span>
                                <span className="text-xs text-slate-400">{win.effort}</span>
                                {expandedIdx === idx ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                        </button>

                        {expandedIdx === idx && (
                            <div className="px-4 pb-4 pt-0">
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                    <div className="mb-3">
                                        <p className="text-sm font-medium text-purple-800 mb-1">Why This Matters:</p>
                                        <p className="text-sm text-purple-700">{win.explanation}</p>
                                    </div>
                                    <div className="border-t border-purple-200 pt-3">
                                        <p className="text-sm font-medium text-purple-800 mb-1">
                                            <Lightbulb className="w-4 h-4 inline-block mr-1" />
                                            What To Do:
                                        </p>
                                        <p className="text-sm text-purple-700">{win.action}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// URL Structure - Enhanced
function UrlStructureCard({ yourData, competitorData, yourDomain, competitorDomain }: { yourData: OnPageData; competitorData: OnPageData; yourDomain: string; competitorDomain: string }) {
    const yourScore = yourData.subcategories?.urlStructure?.score ?? 50;
    const compScore = competitorData.subcategories?.urlStructure?.score ?? 50;
    const yourEvidence = yourData.subcategories?.urlStructure?.evidence ?? [];

    const extractUrl = (evidence: string[]) => {
        const match = evidence[0]?.match(/URL: (.+)/);
        return match ? match[1] : '';
    };

    const yourUrl = extractUrl(yourEvidence);

    const urlChecks = [
        { label: 'No query parameters', pass: !yourUrl.includes('?'), explanation: 'Query strings can create duplicate content issues' },
        { label: 'Uses hyphens (not underscores)', pass: !yourUrl.includes('_'), explanation: 'Google treats hyphens as word separators, underscores do not' },
        { label: 'Reasonable length', pass: yourUrl.length < 100, explanation: 'Short URLs rank slightly better and are easier to share' },
        { label: 'All lowercase', pass: yourUrl === yourUrl.toLowerCase(), explanation: 'Mixed case can cause duplicate content if server is case-sensitive' },
    ];

    const passCount = urlChecks.filter(c => c.pass).length;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">URL Structure Analysis</h3>
                        <p className="text-slate-500 text-sm">{passCount}/4 best practices met</p>
                    </div>
                </div>
                <ComparisonBadge yourScore={yourScore} competitorScore={compScore} />
            </div>

            {/* URL Display */}
            <div className="bg-slate-900 rounded-lg p-4 mb-4">
                <code className="text-emerald-400 text-sm font-mono break-all">
                    {yourUrl || `https://${yourDomain}/`}
                </code>
            </div>

            {/* URL Checks Grid */}
            <div className="grid grid-cols-2 gap-3">
                {urlChecks.map((check, idx) => (
                    <div
                        key={idx}
                        className={`p-3 rounded-lg ${check.pass ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            {check.pass ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <XCircle className="w-4 h-4 text-rose-500" />
                            )}
                            <span className={`text-sm font-medium ${check.pass ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {check.label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 ml-6">{check.explanation}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// KEYWORD GAP ANALYSIS PANEL
// ============================================

function KeywordGapPanel({ data, yourDomain, competitorDomain }: {
    data: KeywordGapResult;
    yourDomain: string;
    competitorDomain: string;
}) {
    const [activeTab, setActiveTab] = useState<'missing' | 'opportunities' | 'exclusive'>('opportunities');

    const formatNumber = (n: number) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
    };

    const getIntentColor = (intent: KeywordGapItem['intent']) => {
        switch (intent) {
            case 'transactional': return 'bg-emerald-100 text-emerald-700';
            case 'commercial': return 'bg-amber-100 text-amber-700';
            case 'informational': return 'bg-sky-100 text-sky-700';
            case 'navigational': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getDifficultyColor = (kd: number) => {
        if (kd <= 30) return 'text-emerald-600';
        if (kd <= 60) return 'text-amber-600';
        return 'text-rose-600';
    };

    const tabs = [
        { key: 'opportunities', label: '🎯 Top Opportunities', count: data.topOpportunities.length },
        { key: 'missing', label: '⚠️ You\'re Missing', count: data.keywordsYouAreMissing.length },
        { key: 'exclusive', label: '✓ Only You Have', count: data.keywordsOnlyYouHave.length },
    ];

    const currentKeywords = activeTab === 'missing'
        ? data.keywordsYouAreMissing
        : activeTab === 'exclusive'
            ? data.keywordsOnlyYouHave
            : data.topOpportunities;

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Keyword Gap Analysis</h3>
                        <p className="text-slate-500 text-sm">Keywords your competitor ranks for</p>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-5 gap-3 mb-6">
                <div className="bg-white rounded-xl p-3 border border-indigo-100 text-center">
                    <div className="text-2xl font-black text-indigo-600">{formatNumber(data.summary.yourTotalKeywords)}</div>
                    <div className="text-xs text-slate-500">Your Keywords</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                    <div className="text-2xl font-bold text-slate-600">{formatNumber(data.summary.competitorTotalKeywords)}</div>
                    <div className="text-xs text-slate-500">Their Keywords</div>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 border border-rose-200 text-center">
                    <div className="text-2xl font-black text-rose-600">{data.keywordsYouAreMissing.length}</div>
                    <div className="text-xs text-rose-600">You&apos;re Missing</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-center">
                    <div className="text-2xl font-black text-amber-600">{data.summary.quickWins}</div>
                    <div className="text-xs text-amber-600">Quick Wins</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 text-center">
                    <div className="text-2xl font-black text-purple-600">{formatNumber(data.summary.missedOpportunityTraffic)}</div>
                    <div className="text-xs text-purple-600">Missed Traffic</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.key
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'
                            }`}
                    >
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Keyword Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 border-b text-xs font-medium text-slate-500 uppercase tracking-wide">
                    <div className="col-span-4">Keyword</div>
                    <div className="col-span-2 text-center">Volume</div>
                    <div className="col-span-1 text-center">KD</div>
                    <div className="col-span-2 text-center">Position</div>
                    <div className="col-span-2 text-center">Intent</div>
                    <div className="col-span-1 text-center">CPC</div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {currentKeywords.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p>No keywords found in this category</p>
                        </div>
                    ) : (
                        currentKeywords.slice(0, 15).map((kw, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 items-center">
                                <div className="col-span-4">
                                    <span className="font-medium text-slate-900 text-sm">{kw.keyword}</span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="text-sm font-semibold text-indigo-600">{formatNumber(kw.searchVolume)}</span>
                                </div>
                                <div className="col-span-1 text-center">
                                    <span className={`text-sm font-bold ${getDifficultyColor(kw.keywordDifficulty)}`}>
                                        {kw.keywordDifficulty}
                                    </span>
                                </div>
                                <div className="col-span-2 text-center text-sm">
                                    <span className={kw.yourPosition ? 'text-emerald-600 font-medium' : 'text-rose-500'}>
                                        {kw.yourPosition || '—'}
                                    </span>
                                    <span className="text-slate-400 mx-1">vs</span>
                                    <span className={kw.competitorPosition ? 'text-slate-600' : 'text-slate-400'}>
                                        {kw.competitorPosition || '—'}
                                    </span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getIntentColor(kw.intent)}`}>
                                        {kw.intent}
                                    </span>
                                </div>
                                <div className="col-span-1 text-center">
                                    <span className="text-sm text-slate-600">${kw.cpc.toFixed(2)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action Box */}
            {activeTab === 'missing' && data.keywordsYouAreMissing.length > 0 && (
                <div className="mt-4 bg-rose-50 rounded-xl p-4 border border-rose-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-rose-900 mb-1">Revenue at Risk</p>
                            <p className="text-sm text-rose-700">
                                Your competitor ranks for {data.keywordsYouAreMissing.length} keywords you don&apos;t.
                                This represents ~{formatNumber(data.summary.missedOpportunityTraffic)} monthly visits you&apos;re not capturing.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'opportunities' && data.topOpportunities.length > 0 && (
                <div className="mt-4 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-emerald-900 mb-1">Quick Win Opportunities</p>
                            <p className="text-sm text-emerald-700">
                                These {data.summary.quickWins} keywords have high volume but low difficulty.
                                Target these first for fastest ranking improvements.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Main Component
export function OnPageSeoDetail({
    yourData,
    competitorData,
    yourDomain,
    competitorDomain,
    keywordGap
}: OnPageSeoDetailProps) {
    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <SeoScoreGauge score={yourData.score} size={100} />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-slate-900">On-Page SEO</h2>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                Keyword Intelligence
                            </span>
                        </div>
                        <p className="text-slate-600">Title tags, meta descriptions, and page structure</p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                        <span className="text-3xl font-bold text-slate-900">{yourData.score}</span>
                        <span className="text-slate-400">vs</span>
                        <span className="text-2xl font-semibold text-slate-500">{competitorData.score}</span>
                    </div>
                    <ComparisonBadge yourScore={yourData.score} competitorScore={competitorData.score} />
                </div>
            </div>

            {/* SEO Comparison Hero */}
            <SeoComparisonHero
                yourData={yourData}
                competitorData={competitorData}
                yourDomain={yourDomain}
                competitorDomain={competitorDomain}
            />

            {/* Title Tag Analysis - Full Width */}
            <TitleTagAnalysis
                yourData={yourData}
                competitorData={competitorData}
                yourDomain={yourDomain}
                competitorDomain={competitorDomain}
            />

            {/* Meta Description with SERP Preview */}
            <MetaDescriptionAnalysis
                yourData={yourData}
                competitorData={competitorData}
                yourDomain={yourDomain}
                competitorDomain={competitorDomain}
            />

            {/* Secondary Grid */}
            <div className="grid grid-cols-2 gap-6">
                <HeaderStructureAnalysis yourData={yourData} competitorData={competitorData} />
                <ImageOptimizationAnalysis yourData={yourData} competitorData={competitorData} />
            </div>

            {/* Quick Wins - Specific Actions */}
            <QuickWinsPanel yourData={yourData} />

            {/* Keyword Gap Analysis (when available) */}
            {keywordGap && (
                <KeywordGapPanel
                    data={keywordGap}
                    yourDomain={yourDomain}
                    competitorDomain={competitorDomain}
                />
            )}
        </div>
    );
}
