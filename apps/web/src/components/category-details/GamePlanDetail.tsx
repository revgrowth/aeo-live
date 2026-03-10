'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, Clock, BarChart3, Target, Crosshair, Copy, Check } from 'lucide-react';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    Radar, Legend, ResponsiveContainer,
} from 'recharts';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface CategoryLike {
    name: string;
    yourScore: number;
    competitorScore: number;
    status?: string;
    insights?: string[];
    recommendations?: string[];
}

interface RecommendationLike {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact?: string;
}

interface GamePlanReport {
    yourUrl: string;
    competitorUrl: string;
    yourScore: number;
    competitorScore: number;
    categories: CategoryLike[];
    recommendations?: RecommendationLike[];
    intelligenceReport?: any;
}

interface GamePlanDetailProps {
    report: GamePlanReport;
    onNavigateToTab?: (tabId: string) => void;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function safeDomain(url: string | undefined): string {
    if (!url) return 'unknown';
    try { return new URL(url).hostname.replace('www.', ''); }
    catch { return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'unknown'; }
}

function tabIdForCategory(name: string): string {
    if (name === 'Brand Voice') return 'brand-voice-dna';
    return name.toLowerCase().replace(/\s+/g, '-');
}

/* severity from absolute gap */
function severityFromGap(gap: number): { label: string; color: string; border: string; bg: string; text: string } {
    const abs = Math.abs(gap);
    if (abs >= 15) return { label: 'CRITICAL', color: '#ef4444', border: 'border-l-red-500', bg: 'bg-red-50', text: 'text-red-600' };
    if (abs >= 5) return { label: 'HIGH', color: '#f97316', border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' };
    return { label: 'MEDIUM', color: '#f59e0b', border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' };
}

function effortEstimate(gap: number): string {
    const abs = Math.abs(gap);
    if (abs >= 20) return '2-3 weeks';
    if (abs >= 10) return '1-2 weeks';
    if (abs >= 5) return '3-5 days';
    return '1-2 days';
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export function GamePlanDetail({ report, onNavigateToTab }: GamePlanDetailProps) {
    const competitorDomain = safeDomain(report.competitorUrl);
    const scoreDiff = report.yourScore - report.competitorScore;
    const isAhead = scoreDiff > 0;

    /* ── Derived data ── */

    // Priority actions: categories sorted by absolute gap descending (only categories where we're behind)
    const priorityActions = useMemo(() => {
        return [...report.categories]
            .map(cat => {
                const gap = cat.yourScore - cat.competitorScore;
                return { ...cat, gap, absGap: Math.abs(gap) };
            })
            .filter(c => c.gap < 0)           // only categories where we're behind
            .sort((a, b) => b.absGap - a.absGap)
            .slice(0, 5);
    }, [report.categories]);

    // Calculate total potential points from closing gaps
    const totalPotentialPoints = useMemo(() => {
        return report.categories
            .filter(c => c.yourScore < c.competitorScore)
            .reduce((sum, c) => sum + (c.competitorScore - c.yourScore), 0);
    }, [report.categories]);

    // Quick wins: recommendations filtered to high/medium, or from intelligence report
    const quickWins = useMemo(() => {
        const recs = (report.recommendations ?? [])
            .filter(r => r.priority === 'high' || r.priority === 'medium')
            .map((r, i) => ({
                id: i,
                title: r.title,
                description: r.description,
                priority: r.priority,
                impact: r.impact ?? '',
            }));

        // Also pull from intelligenceReport.strategicRoadmap.quickWins if present
        const irQuickWins = report.intelligenceReport?.strategicRoadmap?.quickWins;
        if (Array.isArray(irQuickWins)) {
            irQuickWins.forEach((w: any, i: number) => {
                recs.push({
                    id: recs.length + i,
                    title: w.title ?? `Quick Win #${w.number ?? i + 1}`,
                    description: w.action ?? '',
                    priority: w.impact === 'high' ? 'high' : 'medium',
                    impact: w.pointsGain ? `+${w.pointsGain} pts` : '',
                });
            });
        }
        return recs;
    }, [report.recommendations, report.intelligenceReport]);

    const priorityActionCount = priorityActions.length;
    const quickWinCount = quickWins.length;

    // Revenue estimate from gap (simple projection: 5% traffic improvement per 10 pts gap = $500/mo per 10 pts)
    const monthlyRevEstimate = Math.round(Math.abs(scoreDiff) * 50);

    /* ── Radar data ── */
    const radarData = useMemo(() =>
        report.categories.map(cat => ({
            category: cat.name.replace('&', '\n&'),
            you: Math.round(cat.yourScore),
            competitor: Math.round(cat.competitorScore),
        })),
        [report.categories],
    );

    return (
        <div className="space-y-8">

            {/* ═══════════════════════════════════════════
                SECTION 1: HERO HEADER
                ═══════════════════════════════════════════ */}
            <div
                className="relative overflow-hidden rounded-2xl p-8 md:p-10"
                style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
            >
                {/* Decorative glow */}
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-violet-500/15 to-purple-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-to-br from-teal-500/15 to-emerald-600/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    {/* Title row */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                    <Crosshair className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-white">Strategic Game Plan</h1>
                            </div>
                            <p className="text-slate-400 text-sm md:text-base">
                                Your prioritized roadmap to outperform <span className="text-slate-300 font-semibold">{competitorDomain}</span>
                            </p>
                        </div>

                        {/* Gap badge */}
                        <div className="flex flex-col items-start md:items-end gap-2">
                            <div
                                className="px-5 py-2 rounded-xl text-2xl font-black shadow-lg"
                                style={{
                                    background: isAhead ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                    border: `1px solid ${isAhead ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                    color: isAhead ? '#34d399' : '#f87171',
                                }}
                            >
                                {isAhead ? '+' : ''}{scoreDiff} pts
                            </div>
                            {!isAhead && monthlyRevEstimate > 0 && (
                                <p className="text-teal-400 text-sm font-medium">
                                    Closing this gap could recover an estimated <span className="font-bold">${monthlyRevEstimate.toLocaleString()}/month</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stat pills */}
                    <div className="flex flex-wrap gap-3">
                        {[
                            { icon: '🎯', label: `${priorityActionCount} Priority Action${priorityActionCount !== 1 ? 's' : ''}` },
                            { icon: '⚡', label: `${quickWinCount} Quick Win${quickWinCount !== 1 ? 's' : ''}` },
                            { icon: '📈', label: `+${totalPotentialPoints} Potential Points` },
                        ].map(p => (
                            <span
                                key={p.label}
                                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <span>{p.icon}</span>
                                {p.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════
                SECTION: STRATEGIC INTELLIGENCE BRIEFING
                ═══════════════════════════════════════════ */}
            {report.intelligenceReport?.gamePlan && (
                <div
                    className="rounded-2xl p-8"
                    style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
                >
                    {/* THE WINNING VECTOR */}
                    {report.intelligenceReport.gamePlan.winningVector && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">🎯</span>
                                <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider">
                                    The Winning Vector
                                </h3>
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed">
                                {report.intelligenceReport.gamePlan.winningVector}
                            </p>
                        </div>
                    )}

                    {/* THE CRITICAL GAP */}
                    {report.intelligenceReport.gamePlan.criticalGap && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">🩸</span>
                                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                                    The Critical Gap
                                </h3>
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed">
                                {report.intelligenceReport.gamePlan.criticalGap}
                            </p>
                        </div>
                    )}

                    {/* THE TACTICAL FIX */}
                    {report.intelligenceReport.gamePlan.tacticalFix && (
                        <div className="border-t border-white/10 pt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">⚡</span>
                                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                                    The Tactical Fix
                                </h3>
                            </div>
                            <p className="text-white font-semibold text-base leading-relaxed">
                                {report.intelligenceReport.gamePlan.tacticalFix}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════
                SECTION 2: BATTLE RADAR CHART
                ═══════════════════════════════════════════ */}
            {report.categories.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Competitive Radar — Head-to-Head Across {report.categories.length} Categories</h2>
                            <p className="text-sm text-slate-500">Visual comparison of your strengths and weaknesses</p>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                            <Radar name="You" dataKey="you" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.2} strokeWidth={2} />
                            <Radar name="Competitor" dataKey="competitor" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                SECTION 3: PRIORITY ACTIONS
                ═══════════════════════════════════════════ */}
            {priorityActions.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg">
                            <Crosshair className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">🎯 Priority Actions — Biggest Impact Fixes</h2>
                            <p className="text-sm text-slate-500">Categories where you trail the most, sorted by gap size</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {priorityActions.map((action, i) => {
                            const sev = severityFromGap(action.gap);
                            // Try to find matching recommendation
                            const matchedRec = (report.recommendations ?? []).find(r =>
                                r.title.toLowerCase().includes(action.name.toLowerCase()) ||
                                r.description.toLowerCase().includes(action.name.toLowerCase())
                            );
                            return (
                                <div
                                    key={action.name}
                                    className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4`}
                                    style={{ borderLeftColor: sev.color, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                                >
                                    <div className="p-5">
                                        {/* Top row */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {/* Number circle */}
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm"
                                                    style={{ background: sev.color }}
                                                >
                                                    #{i + 1}
                                                </div>
                                                {/* Severity pill */}
                                                <span
                                                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                    style={{ background: `${sev.color}15`, color: sev.color }}
                                                >
                                                    {sev.label}
                                                </span>
                                            </div>
                                            {/* Impact score */}
                                            <span className="text-xl font-black" style={{ color: sev.color }}>
                                                +{action.absGap} points
                                            </span>
                                        </div>

                                        {/* Title + description */}
                                        <h3 className="text-base font-bold text-slate-900 mb-1.5">
                                            Close the {action.name} Gap
                                        </h3>
                                        <p className="text-sm text-slate-500 mb-3">
                                            {matchedRec
                                                ? matchedRec.description
                                                : `Your ${action.name} score is ${Math.round(action.yourScore)} vs competitor's ${Math.round(action.competitorScore)} — a ${action.absGap}-point gap. Addressing this category's weaknesses would have the highest impact on your overall competitive position.`
                                            }
                                        </p>

                                        {/* Meta row */}
                                        <div className="flex items-center gap-5 text-xs text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                Estimated effort: {effortEstimate(action.gap)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <BarChart3 className="w-3.5 h-3.5" />
                                                Category: {action.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                SECTION 4: QUICK WINS
                ═══════════════════════════════════════════ */}
            {quickWins.length > 0 && (
                <QuickWinsSection quickWins={quickWins} />
            )}

            {/* ═══════════════════════════════════════════
                SECTION: COMPETITIVE INTELLIGENCE SUMMARY
                ═══════════════════════════════════════════ */}
            {report.intelligenceReport?.gamePlan?.competitiveNarrative && (
                <div
                    className="rounded-2xl p-8"
                    style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <span className="text-lg">🏆</span>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Competitive Intelligence
                        </h2>
                    </div>

                    <p className="text-white/80 text-sm leading-relaxed mb-6">
                        {report.intelligenceReport.gamePlan.competitiveNarrative}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Where They Beat You */}
                        {(report.intelligenceReport.gamePlan.competitorAdvantages?.length ?? 0) > 0 && (
                            <div
                                className="rounded-xl p-5"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                            >
                                <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                                    <span>🔻</span> Where They Beat You
                                </h4>
                                <ul className="space-y-2">
                                    {report.intelligenceReport.gamePlan.competitorAdvantages.map((item: string, i: number) => (
                                        <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                                            <span className="text-red-400 mt-0.5">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Where You Beat Them */}
                        {(report.intelligenceReport.gamePlan.yourAdvantages?.length ?? 0) > 0 && (
                            <div
                                className="rounded-xl p-5"
                                style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)' }}
                            >
                                <h4 className="text-sm font-bold text-teal-400 mb-3 flex items-center gap-2">
                                    <span>✅</span> Where You Beat Them
                                </h4>
                                <ul className="space-y-2">
                                    {report.intelligenceReport.gamePlan.yourAdvantages.map((item: string, i: number) => (
                                        <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                                            <span className="text-teal-400 mt-0.5">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                SECTION: CONTENT REWRITES
                ═══════════════════════════════════════════ */}
            {(report.intelligenceReport?.gamePlan?.contentRewrites?.length ?? 0) > 0 && (
                <ContentRewritesSection rewrites={report.intelligenceReport.gamePlan.contentRewrites} />
            )}

            {/* ═══════════════════════════════════════════
                SECTION: COMMUNICATION STYLE
                ═══════════════════════════════════════════ */}
            {report.intelligenceReport?.copyForensics && (
                <CommunicationStyleSection data={report.intelligenceReport.copyForensics} />
            )}
            {/* ═══════════════════════════════════════════
                SECTION: 30/60/90 DAY ROADMAP
                ═══════════════════════════════════════════ */}
            <RoadmapSection roadmap={report.intelligenceReport?.strategicRoadmap} />

            {/* ═══════════════════════════════════════════
                SECTION: CONTENT TO CREATE
                ═══════════════════════════════════════════ */}
            <ContentToCreateSection content={report.intelligenceReport?.strategicRoadmap?.contentToCreate} />

            {/* ═══════════════════════════════════════════
                SECTION 5: CATEGORY GAP SUMMARY TABLE
                ═══════════════════════════════════════════ */}
            {report.categories.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Category Gap Summary</h2>
                                <p className="text-sm text-slate-500">Click any row to jump to that category&apos;s detailed analysis</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-left">
                                    <th className="px-6 py-3 font-semibold text-slate-600">Category</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">You</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Comp</th>
                                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Gap</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.categories.map((cat, i) => {
                                    const gap = Math.round(cat.yourScore - cat.competitorScore);
                                    const status = gap > 2 ? { emoji: '🟢', label: 'Ahead' }
                                        : gap < -2 ? { emoji: '🔴', label: 'Behind' }
                                        : { emoji: '🟡', label: 'Close' };
                                    return (
                                        <tr
                                            key={cat.name}
                                            className="border-t border-slate-100 hover:bg-teal-50/40 transition-colors cursor-pointer"
                                            style={{ background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}
                                            onClick={() => onNavigateToTab?.(tabIdForCategory(cat.name))}
                                        >
                                            <td className="px-6 py-3.5 font-semibold text-slate-900">{cat.name}</td>
                                            <td className="px-4 py-3.5 text-center font-bold text-emerald-600">{Math.round(cat.yourScore)}</td>
                                            <td className="px-4 py-3.5 text-center font-bold text-slate-500">{Math.round(cat.competitorScore)}</td>
                                            <td className="px-4 py-3.5 text-center font-bold" style={{ color: gap > 0 ? '#059669' : gap < 0 ? '#dc2626' : '#64748b' }}>
                                                {gap > 0 ? '+' : ''}{gap}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="flex items-center gap-1.5 text-slate-600">
                                                    <span>{status.emoji}</span>
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   QUICK WINS SUB-COMPONENT
   ═══════════════════════════════════════════════════════ */

function QuickWinsSection({ quickWins }: {
    quickWins: { id: number; title: string; description: string; priority: string; impact: string }[];
}) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Sort: high first, then medium
    const sorted = useMemo(() =>
        [...quickWins].sort((a, b) => {
            const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
            return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
        }),
        [quickWins],
    );

    return (
        <div>
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <span className="text-lg">⚡</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Quick Wins — Do These Today</h2>
                    <p className="text-sm text-slate-500">Low-effort changes with immediate impact</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[40px_1fr_90px_80px_36px] items-center px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>#</span>
                    <span>Action</span>
                    <span className="text-center">Severity</span>
                    <span className="text-center">Impact</span>
                    <span />
                </div>

                {/* Rows */}
                {sorted.map((win, i) => {
                    const isExpanded = expandedId === win.id;
                    const sevColor = win.priority === 'high' ? { bg: 'bg-orange-100', text: 'text-orange-700' }
                        : win.priority === 'medium' ? { bg: 'bg-amber-100', text: 'text-amber-700' }
                        : { bg: 'bg-slate-100', text: 'text-slate-600' };

                    return (
                        <div key={win.id}>
                            <button
                                className="w-full grid grid-cols-[40px_1fr_90px_80px_36px] items-center px-5 py-3.5 text-left hover:bg-teal-50/40 transition-colors"
                                style={{ background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}
                                onClick={() => setExpandedId(isExpanded ? null : win.id)}
                            >
                                <span className="text-sm font-bold text-slate-400">{i + 1}</span>
                                <span className="text-sm font-semibold text-slate-900 pr-2 truncate">{win.title}</span>
                                <span className="flex justify-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${sevColor.bg} ${sevColor.text}`}>
                                        {win.priority}
                                    </span>
                                </span>
                                <span className="text-xs text-center font-semibold text-slate-500">
                                    {win.impact || '—'}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-slate-400 transition-transform mx-auto ${isExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {isExpanded && win.description && (
                                <div className="px-5 pb-4 pt-1" style={{ background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                                    <p className="text-sm text-slate-600 pl-10 border-l-2 border-slate-200 ml-0.5">
                                        {win.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   CONTENT REWRITES SUB-COMPONENT
   ═══════════════════════════════════════════════════════ */

function ContentRewritesSection({ rewrites }: {
    rewrites: { title: string; strategy: string; before: string; after: string }[];
}) {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const handleCopy = useCallback(async (text: string, idx: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        } catch {
            // fallback
        }
    }, []);

    return (
        <div>
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-lg">✏️</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Content Rewrites — Copy &amp; Paste Ready</h2>
                    <p className="text-sm text-slate-500">Specific improvements based on competitive analysis</p>
                </div>
            </div>

            <div className="space-y-4">
                {rewrites.map((rewrite, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="font-bold text-gray-900">{rewrite.title}</h4>
                            <button
                                className="flex items-center gap-1.5 text-xs font-semibold border rounded-lg px-3 py-1 transition-colors"
                                style={{
                                    color: copiedIdx === i ? '#059669' : '#0d9488',
                                    borderColor: copiedIdx === i ? '#a7f3d0' : '#99f6e4',
                                }}
                                onClick={() => handleCopy(rewrite.after, i)}
                            >
                                {copiedIdx === i ? (
                                    <><Check className="w-3.5 h-3.5" /> Copied!</>
                                ) : (
                                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                                )}
                            </button>
                        </div>

                        {/* Strategy */}
                        <p className="text-sm text-gray-600 mb-4">{rewrite.strategy}</p>

                        {/* Before */}
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-3">
                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                                Before (your current copy)
                            </span>
                            <p className="text-sm text-red-800 mt-1 line-through decoration-red-300">
                                {rewrite.before}
                            </p>
                        </div>

                        {/* After */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                                After (recommended)
                            </span>
                            <p className="text-sm text-emerald-900 mt-1 font-medium">
                                {rewrite.after}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   COMMUNICATION STYLE SUB-COMPONENT
   ═══════════════════════════════════════════════════════ */

function CommunicationStyleSection({ data }: {
    data: {
        youVsWeRatio?: { you: number; we: number; analysis?: string };
        readingLevel?: { grade: number; description?: string };
        emotionalDrivers?: string[];
        clichesDetected?: { phrase: string; count: number; competitorUsage: number; replacementSuggestion?: string }[];
    };
}) {
    const ratio = data.youVsWeRatio;
    const reading = data.readingLevel;

    return (
        <div>
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-lg">🗣️</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Communication Style Analysis</h2>
                    <p className="text-sm text-slate-500">How your copy speaks to visitors vs the competition</p>
                </div>
            </div>

            {/* Voice & Tone Metrics */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5">Voice &amp; Tone Metrics</h3>

                {/* You/We ratio bar */}
                {ratio && (
                    <div className="mb-6">
                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                            <span className="font-semibold text-teal-600">YOU/YOUR: {ratio.you}%</span>
                            <span className="font-semibold text-slate-400">WE/OUR: {ratio.we}%</span>
                        </div>
                        <div className="flex h-6 rounded-full overflow-hidden bg-slate-100">
                            <div
                                className="h-full rounded-l-full flex items-center justify-center text-[10px] font-bold text-white"
                                style={{
                                    width: `${ratio.you}%`,
                                    background: 'linear-gradient(90deg, #14b8a6, #0d9488)',
                                    minWidth: '40px',
                                }}
                            >
                                {ratio.you}%
                            </div>
                            <div
                                className="h-full rounded-r-full flex items-center justify-center text-[10px] font-bold text-slate-500"
                                style={{ width: `${ratio.we}%`, background: '#e2e8f0', minWidth: '30px' }}
                            >
                                {ratio.we}%
                            </div>
                        </div>
                        {ratio.analysis && (
                            <p className="text-xs text-slate-400 mt-2">{ratio.analysis}</p>
                        )}
                    </div>
                )}

                {/* Reading Level */}
                {reading && (
                    <div className="mb-6">
                        <div className="text-xs text-slate-500 font-semibold mb-2">Reading Level</div>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                {/* Scale from grade 5 to 16 */}
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{
                                        width: `${Math.min(100, Math.max(5, ((reading.grade - 5) / 11) * 100))}%`,
                                        background: reading.grade <= 9 ? '#14b8a6' : reading.grade <= 12 ? '#f59e0b' : '#ef4444',
                                    }}
                                />
                                {/* Marker */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-sm"
                                    style={{
                                        left: `calc(${Math.min(100, Math.max(0, ((reading.grade - 5) / 11) * 100))}% - 8px)`,
                                        borderColor: reading.grade <= 9 ? '#14b8a6' : reading.grade <= 12 ? '#f59e0b' : '#ef4444',
                                    }}
                                />
                            </div>
                            <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                                Grade {reading.grade}
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>Grade 5</span>
                            <span>Grade 10</span>
                            <span>Grade 16</span>
                        </div>
                        {reading.description && (
                            <p className="text-xs text-slate-500 mt-2">{reading.description}</p>
                        )}
                    </div>
                )}

                {/* Emotional Drivers */}
                {data.emotionalDrivers && data.emotionalDrivers.length > 0 && (
                    <div>
                        <div className="text-xs text-slate-500 font-semibold mb-2">Emotional Drivers</div>
                        <div className="flex flex-wrap gap-2">
                            {data.emotionalDrivers.map((driver, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200"
                                >
                                    {driver}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Industry Clichés */}
            {data.clichesDetected && data.clichesDetected.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <span>⚠️</span> Industry Clichés Detected
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-left">
                                    <th className="px-5 py-2.5 font-semibold text-slate-500 w-8"></th>
                                    <th className="px-4 py-2.5 font-semibold text-slate-500">Cliché</th>
                                    <th className="px-4 py-2.5 font-semibold text-slate-500">Usage</th>
                                    <th className="px-5 py-2.5 font-semibold text-slate-500">Replace With</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.clichesDetected.map((c, i) => (
                                    <tr key={i} className="border-t border-slate-100" style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                        <td className="px-5 py-3 text-amber-500">⚠️</td>
                                        <td className="px-4 py-3 text-slate-700 italic">&ldquo;{c.phrase}&rdquo;</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                            {c.count}× you / {c.competitorUsage}× competitor
                                        </td>
                                        <td className="px-5 py-3 text-teal-600 text-xs font-medium">
                                            {c.replacementSuggestion || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   30/60/90 DAY ROADMAP SUB-COMPONENT
   ═══════════════════════════════════════════════════════ */

const PHASE_CONFIG = [
    {
        phase: 1, title: 'First 30 Days', subtitle: 'Foundation & Quick Fixes', days: 30,
        color: 'teal', bgClass: 'bg-teal-500', borderClass: 'border-teal-200',
        dotClass: 'text-teal-500', metricsBg: 'bg-teal-50', metricsBorder: 'border-teal-100',
        metricsTitle: 'text-teal-600', metricsText: 'text-teal-800',
        subtitleClass: 'text-teal-100',
    },
    {
        phase: 2, title: 'Days 31-60', subtitle: 'Content & Authority', days: 60,
        color: 'purple', bgClass: 'bg-purple-500', borderClass: 'border-purple-200',
        dotClass: 'text-purple-500', metricsBg: 'bg-purple-50', metricsBorder: 'border-purple-100',
        metricsTitle: 'text-purple-600', metricsText: 'text-purple-800',
        subtitleClass: 'text-purple-100',
    },
    {
        phase: 3, title: 'Days 61-90', subtitle: 'Competitive Edge', days: 90,
        color: 'green', bgClass: 'bg-green-500', borderClass: 'border-green-200',
        dotClass: 'text-green-500', metricsBg: 'bg-green-50', metricsBorder: 'border-green-100',
        metricsTitle: 'text-green-600', metricsText: 'text-green-800',
        subtitleClass: 'text-green-100',
    },
] as const;

function RoadmapSection({ roadmap }: {
    roadmap?: {
        immediateActions?: { title: string; description: string; timeline: string; category?: string }[];
        successMetrics?: { days: number; kpis: string[] }[];
    };
}) {
    // Group immediateActions into phases by timeline
    const phases = useMemo(() => {
        const actions = roadmap?.immediateActions ?? [];
        const metrics = roadmap?.successMetrics ?? [];

        return PHASE_CONFIG.map(conf => {
            // Match actions: Phase 1 = "Week 1", "Week 2", "Week 1-2" etc; Phase 2 = "Week 3-6"; Phase 3 = rest
            const phaseActions = actions.filter(a => {
                const tl = (a.timeline || '').toLowerCase();
                if (conf.phase === 1) return tl.includes('week 1') || tl.includes('week 2') || tl.includes('day') || tl.includes('immediate');
                if (conf.phase === 2) return tl.includes('week 3') || tl.includes('week 4') || tl.includes('week 5') || tl.includes('week 6') || tl.includes('month 2');
                return true; // Phase 3 gets the rest
            });

            // If we couldn't match anything via timeline, distribute evenly
            const fallbackActions = actions.length > 0 && phaseActions.length === 0;

            const phaseKPIs = metrics.find(m => m.days === conf.days)?.kpis ?? [];

            return {
                ...conf,
                actions: fallbackActions
                    ? actions.slice(
                        Math.floor((conf.phase - 1) * actions.length / 3),
                        Math.floor(conf.phase * actions.length / 3)
                    )
                    : phaseActions,
                kpis: phaseKPIs,
            };
        });
    }, [roadmap]);

    const hasData = phases.some(p => p.actions.length > 0 || p.kpis.length > 0);

    return (
        <div>
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <span className="text-lg">📅</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Your 30/60/90 Day Roadmap</h2>
                    <p className="text-sm text-slate-500">Phased execution plan with measurable milestones</p>
                </div>
            </div>

            {hasData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {phases.map(p => (
                        <div key={p.phase} className={`bg-white rounded-xl border-2 ${p.borderClass} shadow-sm overflow-hidden`}>
                            {/* Phase header */}
                            <div className={`${p.bgClass} px-5 py-3`}>
                                <div className="text-white text-xs font-bold uppercase tracking-wider">Phase {p.phase}</div>
                                <div className="text-white font-bold">{p.title}</div>
                                <div className={`${p.subtitleClass} text-xs`}>{p.subtitle}</div>
                            </div>

                            <div className="p-5">
                                {/* Action items */}
                                {p.actions.length > 0 && (
                                    <ul className="space-y-3 mb-5">
                                        {p.actions.map((action, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <span className={`${p.dotClass} mt-0.5`}>●</span>
                                                <span>{action.title || action.description}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Success metrics */}
                                {p.kpis.length > 0 && (
                                    <div className={`${p.metricsBg} rounded-lg p-3 border ${p.metricsBorder}`}>
                                        <div className={`text-xs font-bold ${p.metricsTitle} uppercase tracking-wider mb-2`}>
                                            Success Metrics
                                        </div>
                                        {p.kpis.map((kpi, i) => (
                                            <div key={i} className={`text-xs ${p.metricsText} flex items-center gap-1.5 mb-1 last:mb-0`}>
                                                <span>☐</span> {kpi}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
                    <p className="text-slate-500 text-sm mb-3">Run a fresh analysis to generate your personalized 30/60/90 roadmap</p>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-semibold cursor-default">
                        📅 Refresh Analysis
                    </span>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   CONTENT TO CREATE SUB-COMPONENT
   ═══════════════════════════════════════════════════════ */

function ContentToCreateSection({ content }: {
    content?: {
        title: string;
        format?: string;
        targetWordCount?: number;
        keyInclusion?: string;
        // Expanded fields (Part C)
        description?: string;
        intent?: string;
        trafficPotential?: string;
        priority?: string;
        instructions?: string;
        reasoning?: string;
    }[];
}) {
    const sorted = useMemo(() => {
        if (!content || content.length === 0) return [];
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return [...content].sort((a, b) =>
            (priorityOrder[a.priority ?? 'medium'] ?? 1) - (priorityOrder[b.priority ?? 'medium'] ?? 1)
        );
    }, [content]);

    return (
        <div>
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                    <span className="text-lg">📝</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Content to Create</h2>
                    <p className="text-sm text-slate-500">Specific pages to close your biggest content gaps</p>
                </div>
            </div>

            {sorted.length > 0 ? (
                <div className="space-y-4">
                    {sorted.map((item, i) => {
                        const priorityStyle = item.priority === 'high'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : item.priority === 'medium'
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200';

                        return (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-base">{item.title}</h4>
                                        {item.description && (
                                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                        )}
                                    </div>
                                    {item.priority && (
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${priorityStyle}`}>
                                            {item.priority}
                                        </span>
                                    )}
                                </div>

                                {/* Metadata grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                    {item.format && (
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <div className="text-xs text-gray-400 uppercase tracking-wider">Format</div>
                                            <div className="text-sm font-semibold text-gray-700 mt-1">{item.format}</div>
                                        </div>
                                    )}
                                    {(item.targetWordCount ?? 0) > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <div className="text-xs text-gray-400 uppercase tracking-wider">Target Length</div>
                                            <div className="text-sm font-semibold text-gray-700 mt-1">{item.targetWordCount?.toLocaleString()}+ words</div>
                                        </div>
                                    )}
                                    {item.intent && (
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <div className="text-xs text-gray-400 uppercase tracking-wider">Intent</div>
                                            <div className="text-sm font-semibold text-gray-700 mt-1 capitalize">{item.intent}</div>
                                        </div>
                                    )}
                                    {item.trafficPotential && (
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <div className="text-xs text-gray-400 uppercase tracking-wider">Traffic Potential</div>
                                            <div className="text-sm font-semibold text-gray-700 mt-1 capitalize">{item.trafficPotential}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Instructions */}
                                {(item.instructions || item.keyInclusion) && (
                                    <div className="mt-4 bg-teal-50 border border-teal-100 rounded-lg p-4">
                                        <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
                                            What to Include
                                        </div>
                                        <p className="text-sm text-teal-800">{item.instructions || item.keyInclusion}</p>
                                    </div>
                                )}

                                {/* Reasoning */}
                                {item.reasoning && (
                                    <p className="text-xs text-gray-400 mt-3 italic">{item.reasoning}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
                    <p className="text-slate-500 text-sm mb-3">Run a fresh analysis to generate content recommendations</p>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-semibold cursor-default">
                        📝 Refresh Analysis
                    </span>
                </div>
            )}
        </div>
    );
}

export default GamePlanDetail;
