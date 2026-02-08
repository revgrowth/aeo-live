/**
 * AEO.LIVE World-Class Logging System
 * 
 * A comprehensive, production-grade logging system with:
 * - Structured JSON logging
 * - Log levels (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
 * - Request/Response correlation IDs
 * - Performance timing
 * - Stack traces for errors
 * - Context enrichment
 * - Log categories/namespaces
 * - Sensitive data redaction
 * - Browser console formatting
 * - Server-side file logging support
 */

// ============================================================================
// TYPES & INTERFACES
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
    userId?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number;
    context?: LogContext;
    stack?: string;
    browser?: {
        userAgent: string;
        url: string;
        referrer: string;
    };
    performance?: {
        heapUsed?: number;
        heapTotal?: number;
        loadTime?: number;
    };
}

export interface LoggerConfig {
    level: LogLevel;
    category: string;
    enableConsole: boolean;
    enableRemote: boolean;
    remoteEndpoint?: string;
    redactPatterns?: RegExp[];
    prettyPrint?: boolean;
    includePerformance?: boolean;
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

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
    TRACE: '#9CA3AF',   // gray
    DEBUG: '#60A5FA',   // blue
    INFO: '#34D399',    // green
    WARN: '#FBBF24',    // yellow
    ERROR: '#F87171',   // red
    FATAL: '#EF4444',   // bright red
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
const DEFAULT_REDACT_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /apiKey/i,
    /api_key/i,
    /authorization/i,
    /credit.?card/i,
    /ssn/i,
    /social.?security/i,
];

// ============================================================================
// CORRELATION ID MANAGEMENT
// ============================================================================

let globalCorrelationId: string | null = null;
let globalUserId: string | null = null;
let globalSessionId: string | null = null;

export function setCorrelationId(id: string): void {
    globalCorrelationId = id;
}

export function getCorrelationId(): string | null {
    return globalCorrelationId;
}

export function setUserId(id: string | null): void {
    globalUserId = id;
}

export function setSessionId(id: string | null): void {
    globalSessionId = id;
}

export function generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

function getTimestamp(): string {
    return new Date().toISOString();
}

function redactSensitiveData(obj: unknown, patterns: RegExp[]): unknown {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => redactSensitiveData(item, patterns));
    }

    if (typeof obj === 'object') {
        const redacted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            const shouldRedact = patterns.some(pattern => pattern.test(key));
            if (shouldRedact) {
                redacted[key] = '[REDACTED]';
            } else if (typeof value === 'object') {
                redacted[key] = redactSensitiveData(value, patterns);
            } else {
                redacted[key] = value;
            }
        }
        return redacted;
    }

    return obj;
}

function getBrowserInfo(): LogEntry['browser'] | undefined {
    if (!isBrowser()) return undefined;

    return {
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
    };
}

