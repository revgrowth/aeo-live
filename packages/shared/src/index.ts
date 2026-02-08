// =============================================================================
// AEO.LIVE Shared Package - All Types & Constants
// =============================================================================

// -----------------------------------------------------------------------------
// Plan & Pricing Types
// -----------------------------------------------------------------------------

export const PlanType = {
    STARTER: 'STARTER',
    GROWTH: 'GROWTH',
    SCALE: 'SCALE',
    SCALE_PLUS: 'SCALE_PLUS',
} as const;
export type PlanType = typeof PlanType[keyof typeof PlanType];

export type MonitoringFrequency = 'MONTHLY' | 'WEEKLY' | 'TWICE_WEEKLY';

export interface PlanConfig {
    name: string;
    oneTimePrice: number;
    monthlyPrice: number;
    maxCompetitors: number;
    monitoringFrequency: MonitoringFrequency;
    rateLimit: {
        requestsPerMinute: number;
        requestsPerDay: number;
    };
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
    [PlanType.STARTER]: {
        name: 'Starter',
        oneTimePrice: 4900,
        monthlyPrice: 3900,
        maxCompetitors: 1,
        monitoringFrequency: 'MONTHLY',
        rateLimit: { requestsPerMinute: 60, requestsPerDay: 1000 },
    },
    [PlanType.GROWTH]: {
        name: 'Growth',
        oneTimePrice: 12900,
        monthlyPrice: 9900,
        maxCompetitors: 3,
        monitoringFrequency: 'WEEKLY',
        rateLimit: { requestsPerMinute: 120, requestsPerDay: 5000 },
    },
    [PlanType.SCALE]: {
        name: 'Scale',
        oneTimePrice: 34900,
        monthlyPrice: 27900,
        maxCompetitors: 10,
        monitoringFrequency: 'WEEKLY',
        rateLimit: { requestsPerMinute: 300, requestsPerDay: 20000 },
    },
    [PlanType.SCALE_PLUS]: {
        name: 'Scale+',
        oneTimePrice: 109900,
        monthlyPrice: 87900,
        maxCompetitors: 20,
        monitoringFrequency: 'TWICE_WEEKLY',
        rateLimit: { requestsPerMinute: 600, requestsPerDay: 100000 },
    },
};

// -----------------------------------------------------------------------------
// Audit Types
// -----------------------------------------------------------------------------

export const AuditStatus = {
    PENDING: 'PENDING',
    CRAWLING: 'CRAWLING',
    ANALYZING: 'ANALYZING',
    COMPLETE: 'COMPLETE',
    FAILED: 'FAILED',
} as const;
export type AuditStatus = typeof AuditStatus[keyof typeof AuditStatus];

export const AuditType = {
    FULL: 'FULL',
    MONITORING: 'MONITORING',
    ADDON: 'ADDON',
} as const;
export type AuditType = typeof AuditType[keyof typeof AuditType];

export const TriggerType = {
    MANUAL: 'MANUAL',
    SCHEDULED: 'SCHEDULED',
    API: 'API',
} as const;
export type TriggerType = typeof TriggerType[keyof typeof TriggerType];

// -----------------------------------------------------------------------------
// Score Types
// -----------------------------------------------------------------------------

export const ScoreCategory = {
    TECHNICAL_SEO: 'technicalSeo',
    ONPAGE_SEO: 'onpageSeo',
    CONTENT_QUALITY: 'contentQuality',
    AEO_READINESS: 'aeoReadiness',
    BRAND_VOICE: 'brandVoice',
    UX_ENGAGEMENT: 'uxEngagement',
    INTERNAL_STRUCTURE: 'internalStructure',
} as const;
export type ScoreCategory = typeof ScoreCategory[keyof typeof ScoreCategory];

export interface ScoreBreakdown {
    technicalSeo: number;
    onpageSeo: number;
    contentQuality: number;
    aeoReadiness: number;
    brandVoice: number;
    uxEngagement: number;
    internalStructure: number;
}

// -----------------------------------------------------------------------------
// User & Auth Types
// -----------------------------------------------------------------------------

