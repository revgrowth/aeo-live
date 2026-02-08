import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { PrismaService } from '../../common/database/prisma.service';
import { AICompetitorDiscoveryService } from './ai-competitor-discovery.service';
import { AnalysisEngine } from './analysis-engine.service';
import { FirecrawlService } from './firecrawl.service';
import { DataForSEOService } from './dataforseo.service';
import { PageSpeedService } from './pagespeed.service';
import { IntelligenceEngine } from './intelligence-engine.service';

@Module({
    controllers: [AnalysisController],
    providers: [
        AnalysisService,
        PrismaService,
        AICompetitorDiscoveryService,
        AnalysisEngine,
        FirecrawlService,
        DataForSEOService,
        PageSpeedService,
        IntelligenceEngine,
    ],
    exports: [AnalysisService, AnalysisEngine, IntelligenceEngine],
})
export class AnalysisModule { }
