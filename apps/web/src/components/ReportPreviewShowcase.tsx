'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── Score Gauge ── */
function ScoreGauge({
  score,
  color,
  gradientId,
  size = 100,
}: {
  score: number;
  color: 'teal' | 'orange';
  gradientId: string;
  size?: number;
}) {
  const r = size * 0.38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={size * 0.08}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={size * 0.08}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-extrabold text-slate-900 leading-none"
          style={{ fontSize: size * 0.32, fontFamily: "'DM Sans', sans-serif" }}
        >
          {score}
        </span>
        <span
          className="font-semibold text-slate-400 uppercase"
          style={{ fontSize: size * 0.09, letterSpacing: '1.5px' }}
        >
          score
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   SLIDE 1 — Competitive Scorecard
   ══════════════════════════════════ */
function SlideScorecard() {
  const cats = [
    { name: 'Technical SEO', you: 49, comp: 71 },
    { name: 'On-Page SEO', you: 89, comp: 79 },
    { name: 'Topical Authority', you: 44, comp: 70 },
    { name: 'AEO Readiness', you: 28, comp: 26 },
    { name: 'Brand Voice', you: 89, comp: 88 },
    { name: 'UX & Engagement', you: 84, comp: 85 },
    { name: 'Internal Structure', you: 71, comp: 73 },
  ];
  return (
    <div className="p-6 bg-white scorecard-slide">
      {/* Gauges row */}
      <div className="flex justify-center items-center gap-9 mb-5">
        <div className="text-center">
          <ScoreGauge score={67} color="teal" gradientId="sg1" size={100} />
          <div className="text-[11px] font-bold text-slate-900 mt-1.5">
            yourbrand.com
          </div>
          <div className="text-[9px] font-semibold tracking-wider text-teal-500 uppercase">
            Your Brand
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[11px] font-extrabold text-slate-400">
            VS
          </div>
          <div
            className="px-2.5 py-0.5 rounded-full bg-red-50 text-xs font-extrabold text-red-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            -10
          </div>
        </div>
        <div className="text-center">
          <ScoreGauge score={77} color="orange" gradientId="sg2" size={100} />
          <div className="text-[11px] font-bold text-slate-900 mt-1.5">
            competitor.com
          </div>
          <div className="text-[9px] font-semibold tracking-wider text-orange-500 uppercase">
            Competitor
          </div>
        </div>
      </div>

      {/* Category bars */}
      <div className="flex flex-col gap-[5px]">
        {cats.map((c) => {
          const diff = c.you - c.comp;
          return (
            <div key={c.name} className="flex items-center gap-2 py-[3px]">
              <span className="w-[105px] text-[10px] font-semibold text-slate-600 shrink-0">
                {c.name}
              </span>
              <div className="flex-1 flex flex-col gap-[3px]">
                <div className="h-[5px] rounded-[3px] bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-[3px]"
                    style={{
                      width: `${c.you}%`,
                      background:
                        'linear-gradient(90deg, #14b8a6, #06b6d4)',
                    }}
                  />
                </div>
                <div className="h-[5px] rounded-[3px] bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-[3px]"
                    style={{
                      width: `${c.comp}%`,
                      background:
                        'linear-gradient(90deg, #f97316, #ef4444)',
                    }}
                  />
                </div>
              </div>
              <span
                className="text-[10px] font-bold w-7 text-right shrink-0"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color:
                    diff > 0
                      ? '#059669'
                      : diff < 0
                        ? '#dc2626'
                        : '#64748b',
                }}
              >
                {diff > 0 ? '+' : ''}
                {diff}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   SLIDE 2 — Topic Cluster Map
   ══════════════════════════════════ */
function SlideTopicMap() {
  const topics = [
    { label: 'shipping container pools', x: 80, y: 45, size: 11, type: 'primary' as const },
    { label: 'fiberglass pools', x: 128, y: 32, size: 6, type: 'secondary' as const },
    { label: 'portable pools', x: 52, y: 62, size: 5, type: 'secondary' as const },
    { label: 'USA manufacturing', x: 32, y: 32, size: 5.5, type: 'secondary' as const },
    { label: 'social mission', x: 68, y: 18, size: 5.5, type: 'secondary' as const },
    { label: 'easy installation', x: 120, y: 60, size: 4.5, type: 'secondary' as const },
    { label: '', x: 100, y: 12, size: 2.5, type: 'gap' as const },
    { label: '', x: 18, y: 50, size: 2.5, type: 'gap' as const },
    { label: '', x: 142, y: 68, size: 2.5, type: 'gap' as const },
    { label: '', x: 90, y: 75, size: 2.5, type: 'gap' as const },
  ];
  const colors = { primary: '#14b8a6', secondary: '#06b6d4', gap: '#ef4444' };

  return (
    <div
      className="px-6 py-5"
      style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)' }}
    >
      {/* Header + Legend */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-sm font-bold text-slate-50">
            Topic Cluster Map
          </div>
          <div className="text-[10px] text-slate-500">
            Visual map of your topical authority
          </div>
        </div>
        <div className="flex gap-3 text-[9px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
            Primary
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />
            Secondary
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            Gap
          </span>
        </div>
      </div>

      {/* SVG Graph */}
      <div className="w-full h-[220px] relative">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 160 85"
          preserveAspectRatio="xMidYMid meet"
        >
          {topics
            .filter((t) => t.type === 'secondary')
            .map((t, i) => (
              <line
                key={`l-${i}`}
                x1={topics[0].x}
                y1={topics[0].y}
                x2={t.x}
                y2={t.y}
                stroke="rgba(20,184,166,0.2)"
                strokeWidth="0.4"
              />
            ))}
          {topics.map((t, i) => (
            <g key={i}>
              <circle
                cx={t.x}
                cy={t.y}
                r={t.size * 1.3}
                fill={colors[t.type]}
                opacity={0.08}
              />
              <circle
                cx={t.x}
                cy={t.y}
                r={t.size}
                fill={colors[t.type]}
                opacity={0.2}
              />
              <circle
                cx={t.x}
                cy={t.y}
                r={t.size * 0.65}
                fill={colors[t.type]}
                opacity={t.type === 'gap' ? 0.7 : 0.5}
              />
              {t.label && (
                <text
                  x={t.x}
                  y={t.y + t.size + 4}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="3"
                  fontFamily="DM Sans, sans-serif"
                  fontWeight="500"
                >
                  {t.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        {[
          { value: '11', label: 'topics mapped', color: '#14b8a6' },
          { value: '5', label: 'gaps found', color: '#ef4444' },
          { value: '44', label: 'authority score', color: '#f8fafc' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg px-3.5 py-2"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="text-lg font-extrabold"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="text-[9px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   SLIDE 3 — Brand Personality DNA
   ══════════════════════════════════ */
function SlideBrandDNA() {
  const dims = [
    { left: 'Humble', right: 'Bold', value: 85, color: '#7c3aed' },
    { left: 'Serious', right: 'Playful', value: 62, color: '#14b8a6' },
    { left: 'Established', right: 'Challenger', value: 90, color: '#f97316' },
    { left: 'Technical', right: 'Accessible', value: 68, color: '#06b6d4' },
    { left: 'Safe', right: 'Provocative', value: 35, color: '#ec4899' },
    { left: 'Calm', right: 'Energetic', value: 78, color: '#22c55e' },
  ];
  return (
    <div className="p-6 bg-white brand-dna-slide">
      {/* Header */}
      <div className="flex justify-between items-center mb-[18px]">
        <div>
          <div className="text-sm font-bold text-slate-900">
            Brand Personality DNA
          </div>
          <div className="text-[10px] text-slate-500">
            Your voice archetype across 6 dimensions
          </div>
        </div>
        <span
          className="text-white text-[10px] font-bold px-3.5 py-1 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          }}
        >
          BOLD CHALLENGER
        </span>
      </div>

      {/* Dimension sliders */}
      <div className="flex flex-col gap-4">
        {dims.map((d) => (
          <div key={d.left} className="flex items-center gap-2">
            <span className="brand-dna-label text-[10px] text-slate-400 text-right">
              {d.left}
            </span>
            <div className="flex-1 h-1.5 rounded-[3px] bg-slate-100 relative">
              <div
                className="absolute -top-[5px] w-4 h-4 rounded-full border-[3px] border-white"
                style={{
                  left: `${d.value}%`,
                  background: d.color,
                  boxShadow: `0 0 0 1px ${d.color}33, 0 2px 4px rgba(0,0,0,0.1)`,
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
            <span className="brand-dna-label text-[10px] text-slate-400">
              {d.right}
            </span>
          </div>
        ))}
      </div>

      {/* Quote */}
      <div className="mt-[18px] px-4 py-3 bg-purple-50 rounded-[10px] border border-purple-200">
        <p className="text-[11px] text-purple-900 italic m-0 leading-relaxed">
          &quot;Mission-driven brand that boldly combines authority with
          accessibility. Confident voice that stands apart from generic
          competitors.&quot;
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   SLIDE 4 — Revenue Calculator
   ══════════════════════════════════ */
function SlideRevenue() {
  return (
    <div
      className="p-6"
      style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)' }}
    >
      <div className="text-sm font-bold text-slate-50 mb-1">
        Revenue Opportunity Calculator
      </div>
      <div className="text-[10px] text-slate-500 mb-[18px]">
        Financial impact of closing competitive gaps
      </div>

      {/* Metric cards */}
      <div className="revenue-metric-grid mb-3.5">
        {[
          { value: '500', label: 'Leads Lost / Month', color: '#f59e0b', highlight: false },
          { value: '13', label: 'Customers Lost', color: '#f97316', highlight: false },
          { value: '$6,500', label: 'Monthly Revenue Lost', color: '#ef4444', highlight: false },
          { value: '$78,000', label: 'YEARLY OPPORTUNITY', color: '#14b8a6', highlight: true },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl text-center"
            style={{
              background: m.highlight
                ? 'rgba(20,184,166,0.1)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${m.highlight ? 'rgba(20,184,166,0.25)' : 'rgba(255,255,255,0.06)'}`,
              padding: '14px 8px',
            }}
          >
            <div
              className="font-extrabold"
              style={{
                fontSize: m.highlight ? '22px' : '20px',
                color: m.color,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {m.value}
            </div>
            <div
              className="font-semibold uppercase mt-1 leading-tight"
              style={{
                fontSize: '7.5px',
                letterSpacing: '0.5px',
                color: m.highlight ? '#14b8a6' : '#64748b',
              }}
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Explanation */}
      <div className="text-center text-[10px] text-slate-500 mb-3">
        Based on a{' '}
        <span className="text-teal-500 font-bold">10 point</span> competitive
        gap ={' '}
        <span className="text-teal-500 font-bold">5.0%</span> potential traffic
        improvement
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-2">
        {[
          { label: 'Monthly Traffic', value: '10,000', pct: 35, color: '#7c3aed' },
          { label: 'Conversion Rate', value: '2.5%', pct: 50, color: '#a855f7' },
          { label: 'Customer LTV', value: '$500', pct: 25, color: '#14b8a6' },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="text-[8px] text-slate-500 uppercase font-semibold tracking-wide w-20 shrink-0">
              {s.label}
            </span>
            <div className="flex-1 h-1 rounded-sm relative" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${s.pct}%`,
                  background: `linear-gradient(90deg, ${s.color}, ${s.color}aa)`,
                }}
              />
              <div
                className="absolute -top-1 w-3 h-3 rounded-full"
                style={{
                  left: `${s.pct}%`,
                  background: s.color,
                  border: '2px solid #1e293b',
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
            <span
              className="text-[11px] text-slate-50 font-bold w-[50px] text-right shrink-0"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   MAIN SHOWCASE WRAPPER
   ══════════════════════════════════ */
export default function ReportPreviewShowcase() {
  const [active, setActive] = useState(0);

  const slides = [
    { id: 'scores', label: 'Competitive Scorecard', component: <SlideScorecard /> },
    { id: 'topicmap', label: 'Topic Authority Map', component: <SlideTopicMap /> },
    { id: 'brand', label: 'Brand DNA Profile', component: <SlideBrandDNA /> },
    { id: 'revenue', label: 'Revenue Calculator', component: <SlideRevenue /> },
  ];

  const goTo = useCallback(
    (i: number) => {
      setActive(i);
    },
    [],
  );

  /* Auto-rotation — resets when user clicks a pill */
  useEffect(() => {
    const t = setInterval(
      () => setActive((p) => (p + 1) % slides.length),
      5000,
    );
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="relative max-w-[680px] mx-auto report-showcase">
      {/* ── Floating accent badges ── */}
      <div className="showcase-floating-badge absolute -top-4 -right-[60px] bg-emerald-50 border border-emerald-200 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5 shadow-sm z-10 animate-badge-float">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        +12 opportunities found
      </div>
      <div className="showcase-floating-badge absolute top-[45%] -left-[70px] bg-red-50 border border-red-200 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-red-600 flex items-center gap-1.5 shadow-sm z-10 animate-badge-float" style={{ animationDelay: '1s' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        3 critical gaps
      </div>
      <div className="showcase-floating-badge absolute bottom-[50px] -right-[50px] bg-purple-50 border border-purple-200 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-purple-600 flex items-center gap-1.5 shadow-sm z-10 animate-badge-float" style={{ animationDelay: '2s' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block" />
        7 categories analyzed
      </div>

      {/* ── Browser frame ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Chrome bar */}
        <div className="flex items-center px-4 py-2.5 bg-slate-50 border-b border-slate-200 gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[11px] text-slate-400 bg-slate-100 px-4 py-[3px] rounded-md">
              app.aeo.live/report
            </span>
          </div>
        </div>

        {/* Slides — maxHeight transition */}
        <div className="relative">
          {slides.map((s, i) => (
            <div
              key={s.id}
              style={{
                opacity: i === active ? 1 : 0,
                maxHeight: i === active ? '600px' : '0px',
                overflow: 'hidden',
                transition: 'opacity 0.5s ease, max-height 0.5s ease',
              }}
            >
              {s.component}
            </div>
          ))}
        </div>
      </div>

      {/* ── Slide nav pills ── */}
      <div className="flex justify-center flex-wrap gap-2 mt-5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className="transition-all duration-300 border-none cursor-pointer"
            style={{
              padding: '6px 16px',
              borderRadius: '100px',
              background: i === active ? '#7c3aed' : '#f1f5f9',
              color: i === active ? '#fff' : '#64748b',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
