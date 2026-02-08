'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Target, FileText, Crown, Sparkles, ArrowRight,
    Plus, Clock, TrendingUp, ChevronRight, Loader2,
    Calendar, CheckCircle2, Settings, LogOut, CreditCard,
    LineChart, Eye, Zap, Users, AlertCircle, Shield, X,
    BarChart3, Globe, Search, Trophy
} from 'lucide-react';

interface Report {
    id: string;
    analysisId: string;
    yourUrl: string;
    competitorUrl: string;
    yourScore: number;
    competitorScore: number;
    createdAt: string;
    tier?: string;
    isPurchased?: boolean;
}

interface Subscription {
    plan: string | null;
    status: string | null;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    addOnPrice?: number;
}

interface TrendData {
    date: string;
    yourScore: number;
    competitorScore: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

    const [reports, setReports] = useState<Report[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'reports' | 'history'>('reports');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [processingCheckout, setProcessingCheckout] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // In-dashboard analysis state
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [analysisUrl, setAnalysisUrl] = useState('');
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState('');

    // Check if user is super admin
    const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER';

    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [reportsRes, subscriptionRes, historyRes] = await Promise.all([
                api.getUserReports(),
                api.getSubscriptionStatus(),
                api.getSubscriberHistory(),
            ]);

            if (reportsRes.success && reportsRes.data) {
                setReports(reportsRes.data.reports || []);
            }

            if (subscriptionRes.success && subscriptionRes.data) {
                setSubscription(subscriptionRes.data);
            }

            if (historyRes.success && historyRes.data) {
                setTrends(historyRes.data.trends || []);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/dashboard');
            return;
        }

        if (isAuthenticated) {
            loadDashboardData();
        }
    }, [isAuthenticated, authLoading, router, loadDashboardData]);

    const handleRunAnalysis = async () => {
        if (!analysisUrl.trim()) {
            setAnalysisError('Please enter a URL to analyze');
            return;
        }

        let urlToAnalyze = analysisUrl.trim();
        if (!urlToAnalyze.startsWith('http://') && !urlToAnalyze.startsWith('https://')) {
            urlToAnalyze = 'https://' + urlToAnalyze;
        }

        try {
            new URL(urlToAnalyze);
        } catch {
            setAnalysisError('Please enter a valid URL');
            return;
        }

        setAnalysisLoading(true);
        setAnalysisError('');

        try {
            const response = await api.startFreeAnalysis({
                url: urlToAnalyze,
                email: user?.email || '',
                firstName: user?.name?.split(' ')[0] || 'User',
                lastName: user?.name?.split(' ').slice(1).join(' ') || 'Admin',
                phone: '0000000000',
                businessName: 'Dashboard Analysis',
            });

            if (response.success && response.data?.analysisId) {
                const { analysisId, token } = response.data;
                router.push(`/analyze?id=${analysisId}&token=${token}&url=${encodeURIComponent(urlToAnalyze)}`);
                setShowAnalysisModal(false);
            } else {
                setAnalysisError(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to start analysis');
            }
        } catch (error: any) {
            setAnalysisError(error.message || 'Failed to start analysis');
        } finally {
            setAnalysisLoading(false);
        }
    };

    const handleUpgrade = async (tier: string, isSubscription: boolean) => {
        setProcessingCheckout(true);
        setCheckoutError(null);
        try {
            const response = await api.createCheckoutSession({
                tier,
                billingType: isSubscription ? 'subscription' : 'onetime',
            });
            if (response.success && response.data?.url) {
                window.location.href = response.data.url;
            } else {
                setCheckoutError(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to create checkout session');
                setProcessingCheckout(false);
            }
        } catch (error: any) {
            console.error('Error creating checkout:', error);
            setCheckoutError(error.message || 'An error occurred');
            setProcessingCheckout(false);
        }
    };

    const handleManageSubscription = async () => {
        try {
            const response = await api.createPortalSession();
            if (response.success && response.data?.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Error opening portal:', error);
        }
    };

    const isSubscriber = subscription?.status === 'ACTIVE';

    // Calculate win rate for stats
    const winRate = reports.length > 0
        ? Math.round((reports.filter(r => r.yourScore > r.competitorScore).length / reports.length) * 100)
        : 0;

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 animate-pulse" />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 opacity-50 blur-xl animate-pulse" />
                        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                            <Target className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Loading Dashboard</h2>
                    <p className="text-slate-500">Preparing your competitive intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
            {/* Premium Header with Gradient */}
            <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <span className="text-xl font-bold text-slate-900">
                                AEO<span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">.LIVE</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-3">
                            {/* Super Admin Badge with Shimmer - Clickable */}
                            {isSuperAdmin && (
                                <Link href="/admin" className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200 trust-shine hover:from-purple-100 hover:to-fuchsia-100 transition-colors cursor-pointer">
                                    <Shield className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-semibold text-purple-700">Super Admin</span>
                                </Link>
                            )}
                            {isSubscriber && (
                                <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 trust-shine">
                                    <Crown className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm font-semibold text-amber-700">{subscription.plan} Plan</span>
                                </div>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/settings')}
                                className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Premium Welcome Section */}
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
                        Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                        <span className="inline-block ml-2 animate-bounce">👋</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        Your competitive intelligence command center. Track, analyze, and dominate your market.
                    </p>
                </div>

                {/* Premium Stats Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {/* Total Reports */}
                    <div className="data-card p-6 shadow-sm border border-slate-200/60 stagger-enter">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 flex items-center justify-center ring-1 ring-sky-200/50">
                                <FileText className="w-6 h-6 text-sky-600" />
                            </div>
                            <div className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded-full">
                                Reports
                            </div>
                        </div>
                        <p className="text-4xl font-black text-slate-900 stat-counter mb-1">{reports.length}</p>
                        <p className="text-sm text-slate-500">Total analyses run</p>
                    </div>

                    {/* Average Score */}
                    <div className="data-card p-6 shadow-sm border border-slate-200/60 stagger-enter">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center ring-1 ring-emerald-200/50">
                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                Avg Score
                            </div>
                        </div>
                        <p className="text-4xl font-black text-slate-900 stat-counter mb-1">
                            {reports.length > 0
                                ? Math.round(reports.reduce((acc, r) => acc + r.yourScore, 0) / reports.length)
                                : '--'}
                        </p>
                        <p className="text-sm text-slate-500">Your average AEO score</p>
                    </div>

                    {/* Win Rate */}
                    <div className="data-card p-6 shadow-sm border border-slate-200/60 stagger-enter">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 flex items-center justify-center ring-1 ring-purple-200/50">
                                <Trophy className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${winRate >= 50
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-amber-600 bg-amber-50'
                                }`}>
                                {winRate >= 50 ? 'Winning' : 'Room to grow'}
                            </div>
                        </div>
                        <p className="text-4xl font-black text-slate-900 stat-counter mb-1">{winRate}%</p>
                        <p className="text-sm text-slate-500">Competitive win rate</p>
                    </div>

                    {/* Subscription Plan */}
                    <div className="data-card p-6 shadow-sm border border-slate-200/60 stagger-enter">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center ring-1 ring-amber-200/50">
                                <Crown className="w-6 h-6 text-amber-600" />
                            </div>
                            {isSubscriber && (
                                <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Active
                                </div>
                            )}
                        </div>
                        <p className="text-3xl font-black text-slate-900 mb-1">{subscription?.plan || 'Free'}</p>
                        <p className="text-sm text-slate-500">Current plan</p>
                    </div>
                </div>

                {/* Premium Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6 mb-10">
                    {/* Run Analysis CTA - Premium Electric Design */}
                    <div className="data-card relative overflow-hidden border border-sky-200/60 shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50 opacity-80" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-sky-400/10 to-indigo-400/10 rounded-full -translate-y-20 translate-x-20" />
                        <div className="relative p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        Run New Analysis
                                        {isSuperAdmin && (
                                            <span className="text-xs bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                                                Admin Bypass
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {isSuperAdmin ? 'Unlimited with admin privileges' : 'Get instant competitive insights'}
                                    </p>
                                </div>
                            </div>
                            <p className="text-slate-600 mb-4">
                                Analyze any competitor and uncover actionable intelligence in minutes.
                            </p>
                            {!isSuperAdmin && (
                                <p className="text-2xl font-black text-slate-900 mb-4">
                                    ${subscription?.addOnPrice || 49}
                                    <span className="text-sm text-slate-500 font-medium ml-2">
                                        {isSubscriber ? 'member price' : 'one-time'}
                                    </span>
                                </p>
                            )}
                            <Button
                                onClick={() => setShowAnalysisModal(true)}
                                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {isSuperAdmin ? 'Run Free Analysis' : 'Start Analysis'}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Upgrade CTA - only show if not a subscriber */}
                    {!isSubscriber ? (
                        <div className="data-card relative overflow-hidden border border-amber-200/60 shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 opacity-80" />
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full -translate-y-20 translate-x-20" />
                            <div className="relative p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                                        <Crown className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Upgrade to Pro</h3>
                                        <p className="text-sm text-slate-500">Automatic tracking & trends</p>
                                    </div>
                                </div>
                                <p className="text-slate-600 mb-4">
                                    Get automatic weekly analyses and track your progress over time.
                                </p>
                                <p className="text-amber-600 font-semibold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Starting at $39/mo • Cancel anytime
                                </p>
                                <Button
                                    onClick={() => setShowUpgradeModal(true)}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    View Plans
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="data-card relative overflow-hidden border border-emerald-200/60 shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50" />
                            <div className="relative p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                        <CreditCard className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Your Subscription</h3>
                                        <p className="text-sm text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Active & Running
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm bg-slate-50 rounded-lg p-3">
                                        <span className="text-slate-500">Plan</span>
                                        <span className="font-bold text-slate-900">{subscription.plan}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm bg-slate-50 rounded-lg p-3">
                                        <span className="text-slate-500">Status</span>
                                        <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            Active
                                        </span>
                                    </div>
                                    {subscription.currentPeriodEnd && (
                                        <div className="flex items-center justify-between text-sm bg-slate-50 rounded-lg p-3">
                                            <span className="text-slate-500">Renews</span>
                                            <span className="font-medium text-slate-900">
                                                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleManageSubscription}
                                    className="w-full border-slate-300 hover:bg-slate-50 text-slate-700 mt-4"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Manage Subscription
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Premium Tabs */}
                <div className="border-b border-slate-200 mb-8">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'reports'
                                ? 'text-sky-600'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <FileText className="w-4 h-4 inline mr-2" />
                            My Reports
                            {activeTab === 'reports' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'history'
                                ? 'text-sky-600'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <LineChart className="w-4 h-4 inline mr-2" />
                            Trends & History
                            {activeTab === 'history' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Reports List */}
                {activeTab === 'reports' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Your Reports</h2>
                            <span className="text-slate-500 text-sm">{reports.length} total</span>
                        </div>

                        {reports.length === 0 ? (
                            <div className="data-card p-12 text-center border border-slate-200/60">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                                    <FileText className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No reports yet</h3>
                                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                                    Run your first competitive analysis to uncover actionable intelligence.
                                </p>
                                <Button
                                    onClick={() => setShowAnalysisModal(true)}
                                    className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold shadow-lg"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Start Free Analysis
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {reports.map((report, index) => {
                                    const isWinning = report.yourScore > report.competitorScore;
                                    const delta = report.yourScore - report.competitorScore;

                                    return (
                                        <div
                                            key={report.id}
                                            className="report-card p-6 hover:border-sky-300 cursor-pointer group stagger-enter"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                            onClick={() => router.push(`/report/${report.analysisId}`)}
                                        >
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isWinning
                                                            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 ring-1 ring-emerald-200'
                                                            : 'bg-gradient-to-br from-amber-50 to-amber-100 ring-1 ring-amber-200'
                                                            }`}>
                                                            {isWinning ? (
                                                                <Trophy className="w-5 h-5 text-emerald-600" />
                                                            ) : (
                                                                <TrendingUp className="w-5 h-5 text-amber-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-slate-900 truncate">
                                                                {report.yourUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]}
                                                            </h3>
                                                            <p className="text-sm text-slate-500 truncate">
                                                                vs {report.competitorUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Score Bar */}
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <div className="flex-1">
                                                            <div className="score-bar">
                                                                <div
                                                                    className={`score-bar-fill ${isWinning ? 'winning' : 'neutral'}`}
                                                                    style={{ width: `${report.yourScore}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-slate-400 w-16 text-right">Your: {report.yourScore}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <div className="score-bar">
                                                                <div
                                                                    className="score-bar-fill neutral opacity-60"
                                                                    style={{ width: `${report.competitorScore}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-slate-400 w-16 text-right">Comp: {report.competitorScore}</span>
                                                    </div>

                                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(report.createdAt).toLocaleDateString()}
                                                        </span>
                                                        {report.tier && (
                                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">
                                                                {report.tier}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className={`delta-indicator ${isWinning ? 'positive' : 'negative'}`}>
                                                            {isWinning ? '+' : ''}{delta}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {isWinning ? 'Ahead' : 'Behind'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Trends & History */}
                {activeTab === 'history' && (
                    <div className="space-y-6">
                        {/* Trend Chart */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                Score Trends Over Time
                            </h3>

                            {trends.length > 0 ? (
                                <div className="h-64 relative">
                                    <div className="flex items-end justify-around h-full gap-2">
                                        {trends.slice(-12).map((trend, i) => {
                                            const maxScore = 100;
                                            const yourHeight = (trend.yourScore / maxScore) * 100;
                                            const compHeight = (trend.competitorScore / maxScore) * 100;

                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                    <div className="flex items-end gap-1 h-48">
                                                        <div
                                                            className="w-3 bg-gradient-to-t from-sky-600 to-sky-400 rounded-t"
                                                            style={{ height: `${yourHeight}%` }}
                                                            title={`Your Score: ${trend.yourScore}`}
                                                        />
                                                        <div
                                                            className="w-3 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t"
                                                            style={{ height: `${compHeight}%` }}
                                                            title={`Competitor: ${trend.competitorScore}`}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center justify-center gap-6 mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-sky-500" />
                                            <span className="text-sm text-slate-500">Your Score</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-400" />
                                            <span className="text-sm text-slate-500">Competitor</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    <div className="text-center">
                                        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>Not enough data to show trends yet.</p>
                                        <p className="text-sm">Run your first analysis to start tracking.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Historical Reports Timeline */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-sky-600" />
                                Report History
                            </h3>

                            {reports.length > 0 ? (
                                <div className="space-y-4">
                                    {reports.map((report, i) => (
                                        <div
                                            key={report.id}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/report/${report.analysisId}`)}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{report.yourUrl.replace(/^https?:\/\//, '')}</p>
                                                <p className="text-sm text-slate-500">
                                                    {new Date(report.createdAt).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-sky-600">{report.yourScore}</span>
                                                    <span className="text-slate-300 mx-2">/</span>
                                                    <span className="text-xl text-slate-500">{report.competitorScore}</span>
                                                </div>
                                                <Button variant="ghost" size="sm" className="text-slate-500">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>No report history yet.</p>
                                    <p className="text-sm">Your completed analyses will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* In-Dashboard Analysis Modal */}
            {showAnalysisModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Search className="w-6 h-6 text-sky-600" />
                                Run Analysis
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAnalysisModal(false);
                                    setAnalysisError('');
                                    setAnalysisUrl('');
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {isSuperAdmin && (
                            <div className="mb-4 p-3 rounded-lg bg-purple-50 border border-purple-200 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-purple-700">
                                    Super Admin: Unlimited free analyses
                                </span>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                Website URL to analyze
                            </label>
                            <input
                                type="url"
                                value={analysisUrl}
                                onChange={(e) => setAnalysisUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                            />
                            {analysisError && (
                                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {analysisError}
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleRunAnalysis}
                            disabled={analysisLoading}
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3"
                        >
                            {analysisLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Starting Analysis...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    {isSuperAdmin ? 'Run Free Analysis' : 'Start Analysis'}
                                </>
                            )}
                        </Button>

                        <p className="text-center text-sm text-slate-400 mt-4">
                            Analysis typically takes 2-3 minutes
                        </p>
                    </div>
                </div>
            )}

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-sky-600" />
                                    Choose Your Plan
                                </h2>
                                <p className="text-slate-500">Unlock powerful AI visibility insights</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowUpgradeModal(false);
                                    setCheckoutError(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-2"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {checkoutError && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <span className="text-sm text-red-700">{checkoutError}</span>
                            </div>
                        )}

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                {
                                    id: 'STARTER',
                                    name: 'Starter',
                                    price: 39,
                                    competitors: 1,
                                    color: 'border-slate-200',
                                    features: ['Track 1 competitor', 'Monthly reports', 'SEO health scoring', 'AEO readiness check'],
                                },
                                {
                                    id: 'GROWTH',
                                    name: 'Growth',
                                    price: 79,
                                    competitors: 3,
                                    color: 'border-sky-200 ring-2 ring-sky-100',
                                    popular: true,
                                    features: ['Track 3 competitors', 'Weekly reports', 'Full category breakdown', 'Priority support'],
                                },
                                {
                                    id: 'SCALE',
                                    name: 'Scale',
                                    price: 149,
                                    competitors: 10,
                                    color: 'border-indigo-200',
                                    features: ['Track 10 competitors', 'Daily reports', 'White-label reports', 'API access'],
                                },
                            ].map((plan) => (
                                <div key={plan.id} className={`relative bg-white border-2 rounded-2xl p-6 ${plan.color}`}>
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="bg-sky-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                    <div className="mb-4">
                                        <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                                        <span className="text-slate-500">/mo</span>
                                    </div>
                                    <ul className="space-y-2 mb-6">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        onClick={() => handleUpgrade(plan.id, true)}
                                        disabled={processingCheckout}
                                        className={`w-full ${plan.popular ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                                    >
                                        {processingCheckout ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Started'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
