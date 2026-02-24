import { Injectable, Logger } from '@nestjs/common';
import React from 'react';
import { renderToBuffer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { ReportTeaser } from '@aeo-live/shared';

// =============================================================================
// Shared colour tokens
// =============================================================================
const c = {
    slate900: '#0f172a',
    slate800: '#1e293b',
    slate700: '#334155',
    slate600: '#475569',
    slate500: '#64748b',
    slate400: '#94a3b8',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
    slate50: '#f8fafc',
    white: '#ffffff',
    emerald600: '#059669',
    emerald500: '#10b981',
    emerald400: '#34d399',
    emerald50: '#ecfdf5',
    teal500: '#14b8a6',
    sky500: '#0ea5e9',
    sky100: '#e0f2fe',
    sky50: '#f0f9ff',
    rose500: '#f43f5e',
    rose50: '#fff1f2',
    amber500: '#f59e0b',
    amber400: '#fbbf24',
    amber50: '#fffbeb',
};

// =============================================================================
// Styles
// =============================================================================

const s = StyleSheet.create({
    // ------------ global page ------------
    page1: {
        padding: 40,
        paddingBottom: 50,
        fontFamily: 'Helvetica',
        backgroundColor: c.white,
    },
    page2: {
        padding: 40,
        paddingBottom: 50,
        fontFamily: 'Helvetica',
        backgroundColor: c.slate50,
    },

    // ------------ header ------------
    header: { marginBottom: 24, textAlign: 'center' },
    brand: { fontSize: 26, fontWeight: 'bold', color: c.slate900, letterSpacing: 1 },
    brandAccent: { color: c.teal500 },
    tagline: { fontSize: 11, color: c.slate500, marginTop: 2 },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 12,
    },
    metaItem: { fontSize: 9, color: c.slate500 },
    metaValue: { fontWeight: 'bold', color: c.slate700 },
    accentBar: { height: 3, backgroundColor: c.teal500, borderRadius: 2, marginTop: 16 },

    // ------------ score section ------------
    scoreSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        gap: 30,
    },
    scoreCard: {
        width: 155,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    scoreNum: { fontSize: 44, fontWeight: 'bold' },
    scoreRole: { fontSize: 8, fontWeight: 'bold', letterSpacing: 2, marginTop: 2 },
    scoreDomain: { fontSize: 10, fontWeight: 'bold', color: c.slate700, marginTop: 6 },
    vsCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: c.slate200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vsText: { fontSize: 12, fontWeight: 'bold', color: c.slate500 },
    statusBadge: {
        alignSelf: 'center',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 12,
        marginBottom: 20,
    },
    statusText: { fontSize: 10, fontWeight: 'bold', color: c.white },

    // ------------ category table ------------
    catSection: { marginBottom: 16 },
    sectionLabel: { fontSize: 13, fontWeight: 'bold', color: c.slate900, marginBottom: 10 },
    catTableHead: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: c.slate100,
        borderRadius: 4,
        marginBottom: 4,
    },
    catHeadCell: { fontSize: 8, fontWeight: 'bold', color: c.slate500, letterSpacing: 1 },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: c.slate100,
    },
    catName: { fontSize: 10, color: c.slate700, width: 115, fontWeight: 'bold' },
    catYou: { fontSize: 10, fontWeight: 'bold', width: 36, textAlign: 'center' },
    catThem: { fontSize: 10, fontWeight: 'bold', width: 36, textAlign: 'center' },
    catDiffBox: {
        fontSize: 8,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        width: 38,
        textAlign: 'center',
    },
    catStatusBox: {
        fontSize: 7,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        width: 38,
        textAlign: 'center',
    },
    catHint: { fontSize: 8, color: c.slate400, fontStyle: 'italic', flex: 1, textAlign: 'right' },

    // ------------ AI summary ------------
    summaryBox: {
        marginTop: 14,
        padding: 14,
        backgroundColor: c.sky50,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: c.sky100,
    },
    summaryLabel: { fontSize: 10, fontWeight: 'bold', color: c.slate900, marginBottom: 6 },
    summaryText: { fontSize: 9, color: c.slate600, lineHeight: 1.6 },
    summaryFade: { fontSize: 9, color: c.slate400, fontStyle: 'italic', marginTop: 4 },

    // ------------ locked sections ------------
    lockedSection: {
        marginTop: 10,
        padding: 12,
        backgroundColor: c.slate100,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: c.slate200,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    lockIcon: { fontSize: 7, width: 48, textAlign: 'center', fontWeight: 'bold', color: c.slate400 },
    lockedTitle: { fontSize: 10, fontWeight: 'bold', color: c.slate500 },
    lockedDesc: { fontSize: 8, color: c.slate400, fontStyle: 'italic', marginTop: 2 },

    // ------------ page 2 CTA ------------
    ctaOuter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaCard: {
        width: '100%',
        padding: 32,
        backgroundColor: c.slate900,
        borderRadius: 12,
    },
    ctaHeaderIcon: { fontSize: 28, textAlign: 'center', marginBottom: 10 },
    ctaTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: c.white,
        textAlign: 'center',
        marginBottom: 6,
    },
    ctaSub: {
        fontSize: 10,
        color: c.slate400,
        textAlign: 'center',
        marginBottom: 20,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        paddingLeft: 20,
    },
    checkMark: { fontSize: 10, color: c.emerald400, width: 14 },
    checkText: { fontSize: 10, color: c.slate200 },

    ctaDivider: {
        height: 1,
        backgroundColor: c.slate700,
        marginVertical: 20,
        marginHorizontal: 20,
    },
    ctaCodeLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: c.slate400,
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 8,
    },
    ctaCodeBox: {
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: c.slate800,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: c.amber400,
        marginBottom: 12,
    },
    ctaCode: {
        fontSize: 22,
        fontWeight: 'bold',
        color: c.amber400,
        letterSpacing: 4,
        textAlign: 'center',
    },
    ctaUrl: {
        fontSize: 12,
        fontWeight: 'bold',
        color: c.sky500,
        textAlign: 'center',
        marginBottom: 6,
    },
    ctaUrlHint: {
        fontSize: 9,
        color: c.slate400,
        textAlign: 'center',
        marginBottom: 6,
    },
    ctaExpiry: {
        fontSize: 8,
        color: c.slate500,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 8,
    },

    // ------------ footer ------------
    footer: {
        position: 'absolute',
        bottom: 22,
        left: 40,
        right: 40,
        textAlign: 'center',
    },
    footerLine: { fontSize: 7, color: c.slate400 },
});

