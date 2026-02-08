/**
 * AEO.LIVE Backend Logger
 * 
 * Production-grade logging for NestJS with:
 * - Structured JSON logging
 * - Request/Response correlation
 * - Performance metrics
 * - Error tracking
 * - Sensitive data redaction
 * - Log levels and categories
 * - File rotation support
 */

import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { Request, Response } from 'express';

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogContext {
    [key: string]: unknown;
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: string;
    message: string;
    correlationId?: string;
    requestId?: string;
    userId?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    duration?: number;
    context?: LogContext;
    stack?: string;
    memory?: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
    };
}

export interface RequestContext {
    correlationId: string;
    requestId: string;
    userId?: string;
    startTime: number;
    method: string;
    path: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    FATAL: 5,
};

const LOG_LEVEL_EMOJI: Record<LogLevel, string> = {
    TRACE: '🔍',
    DEBUG: '🐛',
    INFO: 'ℹ️',
    WARN: '⚠️',
    ERROR: '❌',
    FATAL: '💀',
};

// Patterns for sensitive data to redact
const REDACT_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /apiKey/i,
    /api_key/i,
    /authorization/i,
    /credit.?card/i,
    /ssn/i,
    /cvv/i,
];

// ============================================================================
// ASYNC LOCAL STORAGE FOR REQUEST CONTEXT
// ============================================================================

import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
    return asyncLocalStorage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
    return asyncLocalStorage.getStore();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getTimestamp(): string {
    return new Date().toISOString();
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function redactSensitiveData(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => redactSensitiveData(item));
    }

    if (typeof obj === 'object') {
        const redacted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            const shouldRedact = REDACT_PATTERNS.some(pattern => pattern.test(key));
            if (shouldRedact) {
                redacted[key] = '[REDACTED]';
            } else if (typeof value === 'object') {
                redacted[key] = redactSensitiveData(value);
            } else {
                redacted[key] = value;
            }
        }
        return redacted;
    }

    return obj;
}

