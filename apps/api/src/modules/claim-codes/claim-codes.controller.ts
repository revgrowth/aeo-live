import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ClaimCodesService } from './claim-codes.service';
import { GenerateClaimCodeDto, RedeemClaimCodeDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@aeo-live/shared';

@Controller()
export class ClaimCodesController {
    constructor(private readonly claimCodesService: ClaimCodesService) { }

    // =========================================================================
    // ADMIN ENDPOINTS
    // =========================================================================

    @Post('admin/claim-codes/generate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async generate(@Body() dto: GenerateClaimCodeDto) {
        const result = await this.claimCodesService.generate(dto);
        return {
            success: true,
            data: result,
        };
    }

    @Get('admin/claim-codes')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async findAll(@Query('status') status?: string) {
        const codes = await this.claimCodesService.findAll(status);
        return {
            success: true,
            data: codes,
        };
    }

    // =========================================================================
    // PUBLIC ENDPOINTS
    // =========================================================================

    @Get('claim-codes/:code/validate')
    async validate(@Param('code') code: string) {
        const result = await this.claimCodesService.validate(code);
        return {
            success: true,
            data: result,
        };
    }

    // =========================================================================
    // AUTHENTICATED ENDPOINTS
    // =========================================================================

    @Post('claim-codes/redeem')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async redeem(
        @CurrentUser() user: AuthUser,
        @Body() dto: RedeemClaimCodeDto,
    ) {
        const result = await this.claimCodesService.redeem(dto.code, user.id);
        return {
            success: true,
            data: result,
        };
    }
}
