import { Controller, Get, Post, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuditsService } from './audits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@aeo-live/shared';

@Controller()
@UseGuards(JwtAuthGuard)
export class AuditsController {
    constructor(private readonly auditsService: AuditsService) { }

    @Post('projects/:projectId/audits')
    async create(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const audit = await this.auditsService.create(projectId, user.organizationId);
        return {
            success: true,
            data: audit,
        };
    }

    @Get('projects/:projectId/audits')
    async findByProject(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const audits = await this.auditsService.findByProject(projectId, user.organizationId);
        return {
            success: true,
            data: audits,
        };
    }

    @Get('audits/:id')
    async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const audit = await this.auditsService.findById(id, user.organizationId);
        return {
            success: true,
            data: audit,
        };
    }

    @Get('audits/:id/status')
    async getStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const status = await this.auditsService.getStatus(id, user.organizationId);
        return {
            success: true,
            data: status,
        };
    }

    @Get('audits/:id/results')
    async getResults(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const results = await this.auditsService.getResults(id, user.organizationId);
        return {
            success: true,
            data: results,
        };
    }

    @Get('audits/:id/comparison')
    async getComparison(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const comparison = await this.auditsService.getComparison(id, user.organizationId);
        return {
            success: true,
            data: comparison,
        };
    }
}