function getMemoryUsage(): LogEntry['memory'] {
    const mem = process.memoryUsage();
    return {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
    };
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
    private category: string;
    private level: LogLevel;
    private isPretty: boolean;
    private startTimes: Map<string, number> = new Map();

    constructor() {
        this.category = 'app';
        this.level = (process.env.LOG_LEVEL as LogLevel) || 'INFO';
        this.isPretty = process.env.NODE_ENV !== 'production';
    }

    /**
     * Set the logger category
     */
    setCategory(category: string): this {
        this.category = category;
        return this;
    }

    /**
     * Create a child logger with a specific category
     */
    child(category: string): AppLogger {
        const child = new AppLogger();
        child.category = `${this.category}:${category}`;
        child.level = this.level;
        child.isPretty = this.isPretty;
        return child;
    }

    /**
     * Check if a log level should be logged
     */
    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.level];
    }

    /**
     * Create a log entry
     */
    private createEntry(
        level: LogLevel,
        message: string,
        context?: LogContext,
        error?: Error
    ): LogEntry {
        const reqCtx = getRequestContext();

        const entry: LogEntry = {
            timestamp: getTimestamp(),
            level,
            category: this.category,
            message,
        };

        if (reqCtx) {
            entry.correlationId = reqCtx.correlationId;
            entry.requestId = reqCtx.requestId;
            entry.userId = reqCtx.userId;
            entry.method = reqCtx.method;
            entry.path = reqCtx.path;
        }

        if (context) {
            entry.context = redactSensitiveData(context) as LogContext;
        }

        if (error) {
            entry.stack = error.stack;
            entry.message = `${message}: ${error.message}`;
        }

        return entry;
    }

    /**
     * Output log
     */
    private output(entry: LogEntry): void {
        if (this.isPretty) {
            const emoji = LOG_LEVEL_EMOJI[entry.level];
            const timestamp = new Date(entry.timestamp).toLocaleTimeString();
            const prefix = `${emoji} [${timestamp}] [${entry.level.padEnd(5)}] [${entry.category}]`;
            const requestInfo = entry.requestId ? `[${entry.method} ${entry.path}]` : '';
            const durationInfo = entry.duration ? `(${formatDuration(entry.duration)})` : '';

            const fullMessage = [prefix, requestInfo, entry.message, durationInfo]
                .filter(Boolean)
                .join(' ');

            if (entry.level === 'ERROR' || entry.level === 'FATAL') {
                console.error(fullMessage);
                if (entry.context) console.error('  Context:', entry.context);
                if (entry.stack) console.error('  Stack:', entry.stack);
            } else if (entry.level === 'WARN') {
                console.warn(fullMessage);
                if (entry.context) console.warn('  Context:', entry.context);
            } else {
                console.log(fullMessage);
                if (entry.context && entry.level === 'DEBUG') {
                    console.log('  Context:', entry.context);
                }
            }
        } else {
            // Structured JSON for production
            console.log(JSON.stringify(entry));
        }
    }

    /**
     * Core logging method
     */
    private logInternal(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
        if (!this.shouldLog(level)) return;
        const entry = this.createEntry(level, message, context, error);
        this.output(entry);
    }

    // ========================================================================
    // STANDARD LOGGER SERVICE METHODS (NestJS compatibility)
    // ========================================================================

    log(message: string, context?: string | LogContext): void {
        if (typeof context === 'string') {
            this.category = context;
            this.logInternal('INFO', message);
        } else {
            this.logInternal('INFO', message, context);
        }
    }

    error(message: string, trace?: string, context?: string): void {
        if (context) this.category = context;
        const entry = this.createEntry('ERROR', message);
        if (trace) entry.stack = trace;
        this.output(entry);
    }

    warn(message: string, context?: string | LogContext): void {
        if (typeof context === 'string') {
            this.category = context;
            this.logInternal('WARN', message);
        } else {
            this.logInternal('WARN', message, context);
        }
    }

    debug(message: string, context?: string | LogContext): void {
        if (typeof context === 'string') {
            this.category = context;
            this.logInternal('DEBUG', message);
        } else {
            this.logInternal('DEBUG', message, context);
        }
    }

    verbose(message: string, context?: string | LogContext): void {
        if (typeof context === 'string') {
            this.category = context;
            this.logInternal('TRACE', message);
        } else {
            this.logInternal('TRACE', message, context);
        }
    }

    // ========================================================================
    // EXTENDED LOGGING METHODS
    // ========================================================================

    trace(message: string, context?: LogContext): void {
        this.logInternal('TRACE', message, context);
    }

    info(message: string, context?: LogContext): void {
        this.logInternal('INFO', message, context);
    }

    errorWithException(message: string, error: Error, context?: LogContext): void {
        this.logInternal('ERROR', message, context, error);
    }

    fatal(message: string, error?: Error, context?: LogContext): void {
        this.logInternal('FATAL', message, context, error);
    }

    // ========================================================================
    // TIMING METHODS
    // ========================================================================

    time(label: string): void {
        this.startTimes.set(label, performance.now());
        this.trace(`Timer started: ${label}`);
    }

    timeEnd(label: string, context?: LogContext): number {
        const startTime = this.startTimes.get(label);
        if (!startTime) {
            this.warn(`Timer "${label}" does not exist`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.startTimes.delete(label);

        const entry = this.createEntry('INFO', `Timer ${label} completed`, context);
        entry.duration = duration;
        this.output(entry);

        return duration;
    }

    // ========================================================================
    // REQUEST/RESPONSE LOGGING
    // ========================================================================

    logRequest(req: Request): void {
        const entry = this.createEntry('INFO', `→ ${req.method} ${req.path}`, {
            type: 'request',
            query: req.query,
            body: req.body,
            headers: {
                'user-agent': req.headers['user-agent'],
                'content-type': req.headers['content-type'],
            },
        });
        this.output(entry);
    }

    logResponse(req: Request, res: Response, duration: number): void {
        const statusCode = res.statusCode;
        const level: LogLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

        const entry = this.createEntry(level, `← ${req.method} ${req.path} [${statusCode}]`, {
            type: 'response',
            statusCode,
        });
        entry.duration = duration;
        entry.statusCode = statusCode;
        this.output(entry);
    }

    // ========================================================================
    // SPECIALIZED LOGGING
    // ========================================================================

    database(operation: string, table: string, duration?: number, context?: LogContext): void {
        const entry = this.createEntry('DEBUG', `DB: ${operation} on ${table}`, {
            type: 'database',
            operation,
            table,
            ...context,
        });
        if (duration) entry.duration = duration;
        this.output(entry);
    }

    external(service: string, operation: string, duration?: number, context?: LogContext): void {
        const entry = this.createEntry('INFO', `External: ${service}.${operation}`, {
            type: 'external',
            service,
            operation,
            ...context,
        });
        if (duration) entry.duration = duration;
        this.output(entry);
    }

    security(event: string, context?: LogContext): void {
        this.logInternal('WARN', `Security: ${event}`, {
            type: 'security',
            event,
            ...context,
        });
    }

    audit(action: string, context?: LogContext): void {
        this.logInternal('INFO', `Audit: ${action}`, {
            type: 'audit',
            action,
            ...context,
        });
    }

    performance(metric: string, value: number, unit: string, context?: LogContext): void {
        this.logInternal('INFO', `Perf: ${metric} = ${value}${unit}`, {
            type: 'performance',
            metric,
            value,
            unit,
            ...context,
        });
    }

    memory(): void {
        const mem = getMemoryUsage();
        this.info(`Memory: ${mem.heapUsed}MB / ${mem.heapTotal}MB heap, ${mem.rss}MB RSS`, {
            type: 'memory',
            ...mem,
        });
    }
}

// ============================================================================
// MIDDLEWARE FOR REQUEST CONTEXT
// ============================================================================

import { Injectable as InjectableMiddleware, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';

@InjectableMiddleware()
export class LoggingMiddleware implements NestMiddleware {
    private logger = new AppLogger().setCategory('http');

    use(req: Request, res: Response, next: NextFunction): void {
        const correlationId = (req.headers['x-correlation-id'] as string) || generateId();
        const requestId = generateId();
        const startTime = performance.now();

        // Set correlation ID in response headers
        res.setHeader('x-correlation-id', correlationId);
        res.setHeader('x-request-id', requestId);

        const context: RequestContext = {
            correlationId,
            requestId,
            userId: (req as unknown as { user?: { id: string } }).user?.id,
            startTime,
            method: req.method,
            path: req.path,
        };

        // Log request
        runWithContext(context, () => {
            this.logger.logRequest(req);
        });

        // Log response on finish
        res.on('finish', () => {
            const duration = performance.now() - startTime;
            runWithContext(context, () => {
                this.logger.logResponse(req, res, duration);
            });
        });

        // Continue with context
        runWithContext(context, () => next());
    }
}

// ============================================================================
// EXCEPTION FILTER WITH LOGGING
// ============================================================================

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
    private logger = new AppLogger().setCategory('exception');

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let stack: string | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as { message?: string }).message || exception.message;
            stack = exception.stack;
        } else if (exception instanceof Error) {
            message = exception.message;
            stack = exception.stack;
        }

        // Log the exception
        if (status >= 500) {
            this.logger.fatal(`Unhandled exception: ${message}`, exception instanceof Error ? exception : undefined, {
                statusCode: status,
                path: request.path,
                method: request.method,
            });
        } else {
            this.logger.warn(`HTTP Exception: ${message}`, {
                statusCode: status,
                path: request.path,
                method: request.method,
            });
        }

        // Send response
        (response as unknown as { status: (code: number) => { json: (body: unknown) => void } })
            .status(status)
            .json({
                success: false,
                error: {
                    code: status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
                    message,
                    ...(process.env.NODE_ENV !== 'production' && stack ? { stack } : {}),
                },
                timestamp: new Date().toISOString(),
                path: request.path,
            });
    }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const logger = new AppLogger().setCategory('aeo');
export const apiLogger = logger.child('api');
export const authLogger = logger.child('auth');
export const analysisLogger = logger.child('analysis');
export const billingLogger = logger.child('billing');
export const dbLogger = logger.child('database');

export default logger;
