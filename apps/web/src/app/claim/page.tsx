'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { ReportTeaser } from '@aeo-live/shared';

// =============================================================================
// Icon map — Lucide names → emoji
// =============================================================================

const iconMap: Record<string, string> = {
    Zap: '⚡',
    BarChart3: '📊',
    Sparkles: '✨',
    Target: '🎯',
    Shield: '🛡',
    Layout: '📐',
    Link2: '🔗',
    Globe: '🌐',
    Search: '🔍',
    MessageSquare: '💬',
    Eye: '👁',
};

function getIcon(name: string): string {
    return iconMap[name] || name || '📊';
}

// =============================================================================
// ANIMATED SCORE CIRCLE
// =============================================================================

function AnimatedScore({
    score,
    color,
    delay = 0,
    gradientId,
}: {
    score: number;
    color: 'teal' | 'orange';
    delay?: number;
    gradientId: string;
}) {
    const [current, setCurrent] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    useEffect(() => {
        if (!visible) return;
        const duration = 1400;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(eased * score));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [score, visible]);

    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (current / 100) * circumference;

    return (
        <div
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'scale(1)' : 'scale(0.85)',
                transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                <svg
                    width="140"
                    height="140"
                    viewBox="0 0 140 140"
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            {color === 'teal' ? (
                                <>
                                    <stop offset="0%" stopColor="#14b8a6" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#ef4444" />
                                </>
                            )}
                        </linearGradient>
                    </defs>
                    <circle cx="70" cy="70" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={visible ? strokeDashoffset : circumference}
                        style={{
                            transition: 'stroke-dashoffset 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
                            transitionDelay: `${delay}ms`,
                        }}
                    />
                </svg>
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span
                        style={{
                            fontSize: '44px',
                            fontWeight: 800,
                            background:
                                color === 'teal'
                                    ? 'linear-gradient(135deg, #ffffff, #e2e8f0)'
                                    : 'linear-gradient(135deg, #f97316, #ef4444)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontFamily: "'DM Sans', sans-serif",
                            lineHeight: 1,
                        }}
                    >
                        {current}
                    </span>
                    <span
                        style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                        }}
                    >
                        score
                    </span>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// CATEGORY BAR
// =============================================================================

