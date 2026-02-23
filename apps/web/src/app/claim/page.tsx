'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Target, ArrowRight, Loader2, Tag,
    CheckCircle, XCircle, Sparkles, Shield,
} from 'lucide-react';

export default function ClaimPage() {
    const [code, setCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        domain: string | null;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const handleValidateAndRedirect = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedCode = code.trim();
        if (!trimmedCode) {
            setError('Please enter a claim code');
            return;
        }

        setIsValidating(true);

        try {
            const response = await api.validateClaimCode(trimmedCode);

            if (response.success && response.data?.valid) {
                setValidationResult(response.data);
                // Brief delay to show success, then redirect
                setTimeout(() => {
                    router.push(`/register?code=${encodeURIComponent(trimmedCode)}`);
                }, 800);
            } else {
                setValidationResult({ valid: false, domain: null });
                setError('This code is not valid or has already been used');
                setIsValidating(false);
            }
        } catch {
            setError('Could not validate code. Please try again.');
            setIsValidating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 flex items-center justify-center relative overflow-hidden px-4">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sky-100/40 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

            <div className="relative z-10 w-full max-w-lg text-center">
                {/* Logo */}
                <Link href="/" className="inline-flex items-center justify-center gap-3 mb-10 group">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow">
                        <Target className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900">
                        AEO<span className="text-sky-600">.LIVE</span>
                    </span>
                </Link>

                {/* Hero Text */}
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
                    Unlock Your<br />
                    <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                        AI Visibility Report
                    </span>
                </h1>
                <p className="text-slate-500 mb-10 text-lg max-w-md mx-auto">
                    Enter your access code below to see exactly how your business compares to your competition in AI search.
                </p>

                {/* Code Input Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl mb-6">
                    <form onSubmit={handleValidateAndRedirect} className="space-y-5">
                        <div>
                            <label htmlFor="claim-code" className="block text-sm font-medium text-slate-600 mb-3 text-left">
                                <Tag className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                                Access Code
                            </label>
                            <input
                                id="claim-code"
                                type="text"
                                placeholder="e.g. HVAC-AUSTIN-001"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    setError(null);
                                    setValidationResult(null);
                                }}
                                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all font-mono text-lg tracking-widest uppercase text-center"
                                autoFocus
                                disabled={isValidating && validationResult?.valid}
                            />
                        </div>

                        {/* Validation Feedback */}
                        {validationResult?.valid && (
                            <div className="flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">
                                    Valid code for <strong>{validationResult.domain}</strong> — redirecting...
                                </span>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center justify-center gap-2 text-red-700 bg-red-50 rounded-lg p-3 border border-red-200">
                                <XCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isValidating || !code.trim()}
                            className="w-full py-6 text-base font-semibold bg-sky-600 hover:bg-sky-700 rounded-xl shadow-lg text-white"
                        >
                            {isValidating ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Validating...
                                </>
                            ) : (
                                <>
                                    Unlock My Report
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-6 text-slate-400 text-sm mb-8">
                    <span className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4" />
                        Secure
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        AI-Powered
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Target className="w-4 h-4" />
                        Real Data
                    </span>
                </div>

                {/* Alt path */}
                <p className="text-slate-400 text-sm">
                    Don't have a code?{' '}
                    <Link href="/register" className="text-sky-600 hover:text-sky-700 font-medium transition-colors">
                        Create an account
                    </Link>{' '}
                    or{' '}
                    <Link href="/" className="text-sky-600 hover:text-sky-700 font-medium transition-colors">
                        learn more
                    </Link>
                </p>
            </div>
        </div>
    );
}
