import { Injectable, Logger } from '@nestjs/common';
import React from 'react';
import { renderToBuffer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { ReportTeaser } from '@aeo-live/shared';

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 30,
        textAlign: 'center',
    },
    logo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    logoAccent: {
        color: '#0ea5e9',
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 20,
    },
    divider: {
        height: 2,
        backgroundColor: '#e2e8f0',
        marginVertical: 20,
    },
    gradientBar: {
        height: 4,
        backgroundColor: '#0ea5e9',
        borderRadius: 2,
        marginBottom: 20,
    },

    // Score section
    scoreSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        gap: 40,
    },
    scoreBox: {
        alignItems: 'center',
        width: 140,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4,
    },
    scoreDomain: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 6,
    },
    vsBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vsText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#94a3b8',
    },

    // Category section
    categorySection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 12,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    categoryName: {
        fontSize: 11,
        color: '#334155',
        width: 120,
    },
    categoryScores: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    categoryScore: {
        fontSize: 11,
        fontWeight: 'bold',
        width: 30,
        textAlign: 'center',
    },
    deltaBadge: {
        fontSize: 9,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },

    // AI Summary
    summarySection: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 10,
        color: '#475569',
        lineHeight: 1.5,
    },

    // CTA section
    ctaSection: {
        marginTop: 30,
        padding: 20,
        backgroundColor: '#0f172a',
        borderRadius: 8,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 6,
    },
    ctaSubtitle: {
        fontSize: 10,
        color: '#94a3b8',
        marginBottom: 12,
    },
    ctaCode: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#38bdf8',
        letterSpacing: 2,
        marginBottom: 8,
    },
    ctaInstruction: {
        fontSize: 9,
        color: '#64748b',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
    },
});

// =============================================================================
// PDF Document Component
// =============================================================================

interface TeaserPdfProps {
    teaser: ReportTeaser;
    claimCode: string;
}

