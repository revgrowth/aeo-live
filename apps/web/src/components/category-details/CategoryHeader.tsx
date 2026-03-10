'use client';

import React from 'react';
import { Award, Target } from 'lucide-react';

interface CategoryHeaderProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    badge?: string;
    yourScore: number;
    competitorScore: number;
    yourDomain: string;
    competitorDomain: string;
    accentColor?: 'amber' | 'teal' | 'pink' | 'purple' | 'indigo' | 'cyan' | 'violet' | 'emerald' | 'rose';
}

const accentMap: Record<string, { orb1: string; orb2: string; badgeBg: string; badgeText: string }> = {
    amber:   { orb1: 'from-amber-500/20 to-orange-600/20',   orb2: 'from-yellow-500/15 to-amber-600/15',   badgeBg: 'bg-amber-500/20',   badgeText: 'text-amber-300' },
    teal:    { orb1: 'from-teal-500/20 to-cyan-600/20',      orb2: 'from-emerald-500/15 to-teal-600/15',    badgeBg: 'bg-teal-500/20',    badgeText: 'text-teal-300' },
    pink:    { orb1: 'from-pink-500/20 to-rose-600/20',      orb2: 'from-fuchsia-500/15 to-pink-600/15',    badgeBg: 'bg-pink-500/20',    badgeText: 'text-pink-300' },
    purple:  { orb1: 'from-purple-500/20 to-violet-600/20',   orb2: 'from-indigo-500/15 to-purple-600/15',   badgeBg: 'bg-purple-500/20',  badgeText: 'text-purple-300' },
    indigo:  { orb1: 'from-indigo-500/20 to-blue-600/20',     orb2: 'from-violet-500/15 to-indigo-600/15',   badgeBg: 'bg-indigo-500/20',  badgeText: 'text-indigo-300' },
    cyan:    { orb1: 'from-cyan-500/20 to-teal-600/20',       orb2: 'from-sky-500/15 to-cyan-600/15',        badgeBg: 'bg-cyan-500/20',    badgeText: 'text-cyan-300' },
    violet:  { orb1: 'from-violet-500/20 to-purple-600/20',   orb2: 'from-fuchsia-500/15 to-violet-600/15',  badgeBg: 'bg-violet-500/20',  badgeText: 'text-violet-300' },
    emerald: { orb1: 'from-emerald-500/20 to-green-600/20',   orb2: 'from-teal-500/15 to-emerald-600/15',    badgeBg: 'bg-emerald-500/20', badgeText: 'text-emerald-300' },
    rose:    { orb1: 'from-rose-500/20 to-red-600/20',        orb2: 'from-pink-500/15 to-rose-600/15',       badgeBg: 'bg-rose-500/20',    badgeText: 'text-rose-300' },
};

function formatDomain(url: string): string {
    try {
        return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    } catch {
        return url.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
    }
}

export function CategoryHeader({
    icon,
    title,
    subtitle,
    badge,
    yourScore,
    competitorScore,
    yourDomain,
    competitorDomain,
    accentColor = 'amber',
}: CategoryHeaderProps) {
    const scoreDiff = yourScore - competitorScore;
    const isWinning = scoreDiff > 0;
    const accent = accentMap[accentColor] || accentMap.amber;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-teal-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-rose-400';
    };

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-10">
            {/* Animated gradient orbs */}
            <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${accent.orb1} rounded-full blur-3xl animate-pulse`} />
            <div className={`absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br ${accent.orb2} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1s' }} />

            <div className="relative z-10">
                {/* Header row: icon + title + badge */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <span className="text-white [&>svg]:w-7 [&>svg]:h-7 md:[&>svg]:w-8 md:[&>svg]:h-8">
                            {icon}
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl md:text-3xl font-black text-white">{title}</h2>
                            {badge && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${accent.badgeBg} ${accent.badgeText} backdrop-blur-sm`}>
                                    {badge}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 text-sm md:text-base mt-1">{subtitle}</p>
                    </div>
                </div>

                {/* Score comparison */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                    {/* Your score */}
                    <div className="flex flex-col items-center flex-shrink-0" style={{ width: '160px' }}>
                        <div className={`text-6xl md:text-7xl font-black ${getScoreColor(yourScore)}`}>
                            {yourScore}
                        </div>
                        <div className="mt-3 text-center w-full">
                            <p className="text-white font-bold text-sm leading-tight max-w-full overflow-hidden" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                wordBreak: 'break-word'
                            }} title={yourDomain}>
                                {formatDomain(yourDomain)}
                            </p>
                            <p className="text-emerald-400 text-sm font-medium mt-1">Your Score</p>
                        </div>
                    </div>

                    {/* VS badge */}
                    <div className="flex flex-col items-center flex-shrink-0" style={{ width: '120px' }}>
                        <div className={`
                            flex flex-col items-center justify-center w-24 h-24 rounded-full
                            ${isWinning ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-2xl shadow-emerald-500/40' :
                                scoreDiff < 0 ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-2xl shadow-rose-500/40' :
                                    'bg-gradient-to-br from-slate-500 to-slate-600 shadow-2xl shadow-slate-500/40'}
                        `}>
                            <span className="text-white/80 text-[9px] font-semibold uppercase tracking-widest">Gap</span>
                            <span className="text-3xl font-black text-white">{scoreDiff > 0 ? '+' : ''}{scoreDiff}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-center gap-1.5 text-center">
                            {isWinning ? (
                                <><Award className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span className="text-emerald-400 font-bold text-sm">Winning!</span></>
                            ) : scoreDiff < 0 ? (
                                <><Target className="w-4 h-4 text-amber-400 flex-shrink-0" /><span className="text-amber-400 font-bold text-sm">Room to Improve</span></>
                            ) : (
                                <span className="text-slate-400 font-bold text-sm">Evenly Matched</span>
                            )}
                        </div>
                    </div>

                    {/* Competitor score */}
                    <div className="flex flex-col items-center flex-shrink-0" style={{ width: '160px' }}>
                        <div className={`text-6xl md:text-7xl font-black ${getScoreColor(competitorScore)}`}>
                            {competitorScore}
                        </div>
                        <div className="mt-3 text-center w-full">
                            <p className="text-white font-bold text-sm leading-tight max-w-full overflow-hidden" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                wordBreak: 'break-word'
                            }} title={competitorDomain}>
                                {formatDomain(competitorDomain)}
                            </p>
                            <p className="text-slate-400 text-sm font-medium mt-1">Competitor</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
