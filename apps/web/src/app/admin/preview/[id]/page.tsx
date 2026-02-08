'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
    Target, Download, CheckCircle, BarChart3, Sparkles, Zap,
    ArrowLeft, Flame, Rocket, Star, MessageSquare,
    Layout, Link2, Brain, FileText, Map,
    DollarSign, Calculator, Users, Percent, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IntelligenceReport } from '@/components/intelligence-report';
import { TechnicalSeoDetail } from '@/components/category-details/TechnicalSeoDetail';
import { BrandVoiceDetail } from '@/components/category-details/BrandVoiceDetail';
import { AeoReadinessDetail } from '@/components/category-details/AeoReadinessDetail';
import { UxEngagementDetail } from '@/components/category-details/UxEngagementDetail';
import { OnPageSeoDetail } from '@/components/category-details/OnPageSeoDetail';
import TopicalAuthorityDetail from '@/components/category-details/TopicalAuthorityDetail';
import { RefreshReportModal } from '@/components/RefreshReportModal';

// Types
interface Subcategory { score: number; weight: number; evidence: string[]; issues: string[]; }
interface Category { name: string; icon: string; yourScore: number; competitorScore: number; status: 'winning' | 'losing' | 'tied'; insights: string[]; recommendations: string[]; subcategories?: Record<string, Subcategory>; }
interface Recommendation { priority: 'high' | 'medium' | 'low'; title: string; description: string; impact: string; }
interface CategoryAnalysis { score: number; subcategories: Record<string, Subcategory>; insights: string[]; recommendations: string[]; }
interface PerformanceData { scores?: { performance: number; accessibility: number; seo: number; bestPractices: number }; metrics?: { lcp: number; cls: number; fcp: number; ttfb: number; tti: number; si: number }; opportunities?: { title: string; savings?: number }[]; diagnostics?: { title: string; description: string }[]; }
interface V3Analysis { technicalSeo: CategoryAnalysis; onpageSeo: CategoryAnalysis; topicalAuthority: CategoryAnalysis & { entityAnalysis?: any; topicAnalysis?: any; authorityLevel?: string }; aeoReadiness: CategoryAnalysis; brandVoice: CategoryAnalysis & { voiceDetails?: any }; uxEngagement: CategoryAnalysis; primaryScore: number; }
interface ContentGapAI { topicsMissing: { topic: string; importance: 'critical' | 'high' | 'medium' | 'low'; competitorCoverage: string; yourGap: string; recommendation: string }[]; depthGaps: { area: string; competitorDepth: string; yourDepth: string; recommendation: string }[]; formatGaps: string[]; quickWins: string[]; strategicPriorities: string[]; gapScore: number; executiveSummary: string; }
interface EEATSignals { overallScore: number; experience: { score: number; firstPersonNarratives: number; caseStudies: number; practicalExamples: number; beforeAfterContent: boolean; clientTestimonials: number; evidence: string[] }; expertise: { score: number; authorsDetected: { name: string; credentials: string[]; socialProfiles: string[]; isVerified: boolean }[]; credentialsFound: string[]; technicalDepth: number; specializationClarity: number; industryTerminology: number; evidence: string[] }; authoritativeness: { score: number; wikipediaPresence: boolean; wikidataEntity: boolean; pressmentions: number; industryAwards: string[]; partnerships: string[]; mediaCoverage: boolean; evidence: string[] }; trustworthiness: { score: number; contactInfoVisible: boolean; physicalAddress: boolean; phoneNumber: boolean; privacyPolicy: boolean; termsOfService: boolean; secureConnection: boolean; reviewsIntegration: boolean; transparencyScore: number; evidence: string[] }; comparison?: { yourEEATScore: number; competitorEEATScore: number; yourStrengths: string[]; competitorStrengths: string[]; recommendations: string[] } }
interface KeywordGapItem { keyword: string; searchVolume: number; yourPosition: number | null; competitorPosition: number | null; keywordDifficulty: number; cpc: number; trafficPotential: number; intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | 'unknown' }
interface KeywordGapResult { keywordsYouAreMissing: KeywordGapItem[]; keywordsOnlyYouHave: KeywordGapItem[]; sharedKeywords: KeywordGapItem[]; topOpportunities: KeywordGapItem[]; summary: { yourTotalKeywords: number; competitorTotalKeywords: number; missedOpportunityTraffic: number; sharedKeywordsCount: number; quickWins: number } }
interface ReferringDomain { domain: string; domainRank: number; backlinks: number; firstSeen: string; isDoFollow: boolean }
interface BacklinkQualityResult { domain: string; domainRank: number; totalBacklinks: number; referringDomains: number; referringDomainsDofollow: number; toxicScore: number; spamScore: number; newBacklinks30d: number; lostBacklinks30d: number; topReferringDomains: ReferringDomain[]; anchorTextDistribution: { type: 'branded' | 'exact' | 'partial' | 'naked_url' | 'other'; percentage: number; count: number }[]; linkTypes: { text: number; image: number; redirect: number; other: number } }
interface BacklinkComparison { you: BacklinkQualityResult | null; competitor: BacklinkQualityResult | null; winner: 'you' | 'competitor' | 'tie' | 'insufficient-data'; insights: string[] }
interface SerpFeatures { featuredSnippetCount: number; peopleAlsoAskCount: number; localPackPresent: boolean; imageCarouselCount: number; videoResultsCount: number; knowledgePanelPresent: boolean; sitelinksPresent: boolean; faqSchemaCount: number; reviewSchemaCount: number; productSchemaCount: number; recipeSchemaCount: number; eventSchemaCount: number; aiOverviewMentioned: boolean; featuredSnippetKeywords: string[]; paaQuestions: string[] }
interface SerpComparison { you: SerpFeatures; competitor: SerpFeatures; winner: 'you' | 'competitor' | 'tie'; insights: string[]; featureGaps: string[] }
interface ReportData { analysisId: string; yourUrl: string; competitorUrl: string; yourScore: number; competitorScore: number; status: 'winning' | 'losing' | 'tied'; categories: Category[]; aiSummary: string; recommendations: Recommendation[]; businessProfile?: { name: string; industry: string; services: string[] }; performance?: { yourLCP: number; competitorLCP: number }; performanceComparison?: { yourPerformance: number; competitorPerformance: number; yourLCP: number; competitorLCP: number }; v3Analysis?: { your: V3Analysis; competitor: V3Analysis; yourPerformance?: PerformanceData; competitorPerformance?: PerformanceData; contentGap?: ContentGapAI; eeat?: { you: EEATSignals; competitor: EEATSignals }; keywordGap?: KeywordGapResult; backlinkComparison?: BacklinkComparison; serpComparison?: SerpComparison }; intelligenceReport?: any; createdAt: string; }