function CategoryBar({
    cat,
    index,
    revealed,
}: {
    cat: { name: string; icon: string; yourScore: number; competitorScore: number };
    index: number;
    revealed: boolean;
}) {
    const diff = cat.yourScore - cat.competitorScore;
    const isWinning = diff > 0;
    const isTied = diff === 0;
    const diffColor = isWinning ? '#059669' : isTied ? '#64748b' : '#dc2626';
    const diffBg = isWinning ? '#ecfdf5' : isTied ? '#f8fafc' : '#fef2f2';

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 220px 48px 100px',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: '12px',
                background: index % 2 === 0 ? '#fafbfc' : 'transparent',
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(12px)',
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 70}ms`,
            }}
        >
            {/* Category name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isWinning
                            ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
                            : isTied
                                ? '#f1f5f9'
                                : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                    }}
                >
                    {getIcon(cat.icon)}
                </span>
                <span
                    style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: '#1e293b',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                >
                    {cat.name}
                </span>
            </div>

            {/* Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            flex: 1,
                            height: '7px',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: revealed ? `${cat.yourScore}%` : '0%',
                                height: '100%',
                                borderRadius: '4px',
                                background: 'linear-gradient(90deg, #14b8a6, #06b6d4)',
                                transition: `width 1s cubic-bezier(0.16, 1, 0.3, 1) ${index * 70 + 300}ms`,
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#0d9488',
                            width: '26px',
                            textAlign: 'right',
                            fontFamily: "'DM Mono', monospace",
                        }}
                    >
                        {cat.yourScore}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            flex: 1,
                            height: '7px',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: revealed ? `${cat.competitorScore}%` : '0%',
                                height: '100%',
                                borderRadius: '4px',
                                background: 'linear-gradient(90deg, #f97316, #ef4444)',
                                transition: `width 1s cubic-bezier(0.16, 1, 0.3, 1) ${index * 70 + 400}ms`,
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#ea580c',
                            width: '26px',
                            textAlign: 'right',
                            fontFamily: "'DM Mono', monospace",
                        }}
                    >
                        {cat.competitorScore}
                    </span>
                </div>
            </div>

            {/* Diff badge */}
            <div
                style={{
                    padding: '3px 0',
                    borderRadius: '20px',
                    background: diffBg,
                    fontSize: '12px',
                    fontWeight: 700,
                    color: diffColor,
                    textAlign: 'center',
                    fontFamily: "'DM Mono', monospace",
                }}
            >
                {diff > 0 ? '+' : ''}
                {diff}
            </div>

            {/* Locked indicator */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    color: '#94a3b8',
                }}
            >
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2.5"
                >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                details locked
            </div>
        </div>
    );
}

// =============================================================================
// LOCKED FEATURE CARD
// =============================================================================

function LockedFeatureCard({
    icon,
    title,
    desc,
    delay,
}: {
    icon: string;
    title: string;
    desc: string;
    delay: number;
}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            style={{
                padding: '16px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            <div
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
                    border: '1px solid #99f6e4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                }}
            >
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '3px' }}>
                    {title}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
                <div style={{ fontSize: '10px', color: '#14b8a6', fontWeight: 600, marginTop: '6px' }}>
                    Unlock in full report →
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// CLAIM PAGE CONTENT (uses hooks, needs Suspense wrapper)
// =============================================================================

function ClaimPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCode = searchParams?.get('code') || '';

    const [code, setCode] = useState(initialCode);
    const [phase, setPhase] = useState<'input' | 'validating' | 'revealed' | 'error'>('input');
    const [teaser, setTeaser] = useState<ReportTeaser | null>(null);
    const [error, setError] = useState('');
    const [barsRevealed, setBarsRevealed] = useState(false);

    // Auto-validate if code is in URL
    useEffect(() => {
        if (initialCode) {
            handleValidate(initialCode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleValidate = async (overrideCode?: string) => {
        const codeToValidate = (overrideCode || code).trim();
        if (!codeToValidate) return;

        setPhase('validating');
        setError('');
        setTeaser(null);
        setBarsRevealed(false);

        try {
            const response = await api.validateClaimCode(codeToValidate);

            if (response.success && response.data) {
                if (response.data.valid) {
                    // Load teaser preview
                    try {
                        const teaserResponse = await api.getClaimTeaser(codeToValidate);
                        if (teaserResponse.success && teaserResponse.data) {
                            setTeaser(teaserResponse.data);
                            setPhase('revealed');
                            setTimeout(() => setBarsRevealed(true), 400);
                            return;
                        }
                    } catch {
                        // Teaser load failed, but code is valid — still show revealed
                    }
                    // If teaser fails but code is valid, use inline teaser if provided
                    if (response.data.teaser) {
                        setTeaser(response.data.teaser);
                        setPhase('revealed');
                        setTimeout(() => setBarsRevealed(true), 400);
                    } else {
                        // Valid code but no teaser data — just go to register
                        router.push(`/register?code=${encodeURIComponent(codeToValidate)}`);
                    }
                } else {
                    setPhase('error');
                    setError(
                        response.data.status === 'REDEEMED'
                            ? 'This code has already been used.'
                            : response.data.status === 'EXPIRED'
                                ? 'This code has expired. Contact us for a new one.'
                                : 'Invalid claim code. Please check and try again.',
                    );
                }
            } else {
                setPhase('error');
                setError('Invalid claim code. Please check and try again.');
            }
        } catch {
            setPhase('error');
            setError('Something went wrong. Please try again.');
        }
    };

    const handleCreateAccount = () => {
        router.push(`/register?code=${encodeURIComponent(code.trim())}`);
    };

    const diff = teaser ? teaser.yourScore - teaser.competitorScore : 0;

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#ffffff',
                fontFamily: "'DM Sans', sans-serif",
                color: '#1e293b',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Google Fonts */}
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link
                href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500&display=swap"
                rel="stylesheet"
            />

            {/* Background decorations */}
            <div
                style={{
                    position: 'fixed',
                    top: '-300px',
                    right: '-200px',
                    width: '700px',
                    height: '700px',
                    background: 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    bottom: '-200px',
                    left: '-300px',
                    width: '800px',
                    height: '800px',
                    background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    width: '1200px',
                    height: '1200px',
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, rgba(249,115,22,0.03) 0%, transparent 50%)',
                    pointerEvents: 'none',
                }}
            />

            <div
                style={{
                    maxWidth: '720px',
                    margin: '0 auto',
                    padding: '48px 24px',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '44px' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            marginBottom: '20px',
                        }}
                    >
                        <span style={{ fontSize: '30px', fontWeight: 800, color: '#14b8a6' }}>AEO</span>
                        <span style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a' }}>.LIVE</span>
                    </div>

                    <div style={{ display: 'block', marginBottom: '20px' }}>
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'linear-gradient(135deg, #f0fdfa, #ecfdf5)',
                                border: '1px solid #99f6e4',
                                borderRadius: '100px',
                                padding: '6px 16px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#0d9488',
                            }}
                        >
                            <span
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#14b8a6',
                                    animation: 'pulse 2s ease-in-out infinite',
                                }}
                            />
                            Competitive Intelligence Report
                        </span>
                    </div>

                    <h1
                        style={{
                            fontSize: '38px',
                            fontWeight: 800,
                            lineHeight: 1.15,
                            margin: '0 0 14px',
                            color: '#0f172a',
                        }}
                    >
                        Your Analysis is Ready
                    </h1>
                    <p style={{ fontSize: '16px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                        Enter your claim code to preview your competitive intelligence report
                    </p>
                </div>

                {/* Code Input Card */}
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        padding: '28px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                        marginBottom: '28px',
                    }}
                >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    if (phase === 'error') {
                                        setPhase('input');
                                        setError('');
                                    }
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                                placeholder="XXXX-XXXX-XXXX"
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    fontSize: '21px',
                                    fontWeight: 700,
                                    fontFamily: "'DM Mono', monospace",
                                    letterSpacing: '3px',
                                    textAlign: 'center',
                                    background: '#f8fafc',
                                    border: `2px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
                                    borderRadius: '14px',
                                    color: '#0f172a',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <button
                            onClick={() => handleValidate()}
                            disabled={phase === 'validating' || !code.trim()}
                            style={{
                                padding: '16px 36px',
                                borderRadius: '14px',
                                border: 'none',
                                background:
                                    phase === 'validating'
                                        ? '#e2e8f0'
                                        : 'linear-gradient(135deg, #14b8a6, #0d9488)',
                                color: phase === 'validating' ? '#64748b' : '#fff',
                                fontSize: '15px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: "'DM Sans', sans-serif",
                                whiteSpace: 'nowrap',
                                transition: 'all 0.3s',
                                opacity: !code.trim() ? 0.5 : 1,
                                boxShadow:
                                    phase === 'validating'
                                        ? 'none'
                                        : '0 2px 8px rgba(20,184,166,0.3)',
                            }}
                        >
                            {phase === 'validating' ? 'Checking...' : 'Validate →'}
                        </button>
                    </div>

                    {/* Success state */}
                    {phase === 'revealed' && teaser && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '14px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                            }}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#059669"
                                strokeWidth="2.5"
                            >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span style={{ fontSize: '13.5px', color: '#059669', fontWeight: 600 }}>
                                Valid code for <strong>{teaser.yourUrl}</strong>
                            </span>
                        </div>
                    )}

                    {/* Error state */}
                    {phase === 'error' && error && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '14px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                            }}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#dc2626"
                                strokeWidth="2.5"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <span style={{ fontSize: '13.5px', color: '#dc2626', fontWeight: 600 }}>
                                {error}
                            </span>
                        </div>
                    )}
                </div>

                {/* === TEASER REPORT PREVIEW === */}
                {phase === 'revealed' && teaser && (
                    <div style={{ animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        {/* Score Hero — dark card */}
                        <div
                            style={{
                                background:
                                    'linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
                                borderRadius: '24px',
                                padding: '44px 32px 36px',
                                marginBottom: '20px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(15,23,42,0.25)',
                            }}
                        >
                            {/* Decorative gradient orbs */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-60px',
                                    left: '-40px',
                                    width: '250px',
                                    height: '250px',
                                    background:
                                        'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
                                    pointerEvents: 'none',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '-60px',
                                    right: '-40px',
                                    width: '250px',
                                    height: '250px',
                                    background:
                                        'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)',
                                    pointerEvents: 'none',
                                }}
                            />

                            <div
                                style={{
                                    textAlign: 'center',
                                    marginBottom: '4px',
                                    position: 'relative',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        letterSpacing: '2px',
                                        textTransform: 'uppercase',
                                        color: 'rgba(255,255,255,0.4)',
                                        background: 'rgba(255,255,255,0.06)',
                                        padding: '5px 16px',
                                        borderRadius: '100px',
                                    }}
                                >
                                    Competitive Analysis Preview
                                </span>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '32px',
                                    margin: '28px 0',
                                    position: 'relative',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <AnimatedScore
                                        score={teaser.yourScore}
                                        color="teal"
                                        delay={200}
                                        gradientId="gradYou"
                                    />
                                    <div style={{ marginTop: '14px' }}>
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                color: '#f8fafc',
                                            }}
                                        >
                                            {teaser.yourUrl}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                letterSpacing: '1.5px',
                                                color: '#14b8a6',
                                                textTransform: 'uppercase',
                                                marginTop: '4px',
                                            }}
                                        >
                                            Your Brand
                                        </div>
                                    </div>
                                </div>

                                {/* VS badge */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            fontWeight: 800,
                                            color: 'rgba(255,255,255,0.5)',
                                        }}
                                    >
                                        VS
                                    </div>
                                    <div
                                        style={{
                                            padding: '4px 16px',
                                            borderRadius: '100px',
                                            background:
                                                diff >= 0
                                                    ? 'rgba(34,197,94,0.15)'
                                                    : 'rgba(239,68,68,0.15)',
                                            border: `1px solid ${diff >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                            fontSize: '15px',
                                            fontWeight: 800,
                                            fontFamily: "'DM Mono', monospace",
                                            color: diff >= 0 ? '#4ade80' : '#f87171',
                                        }}
                                    >
                                        {diff > 0 ? '+' : ''}
                                        {diff}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <AnimatedScore
                                        score={teaser.competitorScore}
                                        color="orange"
                                        delay={400}
                                        gradientId="gradComp"
                                    />
                                    <div style={{ marginTop: '14px' }}>
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                color: '#f8fafc',
                                            }}
                                        >
                                            {teaser.competitorUrl}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                letterSpacing: '1.5px',
                                                color: '#f97316',
                                                textTransform: 'uppercase',
                                                marginTop: '4px',
                                            }}
                                        >
                                            Competitor
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status banner */}
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '11px 20px',
                                    borderRadius: '12px',
                                    background:
                                        diff >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)',
                                    border: `1px solid ${diff >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)'}`,
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: diff >= 0 ? '#4ade80' : '#fb923c',
                                }}
                            >
                                {diff >= 0
                                    ? "✅ You're ahead — but your lead may be at risk. See why inside."
                                    : "⚠️ Your competitor is ahead. Here's what they're doing differently."}
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div
                            style={{
                                background: '#ffffff',
                                borderRadius: '20px',
                                padding: '28px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                                marginBottom: '20px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '8px',
                                    paddingBottom: '14px',
                                    borderBottom: '1px solid #f1f5f9',
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        margin: 0,
                                    }}
                                >
                                    Performance by Category
                                </h3>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '16px',
                                        fontSize: '11px',
                                        color: '#94a3b8',
                                    }}
                                >
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: '10px',
                                                height: '6px',
                                                borderRadius: '3px',
                                                background:
                                                    'linear-gradient(90deg, #14b8a6, #06b6d4)',
                                                display: 'inline-block',
                                            }}
                                        />{' '}
                                        You
                                    </span>
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: '10px',
                                                height: '6px',
                                                borderRadius: '3px',
                                                background:
                                                    'linear-gradient(90deg, #f97316, #ef4444)',
                                                display: 'inline-block',
                                            }}
                                        />{' '}
                                        Competitor
                                    </span>
                                </div>
                            </div>
                            {teaser.categories.map((cat, i) => (
                                <CategoryBar
                                    key={cat.name}
                                    cat={{
                                        ...cat,
                                        icon: getIcon(cat.icon),
                                    }}
                                    index={i}
                                    revealed={barsRevealed}
                                />
                            ))}
                        </div>

                        {/* AI Summary */}
                        {teaser.aiSummary && (
                            <div
                                style={{
                                    background: 'linear-gradient(135deg, #f0fdfa, #ecfdf5)',
                                    borderRadius: '16px',
                                    padding: '22px 24px',
                                    border: '1px solid #a7f3d0',
                                    marginBottom: '20px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '4px',
                                        height: '100%',
                                        background:
                                            'linear-gradient(180deg, #14b8a6, #06b6d4)',
                                    }}
                                />
                                <div style={{ paddingLeft: '12px' }}>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            letterSpacing: '1.5px',
                                            color: '#0d9488',
                                            textTransform: 'uppercase',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        AI Analysis Summary
                                    </div>
                                    <p
                                        style={{
                                            fontSize: '14px',
                                            color: '#334155',
                                            lineHeight: 1.7,
                                            margin: '0 0 6px',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        &ldquo;{teaser.aiSummary}&rdquo;
                                    </p>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                                        ▸ Full analysis with actionable recommendations in complete
                                        report
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Locked Features Grid */}
                        <div style={{ marginBottom: '32px' }}>
                            <div
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    letterSpacing: '1.5px',
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    marginBottom: '14px',
                                    paddingLeft: '4px',
                                }}
                            >
                                🔒 Unlock in your full report
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '12px',
                                }}
                            >
                                <LockedFeatureCard
                                    icon="📊"
                                    title="Category Deep-Dives"
                                    desc="7 expert analyses with specific findings"
                                    delay={1800}
                                />
                                <LockedFeatureCard
                                    icon="💰"
                                    title="Revenue Calculator"
                                    desc="Dollar value of closing your gap"
                                    delay={1900}
                                />
                                <LockedFeatureCard
                                    icon="🗺️"
                                    title="Strategic Game Plan"
                                    desc="Prioritized actions ranked by impact"
                                    delay={2000}
                                />
                                <LockedFeatureCard
                                    icon="🤖"
                                    title="AI Platform Breakdown"
                                    desc="ChatGPT, Claude, Gemini visibility"
                                    delay={2100}
                                />
                            </div>
                        </div>

                        {/* CTA Card */}
                        <div
                            style={{
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, #f8fafc, #f0fdfa)',
                                borderRadius: '20px',
                                padding: '36px 32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '20px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    marginBottom: '8px',
                                }}
                            >
                                Ready to see your full report?
                            </div>
                            <p
                                style={{
                                    fontSize: '14px',
                                    color: '#64748b',
                                    marginBottom: '24px',
                                }}
                            >
                                Create a free account and unlock all insights instantly
                            </p>
                            <button
                                onClick={handleCreateAccount}
                                style={{
                                    padding: '18px 48px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    background:
                                        'linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: "'DM Sans', sans-serif",
                                    boxShadow:
                                        '0 4px 16px rgba(20,184,166,0.35), 0 2px 4px rgba(0,0,0,0.1)',
                                    transition: 'all 0.3s',
                                    width: '100%',
                                    maxWidth: '400px',
                                }}
                            >
                                Create Free Account →
                            </button>
                            <p
                                style={{
                                    fontSize: '12px',
                                    color: '#94a3b8',
                                    marginTop: '12px',
                                }}
                            >
                                No credit card required · Instant access
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div
                    style={{
                        textAlign: 'center',
                        marginTop: '56px',
                        paddingTop: '20px',
                        borderTop: '1px solid #f1f5f9',
                    }}
                >
                    <p style={{ fontSize: '11px', color: '#cbd5e1' }}>
                        Powered by{' '}
                        <strong style={{ color: '#94a3b8' }}>AEO.LIVE</strong> — AI Visibility
                        Intelligence
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                * { box-sizing: border-box; }
                input::placeholder { color: #c4cdd5; }
                @media (max-width: 640px) {
                    h1 { font-size: 28px !important; }
                }
            `}</style>
        </div>
    );
}

// =============================================================================
// EXPORT (with Suspense for useSearchParams)
// =============================================================================

export default function ClaimPage() {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        minHeight: '100vh',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '32px',
                            height: '32px',
                            border: '3px solid #e2e8f0',
                            borderTop: '3px solid #14b8a6',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            }
        >
            <ClaimPageContent />
        </Suspense>
    );
}
