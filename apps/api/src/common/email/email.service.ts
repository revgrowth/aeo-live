import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private readonly fromAddress: string;
    private readonly isConfigured: boolean;

    constructor() {
        this.fromAddress = process.env.SMTP_FROM || 'alerts@aeo.live';

        // Check if SMTP is configured
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (smtpHost && smtpUser && smtpPass) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
            this.isConfigured = true;
            console.log('[EmailService] SMTP configured successfully');
        } else {
            this.isConfigured = false;
            console.log('[EmailService] SMTP not configured - emails will be logged to console');
        }
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

        if (!this.isConfigured || !this.transporter) {
            // Log to console in development
            console.log('\n========== EMAIL (Console Mode) ==========');
            console.log(`To: ${recipients}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Body:\n${options.text || 'See HTML content'}`);
            console.log('==========================================\n');
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: this.fromAddress,
                to: recipients,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });
            console.log(`[EmailService] Email sent successfully to ${recipients}`);
            return true;
        } catch (error) {
            console.error('[EmailService] Failed to send email:', error);
            return false;
        }
    }

    async sendErrorNotification(
        errorType: string,
        severity: string,
        message: string,
        context: Record<string, unknown> = {}
    ): Promise<boolean> {
        const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || 'jason@roi.live').split(',').map(e => e.trim());

        const severityColors: Record<string, string> = {
            LOW: '#3b82f6',
            MEDIUM: '#f59e0b',
            HIGH: '#ef4444',
            CRITICAL: '#dc2626',
        };

        const severityEmoji: Record<string, string> = {
            LOW: 'ℹ️',
            MEDIUM: '⚠️',
            HIGH: '🔴',
            CRITICAL: '🚨',
        };

        const color = severityColors[severity] || '#6b7280';
        const emoji = severityEmoji[severity] || '📋';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AEO.LIVE System Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: ${color}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${emoji} System Alert</h1>
        </div>
        <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Severity:</td>
                    <td style="padding: 8px 0;">
                        <span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 14px;">
                            ${severity}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Type:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${errorType.replace(/_/g, ' ')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${new Date().toISOString()}</td>
                </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid ${color};">
                <h3 style="margin: 0 0 8px 0; color: #374151;">Error Message</h3>
                <p style="margin: 0; color: #4b5563;">${message}</p>
            </div>
            
            ${Object.keys(context).length > 0 ? `
            <div style="margin-top: 20px;">
                <h3 style="margin: 0 0 12px 0; color: #374151;">Context</h3>
                <pre style="background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${JSON.stringify(context, null, 2)}</pre>
            </div>
            ` : ''}
            
            <div style="margin-top: 24px; text-align: center;">
                <a href="${process.env.WEB_URL || 'http://localhost:3002'}/admin?tab=notifications" 
                   style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                    View in Admin Dashboard
                </a>
            </div>
        </div>
        <div style="padding: 16px; background: #f9fafb; text-align: center; color: #6b7280; font-size: 12px;">
            AEO.LIVE System Monitoring | ${new Date().getFullYear()}
        </div>
    </div>
</body>
</html>
        `;

        const text = `
AEO.LIVE System Alert

Severity: ${severity}
Type: ${errorType}
Time: ${new Date().toISOString()}

Error Message:
${message}

Context:
${JSON.stringify(context, null, 2)}

View in Admin Dashboard: ${process.env.WEB_URL || 'http://localhost:3002'}/admin?tab=notifications
        `;

        return this.sendEmail({
            to: adminEmails,
            subject: `${emoji} [${severity}] AEO.LIVE Alert: ${errorType.replace(/_/g, ' ')}`,
            html,
            text,
        });
    }
}