const CATEGORY_CONFIG: Record<string, {
    icon: React.FC<{ className?: string }>,
    gradient: string,
    lightGradient: string,
    color: string,
    description: string,
    whyItMatters: string
}> = {
    'Technical SEO': {
        icon: Zap,
        gradient: 'from-amber-400 via-orange-500 to-red-500',
        lightGradient: 'from-amber-50 to-orange-50',
        color: 'text-amber-600',
        description: 'Site speed, mobile usability, and crawlability',
        whyItMatters: 'Technical issues prevent Google from finding and ranking your pages. Fix these first for the biggest impact.'
    },
    'On-Page SEO': {
        icon: BarChart3,
        gradient: 'from-indigo-400 via-purple-500 to-pink-500',
        lightGradient: 'from-indigo-50 to-purple-50',
        color: 'text-indigo-600',
        description: 'Title tags, meta descriptions, and keyword usage',
        whyItMatters: 'On-page elements tell Google what your pages are about. Poor optimization = wrong search results.'
    },
    'Topical Authority': {
        icon: Sparkles,
        gradient: 'from-teal-400 via-cyan-500 to-emerald-500',
        lightGradient: 'from-teal-50 to-cyan-50',
        color: 'text-teal-600',
        description: 'Entity SEO, topic coverage, and authority signals',
        whyItMatters: 'Topical authority shows Google you\'re an expert. Cover topics comprehensively with entity-rich content to dominate rankings.'
    },
    'AEO Readiness': {
        icon: Target,
        gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
        lightGradient: 'from-emerald-50 to-teal-50',
        color: 'text-emerald-600',
        description: 'AI search visibility and answer engine optimization',
        whyItMatters: 'AI assistants like ChatGPT and Google AI are the future of search. Be ready or be invisible.'
    },
    'Brand Voice/DNA': {
        icon: MessageSquare,
        gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
        lightGradient: 'from-violet-50 to-purple-50',
        color: 'text-violet-600',
        description: 'Unique messaging, brand DNA, and differentiation from competitors',
        whyItMatters: 'A distinctive voice builds trust and makes you memorable. Generic messaging loses customers to competitors with stronger brand identity.'
    },
    'UX & Engagement': {
        icon: Layout,
        gradient: 'from-sky-400 via-blue-500 to-indigo-500',
        lightGradient: 'from-sky-50 to-blue-50',
        color: 'text-sky-600',
        description: 'User experience and visitor engagement signals',
        whyItMatters: 'If visitors leave quickly, Google assumes your site isn\'t helpful and drops your rankings.'
    },

};

// Score Ring Component
function ScoreRing({ score, size = 80, gradient = 'emerald' }: { score: number; size?: number; gradient?: string }) {
    const radius = (size - 8) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    const colors: Record<string, string> = { emerald: '#10b981', rose: '#f43f5e', amber: '#f59e0b', purple: '#8b5cf6', sky: '#0ea5e9' };
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={8} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors[gradient] || colors.emerald} strokeWidth={8} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-black text-slate-900">{score}</span></div>
        </div>
    );
}

