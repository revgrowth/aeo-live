'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowRight, Target, Sparkles,
    TrendingUp, CheckCircle, Globe, Loader2, Crosshair,
    Zap, BarChart3, Shield, Layout, Link2, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function HomePage() {
    const [url, setUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Lead capture modal state
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [normalizedUrl, setNormalizedUrl] = useState('');
    const [leadForm, setLeadForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        businessName: '',
    });
    const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});

    // Client-only state for particles (prevents hydration mismatch)
    const [particles, setParticles] = useState<Array<{ left: string, delay: string, duration: string }>>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Generate particles only on client to avoid hydration mismatch
        setParticles(
            Array.from({ length: 20 }, () => ({
                left: `${Math.random() * 100}%`,
                delay: `${Math.random() * 6}s`,
                duration: `${4 + Math.random() * 4}s`
            }))
        );
    }, []);

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        let urlToAnalyze = url.trim();

        if (!urlToAnalyze) {
            setError('Please enter a website URL');
            return;
        }

        if (!urlToAnalyze.startsWith('http://') && !urlToAnalyze.startsWith('https://')) {
            urlToAnalyze = 'https://' + urlToAnalyze;
        }

        try {
            new URL(urlToAnalyze);
        } catch {
            setError('Please enter a valid website URL');
            return;
        }

        setNormalizedUrl(urlToAnalyze);
        setShowLeadModal(true);
    };

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!leadForm.firstName.trim()) errors.firstName = 'First name is required';
        if (!leadForm.lastName.trim()) errors.lastName = 'Last name is required';
        if (!leadForm.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadForm.email)) errors.email = 'Invalid email format';
        if (!leadForm.phone.trim()) errors.phone = 'Phone number is required';
        else if (leadForm.phone.replace(/\D/g, '').length < 10) errors.phone = 'Phone must be at least 10 digits';
        if (!leadForm.businessName.trim()) errors.businessName = 'Business name is required';

        if (Object.keys(errors).length > 0) {
            setLeadErrors(errors);
            return;
        }

        setLeadErrors({});
        setIsAnalyzing(true);

        sessionStorage.setItem('leadInfo', JSON.stringify({
            ...leadForm,
            url: normalizedUrl,
        }));

        router.push(`/analyze?url=${encodeURIComponent(normalizedUrl)}`);
    };

    const handleAnalyze = handleUrlSubmit;

    // Scroll reveal animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        const revealElements = document.querySelectorAll('.reveal-up');
        revealElements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* Navigation - Premium */}
            <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-18 py-2">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900">
                                AEO<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">.LIVE</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-5">
                            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
                                Sign In
                            </Link>
                            <Link href="/register">
                                <Button size="sm" className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 hover:shadow-lg transition-all px-5">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ===== HERO SECTION - WAR ROOM COMMAND CENTER ===== */}
            <section className="command-center-bg min-h-[90vh] relative flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Tactical grid overlay */}
                <div className="absolute inset-0 tactical-grid" />

                {/* Animated particles - client-only to prevent hydration mismatch */}
                <div className="data-particles">
                    {isClient && particles.map((particle, i) => (
                        <div
                            key={i}
                            className="particle"
                            style={{
                                left: particle.left,
                                animationDelay: particle.delay,
                                animationDuration: particle.duration
                            }}
                        />
                    ))}
                </div>

                {/* Radar sweep effect in corner */}
                <div className="absolute top-0 right-0 w-96 h-96 opacity-30">
                    <div className="radar-sweep w-full h-full" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto text-center py-20">
                    {/* Floating badge */}
                    <div className="badge-float inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/60 backdrop-blur-md border border-cyan-500/30 text-cyan-400 text-sm font-semibold mb-10">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span>Competitive Intelligence Platform</span>
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-xs border border-cyan-500/30">LIVE</span>
                    </div>

                    {/* MASSIVE Headline */}
                    <h1 className="hero-mega text-white mb-8">
                        <span className="block">Outsmart Your</span>
                        <span className="block gradient-text-animated text-electric">
                            Competition
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-14 leading-relaxed">
                        AI-powered competitive intelligence that reveals <span className="text-cyan-400 font-semibold">exactly</span> how to outrank your rivals. Get actionable insights in <span className="inline-flex items-center gap-1 text-cyan-400 font-bold">60 seconds <Zap className="w-5 h-5" /></span>
                    </p>

                    {/* Premium URL Input with glow */}
                    <form onSubmit={handleAnalyze} action="javascript:void(0)" className="max-w-2xl mx-auto mb-14">
                        <div className="input-glow rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-cyan-500/20 p-2">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 flex items-center gap-4 px-5 py-2">
                                    <Crosshair className="w-6 h-6 text-cyan-500 flex-shrink-0" />
                                    <Input
                                        type="text"
                                        placeholder="Enter your website URL..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="border-0 bg-transparent focus-visible:ring-0 text-lg placeholder:text-slate-500 text-white h-14 font-medium"
                                        disabled={isAnalyzing}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="lg"
                                    className="btn-electric px-10 h-16 rounded-xl font-bold text-lg text-white relative z-10"
                                    disabled={isAnalyzing}
                                    onClick={() => handleUrlSubmit({ preventDefault: () => { } } as React.FormEvent)}
                                >
                                    <span className="relative z-10 flex items-center">
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                                Scanning...
                                            </>
                                        ) : (
                                            <>
                                                Launch Analysis
                                                <ArrowRight className="ml-2 w-5 h-5" />
                                            </>
                                        )}
                                    </span>
                                </Button>
                            </div>
                        </div>
                        {error && (
                            <p className="text-red-400 text-sm mt-4 text-center font-medium">{error}</p>
                        )}
                    </form>

                    {/* Trust indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mb-20">
                        {[
                            { icon: CheckCircle, text: 'No credit card' },
                            { icon: Zap, text: '60-second results' },
                            { icon: Shield, text: 'Enterprise-grade security' },
                        ].map((item) => (
                            <span key={item.text} className="flex items-center gap-2 text-sm font-medium text-slate-400">
                                <item.icon className="w-4 h-4 text-cyan-500" />
                                {item.text}
                            </span>
                        ))}
                    </div>

                    {/* War Room Stats */}
                    <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
                        {[
                            { value: '10M+', label: 'Keywords Analyzed', color: '#06b6d4' },
                            { value: '47%', label: 'Avg Visibility Gain', color: '#10b981' },
                            { value: '<60s', label: 'To Intelligence', color: '#8b5cf6' },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="war-stat rounded-2xl p-6 md:p-8 text-center"
                                style={{ '--stat-color': stat.color } as React.CSSProperties}
                            >
                                <div
                                    className="text-4xl md:text-6xl font-black mb-2"
                                    style={{ color: stat.color }}
                                >
                                    {stat.value}
                                </div>
                                <div className="text-sm font-medium text-slate-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom gradient fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
            </section>

            {/* ===== PRODUCT SHOWCASE - 2026 BENTO GRID ===== */}
            <section className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
                {/* Subtle background decoration */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-violet-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-sky-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 text-violet-700 text-sm font-semibold mb-6 border border-violet-100">
                            <Sparkles className="w-4 h-4" />
                            Intelligence Suite
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight">
                            Toolkits That Drive{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                                Real Results
                            </span>
                        </h2>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                            Five powerful modules working together to transform your competitive position
                        </p>
                    </div>

                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Card 1 - Revenue Analysis (Featured) */}
                        <div className="lg:col-span-2 bento-card soft-shadow-lg p-8 group">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform duration-300">
                                        <TrendingUp className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Revenue Analysis</h3>
                                    <p className="text-slate-500 max-w-md">Calculate exactly how much you&apos;re losing to competitors and where to recover it.</p>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-wide">Popular</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {['Lost Revenue Calc', 'Traffic Recovery', 'ROI Projections'].map((item) => (
                                    <span key={item} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors cursor-default">{item}</span>
                                ))}
                            </div>
                        </div>

                        {/* Card 2 - AI Visibility */}
                        <div className="bento-card soft-shadow p-6 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/25 group-hover:scale-110 transition-transform duration-300">
                                <Eye className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">AI Visibility</h3>
                            <p className="text-slate-500 text-sm mb-4">See if ChatGPT, Perplexity, and Claude can find you.</p>
                            <div className="flex items-center gap-2 text-cyan-600 text-sm font-semibold">
                                <span>Track 6 AI Engines</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Card 3 - Competitive Radar */}
                        <div className="bento-card soft-shadow p-6 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform duration-300">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Competitive Radar</h3>
                            <p className="text-slate-500 text-sm mb-4">Head-to-head comparisons across 7 critical categories.</p>
                            <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
                                <span>Real-time Analysis</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Card 4 - Benchmarks */}
                        <div className="bento-card soft-shadow p-6 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Industry Benchmarks</h3>
                            <p className="text-slate-500 text-sm mb-4">Know where you stand against industry leaders.</p>
                            <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                                <span>10M+ Data Points</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Card 5 - Quick Wins */}
                        <div className="bento-card soft-shadow p-6 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/25 group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Quick Wins</h3>
                            <p className="text-slate-500 text-sm mb-4">Prioritized action plan with immediate impact items.</p>
                            <div className="flex items-center gap-2 text-rose-600 text-sm font-semibold">
                                <span>30/60/90 Day Plan</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== SCORE PREVIEW - TRANSITION SECTION ===== */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-white">
                {/* AI Engine logos moving band */}
                <div className="bg-slate-900/50 border-y border-slate-700/50 py-6 mb-16">
                    <div className="max-w-6xl mx-auto">
                        <p className="text-center text-xs font-semibold text-slate-500 mb-4 tracking-[0.2em] uppercase">Tracks Visibility Across</p>
                        <div className="flex flex-wrap items-center justify-center gap-6">
                            {['ChatGPT', 'Google AI', 'Perplexity', 'Claude', 'Gemini', 'Bing'].map((name) => (
                                <span
                                    key={name}
                                    className="text-sm font-semibold text-slate-400 hover:text-cyan-400 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 cursor-default"
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto relative">
                    {/* Section header */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Instant Competitive Snapshot</h2>
                        <p className="text-slate-400 text-lg">See how you stack up in seconds</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 md:gap-8 items-center">
                        {/* Your Site - Glow Card */}
                        <div className="glow-card rounded-2xl p-6 md:p-8 text-center">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
                                <Globe className="w-7 h-7 text-white" />
                            </div>
                            <p className="text-sm text-slate-400 mb-2 font-medium uppercase tracking-wide">Your Site</p>
                            <div className="text-5xl md:text-6xl font-bold text-cyan-400">72</div>
                            <div className="mt-4 w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: '72%' }} />
                            </div>
                        </div>

                        {/* VS Badge - Animated */}
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="hidden md:block w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-lg relative z-10">
                                    <span className="text-xl font-bold text-slate-300">VS</span>
                                </div>
                                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping" style={{ animationDuration: '2s' }} />
                            </div>
                            <div className="hidden md:block w-full h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                        </div>

                        {/* Competitor - Glow Card with Amber Accent */}
                        <div className="glow-card rounded-2xl p-6 md:p-8 text-center">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                                <Crosshair className="w-7 h-7 text-white" />
                            </div>
                            <p className="text-sm text-slate-400 mb-2 font-medium uppercase tracking-wide">Competitor</p>
                            <div className="text-5xl md:text-6xl font-bold text-amber-400">84</div>
                            <div className="mt-4 w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: '84%' }} />
                            </div>
                            <p className="text-xs text-amber-400 font-semibold mt-3 flex items-center justify-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Currently Leading
                            </p>
                        </div>
                    </div>

                    {/* Gap indicator - Premium */}
                    <div className="mt-12 text-center">
                        <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 backdrop-blur-md">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 rotate-180 text-red-400" />
                            </div>
                            <span className="text-slate-300 font-medium">
                                You're <span className="font-bold text-red-400 text-xl mx-1">12 points</span> behind—see where you're losing
                            </span>
                            <ArrowRight className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== BENEFITS SECTION - PREMIUM ===== */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-100/30 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-100/30 to-transparent rounded-full blur-3xl" />

                <div className="max-w-6xl mx-auto relative">
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-50 to-indigo-50 text-cyan-700 text-sm font-semibold mb-6 border border-cyan-100">
                            <Target className="w-4 h-4" />
                            Competitive Advantage
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5">
                            Stop Losing Customers to<br />
                            <span className="gradient-text-animated">Competitors You Can Beat</span>
                        </h2>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                            Every day you're invisible to AI search, your competitors are stealing your traffic
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Target,
                                color: 'from-cyan-500 to-blue-600',
                                shadowColor: 'shadow-cyan-500/25',
                                title: "Know Exactly Why You're Losing",
                                description: 'See the specific gaps costing you rankings—and how to fix them in priority order.',
                                highlight: 'Stop wasting time on the wrong things'
                            },
                            {
                                icon: Zap,
                                color: 'from-amber-500 to-orange-500',
                                shadowColor: 'shadow-amber-500/25',
                                title: 'Outrank Competitors in 30 Days',
                                description: 'Get a prioritized action plan showing the highest-impact wins. Most users see improvements within a month.',
                                highlight: 'Real results, not just reports'
                            },
                            {
                                icon: Sparkles,
                                color: 'from-violet-500 to-purple-600',
                                shadowColor: 'shadow-violet-500/25',
                                title: 'Get Found by ChatGPT & AI Search',
                                description: "SEO alone won't cut it anymore. Our AEO score shows if AI can actually find and recommend you.",
                                highlight: 'Future-proof your visibility'
                            },
                        ].map((benefit, index) => (
                            <div
                                key={index}
                                className="group relative bg-white p-8 rounded-3xl border border-slate-200/80 hover:border-slate-300 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                            >
                                {/* Top accent bar */}
                                <div className={`absolute top-0 left-8 right-8 h-1 rounded-b-full bg-gradient-to-r ${benefit.color}`} />

                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-6 shadow-xl ${benefit.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                                    <benefit.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">
                                    {benefit.title}
                                </h3>
                                <p className="text-slate-500 mb-6 leading-relaxed">{benefit.description}</p>
                                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl w-fit border border-emerald-100">
                                    <CheckCircle className="w-4 h-4" />
                                    {benefit.highlight}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS - 2026 PREMIUM ===== */}
            <section className="py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-cyan-100/30 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-indigo-100/30 blur-3xl pointer-events-none" />

                <div className="max-w-6xl mx-auto relative">
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold mb-6 border border-amber-100">
                            <span className="text-amber-500">★</span>
                            Trusted by Industry Leaders
                        </span>
                        <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">What Marketers Are Saying</h3>
                        <div className="flex items-center justify-center gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className="text-amber-400 text-2xl">★</span>
                            ))}
                        </div>
                        <p className="text-slate-500 text-lg">4.9/5 from 200+ reviews</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                quote: "Finally understood why we were losing to our competitor. Fixed 3 issues and jumped 12 spots in 2 weeks.",
                                name: "Sarah Chen",
                                role: "Marketing Director",
                                company: "TechFlow",
                                gradient: "from-cyan-500 to-blue-500"
                            },
                            {
                                quote: "The AEO score was eye-opening. We had no idea ChatGPT couldn't find us. Now we're getting AI referrals daily.",
                                name: "Marcus Rodriguez",
                                role: "Founder",
                                company: "GreenLeaf Co",
                                gradient: "from-emerald-500 to-teal-500"
                            },
                            {
                                quote: "Spent $10k with an agency that couldn't explain what we were doing wrong. AEO.LIVE showed us in 60 seconds.",
                                name: "Jennifer Park",
                                role: "VP Marketing",
                                company: "ScaleUp Inc",
                                gradient: "from-violet-500 to-purple-500"
                            },
                        ].map((testimonial, index) => (
                            <div
                                key={index}
                                className="group bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative"
                            >
                                {/* Top gradient accent */}
                                <div className={`absolute top-0 left-8 right-8 h-1 rounded-b-full bg-gradient-to-r ${testimonial.gradient}`} />

                                {/* Quote bar */}
                                <div className="quote-premium mb-6">
                                    <p className="text-slate-600 leading-relaxed text-lg italic">&quot;{testimonial.quote}&quot;</p>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                    <div className="avatar-ring">
                                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-sm font-bold text-white`}>
                                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{testimonial.name}</p>
                                        <p className="text-sm text-slate-500">{testimonial.role}, {testimonial.company}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ===== CATEGORIES SECTION ===== */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-50 text-cyan-700 text-sm font-semibold mb-6 border border-cyan-100">
                            <BarChart3 className="w-4 h-4" />
                            Comprehensive Analysis
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            Analyze <span className="gradient-text-animated">7 Critical Categories</span>
                        </h2>
                        <p className="text-xl text-slate-500">See exactly where you're winning and losing</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Zap, name: 'Technical SEO', desc: 'Speed & indexing', gradient: 'from-amber-500 to-orange-500' },
                            { icon: BarChart3, name: 'On-Page SEO', desc: 'Meta & keywords', gradient: 'from-blue-500 to-indigo-500' },
                            { icon: Sparkles, name: 'Content Quality', desc: 'Depth & freshness', gradient: 'from-pink-500 to-rose-500' },
                            { icon: Target, name: 'AEO Readiness', desc: 'AI visibility', gradient: 'from-emerald-500 to-teal-500', important: true },
                            { icon: Shield, name: 'Brand Voice', desc: 'Tone & messaging', gradient: 'from-purple-500 to-violet-500' },
                            { icon: Layout, name: 'UX & Design', desc: 'Mobile & accessibility', gradient: 'from-cyan-500 to-sky-500' },
                            { icon: Link2, name: 'Internal Links', desc: 'Structure & flow', gradient: 'from-orange-500 to-red-500' },
                            { icon: CheckCircle, name: 'Full Report', desc: 'All insights unlocked', gradient: 'from-sky-500 to-indigo-600', highlight: true },
                        ].map((category, index) => (
                            <div
                                key={index}
                                className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-default ${category.highlight
                                    ? 'bg-gradient-to-br from-cyan-50 via-white to-indigo-50 border-cyan-200 shadow-lg'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <category.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                            {category.name}
                                            {category.important && (
                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Key</span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-slate-500">{category.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-r from-cyan-100/40 via-transparent to-indigo-100/40 blur-3xl" />
                </div>

                <div className="max-w-5xl mx-auto relative">
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4 border border-emerald-200/50">
                            <Zap className="w-4 h-4" />
                            Quick & Easy
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
                        <p className="text-lg text-slate-600">Three simple steps to competitive intelligence</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting line (hidden on mobile) */}
                        <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 animate-line-flow rounded-full" />

                        {[
                            {
                                step: '1',
                                title: 'Enter Your URL',
                                description: 'Paste your website URL. We auto-discover your top competitors.',
                                gradient: 'from-sky-500 to-sky-600',
                                shadow: 'shadow-sky-500/30',
                                icon: Globe
                            },
                            {
                                step: '2',
                                title: 'Pick a Competitor',
                                description: 'Choose from suggested competitors or add your own.',
                                gradient: 'from-indigo-500 to-violet-600',
                                shadow: 'shadow-indigo-500/30',
                                icon: Crosshair
                            },
                            {
                                step: '3',
                                title: 'Get Your Report',
                                description: 'See head-to-head scores and actionable insights in 60 seconds.',
                                gradient: 'from-emerald-500 to-teal-500',
                                shadow: 'shadow-emerald-500/30',
                                icon: Sparkles
                            },
                        ].map((item, index) => (
                            <div key={index} className="text-center relative group">
                                {/* Step number badge */}
                                <div className="relative inline-block mb-6">
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.gradient} text-white text-3xl font-bold flex items-center justify-center shadow-xl ${item.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                        {item.step}
                                    </div>
                                    {/* Icon floating indicator */}
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-white shadow-lg flex items-center justify-center">
                                        <item.icon className="w-4 h-4 text-slate-600" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Bottom CTA - Premium */}
                    <div className="mt-20 text-center">
                        <div className="inline-flex flex-col items-center">
                            <Button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                size="lg"
                                className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-lg px-12 h-16 font-semibold text-white shadow-xl shadow-sky-500/25 hover:shadow-2xl hover:shadow-sky-500/30 transition-all duration-300 animate-glow-pulse rounded-2xl"
                            >
                                Start Your Free Analysis
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <p className="mt-4 text-sm text-slate-500 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                100% Free • No credit card required
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== DATA INTELLIGENCE - 2026 PREMIUM ===== */}
            <section className="py-28 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />

                {/* Gradient orbs */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    {/* Section header */}
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-semibold mb-6 border border-cyan-500/20">
                            <BarChart3 className="w-4 h-4" />
                            Enterprise-Grade Data
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            More Data.{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Smarter Insights.</span>
                        </h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Powered by AI analysis of millions of data points across search engines
                        </p>
                    </div>

                    {/* Premium stat cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
                        {[
                            { value: '27B', label: 'Keywords Tracked', color: 'from-cyan-400 to-sky-500', icon: '🔍' },
                            { value: '43T', label: 'Backlinks Analyzed', color: 'from-violet-400 to-purple-500', icon: '🔗' },
                            { value: '808M', label: 'Domains Indexed', color: 'from-emerald-400 to-teal-500', icon: '🌐' },
                            { value: '142', label: 'GEO Databases', color: 'from-amber-400 to-orange-500', icon: '📍' },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="group relative rounded-2xl p-6 premium-glass-dark hover:scale-[1.02] transition-all duration-500"
                            >
                                {/* Top gradient accent */}
                                <div className={`absolute top-0 left-6 right-6 h-1 rounded-b-full bg-gradient-to-r ${stat.color}`} />

                                <div className="text-2xl mb-3">{stat.icon}</div>
                                <div className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color} mb-2 counter-scroll`}>
                                    {stat.value}
                                </div>
                                <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <Button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            size="lg"
                            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 px-10 h-14 font-bold text-lg rounded-xl shadow-xl shadow-cyan-500/20 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300 text-white"
                        >
                            Start Analyzing Free
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <p className="mt-4 text-sm text-slate-500">No credit card required</p>
                    </div>
                </div>
            </section>


            {/* Footer - Premium */}
            <footer className="relative py-16 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
                {/* Gradient band at top */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

                {/* Subtle background decoration */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-gradient-to-t from-slate-50/80 to-transparent blur-3xl pointer-events-none" />


                <div className="max-w-7xl mx-auto relative">
                    <div className="flex flex-col items-center">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">
                                AEO<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">.LIVE</span>
                            </span>
                        </div>

                        {/* Tagline */}
                        <p className="text-slate-500 mb-6 text-center max-w-md">
                            Competitive intelligence for the AI-first era. Outrank your competitors in search.
                        </p>

                        {/* Social proof mini */}
                        <div className="flex items-center gap-6 mb-8">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span>Trusted by 500+ brands</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="text-amber-400 text-sm">★</span>
                                ))}
                                <span className="text-sm text-slate-500 ml-1">4.9/5</span>
                            </div>
                        </div>

                        {/* Copyright */}
                        <div className="pt-6 border-t border-slate-100 w-full max-w-sm text-center">
                            <p className="text-sm text-slate-400">© {new Date().getFullYear()} AEO.LIVE. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </footer >

            {/* Lead Capture Modal */}
            {
                showLeadModal && (
                    <div
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setShowLeadModal(false)}
                    >
                        <div
                            className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setShowLeadModal(false)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                ✕
                            </button>

                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                                    <Target className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Almost There!</h2>
                                <p className="text-slate-600">Enter your details to get your free competitive analysis</p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleLeadSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1.5">First Name *</label>
                                        <input
                                            type="text"
                                            value={leadForm.firstName}
                                            onChange={(e) => setLeadForm({ ...leadForm, firstName: e.target.value })}
                                            className={`w-full px-4 py-3 bg-white border ${leadErrors.firstName ? 'border-red-400' : 'border-slate-300'} rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-colors`}
                                            placeholder="John"
                                        />
                                        {leadErrors.firstName && <p className="text-red-500 text-xs mt-1">{leadErrors.firstName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1.5">Last Name *</label>
                                        <input
                                            type="text"
                                            value={leadForm.lastName}
                                            onChange={(e) => setLeadForm({ ...leadForm, lastName: e.target.value })}
                                            className={`w-full px-4 py-3 bg-white border ${leadErrors.lastName ? 'border-red-400' : 'border-slate-300'} rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-colors`}
                                            placeholder="Smith"
                                        />
                                        {leadErrors.lastName && <p className="text-red-500 text-xs mt-1">{leadErrors.lastName}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5">Email Address *</label>
                                    <input
                                        type="email"
                                        value={leadForm.email}
                                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                                        className={`w-full px-4 py-3 bg-white border ${leadErrors.email ? 'border-red-400' : 'border-slate-300'} rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-colors`}
                                        placeholder="john@company.com"
                                    />
                                    {leadErrors.email && <p className="text-red-500 text-xs mt-1">{leadErrors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={leadForm.phone}
                                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                                        className={`w-full px-4 py-3 bg-white border ${leadErrors.phone ? 'border-red-400' : 'border-slate-300'} rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-colors`}
                                        placeholder="(555) 123-4567"
                                    />
                                    {leadErrors.phone && <p className="text-red-500 text-xs mt-1">{leadErrors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-600 mb-1.5">Business Name *</label>
                                    <input
                                        type="text"
                                        value={leadForm.businessName}
                                        onChange={(e) => setLeadForm({ ...leadForm, businessName: e.target.value })}
                                        className={`w-full px-4 py-3 bg-white border ${leadErrors.businessName ? 'border-red-400' : 'border-slate-300'} rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-colors`}
                                        placeholder="Acme Inc."
                                    />
                                    {leadErrors.businessName && <p className="text-red-500 text-xs mt-1">{leadErrors.businessName}</p>}
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isAnalyzing}
                                        className="w-full h-14 text-lg font-semibold bg-sky-600 hover:bg-sky-700 rounded-xl shadow-lg text-white"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Starting Analysis...
                                            </>
                                        ) : (
                                            <>
                                                Start Free Analysis
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <p className="text-center text-xs text-slate-500 pt-2">
                                    🔒 Your information is secure and will never be sold
                                </p>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
