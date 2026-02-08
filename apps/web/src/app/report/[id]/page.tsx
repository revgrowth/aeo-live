'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    CopyForensicsSection,
    BrandIdentitySection,
    TrustAuthoritySection,
    StrategicRoadmapSection,
    IntelligenceReportData,
    IntelligenceReport
} from '@/components/intelligence-report';
import { TechnicalSeoDetail } from '@/components/category-details/TechnicalSeoDetail';
import { BrandVoiceDetail } from '@/components/category-details/BrandVoiceDetail';
import { AeoReadinessDetail } from '@/components/category-details/AeoReadinessDetail';
import { UxEngagementDetail } from '@/components/category-details/UxEngagementDetail';
import { OnPageSeoDetail } from '@/components/category-details/OnPageSeoDetail';
import TopicalAuthorityDetail from '@/components/category-details/TopicalAuthorityDetail';
import { RefreshReportModal } from '@/components/RefreshReportModal';
import Link from 'next/link';
import {
    ArrowLeft, Download, Trophy, TrendingUp, TrendingDown,
    Zap, Target, Shield, Sparkles, BarChart3, Link2, Layout,
    MessageSquare, ChevronDown, ChevronUp, CheckCircle, AlertCircle,
    Star, Flame, Rocket, Brain, Award, Eye, FileText, Users,
    Cpu, Search, Globe, Lightbulb, ArrowRight, Fingerprint,
    ShieldCheck, Menu, X, Calendar, DollarSign, Percent
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface SubcategoryScore {
    score: number;
    weight: number;
    evidence?: string[];
    issues?: string[];
}

interface Category {
    name: string;
    icon: string;
    yourScore: number;
    competitorScore: number;
    status: 'winning' | 'losing' | 'tied';
    insights?: string[];
    recommendations?: string[];
    subcategories?: Record<string, SubcategoryScore>;
    details?: Record<string, any>;
}

interface ReportData {
    analysisId: string;
    yourUrl: string;
    competitorUrl: string;
    yourScore: number;
    competitorScore: number;
    status: 'winning' | 'losing' | 'tied';
    categories: Category[];
    aiSummary: string;
    recommendations?: Array<{
        priority: 'high' | 'medium' | 'low';
        title: string;
        description: string;
        impact: string;
    }>;
    createdAt: string;
    intelligenceReport?: IntelligenceReportData;
    businessProfile?: { name: string; industry: string; services: string[] };
    v3Analysis?: {
        your: any;
        competitor: any;
        yourPerformance?: any;
        competitorPerformance?: any;
        contentGap?: any;
        backlinkComparison?: any;
        serpComparison?: any;
    };
}

// ============================================
// NAVIGATION CATEGORIES
// ============================================

type NavCategory = 'summary' | 'technical-seo' | 'on-page-seo' | 'aeo-readiness' | 'topical-authority' | 'brand-voice' | 'ux-engagement' | 'revenue' | 'gameplan';

interface NavItem {
    id: NavCategory;
    label: string;
    icon: any;
    description: string;
}

const navigationItems: NavItem[] = [
    { id: 'summary', label: 'Summary', icon: BarChart3, description: 'Executive summary & scores' },
    { id: 'aeo-readiness', label: 'AEO Readiness', icon: Brain, description: 'AI search visibility' },
    { id: 'topical-authority', label: 'Topical Authority', icon: Sparkles, description: 'Entity & topic coverage' },
    { id: 'brand-voice', label: 'Brand Voice/DNA', icon: MessageSquare, description: 'Voice & differentiation' },
    { id: 'ux-engagement', label: 'UX & Engagement', icon: Eye, description: 'User experience signals' },
    { id: 'technical-seo', label: 'Technical SEO', icon: Cpu, description: 'Speed & crawlability' },
    { id: 'on-page-seo', label: 'On-Page SEO', icon: Search, description: 'Title tags & keywords' },
    { id: 'revenue', label: 'Revenue Calculator', icon: Target, description: 'Business impact' },
    { id: 'gameplan', label: 'Game Plan', icon: Zap, description: 'Strategic roadmap' },
];

// ============================================
// CATEGORY ICONS MAPPING
// ============================================

const categoryIcons: Record<string, any> = {
    'Technical SEO': Cpu,
    'On-Page SEO': Search,
    'Content Quality': FileText,
    'AEO Readiness': Brain,
    'Brand Voice': MessageSquare,
    'UX/Engagement': Eye,
    'Internal Structure': Link2,
};

// ============================================
// SCORING SUMMARY COMPONENT
// ============================================

function ScoringSummary({
    yourScore,
    competitorScore,
    yourDomain,
    competitorDomain,
    createdAt
}: {
    yourScore: number;
    competitorScore: number;
    yourDomain: string;
    competitorDomain: string;
    createdAt: string;
}) {
    const scoreDiff = yourScore - competitorScore;
    const isWinning = scoreDiff > 0;
    const circumference = 2 * Math.PI * 52; // radius 52
    const yourOffset = circumference - (yourScore / 100) * circumference;
    const competitorOffset = circumference - (competitorScore / 100) * circumference;

    return (
        <div className="data-card p-8 border border-slate-200/60 shadow-lg mb-10">
            {/* SVG Gradient Definitions */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id="gauge-gradient-winning" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <linearGradient id="gauge-gradient-losing" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                    <linearGradient id="gauge-gradient-neutral" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="flex items-center justify-between flex-wrap gap-8">
                {/* Score Gauges */}
                <div className="flex items-center gap-8 md:gap-12">
                    {/* Your Score Gauge */}
                    <div className="text-center">
                        <div className="score-gauge-xl relative">
                            <svg width="140" height="140" viewBox="0 0 120 120">
                                <circle
                                    className="gauge-bg"
                                    cx="60"
                                    cy="60"
                                    r="52"
                                />
                                <circle
                                    className={`gauge-fill ${isWinning ? 'winning' : 'neutral'}`}
                                    cx="60"
                                    cy="60"
                                    r="52"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={yourOffset}
                                    style={{
                                        stroke: isWinning ? 'url(#gauge-gradient-winning)' : 'url(#gauge-gradient-neutral)',
                                        filter: `drop-shadow(0 0 8px ${isWinning ? 'rgba(16, 185, 129, 0.4)' : 'rgba(14, 165, 233, 0.4)'})`
                                    }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-black ${isWinning ? 'text-emerald-600' : 'text-slate-700'}`}>
                                    {Math.round(yourScore)}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-3 truncate max-w-[140px]">{yourDomain}</p>
                        <p className="text-xs text-slate-500">Your Score</p>
                    </div>

                    {/* VS Badge */}
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 border-2 border-slate-200 flex items-center justify-center shadow-lg">
                            <span className="text-lg font-black text-slate-500">VS</span>
                        </div>
                        {/* Battle Indicator */}
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${isWinning
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}>
                            {isWinning ? '+' : ''}{Math.round(scoreDiff)}
                        </div>
                    </div>

                    {/* Competitor Score Gauge */}
                    <div className="text-center">
                        <div className="score-gauge-xl relative">
                            <svg width="140" height="140" viewBox="0 0 120 120">
                                <circle
                                    className="gauge-bg"
                                    cx="60"
                                    cy="60"
                                    r="52"
                                />
                                <circle
                                    className={`gauge-fill ${!isWinning ? 'winning' : 'neutral'}`}
                                    cx="60"
                                    cy="60"
                                    r="52"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={competitorOffset}
                                    style={{
                                        stroke: !isWinning ? 'url(#gauge-gradient-winning)' : 'url(#gauge-gradient-neutral)',
                                        filter: `drop-shadow(0 0 8px ${!isWinning ? 'rgba(16, 185, 129, 0.4)' : 'rgba(14, 165, 233, 0.4)'})`
                                    }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-black ${!isWinning ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {Math.round(competitorScore)}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-3 truncate max-w-[140px]">{competitorDomain}</p>
                        <p className="text-xs text-slate-500">Competitor</p>
                    </div>
                </div>

                {/* Status Badge & Date */}
                <div className="flex flex-col items-end gap-3">
                    <div className={`delta-indicator ${isWinning ? 'positive' : 'negative'} text-lg`}>
                        {isWinning
                            ? <Trophy className="w-5 h-5" />
                            : <TrendingDown className="w-5 h-5" />
                        }
                        <span>{isWinning ? 'Winning!' : 'Behind'}</span>
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// REVENUE CALCULATOR COMPONENT
// ============================================

function RevenueCalculator({ report }: { report: ReportData }) {
    const [monthlyTraffic, setMonthlyTraffic] = useState(10000);
    const [conversionRate, setConversionRate] = useState(2.5);
    const [avgLTV, setAvgLTV] = useState(500);

    const scoreDiff = report.competitorScore - report.yourScore;
    const opportunityPercent = Math.max(0, scoreDiff * 0.5);
    const potentialLeadsLost = Math.round((monthlyTraffic * opportunityPercent) / 100);
    const potentialCustomersLost = Math.round((potentialLeadsLost * conversionRate) / 100);
    const monthlyRevenueLost = potentialCustomersLost * avgLTV;
    const yearlyRevenueLost = monthlyRevenueLost * 12;

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">Revenue Opportunity Calculator</h1>
                <p className="text-slate-500">See the financial impact of closing competitive gaps</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Monthly Website Traffic</label>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-sky-500" />
                        <input type="number" value={monthlyTraffic} onChange={(e) => setMonthlyTraffic(Number(e.target.value))} className="w-full text-2xl font-bold text-slate-900 bg-transparent outline-none" />
                    </div>
                    <input type="range" min="1000" max="100000" step="1000" value={monthlyTraffic} onChange={(e) => setMonthlyTraffic(Number(e.target.value))} className="w-full mt-2 accent-sky-500" />
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Conversion Rate (%)</label>
                    <div className="flex items-center gap-2">
                        <Percent className="w-5 h-5 text-violet-500" />
                        <input type="number" step="0.1" value={conversionRate} onChange={(e) => setConversionRate(Number(e.target.value))} className="w-full text-2xl font-bold text-slate-900 bg-transparent outline-none" />
                    </div>
                    <input type="range" min="0.5" max="10" step="0.1" value={conversionRate} onChange={(e) => setConversionRate(Number(e.target.value))} className="w-full mt-2 accent-violet-500" />
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Average Customer LTV ($)</label>
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        <input type="number" value={avgLTV} onChange={(e) => setAvgLTV(Number(e.target.value))} className="w-full text-2xl font-bold text-slate-900 bg-transparent outline-none" />
                    </div>
                    <input type="range" min="100" max="10000" step="100" value={avgLTV} onChange={(e) => setAvgLTV(Number(e.target.value))} className="w-full mt-2 accent-emerald-500" />
                </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                        <div className="text-3xl font-black text-rose-400">{potentialLeadsLost.toLocaleString()}</div>
                        <div className="text-xs text-slate-400 mt-1">Leads Lost / Month</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                        <div className="text-3xl font-black text-amber-400">{potentialCustomersLost.toLocaleString()}</div>
                        <div className="text-xs text-slate-400 mt-1">Customers Lost / Month</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                        <div className="text-3xl font-black text-sky-400">${monthlyRevenueLost.toLocaleString()}</div>
                        <div className="text-xs text-slate-400 mt-1">Monthly Revenue Lost</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                        <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">${yearlyRevenueLost.toLocaleString()}</div>
                        <div className="text-xs text-emerald-300 mt-1 font-semibold">YEARLY REVENUE OPPORTUNITY</div>
                    </div>
                </div>
                <div className="text-center text-sm text-slate-400">
                    Based on a <span className="text-rose-400 font-bold">{scoreDiff > 0 ? scoreDiff : 0} point</span> competitive gap = <span className="text-amber-400 font-bold">{opportunityPercent.toFixed(1)}%</span> potential traffic improvement
                </div>
            </div>
        </div>
    );
}

// ============================================
// LEFT SIDEBAR COMPONENT
// ============================================

function LeftSidebar({
    activeCategory,
    onCategoryChange,
    yourDomain,
    competitorDomain,
    isOpen,
    onClose
}: {
    activeCategory: NavCategory;
    onCategoryChange: (category: NavCategory) => void;
    yourDomain: string;
    competitorDomain: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 left-0 h-screen w-72 bg-gradient-to-b from-white to-slate-50/80 border-r border-slate-200
                flex flex-col z-50 transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Premium Header */}
                <div className="p-6 border-b border-slate-200/60 bg-white">
                    <div className="flex items-center justify-between mb-5">
                        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 hover:text-slate-900">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                    <div className="data-card p-4 border border-slate-200/60">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-base font-bold text-slate-900 truncate">{yourDomain}</h1>
                                <p className="text-xs text-slate-500 truncate">vs {competitorDomain}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Navigation */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {navigationItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = activeCategory === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onCategoryChange(item.id);
                                    onClose();
                                }}
                                className={`
                                    w-full flex items-start gap-3 px-4 py-3 rounded-xl transition-all text-left relative overflow-hidden
                                    ${isActive
                                        ? 'bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 shadow-sm'
                                        : 'hover:bg-slate-100/80 border border-transparent'
                                    }
                                `}
                                style={{ animationDelay: `${index * 0.03}s` }}
                            >
                                {/* Active Indicator Bar */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-sky-500 to-indigo-600 rounded-r-full" />
                                )}
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive
                                    ? 'bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md'
                                    : 'bg-slate-100'
                                    }`}>
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-semibold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                                        {item.label}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {/* Premium Footer */}
                <div className="p-4 border-t border-slate-200/60 bg-white">
                    <Button className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-medium shadow-lg">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF Report
                    </Button>
                </div>
            </aside>
        </>
    );
}

// ============================================
// OVERVIEW CONTENT
// ============================================

function OverviewContent({
    report,
    yourDomain,
    competitorDomain
}: {
    report: ReportData;
    yourDomain: string;
    competitorDomain: string;
}) {
    const intelligenceReport = report.intelligenceReport;
    const scoreDiff = report.yourScore - report.competitorScore;
    const isWinning = scoreDiff > 0;

    // Calculate total wins/losses
    const winningCategories = report.categories.filter(c => c.yourScore > c.competitorScore);
    const losingCategories = report.categories.filter(c => c.yourScore < c.competitorScore);

    return (
        <div className="space-y-8">
            {/* ===== HERO SCORE BATTLE SECTION ===== */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-sky-500/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10">
                    {/* Battle Title */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/60 text-sm mb-4">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Competitive Intelligence Analysis
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white">
                            {yourDomain} <span className="text-slate-500">vs</span> {competitorDomain}
                        </h2>
                    </div>

                    {/* Score Battle */}
                    <div className="flex items-center justify-center gap-6 md:gap-16">
                        {/* Your Score */}
                        <div className="text-center">
                            <div className="relative w-32 h-32 md:w-44 md:h-44 mx-auto mb-4">
                                {/* Outer glow ring */}
                                <div className={`absolute inset-0 rounded-full ${isWinning ? 'bg-emerald-500/20' : 'bg-sky-500/20'} blur-xl animate-pulse`} />

                                {/* Score ring */}
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle
                                        cx="60" cy="60" r="52"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="60" cy="60" r="52"
                                        fill="none"
                                        stroke={isWinning ? "url(#greenGrad)" : "url(#blueGrad)"}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 52}`}
                                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - report.yourScore / 100)}`}
                                        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                                    />
                                    <defs>
                                        <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#34d399" />
                                        </linearGradient>
                                        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#0ea5e9" />
                                            <stop offset="100%" stopColor="#38bdf8" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Center score */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-4xl md:text-6xl font-black ${isWinning ? 'text-emerald-400' : 'text-sky-400'}`}>
                                        {Math.round(report.yourScore)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-white font-bold text-lg">{yourDomain}</div>
                            <div className="text-white/50 text-sm flex items-center justify-center gap-2 mt-1">
                                {isWinning ? (
                                    <>
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                        <span className="text-emerald-400">Leading</span>
                                    </>
                                ) : (
                                    <>
                                        <Target className="w-4 h-4 text-sky-400" />
                                        <span className="text-sky-400">Your Brand</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* VS Badge with Delta */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-white/10 flex items-center justify-center shadow-2xl">
                                <span className="text-xl md:text-2xl font-black text-white/70">VS</span>
                            </div>
                            <div className={`px-4 py-2 rounded-full font-bold text-lg ${isWinning
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}>
                                {isWinning ? '+' : ''}{Math.round(scoreDiff)}
                            </div>
                        </div>

                        {/* Competitor Score */}
                        <div className="text-center">
                            <div className="relative w-32 h-32 md:w-44 md:h-44 mx-auto mb-4">
                                {/* Outer glow ring */}
                                <div className={`absolute inset-0 rounded-full ${!isWinning ? 'bg-rose-500/20' : 'bg-slate-500/10'} blur-xl`} />

                                {/* Score ring */}
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle
                                        cx="60" cy="60" r="52"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="60" cy="60" r="52"
                                        fill="none"
                                        stroke={!isWinning ? "url(#roseGrad)" : "url(#slateGrad)"}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 52}`}
                                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - report.competitorScore / 100)}`}
                                        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                                    />
                                    <defs>
                                        <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#f43f5e" />
                                            <stop offset="100%" stopColor="#fb7185" />
                                        </linearGradient>
                                        <linearGradient id="slateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#64748b" />
                                            <stop offset="100%" stopColor="#94a3b8" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Center score */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-4xl md:text-6xl font-black ${!isWinning ? 'text-rose-400' : 'text-slate-400'}`}>
                                        {Math.round(report.competitorScore)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-white font-bold text-lg">{competitorDomain}</div>
                            <div className="text-white/50 text-sm flex items-center justify-center gap-2 mt-1">
                                {!isWinning ? (
                                    <>
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                        <span className="text-rose-400">Leading</span>
                                    </>
                                ) : (
                                    <>
                                        <Target className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-400">Competitor</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category Win/Loss Summary */}
                    <div className="flex justify-center gap-6 mt-10">
                        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">{winningCategories.length}</span>
                            <span className="text-white/60 text-sm">categories winning</span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <AlertCircle className="w-5 h-5 text-rose-400" />
                            <span className="text-rose-400 font-bold">{losingCategories.length}</span>
                            <span className="text-white/60 text-sm">need attention</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CATEGORY SCORE BREAKDOWN ===== */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-sky-600" />
                        Category Performance
                    </h3>
                    <span className="text-sm text-slate-500">Click any category to dive deeper</span>
                </div>

                <div className="grid gap-4">
                    {report.categories.map((cat, index) => {
                        const Icon = categoryIcons[cat.name] || BarChart3;
                        const diff = cat.yourScore - cat.competitorScore;
                        const isWinningCat = diff > 0;
                        const maxScore = Math.max(cat.yourScore, cat.competitorScore);

                        return (
                            <div
                                key={cat.name}
                                className="group rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-sky-200 transition-all duration-300 overflow-hidden"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isWinningCat
                                            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600'
                                            : diff < 0
                                                ? 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600'
                                                : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500'
                                            }`}>
                                            <Icon className="w-6 h-6" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Header row */}
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-slate-900 text-lg">{cat.name}</h4>
                                                <div className="flex items-center gap-3">
                                                    {/* Delta badge */}
                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${isWinningCat
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : diff < 0
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {isWinningCat ? '+' : ''}{Math.round(diff)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Score comparison bars */}
                                            <div className="space-y-2.5">
                                                {/* Your score */}
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-medium text-slate-500 w-20">You</span>
                                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                                                            style={{ width: `${(cat.yourScore / 100) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold text-emerald-600 w-10 text-right">{Math.round(cat.yourScore)}</span>
                                                </div>

                                                {/* Competitor score */}
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-medium text-slate-500 w-20">Competitor</span>
                                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-700"
                                                            style={{ width: `${(cat.competitorScore / 100) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold text-rose-600 w-10 text-right">{Math.round(cat.competitorScore)}</span>
                                                </div>
                                            </div>

                                            {/* Insights preview */}
                                            {cat.insights && cat.insights.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-100">
                                                    <p className="text-sm text-slate-600 flex items-start gap-2">
                                                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                        <span>{cat.insights[0]}</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Arrow indicator */}
                                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ===== AI VERDICT & KEY INSIGHTS ===== */}
            {intelligenceReport?.aiVerdict && (
                <section className="rounded-2xl bg-gradient-to-br from-indigo-50 via-sky-50 to-indigo-50 border border-indigo-200 p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <div className="text-xs text-indigo-600 uppercase tracking-wider font-bold mb-1">AI Intelligence Verdict</div>
                            <h3 className="text-xl font-bold text-slate-900">{intelligenceReport.aiVerdict.headline}</h3>
                        </div>
                    </div>

                    <p className="text-slate-600 mb-6 text-lg leading-relaxed">{intelligenceReport.aiVerdict.summary}</p>

                    {/* Key Differentiators */}
                    {intelligenceReport.aiVerdict.keyDifferentiators && intelligenceReport.aiVerdict.keyDifferentiators.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {intelligenceReport.aiVerdict.keyDifferentiators.map((diff, i) => (
                                <span key={i} className="px-4 py-2 rounded-full bg-white text-indigo-700 text-sm font-medium border border-indigo-200 shadow-sm">
                                    {diff}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Winner/Loser Analysis Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                        {/* Why You're Winning (if winning) OR Competitor Strengths */}
                        <div className={`rounded-xl p-5 ${isWinning ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                {isWinning ? (
                                    <>
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        <h4 className="font-bold text-emerald-700">Why You're Winning</h4>
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="w-5 h-5 text-rose-600" />
                                        <h4 className="font-bold text-rose-700">Competitor Strengths</h4>
                                    </>
                                )}
                            </div>
                            <ul className="space-y-3">
                                {winningCategories.slice(0, 3).map((cat, i) => (
                                    <li key={i} className={`flex items-start gap-2 text-sm ${isWinning ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span><strong>{cat.name}:</strong> You lead by {Math.round(cat.yourScore - cat.competitorScore)} points</span>
                                    </li>
                                ))}
                                {winningCategories.length === 0 && (
                                    <li className="text-slate-500 text-sm italic">No winning categories yet</li>
                                )}
                            </ul>
                        </div>

                        {/* Areas to Improve (if losing) OR Your Advantages */}
                        <div className={`rounded-xl p-5 ${!isWinning ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-sky-500/10 border border-sky-500/20'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                {!isWinning ? (
                                    <>
                                        <Zap className="w-5 h-5 text-amber-600" />
                                        <h4 className="font-bold text-amber-700">Priority Improvements</h4>
                                    </>
                                ) : (
                                    <>
                                        <TrendingDown className="w-5 h-5 text-sky-600" />
                                        <h4 className="font-bold text-sky-700">Areas Needing Attention</h4>
                                    </>
                                )}
                            </div>
                            <ul className="space-y-3">
                                {losingCategories.slice(0, 3).map((cat, i) => (
                                    <li key={i} className={`flex items-start gap-2 text-sm ${!isWinning ? 'text-amber-700' : 'text-sky-700'}`}>
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span><strong>{cat.name}:</strong> Behind by {Math.round(Math.abs(cat.yourScore - cat.competitorScore))} points</span>
                                    </li>
                                ))}
                                {losingCategories.length === 0 && (
                                    <li className="text-slate-500 text-sm italic">All categories winning!</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </section>
            )}

            {/* ===== PRIORITY RECOMMENDATIONS ===== */}
            {report.recommendations && report.recommendations.length > 0 && (
                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Priority Recommendations
                    </h3>
                    <div className="space-y-3">
                        {report.recommendations.slice(0, 3).map((rec, i) => (
                            <div key={i} className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${rec.priority === 'high' ? 'bg-gradient-to-br from-rose-500 to-rose-600' :
                                        rec.priority === 'medium' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                                            'bg-gradient-to-br from-slate-400 to-slate-500'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{rec.title}</h4>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${rec.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                                                rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {rec.priority}
                                            </span>
                                        </div>
                                        <p className="text-slate-600">{rec.description}</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

// ============================================
// CATEGORY PERFORMANCE CONTENT
// ============================================

function CategoryPerformanceContent({
    categories,
    yourDomain,
    competitorDomain
}: {
    categories: Category[];
    yourDomain: string;
    competitorDomain: string;
}) {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-sky-600" />
                Category Performance Breakdown
            </h2>

            {categories.map((cat) => {
                const Icon = categoryIcons[cat.name] || BarChart3;
                const diff = cat.yourScore - cat.competitorScore;
                const isWinning = diff > 0;
                const isExpanded = expandedCategory === cat.name;

                return (
                    <div key={cat.name} className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                            className="w-full p-4 text-left hover:bg-slate-50 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isWinning ? 'bg-emerald-50 text-emerald-600' :
                                    diff < 0 ? 'bg-rose-50 text-rose-600' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-slate-900">{cat.name}</h4>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-emerald-600 font-bold">{Math.round(cat.yourScore)}</span>
                                            <span className="text-slate-400">vs</span>
                                            <span className="text-rose-600 font-bold">{Math.round(cat.competitorScore)}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isWinning ? 'bg-emerald-100 text-emerald-700' :
                                                diff < 0 ? 'bg-rose-100 text-rose-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {isWinning ? `+${Math.round(diff)}` : Math.round(diff)}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Score bars */}
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 w-12">You</span>
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                                    style={{ width: `${cat.yourScore}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 w-12">Them</span>
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-rose-500 rounded-full transition-all"
                                                    style={{ width: `${cat.competitorScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-200 space-y-4">
                                {/* Insights */}
                                {cat.insights && cat.insights.length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-semibold text-sky-600 mb-2 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4" /> Key Insights
                                        </h5>
                                        <ul className="space-y-2">
                                            {cat.insights.map((insight, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                    <span className="text-sky-500 mt-1">•</span>
                                                    <span>{insight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {cat.recommendations && cat.recommendations.length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-2">
                                            <Zap className="w-4 h-4" /> Recommendations
                                        </h5>
                                        <ul className="space-y-2">
                                            {cat.recommendations.map((rec, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                    <span className="text-amber-500 mt-1">→</span>
                                                    <span>{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Subcategories */}
                                {cat.subcategories && Object.keys(cat.subcategories).length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-semibold text-indigo-600 mb-2">Subcategory Scores</h5>
                                        <div className="grid gap-2">
                                            {Object.entries(cat.subcategories).map(([name, data]) => {
                                                const displayName = name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                                                const scoreColor = data.score >= 70 ? 'text-emerald-600' : data.score >= 50 ? 'text-amber-600' : 'text-rose-600';
                                                return (
                                                    <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                                                        <span className="text-sm text-slate-600">{displayName}</span>
                                                        <span className={`text-sm font-bold ${scoreColor}`}>{Math.round(data.score)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ============================================
// MAIN REPORT PAGE
// ============================================

export default function ReportPage() {
    const params = useParams();
    const { user, isLoading: authLoading } = useAuth();
    const [report, setReport] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<NavCategory>('summary');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const analysisId = params?.id as string;

    useEffect(() => {
        if (analysisId) {
            loadReport();
        }
    }, [analysisId]);

    const loadReport = async () => {
        setIsLoading(true);
        try {
            const response = await api.getFullReport(analysisId);
            if (response.success && response.data) {
                const data = response.data as any;
                const computedStatus = data.yourScore > data.competitorScore ? 'winning'
                    : data.yourScore < data.competitorScore ? 'losing'
                        : 'tied';

                const categoriesWithStatus = (data.categories || []).map((cat: any) => ({
                    ...cat,
                    status: cat.status || (cat.yourScore > cat.competitorScore ? 'winning'
                        : cat.yourScore < cat.competitorScore ? 'losing'
                            : 'tied')
                }));

                setReport({
                    ...data,
                    status: data.status || computedStatus,
                    categories: categoriesWithStatus,
                });
            } else {
                setError(response.error?.message || 'Failed to load report');
            }
        } catch (err) {
            setError('Failed to load report');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 rounded-full border-4 border-sky-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Brain className="w-10 h-10 text-sky-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Building Your Report</h2>
                    <p className="text-slate-500">Analyzing competitive intelligence data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !report) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Report Not Found</h2>
                    <p className="text-slate-500 mb-8">{error || 'Unable to load this report'}</p>
                    <Link href="/dashboard">
                        <Button className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8">
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Extract domains for display - with safe fallbacks
    const safeGetHostname = (url: string | undefined | null): string => {
        if (!url) return 'unknown';
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'unknown';
        }
    };
    const yourDomain = safeGetHostname(report.yourUrl);
    const competitorDomain = safeGetHostname(report.competitorUrl);
    const intelligenceReport = report.intelligenceReport;

    // Helper to find category by name
    const findCategory = (name: string) => report.categories.find(c => c.name === name);

    // Render content based on active category
    const renderContent = () => {
        switch (activeCategory) {
            case 'summary':
                return <OverviewContent report={report} yourDomain={yourDomain} competitorDomain={competitorDomain} />;
            case 'technical-seo': {
                const cat = findCategory('Technical SEO');
                return (
                    <TechnicalSeoDetail
                        yourData={{
                            score: report.v3Analysis?.your?.technicalSeo?.score ?? cat?.yourScore ?? 0,
                            subcategories: report.v3Analysis?.your?.technicalSeo?.subcategories ?? cat?.subcategories ?? {},
                            insights: report.v3Analysis?.your?.technicalSeo?.insights ?? cat?.insights ?? [],
                            recommendations: report.v3Analysis?.your?.technicalSeo?.recommendations ?? cat?.recommendations ?? []
                        }}
                        competitorData={{
                            score: report.v3Analysis?.competitor?.technicalSeo?.score ?? cat?.competitorScore ?? 0,
                            subcategories: report.v3Analysis?.competitor?.technicalSeo?.subcategories ?? {},
                            insights: report.v3Analysis?.competitor?.technicalSeo?.insights ?? [],
                            recommendations: report.v3Analysis?.competitor?.technicalSeo?.recommendations ?? []
                        }}
                        yourPerformance={report.v3Analysis?.yourPerformance}
                        competitorPerformance={report.v3Analysis?.competitorPerformance}
                        yourDomain={yourDomain}
                        competitorDomain={competitorDomain}
                        backlinkComparison={report.v3Analysis?.backlinkComparison}
                        serpComparison={report.v3Analysis?.serpComparison}
                    />
                );
            }
            case 'on-page-seo': {
                const cat = findCategory('On-Page SEO');
                return (
                    <OnPageSeoDetail
                        yourData={{
                            score: report.v3Analysis?.your?.onpageSeo?.score ?? cat?.yourScore ?? 0,
                            subcategories: report.v3Analysis?.your?.onpageSeo?.subcategories ?? cat?.subcategories ?? {},
                            insights: report.v3Analysis?.your?.onpageSeo?.insights ?? cat?.insights ?? [],
                            recommendations: report.v3Analysis?.your?.onpageSeo?.recommendations ?? cat?.recommendations ?? []
                        }}
                        competitorData={{
                            score: report.v3Analysis?.competitor?.onpageSeo?.score ?? cat?.competitorScore ?? 0,
                            subcategories: report.v3Analysis?.competitor?.onpageSeo?.subcategories ?? {},
                            insights: report.v3Analysis?.competitor?.onpageSeo?.insights ?? [],
                            recommendations: report.v3Analysis?.competitor?.onpageSeo?.recommendations ?? []
                        }}
                        yourDomain={yourDomain}
                        competitorDomain={competitorDomain}
                    />
                );
            }
            case 'aeo-readiness': {
                const cat = findCategory('AEO Readiness');
                return (
                    <AeoReadinessDetail
                        yourData={{
                            score: report.v3Analysis?.your?.aeoReadiness?.score ?? cat?.yourScore ?? 0,
                            subcategories: report.v3Analysis?.your?.aeoReadiness?.subcategories ?? cat?.subcategories ?? {},
                            insights: report.v3Analysis?.your?.aeoReadiness?.insights ?? cat?.insights ?? [],
                            recommendations: report.v3Analysis?.your?.aeoReadiness?.recommendations ?? cat?.recommendations ?? [],
                            platformPresence: report.v3Analysis?.your?.aeoReadiness?.platformPresence
                        }}
                        competitorData={{
                            score: report.v3Analysis?.competitor?.aeoReadiness?.score ?? cat?.competitorScore ?? 0,
                            subcategories: report.v3Analysis?.competitor?.aeoReadiness?.subcategories ?? {},
                            insights: report.v3Analysis?.competitor?.aeoReadiness?.insights ?? [],
                            recommendations: report.v3Analysis?.competitor?.aeoReadiness?.recommendations ?? [],
                            platformPresence: report.v3Analysis?.competitor?.aeoReadiness?.platformPresence
                        }}
                        yourDomain={yourDomain}
                        competitorDomain={competitorDomain}
                    />
                );
            }
            case 'topical-authority': {
                const cat = findCategory('Topical Authority');
                return (
                    <TopicalAuthorityDetail
                        yourData={{
                            score: report.v3Analysis?.your?.topicalAuthority?.score ?? cat?.yourScore ?? 0,
                            subcategories: report.v3Analysis?.your?.topicalAuthority?.subcategories ?? {},
                            insights: report.v3Analysis?.your?.topicalAuthority?.insights ?? [],
                            recommendations: report.v3Analysis?.your?.topicalAuthority?.recommendations ?? [],
                            entityAnalysis: report.v3Analysis?.your?.topicalAuthority?.entityAnalysis,
                            topicAnalysis: report.v3Analysis?.your?.topicalAuthority?.topicAnalysis,
                            authorityLevel: report.v3Analysis?.your?.topicalAuthority?.authorityLevel
                        }}
                        competitorData={{
                            score: report.v3Analysis?.competitor?.topicalAuthority?.score ?? cat?.competitorScore ?? 0,
                            subcategories: report.v3Analysis?.competitor?.topicalAuthority?.subcategories ?? {},
                            insights: report.v3Analysis?.competitor?.topicalAuthority?.insights ?? [],
                            recommendations: report.v3Analysis?.competitor?.topicalAuthority?.recommendations ?? [],
                            entityAnalysis: report.v3Analysis?.competitor?.topicalAuthority?.entityAnalysis,
                            topicAnalysis: report.v3Analysis?.competitor?.topicalAuthority?.topicAnalysis,
                            authorityLevel: report.v3Analysis?.competitor?.topicalAuthority?.authorityLevel
                        }}
                        yourDomain={yourDomain}
                        competitorDomain={competitorDomain}
                    />
                );
            }
            case 'brand-voice': {
                const cat = findCategory('Brand Voice');
                return (
                    <BrandVoiceDetail
                        yourData={{
                            score: report.v3Analysis?.your?.brandVoice?.score ?? cat?.yourScore ?? 0,
                            subcategories: report.v3Analysis?.your?.brandVoice?.subcategories ?? cat?.subcategories ?? {},
                            insights: report.v3Analysis?.your?.brandVoice?.insights ?? cat?.insights ?? [],
                            recommendations: report.v3Analysis?.your?.brandVoice?.recommendations ?? cat?.recommendations ?? [],
                            voiceDetails: report.v3Analysis?.your?.brandVoice?.voiceDetails
                        }}
                        competitorData={{
                            score: report.v3Analysis?.competitor?.brandVoice?.score ?? cat?.competitorScore ?? 0,
                            subcategories: report.v3Analysis?.competitor?.brandVoice?.subcategories ?? {},
                            insights: report.v3Analysis?.competitor?.brandVoice?.insights ?? [],
                            recommendations: report.v3Analysis?.competitor?.brandVoice?.recommendations ?? [],
                            voiceDetails: report.v3Analysis?.competitor?.brandVoice?.voiceDetails
                        }}
                        yourDomain={yourDomain}
                        competitorDomain={competitorDomain}
                    />
                );
            }
            case 'ux-engagement': {
                const cat = findCategory('UX/Engagement');
                return (
                    <UxEngagementDetail
                        yourData={{
                            score: report.v3Analysis?.your?.uxEngagement?.score ?? cat?.yourScore ?? 0,
                            subcategories: report.v3Analysis?.your?.uxEngagement?.subcategories ?? cat?.subcategories ?? {},
                            insights: report.v3Analysis?.your?.uxEngagement?.insights ?? cat?.insights ?? [],
                            recommendations: report.v3Analysis?.your?.uxEngagement?.recommendations ?? cat?.recommendations ?? []
                        }}
                        competitorData={{
                            score: report.v3Analysis?.competitor?.uxEngagement?.score ?? cat?.competitorScore ?? 0,
                            subcategories: report.v3Analysis?.competitor?.uxEngagement?.subcategories ?? {},
                            insights: report.v3Analysis?.competitor?.uxEngagement?.insights ?? [],
                            recommendations: report.v3Analysis?.competitor?.uxEngagement?.recommendations ?? []
                        }}
                        yourDomain={yourDomain}
                        competitorDomain={competitorDomain}
                    />
                );
            }
            case 'revenue':
                return <RevenueCalculator report={report} />;
            case 'gameplan':
                if (intelligenceReport) {
                    return <IntelligenceReport data={intelligenceReport} yourDomain={yourDomain} competitorDomain={competitorDomain} />;
                }
                return <NoDataMessage section="Game Plan" />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex">
            {/* Left Sidebar */}
            <LeftSidebar
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                yourDomain={yourDomain}
                competitorDomain={competitorDomain}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 min-h-screen lg:ml-0">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            <Menu className="w-5 h-5 text-slate-700" />
                        </button>
                        <div className="text-center">
                            <h1 className="text-sm font-bold text-slate-900">{yourDomain}</h1>
                            <p className="text-xs text-slate-500">vs {competitorDomain}</p>
                        </div>
                        <div className="w-10" /> {/* Spacer for centering */}
                    </div>
                </header>

                {/* Content Area */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Scoring Summary */}
                    <ScoringSummary
                        yourScore={report.yourScore}
                        competitorScore={report.competitorScore}
                        yourDomain={yourDomain}
                        competitorDomain={competitorDomain}
                        createdAt={report.createdAt}
                    />

                    {/* Section Title */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            {(() => {
                                const navItem = navigationItems.find(n => n.id === activeCategory);
                                if (navItem) {
                                    const Icon = navItem.icon;
                                    return (
                                        <>
                                            <Icon className="w-6 h-6 text-sky-600" />
                                            {navItem.label}
                                        </>
                                    );
                                }
                                return null;
                            })()}
                        </h2>
                    </div>

                    {/* Dynamic Content */}
                    {renderContent()}

                    {/* Footer CTA */}
                    <section className="text-center py-16 mt-12">
                        <div className="relative inline-block">
                            <div className="p-10 rounded-3xl bg-white border border-slate-200 shadow-lg">
                                <Trophy className="w-14 h-14 text-amber-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to Dominate AI Search?</h3>
                                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                    Schedule a strategy call to implement these recommendations.
                                </p>
                                <Button className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-10 py-6 text-lg h-auto shadow-lg">
                                    Book Strategy Call
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

// ============================================
// NO DATA MESSAGE COMPONENT
// ============================================

function NoDataMessage({ section }: { section: string }) {
    return (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">{section} Data Unavailable</h3>
            <p className="text-slate-500">
                This analysis may have been run before the Intelligence Engine was enabled,
                or the data generation may have failed. Run a new analysis to see the full report.
            </p>
        </div>
    );
}
