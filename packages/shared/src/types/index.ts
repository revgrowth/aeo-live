// =============================================================================
// AEO.LIVE Shared Types
// =============================================================================
// These types are shared between frontend and backend applications
// =============================================================================

// -----------------------------------------------------------------------------
// Plan & Pricing Types
// -----------------------------------------------------------------------------

export enum PlanType {
    STARTER = 'STARTER',
    GROWTH = 'GROWTH',
    SCALE = 'SCALE',
    SCALE_PLUS = 'SCALE_PLUS',
}

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
        oneTimePrice: 4900, // cents
        monthlyPrice: 3900,
        maxCompetitors: 1,
        monitoringFrequency: 'MONTHLY' as MonitoringFrequency,
        rateLimit: {
            requestsPerMinute: 60,
            requestsPerDay: 1000,
        },
    },
    [PlanType.GROWTH]: {
        name: 'Growth',
        oneTimePrice: 12900,
        monthlyPrice: 9900,
        maxCompetitors: 3,
        monitoringFrequency: 'WEEKLY' as MonitoringFrequency,
        rateLimit: {
            requestsPerMinute: 120,
            requestsPerDay: 5000,
        },
    },
    [PlanType.SCALE]: {
        name: 'Scale',
        oneTimePrice: 34900,
        monthlyPrice: 27900,
        maxCompetitors: 10,
        monitoringFrequency: 'WEEKLY' as MonitoringFrequency,
        rateLimit: {
            requestsPerMinute: 300,
            requestsPerDay: 20000,
        },
    },
    [PlanType.SCALE_PLUS]: {
        name: 'Scale+',
        oneTimePrice: 109900,
        monthlyPrice: 87900,
        maxCompetitors: 20,
        monitoringFrequency: 'TWICE_WEEKLY' as MonitoringFrequency,
        rateLimit: {
            requestsPerMinute: 600,
            requestsPerDay: 100000,
        },
    },
};

// -----------------------------------------------------------------------------
// Monitoring Types
// -----------------------------------------------------------------------------

export type MonitoringFrequency = 'MONTHLY' | 'WEEKLY' | 'TWICE_WEEKLY';

// -----------------------------------------------------------------------------
// Audit Types
// -----------------------------------------------------------------------------

export enum AuditStatus {
    PENDING = 'PENDING',
    CRAWLING = 'CRAWLING',
    ANALYZING = 'ANALYZING',
    COMPLETE = 'COMPLETE',
    FAILED = 'FAILED',
}

export enum AuditType {
    FULL = 'FULL',
    MONITORING = 'MONITORING',
    ADDON = 'ADDON',
}

export enum TriggerType {
    MANUAL = 'MANUAL',
    SCHEDULED = 'SCHEDULED',
    API = 'API',
}

// -----------------------------------------------------------------------------
// Score Categories
// -----------------------------------------------------------------------------

export enum ScoreCategory {
    TECHNICAL_SEO = 'technicalSeo',
    ONPAGE_SEO = 'onpageSeo',
    CONTENT_QUALITY = 'contentQuality',
    AEO_READINESS = 'aeoReadiness',
    BRAND_VOICE = 'brandVoice',
    UX_ENGAGEMENT = 'uxEngagement',
    INTERNAL_STRUCTURE = 'internalStructure',
}

export interface ScoreBreakdown {
    technicalSeo: number;
    onpageSeo: number;
    contentQuality: number;
    aeoReadiness: number;
    brandVoice: number;
    uxEngagement: number;
    internalStructure: number;
}

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

export interface SubScores {
    // Technical SEO sub-scores
    pageSpeed?: number;
    mobileOptimization?: number;
    coreWebVitals?: number;
    crawlability?: number;
    indexability?: number;
    sslSecurity?: number;

    // On-Page SEO sub-scores
    titleTags?: number;
    metaDescriptions?: number;
    headerStructure?: number;
    imageOptimization?: number;
    urlStructure?: number;

    // Content Quality sub-scores (LLM)
    clarity?: number;
    depth?: number;
    originality?: number;
    expertise?: number;
    freshness?: number;

    // AEO Readiness sub-scores
    schemaMarkup?: number;
    questionCoverage?: number;
    featuredSnippetOptimization?: number;
    conversationalReadiness?: number;
    entityCoverage?: number;

    // Brand Voice sub-scores (LLM)
    voiceConsistency?: number;
    toneAlignment?: number;
    personalityStrength?: number;
    differentiationScore?: number;

    // UX Engagement sub-scores
    navigationClarity?: number;
    contentAccessibility?: number;
    interactionDesign?: number;
    visualHierarchy?: number;

    // Internal Structure sub-scores
    linkDistribution?: number;
    contentHierarchy?: number;
    orphanedPages?: number;
    topicalClustering?: number;
}

// -----------------------------------------------------------------------------
// User & Auth Types
// -----------------------------------------------------------------------------

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
    VIEWER = 'VIEWER',
}

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

export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// -----------------------------------------------------------------------------
// Alert Types
// -----------------------------------------------------------------------------

export enum AlertType {
    SCORE_CHANGE = 'SCORE_CHANGE',
    RANK_CHANGE = 'RANK_CHANGE',
    COMPETITOR_ACTIVITY = 'COMPETITOR_ACTIVITY',
}

export enum AlertSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
}

// -----------------------------------------------------------------------------
// Report Types
// -----------------------------------------------------------------------------

export enum ReportType {
    FULL = 'FULL',
    EXECUTIVE = 'EXECUTIVE',
    COMPARISON = 'COMPARISON',
}

export enum ReportStatus {
    GENERATING = 'GENERATING',
    READY = 'READY',
    FAILED = 'FAILED',
}

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Report types
export * from './report.types';