// =============================================================================
// Types for the enriched sales teaser data
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
// Helper: createElement shortcuts
// =============================================================================

const h = React.createElement;

// =============================================================================
// Page 1 — The Hook
// =============================================================================

function PageOne({ data, claimCode }: { data: SalesTeaserData; claimCode: string }) {
    const diff = data.yourScore - data.competitorScore;
    const isWinning = diff > 0;
    const yourDomain = data.yourUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    const compDomain = data.competitorUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

    // Truncate AI summary to ~2 sentences
    const sentences = data.aiSummary.split(/(?<=[.!?])\s+/);
    const truncatedSummary = sentences.slice(0, 3).join(' ');
    const hasTruncation = sentences.length > 3;

    return h(Page, { size: 'A4', style: s.page1 },

        // — Header —
        h(View, { style: s.header },
            h(Text, { style: s.brand }, 'AEO', h(Text, { style: s.brandAccent }, '.LIVE')),
            h(Text, { style: s.tagline }, 'AI Visibility Competitive Analysis'),
            h(View, { style: s.metaRow },
                h(Text, { style: s.metaItem }, 'Prepared for: ', h(Text, { style: s.metaValue }, data.businessName || yourDomain)),
                h(Text, { style: s.metaItem }, 'Date: ', h(Text, { style: s.metaValue }, data.createdAt)),
            ),
            h(View, { style: s.accentBar }),
        ),

        // — Score comparison —
        h(View, { style: s.scoreSection },
            h(View, { style: { ...s.scoreCard, backgroundColor: c.emerald50, borderWidth: 1, borderColor: c.emerald400 } },
                h(Text, { style: { ...s.scoreNum, color: c.emerald600 } }, String(Math.round(data.yourScore))),
                h(Text, { style: { ...s.scoreRole, color: c.emerald600 } }, 'YOUR SCORE'),
                h(Text, { style: s.scoreDomain }, yourDomain),
            ),
            h(View, { style: s.vsCircle },
                h(Text, { style: s.vsText }, 'VS'),
            ),
            h(View, { style: { ...s.scoreCard, backgroundColor: c.slate100, borderWidth: 1, borderColor: c.slate200 } },
                h(Text, { style: { ...s.scoreNum, color: c.slate600 } }, String(Math.round(data.competitorScore))),
                h(Text, { style: { ...s.scoreRole, color: c.slate500 } }, 'COMPETITOR'),
                h(Text, { style: s.scoreDomain }, compDomain),
            ),
        ),

        // — Status badge —
        h(View, {
            style: {
                ...s.statusBadge,
                backgroundColor: isWinning ? c.emerald500 : diff < 0 ? c.rose500 : c.slate500,
            }
        },
            h(Text, { style: s.statusText },
                isWinning
                    ? `You're Winning by ${diff} Points`
                    : diff < 0
                        ? `Room to Improve — ${Math.abs(diff)} Point Gap`
                        : 'Evenly Matched',
            ),
        ),

        // — Category breakdown (with insight hints) —
        h(View, { style: s.catSection },
            h(Text, { style: s.sectionLabel }, 'Category Breakdown'),
            h(View, { style: s.catTableHead },
                h(Text, { style: { ...s.catHeadCell, width: 115 } }, 'CATEGORY'),
                h(Text, { style: { ...s.catHeadCell, width: 36, textAlign: 'center' } }, 'YOU'),
                h(Text, { style: { ...s.catHeadCell, width: 36, textAlign: 'center' } }, 'THEM'),
                h(Text, { style: { ...s.catHeadCell, width: 38, textAlign: 'center' } }, 'DIFF'),
                h(Text, { style: { ...s.catHeadCell, flex: 1, textAlign: 'right' } }, ''),
            ),
            ...data.categories.map((cat) => {
                const catDiff = cat.yourScore - cat.competitorScore;
                const catWin = catDiff > 0;
                const totalItems = cat.insightCount + cat.recommendationCount;
                return h(View, { key: cat.name, style: s.catRow },
                    h(Text, { style: s.catName }, cat.name),
                    h(Text, { style: { ...s.catYou, color: catWin ? c.emerald600 : c.slate700 } }, String(Math.round(cat.yourScore))),
                    h(Text, { style: { ...s.catThem, color: !catWin && catDiff < 0 ? c.rose500 : c.slate500 } }, String(Math.round(cat.competitorScore))),
                    h(Text, {
                        style: {
                            ...s.catDiffBox,
                            backgroundColor: catWin ? c.emerald50 : catDiff < 0 ? c.rose50 : c.slate100,
                            color: catWin ? c.emerald600 : catDiff < 0 ? c.rose500 : c.slate500,
                        }
                    }, `${catWin ? '+' : ''}${Math.round(catDiff)}`),
                    h(Text, { style: s.catHint },
                        totalItems > 0
                            ? `${totalItems} insights available in full report`
                            : 'Details in full report',
                    ),
                );
            }),
        ),

        // — AI Summary (truncated) —
        h(View, { style: s.summaryBox },
            h(Text, { style: s.summaryLabel }, 'AI Analysis Summary'),
            h(Text, { style: s.summaryText }, truncatedSummary),
            hasTruncation
                ? h(Text, { style: s.summaryFade }, '... Full analysis continues in your complete report')
                : null,
        ),

        // — Locked sections —
        h(View, { style: s.lockedSection },
            h(Text, { style: s.lockIcon }, '[LOCKED]'),
            h(View, { style: { flex: 1 } },
                h(Text, { style: s.lockedTitle }, 'Detailed Category Deep-Dives'),
                h(Text, { style: s.lockedDesc }, `${data.categories.length} detailed breakdowns with actionable insights — available in full report`),
            ),
        ),
        h(View, { style: s.lockedSection },
            h(Text, { style: s.lockIcon }, '[LOCKED]'),
            h(View, { style: { flex: 1 } },
                h(Text, { style: s.lockedTitle }, 'Revenue Impact Calculator'),
                h(Text, { style: s.lockedDesc }, 'See the estimated revenue impact of improving your AI visibility'),
            ),
        ),
        h(View, { style: s.lockedSection },
            h(Text, { style: s.lockIcon }, '[LOCKED]'),
            h(View, { style: { flex: 1 } },
                h(Text, { style: s.lockedTitle }, 'Strategic Game Plan'),
                h(Text, { style: s.lockedDesc }, 'Your prioritized action plan with specific next steps'),
            ),
        ),

        // — Footer —
        h(View, { style: s.footer },
            h(Text, { style: s.footerLine }, 'Powered by AEO.LIVE — AI Visibility Intelligence'),
        ),
    );
}

