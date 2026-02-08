'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Target, Mail, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = await api.forgotPassword(email);
            if (result.success) {
                setSuccess(true);
            } else {
                throw new Error(result.error?.message || 'Failed to send reset email');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center relative overflow-hidden">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-100" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md px-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">
                                AEO<span className="text-sky-600">.LIVE</span>
                            </span>
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset your password</h1>
                        <p className="text-slate-500">
                            Enter your email address and we&apos;ll send you a link to reset your password.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">Check your email</h2>
                            <p className="text-slate-500 mb-6">
                                If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
                            </p>
                            <Link href="/login">
                                <Button className="w-full py-6 text-base font-semibold bg-sky-600 hover:bg-sky-700 rounded-xl shadow-lg text-white">
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                    <span className="text-sm text-red-700">{error}</span>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-6 text-base font-semibold bg-sky-600 hover:bg-sky-700 rounded-xl shadow-lg text-white"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>
                            </form>

                            {/* Back to Login Link */}
                            <p className="text-center mt-6">
                                <Link
                                    href="/login"
                                    className="text-sky-600 hover:text-sky-700 font-medium transition-colors inline-flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
