// =============================================================================
// AEO.LIVE Report Types — Single Source of Truth
// =============================================================================
// All three workstreams (admin, claim, dashboard) import from here.
// =============================================================================

// -----------------------------------------------------------------------------
// Subcategory Score
// -----------------------------------------------------------------------------

export interface SubcategoryScore {
    score: number;
    weight: number;
    evidence?: string[];
    issues?: string[];
}

// -----------------------------------------------------------------------------
// Category Data
// -----------------------------------------------------------------------------

export interface CategoryData {
    name: string;
    icon: string;
    yourScore: number;
    competitorScore: number;
    status: 'winning' | 'losing' | 'tied';
    insights?: string[];
    recommendations?: string[];
    subcategories?: Record<string, SubcategoryScore>;
    details?: Record<string, any>;
}

// -----------------------------------------------------------------------------
// Recommendation
// -----------------------------------------------------------------------------

export interface RecommendationData {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
}

// -----------------------------------------------------------------------------
// Full Report Data
// -----------------------------------------------------------------------------

export interface ReportData {
    analysisId: string;
    yourUrl: string;
    competitorUrl: string;
    yourScore: number;
    competitorScore: number;
    status: 'winning' | 'losing' | 'tied';
    categories: CategoryData[];
    aiSummary: string;
    recommendations?: RecommendationData[];
    createdAt: string | Date;
    intelligenceReport?: any; // v3.0 deep nested intelligence data
    businessProfile?: {
        name: string;
        industry: string;
        services: string[];
    };
    v3Analysis?: {
        your: any;
        competitor: any;
        yourPerformance?: any;
        competitorPerformance?: any;
        contentGap?: any;
        backlinkComparison?: any;
        serpComparison?: any;
    };
}

// -----------------------------------------------------------------------------
// Report Teaser (stripped-down for pre-purchase preview)
// -----------------------------------------------------------------------------

export interface ReportTeaser {
    analysisId: string;
    yourUrl: string;
    competitorUrl: string;
    yourScore: number;
    competitorScore: number;
    status: 'winning' | 'losing' | 'tied';
    categories: Pick<CategoryData, 'name' | 'icon' | 'yourScore' | 'competitorScore' | 'status'>[];
    aiSummary: string;
}

// -----------------------------------------------------------------------------
// Claim Code Validation Response
// -----------------------------------------------------------------------------

export interface ClaimCodeValidation {
    valid: boolean;
    domain: string | null;
    status?: string;
    teaser?: ReportTeaser;
}