function getPerformanceInfo(): LogEntry['performance'] | undefined {
    if (!isBrowser()) {
        // Node.js performance
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const mem = process.memoryUsage();
            return {
                heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
                heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
            };
        }
        return undefined;
    }

    // Browser performance
    const perf: LogEntry['performance'] = {};

    // Chrome-specific memory API (not available in all browsers)
    const perfWithMemory = performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number }
    };
    if (perfWithMemory.memory) {
        perf.heapUsed = Math.round(perfWithMemory.memory.usedJSHeapSize / 1024 / 1024);
        perf.heapTotal = Math.round(perfWithMemory.memory.totalJSHeapSize / 1024 / 1024);
    }

    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navTiming) {
        perf.loadTime = Math.round(navTiming.loadEventEnd - navTiming.startTime);
    }

    return Object.keys(perf).length > 0 ? perf : undefined;
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
    private config: LoggerConfig;
    private startTimes: Map<string, number> = new Map();
    private logBuffer: LogEntry[] = [];
    private flushTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            level: (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'INFO',
            category: 'app',
            enableConsole: true,
            enableRemote: false,
            remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
            redactPatterns: DEFAULT_REDACT_PATTERNS,
            prettyPrint: process.env.NODE_ENV !== 'production',
            includePerformance: false,
            ...config,
        };
    }

    /**
     * Create a child logger with a specific category
     */
    child(category: string): Logger {
        return new Logger({
            ...this.config,
            category: `${this.config.category}:${category}`,
        });
    }

    /**
     * Check if a log level should be logged
     */
    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
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
        const entry: LogEntry = {
            timestamp: getTimestamp(),
            level,
            category: this.config.category,
            message,
            correlationId: globalCorrelationId || undefined,
            userId: globalUserId || undefined,
            sessionId: globalSessionId || undefined,
        };

        if (context) {
            entry.context = this.config.redactPatterns
                ? redactSensitiveData(context, this.config.redactPatterns) as LogContext
                : context;
        }

        if (error) {
            entry.stack = error.stack;
            entry.message = `${message}: ${error.message}`;
        }

        if (isBrowser()) {
            entry.browser = getBrowserInfo();
        }

        if (this.config.includePerformance) {
            entry.performance = getPerformanceInfo();
        }

        return entry;
    }

    /**
     * Output log to console with beautiful formatting
     */
    private consoleOutput(entry: LogEntry): void {
        if (!this.config.enableConsole) return;

        const color = LOG_LEVEL_COLORS[entry.level];
        const emoji = LOG_LEVEL_EMOJI[entry.level];

        if (isBrowser()) {
            // Browser console with colors
            const styles = [
                `color: ${color}`,
                'font-weight: bold',
            ].join(';');

            const headerStyle = 'color: #6B7280; font-size: 10px;';
            const messageStyle = `color: ${color}; font-weight: 500;`;

            console.groupCollapsed(
                `%c${emoji} [${entry.level}] %c${entry.category} %c${entry.message}`,
                styles,
                'color: #9CA3AF; font-weight: normal;',
                messageStyle
            );

            console.log('%cTimestamp:', headerStyle, entry.timestamp);
            if (entry.correlationId) console.log('%cCorrelation ID:', headerStyle, entry.correlationId);
            if (entry.userId) console.log('%cUser ID:', headerStyle, entry.userId);
            if (entry.duration) console.log('%cDuration:', headerStyle, formatDuration(entry.duration));
            if (entry.context) console.log('%cContext:', headerStyle, entry.context);
            if (entry.stack) console.log('%cStack:', headerStyle, entry.stack);
            if (entry.performance) console.log('%cPerformance:', headerStyle, entry.performance);

            console.groupEnd();
        } else {
            // Server-side logging (structured JSON in production, pretty in dev)
            if (this.config.prettyPrint) {
                const timestamp = new Date(entry.timestamp).toLocaleTimeString();
                const prefix = `${emoji} [${timestamp}] [${entry.level.padEnd(5)}] [${entry.category}]`;

                if (entry.level === 'ERROR' || entry.level === 'FATAL') {
                    console.error(prefix, entry.message, entry.context || '', entry.stack || '');
                } else if (entry.level === 'WARN') {
                    console.warn(prefix, entry.message, entry.context || '');
                } else {
                    console.log(prefix, entry.message, entry.context || '');
                }
            } else {
                // Structured JSON for production
                console.log(JSON.stringify(entry));
            }
        }
    }

    /**
     * Send logs to remote endpoint (batched)
     */
    private async sendToRemote(entry: LogEntry): Promise<void> {
        if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

        this.logBuffer.push(entry);

        // Flush immediately for errors, otherwise batch
        if (entry.level === 'ERROR' || entry.level === 'FATAL') {
            await this.flush();
        } else if (!this.flushTimer) {
            this.flushTimer = setTimeout(() => this.flush(), 5000);
        }
    }

    /**
     * Flush buffered logs to remote
     */
    async flush(): Promise<void> {
        if (this.logBuffer.length === 0) return;
        if (!this.config.remoteEndpoint) return;

        const logs = [...this.logBuffer];
        this.logBuffer = [];

        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }

        try {
            await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logs }),
            });
        } catch {
            // Re-add to buffer if failed
            this.logBuffer.unshift(...logs);
        }
    }

    /**
     * Core logging method
     */
    private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
        if (!this.shouldLog(level)) return;

        const entry = this.createEntry(level, message, context, error);
        this.consoleOutput(entry);
        this.sendToRemote(entry);
    }

    // ========================================================================
    // PUBLIC LOGGING METHODS
    // ========================================================================

    trace(message: string, context?: LogContext): void {
        this.log('TRACE', message, context);
    }

    debug(message: string, context?: LogContext): void {
        this.log('DEBUG', message, context);
    }

    info(message: string, context?: LogContext): void {
        this.log('INFO', message, context);
    }

    warn(message: string, context?: LogContext): void {
        this.log('WARN', message, context);
    }

    error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
        if (errorOrContext instanceof Error) {
            this.log('ERROR', message, context, errorOrContext);
        } else {
            this.log('ERROR', message, errorOrContext);
        }
    }

    fatal(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
        if (errorOrContext instanceof Error) {
            this.log('FATAL', message, context, errorOrContext);
        } else {
            this.log('FATAL', message, errorOrContext);
        }
    }

    // ========================================================================
    // TIMING METHODS
    // ========================================================================

    /**
     * Start a timer for performance measurement
     */
    time(label: string): void {
        this.startTimes.set(label, performance.now());
        this.trace(`Timer started: ${label}`);
    }

    /**
     * End a timer and log the duration
     */
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
        this.consoleOutput(entry);
        this.sendToRemote(entry);

        return duration;
    }

    // ========================================================================
    // SPECIALIZED LOGGING METHODS
    // ========================================================================

    /**
     * Log an API request
     */
    request(method: string, url: string, context?: LogContext): void {
        this.info(`→ ${method} ${url}`, { type: 'request', method, url, ...context });
    }

    /**
     * Log an API response
     */
    response(method: string, url: string, status: number, duration: number, context?: LogContext): void {
        const level: LogLevel = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
        const entry = this.createEntry(level, `← ${method} ${url} [${status}]`, {
            type: 'response',
            method,
            url,
            status,
            ...context
        });
        entry.duration = duration;
        this.consoleOutput(entry);
        this.sendToRemote(entry);
    }

    /**
     * Log a user action
     */
    action(name: string, context?: LogContext): void {
        this.info(`User action: ${name}`, { type: 'action', action: name, ...context });
    }

    /**
     * Log a navigation event
     */
    navigate(from: string, to: string, context?: LogContext): void {
        this.info(`Navigate: ${from} → ${to}`, { type: 'navigation', from, to, ...context });
    }

    /**
     * Log a state change
     */
    stateChange(component: string, oldValue: unknown, newValue: unknown): void {
        this.debug(`State change in ${component}`, {
            type: 'stateChange',
            component,
            oldValue,
            newValue
        });
    }

    /**
     * Log a component lifecycle event
     */
    lifecycle(component: string, event: 'mount' | 'unmount' | 'update', context?: LogContext): void {
        this.trace(`${component} ${event}`, { type: 'lifecycle', component, event, ...context });
    }

    /**
     * Log an analytics event
     */
    analytics(event: string, properties?: LogContext): void {
        this.info(`Analytics: ${event}`, { type: 'analytics', event, ...properties });
    }

    /**
     * Create a scoped logger for a specific operation
     */
    scope(operationName: string): ScopedLogger {
        return new ScopedLogger(this, operationName);
    }
}

