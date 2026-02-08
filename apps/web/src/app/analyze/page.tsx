'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
    Target, Loader2, CheckCircle, ArrowRight,
    AlertTriangle, Plus, X, Search,
    Globe, Building2, Lock, Zap, BarChart3, Layout, Shield, Link2, Sparkles, Award
} from 'lucide-react';

// Types for analysis
interface Competitor {
    domain: string;
    name: string;
    logo?: string;
    selected: boolean;
}

interface AnalysisResult {
    yourScore: number;
    competitorScore: number;
    yourUrl: string;
    competitorUrl: string;
    categories: CategoryComparison[];
    analysisId: string;
}

interface CategoryComparison {
    name: string;
    icon: string;
    yourTeaser: string;
    competitorTeaser: string;
    locked: boolean;
}

// Icon map for categories
const iconMap: Record<string, React.FC<{ className?: string }>> = {
    'lightning': Zap,
    'bar-chart': BarChart3,
    'sparkle': Sparkles,
    'target': Target,
    'shield': Shield,
    'layout': Layout,
    'link': Link2,
    'trending': BarChart3,
};

type AnalysisStep = 'initializing' | 'select-competitor' | 'analyzing' | 'results' | 'error';

function AnalyzeContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get('url');

    const [step, setStep] = useState<AnalysisStep>('initializing');
    const [analysisId, setAnalysisId] = useState<string>('');
    const [analysisToken, setAnalysisToken] = useState<string>('');
    const [businessInfo, setBusinessInfo] = useState<{ name: string; domain: string } | null>(null);
    const [competitorScope, setCompetitorScope] = useState<'local' | 'national'>('local');
    const [suggestedCompetitors, setSuggestedCompetitors] = useState<Competitor[]>([]);
    const [isLoadingCompetitors, setIsLoadingCompetitors] = useState(true);
    const [customCompetitor, setCustomCompetitor] = useState('');
    const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState('');

    // Initialize analysis and load competitor suggestions
    useEffect(() => {
        const directId = searchParams.get('id');
        const directToken = searchParams.get('token');

        if (directId && directToken) {
            const loadCompetitors = async () => {
                try {
                    setAnalysisId(directId);
                    setAnalysisToken(directToken);

                    const competitorsResult = await api.getCompetitorSuggestions(directId, directToken);

                    if (competitorsResult.success && competitorsResult.data) {
                        const data = competitorsResult.data as {
                            business?: { name: string; industry?: string };
                            suggestions?: { domain: string; name: string }[]
                        };
                        const competitors = data.suggestions || [];
                        const analyzedDomain = searchParams.get('url') || url || '';

                        if (data.business?.name) {
                            setBusinessInfo({
                                name: data.business.name,
                                domain: analyzedDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
                            });
                        }

                        setSuggestedCompetitors(
                            competitors.map((c) => ({
                                domain: c.domain,
                                name: c.name,
                                selected: false,
                            }))
                        );
                    }

                    setStep('select-competitor');
                } catch (err) {
                    console.error('Failed to load competitors:', err);
                    setError((err as Error).message || 'Failed to load competitors');
                    setStep('error');
                } finally {
                    setIsLoadingCompetitors(false);
                }
            };

            loadCompetitors();
            return;
        }

        if (!url) {
            router.push('/');
            return;
        }

        const initializeAnalysis = async () => {
            try {
                const leadInfoStr = sessionStorage.getItem('leadInfo');
                if (!leadInfoStr) {
                    router.push('/');
                    return;
                }

                const leadInfo = JSON.parse(leadInfoStr);

                const startResult = await api.startFreeAnalysis({
                    url,
                    firstName: leadInfo.firstName,
                    lastName: leadInfo.lastName,
                    email: leadInfo.email,
                    phone: leadInfo.phone,
                    businessName: leadInfo.businessName,
                });

                if (!startResult.success || !startResult.data) {
                    throw new Error(startResult.error?.message || 'Failed to start analysis');
                }

                sessionStorage.removeItem('leadInfo');

                setAnalysisId(startResult.data.analysisId);
                setAnalysisToken(startResult.data.token);

                const competitorsResult = await api.getCompetitorSuggestions(
                    startResult.data.analysisId,
                    startResult.data.token
                );

                if (competitorsResult.success && competitorsResult.data) {
                    const data = competitorsResult.data as {
                        business?: { name: string; industry?: string };
                        suggestions?: { domain: string; name: string }[]
                    };
                    const competitors = data.suggestions || (Array.isArray(competitorsResult.data) ? competitorsResult.data : []);

                    if (data.business?.name) {
                        setBusinessInfo({
                            name: data.business.name,
                            domain: url.replace(/^https?:\/\//, '').replace(/\/$/, '')
                        });
                    } else {
                        setBusinessInfo({
                            name: leadInfo.businessName || 'Your Business',
                            domain: url.replace(/^https?:\/\//, '').replace(/\/$/, '')
                        });
                    }

                    setSuggestedCompetitors(
                        competitors.map((c: { domain: string; name: string }) => ({
                            domain: c.domain,
                            name: c.name,
                            selected: false,
                        }))
                    );
                }

                setStep('select-competitor');
            } catch (err) {
                console.error('Failed to initialize analysis:', err);
                setError((err as Error).message || 'Failed to initialize');
                setStep('error');
            } finally {
                setIsLoadingCompetitors(false);
            }
        };

        initializeAnalysis();
    }, [url, searchParams, router]);

    useEffect(() => {
        if (!analysisId || !analysisToken || step !== 'select-competitor') return;

        const refetchCompetitors = async () => {
            setIsLoadingCompetitors(true);
            try {
                const competitorsResult = await api.getCompetitorSuggestions(
                    analysisId,
                    analysisToken,
                    competitorScope
                );

                if (competitorsResult.success && competitorsResult.data) {
                    const data = competitorsResult.data as {
                        business?: { name: string; industry?: string };
                        suggestions?: { domain: string; name: string }[]
                    };
                    const competitors = data.suggestions || [];

                    setSuggestedCompetitors(
                        competitors.map((c) => ({
                            domain: c.domain,
                            name: c.name,
                            selected: false,
                        }))
                    );
                }
            } catch (err) {
                console.error('Failed to refetch competitors:', err);
            } finally {
                setIsLoadingCompetitors(false);
            }
        };

        refetchCompetitors();
    }, [competitorScope, analysisId, analysisToken, step]);

    const handleSelectCompetitor = (domain: string) => {
        setSelectedCompetitor(domain);
    };

    const handleAddCustomCompetitor = () => {
        if (!customCompetitor.trim()) return;

        let domain = customCompetitor.trim().toLowerCase();
        domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

        setSelectedCompetitor(domain);
        setCustomCompetitor('');
    };

    const pollAnalysisStatus = useCallback(async () => {
        if (!analysisId || !analysisToken) return;

        const statusResult = await api.getAnalysisStatus(analysisId, analysisToken);
        if (!statusResult.success || !statusResult.data) {
            throw new Error('Failed to get status');
        }

        setProgress(statusResult.data.progress);
        return statusResult.data;
    }, [analysisId, analysisToken]);

    const handleStartAnalysis = async () => {
        if (!selectedCompetitor || !url || !analysisId || !analysisToken) return;

        setStep('analyzing');
        setProgress(0);

        try {
            const selectResult = await api.selectCompetitorAndAnalyze(
                analysisId,
                analysisToken,
                selectedCompetitor
            );

            if (!selectResult.success) {
                throw new Error(selectResult.error?.message || 'Failed to start analysis');
            }

            const pollInterval = setInterval(async () => {
                try {
                    const status = await pollAnalysisStatus();
                    if (status?.status === 'complete') {
                        clearInterval(pollInterval);

                        const teaserResult = await api.getTeaserResults(analysisId, analysisToken);
                        if (!teaserResult.success || !teaserResult.data) {
                            throw new Error('Failed to get results');
                        }

                        setResult({
                            yourScore: teaserResult.data.yourScore,
                            competitorScore: teaserResult.data.competitorScore,
                            yourUrl: teaserResult.data.yourUrl,
                            competitorUrl: teaserResult.data.competitorUrl,
                            categories: teaserResult.data.categories,
                            analysisId: teaserResult.data.analysisId,
                        });
                        setStep('results');
                    } else if (status?.status === 'failed') {
                        clearInterval(pollInterval);
                        throw new Error('Analysis failed');
                    }
                } catch (err) {
                    clearInterval(pollInterval);
                    setError((err as Error).message);
                    setStep('error');
                }
            }, 1000);

        } catch (err) {
            setError((err as Error).message || 'Analysis failed');
            setStep('error');
        }
    };

    const directId = searchParams.get('id');
    const hasValidParams = url || (directId && searchParams.get('token'));
    if (!hasValidParams) {
        return null;
    }

    const handleReportBug = () => {
        const subject = `Bug Report - Analysis ${analysisId || 'unknown'}`;
        const body = `Error: ${error}\nURL: ${url}\nAnalysis ID: ${analysisId}`;
        window.open(`mailto:support@aeo.live?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    // Step 1: Initializing
    if (step === 'initializing') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                        <div className="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
                        <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
                            <Target className="w-8 h-8 text-sky-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Preparing Your Analysis</h2>
                    <p className="text-slate-500">Finding your top competitors...</p>
                </div>
            </div>
        );
    }

    // Step 2: Select Competitor
    if (step === 'select-competitor') {
        return (
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <nav className="border-b border-slate-200 bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-slate-900">
                                    AEO<span className="text-sky-600">.LIVE</span>
                                </span>
                            </Link>
                        </div>
                    </div>
                </nav>

                <main className="max-w-3xl mx-auto px-4 py-10">
                    {/* Your Business Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                                <Globe className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Analyzing</p>
                                <h2 className="text-xl font-bold text-slate-900">{businessInfo?.name || 'Your Business'}</h2>
                                <p className="text-sm text-slate-500">{businessInfo?.domain}</p>
                            </div>
                        </div>
                    </div>

                    {/* Competitor Selection Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Select a Competitor to Compare</h3>
                        <p className="text-slate-500 text-sm mb-6">Choose who you want to measure up against</p>

                        {/* Scope Toggle */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setCompetitorScope('local')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${competitorScope === 'local'
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                🏠 Local
                            </button>
                            <button
                                onClick={() => setCompetitorScope('national')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${competitorScope === 'national'
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                🌎 National
                            </button>
                        </div>

                        {/* Competitor List */}
                        {isLoadingCompetitors ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                                <span className="text-slate-500 ml-3">Finding your competitors...</span>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[320px] overflow-y-auto">
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-3">
                                    <Search className="w-3.5 h-3.5" />
                                    {suggestedCompetitors.length} competitors found
                                </p>
                                {suggestedCompetitors.slice(0, 10).map((competitor, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectCompetitor(competitor.domain)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${selectedCompetitor === competitor.domain
                                            ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20'
                                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${index < 3
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">{competitor.name}</p>
                                            <p className="text-sm text-slate-500 truncate">{competitor.domain}</p>
                                        </div>
                                        {selectedCompetitor === competitor.domain && (
                                            <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Custom Competitor Input */}
                        <div className="border-t border-slate-200 pt-4 mt-4">
                            <p className="text-xs text-slate-500 mb-2">Or add a specific competitor:</p>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter competitor domain..."
                                        value={customCompetitor}
                                        onChange={(e) => setCustomCompetitor(e.target.value)}
                                        className="w-full pl-10 pr-3 py-3 text-sm rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCompetitor()}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleAddCustomCompetitor}
                                    disabled={!customCompetitor.trim()}
                                    className="border-slate-300 text-slate-600 hover:bg-slate-50 px-4 h-12 rounded-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </div>
                            {selectedCompetitor && !suggestedCompetitors.find(c => c.domain === selectedCompetitor) && (
                                <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sm">
                                    <CheckCircle className="w-4 h-4 text-sky-600" />
                                    <span className="text-sky-700 truncate flex-1 font-medium">
                                        {selectedCompetitor}
                                    </span>
                                    <button
                                        onClick={() => setSelectedCompetitor('')}
                                        className="text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Start Analysis Button */}
                    <Button
                        size="lg"
                        className="w-full bg-sky-600 hover:bg-sky-700 text-lg font-semibold h-14 rounded-xl text-white shadow-lg"
                        disabled={!selectedCompetitor}
                        onClick={handleStartAnalysis}
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Run Full Comparison
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </main>
            </div>
        );
    }

    // Step 3: Analyzing
    if (step === 'analyzing') {
        const analysisSteps = [
            { name: 'Crawling your website', threshold: 15 },
            { name: 'Crawling competitor site', threshold: 35 },
            { name: 'Analyzing technical SEO', threshold: 50 },
            { name: 'Evaluating content quality', threshold: 65 },
            { name: 'Measuring AI visibility', threshold: 80 },
            { name: 'Generating your report', threshold: 95 },
        ];

        const currentStepIndex = analysisSteps.findIndex(s => progress < s.threshold);
        const currentAnalysisStep = analysisSteps[currentStepIndex >= 0 ? currentStepIndex : analysisSteps.length - 1];

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-full max-w-md px-4 text-center">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
                        {/* Animated Progress Ring */}
                        <div className="w-32 h-32 mx-auto mb-6 relative">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    fill="none"
                                    stroke="#e2e8f0"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    fill="none"
                                    stroke="url(#progressGradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(progress / 100) * 352} 352`}
                                    className="transition-all duration-500"
                                />
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#0ea5e9" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold text-slate-900">{progress}%</span>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 mb-2">Analyzing...</h2>
                        <p className="text-sky-600 font-medium mb-6">{currentAnalysisStep.name}</p>

                        {/* Progress Steps */}
                        <div className="space-y-2">
                            {analysisSteps.map((step, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${progress >= step.threshold
                                        ? 'bg-emerald-500'
                                        : progress >= (analysisSteps[i - 1]?.threshold || 0)
                                            ? 'bg-sky-500 animate-pulse'
                                            : 'bg-slate-200'
                                        }`}>
                                        {progress >= step.threshold ? (
                                            <CheckCircle className="w-3 h-3 text-white" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <span className={`text-sm ${progress >= step.threshold
                                        ? 'text-emerald-600 font-medium'
                                        : progress >= (analysisSteps[i - 1]?.threshold || 0)
                                            ? 'text-slate-900'
                                            : 'text-slate-400'
                                        }`}>
                                        {step.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 4: Error
    if (step === 'error') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-full max-w-md px-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-lg">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 mb-3">Analysis Failed</h1>
                        <p className="text-slate-500 mb-6">
                            {error || "We couldn't complete the comparison. Please try again."}
                        </p>

                        {error && (
                            <div className="bg-slate-50 rounded-lg p-3 mb-6 text-left">
                                <p className="text-xs text-slate-500 mb-1">Error Details:</p>
                                <code className="text-xs text-red-600 break-all">{error}</code>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <Link href="/">
                                <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl">
                                    Try Again
                                </Button>
                            </Link>

                            <button
                                onClick={handleReportBug}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Report Bug
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 5: Results - Premium Preview Page
    if (!result) return null;

    // Helper to safely get a numeric score (handles NaN, undefined, null)
    const safeScore = (score: number | undefined | null): number => {
        if (score === undefined || score === null || Number.isNaN(score)) {
            return 0;
        }
        return score;
    };

    const yourScore = safeScore(result.yourScore);
    const competitorScore = safeScore(result.competitorScore);

    const scoreDiff = yourScore - competitorScore;
    const isWinning = scoreDiff > 0;
    const isTied = scoreDiff === 0;

    // Extract domain names
    const yourDomain = (() => {
        try { return new URL(result.yourUrl).hostname.replace('www.', ''); }
        catch { return result.yourUrl; }
    })();
    const competitorDomain = (() => {
        try { return new URL(result.competitorUrl).hostname.replace('www.', ''); }
        catch { return result.competitorUrl; }
    })();

    // Count winning categories
    const winningCats = result.categories.filter(c =>
        c.yourTeaser.toLowerCase().includes('winning') || c.yourTeaser.toLowerCase().includes('ahead')
    ).length;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <nav className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900">
                                AEO<span className="text-sky-600">.LIVE</span>
                            </span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ============================================ */}
            {/* HERO SECTION - Dark Premium */}
            {/* ============================================ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 md:py-24 px-4">
                {/* Animated gradient orbs */}
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-sky-500/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/15 to-pink-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

                <div className="relative z-10 max-w-6xl mx-auto">
                    {/* Status Badge */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-sm font-medium">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            Analysis Complete
                            <Sparkles className="w-4 h-4 text-amber-400 ml-1" />
                        </div>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-center text-white mb-4">
                        {isTied ? (
                            <>You're <span className="text-amber-400">Neck and Neck</span></>
                        ) : isWinning ? (
                            <>You're <span className="text-emerald-400">Ahead</span> by {scoreDiff} Points!</>
                        ) : (
                            <>You're <span className="text-rose-400">Behind</span> by {Math.abs(scoreDiff)} Points</>
                        )}
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 text-center max-w-2xl mx-auto mb-12">
                        We analyzed 10+ ranking factors to compare your digital presence against your competitor
                    </p>

                    {/* Score Battle */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-12">
                        {/* Your Score */}
                        <div className="text-center">
                            <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto mb-4">
                                {/* Outer glow */}
                                <div className={`absolute inset-0 rounded-full ${isWinning ? 'bg-emerald-500/30' : 'bg-sky-500/30'} blur-xl animate-pulse`} />

                                {/* Score ring SVG */}
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                    <circle
                                        cx="60" cy="60" r="52"
                                        fill="none"
                                        stroke={isWinning ? "url(#greenGradPreview)" : "url(#blueGradPreview)"}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 52}`}
                                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - yourScore / 100)}`}
                                        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                                    />
                                    <defs>
                                        <linearGradient id="greenGradPreview" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#34d399" />
                                        </linearGradient>
                                        <linearGradient id="blueGradPreview" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#0ea5e9" />
                                            <stop offset="100%" stopColor="#38bdf8" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Center score */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-5xl md:text-6xl font-black ${isWinning ? 'text-emerald-400' : 'text-sky-400'}`}>
                                        {yourScore}
                                    </span>
                                    <span className="text-white/40 text-sm">/100</span>
                                </div>
                            </div>
                            <p className="text-white font-bold text-lg max-w-[180px] mx-auto truncate">{yourDomain}</p>
                            <p className="text-emerald-400 text-sm font-medium">Your Score</p>
                        </div>

                        {/* VS Badge with Delta */}
                        <div className="text-center">
                            <div className={`
                                w-28 h-28 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center
                                ${isWinning ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-2xl shadow-emerald-500/40' :
                                    scoreDiff < 0 ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-2xl shadow-rose-500/40' :
                                        'bg-gradient-to-br from-slate-500 to-slate-600'}
                            `}>
                                <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">Difference</span>
                                <span className="text-4xl md:text-5xl font-black text-white">
                                    {isWinning ? '+' : ''}{scoreDiff}
                                </span>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                {isWinning ? (
                                    <><Award className="w-5 h-5 text-emerald-400" /><span className="text-emerald-400 font-bold">You're Winning!</span></>
                                ) : scoreDiff < 0 ? (
                                    <><Target className="w-5 h-5 text-amber-400" /><span className="text-amber-400 font-bold">Room to Improve</span></>
                                ) : (
                                    <span className="text-slate-400 font-bold">Evenly Matched</span>
                                )}
                            </div>
                        </div>

                        {/* Competitor Score */}
                        <div className="text-center">
                            <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto mb-4">
                                {/* Outer glow */}
                                <div className={`absolute inset-0 rounded-full ${!isWinning && scoreDiff !== 0 ? 'bg-rose-500/20' : 'bg-slate-500/10'} blur-xl`} />

                                {/* Score ring SVG */}
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                    <circle
                                        cx="60" cy="60" r="52"
                                        fill="none"
                                        stroke={!isWinning && scoreDiff !== 0 ? "url(#roseGradPreview)" : "url(#slateGradPreview)"}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 52}`}
                                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - competitorScore / 100)}`}
                                        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                                    />
                                    <defs>
                                        <linearGradient id="roseGradPreview" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#f43f5e" />
                                            <stop offset="100%" stopColor="#fb7185" />
                                        </linearGradient>
                                        <linearGradient id="slateGradPreview" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#64748b" />
                                            <stop offset="100%" stopColor="#94a3b8" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Center score */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-5xl md:text-6xl font-black ${!isWinning && scoreDiff !== 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                        {competitorScore}
                                    </span>
                                    <span className="text-white/40 text-sm">/100</span>
                                </div>
                            </div>
                            <p className="text-white font-bold text-lg max-w-[180px] mx-auto truncate">{competitorDomain}</p>
                            <p className="text-slate-400 text-sm font-medium">Competitor</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* CATEGORY BREAKDOWN - With Locked Content */}
            {/* ============================================ */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-900 mb-3">Category Breakdown</h2>
                        <p className="text-slate-500">See how you compare across 7 critical performance areas</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        {result.categories.map((category, index) => {
                            const IconComponent = iconMap[category.icon] || Target;
                            const isLocked = category.locked;

                            return (
                                <div
                                    key={index}
                                    className={`
                                        relative overflow-hidden rounded-2xl border p-6 transition-all duration-300
                                        ${isLocked ? 'bg-slate-50/80 border-slate-200' : 'bg-white border-slate-200 hover:shadow-lg hover:border-sky-200'}
                                    `}
                                >
                                    {/* Top gradient accent */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />

                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                            <IconComponent className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg">{category.name}</h3>
                                        {isLocked && (
                                            <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                                                <Lock className="w-3 h-3" />
                                                Locked
                                            </div>
                                        )}
                                    </div>

                                    {/* Comparison Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl p-4 border border-sky-100">
                                            <p className="text-xs font-semibold text-sky-600 mb-1.5 uppercase tracking-wider">You</p>
                                            <p className="text-slate-700 text-sm leading-relaxed">{category.yourTeaser}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                                            <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Competitor</p>
                                            <p className="text-slate-600 text-sm leading-relaxed">{category.competitorTeaser}</p>
                                        </div>
                                    </div>

                                    {/* Locked overlay */}
                                    {isLocked && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent flex items-end justify-center pb-6 pointer-events-none">
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium shadow-lg">
                                                <Lock className="w-4 h-4" />
                                                Unlock Full Analysis
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* CTA SECTION - Premium Sales Push */}
            {/* ============================================ */}
            <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-sky-500 to-indigo-600 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-500 to-pink-600 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        Limited Time Offer
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                        {isWinning ? (
                            <>Ready to <span className="text-emerald-400">Dominate</span> Your Competition?</>
                        ) : (
                            <>Ready to <span className="text-sky-400">Close the Gap</span>?</>
                        )}
                    </h2>

                    <p className="text-xl text-white/70 mb-8 leading-relaxed">
                        Get your complete 50+ page intelligence report with actionable recommendations,
                        priority fixes, and a 90-day strategic roadmap to outrank your competition.
                    </p>

                    {/* Value props */}
                    <div className="grid md:grid-cols-3 gap-4 mb-10">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-white font-bold mb-1">50+ Page Report</h4>
                            <p className="text-white/50 text-sm">Detailed analysis of every ranking factor</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-white font-bold mb-1">Priority Action Items</h4>
                            <p className="text-white/50 text-sm">Know exactly what to fix first</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-white font-bold mb-1">90-Day Roadmap</h4>
                            <p className="text-white/50 text-sm">Step-by-step plan to win</p>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-xl px-12 h-16 font-bold text-white shadow-2xl shadow-sky-500/30 rounded-2xl"
                        onClick={() => router.push(`/checkout?id=${result.analysisId}`)}
                    >
                        <Sparkles className="w-6 h-6 mr-3" />
                        Unlock Full Report
                        <ArrowRight className="w-6 h-6 ml-3" />
                    </Button>

                    <p className="text-white/40 text-sm mt-6">
                        One-time payment • Instant access • 30-day money-back guarantee
                    </p>
                </div>
            </section>
        </div>
    );
}

export default function AnalyzePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-16 h-16 mx-auto">
                    <div className="w-full h-full rounded-full border-4 border-slate-200 border-t-sky-500 animate-spin" />
                </div>
            </div>
        }>
            <AnalyzeContent />
        </Suspense>
    );
}
