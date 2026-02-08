import { IsString, IsUrl, IsOptional, IsEmail, IsUUID, IsIn, IsPhoneNumber, MinLength } from 'class-validator';

export class StartAnalysisDto {
    @IsString()
    @MinLength(2)
    firstName: string;

    @IsString()
    @MinLength(2)
    lastName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(10)
    phone: string;

    @IsString()
    @MinLength(2)
    businessName: string;

    @IsString()
    url: string;

    @IsOptional()
    @IsIn(['local', 'national'])
    scope?: 'local' | 'national';
}

export class SelectCompetitorDto {
    @IsString()
    competitorUrl: string;

    @IsOptional()
    @IsIn(['local', 'national'])
    scope?: 'local' | 'national';
}

export interface BusinessInfo {
    name: string;
    industry: string;
    niche: string;
    services: string[];
    location?: string;
    targetMarket: 'local' | 'regional' | 'national' | 'unknown';
}

export class CompetitorSuggestion {
    domain: string;
    name: string;
    description?: string;
    similarity?: number;
    source?: 'ai_suggested' | 'dataforseo' | 'serp' | 'directory';
    metrics?: {
        keywords?: number;
        traffic?: number;
        intersections?: number;
    };
}

export class CategoryTeaser {
    name: string;
    icon: string;
    yourTeaser: string;
    competitorTeaser: string;
    locked: boolean;
}

export class AnalysisTeaserResponse {
    analysisId: string;
    yourUrl: string;
    competitorUrl: string;
    yourScore: number;
    competitorScore: number;
    categories: CategoryTeaser[];
    createdAt: Date;
}

export class AnalysisStatusResponse {
    analysisId: string;
    status: 'pending' | 'crawling' | 'analyzing' | 'complete' | 'failed';
    progress: number;
    message?: string;
}
