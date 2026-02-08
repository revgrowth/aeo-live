import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Body,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@aeo-live/shared';
import { ErrorNotificationService } from '../../common/errors/error-notification.service';
import { ErrorSeverity, ErrorStatus, SystemErrorType } from '@prisma/client';

@Controller('admin/errors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'OWNER')
export class AdminErrorsController {
    constructor(private readonly errorService: ErrorNotificationService) { }

    /**
     * Get error statistics
     */
    @Get('stats')
    async getErrorStats() {
        const stats = await this.errorService.getErrorStats();
        return { success: true, data: stats };
    }

    /**
     * Get unread error count for badge
     */
    @Get('unread-count')
    async getUnreadCount() {
        const count = await this.errorService.getUnreadCount();
        return { success: true, data: { count } };
    }

    /**
     * Get errors with filtering and pagination
     */
    @Get()
    async getErrors(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: ErrorStatus,
        @Query('type') type?: SystemErrorType,
        @Query('severity') severity?: ErrorSeverity,
    ) {
        const result = await this.errorService.getErrors({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            status,
            type,
            severity,
        });
        return {
            success: true,
            data: {
                errors: result.errors,
                total: result.total,
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 20,
                totalPages: Math.ceil(result.total / (limit ? parseInt(limit, 10) : 20)),
            }
        };
    }

    /**
     * Get single error by ID
     */
    @Get(':id')
    async getError(@Param('id') id: string) {
        const error = await this.errorService.getError(id);
        if (!error) {
            return { success: false, error: { message: 'Error not found' } };
        }
        return { success: true, data: error };
    }

    /**
     * Acknowledge an error
     */
    @Patch(':id/acknowledge')
    async acknowledgeError(
        @Param('id') id: string,
        @CurrentUser() user: AuthUser,
    ) {
        const error = await this.errorService.acknowledgeError(id, user.id);
        return { success: true, data: error };
    }

    /**
     * Mark error as in progress
     */
    @Patch(':id/in-progress')
    async markInProgress(
        @Param('id') id: string,
        @CurrentUser() user: AuthUser,
    ) {
        const error = await this.errorService.markInProgress(id, user.id);
        return { success: true, data: error };
    }

    /**
     * Resolve an error
     */
    @Patch(':id/resolve')
    async resolveError(
        @Param('id') id: string,
        @CurrentUser() user: AuthUser,
        @Body() body: { resolution?: string },
    ) {
        const error = await this.errorService.resolveError(id, user.id, body.resolution);
        return { success: true, data: error };
    }

    /**
     * Ignore an error
     */
    @Patch(':id/ignore')
    async ignoreError(
        @Param('id') id: string,
        @CurrentUser() user: AuthUser,
        @Body() body: { reason?: string },
    ) {
        const error = await this.errorService.ignoreError(id, user.id, body.reason);
        return { success: true, data: error };
    }
}
