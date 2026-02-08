'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Target, Lock, AlertCircle, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, Shield } from 'lucide-react';

function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    useEffect(() => {
        // Validate token exists
        if (!token) {
            setTokenValid(false);
        } else {
            setTokenValid(true);
        }
    }, [token]);

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
        if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
        if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setIsLoading(true);

        try {
            const result = await api.resetPassword(token!, password);
            if (result.success) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                throw new Error(result.error?.message || 'Failed to reset password');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    // Token validation loading
    if (tokenValid === null) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    // Invalid or missing token
    if (tokenValid === false) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-100" />
                <div className="relative z-10 w-full max-w-md px-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Reset Link</h1>
                        <p className="text-slate-500 mb-6">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <Link href="/forgot-password">
                            <Button className="w-full py-6 text-base font-semibold bg-sky-600 hover:bg-sky-700 rounded-xl shadow-lg text-white">
                                Request New Link
                            </Button>
                        </Link>
                        <p className="text-center mt-4">
                            <Link href="/login" className="text-sky-600 hover:text-sky-700 font-medium transition-colors inline-flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-100" />

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
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Set new password</h1>
                        <p className="text-slate-500">
                            Enter your new password below.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">Password Reset Successfully!</h2>
                            <p className="text-slate-500 mb-6">
                                Your password has been updated. Redirecting you to login...
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sky-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Redirecting...</span>
                            </div>
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

                            {/* Password Requirements */}
                            <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-sky-50 border border-sky-200">
                                <Shield className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                                <div className="text-sm text-sky-700">
                                    <div className="font-medium mb-1">Password Requirements:</div>
                                    <ul className="list-disc list-inside text-sky-600 space-y-0.5">
                                        <li>At least 8 characters</li>
                                        <li>One uppercase letter</li>
                                        <li>One lowercase letter</li>
                                        <li>One number</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
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
                                            Resetting...
                                        </>
                                    ) : (
                                        'Reset Password'
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