// ============================================================================
// SCOPED LOGGER FOR OPERATION TRACKING
// ============================================================================

class ScopedLogger {
    private logger: Logger;
    private operationName: string;
    private startTime: number;
    private steps: { name: string; duration: number }[] = [];

    constructor(logger: Logger, operationName: string) {
        this.logger = logger;
        this.operationName = operationName;
        this.startTime = performance.now();
        this.logger.info(`Starting: ${operationName}`, { type: 'scopeStart' });
    }

    step(name: string): void {
        const now = performance.now();
        const duration = this.steps.length > 0
            ? now - this.startTime - this.steps.reduce((a, b) => a + b.duration, 0)
            : now - this.startTime;

        this.steps.push({ name, duration });
        this.logger.debug(`${this.operationName} → ${name}`, {
            type: 'scopeStep',
            step: name,
            duration: Math.round(duration)
        });
    }

    success(context?: LogContext): void {
        const totalDuration = performance.now() - this.startTime;
        this.logger.info(`Completed: ${this.operationName}`, {
            type: 'scopeEnd',
            success: true,
            totalDuration: Math.round(totalDuration),
            steps: this.steps,
            ...context,
        });
    }

    failure(error: Error, context?: LogContext): void {
        const totalDuration = performance.now() - this.startTime;
        this.logger.error(`Failed: ${this.operationName}`, error, {
            type: 'scopeEnd',
            success: false,
            totalDuration: Math.round(totalDuration),
            steps: this.steps,
            ...context,
        });
    }
}

// ============================================================================
// SINGLETON LOGGER INSTANCE
// ============================================================================

export const logger = new Logger({ category: 'aeo' });

// Create specialized loggers for different parts of the app
export const apiLogger = logger.child('api');
export const authLogger = logger.child('auth');
export const analysisLogger = logger.child('analysis');
export const billingLogger = logger.child('billing');
export const uiLogger = logger.child('ui');

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

if (typeof window !== 'undefined') {
    // Browser: Catch unhandled errors
    window.addEventListener('error', (event) => {
        logger.fatal('Unhandled error', new Error(event.message), {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
        });
    });

    // Browser: Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        logger.fatal('Unhandled promise rejection', event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    });
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useEffect, useRef } from 'react';

/**
 * Hook to log component lifecycle
 */
export function useLogLifecycle(componentName: string): void {
    const renderCount = useRef(0);

    useEffect(() => {
        uiLogger.lifecycle(componentName, 'mount');
        return () => {
            uiLogger.lifecycle(componentName, 'unmount', { renderCount: renderCount.current });
        };
    }, [componentName]);

    useEffect(() => {
        renderCount.current++;
        if (renderCount.current > 1) {
            uiLogger.lifecycle(componentName, 'update', { renderCount: renderCount.current });
        }
    });
}

/**
 * Hook to log state changes
 */
export function useLogState<T>(componentName: string, stateName: string, value: T): void {
    const prevValue = useRef<T>(value);

    useEffect(() => {
        if (prevValue.current !== value) {
            uiLogger.stateChange(`${componentName}.${stateName}`, prevValue.current, value);
            prevValue.current = value;
        }
    }, [componentName, stateName, value]);
}

/**
 * Hook to create a scoped operation logger
 */
export function useOperation(operationName: string): () => ScopedLogger {
    const loggerRef = useRef(logger);
    return () => loggerRef.current.scope(operationName);
}

export { Logger, ScopedLogger };
export default logger;
