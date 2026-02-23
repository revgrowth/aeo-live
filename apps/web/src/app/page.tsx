'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowRight, Target, Sparkles,
    TrendingUp, CheckCircle, Globe, Loader2, Crosshair,
    Zap, BarChart3, Shield, Layout, Link2, Eye, ChevronRight
} from 'lucide-react';

/* ─── Animation Helpers ─── */
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

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

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        let urlToAnalyze = url.trim();
        if (!urlToAnalyze) { setError('Please enter a website URL'); return; }
        if (!urlToAnalyze.startsWith('http://') && !urlToAnalyze.startsWith('https://')) {
            urlToAnalyze = 'https://' + urlToAnalyze;
        }
        try { new URL(urlToAnalyze); } catch { setError('Please enter a valid website URL'); return; }
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
        if (Object.keys(errors).length > 0) { setLeadErrors(errors); return; }
        setLeadErrors({});
        setIsAnalyzing(true);
        sessionStorage.setItem('leadInfo', JSON.stringify({ ...leadForm, url: normalizedUrl }));
        router.push(`/analyze?url=${encodeURIComponent(normalizedUrl)}`);
    };

    // Score bar animation
    const scoreRef = useRef(null);
    const scoreInView = useInView(scoreRef, { once: true, margin: '-100px' });

    return (
        <div className="min-h-screen bg-white text-gray-900">
            {/* ═══ NAVIGATION ═══ */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-gray-900">
                                AEO<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">.LIVE</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-2">
                                Sign In
                            </Link>
                            <Link href="/register">
                                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all px-5 rounded-xl font-semibold">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ═══ HERO SECTION ═══ */}
            <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Dot grid texture */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                {/* Mesh gradient orbs */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-100/60 via-violet-50/40 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-violet-100/40 to-transparent rounded-full blur-3xl pointer-events-none translate-y-1/4 -translate-x-1/4" />

                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                        {/* Badge */}
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-8 ring-1 ring-blue-100">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Competitive Intelligence Platform
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">LIVE</span>
                        </motion.div>

                        {/* Headline — massive 50% larger */}
                        <motion.h1 variants={fadeUp} className="text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black tracking-tighter text-gray-900 mb-6 leading-[0.9]">
                            Outsmart Your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                                Competition
                            </span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p variants={fadeUp} className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
                            AI-powered competitive intelligence that reveals{' '}
                            <span className="text-gray-900 font-semibold">exactly</span> how to outrank your rivals.
                            Get actionable insights in{' '}
                            <span className="inline-flex items-center gap-1 text-blue-600 font-bold">60 seconds <Zap className="w-4 h-4" /></span>
                        </motion.p>

                        {/* URL Input — Clean glass panel */}
                        <motion.div variants={fadeUp}>
                            <form onSubmit={handleUrlSubmit} className="max-w-2xl mx-auto mb-8">
                                <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_20px_50px_-12px_rgba(0,0,0,0.12)] ring-1 ring-gray-900/5 p-2">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="flex-1 flex items-center gap-3 px-4 py-1">
                                            <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                            <Input
                                                type="text"
                                                placeholder="Enter your website URL..."
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                                className="border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-gray-400 text-gray-900 h-12 font-medium"
                                                disabled={isAnalyzing}
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 px-8 h-12 rounded-xl font-bold text-white shadow-lg shadow-blue-600/25 hover:shadow-xl transition-all"
                                            disabled={isAnalyzing}
                                        >
                                            {isAnalyzing ? (
                                                <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Scanning...</>
                                            ) : (
                                                <>Launch Analysis<ArrowRight className="ml-2 w-4 h-4" /></>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                {error && <p className="text-red-500 text-sm mt-3 text-center font-medium">{error}</p>}
                            </form>
                        </motion.div>

                        {/* Trust row */}
                        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 mb-16">
                            {[
                                { icon: CheckCircle, text: 'No credit card required' },
                                { icon: Zap, text: '60-second results' },
                                { icon: Shield, text: 'Enterprise-grade security' },
                            ].map((item) => (
                                <span key={item.text} className="flex items-center gap-2 text-sm text-gray-400">
                                    <item.icon className="w-4 h-4 text-emerald-500" />
                                    {item.text}
                                </span>
                            ))}
                        </motion.div>

                        {/* Hero stats — big mono numbers */}
                        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
                            {[
                                { value: '10M+', label: 'Keywords Analyzed', color: 'text-blue-600' },
                                { value: '47%', label: 'Avg Visibility Gain', color: 'text-emerald-600' },
                                { value: '<60s', label: 'To Intelligence', color: 'text-violet-600' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-gray-50/80 rounded-2xl p-6 ring-1 ring-gray-100">
                                    <div className={`text-3xl md:text-4xl font-extrabold tabular-nums ${stat.color} mb-1`}>{stat.value}</div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>

                        {/* ═══ 3D TILTED DASHBOARD HERO SHOT ═══ */}
                        <motion.div variants={fadeUp} className="mt-20 max-w-5xl mx-auto" style={{ perspective: '1200px' }}>
                            <div className="relative rounded-2xl border-2 border-gray-200/80 bg-white shadow-[0_20px_80px_-15px_rgba(0,0,0,0.2)] overflow-hidden" style={{ transform: 'rotateX(12deg) scale(0.92)', transformOrigin: 'center bottom' }}>
                                {/* Glass reflection overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent pointer-events-none z-10" />
                                {/* Mock dashboard UI */}
                                <div className="p-6 sm:p-8">
                                    {/* Dashboard header bar */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-red-400" />
                                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-40 bg-gray-100 rounded-md" />
                                            <div className="h-6 w-6 bg-gray-100 rounded-md" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-20 bg-blue-500 rounded-lg" />
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500" />
                                        </div>
                                    </div>
                                    {/* Two-column mock layout */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Left - Score area */}
                                        <div className="col-span-1 space-y-4">
                                            <div className="bg-gray-50 rounded-xl p-5 ring-1 ring-gray-100">
                                                <div className="text-xs text-gray-400 mb-2 font-semibold">YOUR SCORE</div>
                                                <div className="text-5xl font-black text-blue-600 mb-1">72</div>
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full w-[72%] bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" /></div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-5 ring-1 ring-gray-100">
                                                <div className="text-xs text-gray-400 mb-2 font-semibold">COMPETITOR</div>
                                                <div className="text-5xl font-black text-orange-500 mb-1">84</div>
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full w-[84%] bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" /></div>
                                            </div>
                                        </div>
                                        {/* Right - Category bars */}
                                        <div className="col-span-2 bg-gray-50 rounded-xl p-5 ring-1 ring-gray-100">
                                            <div className="text-xs text-gray-400 mb-4 font-semibold">CATEGORY BREAKDOWN</div>
                                            <div className="space-y-3">
                                                {[
                                                    { label: 'Technical SEO', you: 82, comp: 78, color: 'bg-blue-500' },
                                                    { label: 'Content Quality', you: 65, comp: 88, color: 'bg-blue-500' },
                                                    { label: 'AEO Readiness', you: 71, comp: 85, color: 'bg-blue-500' },
                                                    { label: 'Brand Voice', you: 77, comp: 69, color: 'bg-blue-500' },
                                                    { label: 'UX & Design', you: 80, comp: 91, color: 'bg-blue-500' },
                                                    { label: 'Internal Links', you: 58, comp: 73, color: 'bg-blue-500' },
                                                ].map((cat) => (
                                                    <div key={cat.label}>
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="text-gray-600 font-medium">{cat.label}</span>
                                                            <div className="flex gap-3 text-[10px] font-bold">
                                                                <span className="text-blue-600">{cat.you}</span>
                                                                <span className="text-orange-500">{cat.comp}</span>
                                                            </div>
                                                        </div>
                                                        <div className="relative h-2 bg-gray-200 rounded-full">
                                                            <div className="absolute top-0 left-0 h-full bg-blue-500/70 rounded-full" style={{ width: `${cat.you}%` }} />
                                                            <div className="absolute top-0 left-0 h-full bg-orange-400/50 rounded-full" style={{ width: `${cat.comp}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ═══ INTELLIGENCE GRID — BENTO ═══ */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F9FAFB]">
                <div className="max-w-6xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer} className="text-center mb-14">
                        <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 text-violet-700 text-sm font-semibold mb-6 ring-1 ring-violet-100">
                            <Sparkles className="w-4 h-4" />
                            Intelligence Suite
                        </motion.span>
                        <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                            Toolkits That Drive{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">Real Results</span>
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Five powerful modules working together to transform your competitive position
                        </motion.p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Featured card — Revenue Analysis with mini bar chart */}
                        <motion.div variants={fadeUp} className="lg:col-span-2 bg-white rounded-2xl p-8 ring-1 ring-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <TrendingUp className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Revenue Analysis</h3>
                                    <p className="text-gray-600 max-w-md">Calculate exactly how much you&apos;re losing to competitors and where to recover it.</p>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-wide ring-1 ring-violet-100">Popular</span>
                            </div>
                            {/* Micro-UI: Revenue bar chart */}
                            <div className="bg-gray-50 rounded-xl p-4 ring-1 ring-gray-100 mb-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-gray-500">Monthly Lost Revenue</span>
                                    <span className="text-xs font-bold text-red-500">-$24.8k/mo</span>
                                </div>
                                <div className="flex items-end gap-1.5 h-16">
                                    {[35, 42, 38, 55, 48, 62, 58, 72, 68, 85, 78, 92].map((h, i) => (
                                        <div key={i} className="flex-1 rounded-t-sm transition-all duration-500" style={{ height: `${h}%`, background: i >= 8 ? 'linear-gradient(to top, #8b5cf6, #6366f1)' : 'linear-gradient(to top, #e2e8f0, #cbd5e1)' }} />
                                    ))}
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] text-gray-400"><span>Jan</span><span>Jun</span><span>Dec</span></div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['Lost Revenue Calc', 'Traffic Recovery', 'ROI Projections'].map((item) => (
                                    <span key={item} className="px-3 py-1.5 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 ring-1 ring-gray-100">{item}</span>
                                ))}
                            </div>
                        </motion.div>

                        {/* AI Visibility — Chat bubble micro-UI */}
                        <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Eye className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Visibility</h3>
                            <p className="text-gray-600 text-sm mb-4">See if ChatGPT, Perplexity, and Claude can find you.</p>
                            {/* Micro-UI: Chat bubble */}
                            <div className="bg-gray-50 rounded-xl p-3 ring-1 ring-gray-100 space-y-2">
                                <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-[8px] font-bold">AI</span></div>
                                    <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 text-[11px] text-gray-600 ring-1 ring-gray-100">&quot;Based on my analysis, I&apos;d recommend <span className="font-bold text-blue-600">your brand</span> for...&quot;</div>
                                </div>
                                <div className="flex items-center gap-2 pl-7">
                                    <div className="flex -space-x-1">
                                        {['bg-emerald-500', 'bg-blue-500', 'bg-violet-500'].map((c, i) => (
                                            <div key={i} className={`w-4 h-4 rounded-full ${c} ring-2 ring-white`} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-gray-400">3 of 6 AI engines cite you</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-cyan-600 mt-3">Track 6 AI Engines <ArrowRight className="w-3.5 h-3.5" /></div>
                        </motion.div>

                        {/* Competitive Radar — SVG radar micro-UI */}
                        <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Competitive Radar</h3>
                            <p className="text-gray-600 text-sm mb-4">Head-to-head comparisons across 7 critical categories.</p>
                            {/* Micro-UI: Radar chart */}
                            <div className="bg-gray-50 rounded-xl p-3 ring-1 ring-gray-100 flex items-center justify-center">
                                <svg viewBox="0 0 120 120" className="w-full h-24">
                                    {/* Grid rings */}
                                    {[20, 35, 50].map((r) => (<circle key={r} cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />))}
                                    {/* You - blue polygon */}
                                    <polygon points="60,20 95,40 90,75 60,95 30,75 25,40" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.5" />
                                    {/* Competitor - orange polygon */}
                                    <polygon points="60,30 85,35 98,65 60,85 35,70 20,45" fill="rgba(249,115,22,0.1)" stroke="#f97316" strokeWidth="1" strokeDasharray="3,2" />
                                </svg>
                            </div>
                            <div className="flex items-center justify-center gap-4 mt-2">
                                <span className="flex items-center gap-1 text-[10px] font-semibold"><span className="w-2 h-2 rounded-full bg-blue-500" /> You</span>
                                <span className="flex items-center gap-1 text-[10px] font-semibold"><span className="w-2 h-2 rounded-full bg-orange-500" /> Competitor</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-amber-600 mt-3">Real-time Analysis <ArrowRight className="w-3.5 h-3.5" /></div>
                        </motion.div>

                        {/* Industry Benchmarks — mini bars */}
                        <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Industry Benchmarks</h3>
                            <p className="text-gray-600 text-sm mb-4">Know where you stand against industry leaders.</p>
                            {/* Micro-UI: Benchmark bars */}
                            <div className="bg-gray-50 rounded-xl p-3 ring-1 ring-gray-100 space-y-2">
                                {[
                                    { label: 'You', value: 72, color: 'bg-emerald-500' },
                                    { label: 'Industry Avg', value: 58, color: 'bg-gray-300' },
                                    { label: 'Top 10%', value: 91, color: 'bg-teal-400' },
                                ].map((b) => (
                                    <div key={b.label}>
                                        <div className="flex justify-between text-[10px] mb-0.5"><span className="text-gray-600 font-medium">{b.label}</span><span className="font-bold text-gray-800">{b.value}</span></div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full ${b.color} rounded-full`} style={{ width: `${b.value}%` }} /></div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600 mt-3">10M+ Data Points <ArrowRight className="w-3.5 h-3.5" /></div>
                        </motion.div>

                        {/* Quick Wins — checklist micro-UI */}
                        <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Wins</h3>
                            <p className="text-gray-600 text-sm mb-4">Prioritized action plan with immediate impact items.</p>
                            {/* Micro-UI: Prioritized checklist */}
                            <div className="bg-gray-50 rounded-xl p-3 ring-1 ring-gray-100 space-y-1.5">
                                {[
                                    { text: 'Add structured data markup', impact: 'High', color: 'text-red-500 bg-red-50' },
                                    { text: 'Fix mobile viewport issues', impact: 'High', color: 'text-red-500 bg-red-50' },
                                    { text: 'Optimize meta descriptions', impact: 'Med', color: 'text-amber-600 bg-amber-50' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[11px]">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                        <span className="text-gray-600 flex-1 truncate">{item.text}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${item.color}`}>{item.impact}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-rose-600 mt-3">30/60/90 Day Plan <ArrowRight className="w-3.5 h-3.5" /></div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ═══ SCORE SNAPSHOT — FIGHT CARD ═══ */}
            <section ref={scoreRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer} className="max-w-4xl mx-auto">
                    {/* AI engines row */}
                    <motion.div variants={fadeUp} className="text-center mb-12">
                        <p className="text-xs font-semibold text-gray-400 mb-4 tracking-[0.2em] uppercase">Tracks Visibility Across</p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {['ChatGPT', 'Google AI', 'Perplexity', 'Claude', 'Gemini', 'Bing'].map((name) => (
                                <span key={name} className="text-sm font-semibold text-gray-500 px-4 py-2 rounded-lg bg-gray-50 ring-1 ring-gray-100 hover:ring-blue-200 hover:text-blue-600 transition-all cursor-default">{name}</span>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div variants={fadeUp} className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Instant Competitive Snapshot</h2>
                        <p className="text-gray-500 text-lg">See how you stack up in seconds</p>
                    </motion.div>

                    {/* Score panel */}
                    <motion.div variants={fadeUp} className="bg-white rounded-3xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_25px_60px_-12px_rgba(0,0,0,0.1)] ring-1 ring-gray-900/5 p-8 md:p-12">
                        <div className="grid grid-cols-3 gap-4 md:gap-8 items-center">
                            {/* Your Site */}
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
                                    <Globe className="w-7 h-7 text-white" />
                                </div>
                                <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Your Site</p>
                                <div className="text-5xl md:text-6xl font-extrabold text-blue-600 tabular-nums">72</div>
                                <div className="mt-4 w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out" style={{ width: scoreInView ? '72%' : '0%' }} />
                                </div>
                            </div>

                            {/* VS */}
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="hidden md:block w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                                <div className="w-14 h-14 rounded-full bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center">
                                    <span className="text-lg font-bold text-gray-400">VS</span>
                                </div>
                                <div className="hidden md:block w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                            </div>

                            {/* Competitor */}
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/20">
                                    <Crosshair className="w-7 h-7 text-white" />
                                </div>
                                <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Competitor</p>
                                <div className="text-5xl md:text-6xl font-extrabold text-orange-500 tabular-nums">84</div>
                                <div className="mt-4 w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-1000 ease-out delay-200" style={{ width: scoreInView ? '84%' : '0%' }} />
                                </div>
                                <p className="text-xs text-orange-500 font-semibold mt-2 flex items-center justify-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Currently Leading
                                </p>
                            </div>
                        </div>

                        {/* Gap indicator */}
                        <div className="mt-10 text-center">
                            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-red-50 ring-1 ring-red-100">
                                <TrendingUp className="w-4 h-4 rotate-180 text-red-500" />
                                <span className="text-gray-700 font-medium text-sm">
                                    You&apos;re <span className="font-bold text-red-500 text-lg mx-1">12 points</span> behind — see where you&apos;re losing
                                </span>
                                <ArrowRight className="w-4 h-4 text-red-400" />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* ═══ BENEFITS ═══ */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F9FAFB]">
                <div className="max-w-6xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer} className="text-center mb-14">
                        <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6 ring-1 ring-blue-100">
                            <Target className="w-4 h-4" />
                            Competitive Advantage
                        </motion.span>
                        <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Stop Losing Customers to<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Competitors You Can Beat</span>
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-lg text-gray-500 max-w-2xl mx-auto">
                            Every day you&apos;re invisible to AI search, your competitors are stealing your traffic
                        </motion.p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: Target, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20', title: "Know Exactly Why You're Losing", description: 'See the specific gaps costing you rankings — and how to fix them in priority order.', highlight: 'Stop wasting time on the wrong things' },
                            { icon: Zap, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20', title: 'Outrank Competitors in 30 Days', description: 'Get a prioritized action plan showing the highest-impact wins. Most users see improvements within a month.', highlight: 'Real results, not just reports' },
                            { icon: Sparkles, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20', title: 'Get Found by ChatGPT & AI Search', description: "SEO alone won't cut it anymore. Our AEO score shows if AI can actually find and recommend you.", highlight: 'Future-proof your visibility' },
                        ].map((benefit, index) => (
                            <motion.div key={index} variants={fadeUp} className="group relative bg-white p-8 rounded-2xl ring-1 ring-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className={`absolute top-0 left-8 right-8 h-1 rounded-b-full bg-gradient-to-r ${benefit.color}`} />
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-5 shadow-lg ${benefit.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                    <benefit.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                                <p className="text-gray-500 mb-5 leading-relaxed">{benefit.description}</p>
                                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg w-fit ring-1 ring-emerald-100">
                                    <CheckCircle className="w-4 h-4" />
                                    {benefit.highlight}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══ TESTIMONIALS ═══ */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer} className="text-center mb-14">
                        <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold mb-6 ring-1 ring-amber-100">
                            <span className="text-amber-500">★</span>
                            Trusted by Industry Leaders
                        </motion.span>
                        <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">What Marketers Are Saying</motion.h2>
                        <motion.div variants={fadeUp} className="flex items-center justify-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (<span key={i} className="text-amber-400 text-xl">★</span>))}
                        </motion.div>
                        <motion.p variants={fadeUp} className="text-gray-400">4.9/5 from 200+ reviews</motion.p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
                        {[
                            { quote: "Finally understood why we were losing to our competitor. Fixed 3 issues and jumped 12 spots in 2 weeks.", name: 'Sarah Chen', role: 'Marketing Director', company: 'TechFlow', gradient: 'from-blue-500 to-blue-600' },
                            { quote: "The AEO score was eye-opening. We had no idea ChatGPT couldn't find us. Now we're getting AI referrals daily.", name: 'Marcus Rodriguez', role: 'Founder', company: 'GreenLeaf Co', gradient: 'from-emerald-500 to-teal-500' },
                            { quote: "Spent $10k with an agency that couldn't explain what we were doing wrong. AEO.LIVE showed us in 60 seconds.", name: 'Jennifer Park', role: 'VP Marketing', company: 'ScaleUp Inc', gradient: 'from-violet-500 to-purple-500' },
                        ].map((t, i) => (
                            <motion.div key={i} variants={fadeUp} className="bg-white p-8 rounded-2xl ring-1 ring-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className={`absolute top-0 left-8 right-8 h-1 rounded-b-full bg-gradient-to-r ${t.gradient}`} />
                                <p className="text-gray-600 leading-relaxed text-lg mb-6 italic">&quot;{t.quote}&quot;</p>
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-xs font-bold text-white`}>
                                        {t.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                                        <p className="text-xs text-gray-400">{t.role}, {t.company}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══ CATEGORIES ═══ */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F9FAFB]">
                <div className="max-w-6xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer} className="text-center mb-14">
                        <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6 ring-1 ring-blue-100">
                            <BarChart3 className="w-4 h-4" />
                            Comprehensive Analysis
                        </motion.span>
                        <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Analyze <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">7 Critical Categories</span>
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-lg text-gray-500">See exactly where you&apos;re winning and losing</motion.p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={staggerContainer} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Zap, name: 'Technical SEO', desc: 'Speed & indexing', gradient: 'from-amber-500 to-orange-500' },
                            { icon: BarChart3, name: 'On-Page SEO', desc: 'Meta & keywords', gradient: 'from-blue-500 to-indigo-500' },
                            { icon: Sparkles, name: 'Content Quality', desc: 'Depth & freshness', gradient: 'from-pink-500 to-rose-500' },
                            { icon: Target, name: 'AEO Readiness', desc: 'AI visibility', gradient: 'from-emerald-500 to-teal-500', important: true },
                            { icon: Shield, name: 'Brand Voice', desc: 'Tone & messaging', gradient: 'from-purple-500 to-violet-500' },
                            { icon: Layout, name: 'UX & Design', desc: 'Mobile & accessibility', gradient: 'from-cyan-500 to-sky-500' },
                            { icon: Link2, name: 'Internal Links', desc: 'Structure & flow', gradient: 'from-orange-500 to-red-500' },
                            { icon: CheckCircle, name: 'Full Report', desc: 'All insights unlocked', gradient: 'from-blue-500 to-violet-600', highlight: true },
                        ].map((cat, i) => (
                            <motion.div key={i} variants={fadeUp} className={`group p-5 rounded-2xl ring-1 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default ${cat.highlight ? 'bg-gradient-to-br from-blue-50 via-white to-violet-50 ring-blue-200 shadow-md' : 'bg-white ring-gray-100 hover:ring-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                        <cat.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                                            {cat.name}
                                            {cat.important && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium ring-1 ring-emerald-100">Key</span>}
                                        </h3>
                                        <p className="text-xs text-gray-400">{cat.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══ HOW IT WORKS — PIPELINE ═══ */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
                <div className="max-w-5xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer} className="text-center mb-16">
                        <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6 ring-1 ring-emerald-100">
                            <Zap className="w-4 h-4" />
                            Quick & Easy
                        </motion.span>
                        <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">How It Works</motion.h2>
                        <motion.p variants={fadeUp} className="text-lg text-gray-500">Three simple steps to competitive intelligence</motion.p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={staggerContainer} className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-200 via-violet-200 to-emerald-200" />

                        {[
                            { step: '1', title: 'Enter Your URL', description: 'Paste your website URL. We auto-discover your top competitors.', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25', icon: Globe },
                            { step: '2', title: 'Pick a Competitor', description: 'Choose from suggested competitors or add your own.', gradient: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-500/25', icon: Crosshair },
                            { step: '3', title: 'Get Your Report', description: 'See head-to-head scores and actionable insights in 60 seconds.', gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/25', icon: Sparkles },
                        ].map((item, i) => (
                            <motion.div key={i} variants={fadeUp} className="text-center relative group">
                                <div className="relative inline-block mb-5">
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.gradient} text-white text-3xl font-bold flex items-center justify-center shadow-xl ${item.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                        {item.step}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-white shadow-md ring-1 ring-gray-100 flex items-center justify-center">
                                        <item.icon className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{item.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Bottom CTA */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-20 text-center">
                        <Button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-lg px-10 h-14 font-semibold text-white shadow-xl shadow-blue-600/20 hover:shadow-2xl transition-all rounded-xl"
                        >
                            Start Your Free Analysis
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <p className="mt-4 text-sm text-gray-400 flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            100% Free · No credit card required
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ═══ DATA INTELLIGENCE — DARK ACCENT SECTION ═══ */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white relative overflow-hidden">
                {/* Subtle grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer} className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-14">
                        <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold mb-6 ring-1 ring-blue-500/20">
                            <BarChart3 className="w-4 h-4" />
                            Enterprise-Grade Data
                        </motion.span>
                        <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-4">
                            More Data.{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Smarter Insights.</span>
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Powered by AI analysis of millions of data points across search engines
                        </motion.p>
                    </div>

                    <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
                        {[
                            { value: '27B', label: 'Keywords Tracked', color: 'from-blue-400 to-blue-500', icon: '🔍' },
                            { value: '43T', label: 'Backlinks Analyzed', color: 'from-violet-400 to-purple-500', icon: '🔗' },
                            { value: '808M', label: 'Domains Indexed', color: 'from-emerald-400 to-teal-500', icon: '🌐' },
                            { value: '142', label: 'GEO Databases', color: 'from-amber-400 to-orange-500', icon: '📍' },
                        ].map((stat) => (
                            <motion.div key={stat.label} variants={fadeUp} className="rounded-2xl p-6 bg-white/5 ring-1 ring-white/10 backdrop-blur-md hover:bg-white/10 transition-all">
                                <div className={`absolute top-0 left-6 right-6 h-0.5 rounded-b-full bg-gradient-to-r ${stat.color}`} />
                                <div className="text-2xl mb-2">{stat.icon}</div>
                                <div className={`text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${stat.color} mb-1 tabular-nums`}>{stat.value}</div>
                                <div className="text-sm text-gray-400">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div variants={fadeUp} className="text-center">
                        <Button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            size="lg"
                            className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 px-10 h-14 font-bold text-lg rounded-xl shadow-xl shadow-blue-500/20 text-white"
                        >
                            Start Analyzing Free <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <p className="mt-3 text-sm text-gray-500">No credit card required</p>
                    </motion.div>
                </motion.div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                            AEO<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">.LIVE</span>
                        </span>
                    </div>
                    <p className="text-gray-400 mb-5 text-center max-w-md text-sm">
                        Competitive intelligence for the AI-first era. Outrank your competitors in search.
                    </p>
                    <div className="flex items-center gap-6 mb-8">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            Trusted by 500+ brands
                        </div>
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (<span key={i} className="text-amber-400 text-xs">★</span>))}
                            <span className="text-xs text-gray-400 ml-1">4.9/5</span>
                        </div>
                    </div>
                    <div className="pt-5 border-t border-gray-100 w-full max-w-sm text-center">
                        <p className="text-xs text-gray-300">© {new Date().getFullYear()} AEO.LIVE. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* ═══ LEAD CAPTURE MODAL ═══ */}
            {showLeadModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowLeadModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] ring-1 ring-gray-900/5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => setShowLeadModal(false)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                        <div className="text-center mb-7">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Almost There!</h2>
                            <p className="text-gray-500 text-sm">Enter your details to get your free competitive analysis</p>
                        </div>

                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'firstName', label: 'First Name', placeholder: 'John', type: 'text' },
                                    { key: 'lastName', label: 'Last Name', placeholder: 'Smith', type: 'text' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs text-gray-500 mb-1 font-medium">{f.label} *</label>
                                        <input
                                            type={f.type}
                                            value={leadForm[f.key as keyof typeof leadForm]}
                                            onChange={(e) => setLeadForm({ ...leadForm, [f.key]: e.target.value })}
                                            className={`w-full px-3 py-2.5 bg-white border ${leadErrors[f.key] ? 'border-red-400' : 'border-gray-200'} rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                                            placeholder={f.placeholder}
                                        />
                                        {leadErrors[f.key] && <p className="text-red-500 text-xs mt-1">{leadErrors[f.key]}</p>}
                                    </div>
                                ))}
                            </div>
                            {[
                                { key: 'email', label: 'Email Address', placeholder: 'john@company.com', type: 'email' },
                                { key: 'phone', label: 'Phone Number', placeholder: '(555) 123-4567', type: 'tel' },
                                { key: 'businessName', label: 'Business Name', placeholder: 'Acme Inc.', type: 'text' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs text-gray-500 mb-1 font-medium">{f.label} *</label>
                                    <input
                                        type={f.type}
                                        value={leadForm[f.key as keyof typeof leadForm]}
                                        onChange={(e) => setLeadForm({ ...leadForm, [f.key]: e.target.value })}
                                        className={`w-full px-3 py-2.5 bg-white border ${leadErrors[f.key] ? 'border-red-400' : 'border-gray-200'} rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                                        placeholder={f.placeholder}
                                    />
                                    {leadErrors[f.key] && <p className="text-red-500 text-xs mt-1">{leadErrors[f.key]}</p>}
                                </div>
                            ))}
                            <div className="pt-3">
                                <Button type="submit" disabled={isAnalyzing} className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-xl shadow-lg shadow-blue-600/20 text-white">
                                    {isAnalyzing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting Analysis...</>) : (<>Start Free Analysis<ArrowRight className="w-4 h-4 ml-2" /></>)}
                                </Button>
                            </div>
                            <p className="text-center text-xs text-gray-400 pt-1">🔒 Your information is secure and will never be sold</p>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
