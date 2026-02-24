import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ReportTeaser } from '@aeo-live/shared';

// =============================================================================
// Constants
// =============================================================================

const W = 595.28; // A4 width in points
const H = 841.89; // A4 height in points

// Color palette — premium dark theme
const c = {
    bgDark: '#0f172a',
    cardDark: '#1e293b',
    accent: '#14b8a6',
    accentLight: '#f0fdfa',
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
// Drawing Helpers
// =============================================================================

function cleanDomain(url: string): string {
    return url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
}

function truncateSummary(text: string, maxLen = 200): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen).replace(/\s+\S*$/, '') + '...';
}

/**
 * Draw an arc path for PDFKit using SVG-style arc command.
 * Stroke it with the desired color to create a score gauge ring.
 */
function drawArc(
    doc: PDFKit.PDFDocument,
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    lineW: number,
    color: string,
) {
    // Calculate start and end points
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    // Build SVG arc path
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
    doc.save();
    doc.path(path).lineWidth(lineW).strokeColor(color).stroke();
    doc.restore();
}

/**
 * Draw a small lock icon using shapes (no font/emoji dependency).
 */
function drawLockIcon(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    size = 8,
    color = '#94a3b8',
) {
    const s = size;
    // Lock body (rounded rectangle)
    doc.roundedRect(x, y + s * 0.4, s, s * 0.7, 1).fill(color);
    // Lock shackle (semicircle arc on top using SVG path)
    const arcR = s * 0.3;
    const arcCx = x + s / 2;
    const arcCy = y + s * 0.4;
    const shacklePath = `M ${arcCx - arcR} ${arcCy} A ${arcR} ${arcR} 0 0 1 ${arcCx + arcR} ${arcCy}`;
    doc.save();
    doc.path(shacklePath)
        .lineWidth(1.5)
        .strokeColor(color)
        .stroke();
    doc.restore();
}

/**
 * Draw a circular score gauge — dark ring background, colored arc, score number.
 */
function drawScoreGauge(
    doc: PDFKit.PDFDocument,
    cx: number,
    cy: number,
    score: number,
    color: string,
) {
    const radius = 50;
    const lineW = 10;

    // Background track ring
    doc.save();
    doc.circle(cx, cy, radius).lineWidth(lineW).strokeColor(c.cardDark).stroke();
    doc.restore();

    // Score arc (from top, clockwise)
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.max(1, score) / 100) * Math.PI * 2;
    drawArc(doc, cx, cy, radius, startAngle, endAngle, lineW, color);

    // Inner dark fill
    doc.circle(cx, cy, radius - 7).fill(c.bgDark);

    // Score number
    doc.font('Helvetica-Bold')
        .fontSize(38)
        .fillColor(c.white);
    const scoreStr = score.toString();
    const scoreW = doc.widthOfString(scoreStr);
    doc.text(scoreStr, cx - scoreW / 2, cy - 17, { lineBreak: false });

    // "SCORE" label
    doc.font('Helvetica')
        .fontSize(7)
        .fillColor(c.textMuted);
    doc.text('SCORE', cx - 20, cy + 22, {
        width: 40,
        align: 'center',
        characterSpacing: 2,
    });
}

/**
 * Draw a single category comparison row with dual bars and a diff badge.
 */
function drawCategoryRow(
    doc: PDFKit.PDFDocument,
    y: number,
    name: string,
    yourScore: number,
    compScore: number,
    insightCount: number,
) {
    const barAreaX = 200;
    const maxBarWidth = 175;
    const barH = 7;
    const diff = yourScore - compScore;
    const diffColor = diff > 0 ? c.green : diff < 0 ? c.red : c.textMuted;
    const badgeBg = diff > 0 ? c.greenDark : diff < 0 ? c.redDark : c.cardDark;

    // Category name
    doc.font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(c.bgDark)
        .text(name, 45, y + 3, { width: 148 });

    // Your bar (teal)
    const yourWidth = Math.max(6, (yourScore / 100) * maxBarWidth);
    doc.roundedRect(barAreaX, y, yourWidth, barH, 3).fill(c.accent);

    // Competitor bar (slate)
    const compWidth = Math.max(6, (compScore / 100) * maxBarWidth);
    doc.roundedRect(barAreaX, y + 12, compWidth, barH, 3).fill(c.slate600);

    // Score labels at end of bars
    doc.font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(c.accent)
        .text(yourScore.toString(), barAreaX + yourWidth + 5, y - 1, {
            lineBreak: false,
        });
    doc.font('Helvetica')
        .fontSize(8)
        .fillColor(c.slate600)
        .text(compScore.toString(), barAreaX + compWidth + 5, y + 11, {
            lineBreak: false,
        });

    // Diff badge (pill)
    doc.roundedRect(415, y + 3, 34, 16, 8).fill(badgeBg);
    doc.font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(diffColor)
        .text(`${diff > 0 ? '+' : ''}${diff}`, 415, y + 6, {
            width: 34,
            align: 'center',
        });

    // Locked insights with drawn lock icon
    drawLockIcon(doc, 458, y + 4, 8, c.textMuted);
    doc.font('Helvetica')
        .fontSize(7)
        .fillColor(c.textMuted)
        .text(`${insightCount || '?'} insights`, 470, y + 7, {
            lineBreak: false,
        });
}

