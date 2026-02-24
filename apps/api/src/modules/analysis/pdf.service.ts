import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ReportTeaser } from '@aeo-live/shared';

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
    slate600: '#475569',
    slate700: '#334155',
    white: '#ffffff',
};

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

function cleanDomain(url: string): string {
    return url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
}

function truncateSummary(text: string, maxLen = 280): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen).replace(/\s+\S*$/, '') + '...';
}

// Draw a score gauge (circle with number inside)
function drawScoreGauge(
    doc: PDFKit.PDFDocument,
    cx: number,
    cy: number,
    score: number,
    color: string,
    label: string,
) {
    // Background circle
    doc.save();
    doc.circle(cx, cy, 44).lineWidth(7).strokeColor(c.slate700).stroke();

    // Score arc — draw as a colored ring proportional to the score
    // PDFKit doesn't have arc, so draw a full circle clipped with dash
    const circumference = 2 * Math.PI * 44;
    const filled = (score / 100) * circumference;
    doc.circle(cx, cy, 44)
        .lineWidth(7)
        .strokeColor(color)
        .dash(filled, { space: circumference })
        .stroke();
    doc.undash();
    doc.restore();

    // Score number
    doc.fontSize(32).fillColor(color);
    const scoreStr = score.toString();
    const scoreW = doc.widthOfString(scoreStr);
    doc.text(scoreStr, cx - scoreW / 2, cy - 14, { lineBreak: false });

    // Label below
    doc.fontSize(8).fillColor(c.slate600);
    const labelStr = cleanDomain(label);
    const labelW = doc.widthOfString(labelStr);
    doc.text(
        labelStr.length > 25 ? labelStr.substring(0, 25) + '...' : labelStr,
        cx - Math.min(labelW, 120) / 2,
        cy + 54,
        { width: 120, align: 'center', lineBreak: false },
    );
}

