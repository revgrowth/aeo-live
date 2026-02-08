'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CreditCard, Sparkles, X, CheckCircle, Loader2 } from 'lucide-react';

interface RefreshEligibility {
    canRefresh: boolean;
    userType: 'admin' | 'subscriber' | 'one-time';
    creditsRemaining?: number;
    creditsUsed?: number;
    creditsTotal?: number;
    addOnPrice?: number;
    addOnPriceCents?: number;
    planType?: string;
    message?: string;
}

interface RefreshReportModalProps {
    analysisId: string;
    userId?: string;
    onClose: () => void;
    onRefreshComplete: (newAnalysisId: string) => void;
}

export function RefreshReportModal({
    analysisId,
    userId,
    onClose,
    onRefreshComplete
}: RefreshReportModalProps) {
    const [eligibility, setEligibility] = useState<RefreshEligibility | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Fetch eligibility on mount
    useEffect(() => {
        const checkEligibility = async () => {
            try {
                const params = new URLSearchParams();
                if (userId) params.set('userId', userId);

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/analysis/${analysisId}/refresh/check?${params}`
                );

                if (!res.ok) throw new Error('Failed to check eligibility');

                const data = await res.json();
                setEligibility(data);
            } catch (err) {
                setError('Unable to check refresh eligibility');
            } finally {
                setLoading(false);
            }
        };

        checkEligibility();
    }, [analysisId, userId]);

    const handleRefresh = async () => {
        if (!eligibility?.canRefresh && !eligibility?.addOnPrice) return;

        setRefreshing(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (userId) params.set('userId', userId);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/analysis/${analysisId}/refresh?${params}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to start refresh');
            }

            const data = await res.json();
            setSuccess(true);

            // Wait a moment then redirect to the new analysis
            setTimeout(() => {
                onRefreshComplete(data.newAnalysisId);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to refresh report');
            setRefreshing(false);
        }
    };

    // Render content based on state
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    <p className="mt-4 text-slate-600">Checking eligibility...</p>
                </div>
            );
        }

        if (success) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Refresh Started!</h3>
                    <p className="mt-2 text-slate-600 text-center">
                        Your analysis is being re-run. You'll be redirected to the new report shortly.
                    </p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-rose-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Error</h3>
                    <p className="mt-2 text-slate-600 text-center">{error}</p>
                    <button
                        onClick={onClose}
                        className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            );
        }

        if (!eligibility) return null;

        // Admin flow - immediate refresh
        if (eligibility.userType === 'admin') {
            return (
                <div className="py-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Admin Refresh</h3>
                            <p className="text-sm text-slate-500">Unlimited refreshes available</p>
                        </div>
                    </div>

                    <p className="text-slate-600 mb-6">
                        As an admin, you can refresh this report at any time without using credits.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {refreshing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Refreshing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5" />
                                    Refresh Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            );
        }

        // Subscriber with credits
        if (eligibility.userType === 'subscriber' && eligibility.canRefresh) {
            return (
                <div className="py-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Refresh Report</h3>
                            <p className="text-sm text-slate-500">{eligibility.planType} Plan</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Credits remaining</span>
                            <span className="text-xl font-bold text-emerald-600">
                                {eligibility.creditsRemaining} / {eligibility.creditsTotal}
                            </span>
                        </div>
                        <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                                style={{ width: `${((eligibility.creditsRemaining || 0) / (eligibility.creditsTotal || 1)) * 100}%` }}
                            />
                        </div>
                    </div>

                    <p className="text-slate-600 mb-6">
                        This will use <strong>1 credit</strong> and re-run the full analysis with the latest data.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {refreshing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Refreshing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5" />
                                    Use 1 Credit
                                </>
                            )}
                        </button>
                    </div>
                </div>
            );
        }

        // Subscriber out of credits or non-subscriber - show upsell
        return (
            <div className="py-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            {eligibility.userType === 'subscriber' ? 'Out of Credits' : 'Refresh Report'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {eligibility.userType === 'subscriber'
                                ? `${eligibility.creditsUsed}/${eligibility.creditsTotal} used this month`
                                : 'One-time purchase'
                            }
                        </p>
                    </div>
                </div>

                {eligibility.userType === 'subscriber' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <p className="text-amber-800 text-sm">
                            You've used all your refresh credits for this month. Purchase an add-on or wait until next month.
                        </p>
                    </div>
                )}

                <div className="space-y-3 mb-6">
                    {/* Add-on option */}
                    <div className="bg-white border-2 border-emerald-200 rounded-xl p-4 cursor-pointer hover:border-emerald-400 transition-colors">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-slate-900">Add-on Report</h4>
                                <p className="text-sm text-slate-500">One-time refresh</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-emerald-600">${eligibility.addOnPrice}</span>
                            </div>
                        </div>
                    </div>

                    {/* Subscribe option (for non-subscribers) */}
                    {eligibility.userType === 'one-time' && (
                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl p-4 cursor-pointer hover:border-violet-400 transition-colors">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-slate-900">Subscribe Monthly</h4>
                                    <p className="text-sm text-slate-500">Get 1-5 refreshes/month + more</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-violet-600">From $39/mo</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-semibold transition-colors"
                        onClick={() => {
                            // TODO: Redirect to checkout with add-on
                            window.location.href = `/checkout?addon=refresh&analysisId=${analysisId}`;
                        }}
                    >
                        Purchase ${eligibility.addOnPrice}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">Refresh Report</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
