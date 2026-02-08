import { Controller, Get, Patch, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@aeo-live/shared';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }

    @Get('current')
    async getCurrent(@CurrentUser() user: AuthUser) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const org = await this.organizationsService.findById(user.organizationId);
        return {
            success: true,
            data: org,
        };
    }

    @Patch('current')
    async updateCurrent(@CurrentUser() user: AuthUser, @Body() body: { name?: string }) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const updated = await this.organizationsService.update(user.organizationId, user.id, body);
        return {
            success: true,
            data: updated,
        };
    }

    @Get('current/members')
    async getMembers(@CurrentUser() user: AuthUser) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const members = await this.organizationsService.getMembers(user.organizationId);
        return {
            success: true,
            data: members,
        };
    }
}
