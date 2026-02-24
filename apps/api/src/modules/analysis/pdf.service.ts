import { Injectable, Logger } from '@nestjs/common';
import React from 'react';
import {
    renderToBuffer,
    Document,
    Page,
    View,
    Text,
    Font,
    StyleSheet,
    Svg,
    Circle,
    Rect,
    Line as SvgLine,
} from '@react-pdf/renderer';
import { ReportTeaser } from '@aeo-live/shared';

// =============================================================================
// Font Registration — Inter from Google Fonts
// =============================================================================

Font.register({
    family: 'Inter',
    fonts: [
        {
            src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
            fontWeight: 400,
        },
        {
            src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2',
            fontWeight: 700,
        },
    ],
});

// =============================================================================
// Color Palette
// =============================================================================

const c = {
    bgDark: '#0f172a',
    cardDark: '#1e293b',
    accent: '#14b8a6',
    green: '#22c55e',
    greenDark: '#052e16',
    red: '#ef4444',
    redDark: '#450a0a',
    amber: '#f59e0b',
    textPrimary: '#f8fafc',
    textMuted: '#94a3b8',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    white: '#ffffff',
};

// =============================================================================
// Styles
// =============================================================================

const s = StyleSheet.create({
    // -------- Page 1 --------
    page1: {
        fontFamily: 'Inter',
        backgroundColor: c.white,
        position: 'relative',
    },
    headerBar: {
        backgroundColor: c.bgDark,
        paddingVertical: 16,
        paddingHorizontal: 36,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    brand: {
        fontSize: 16,
        fontWeight: 700,
        color: c.white,
        letterSpacing: 2,
    },
    brandAccent: {
        color: c.accent,
    },
    headerRight: {
        fontSize: 7,
        color: c.textMuted,
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    accentLine: {
        height: 3,
        backgroundColor: c.accent,
    },

    // -------- Score Section --------
    scoreSection: {
        paddingHorizontal: 36,
        paddingTop: 24,
        paddingBottom: 16,
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: 8,
        color: c.textMuted,
        letterSpacing: 3,
        textTransform: 'uppercase',
        textAlign: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: c.bgDark,
        textAlign: 'center',
        marginBottom: 16,
    },
    gaugesRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    gaugeContainer: {
        alignItems: 'center',
        width: 160,
    },
    gaugeLabel: {
        fontSize: 7,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginTop: 8,
    },
    gaugeDomain: {
        fontSize: 9,
        fontWeight: 700,
        color: c.bgDark,
        marginTop: 4,
        textAlign: 'center',
    },
    vsBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vsLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: c.white,
        textAlign: 'center',
    },
    vsDiff: {
        fontSize: 12,
        fontWeight: 700,
        color: c.white,
        textAlign: 'center',
    },
    statusBanner: {
        marginHorizontal: 36,
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 9,
        fontWeight: 700,
        textAlign: 'center',
    },

    // -------- Category Bars --------
    catSection: {
        paddingHorizontal: 36,
        paddingTop: 12,
    },
    catSectionHeader: {
        fontSize: 12,
        fontWeight: 700,
        color: c.bgDark,
        marginBottom: 4,
    },
    catDivider: {
        height: 1,
        backgroundColor: c.slate200,
        marginBottom: 10,
    },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    catName: {
        fontSize: 8,
        fontWeight: 700,
        color: c.bgDark,
        width: 88,
    },
    catBarWrap: {
        flex: 1,
        height: 28,
        position: 'relative',
    },
    catBar: {
        height: 10,
        borderRadius: 3,
        position: 'absolute',
    },
    catBarScore: {
        fontSize: 8,
        fontWeight: 700,
        position: 'absolute',
        right: 0,
    },
    catDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    catLockHint: {
        fontSize: 6,
        color: c.textMuted,
        width: 70,
        textAlign: 'right',
    },

    // -------- AI Summary --------
    aiSection: {
        marginHorizontal: 36,
        marginTop: 12,
        paddingLeft: 12,
        paddingVertical: 10,
        paddingRight: 12,
        borderLeftWidth: 3,
        borderLeftColor: c.accent,
        backgroundColor: c.slate100,
        borderRadius: 4,
    },
    aiText: {
        fontSize: 9,
        color: c.slate700,
        lineHeight: 1.5,
    },
    aiMore: {
        fontSize: 8,
        color: c.textMuted,
        marginTop: 6,
    },

    // -------- Page 1 Footer --------
    p1Footer: {
        position: 'absolute',
        bottom: 16,
        left: 36,
        right: 36,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    p1FooterText: {
        fontSize: 7,
        color: c.textMuted,
    },

    // -------- Page 2 --------
    page2: {
        fontFamily: 'Inter',
        backgroundColor: c.white,
        paddingHorizontal: 36,
        paddingTop: 32,
        position: 'relative',
    },
    p2Title: {
        fontSize: 18,
        fontWeight: 700,
        color: c.bgDark,
        textAlign: 'center',
        marginBottom: 4,
    },
    p2Sub: {
        fontSize: 9,
        color: c.textMuted,
        textAlign: 'center',
        marginBottom: 20,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    lockedCard: {
        width: '48%',
        backgroundColor: c.cardDark,
        borderRadius: 8,
        padding: 14,
    },
    cardLockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    cardLockIcon: {
        fontSize: 10,
        color: c.amber,
        fontWeight: 700,
    },
    cardTitle: {
        fontSize: 10,
        fontWeight: 700,
        color: c.textPrimary,
    },
    cardDesc: {
        fontSize: 8,
        color: c.textMuted,
        lineHeight: 1.4,
        marginBottom: 6,
    },
    cardCta: {
        fontSize: 7,
        fontWeight: 700,
        color: c.accent,
    },

    // -------- Blurred Preview --------
    blurPreview: {
        marginTop: 16,
        height: 130,
        backgroundColor: c.slate100,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: c.slate200,
        position: 'relative',
        overflow: 'hidden',
    },
    blurContent: {
        padding: 16,
        opacity: 0.12,
    },
    blurLine: {
        height: 8,
        borderRadius: 4,
        backgroundColor: c.slate400,
        marginBottom: 8,
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    blurLockText: {
        fontSize: 11,
        fontWeight: 700,
        color: c.slate600,
        textAlign: 'center',
    },
    blurSubText: {
        fontSize: 8,
        color: c.textMuted,
        marginTop: 4,
        textAlign: 'center',
    },

    // -------- Page 3 --------
    page3: {
        fontFamily: 'Inter',
        backgroundColor: c.bgDark,
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ctaTitle: {
        fontSize: 32,
        fontWeight: 700,
        color: c.white,
        textAlign: 'center',
        marginBottom: 8,
    },
    ctaSub: {
        fontSize: 12,
        color: c.textMuted,
        textAlign: 'center',
        marginBottom: 32,
    },
    codeLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: c.textMuted,
        letterSpacing: 3,
        textAlign: 'center',
        marginBottom: 8,
    },
    codeBox: {
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: c.accent,
        backgroundColor: c.cardDark,
        borderRadius: 10,
        paddingVertical: 16,
        paddingHorizontal: 40,
        marginBottom: 28,
    },
    codeText: {
        fontSize: 36,
        fontWeight: 700,
        color: c.white,
        letterSpacing: 6,
        textAlign: 'center',
    },
    stepsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 28,
    },
    stepItem: {
        alignItems: 'center',
        width: 120,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: c.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    stepNumText: {
        fontSize: 13,
        fontWeight: 700,
        color: c.bgDark,
        textAlign: 'center',
    },
    stepLabel: {
        fontSize: 8,
        color: c.textPrimary,
        textAlign: 'center',
        lineHeight: 1.4,
    },
    urgencyBox: {
        alignSelf: 'center',
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 6,
        backgroundColor: c.cardDark,
        maxWidth: 400,
    },
    urgencyText: {
        fontSize: 8,
        color: c.textMuted,
        textAlign: 'center',
        lineHeight: 1.5,
    },
    p3Footer: {
        position: 'absolute',
        bottom: 24,
        left: 40,
        right: 40,
        alignItems: 'center',
    },
    p3FooterLine: {
        fontSize: 8,
        color: c.slate600,
        textAlign: 'center',
    },
    p3FooterContact: {
        fontSize: 7,
        color: c.textMuted,
        marginTop: 2,
        textAlign: 'center',
    },
});

// =============================================================================
// Types
// =============================================================================

export interface SalesTeaserCategory {
    name: string;
    icon: string;
    yourScore: number;
    competitorScore: number;
    status: 'winning' | 'losing' | 'tied';
    insightCount: number;
    recommendationCount: number;
}

export interface SalesTeaserData {
    analysisId: string;
    yourUrl: string;
    competitorUrl: string;
    yourScore: number;
    competitorScore: number;
    status: 'winning' | 'losing' | 'tied';
    categories: SalesTeaserCategory[];
    aiSummary: string;
    businessName?: string;
    createdAt: string;
}

// =============================================================================
// Helpers
// =============================================================================

const h = React.createElement;

function cleanDomain(url: string): string {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

function truncateSummary(text: string, sentences = 3): string {
    const parts = text.split(/(?<=[.!?])\s+/);
    if (parts.length <= sentences) return text;
    return parts.slice(0, sentences).join(' ') + '...';
}

// =============================================================================
// Page 1 — The Hook
// =============================================================================

function PageOne({ data, claimCode }: { data: SalesTeaserData; claimCode: string }) {
    const diff = data.yourScore - data.competitorScore;
    const isWinning = diff > 0;
    const yourDomain = cleanDomain(data.yourUrl);
    const compDomain = cleanDomain(data.competitorUrl);
    const gaugeSize = 110;
    const gaugeR = 42;
    const gaugeStroke = 8;
    const circumference = 2 * Math.PI * gaugeR;

    // Circular gauge SVG
    function gauge(score: number, color: string) {
        const dashLen = (score / 100) * circumference;
        const cx = gaugeSize / 2;
        const cy = gaugeSize / 2;
        return h(
            View,
            { style: { width: gaugeSize, height: gaugeSize, position: 'relative' } },
            h(
                Svg,
                { width: gaugeSize, height: gaugeSize, viewBox: `0 0 ${gaugeSize} ${gaugeSize}` },
                // Background circle
                h(Circle, {
                    cx: String(cx),
                    cy: String(cy),
                    r: String(gaugeR),
                    stroke: c.slate200,
                    strokeWidth: String(gaugeStroke),
                    fill: 'none',
                }),
                // Score arc
                h(Circle, {
                    cx: String(cx),
                    cy: String(cy),
                    r: String(gaugeR),
                    stroke: color,
                    strokeWidth: String(gaugeStroke),
                    fill: 'none',
                    strokeDasharray: `${dashLen} ${circumference}`,
                    strokeLinecap: 'round',
                    transform: `rotate(-90 ${cx} ${cy})`,
                }),
            ),
            // Score number overlay (centered)
            h(
                View,
                {
                    style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                },
                h(Text, { style: { fontSize: 32, fontWeight: 700, color: c.bgDark } }, String(score)),
            ),
        );
    }

    // Horizontal bar for a category
    function categoryBar(cat: SalesTeaserCategory, idx: number) {
        const maxBarWidth = 180; // max px width
        const yourW = Math.max((cat.yourScore / 100) * maxBarWidth, 2);
        const compW = Math.max((cat.competitorScore / 100) * maxBarWidth, 2);
        const catDiff = cat.yourScore - cat.competitorScore;
        const winning = catDiff > 0;
        const insightTotal = cat.insightCount + cat.recommendationCount;

        return h(
            View,
            { key: String(idx), style: s.catRow },
            // Category name
            h(Text, { style: s.catName }, cat.name),
            // Win/lose dot
            h(View, {
                style: {
                    ...s.catDot,
                    backgroundColor: winning ? c.green : catDiff < 0 ? c.red : c.slate400,
                },
            }),
            // Bar chart area
            h(
                View,
                { style: s.catBarWrap },
                // Your bar (top)
                h(View, {
                    style: {
                        ...s.catBar,
                        top: 2,
                        left: 0,
                        width: yourW,
                        backgroundColor: c.accent,
                    },
                }),
                h(Text, {
                    style: {
                        ...s.catBarScore,
                        top: 0,
                        left: yourW + 4,
                        color: c.accent,
                        fontSize: 8,
                        fontWeight: 700,
                    },
                }, String(cat.yourScore)),
                // Competitor bar (bottom)
                h(View, {
                    style: {
                        ...s.catBar,
                        top: 16,
                        left: 0,
                        width: compW,
                        backgroundColor: c.slate300,
                    },
                }),
                h(Text, {
                    style: {
                        ...s.catBarScore,
                        top: 14,
                        left: compW + 4,
                        color: c.slate500,
                        fontSize: 8,
                    },
                }, String(cat.competitorScore)),
            ),
            // Insight hint
            h(Text, { style: s.catLockHint },
                insightTotal > 0 ? `${insightTotal} insights locked` : '',
            ),
        );
    }

    const vsBg = isWinning ? c.green : c.red;
    const statusBg = isWinning ? '#f0fdf4' : '#fef2f2';
    const statusColor = isWinning ? c.green : c.red;
    const statusMsg = isWinning
        ? `You're ahead -- but your lead may be at risk. See why inside.`
        : `Your competitor is ahead. Here's what they're doing differently.`;

    const yourGaugeColor = isWinning ? c.green : c.red;
    const compGaugeColor = isWinning ? c.slate400 : c.green;

    return h(
        Page,
        { size: 'LETTER', style: s.page1 },

        // Header
        h(
            View,
            { style: s.headerBar },
            h(Text, { style: s.brand }, 'AEO', h(Text, { style: s.brandAccent }, '.LIVE')),
            h(Text, { style: s.headerRight }, 'CONFIDENTIAL COMPETITIVE INTELLIGENCE'),
        ),
        h(View, { style: s.accentLine }),

        // Score comparison
        h(
            View,
            { style: s.scoreSection },
            h(Text, { style: s.sectionLabel }, 'COMPETITOR INTELLIGENCE BRIEFING'),
            h(Text, { style: s.sectionTitle },
                data.businessName || yourDomain,
            ),
            h(
                View,
                { style: s.gaugesRow },
                // Your gauge
                h(
                    View,
                    { style: s.gaugeContainer },
                    gauge(data.yourScore, yourGaugeColor),
                    h(Text, {
                        style: { ...s.gaugeLabel, color: c.accent },
                    }, 'YOUR BRAND'),
                    h(Text, { style: s.gaugeDomain }, yourDomain),
                ),
                // VS badge
                h(
                    View,
                    { style: { ...s.vsBadge, backgroundColor: vsBg } },
                    h(Text, { style: s.vsLabel }, 'VS'),
                    h(Text, { style: s.vsDiff },
                        `${diff > 0 ? '+' : ''}${diff}`,
                    ),
                ),
                // Competitor gauge
                h(
                    View,
                    { style: s.gaugeContainer },
                    gauge(data.competitorScore, compGaugeColor),
                    h(Text, {
                        style: { ...s.gaugeLabel, color: c.slate500 },
                    }, 'COMPETITOR'),
                    h(Text, { style: s.gaugeDomain }, compDomain),
                ),
            ),
        ),

        // Status banner
        h(
            View,
            { style: { ...s.statusBanner, backgroundColor: statusBg } },
            h(Text, { style: { ...s.statusText, color: statusColor } }, statusMsg),
        ),

        // Category breakdown
        h(
            View,
            { style: s.catSection },
            h(Text, { style: s.catSectionHeader }, 'Performance by Category'),
            h(View, { style: s.catDivider }),
            ...data.categories.map((cat, i) => categoryBar(cat, i)),
        ),

        // AI summary teaser
        h(
            View,
            { style: s.aiSection },
            h(Text, { style: s.aiText }, truncateSummary(data.aiSummary)),
            h(Text, { style: s.aiMore }, '... Full analysis continues across ' + data.categories.length + ' detailed categories'),
        ),

        // Footer
        h(
            View,
            { style: s.p1Footer },
            h(Text, { style: s.p1FooterText }, `Prepared ${data.createdAt}`),
            h(Text, { style: s.p1FooterText }, 'aeo.live'),
        ),
    );
}

// =============================================================================
// Page 2 — The FOMO
// =============================================================================

const lockedFeatures = [
    {
        title: 'Detailed Category Deep-Dives',
        desc: '7 expert analyses with specific findings for your business',
    },
    {
        title: 'Revenue Impact Calculator',
        desc: 'See the dollar value of closing your visibility gap',
    },
    {
        title: 'Strategic Game Plan',
        desc: 'Prioritized action items ranked by impact and effort',
    },
    {
        title: 'AI Platform Breakdown',
        desc: 'How ChatGPT, Claude, Gemini, and Perplexity see your brand',
    },
    {
        title: 'Brand Voice DNA Profile',
        desc: "Your brand's digital identity vs your competitor's",
    },
    {
        title: 'Technical Audit Findings',
        desc: 'Speed, crawlability, and indexation issues holding you back',
    },
];

function PageTwo() {
    return h(
        Page,
        { size: 'LETTER', style: s.page2 },

        h(Text, { style: s.p2Title }, "What's Inside Your Full Report"),
        h(Text, { style: s.p2Sub }, 'Your complete competitive intelligence is ready -- unlock it with your claim code.'),

        // Card grid
        h(
            View,
            { style: s.cardsGrid },
            ...lockedFeatures.map((feat, i) =>
                h(
                    View,
                    { key: String(i), style: s.lockedCard },
                    h(
                        View,
                        { style: s.cardLockRow },
                        // Lock icon using SVG
                        h(
                            Svg,
                            { width: 12, height: 14, viewBox: '0 0 12 14' },
                            h(Rect, { x: '1', y: '6', width: '10', height: '7', rx: '1.5', fill: c.amber }),
                            h(Circle, { cx: '6', cy: '4.5', r: '3', stroke: c.amber, strokeWidth: '1.5', fill: 'none' }),
                        ),
                        h(Text, { style: s.cardTitle }, feat.title),
                    ),
                    h(Text, { style: s.cardDesc }, feat.desc),
                    h(Text, { style: s.cardCta }, 'Available in full report  ->'),
                ),
            ),
        ),

        // Blurred preview
        h(
            View,
            { style: s.blurPreview },
            // Fake content lines (low opacity)
            h(
                View,
                { style: s.blurContent },
                h(View, { style: { ...s.blurLine, width: '70%' } }),
                h(View, { style: { ...s.blurLine, width: '90%' } }),
                h(View, { style: { ...s.blurLine, width: '55%' } }),
                h(View, { style: { ...s.blurLine, width: '80%' } }),
                h(View, { style: { ...s.blurLine, width: '45%' } }),
                h(View, { style: { ...s.blurLine, width: '75%' } }),
                h(View, { style: { ...s.blurLine, width: '60%' } }),
            ),
            // Frosted overlay
            h(
                View,
                { style: s.blurOverlay },
                // Lock SVG
                h(
                    Svg,
                    { width: 24, height: 28, viewBox: '0 0 24 28', style: { marginBottom: 6 } },
                    h(Rect, { x: '2', y: '12', width: '20', height: '14', rx: '3', fill: c.slate600 }),
                    h(Circle, { cx: '12', cy: '9', r: '5.5', stroke: c.slate600, strokeWidth: '2.5', fill: 'none' }),
                    h(Circle, { cx: '12', cy: '19', r: '2', fill: c.white }),
                ),
                h(Text, { style: s.blurLockText }, 'Unlock to reveal full analysis'),
                h(Text, { style: s.blurSubText }, 'Detailed category breakdowns, recommendations, and revenue projections'),
            ),
        ),

        // Footer
        h(
            View,
            { style: { ...s.p1Footer, bottom: 16 } },
            h(Text, { style: s.p1FooterText }, 'Page 2 of 3'),
            h(Text, { style: s.p1FooterText }, 'aeo.live'),
        ),
    );
}

// =============================================================================
// Page 3 — The CTA
// =============================================================================

function PageThree({ claimCode, createdAt }: { claimCode: string; createdAt: string }) {
    const steps = [
        'Visit aeo.live/claim',
        'Enter your claim code',
        'Create your free account',
        'Access your complete report',
    ];

    return h(
        Page,
        { size: 'LETTER', style: s.page3 },

        // Title
        h(Text, { style: s.ctaTitle }, 'Unlock Your Complete Report'),
        h(Text, { style: s.ctaSub }, 'Your personalized competitive intelligence is ready.'),

        // Code label
        h(Text, { style: s.codeLabel }, 'YOUR CLAIM CODE'),

        // Code box
        h(
            View,
            { style: s.codeBox },
            h(Text, { style: s.codeText }, claimCode || 'PREVIEW'),
        ),

        // Steps
        h(
            View,
            { style: s.stepsRow },
            ...steps.map((label, i) =>
                h(
                    View,
                    { key: String(i), style: s.stepItem },
                    h(
                        View,
                        { style: s.stepNumber },
                        h(Text, { style: s.stepNumText }, String(i + 1)),
                    ),
                    h(Text, { style: s.stepLabel }, label),
                ),
            ),
        ),

        // Urgency
        h(
            View,
            { style: s.urgencyBox },
            h(Text, { style: s.urgencyText },
                'This code is single-use and expires in 30 days.',
            ),
            h(Text, { style: { ...s.urgencyText, marginTop: 4 } },
                `Your competitor data is current as of ${createdAt}. Act before it changes.`,
            ),
        ),

        // Footer
        h(
            View,
            { style: s.p3Footer },
            h(Text, { style: s.p3FooterLine }, 'Powered by AEO.LIVE -- AI Visibility Intelligence'),
            h(Text, { style: s.p3FooterContact }, 'Questions? hello@aeo.live'),
        ),
    );
}

// =============================================================================
// NestJS Service
// =============================================================================

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    /**
     * Legacy single-page teaser (backward compat with getTeaser endpoint).
     */
    async generateTeaserPdf(teaser: ReportTeaser, claimCode: string): Promise<Buffer> {
        const salesData: SalesTeaserData = {
            analysisId: teaser.analysisId,
            yourUrl: teaser.yourUrl,
            competitorUrl: teaser.competitorUrl,
            yourScore: teaser.yourScore,
            competitorScore: teaser.competitorScore,
            status: teaser.status,
            categories: teaser.categories.map(cat => ({
                ...cat,
                icon: '',
                insightCount: 0,
                recommendationCount: 0,
            })),
            aiSummary: teaser.aiSummary || 'Detailed competitive analysis available in full report.',
            createdAt: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
        };
        return this.generateSalesPdf(salesData, claimCode);
    }

    /**
     * Generate a 3-page world-class sales teaser PDF.
     */
    async generateSalesPdf(data: SalesTeaserData, claimCode: string): Promise<Buffer> {
        this.logger.log(`Generating sales PDF for ${data.yourUrl} (claim: ${claimCode})`);

        const doc = h(
            Document,
            null,
            h(PageOne, { data, claimCode }),
            h(PageTwo, null),
            h(PageThree, { claimCode, createdAt: data.createdAt }),
        );

        const buffer = await renderToBuffer(doc as any);
        return Buffer.from(buffer);
    }
}
