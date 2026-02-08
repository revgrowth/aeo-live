'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import {
    Target, Check, Zap, ArrowRight, Loader2,
    Users, Shield, Crown, Sparkles, TrendingUp, BarChart3
} from 'lucide-react';

const TIERS = [
    {
        id: 'STARTER',
        name: 'Starter',
        tagline: 'Test the waters',
        oneTimePrice: 49,
        monthlyPrice: 39,
        competitors: 1,
        features: [
            'Full AI insights report',
            'Side-by-side comparison',
            'Actionable recommendations',
            'PDF export',
        ],
        popular: false,
        color: 'slate',
        icon: BarChart3,
    },
    {
        id: 'GROWTH',
        name: 'Growth',
        tagline: 'Most value',
        oneTimePrice: 129,
        monthlyPrice: 99,
        competitors: 3,
        features: [
            'Full AI insights report',
            'Side-by-side comparison',
            'Priority recommendations',
            'PDF export',
        ],
        monthlyOnlyFeatures: [
            'Trend tracking over time',
        ],
        popular: true,
        color: 'indigo',
        icon: TrendingUp,
    },
    {
        id: 'SCALE',
        name: 'Scale',
        tagline: 'For serious brands',
        oneTimePrice: 349,
        monthlyPrice: 279,
        competitors: 10,
        features: [
            'Full AI insights report',
            'Side-by-side comparison',
            'Strategic recommendations',
            'PDF export',
        ],
        monthlyOnlyFeatures: [
            'Trend tracking over time',
        ],
        popular: false,
        color: 'violet',
        icon: Crown,
    },
    {
        id: 'SCALE_PLUS',
        name: 'Scale+',
        tagline: 'Enterprise power',
        oneTimePrice: 1099,
        monthlyPrice: 879,
        competitors: 20,
        features: [
            'Full AI insights report',
            'Side-by-side comparison',
            'Executive briefings',
            'White-label PDF exports',
            'Dedicated account manager',
        ],
        monthlyOnlyFeatures: [
            'Trend tracking over time',
        ],
        popular: false,
        color: 'amber',
        icon: Sparkles,
    },
];

