'use client';

/**
 * DashboardHeroPreview — a "live UI" composition rendered inside the
 * Hero 3D-tilt container.  All data is hardcoded to a best-case
 * "success state" so the hero always looks impressive.
 *
 * The parent wraps this in `pointer-events-none` so nothing is clickable.
 */

import {
    TrendingUp, ArrowUpRight, ArrowDownRight,
    Shield, Eye, Zap, BarChart3, Target, Link2,
    CheckCircle, Star
} from 'lucide-react';

/* ── Colour helpers ── */
const scoreColor = (v: number) =>
    v >= 80 ? 'text-emerald-600' : v >= 60 ? 'text-blue-600' : 'text-amber-600';
const barColor = (v: number) =>
    v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-blue-500' : 'bg-amber-500';

/* ── Hardcoded success-state data ── */
const YOU = { name: 'yourbrand.com', score: 92 };
const COMP = { name: 'competitor.com', score: 67 };

const categories = [
    { label: 'Technical SEO', icon: Shield, you: 95, comp: 72 },
    { label: 'Content Quality', icon: BarChart3, you: 88, comp: 64 },
    { label: 'AEO Readiness', icon: Eye, you: 91, comp: 58 },
    { label: 'Brand Voice', icon: Star, you: 94, comp: 71 },
    { label: 'UX & Design', icon: Zap, you: 87, comp: 69 },
    { label: 'Internal Links', icon: Link2, you: 90, comp: 63 },
];

const quickWins = [
    { text: 'Add FAQ schema to 12 pages', impact: '+8 pts', done: true },
    { text: 'Compress hero images (saves 1.2s)', impact: '+5 pts', done: true },
    { text: 'Internal-link orphan pages (4 found)', impact: '+6 pts', done: false },
];

export default function DashboardHeroPreview() {
    return (
        <div className="bg-white text-slate-900 select-none">
            {/* ── Window chrome ── */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/80">
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-white ring-1 ring-slate-200 text-xs text-slate-400">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        app.aeo.live/dashboard
                    </div>
                </div>
                <div className="w-16" /> {/* balance spacer */}
            </div>

            {/* ── Dashboard body ── */}
            <div className="p-5 sm:p-6 space-y-5">
                {/* Row 1: Score cards + Revenue */}
                <div className="grid grid-cols-12 gap-4">
                    {/* YOUR SCORE — big gauge */}
                    <div className="col-span-3 bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 ring-1 ring-indigo-100">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Your Score</p>
                        <div className="flex items-end gap-1">
                            <span className="text-5xl font-black text-indigo-600 leading-none">{YOU.score}</span>
                            <span className="text-xs font-bold text-emerald-500 flex items-center mb-1"><ArrowUpRight className="w-3 h-3" />+12</span>
                        </div>
                        {/* gauge bar */}
                        <div className="mt-3 h-2 bg-indigo-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${YOU.score}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">yourbrand.com</p>
                    </div>

                    {/* COMPETITOR SCORE */}
                    <div className="col-span-3 bg-slate-50 rounded-xl p-4 ring-1 ring-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Competitor</p>
                        <div className="flex items-end gap-1">
                            <span className="text-5xl font-black text-slate-500 leading-none">{COMP.score}</span>
                            <span className="text-xs font-bold text-red-500 flex items-center mb-1"><ArrowDownRight className="w-3 h-3" />-4</span>
                        </div>
                        <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: `${COMP.score}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">competitor.com</p>
                    </div>

                    {/* REVENUE IMPACT */}
                    <div className="col-span-6 bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 ring-1 ring-emerald-100">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Revenue Opportunity</p>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">IDENTIFIED</span>
                        </div>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-emerald-600 leading-none">$42.8k</span>
                            <span className="text-sm text-slate-500 mb-0.5">/month recoverable</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {[
                                { label: 'Lost Traffic', val: '2,840', sub: 'visits/mo' },
                                { label: 'Keyword Gaps', val: '47', sub: 'opportunities' },
                                { label: 'Quick Fixes', val: '12', sub: 'high-impact' },
                            ].map((m) => (
                                <div key={m.label} className="bg-white rounded-lg p-2 ring-1 ring-emerald-50">
                                    <p className="text-[9px] text-slate-400 font-semibold">{m.label}</p>
                                    <p className="text-lg font-bold text-slate-800 leading-tight">{m.val}</p>
                                    <p className="text-[9px] text-slate-400">{m.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Row 2: Category breakdown + Quick Wins */}
                <div className="grid grid-cols-12 gap-4">
                    {/* Category comparison bars */}
                    <div className="col-span-8 bg-white rounded-xl p-4 ring-1 ring-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-700">Category Breakdown</p>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600"><span className="w-2 h-2 rounded-full bg-indigo-500" /> You</span>
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-300" /> Competitor</span>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            {categories.map((cat) => (
                                <div key={cat.label} className="flex items-center gap-3">
                                    <cat.icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <span className="text-[11px] text-slate-600 font-medium w-24 flex-shrink-0">{cat.label}</span>
                                    <div className="flex-1 relative h-3 bg-slate-100 rounded-full overflow-hidden">
                                        {/* competitor bar (behind) */}
                                        <div className="absolute inset-y-0 left-0 bg-slate-200 rounded-full" style={{ width: `${cat.comp}%` }} />
                                        {/* your bar (front) */}
                                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${cat.you}%` }} />
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0 w-14 justify-end">
                                        <span className={`text-[11px] font-bold ${scoreColor(cat.you)}`}>{cat.you}</span>
                                        <span className="text-[11px] font-bold text-slate-300">{cat.comp}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Wins sidebar */}
                    <div className="col-span-4 bg-gradient-to-br from-amber-50 to-white rounded-xl p-4 ring-1 ring-amber-100">
                        <div className="flex items-center gap-1.5 mb-3">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <p className="text-xs font-bold text-slate-700">Quick Wins</p>
                            <span className="ml-auto px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-bold">3 found</span>
                        </div>
                        <div className="space-y-2">
                            {quickWins.map((w, i) => (
                                <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-2.5 ring-1 ring-amber-50">
                                    <CheckCircle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${w.done ? 'text-emerald-500' : 'text-slate-300'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-slate-700 font-medium leading-tight">{w.text}</p>
                                        <p className="text-[9px] text-emerald-600 font-bold mt-0.5">{w.impact}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
