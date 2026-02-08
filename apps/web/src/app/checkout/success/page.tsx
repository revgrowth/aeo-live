'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
    Target, CheckCircle2, ArrowRight, Loader2, Sparkles,
    BarChart3, Crown
} from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [, setPurchaseDetails] = useState<{
        type: 'report' | 'subscription';
        tier: string;
        reportId?: string;
    } | null>(null);

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            return;
        }

        const verifyPurchase = async () => {
            try {
                const response = await api.verifyCheckoutSession(sessionId);
                if (response.success && response.data) {
                    setPurchaseDetails(response.data);
                    setStatus('success');
                } else {
                    setStatus('success');
                }
            } catch {
                setStatus('success');
            }
        };

        verifyPurchase();
    }, [sessionId]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                        <Target className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Processing your purchase...</h2>
                    <p className="text-slate-500">Please wait a moment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Content */}
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-lg w-full text-center">
                    {/* Success Icon */}
                    <div className="relative mb-8">
                        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-8 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center animate-bounce shadow-lg">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                        Payment Successful! 🎉
                    </h1>

                    <p className="text-xl text-slate-500 mb-8">
                        Your competitive analysis report is ready to view
                    </p>

                    {/* What's Next */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 text-left shadow-sm">
                        <h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-500" />
                            What's included in your purchase:
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <span className="font-medium text-slate-900">Complete AI Analysis</span>
                                    <p className="text-sm text-slate-500">Deep competitive insights powered by advanced AI</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <span className="font-medium text-slate-900">Actionable Recommendations</span>
                                    <p className="text-sm text-slate-500">Step-by-step improvements for your AEO strategy</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <span className="font-medium text-slate-900">PDF Export</span>
                                    <p className="text-sm text-slate-500">Download and share your report anytime</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-4">
                        <Button
                            size="lg"
                            className="w-full h-14 text-lg bg-sky-600 hover:bg-sky-700 text-white shadow-lg"
                            onClick={() => router.push('/dashboard')}
                        >
                            <BarChart3 className="w-5 h-5 mr-2" />
                            View Your Report
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>

                        <Link href="/">
                            <Button
                                variant="ghost"
                                size="lg"
                                className="w-full text-slate-500 hover:text-slate-900"
                            >
                                Return to Home
                            </Button>
                        </Link>
                    </div>

                    {/* Receipt Info */}
                    <p className="text-sm text-slate-400 mt-8">
                        A receipt has been sent to your email address
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