const TeaserDocument: React.FC<TeaserPdfProps> = ({ teaser, claimCode }) => {
    const scoreDiff = teaser.yourScore - teaser.competitorScore;
    const isWinning = scoreDiff > 0;

    const yourDomain = teaser.yourUrl
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
    const competitorDomain = teaser.competitorUrl
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');

    return React.createElement(
        Document,
        null,
        React.createElement(
            Page,
            { size: 'A4', style: styles.page },

            // Header
            React.createElement(
                View,
                { style: styles.header },
                React.createElement(Text, { style: styles.logo }, 'AEO.LIVE'),
                React.createElement(
                    Text,
                    { style: styles.subtitle },
                    'Competitive Intelligence Report — Preview',
                ),
                React.createElement(View, { style: styles.gradientBar }),
            ),

            // Score comparison
            React.createElement(
                View,
                { style: styles.scoreSection },
                React.createElement(
                    View,
                    { style: styles.scoreBox },
                    React.createElement(
                        Text,
                        { style: { ...styles.scoreValue, color: isWinning ? '#10b981' : '#0ea5e9' } },
                        String(Math.round(teaser.yourScore)),
                    ),
                    React.createElement(Text, { style: styles.scoreLabel }, 'YOUR SCORE'),
                    React.createElement(Text, { style: styles.scoreDomain }, yourDomain),
                ),
                React.createElement(
                    View,
                    { style: styles.vsBox },
                    React.createElement(Text, { style: styles.vsText }, 'VS'),
                ),
                React.createElement(
                    View,
                    { style: styles.scoreBox },
                    React.createElement(
                        Text,
                        { style: { ...styles.scoreValue, color: !isWinning ? '#f43f5e' : '#64748b' } },
                        String(Math.round(teaser.competitorScore)),
                    ),
                    React.createElement(Text, { style: styles.scoreLabel }, 'COMPETITOR'),
                    React.createElement(Text, { style: styles.scoreDomain }, competitorDomain),
                ),
            ),

            React.createElement(View, { style: styles.divider }),

            // Category breakdown
            React.createElement(
                View,
                { style: styles.categorySection },
                React.createElement(Text, { style: styles.sectionTitle }, 'Category Breakdown'),
                React.createElement(
                    View,
                    { style: { ...styles.categoryRow, backgroundColor: '#f8fafc', borderBottomWidth: 2 } },
                    React.createElement(Text, { style: { ...styles.categoryName, fontWeight: 'bold', fontSize: 9, color: '#64748b' } }, 'CATEGORY'),
                    React.createElement(
                        View,
                        { style: styles.categoryScores },
                        React.createElement(Text, { style: { ...styles.categoryScore, fontSize: 9, color: '#64748b' } }, 'YOU'),
                        React.createElement(Text, { style: { ...styles.categoryScore, fontSize: 9, color: '#64748b' } }, 'THEM'),
                        React.createElement(Text, { style: { ...styles.deltaBadge, fontSize: 9, color: '#64748b' } }, 'DIFF'),
                    ),
                ),
                ...teaser.categories.map((cat) => {
                    const diff = cat.yourScore - cat.competitorScore;
                    const catWinning = diff > 0;
                    return React.createElement(
                        View,
                        { key: cat.name, style: styles.categoryRow },
                        React.createElement(Text, { style: styles.categoryName }, `${cat.icon} ${cat.name}`),
                        React.createElement(
                            View,
                            { style: styles.categoryScores },
                            React.createElement(
                                Text,
                                { style: { ...styles.categoryScore, color: catWinning ? '#10b981' : '#334155' } },
                                String(Math.round(cat.yourScore)),
                            ),
                            React.createElement(
                                Text,
                                { style: { ...styles.categoryScore, color: !catWinning ? '#f43f5e' : '#334155' } },
                                String(Math.round(cat.competitorScore)),
                            ),
                            React.createElement(
                                Text,
                                {
                                    style: {
                                        ...styles.deltaBadge,
                                        backgroundColor: catWinning ? '#dcfce7' : diff < 0 ? '#fef2f2' : '#f1f5f9',
                                        color: catWinning ? '#166534' : diff < 0 ? '#991b1b' : '#475569',
                                    },
                                },
                                `${catWinning ? '+' : ''}${Math.round(diff)}`,
                            ),
                        ),
                    );
                }),
            ),

            // AI Summary
            React.createElement(
                View,
                { style: styles.summarySection },
                React.createElement(Text, { style: styles.summaryTitle }, '🧠 AI Analysis Summary'),
                React.createElement(Text, { style: styles.summaryText }, teaser.aiSummary),
            ),

            // CTA
            React.createElement(
                View,
                { style: styles.ctaSection },
                React.createElement(Text, { style: styles.ctaTitle }, 'Unlock Your Full Report'),
                React.createElement(
                    Text,
                    { style: styles.ctaSubtitle },
                    'Get category deep-dives, actionable recommendations, and a strategic roadmap',
                ),
                React.createElement(Text, { style: styles.ctaCode }, claimCode),
                React.createElement(
                    Text,
                    { style: styles.ctaInstruction },
                    'Visit aeo.live/claim and enter this code to access your complete analysis',
                ),
            ),

            // Footer
            React.createElement(
                Text,
                { style: styles.footer },
                `Generated by AEO.LIVE — ${new Date().toLocaleDateString()}`,
            ),
        ),
    );
};

// =============================================================================
// NestJS Service
// =============================================================================

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    /**
     * Generate a teaser PDF buffer for a given ReportTeaser and claim code.
     */
    async generateTeaserPdf(teaser: ReportTeaser, claimCode: string): Promise<Buffer> {
        this.logger.log(`Generating teaser PDF for analysis ${teaser.analysisId}`);

        const element = React.createElement(TeaserDocument, { teaser, claimCode });
        const buffer = await renderToBuffer(element as any);

        this.logger.log(`Teaser PDF generated: ${buffer.length} bytes`);
        return Buffer.from(buffer);
    }
}