function CheckoutContent() {
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();

    const analysisId = searchParams.get('analysisId');
    const preselectedTier = searchParams.get('tier');

    const [billingType, setBillingType] = useState<'onetime' | 'subscription'>('onetime');
    const [selectedTier, setSelectedTier] = useState<string | null>(preselectedTier);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async (tierId: string) => {
        setIsProcessing(true);
        setError(null);
        setSelectedTier(tierId);

        try {
            const response = await api.createCheckoutSession({
                tier: tierId,
                billingType,
                analysisId: analysisId || undefined,
            });

            if (response.success && response.data?.url) {
                window.location.href = response.data.url;
            } else {
                throw new Error(response.error?.message || 'Failed to create checkout session');
            }
        } catch (err) {
            setError((err as Error).message);
            setIsProcessing(false);
        }
    };

    // Color schemes with premium gradients
    const getColorScheme = (color: string, isPopular: boolean) => {
        const schemes: Record<string, {
            card: string;
            border: string;
            text: string;
            button: string;
            badge: string;
            competitorBg: string;
        }> = {
            slate: {
                card: 'bg-white',
                border: 'border-slate-200 hover:border-slate-300 hover:shadow-lg',
                text: 'text-slate-700',
                button: 'bg-slate-800 hover:bg-slate-900',
                badge: 'bg-slate-100 text-slate-600',
                competitorBg: 'bg-gradient-to-br from-slate-100 to-slate-50',
            },
            indigo: {
                card: 'bg-gradient-to-br from-indigo-50 via-white to-violet-50',
                border: 'border-indigo-300 ring-2 ring-indigo-200 shadow-xl shadow-indigo-100',
                text: 'text-indigo-600',
                button: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700',
                badge: 'bg-indigo-100 text-indigo-700',
                competitorBg: 'bg-gradient-to-br from-indigo-100 to-violet-100',
            },
            violet: {
                card: 'bg-white',
                border: 'border-violet-200 hover:border-violet-300 hover:shadow-lg',
                text: 'text-violet-600',
                button: 'bg-violet-600 hover:bg-violet-700',
                badge: 'bg-violet-100 text-violet-600',
                competitorBg: 'bg-gradient-to-br from-violet-100 to-purple-50',
            },
            amber: {
                card: 'bg-gradient-to-br from-amber-50 via-white to-orange-50',
                border: 'border-amber-300 hover:border-amber-400 hover:shadow-lg',
                text: 'text-amber-600',
                button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
                badge: 'bg-amber-100 text-amber-700',
                competitorBg: 'bg-gradient-to-br from-amber-100 to-orange-100',
            },
        };
        return schemes[color] || schemes.slate;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900">
                                AEO<span className="text-sky-600">.LIVE</span>
                            </span>
                        </Link>
                        {isAuthenticated && (
                            <Link href="/dashboard">
                                <Button variant="ghost" className="text-slate-500 hover:text-slate-900">
                                    Back to Dashboard
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-6">
                        <Zap className="w-4 h-4" />
                        Know Exactly Where You Stand Against Competitors
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        How Many Competitors<br />
                        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                            Are You Tracking?
                        </span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        Run in-depth AI visibility analysis against your top competitors.
                        Pick the plan that matches your competitive landscape.
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex items-center p-1.5 rounded-2xl bg-white border border-slate-200 shadow-lg shadow-slate-100">
                        <button
                            onClick={() => setBillingType('onetime')}
                            className={`px-8 py-3.5 rounded-xl text-sm font-semibold transition-all ${billingType === 'onetime'
                                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            One-Time Report
                        </button>
                        <button
                            onClick={() => setBillingType('subscription')}
                            className={`px-8 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${billingType === 'subscription'
                                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Monthly Tracking
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                                +Trends
                            </span>
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-center">
                        {error}
                    </div>
                )}

                {/* Pricing Cards - Competitor-Focused Layout */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {TIERS.map((tier) => {
                        const price = billingType === 'onetime' ? tier.oneTimePrice : tier.monthlyPrice;
                        const isSelected = selectedTier === tier.id && isProcessing;
                        const colors = getColorScheme(tier.color, tier.popular);
                        const TierIcon = tier.icon;

                        return (
                            <div
                                key={tier.id}
                                className={`relative ${tier.popular ? 'lg:scale-105 z-10' : ''}`}
                            >
                                {/* Popular Badge */}
                                {tier.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                        <div className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-200 whitespace-nowrap">
                                            <Crown className="w-4 h-4" />
                                            Best Value
                                        </div>
                                    </div>
                                )}

                                {/* Card */}
                                <div
                                    className={`relative h-full rounded-2xl border-2 p-6 transition-all duration-300 ${colors.card} ${colors.border}`}
                                >
                                    {/* Header */}
                                    <div className={`mb-4 ${tier.popular ? 'pt-4' : ''}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-8 h-8 rounded-lg ${colors.badge} flex items-center justify-center`}>
                                                <TierIcon className={`w-4 h-4`} />
                                            </div>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                {tier.tagline}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900">{tier.name}</h3>
                                    </div>

                                    {/* MAIN VALUE PROP: Competitor Count */}
                                    <div className={`mb-6 p-5 rounded-xl ${colors.competitorBg} border border-white/50`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                                <Users className={`w-7 h-7 ${colors.text}`} />
                                            </div>
                                            <div>
                                                <div className={`text-4xl font-black ${colors.text}`}>
                                                    {tier.competitors}
                                                </div>
                                                <div className="text-sm font-medium text-slate-600">
                                                    Competitor{tier.competitors > 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-4xl font-black ${colors.text}`}>
                                                ${price}
                                            </span>
                                            <span className="text-slate-400 text-sm font-medium">
                                                {billingType === 'subscription' ? '/month' : 'one-time'}
                                            </span>
                                        </div>
                                        {billingType === 'onetime' && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                No recurring charges
                                            </p>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-2.5 mb-6">
                                        {tier.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                <Check className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                                                {feature}
                                            </li>
                                        ))}
                                        {/* Show monthly-only features when subscription selected */}
                                        {billingType === 'subscription' && tier.monthlyOnlyFeatures?.map((feature, i) => (
                                            <li key={`monthly-${i}`} className="flex items-start gap-2 text-sm text-emerald-600 font-medium">
                                                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <Button
                                        onClick={() => handleCheckout(tier.id)}
                                        disabled={isProcessing}
                                        className={`w-full py-6 text-base font-semibold transition-all text-white rounded-xl ${colors.button}`}
                                    >
                                        {isSelected ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Get Started
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>

                                    {/* Per-competitor price */}
                                    <p className="text-center text-xs text-slate-400 mt-3">
                                        ${Math.round(price / tier.competitors)} per competitor analysis
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Value Proposition Section */}
                <div className="max-w-3xl mx-auto mb-16">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Every Report Includes
                        </h2>
                        <p className="text-slate-500">
                            Deep AI visibility analysis for each competitor
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {[
                            { icon: '🎯', title: 'AI Citability Score', desc: 'How often AI will cite you vs them' },
                            { icon: '📊', title: '7 Category Breakdown', desc: 'Technical SEO, Content, AEO & more' },
                            { icon: '💡', title: 'Priority Actions', desc: 'Exactly what to fix first' },
                        ].map((item, i) => (
                            <div key={i} className="p-5 rounded-xl bg-white border border-slate-200 text-center hover:shadow-lg transition-shadow">
                                <div className="text-3xl mb-3">{item.icon}</div>
                                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-8 text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        <span>Instant Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        <span>30-Day Money Back</span>
                    </div>
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-12 text-center">
                    <p className="text-slate-500">
                        Need more competitors? <a href="mailto:hello@aeo.live" className="text-indigo-600 hover:text-indigo-700 font-medium">Contact us</a> for custom enterprise pricing.
                    </p>
                </div>
            </main>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