export const UserRole = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: UserRole;
    organizationId: string | null;
    emailVerified: boolean;
    plan?: PlanType | 'FREE' | 'PRO' | 'ENTERPRISE';
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ApiMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface ApiMeta {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
}

// -----------------------------------------------------------------------------
// Alert & Report Types
// -----------------------------------------------------------------------------

export const AlertType = {
    SCORE_CHANGE: 'SCORE_CHANGE',
    RANK_CHANGE: 'RANK_CHANGE',
    COMPETITOR_ACTIVITY: 'COMPETITOR_ACTIVITY',
} as const;
export type AlertType = typeof AlertType[keyof typeof AlertType];

export const AlertSeverity = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
} as const;
export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity];

export const ReportType = {
    FULL: 'FULL',
    EXECUTIVE: 'EXECUTIVE',
    COMPARISON: 'COMPARISON',
} as const;
export type ReportType = typeof ReportType[keyof typeof ReportType];

export const ReportStatus = {
    GENERATING: 'GENERATING',
    READY: 'READY',
    FAILED: 'FAILED',
} as const;
export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const JWT_ACCESS_EXPIRATION_DEFAULT = '15m';
export const JWT_REFRESH_EXPIRATION_DEFAULT = '7d';

export const RATE_LIMIT_TTL_DEFAULT = 60;
export const RATE_LIMIT_MAX_DEFAULT = 100;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const MAX_PAGES_PER_AUDIT = {
    STARTER: 100,
    GROWTH: 500,
    SCALE: 1000,
    SCALE_PLUS: 5000,
};

export const MAX_CRAWL_DEPTH = {
    STARTER: 3,
    GROWTH: 5,
    SCALE: 10,
    SCALE_PLUS: 15,
};

export const SCORE_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 70,
    FAIR: 50,
    POOR: 30,
};

// v3.0 Category Weights (must sum to 1.0)
export const CATEGORY_WEIGHTS: Record<ScoreCategory, number> = {
    [ScoreCategory.TECHNICAL_SEO]: 0.12,
    [ScoreCategory.ONPAGE_SEO]: 0.12,
    [ScoreCategory.CONTENT_QUALITY]: 0.22, // Highest - most important for SEO + AEO
    [ScoreCategory.AEO_READINESS]: 0.18,
    [ScoreCategory.BRAND_VOICE]: 0.12,
    [ScoreCategory.UX_ENGAGEMENT]: 0.10,
    [ScoreCategory.INTERNAL_STRUCTURE]: 0.14,
};

// Legacy alias for backward compatibility
export const SCORE_WEIGHTS = CATEGORY_WEIGHTS;

// v3.0 Subcategory Weights per Category
export const SUBCATEGORY_WEIGHTS = {
    technicalSeo: {
        pageSpeed: 0.25,
        mobileUsability: 0.25,
        security: 0.15,
        crawlability: 0.20,
        coreWebVitals: 0.15,
    },
    onpageSeo: {
        titleTagOptimization: 0.25,
        metaDescriptionQuality: 0.15,
        headerStructure: 0.20,
        imageOptimization: 0.15,
        urlStructure: 0.25,
    },
    contentQuality: {
        eeatSignals: 0.25,
        contentDepth: 0.20,
        answerCompleteness: 0.20,
        contentFreshness: 0.15,
        citationWorthiness: 0.20,
    },
    aeoReadiness: {
        platformPresence: 0.30,
        schemaForAI: 0.25,
        contentStructureForLLMs: 0.25,
        brandSearchVolume: 0.20,
    },
    brandVoice: {
        voiceDistinctiveness: 0.25,
        vocabularyUniqueness: 0.20,
        toneConsistency: 0.20,
        authenticitySignals: 0.20,
        competitiveDifferentiation: 0.15,
    },
    uxEngagement: {
        aboveFoldEffectiveness: 0.25,
        trustSignals: 0.25,
        conversionPathClarity: 0.20,
        mobileExperience: 0.15,
        contentScannability: 0.15,
    },
    internalStructure: {
        siteArchitecture: 0.25,
        internalLinkingQuality: 0.30,
        siloOrganization: 0.25,
        orphanedPageIssues: 0.20,
    },
} as const;

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
