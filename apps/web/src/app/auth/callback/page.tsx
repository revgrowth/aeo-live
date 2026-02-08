'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Target, Loader2 } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');

        if (error) {
            router.push(`/login?error=${encodeURIComponent(error)}`);
            return;
        }

        if (accessToken && refreshToken) {
            api.setTokens({ accessToken, refreshToken, expiresIn: 3600 });
            router.push('/dashboard');
        } else {
            router.push('/login?error=auth_failed');
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-slate-900">
                    AEO<span className="text-sky-600">.LIVE</span>
                </span>
            </div>
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            <p className="mt-4 text-slate-500">Completing authentication...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                <p className="mt-4 text-slate-500">Loading...</p>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
