import { Injectable, LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ErrorLogEntry {
    id: string;
    timestamp: string;
    level: 'error' | 'warn' | 'info';
    message: string;
    context?: string;
    stack?: string;
    metadata?: Record<string, unknown>;
    userAgent?: string;
    userId?: string;
    requestPath?: string;
    requestMethod?: string;
}

export interface BugReport {
    id: string;
    timestamp: string;
    errorId?: string;
    userDescription: string;
    email?: string;
    url: string;
    userAgent: string;
    errorMessage?: string;
    errorStack?: string;
    metadata?: Record<string, unknown>;
}

@Injectable()
export class ErrorLoggingService implements LoggerService {
    private logDir: string;
    private errorLogPath: string;
    private bugReportPath: string;

    constructor() {
        // Create logs directory
        this.logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        // Log file paths
        const date = new Date().toISOString().split('T')[0];
        this.errorLogPath = path.join(this.logDir, `errors-${date}.log`);
        this.bugReportPath = path.join(this.logDir, `bug-reports-${date}.log`);
    }

    private generateId(): string {
        return 'err_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    private writeLog(filePath: string, entry: object): void {
        const line = JSON.stringify(entry) + '\n';
        fs.appendFileSync(filePath, line, 'utf8');
    }

    /**
     * Log an error with full context
     */
    logError(
        message: string,
        context?: string,
        metadata?: Record<string, unknown>,
        stack?: string,
    ): string {
        const errorId = this.generateId();
        const entry: ErrorLogEntry = {
            id: errorId,
            timestamp: new Date().toISOString(),
            level: 'error',
            message,
            context,
            stack,
            metadata,
        };

        this.writeLog(this.errorLogPath, entry);

        // Also log to console
        console.error(`[${entry.timestamp}] [${errorId}] ERROR in ${context}:`, message);
        if (stack) {
            console.error(stack);
        }
        if (metadata) {
            console.error('Metadata:', JSON.stringify(metadata, null, 2));
        }

        return errorId;
    }

    /**
     * Log a bug report from a user
     */
    logBugReport(report: Omit<BugReport, 'id' | 'timestamp'>): string {
        const reportId = 'bug_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
        const entry: BugReport = {
            id: reportId,
            timestamp: new Date().toISOString(),
            ...report,
        };

        this.writeLog(this.bugReportPath, entry);

        // Also log to console for immediate visibility
        console.log('='.repeat(60));
        console.log(`🐛 BUG REPORT RECEIVED: ${reportId}`);
        console.log(`Time: ${entry.timestamp}`);
        console.log(`URL: ${entry.url}`);
        if (entry.email) console.log(`Email: ${entry.email}`);
        console.log(`Description: ${entry.userDescription}`);
        if (entry.errorMessage) console.log(`Error: ${entry.errorMessage}`);
        if (entry.errorId) console.log(`Related Error ID: ${entry.errorId}`);
        console.log('='.repeat(60));

        return reportId;
    }

    /**
     * Get recent error logs (for debugging)
     */
    getRecentErrors(limit = 50): ErrorLogEntry[] {
        try {
            if (!fs.existsSync(this.errorLogPath)) {
                return [];
            }
            const content = fs.readFileSync(this.errorLogPath, 'utf8');
            const lines = content.trim().split('\n').filter(Boolean);
            return lines
                .slice(-limit)
                .map(line => JSON.parse(line) as ErrorLogEntry)
                .reverse();
        } catch {
            return [];
        }
    }

    /**
     * Get recent bug reports
     */
    getRecentBugReports(limit = 50): BugReport[] {
        try {
            if (!fs.existsSync(this.bugReportPath)) {
                return [];
            }
            const content = fs.readFileSync(this.bugReportPath, 'utf8');
            const lines = content.trim().split('\n').filter(Boolean);
            return lines
                .slice(-limit)
                .map(line => JSON.parse(line) as BugReport)
                .reverse();
        } catch {
            return [];
        }
    }

    // Standard NestJS Logger interface methods
    log(message: string, context?: string) {
        console.log(`[INFO] [${context}]`, message);
    }

    error(message: string, trace?: string, context?: string) {
        this.logError(message, context, undefined, trace);
    }

    warn(message: string, context?: string) {
        console.warn(`[WARN] [${context}]`, message);
    }

    debug(message: string, context?: string) {
        console.debug(`[DEBUG] [${context}]`, message);
    }

    verbose(message: string, context?: string) {
        console.log(`[VERBOSE] [${context}]`, message);
    }
}

// Singleton instance for global access
export const errorLogger = new ErrorLoggingService();