/**
 * Draw a locked feature card on Page 2.
 */
function drawLockedCard(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    desc: string,
) {
    // Dark card background
    doc.roundedRect(x, y, w, h, 10).fill(c.cardDark);

    // Lock icon circle with drawn lock
    doc.circle(x + 22, y + 22, 14).fill(c.bgDark);
    drawLockIcon(doc, x + 17, y + 14, 10, c.textMuted);

    // Title
    doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(c.textPrimary)
        .text(title, x + 45, y + 14, { width: w - 60 });

    // Description
    doc.font('Helvetica')
        .fontSize(8)
        .fillColor(c.textMuted)
        .text(desc, x + 15, y + 42, { width: w - 30, lineGap: 3 });

    // CTA text
    doc.font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(c.accent)
        .text('Available in full report  >', x + 15, y + h - 22);
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

                this.drawPage1(doc, data);
                doc.addPage({ size: 'A4', margin: 0 });
                this.drawPage2(doc);
                doc.addPage({ size: 'A4', margin: 0 });
                this.drawPage3(doc, claimCode, data.createdAt);

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    // =========================================================================
    // PAGE 1 — THE HOOK
    // =========================================================================

    private drawPage1(doc: PDFKit.PDFDocument, data: SalesTeaserData) {
        const diff = data.yourScore - data.competitorScore;
        const diffColor = diff >= 0 ? c.green : c.red;

        // ---- Full-bleed dark header ----
        doc.save();
        doc.rect(0, 0, W, 85).fill(c.bgDark);
        doc.font('Helvetica-Bold').fontSize(22);
        doc.fillColor(c.white).text('AEO', 40, 30, { continued: true });
        doc.fillColor(c.accent).text('.LIVE', { lineBreak: false });
        doc.font('Helvetica')
            .fontSize(7)
            .fillColor(c.slate600)
            .text('CONFIDENTIAL COMPETITIVE INTELLIGENCE', 370, 38, {
                characterSpacing: 1.5,
                lineBreak: false,
            });
        // Accent line
        doc.rect(0, 85, W, 3).fill(c.accent);
        doc.restore();

        // ---- Dark score comparison card ----
        doc.roundedRect(30, 105, W - 60, 195, 12).fill(c.bgDark);

        // Score gauges
        drawScoreGauge(doc, 155, 195, data.yourScore, c.green);
        drawScoreGauge(doc, W - 155, 195, data.competitorScore, c.red);

        // VS badge
        doc.circle(W / 2, 190, 22).fill(c.cardDark);
        doc.font('Helvetica')
            .fontSize(10)
            .fillColor(c.textMuted)
            .text('VS', W / 2 - 7, 182, { lineBreak: false });
        // Diff pill below VS
        const diffStr = `${diff > 0 ? '+' : ''}${diff}`;
        const pillBg = diff >= 0 ? c.greenDark : c.redDark;
        doc.roundedRect(W / 2 - 20, 207, 40, 20, 10).fill(pillBg);
        doc.font('Helvetica-Bold')
            .fontSize(12)
            .fillColor(diffColor)
            .text(diffStr, W / 2 - 20, 210, { width: 40, align: 'center' });

        // Domain labels below gauges
        const yourDomain = cleanDomain(data.yourUrl);
        const compDomain = cleanDomain(data.competitorUrl);
        doc.font('Helvetica-Bold')
            .fontSize(9)
            .fillColor(c.textPrimary)
            .text(
                yourDomain.length > 26
                    ? yourDomain.substring(0, 26) + '...'
                    : yourDomain,
                85,
                255,
                { width: 140, align: 'center' },
            );
        doc.font('Helvetica')
            .fontSize(7)
            .fillColor(c.textMuted)
            .text('YOUR BRAND', 85, 268, {
                width: 140,
                align: 'center',
                characterSpacing: 1.5,
            });

        doc.font('Helvetica-Bold')
            .fontSize(9)
            .fillColor(c.textPrimary)
            .text(
                compDomain.length > 26
                    ? compDomain.substring(0, 26) + '...'
                    : compDomain,
                W - 225,
                255,
                { width: 140, align: 'center' },
            );
        doc.font('Helvetica')
            .fontSize(7)
            .fillColor(c.textMuted)
            .text('COMPETITOR', W - 225, 268, {
                width: 140,
                align: 'center',
                characterSpacing: 1.5,
            });

        // ---- Status banner ----
        const bannerY = 310;
        const bannerBg = diff >= 0 ? c.greenDark : c.redDark;
        const bannerText =
            diff >= 0
                ? "You're ahead — but your lead may be at risk."
                : "Your competitor is ahead. Here's what they're doing differently.";
        doc.roundedRect(35, bannerY, W - 70, 30, 8).fill(bannerBg);
        doc.font('Helvetica-Bold')
            .fontSize(10)
            .fillColor(diffColor)
            .text(bannerText, 52, bannerY + 8, { width: W - 104 });

        // ---- Category breakdown ----
        const catHeaderY = 358;
        doc.font('Helvetica-Bold')
            .fontSize(14)
            .fillColor(c.bgDark)
            .text('Performance by Category', 40, catHeaderY);
        doc.rect(40, catHeaderY + 20, W - 80, 1).fill(c.slate200);

        let rowY = catHeaderY + 30;
        const categories = data.categories.slice(0, 7);
        for (const cat of categories) {
            drawCategoryRow(
                doc,
                rowY,
                cat.name,
                cat.yourScore,
                cat.competitorScore,
                cat.insightCount,
            );
            rowY += 34;
        }

        // ---- AI summary teaser ----
        const summaryY = rowY + 12;
        // Teal-tinted background
        doc.roundedRect(40, summaryY, W - 80, 55, 6).fill(c.accentLight);
        // Teal left border
        doc.rect(40, summaryY, 4, 55).fill(c.accent);
        doc.font('Helvetica')
            .fontSize(9)
            .fillColor(c.slate700)
            .text(truncateSummary(data.aiSummary, 180), 56, summaryY + 10, {
                width: W - 120,
                lineGap: 4,
            });
        doc.font('Helvetica-Bold')
            .fontSize(8)
            .fillColor(c.textMuted)
            .text(
                'Full analysis continues across 7 detailed categories...',
                56,
                summaryY + 40,
            );

        // ---- Page footer ----
        doc.font('Helvetica')
            .fontSize(7)
            .fillColor(c.textMuted)
            .text(`Generated ${data.createdAt}`, 40, H - 28, {
                lineBreak: false,
            });
        doc.font('Helvetica-Bold')
            .fontSize(7)
            .fillColor(c.textMuted)
            .text('aeo.live', W - 80, H - 28, { lineBreak: false });
    }

    // =========================================================================
    // PAGE 2 — THE FOMO
    // =========================================================================

    private drawPage2(doc: PDFKit.PDFDocument) {
        // Light gray page background
        doc.rect(0, 0, W, H).fill(c.slate100);

        // Header
        doc.font('Helvetica-Bold')
            .fontSize(22)
            .fillColor(c.bgDark)
            .text("What's Inside Your Full Report", 40, 50);
        doc.font('Helvetica')
            .fontSize(11)
            .fillColor(c.slate600)
            .text(
                'Your complete competitive intelligence is ready — unlock it with your claim code.',
                40,
                82,
                { width: W - 80 },
            );

        // ---- Feature cards (2 × 3 grid) ----
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

        const cardW = 245;
        const cardH = 95;
        const gap = 25;
        const startX = 40;
        const startY = 115;

        cards.forEach((card, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            drawLockedCard(
                doc,
                startX + col * (cardW + gap),
                startY + row * (cardH + 15),
                cardW,
                cardH,
                card.title,
                card.desc,
            );
        });

        // ---- Blurred preview section ----
        const previewY = startY + 3 * (cardH + 15) + 20;

        // Container — taller for more impact
        const pvH = 140;
        doc.roundedRect(40, previewY, W - 80, pvH, 10).fill(c.slate200);

        // Fake blurred content lines (varied widths)
        for (let i = 0; i < 9; i++) {
            const lineWidth = 60 + Math.random() * 380;
            const lineX = 55 + (i % 4) * 12;
            doc.roundedRect(
                lineX,
                previewY + 14 + i * 13,
                lineWidth,
                6,
                3,
            ).fill(c.slate300);
        }

        // Darker frost overlay (0.75 opacity)
        doc.save();
        doc.roundedRect(40, previewY, W - 80, pvH, 10)
            .fillOpacity(0.75)
            .fill(c.white);
        doc.restore();
        doc.fillOpacity(1);

        // Drawn lock icon + message on overlay
        drawLockIcon(doc, W / 2 - 6, previewY + 42, 12, c.slate600);
        doc.font('Helvetica-Bold')
            .fontSize(13)
            .fillColor(c.slate600)
            .text('Unlock to reveal full analysis', 40, previewY + 60, {
                width: W - 80,
                align: 'center',
            });
        doc.font('Helvetica')
            .fontSize(9)
            .fillColor(c.textMuted)
            .text(
                'Detailed category breakdowns, recommendations, and revenue projections',
                40,
                previewY + 80,
                { width: W - 80, align: 'center' },
            );

        // Page footer
        doc.font('Helvetica')
            .fontSize(7)
            .fillColor(c.textMuted)
            .text('aeo.live', W - 80, H - 28, { lineBreak: false });
    }

    // =========================================================================
    // PAGE 3 — THE CTA
    // =========================================================================

    private drawPage3(doc: PDFKit.PDFDocument, claimCode: string, createdAt: string) {
        // Full dark background (edge to edge)
        doc.rect(0, 0, W, H).fill(c.bgDark);

        // Title
        doc.font('Helvetica-Bold')
            .fontSize(30)
            .fillColor(c.textPrimary)
            .text('Unlock Your', 50, 90, {
                width: W - 100,
                align: 'center',
            });
        doc.text('Complete Report', 50, 125, {
            width: W - 100,
            align: 'center',
        });

        doc.font('Helvetica')
            .fontSize(13)
            .fillColor(c.textMuted)
            .text(
                'Your personalized competitive intelligence is ready.',
                50,
                170,
                { width: W - 100, align: 'center' },
            );

        // ---- Claim code box with teal border ----
        const boxY = 220;
        const boxW = W - 180;
        const boxX = 90;

        // Fill then stroke for the border
        doc.roundedRect(boxX, boxY, boxW, 130, 14).fill(c.cardDark);
        doc.roundedRect(boxX, boxY, boxW, 130, 14)
            .lineWidth(2)
            .strokeColor(c.accent)
            .stroke();

        // "YOUR CLAIM CODE" label
        doc.font('Helvetica')
            .fontSize(9)
            .fillColor(c.textMuted)
            .text('YOUR CLAIM CODE', boxX, boxY + 20, {
                width: boxW,
                align: 'center',
                characterSpacing: 3,
            });

        // Claim code — HUGE
        const codeStr = claimCode || 'PREVIEW';
        doc.font('Helvetica-Bold')
            .fontSize(38)
            .fillColor(c.white)
            .text(codeStr, boxX, boxY + 45, {
                width: boxW,
                align: 'center',
                characterSpacing: 5,
            });

        // Claim URL
        doc.font('Helvetica-Bold')
            .fontSize(12)
            .fillColor(c.accent)
            .text('aeo.live/claim', boxX, boxY + 98, {
                width: boxW,
                align: 'center',
            });

        // ---- Steps ----
        const steps = [
            'Visit aeo.live/claim',
            'Enter your claim code',
            'Create your free account',
            'Access your complete report',
        ];

        let stepY = boxY + 170;
        steps.forEach((step, i) => {
            // Teal circle with number
            doc.circle(140, stepY + 10, 14).fill(c.accent);
            doc.font('Helvetica-Bold')
                .fontSize(13)
                .fillColor(c.bgDark)
                .text(`${i + 1}`, 131, stepY + 4, {
                    width: 18,
                    align: 'center',
                });

            // Step label
            doc.font('Helvetica')
                .fontSize(13)
                .fillColor(c.textPrimary)
                .text(step, 168, stepY + 3, { lineBreak: false });

            stepY += 40;
        });

        // ---- Urgency notice ----
        const urgencyY = stepY + 25;
        doc.roundedRect(80, urgencyY, W - 160, 50, 8).fill(c.cardDark);
        doc.font('Helvetica')
            .fontSize(9)
            .fillColor(c.textMuted)
            .text(
                'This code is single-use and expires in 30 days.',
                80,
                urgencyY + 12,
                { width: W - 160, align: 'center' },
            );
        doc.text(
            `Your competitor data is current as of ${createdAt}. Act before it changes.`,
            80,
            urgencyY + 28,
            { width: W - 160, align: 'center' },
        );

        // ---- Footer ----
        doc.font('Helvetica')
            .fontSize(9)
            .fillColor(c.slate600)
            .text(
                'Powered by AEO.LIVE — AI Visibility Intelligence',
                50,
                H - 60,
                { width: W - 100, align: 'center' },
            );
        doc.font('Helvetica')
            .fontSize(8)
            .fillColor(c.textMuted)
            .text('Questions? hello@aeo.live', 50, H - 42, {
                width: W - 100,
                align: 'center',
            });
    }
}
