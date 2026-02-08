// =============================================================================
// AEO.LIVE Shared Constants
// =============================================================================

// API versioning
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// JWT configuration
export const JWT_ACCESS_EXPIRATION_DEFAULT = '15m';
export const JWT_REFRESH_EXPIRATION_DEFAULT = '7d';

// Rate limiting defaults
export const RATE_LIMIT_TTL_DEFAULT = 60; // seconds
export const RATE_LIMIT_MAX_DEFAULT = 100; // requests per TTL

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Crawler limits
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

// LLM configuration
export const LLM_MODEL = 'claude-opus-4-5-20251101';
export const LLM_MAX_TOKENS = 4096;
export const LLM_TEMPERATURE = 0.3;

// Score thresholds
export const SCORE_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 70,
    FAIR: 50,
    POOR: 30,
};

// Score category weights for overall score calculation
export const SCORE_WEIGHTS = {
    technicalSeo: 0.15,
    onpageSeo: 0.15,
    contentQuality: 0.20,
    aeoReadiness: 0.15,
    brandVoice: 0.15,
    uxEngagement: 0.10,
    internalStructure: 0.10,
};

// Verification token expiration
export const EMAIL_VERIFICATION_EXPIRATION_HOURS = 24;
export const PASSWORD_RESET_EXPIRATION_HOURS = 1;

// Report expiration
export const REPORT_EXPIRATION_DAYS = 30;
