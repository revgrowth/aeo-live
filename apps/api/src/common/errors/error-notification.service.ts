import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { SystemErrorType, ErrorSeverity, ErrorStatus } from '@prisma/client';

export interface CaptureErrorOptions {
    type: SystemErrorType;
    severity?: ErrorSeverity;
    source: string;
    message: string;
    error?: Error;
    context?: Record<string, unknown>;
    sendNotification?: boolean;
}

export interface SystemErrorRecord {
    id: string;
    type: SystemErrorType;
    severity: ErrorSeverity;
    source: string;
    message: string;
    stackTrace: string | null;
    context: unknown;
    notificationSent: boolean;
    notifiedAt: Date | null;
    status: ErrorStatus;
    acknowledgedBy: string | null;
    acknowledgedAt: Date | null;
    resolvedBy: string | null;
    resolvedAt: Date | null;
    resolution: string | null;
    createdAt: Date;
}

@Injectable()
export class ErrorNotificationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService
    ) { }

    /**
     * Capture and store a system error
     * Optionally sends email notification for HIGH and CRITICAL errors
     */
    async captureError(options: CaptureErrorOptions): Promise<SystemErrorRecord> {
        const {
            type,
            severity = ErrorSeverity.MEDIUM,
            source,
            message,
            error,
            context = {},
            sendNotification = true,
        } = options;

        // Create error record
        const systemError = await this.prisma.systemError.create({
            data: {
                type,
                severity,
                source,
                message,
                stackTrace: error?.stack || null,
                context: context as object,
            },
        });

        console.log(`[ErrorNotification] Captured ${severity} error: ${type} - ${message}`);

        // Send email notification for HIGH and CRITICAL errors
        if (sendNotification && (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL)) {
            try {
                const emailSent = await this.emailService.sendErrorNotification(
                    type,
                    severity,
                    message,
                    {
                        ...context,
                        errorId: systemError.id,
                        source,
                        stackTrace: error?.stack?.split('\n').slice(0, 5).join('\n'),
                    }
                );

                if (emailSent) {
                    await this.prisma.systemError.update({
                        where: { id: systemError.id },
                        data: {
                            notificationSent: true,
                            notifiedAt: new Date(),
                        },
                    });
                }
            } catch (emailError) {
                console.error('[ErrorNotification] Failed to send email notification:', emailError);
            }
        }

        return systemError;
    }

    /**
     * Capture an API failure error
     */
    async captureApiFailure(
        service: string,
        operation: string,
        error: Error,
        context: Record<string, unknown> = {}
    ): Promise<SystemErrorRecord> {
        return this.captureError({
            type: SystemErrorType.API_FAILURE,
            severity: ErrorSeverity.HIGH,
            source: service,
            message: `${service} ${operation} failed: ${error.message}`,
            error,
            context: { ...context, operation },
        });
    }

    /**
     * Capture a data collection failure
     */
    async captureDataCollectionFailure(
        url: string,
        error: Error,
        context: Record<string, unknown> = {}
    ): Promise<SystemErrorRecord> {
        return this.captureError({
            type: SystemErrorType.DATA_COLLECTION,
            severity: ErrorSeverity.HIGH,
            source: 'data-collection',
            message: `Failed to collect data for ${url}: ${error.message}`,
            error,
            context: { ...context, url },
        });
    }

    /**
     * Capture a scoring failure
     */
    async captureScoringFailure(
        analysisId: string,
        error: Error,
        context: Record<string, unknown> = {}
    ): Promise<SystemErrorRecord> {
        return this.captureError({
            type: SystemErrorType.SCORING_FAILURE,
            severity: ErrorSeverity.HIGH,
            source: 'scoring',
            message: `Failed to calculate scores for analysis ${analysisId}: ${error.message}`,
            error,
            context: { ...context, analysisId },
        });
    }

    /**
     * Capture an intel generation failure
     */
    async captureIntelGenerationFailure(
        analysisId: string,
        error: Error,
        context: Record<string, unknown> = {}
    ): Promise<SystemErrorRecord> {
        return this.captureError({
            type: SystemErrorType.INTEL_GENERATION,
            severity: ErrorSeverity.CRITICAL,
            source: 'intel-generation',
            message: `Failed to generate intelligence report for analysis ${analysisId}: ${error.message}`,
            error,
            context: { ...context, analysisId },
        });
    }

    /**
     * Get all errors with optional filtering
     */
    async getErrors(options: {
        status?: ErrorStatus;
        type?: SystemErrorType;
        severity?: ErrorSeverity;
        page?: number;
        limit?: number;
    } = {}): Promise<{ errors: SystemErrorRecord[]; total: number }> {
        const { status, type, severity, page = 1, limit = 20 } = options;

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (type) where.type = type;
        if (severity) where.severity = severity;

        const [errors, total] = await Promise.all([
            this.prisma.systemError.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.systemError.count({ where }),
        ]);

        return { errors, total };
    }

    /**
     * Get count of unread (NEW) errors
     */
    async getUnreadCount(): Promise<number> {
        return this.prisma.systemError.count({
            where: { status: ErrorStatus.NEW },
        });
    }

    /**
     * Get error statistics
     */
    async getErrorStats(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
        last24Hours: number;
    }> {
        const [total, last24Hours, statusCounts, severityCounts, typeCounts] = await Promise.all([
            this.prisma.systemError.count(),
            this.prisma.systemError.count({
                where: {
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.systemError.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.systemError.groupBy({
                by: ['severity'],
                _count: true,
            }),
            this.prisma.systemError.groupBy({
                by: ['type'],
                _count: true,
            }),
        ]);

        const byStatus: Record<string, number> = {};
        statusCounts.forEach((s) => { byStatus[s.status] = s._count; });

        const bySeverity: Record<string, number> = {};
        severityCounts.forEach((s) => { bySeverity[s.severity] = s._count; });

        const byType: Record<string, number> = {};
        typeCounts.forEach((t) => { byType[t.type] = t._count; });

        return { total, byStatus, bySeverity, byType, last24Hours };
    }

    /**
     * Acknowledge an error
     */
    async acknowledgeError(errorId: string, userId: string): Promise<SystemErrorRecord> {
        return this.prisma.systemError.update({
            where: { id: errorId },
            data: {
                status: ErrorStatus.ACKNOWLEDGED,
                acknowledgedBy: userId,
                acknowledgedAt: new Date(),
            },
        });
    }

    /**
     * Mark error as in progress
     */
    async markInProgress(errorId: string, userId: string): Promise<SystemErrorRecord> {
        return this.prisma.systemError.update({
            where: { id: errorId },
            data: {
                status: ErrorStatus.IN_PROGRESS,
                acknowledgedBy: userId,
                acknowledgedAt: new Date(),
            },
        });
    }

    /**
     * Resolve an error
     */
    async resolveError(errorId: string, userId: string, resolution?: string): Promise<SystemErrorRecord> {
        return this.prisma.systemError.update({
            where: { id: errorId },
            data: {
                status: ErrorStatus.RESOLVED,
                resolvedBy: userId,
                resolvedAt: new Date(),
                resolution,
            },
        });
    }

    /**
     * Ignore an error
     */
    async ignoreError(errorId: string, userId: string, reason?: string): Promise<SystemErrorRecord> {
        return this.prisma.systemError.update({
            where: { id: errorId },
            data: {
                status: ErrorStatus.IGNORED,
                resolvedBy: userId,
                resolvedAt: new Date(),
                resolution: reason || 'Ignored by admin',
            },
        });
    }

    /**
     * Get a single error by ID
     */
    async getError(errorId: string): Promise<SystemErrorRecord | null> {
        return this.prisma.systemError.findUnique({
            where: { id: errorId },
        });
    }
}
