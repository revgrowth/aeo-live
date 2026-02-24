import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { GenerateClaimCodeDto } from './dto/generate-claim-code.dto';
import { randomBytes } from 'crypto';
import { ReportTeaser, ClaimCodeValidation } from '@aeo-live/shared';

@Injectable()
export class ClaimCodesService {
    private readonly logger = new Logger(ClaimCodesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate a new claim code for a target domain (admin only).
     */
    async generate(dto: GenerateClaimCodeDto) {
        const code = dto.customCode || this.generateCode();

        // Verify code uniqueness
        const existing = await this.prisma.claimCode.findUnique({
            where: { code },
        });

        if (existing) {
            throw new ConflictException(`Claim code "${code}" already exists`);
        }

        // Optionally verify lead exists
        if (dto.leadId) {
            const lead = await this.prisma.lead.findUnique({
                where: { id: dto.leadId },
            });
            if (!lead) {
                throw new NotFoundException(`Lead ${dto.leadId} not found`);
            }
        }

        // Optionally verify analysis run exists
        if (dto.analysisRunId) {
            const run = await this.prisma.analysisRun.findUnique({
                where: { id: dto.analysisRunId },
            });
            if (!run) {
                throw new NotFoundException(`Analysis run ${dto.analysisRunId} not found`);
            }
        }

        const claimCode = await this.prisma.claimCode.create({
            data: {
                code,
                targetDomain: this.normalizeDomain(dto.domain),
                leadId: dto.leadId || null,
                analysisRunId: dto.analysisRunId || null,
            },
        });

        this.logger.log(
            `CLAIM_CODE_GENERATED: ${JSON.stringify({
                code: claimCode.code,
                domain: claimCode.targetDomain,
                analysisRunId: dto.analysisRunId || null,
                leadId: dto.leadId || null,
            })}`,
        );

        return { code: claimCode.code, id: claimCode.id };
    }

    /**
     * Validate a claim code — public, no auth required.
     */
    async validate(code: string): Promise<ClaimCodeValidation> {
        const claimCode = await this.prisma.claimCode.findUnique({
            where: { code },
        });

        if (!claimCode) {
            this.logger.warn(
                `CLAIM_CODE_VALIDATION_FAILED: ${JSON.stringify({
                    code,
                    reason: 'not_found',
                })}`,
            );
            return { valid: false, domain: null };
        }

        const valid = claimCode.status === 'ACTIVE';

        this.logger.log(
            `CLAIM_CODE_VALIDATED: ${JSON.stringify({
                code,
                valid,
                domain: claimCode.targetDomain,
                status: claimCode.status,
            })}`,
        );

        return {
            valid,
            domain: claimCode.targetDomain,
            status: claimCode.status,
        };
    }

    /**
     * Get teaser preview for a claim code's linked analysis.
     */
    async getTeaser(code: string): Promise<ReportTeaser | null> {
        const claimCode = await this.prisma.claimCode.findUnique({
            where: { code },
        });

        if (!claimCode || claimCode.status !== 'ACTIVE') {
            return null;
        }

        if (!claimCode.analysisRunId) {
            return null;
        }

        const run = await this.prisma.analysisRun.findUnique({
            where: { id: claimCode.analysisRunId },
        });

        if (!run || run.status !== 'complete') {
            return null;
        }

        // Build teaser from analysis run data
        let categories: ReportTeaser['categories'] = [];
        if (run.categoryScores) {
            try {
                const parsed = typeof run.categoryScores === 'string'
                    ? JSON.parse(run.categoryScores)
                    : run.categoryScores;
                categories = parsed.map((cat: any) => ({
                    name: cat.name,
                    icon: cat.icon || '📊',
                    yourScore: Math.round(cat.score || 0),
                    competitorScore: Math.round(cat.competitorScore || 0),
                    status: cat.status || 'tied',
                }));
            } catch (e) {
                this.logger.error(`Failed to parse categoryScores for teaser: ${e}`);
            }
        }

        const yourScore = run.yourScore || 0;
        const competitorScore = run.competitorScore || 0;
        const scoreDiff = yourScore - competitorScore;

        return {
            analysisId: run.id,
            yourUrl: run.businessUrl,
            competitorUrl: run.competitorUrl,
            yourScore,
            competitorScore,
            status: scoreDiff > 0 ? 'winning' : scoreDiff < 0 ? 'losing' : 'tied',
            categories,
            aiSummary: scoreDiff > 0
                ? `Your site scores ${scoreDiff} points higher than your competitor. Create an account to see the full breakdown.`
                : `Your competitor leads by ${Math.abs(scoreDiff)} points. Create an account to see actionable recommendations.`,
        };
    }

    /**
     * Redeem a claim code — creates a Project in the user's organization.
     * Called during registration or as a standalone POST.
     */
    async redeem(code: string, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Find and lock the claim code
            const claimCode = await tx.claimCode.findUnique({
                where: { code },
            });

            if (!claimCode) {
                this.logger.error(
                    `CLAIM_CODE_REDEEM_FAILED: ${JSON.stringify({
                        code,
                        userId,
                        reason: 'not_found',
                    })}`,
                );
                throw new NotFoundException(`Claim code "${code}" not found`);
            }

            if (claimCode.status !== 'ACTIVE') {
                this.logger.error(
                    `CLAIM_CODE_REDEEM_FAILED: ${JSON.stringify({
                        code,
                        userId,
                        reason: `status_${claimCode.status.toLowerCase()}`,
                    })}`,
                );
                throw new BadRequestException(
                    `Claim code "${code}" is ${claimCode.status.toLowerCase()}, not redeemable`,
                );
            }

            // 2. Get the user + their organization
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { id: true, organizationId: true },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            if (!user.organizationId) {
                throw new BadRequestException('User does not belong to an organization');
            }

            // 3. Mark the code as REDEEMED
            await tx.claimCode.update({
                where: { id: claimCode.id },
                data: {
                    status: 'REDEEMED',
                    redeemedByUserId: userId,
                    redeemedAt: new Date(),
                },
            });

            // 4. Create a Project for the target domain
            const project = await tx.project.create({
                data: {
                    organizationId: user.organizationId,
                    name: claimCode.targetDomain,
                    primaryDomain: claimCode.targetDomain,
                },
            });

            this.logger.log(
                `CLAIM_CODE_REDEEMED: ${JSON.stringify({
                    code,
                    userId,
                    projectId: project.id,
                    domain: claimCode.targetDomain,
                    analysisRunId: claimCode.analysisRunId,
                })}`,
            );

            return {
                projectId: project.id,
                domain: claimCode.targetDomain,
                analysisRunId: claimCode.analysisRunId,
            };
        });
    }

    /**
     * List all claim codes with optional status filter (admin).
     */
    async findAll(status?: string) {
        const where = status ? { status: status as any } : {};

        return this.prisma.claimCode.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                redeemedByUser: {
                    select: { id: true, name: true, email: true },
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }

    /**
     * Generate a URL-friendly random code (e.g., "A7K3-XM92-PQ1R").
     */
    private generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I for clarity
        const segments = 3;
        const segmentLength = 4;
        const parts: string[] = [];

        for (let s = 0; s < segments; s++) {
            let segment = '';
            const bytes = randomBytes(segmentLength);
            for (let i = 0; i < segmentLength; i++) {
                segment += chars[bytes[i] % chars.length];
            }
            parts.push(segment);
        }

        return parts.join('-');
    }

    private normalizeDomain(domain: string): string {
        return domain
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');
    }
}