// Revenue Calculator Component
function RevenueCalculator({ report }: { report: ReportData }) {
    const [monthlyTraffic, setMonthlyTraffic] = useState(10000);
    const [conversionRate, setConversionRate] = useState(2.5);
    const [avgLTV, setAvgLTV] = useState(500);

    const scoreDiff = report.competitorScore - report.yourScore;
    const opportunityPercent = Math.max(0, scoreDiff * 0.5); // Each point = 0.5% potential lift
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

            {/* Input Controls */}
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

            {/* Results */}
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

// Category Detail Component
function CategoryDetail({ category, report: _report }: { category: Category; report: ReportData }) {
    const config = CATEGORY_CONFIG[category.name] || CATEGORY_CONFIG['Technical SEO'];
    const diff = category.yourScore - category.competitorScore;
    const isWinning = diff > 0;
    const Icon = config.icon;

    return (
        <div className="space-y-6">
            {/* Category Header */}
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{category.name}</h1>
                    <p className="text-sm text-slate-500">Deep analysis and strategic insights</p>
                </div>
            </div>

            {/* Score Comparison */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">Your Score</p>
                    <div className="text-5xl font-black text-emerald-600">{category.yourScore}</div>
                </div>
                <div className="p-5 rounded-xl bg-slate-100 border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Competitor</p>
                    <div className="text-5xl font-black text-slate-500">{category.competitorScore}</div>
                </div>
                <div className={`p-5 rounded-xl text-center ${isWinning ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-300' : diff < 0 ? 'bg-gradient-to-br from-rose-100 to-orange-100 border-rose-300' : 'bg-slate-100 border-slate-300'} border`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-600">Difference</p>
                    <div className={`text-5xl font-black ${isWinning ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                    </div>
                </div>
            </div>

            {/* Executive Summary */}
            <div className={`p-5 rounded-xl bg-gradient-to-br ${config.lightGradient} border border-slate-200`}>
                <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900">Executive Summary</h3>
                </div>
                <p className="text-slate-700">
                    {isWinning ? (
                        <>Your site excels in {category.name} with a <span className="font-bold text-emerald-600">+{diff} point</span> advantage. This represents strong competitive positioning that should be maintained and leveraged in marketing.</>
                    ) : diff < 0 ? (
                        <>You're trailing by <span className="font-bold text-rose-600">{Math.abs(diff)} points</span> in {category.name}. This gap is impacting your competitive position and likely costing leads. Prioritize the recommendations below.</>
                    ) : (
                        <>You're evenly matched in {category.name}. Focus on the recommendations to pull ahead and differentiate.</>
                    )}
                </p>
            </div>

            {/* Subcategories */}
            {category.subcategories && Object.keys(category.subcategories).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /> Subcategory Breakdown</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(category.subcategories).map(([name, sub]) => {
                            const scoreColor = sub.score >= 80 ? 'emerald' : sub.score >= 60 ? 'sky' : sub.score >= 40 ? 'amber' : 'rose';
                            return (
                                <div key={name} className={`p-4 rounded-xl bg-${scoreColor}-50 border border-${scoreColor}-200`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-slate-900 capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <ScoreRing score={sub.score} size={50} gradient={scoreColor} />
                                    </div>
                                    <div className="h-2 rounded-full bg-white overflow-hidden"><div className={`h-full bg-${scoreColor}-500 rounded-full`} style={{ width: `${sub.score}%` }} /></div>
                                    {sub.evidence?.length > 0 && <p className="text-xs text-slate-600 mt-2 truncate">✓ {sub.evidence[0]}</p>}
                                    {sub.issues?.length > 0 && <p className="text-xs text-rose-600 mt-1 truncate">⚠ {sub.issues[0]}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Insights */}
            {category.insights?.length > 0 && (
                <div className="bg-white rounded-xl border border-sky-200 p-5">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-sky-500" /> Key Insights</h3>
                    <div className="space-y-3">
                        {category.insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-sky-50 border border-sky-200">
                                <CheckCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-700">{insight}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {category.recommendations?.length > 0 && (
                <div className="bg-white rounded-xl border border-amber-200 p-5">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Recommended Actions</h3>
                    <div className="space-y-3">
                        {category.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                                <p className="text-sm text-slate-700">{rec}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Main Component
export default function AdminPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const analysisId = params.id as string;
    const [report, setReport] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('summary');
    const [showRefreshModal, setShowRefreshModal] = useState(false);

    useEffect(() => { if (analysisId) loadReport(); }, [analysisId]);

    const loadReport = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/v1/analysis/${analysisId}/full?admin=true`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setReport(data);
            else setError(data.message || 'Failed to load report');
        } catch { setError('Failed to load report'); }
        finally { setIsLoading(false); }
    };

    const tabs = useMemo(() => {
        if (!report) return [];
        // Map category names, converting 'Brand Voice' to 'Brand Voice/DNA'
        // Filter out 'Internal Structure' tab
        const catTabs = report.categories
            .filter(c => c.name !== 'Internal Structure')
            .map(c => {
                const displayName = c.name === 'Brand Voice' ? 'Brand Voice/DNA' : c.name;
                const tabId = c.name === 'Brand Voice' ? 'brand-voice-dna' : c.name.toLowerCase().replace(/\s+/g, '-');
                return {
                    id: tabId,
                    label: displayName,
                    icon: CATEGORY_CONFIG[displayName]?.icon || CATEGORY_CONFIG[c.name]?.icon || Zap,
                    isCategory: true,
                    originalName: c.name // Keep original name for category lookup
                };
            });

        // Find key tabs and reorder: Summary → AEO → Topical Authority → Brand Voice → UX → others
        const aeoTab = catTabs.find(t => t.id === 'aeo-readiness');
        const topicalAuthorityTab = catTabs.find(t => t.id === 'topical-authority');
        const brandVoiceTab = catTabs.find(t => t.id === 'brand-voice-dna');
        const uxTab = catTabs.find(t => t.id === 'ux-&-engagement');
        const otherTabs = catTabs.filter(t =>
            t.id !== 'aeo-readiness' &&
            t.id !== 'topical-authority' &&
            t.id !== 'brand-voice-dna' &&
            t.id !== 'ux-&-engagement'
        );

        return [
            { id: 'summary', label: 'Summary', icon: FileText, isCategory: false },
            ...(aeoTab ? [aeoTab] : []),                       // AEO Readiness first
            ...(topicalAuthorityTab ? [topicalAuthorityTab] : []), // Topical Authority second
            ...(brandVoiceTab ? [brandVoiceTab] : []),         // Brand Voice/DNA third
            ...(uxTab ? [uxTab] : []),                         // UX & Engagement fourth
            ...otherTabs,
            { id: 'revenue', label: 'Revenue Calculator', icon: Calculator, isCategory: false },
            { id: 'gameplan', label: 'Game Plan', icon: Map, isCategory: false },
        ];
    }, [report]);

    const activeCategory = useMemo(() => {
        if (!report) return null;
        // Handle brand-voice-dna tab specially
        if (activeTab === 'brand-voice-dna') {
            return report.categories.find(c => c.name === 'Brand Voice') || null;
        }
        return report.categories.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === activeTab) || null;
    }, [report, activeTab]);

    if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><Brain className="w-16 h-16 text-violet-600 mx-auto mb-4 animate-pulse" /><p className="text-slate-600">Loading...</p></div></div>;
    if (error || !report) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-rose-600">{error || 'Error'}</p></div>;

    const scoreDiff = report.yourScore - report.competitorScore;
    const isWinning = scoreDiff > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900">
            {/* Admin Banner */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 py-2 px-4 text-center">
                <span className="text-white font-bold text-sm">🔒 Admin Preview Mode</span>
            </div>

            {/* Header */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Back</Link>
                    <div className="flex items-center gap-2"><button onClick={() => setShowRefreshModal(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button><button className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium flex items-center gap-2"><Download className="w-4 h-4" /> PDF</button></div>
                </div>
            </header>

            <div className="flex max-w-7xl mx-auto">
                {/* Premium Sidebar */}
                <aside className="w-64 flex-shrink-0 border-r border-slate-200/50 bg-gradient-to-b from-white via-slate-50/50 to-white min-h-[calc(100vh-100px)] sticky top-[52px] self-start overflow-y-auto shadow-xl">
                    <div className="p-4">
                        {/* Brand Header - Premium Design */}
                        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden shadow-2xl">
                            {/* Animated background glow */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full blur-2xl animate-pulse" />
                                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-br from-violet-500/30 to-purple-500/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                            </div>

                            <div className="relative z-10">
                                {/* Your Brand */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                                            <span className="text-white font-black text-sm">{report.yourUrl?.charAt(0).toUpperCase() || 'Y'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Your Brand</p>
                                            <p className="text-sm font-bold text-white truncate">{report.businessProfile?.name || new URL(report.yourUrl).hostname.replace('www.', '')}</p>
                                        </div>
                                        <span className="text-2xl font-black text-emerald-400">{report.yourScore}</span>
                                    </div>
                                </div>

                                {/* VS Divider */}
                                <div className="flex items-center gap-3 my-3">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                                    <span className={`px-3 py-1 rounded-full text-xs font-black ${isWinning ? 'bg-emerald-500 text-white' : scoreDiff < 0 ? 'bg-rose-500 text-white' : 'bg-slate-600 text-white'} shadow-lg`}>
                                        {scoreDiff > 0 ? '↑' : scoreDiff < 0 ? '↓' : '='} {Math.abs(scoreDiff)}
                                    </span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                                </div>

                                {/* Competitor Brand */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                                            <span className="text-white font-black text-sm">{report.competitorUrl?.charAt(0).toUpperCase() || 'C'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Competitor</p>
                                            <p className="text-sm font-bold text-slate-300 truncate">{new URL(report.competitorUrl).hostname.replace('www.', '')}</p>
                                        </div>
                                        <span className="text-2xl font-black text-slate-400">{report.competitorScore}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Banner */}
                        <div className={`mb-4 px-4 py-2 rounded-xl text-center font-bold text-sm ${isWinning ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : scoreDiff < 0 ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white' : 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'} shadow-lg`}>
                            {isWinning ? '🏆 You\'re Winning!' : scoreDiff < 0 ? '⚡ Room to Improve' : '⚖️ Evenly Matched'}
                        </div>

                        {/* Section Label */}
                        <div className="mb-2 px-2">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Report Sections</p>
                        </div>

                        {/* Nav Tabs - Premium Style */}
                        <nav className="space-y-1">
                            {tabs.map((tab, _i) => {
                                const Icon = tab.icon;
                                const catName = (tab as any).originalName || tab.label;
                                const cat = tab.isCategory ? report.categories.find(c => c.name === catName) : null;
                                const catDiff = cat ? cat.yourScore - cat.competitorScore : 0;
                                return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 scale-[1.02]' : 'text-slate-600 hover:bg-slate-100 hover:scale-[1.01]'}`}>
                                        <Icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                                        <span className="truncate flex-1 text-left">{tab.label}</span>
                                        {cat && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catDiff > 0 ? 'bg-emerald-100 text-emerald-600' : catDiff < 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'} ${activeTab === tab.id ? 'bg-white/20 text-white' : ''}`}>{catDiff > 0 ? '+' : ''}{catDiff}</span>}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {activeTab === 'summary' && (
                        <div className="space-y-8">
                            {/* ========== HERO HEADER - Brand vs Brand ========== */}
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl">
                                {/* Animated background effects */}
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" />
                                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-full blur-3xl" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Title */}
                                    <div className="text-center mb-8">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Live Competitive Intelligence</span>
                                        </div>
                                        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
                                            Competitive Analysis Report
                                        </h1>
                                        <p className="text-slate-400 text-lg">Real-time analysis • AI-powered insights • Actionable recommendations</p>
                                    </div>

                                    {/* ========== BRAND vs BRAND SHOWDOWN ========== */}
                                    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
                                        {/* YOUR BRAND */}
                                        <div className="flex-1 max-w-sm text-center">
                                            <div className="relative inline-block mb-4">
                                                {/* Animated ring */}
                                                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                                                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                                                    <circle
                                                        cx="80" cy="80" r="70" fill="none"
                                                        stroke="url(#yourGradient)" strokeWidth="12"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${report.yourScore * 4.4} 440`}
                                                        className="transition-all duration-1000 ease-out"
                                                        style={{ filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))' }}
                                                    />
                                                    <defs>
                                                        <linearGradient id="yourGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#10b981" />
                                                            <stop offset="100%" stopColor="#14b8a6" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                {/* Score in center */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-5xl font-black text-white">{report.yourScore}</span>
                                                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Score</span>
                                                </div>
                                            </div>
                                            {/* Brand name */}
                                            <div className="space-y-2">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-sm font-bold text-emerald-400">YOUR BRAND</span>
                                                </div>
                                                <h2 className="text-2xl font-black text-white truncate px-4">
                                                    {report.businessProfile?.name || new URL(report.yourUrl).hostname.replace('www.', '')}
                                                </h2>
                                                <p className="text-sm text-slate-400 truncate">{report.yourUrl.replace(/^https?:\/\//, '').replace('www.', '')}</p>
                                            </div>
                                        </div>

                                        {/* VS Badge */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse">
                                                <span className="text-3xl font-black text-white">VS</span>
                                            </div>
                                            {/* Decorative rings */}
                                            <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                                            {/* Score difference badge */}
                                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full font-bold text-sm shadow-lg ${scoreDiff > 0 ? 'bg-emerald-500 text-white' : scoreDiff < 0 ? 'bg-rose-500 text-white' : 'bg-slate-500 text-white'
                                                }`}>
                                                {scoreDiff > 0 ? '+' : ''}{scoreDiff} pts
                                            </div>
                                        </div>

                                        {/* COMPETITOR BRAND */}
                                        <div className="flex-1 max-w-sm text-center">
                                            <div className="relative inline-block mb-4">
                                                {/* Animated ring */}
                                                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                                                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                                                    <circle
                                                        cx="80" cy="80" r="70" fill="none"
                                                        stroke="url(#competitorGradient)" strokeWidth="12"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${report.competitorScore * 4.4} 440`}
                                                        className="transition-all duration-1000 ease-out"
                                                        style={{ filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.5))' }}
                                                    />
                                                    <defs>
                                                        <linearGradient id="competitorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#f43f5e" />
                                                            <stop offset="100%" stopColor="#ef4444" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                {/* Score in center */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-5xl font-black text-white">{report.competitorScore}</span>
                                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Score</span>
                                                </div>
                                            </div>
                                            {/* Brand name */}
                                            <div className="space-y-2">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/20 border border-slate-500/30">
                                                    <Target className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-400">COMPETITOR</span>
                                                </div>
                                                <h2 className="text-2xl font-black text-slate-300 truncate px-4">
                                                    {new URL(report.competitorUrl).hostname.replace('www.', '')}
                                                </h2>
                                                <p className="text-sm text-slate-500 truncate">{report.competitorUrl.replace(/^https?:\/\//, '').replace('www.', '')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Banner */}
                                    <div className="mt-8 text-center">
                                        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-sm border ${isWinning
                                            ? 'bg-emerald-500/20 border-emerald-500/30'
                                            : scoreDiff < 0
                                                ? 'bg-rose-500/20 border-rose-500/30'
                                                : 'bg-slate-500/20 border-slate-500/30'
                                            }`}>
                                            {isWinning ? (
                                                <>
                                                    <Rocket className="w-6 h-6 text-emerald-400" />
                                                    <span className="text-lg font-bold text-emerald-400">You're Leading the Competition!</span>
                                                    <Star className="w-5 h-5 text-amber-400" />
                                                </>
                                            ) : scoreDiff < 0 ? (
                                                <>
                                                    <Flame className="w-6 h-6 text-rose-400" />
                                                    <span className="text-lg font-bold text-rose-400">Competitor is Ahead — Time to Fight Back!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-6 h-6 text-amber-400" />
                                                    <span className="text-lg font-bold text-amber-400">It's a Tie — Break Away!</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ========== CATEGORY BREAKDOWN SECTION ========== */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">Category Breakdown</h2>
                                        <p className="text-slate-500">Click any category to dive deep into insights and recommendations</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                            <span className="text-slate-600">Winning</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                                            <span className="text-slate-600">Losing</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {report.categories.map((cat, idx) => {
                                        const cfg = CATEGORY_CONFIG[cat.name] || CATEGORY_CONFIG['Technical SEO'];
                                        const d = cat.yourScore - cat.competitorScore;
                                        const catWinning = d > 0;
                                        return (
                                            <button
                                                key={cat.name}
                                                onClick={() => setActiveTab(cat.name.toLowerCase().replace(/\s+/g, '-'))}
                                                className="group relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] bg-white"
                                                style={{
                                                    borderColor: catWinning ? 'rgb(16 185 129 / 0.3)' : d < 0 ? 'rgb(244 63 94 / 0.3)' : 'rgb(148 163 184 / 0.3)',
                                                    animationDelay: `${idx * 100}ms`
                                                }}
                                            >
                                                {/* Gradient background on hover */}
                                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${cfg.lightGradient}`} />

                                                {/* Top accent line */}
                                                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cfg.gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />

                                                {/* Content */}
                                                <div className="relative z-10">
                                                    {/* Header row */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                                                                <cfg.icon className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-slate-900 text-lg group-hover:text-slate-800">{cat.name}</h3>
                                                                <p className="text-xs text-slate-500">{cfg.description}</p>
                                                            </div>
                                                        </div>
                                                        {/* Score diff badge */}
                                                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-black shadow-sm ${catWinning ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' :
                                                            d < 0 ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white' :
                                                                'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                                                            }`}>
                                                            {d > 0 ? '+' : ''}{d}
                                                        </div>
                                                    </div>

                                                    {/* Score comparison */}
                                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                                        <div>
                                                            <div className="flex items-baseline justify-between mb-2">
                                                                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">You</span>
                                                                <span className={`text-2xl font-black ${catWinning ? 'text-emerald-600' : 'text-slate-700'}`}>{cat.yourScore}</span>
                                                            </div>
                                                            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${catWinning ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-slate-400 to-slate-500'}`}
                                                                    style={{ width: `${cat.yourScore}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-baseline justify-between mb-2">
                                                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Competitor</span>
                                                                <span className={`text-2xl font-black ${d < 0 ? 'text-rose-600' : 'text-slate-500'}`}>{cat.competitorScore}</span>
                                                            </div>
                                                            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${d < 0 ? 'bg-gradient-to-r from-rose-400 to-red-500' : 'bg-gradient-to-r from-slate-300 to-slate-400'}`}
                                                                    style={{ width: `${cat.competitorScore}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* CTA */}
                                                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                                                        <span>View detailed analysis</span>
                                                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeCategory && (
                        activeTab === 'technical-seo' ? (
                            (() => {
                                console.log('[AdminPreview] report.v3Analysis:', report.v3Analysis);
                                console.log('[AdminPreview] report.v3Analysis?.your:', report.v3Analysis?.your);
                                console.log('[AdminPreview] report.v3Analysis?.your?.technicalSeo:', report.v3Analysis?.your?.technicalSeo);
                                return null;
                            })(),
                            <TechnicalSeoDetail
                                yourData={{
                                    score: report.v3Analysis?.your?.technicalSeo?.score ?? activeCategory.yourScore,
                                    subcategories: report.v3Analysis?.your?.technicalSeo?.subcategories ?? activeCategory.subcategories ?? {},
                                    insights: report.v3Analysis?.your?.technicalSeo?.insights ?? activeCategory.insights ?? [],
                                    recommendations: report.v3Analysis?.your?.technicalSeo?.recommendations ?? activeCategory.recommendations ?? []
                                }}
                                competitorData={{
                                    score: report.v3Analysis?.competitor?.technicalSeo?.score ?? activeCategory.competitorScore,
                                    subcategories: report.v3Analysis?.competitor?.technicalSeo?.subcategories ?? {},
                                    insights: report.v3Analysis?.competitor?.technicalSeo?.insights ?? [],
                                    recommendations: report.v3Analysis?.competitor?.technicalSeo?.recommendations ?? []
                                }}
                                yourPerformance={report.v3Analysis?.yourPerformance}
                                competitorPerformance={report.v3Analysis?.competitorPerformance}
                                yourDomain={(() => { try { return new URL(report.yourUrl).hostname; } catch { return 'Your Site'; } })()}
                                competitorDomain={(() => { try { return new URL(report.competitorUrl).hostname; } catch { return 'Competitor'; } })()}
                                backlinkComparison={report.v3Analysis?.backlinkComparison}
                                serpComparison={report.v3Analysis?.serpComparison}
                            />
                        ) : activeTab === 'aeo-readiness' ? (
                            <AeoReadinessDetail
                                yourData={{
                                    score: report.v3Analysis?.your?.aeoReadiness?.score ?? activeCategory.yourScore,
                                    subcategories: report.v3Analysis?.your?.aeoReadiness?.subcategories ?? activeCategory.subcategories ?? {},
                                    insights: report.v3Analysis?.your?.aeoReadiness?.insights ?? activeCategory.insights ?? [],
                                    recommendations: report.v3Analysis?.your?.aeoReadiness?.recommendations ?? activeCategory.recommendations ?? [],
                                    platformPresence: (report.v3Analysis?.your?.aeoReadiness as any)?.platformPresence ?? undefined
                                }}
                                competitorData={{
                                    score: report.v3Analysis?.competitor?.aeoReadiness?.score ?? activeCategory.competitorScore,
                                    subcategories: report.v3Analysis?.competitor?.aeoReadiness?.subcategories ?? {},
                                    insights: report.v3Analysis?.competitor?.aeoReadiness?.insights ?? [],
                                    recommendations: report.v3Analysis?.competitor?.aeoReadiness?.recommendations ?? [],
                                    platformPresence: (report.v3Analysis?.competitor?.aeoReadiness as any)?.platformPresence ?? undefined
                                }}
                                yourDomain={(() => { try { return new URL(report.yourUrl).hostname; } catch { return 'Your Site'; } })()}
                                competitorDomain={(() => { try { return new URL(report.competitorUrl).hostname; } catch { return 'Competitor'; } })()}
                            />
                        ) : activeTab === 'topical-authority' ? (
                            <TopicalAuthorityDetail
                                yourData={{
                                    score: report.v3Analysis?.your?.topicalAuthority?.score ?? activeCategory?.yourScore ?? 0,
                                    subcategories: report.v3Analysis?.your?.topicalAuthority?.subcategories ?? {},
                                    insights: report.v3Analysis?.your?.topicalAuthority?.insights ?? [],
                                    recommendations: report.v3Analysis?.your?.topicalAuthority?.recommendations ?? [],
                                    entityAnalysis: (report.v3Analysis?.your?.topicalAuthority as any)?.entityAnalysis ?? undefined,
                                    topicAnalysis: (report.v3Analysis?.your?.topicalAuthority as any)?.topicAnalysis ?? undefined,
                                    authorityLevel: (report.v3Analysis?.your?.topicalAuthority as any)?.authorityLevel ?? undefined
                                }}
                                competitorData={{
                                    score: report.v3Analysis?.competitor?.topicalAuthority?.score ?? activeCategory?.competitorScore ?? 0,
                                    subcategories: report.v3Analysis?.competitor?.topicalAuthority?.subcategories ?? {},
                                    insights: report.v3Analysis?.competitor?.topicalAuthority?.insights ?? [],
                                    recommendations: report.v3Analysis?.competitor?.topicalAuthority?.recommendations ?? [],
                                    entityAnalysis: (report.v3Analysis?.competitor?.topicalAuthority as any)?.entityAnalysis ?? undefined,
                                    topicAnalysis: (report.v3Analysis?.competitor?.topicalAuthority as any)?.topicAnalysis ?? undefined,
                                    authorityLevel: (report.v3Analysis?.competitor?.topicalAuthority as any)?.authorityLevel ?? undefined
                                }}
                                yourDomain={(() => { try { return new URL(report.yourUrl).hostname; } catch { return 'Your Site'; } })()}
                                competitorDomain={(() => { try { return new URL(report.competitorUrl).hostname; } catch { return 'Competitor'; } })()}
                                contentGapFromAI={report.v3Analysis?.contentGap}
                                eeatSignals={report.v3Analysis?.eeat}
                            />
                        ) : activeTab === 'brand-voice-dna' ? (
                            <BrandVoiceDetail
                                yourData={{
                                    score: report.v3Analysis?.your?.brandVoice?.score ?? activeCategory.yourScore,
                                    subcategories: report.v3Analysis?.your?.brandVoice?.subcategories ?? activeCategory.subcategories ?? {},
                                    insights: report.v3Analysis?.your?.brandVoice?.insights ?? activeCategory.insights ?? [],
                                    recommendations: report.v3Analysis?.your?.brandVoice?.recommendations ?? activeCategory.recommendations ?? [],
                                    voiceDetails: report.v3Analysis?.your?.brandVoice?.voiceDetails ?? null
                                }}
                                competitorData={{
                                    score: report.v3Analysis?.competitor?.brandVoice?.score ?? activeCategory.competitorScore,
                                    subcategories: report.v3Analysis?.competitor?.brandVoice?.subcategories ?? {},
                                    insights: report.v3Analysis?.competitor?.brandVoice?.insights ?? [],
                                    recommendations: report.v3Analysis?.competitor?.brandVoice?.recommendations ?? [],
                                    voiceDetails: report.v3Analysis?.competitor?.brandVoice?.voiceDetails ?? null
                                }}
                                yourDomain={(() => { try { return new URL(report.yourUrl).hostname; } catch { return 'Your Site'; } })()}
                                competitorDomain={(() => { try { return new URL(report.competitorUrl).hostname; } catch { return 'Competitor'; } })()}
                            />
                        ) : activeTab === 'ux-&-engagement' ? (
                            <UxEngagementDetail
                                yourData={{
                                    score: report.v3Analysis?.your?.uxEngagement?.score ?? activeCategory.yourScore,
                                    subcategories: report.v3Analysis?.your?.uxEngagement?.subcategories ?? activeCategory.subcategories ?? {},
                                    insights: report.v3Analysis?.your?.uxEngagement?.insights ?? activeCategory.insights ?? [],
                                    recommendations: report.v3Analysis?.your?.uxEngagement?.recommendations ?? activeCategory.recommendations ?? []
                                }}
                                competitorData={{
                                    score: report.v3Analysis?.competitor?.uxEngagement?.score ?? activeCategory.competitorScore,
                                    subcategories: report.v3Analysis?.competitor?.uxEngagement?.subcategories ?? {},
                                    insights: report.v3Analysis?.competitor?.uxEngagement?.insights ?? [],
                                    recommendations: report.v3Analysis?.competitor?.uxEngagement?.recommendations ?? []
                                }}
                                yourDomain={(() => { try { return new URL(report.yourUrl).hostname; } catch { return 'Your Site'; } })()}
                                competitorDomain={(() => { try { return new URL(report.competitorUrl).hostname; } catch { return 'Competitor'; } })()}
                                yourScreenshot={(report.v3Analysis as any)?.yourScreenshot ?? null}
                                competitorScreenshot={(report.v3Analysis as any)?.competitorScreenshot ?? null}
                                yourFavicon={(report.v3Analysis as any)?.yourFavicon ?? null}
                                competitorFavicon={(report.v3Analysis as any)?.competitorFavicon ?? null}
                            />
                        ) : activeTab === 'on-page-seo' ? (
                            <OnPageSeoDetail
                                yourData={{
                                    score: report.v3Analysis?.your?.onpageSeo?.score ?? activeCategory.yourScore,
                                    subcategories: report.v3Analysis?.your?.onpageSeo?.subcategories ?? activeCategory.subcategories ?? {},
                                    insights: report.v3Analysis?.your?.onpageSeo?.insights ?? activeCategory.insights ?? [],
                                    recommendations: report.v3Analysis?.your?.onpageSeo?.recommendations ?? activeCategory.recommendations ?? []
                                }}
                                competitorData={{
                                    score: report.v3Analysis?.competitor?.onpageSeo?.score ?? activeCategory.competitorScore,
                                    subcategories: report.v3Analysis?.competitor?.onpageSeo?.subcategories ?? {},
                                    insights: report.v3Analysis?.competitor?.onpageSeo?.insights ?? [],
                                    recommendations: report.v3Analysis?.competitor?.onpageSeo?.recommendations ?? []
                                }}
                                yourDomain={(() => { try { return new URL(report.yourUrl).hostname; } catch { return 'Your Site'; } })()}
                                competitorDomain={(() => { try { return new URL(report.competitorUrl).hostname; } catch { return 'Competitor'; } })()}
                                keywordGap={report.v3Analysis?.keywordGap}
                            />
                        ) : (
                            <CategoryDetail category={activeCategory} report={report} />
                        )
                    )}

                    {activeTab === 'revenue' && <RevenueCalculator report={report} />}

                    {activeTab === 'gameplan' && (
                        <div className="space-y-6">
                            <h1 className="text-3xl font-black text-slate-900">Strategic Game Plan</h1>
                            {report.recommendations?.map((rec, i) => (
                                <div key={i} className={`p-5 rounded-xl border ${rec.priority === 'high' ? 'bg-rose-50 border-rose-200' : rec.priority === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rec.priority === 'high' ? 'bg-rose-500' : rec.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                            {rec.priority === 'high' ? <Flame className="w-5 h-5 text-white" /> : rec.priority === 'medium' ? <Zap className="w-5 h-5 text-white" /> : <Rocket className="w-5 h-5 text-white" />}
                                        </div>
                                        <div><h3 className="font-bold text-slate-900">{rec.title}</h3><p className="text-sm text-slate-600">{rec.description}</p><p className="text-sm text-emerald-600 font-semibold mt-1">Impact: {rec.impact}</p></div>
                                    </div>
                                </div>
                            ))}
                            {report.intelligenceReport && <IntelligenceReport data={report.intelligenceReport} yourDomain={report.yourUrl.replace(/^https?:\/\//, '')} competitorDomain={report.competitorUrl.replace(/^https?:\/\//, '')} />}
                        </div>
                    )}
                </main>
            </div>

            {/* Refresh Report Modal */}
            {showRefreshModal && (
                <RefreshReportModal
                    analysisId={analysisId}
                    onClose={() => setShowRefreshModal(false)}
                    onRefreshComplete={(newId) => {
                        setShowRefreshModal(false);
                        router.push(`/admin/preview/${newId}`);
                    }}
                />
            )}
        </div>
    );
}