// Draw a category comparison bar
function drawCategoryBar(
    doc: PDFKit.PDFDocument,
    y: number,
    cat: SalesTeaserCategory,
    pageW: number,
) {
    const barLeft = 185;
    const maxBarWidth = 200;
    const yourWidth = Math.max(4, (cat.yourScore / 100) * maxBarWidth);
    const compWidth = Math.max(4, (cat.competitorScore / 100) * maxBarWidth);
    const diff = cat.yourScore - cat.competitorScore;

    // Category name
    doc.fontSize(9).fillColor(c.bgDark).text(cat.name, 50, y, { width: 130 });

    // Your bar (teal)
    doc.roundedRect(barLeft, y, yourWidth, 8, 4).fill(c.accent);
    doc.fontSize(8)
        .fillColor(c.bgDark)
        .text(cat.yourScore.toString(), barLeft + yourWidth + 5, y - 1, {
            lineBreak: false,
        });

    // Competitor bar (grey)
    doc.roundedRect(barLeft, y + 13, compWidth, 8, 4).fill(c.textMuted);
    doc.fontSize(8)
        .fillColor(c.slate600)
        .text(
            cat.competitorScore.toString(),
            barLeft + compWidth + 5,
            y + 12,
            { lineBreak: false },
        );

    // Diff badge
    const diffColor = diff >= 0 ? c.green : c.red;
    const diffStr = `${diff > 0 ? '+' : ''}${diff}`;
    doc.fontSize(8).fillColor(diffColor).text(diffStr, 420, y + 5, {
        lineBreak: false,
    });

    // Locked insights indicator
    doc.fontSize(7)
        .fillColor(c.textMuted)
        .text(
            `${cat.insightCount || '?'} insights locked`,
            455,
            y + 6,
            { lineBreak: false },
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
    async generateTeaserPdf(
        teaser: ReportTeaser,
        claimCode: string,
    ): Promise<Buffer> {
        const salesData: SalesTeaserData = {
            analysisId: teaser.analysisId,
            yourUrl: teaser.yourUrl,
            competitorUrl: teaser.competitorUrl,
            yourScore: teaser.yourScore,
            competitorScore: teaser.competitorScore,
            status: teaser.status,
            categories: teaser.categories.map((cat) => ({
                ...cat,
                icon: '',
                insightCount: 0,
                recommendationCount: 0,
            })),
            aiSummary:
                teaser.aiSummary ||
                'Detailed competitive analysis available in full report.',
            createdAt: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
        };
        return this.generateSalesPdf(salesData, claimCode);
    }

    /**
     * Generate a 3-page world-class sales teaser PDF using PDFKit.
     */
    async generateSalesPdf(
        data: SalesTeaserData,
        claimCode: string,
    ): Promise<Buffer> {
        this.logger.log(
            `Generating sales PDF for ${data.yourUrl} (claim: ${claimCode})`,
        );

        return new Promise<Buffer>((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 0,
                    info: {
                        Title: `AEO Intelligence Report — ${cleanDomain(data.yourUrl)}`,
                        Author: 'AEO.LIVE',
                        Subject: 'Competitive Intelligence Preview',
                    },
                });
                const chunks: Buffer[] = [];
                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                const W = doc.page.width; // 595.28
                const H = doc.page.height; // 841.89

                // =============================================================
                // PAGE 1 — THE HOOK
                // =============================================================

                // Dark header bar
                doc.rect(0, 0, W, 80).fill(c.bgDark);
                doc.fontSize(22).fillColor(c.white).text('AEO.LIVE', 36, 28, {
                    lineBreak: false,
                });
                doc.fontSize(7)
                    .fillColor(c.textMuted)
                    .text(
                        'CONFIDENTIAL COMPETITIVE INTELLIGENCE',
                        340,
                        36,
                        { lineBreak: false },
                    );

                // Teal accent line
                doc.rect(0, 80, W, 3).fill(c.accent);

                // ---- Score Comparison ----
                const diff = data.yourScore - data.competitorScore;
                const diffColor = diff >= 0 ? c.green : c.red;

                drawScoreGauge(doc, 155, 170, data.yourScore, c.green, data.yourUrl);
                drawScoreGauge(
                    doc,
                    W - 155,
                    170,
                    data.competitorScore,
                    c.red,
                    data.competitorUrl,
                );

                // VS badge in center
                const vsX = W / 2;
                doc.circle(vsX, 170, 24).fill(c.cardDark);
                doc.fontSize(10)
                    .fillColor(c.textMuted)
                    .text('VS', vsX - 8, 157, { lineBreak: false });
                const diffStr = `${diff > 0 ? '+' : ''}${diff}`;
                doc.fontSize(14)
                    .fillColor(diffColor)
                    .text(
                        diffStr,
                        vsX - doc.widthOfString(diffStr) / 2,
                        173,
                        { lineBreak: false },
                    );

                // Status banner
                const bannerY = 248;
                const bannerColor = diff >= 0 ? c.greenDark : c.redDark;
                const bannerText =
                    diff >= 0
                        ? "You're ahead — but your lead may be at risk."
                        : "Your competitor is ahead. Here's what they're doing differently.";
                doc.roundedRect(50, bannerY, W - 100, 32, 8).fill(bannerColor);
                doc.fontSize(10)
                    .fillColor(diffColor)
                    .text(bannerText, 65, bannerY + 9, { width: W - 130 });

                // ---- Category Breakdown ----
                doc.fontSize(14)
                    .fillColor(c.bgDark)
                    .text('Performance by Category', 50, 300);
                doc.rect(50, 320, W - 100, 1).fill(c.slate200);

                let barY = 336;
                const categories = data.categories.slice(0, 7); // max 7 categories
                for (const cat of categories) {
                    drawCategoryBar(doc, barY, cat, W);
                    barY += 40;
                }

                // ---- AI Summary Teaser ----
                const summaryY = barY + 14;
                doc.rect(50, summaryY, 3, 50).fill(c.accent);
                doc.fontSize(9)
                    .fillColor(c.slate700)
                    .text(
                        truncateSummary(data.aiSummary),
                        65,
                        summaryY + 4,
                        { width: 430, lineGap: 4 },
                    );
                doc.fontSize(8)
                    .fillColor(c.textMuted)
                    .text(
                        'Full analysis continues across 7 detailed categories...',
                        65,
                        summaryY + 54,
                    );

                // Footer
                doc.fontSize(7)
                    .fillColor(c.textMuted)
                    .text('aeo.live', W - 90, H - 30, { lineBreak: false });
                doc.fontSize(7)
                    .fillColor(c.textMuted)
                    .text(
                        `Generated ${data.createdAt}`,
                        36,
                        H - 30,
                        { lineBreak: false },
                    );

                // =============================================================
                // PAGE 2 — THE FOMO (What's Inside)
                // =============================================================
                doc.addPage({ size: 'A4', margin: 0 });

                doc.fontSize(20)
                    .fillColor(c.bgDark)
                    .text("What's Inside Your Full Report", 50, 50, {
                        width: W - 100,
                    });
                doc.fontSize(11)
                    .fillColor(c.slate600)
                    .text(
                        'Your complete competitive intelligence is ready.',
                        50,
                        80,
                    );

                // Feature cards (2 columns, 3 rows)
                const cards = [
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

                const cardStartY = 115;
                const cardW = (W - 130) / 2;

                cards.forEach((card, i) => {
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    const cx = 50 + col * (cardW + 30);
                    const cy = cardStartY + row * 100;

                    // Dark card background
                    doc.roundedRect(cx, cy, cardW, 80, 8).fill(c.cardDark);

                    // Lock icon + title
                    doc.fontSize(10)
                        .fillColor(c.textPrimary)
                        .text(card.title, cx + 14, cy + 14, {
                            width: cardW - 28,
                        });

                    // Description
                    doc.fontSize(8)
                        .fillColor(c.textMuted)
                        .text(card.desc, cx + 14, cy + 34, {
                            width: cardW - 28,
                            lineGap: 3,
                        });

                    // CTA text
                    doc.fontSize(7)
                        .fillColor(c.accent)
                        .text('Available in full report →', cx + 14, cy + 62);
                });

                // Blurred preview mock
                const previewY = cardStartY + 325;
                doc.roundedRect(50, previewY, W - 100, 120, 8).fill(c.slate100);

                // Fake blurred lines
                for (let i = 0; i < 6; i++) {
                    const lineWidth = 100 + Math.random() * 300;
                    doc.roundedRect(
                        70,
                        previewY + 15 + i * 16,
                        lineWidth,
                        8,
                        4,
                    ).fill(c.slate200);
                }

                // Semi-transparent overlay
                doc.save();
                doc.roundedRect(50, previewY, W - 100, 120, 8)
                    .fillOpacity(0.85)
                    .fill(c.white);
                doc.restore();
                doc.fillOpacity(1);

                doc.fontSize(11)
                    .fillColor(c.slate600)
                    .text(
                        'Unlock to reveal full analysis',
                        50,
                        previewY + 42,
                        { width: W - 100, align: 'center' },
                    );
                doc.fontSize(9)
                    .fillColor(c.textMuted)
                    .text(
                        'Detailed category breakdowns, recommendations, and revenue projections',
                        50,
                        previewY + 62,
                        { width: W - 100, align: 'center' },
                    );

                // Page 2 Footer
                doc.fontSize(7)
                    .fillColor(c.textMuted)
                    .text('aeo.live', W - 90, H - 30, { lineBreak: false });

                // =============================================================
                // PAGE 3 — THE CTA
                // =============================================================
                doc.addPage({ size: 'A4', margin: 0 });

                // Full dark background
                doc.rect(0, 0, W, H).fill(c.bgDark);

                // Title
                doc.fontSize(30)
                    .fillColor(c.textPrimary)
                    .text('Unlock Your Complete Report', 50, 100, {
                        width: W - 100,
                        align: 'center',
                    });
                doc.fontSize(13)
                    .fillColor(c.textMuted)
                    .text(
                        'Your personalized competitive intelligence is ready.',
                        50,
                        145,
                        { width: W - 100, align: 'center' },
                    );

                // Claim code box
                const boxY = 200;
                const boxW = W - 200;
                doc.roundedRect(100, boxY, boxW, 120, 12).fill(c.cardDark);
                doc.roundedRect(100, boxY, boxW, 120, 12)
                    .lineWidth(2)
                    .strokeColor(c.accent)
                    .stroke();

                doc.fontSize(9)
                    .fillColor(c.textMuted)
                    .text('YOUR CLAIM CODE', 100, boxY + 18, {
                        width: boxW,
                        align: 'center',
                        characterSpacing: 3,
                    });

                const codeStr = claimCode || 'PREVIEW';
                doc.fontSize(34)
                    .fillColor(c.textPrimary)
                    .text(codeStr, 100, boxY + 42, {
                        width: boxW,
                        align: 'center',
                        characterSpacing: 4,
                    });

                doc.fontSize(11)
                    .fillColor(c.accent)
                    .text('aeo.live/claim', 100, boxY + 90, {
                        width: boxW,
                        align: 'center',
                    });

                // Steps
                const steps = [
                    'Visit aeo.live/claim',
                    'Enter your claim code',
                    'Create your free account',
                    'Access your complete report',
                ];

                let stepY = boxY + 155;
                steps.forEach((step, i) => {
                    // Number circle
                    doc.circle(130, stepY + 8, 12).fill(c.accent);
                    doc.fontSize(11)
                        .fillColor(c.bgDark)
                        .text(`${i + 1}`, 122, stepY + 2, {
                            width: 16,
                            align: 'center',
                        });

                    // Step text
                    doc.fontSize(12)
                        .fillColor(c.textPrimary)
                        .text(step, 155, stepY, { lineBreak: false });

                    stepY += 35;
                });

                // Urgency note
                doc.fontSize(9)
                    .fillColor(c.textMuted)
                    .text(
                        'This code is single-use and expires in 30 days.',
                        50,
                        stepY + 20,
                        { width: W - 100, align: 'center' },
                    );
                doc.text(
                    `Your competitor data is current as of ${data.createdAt}. Act before it changes.`,
                    50,
                    stepY + 35,
                    { width: W - 100, align: 'center' },
                );

                // Footer
                doc.fontSize(9)
                    .fillColor(c.slate600)
                    .text(
                        'Powered by AEO.LIVE — AI Visibility Intelligence',
                        50,
                        H - 60,
                        { width: W - 100, align: 'center' },
                    );
                doc.fontSize(8)
                    .fillColor(c.textMuted)
                    .text('Questions? hello@aeo.live', 50, H - 42, {
                        width: W - 100,
                        align: 'center',
                    });

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}