// =============================================================================
// Page 2 — The CTA
// =============================================================================

function PageTwo({ claimCode }: { claimCode: string }) {
    const checklist = [
        'Detailed analysis across all 7 categories',
        'Specific, actionable recommendations for each category',
        'Revenue impact calculator to quantify opportunity',
        'Strategic game plan with prioritized next steps',
        'AI readiness score with platform-by-platform breakdown',
        'Brand voice DNA profiling with competitor comparison',
    ];

    return h(Page, { size: 'A4', style: s.page2 },

        h(View, { style: s.ctaOuter },
            h(View, { style: s.ctaCard },

                h(Text, { style: s.ctaHeaderIcon }, '>>'),
                h(Text, { style: s.ctaTitle }, 'UNLOCK YOUR COMPLETE REPORT'),
                h(Text, { style: s.ctaSub }, 'Your full competitive intelligence report includes:'),

                // — Checklist —
                ...checklist.map((item, i) =>
                    h(View, { key: String(i), style: s.checklistItem },
                        h(Text, { style: s.checkMark }, '*'),
                        h(Text, { style: s.checkText }, item),
                    ),
                ),

                h(View, { style: s.ctaDivider }),

                // — Claim code —
                h(Text, { style: s.ctaCodeLabel }, 'YOUR CLAIM CODE'),
                h(View, { style: s.ctaCodeBox },
                    h(Text, { style: s.ctaCode }, claimCode),
                ),

                h(Text, { style: s.ctaUrl }, 'aeo.live/claim'),
                h(Text, { style: s.ctaUrlHint }, 'Enter your code to create your free account'),
                h(Text, { style: s.ctaUrlHint }, 'and access your complete report instantly.'),
                h(Text, { style: s.ctaExpiry }, 'This code is single-use and expires in 30 days.'),
            ),
        ),

        // — Footer —
        h(View, { style: s.footer },
            h(Text, { style: s.footerLine }, 'Powered by AEO.LIVE — AI Visibility Intelligence'),
            h(Text, { style: { ...s.footerLine, marginTop: 2 } }, 'Questions? Contact us at hello@aeo.live'),
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
     * Legacy single-page teaser (used by getTeaser endpoint).
     */
    async generateTeaserPdf(teaser: ReportTeaser, claimCode: string): Promise<Buffer> {
        this.logger.log(`Generating teaser PDF for analysis ${teaser.analysisId}`);

        // Convert ReportTeaser → SalesTeaserData with zero insight counts
        const salesData: SalesTeaserData = {
            ...teaser,
            categories: teaser.categories.map(cat => ({
                ...cat,
                insightCount: 0,
                recommendationCount: 0,
            })),
            createdAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        };

        return this.generateSalesPdf(salesData, claimCode);
    }

    /**
     * Generate a 2-page sales teaser PDF with enriched category data.
     */
    async generateSalesPdf(data: SalesTeaserData, claimCode: string): Promise<Buffer> {
        this.logger.log(`Generating sales teaser PDF for ${data.yourUrl} (code: ${claimCode})`);

        const doc = h(Document, null,
            h(PageOne, { data, claimCode }),
            h(PageTwo, { claimCode }),
        );

        const buffer = await renderToBuffer(doc as any);
        this.logger.log(`Sales PDF generated: ${buffer.length} bytes`);
        return Buffer.from(buffer);
    }
}
