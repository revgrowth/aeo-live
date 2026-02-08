import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    ForbiddenException,
    Req,
    Headers,
    RawBodyRequest,
    BadRequestException,
    Optional,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, PlanType } from '@aeo-live/shared';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    // ===== CHECKOUT ENDPOINTS =====

    @Post('checkout/create')
    @UseGuards(OptionalJwtAuthGuard)
    async createCheckoutSession(
        @CurrentUser() user: AuthUser | null,
        @Body() body: { tier: string; billingType: 'onetime' | 'subscription'; analysisId?: string }
    ) {
        const { tier, billingType, analysisId } = body;

        if (!tier || !billingType) {
            throw new BadRequestException('Tier and billing type are required');
        }

        const session = await this.billingService.createTierCheckout(
            user,
            tier as PlanType,
            billingType === 'subscription',
            analysisId
        );

        return {
            success: true,
            data: session,
        };
    }

    @Post('checkout/addon')
    @UseGuards(OptionalJwtAuthGuard)
    async createAddonCheckout(
        @CurrentUser() user: AuthUser | null,
        @Body() body: { analysisId?: string }
    ) {
        const result = await this.billingService.createAddonCheckout(user, body.analysisId);
        return {
            success: true,
            data: result,
        };
    }

    @Get('checkout/verify')
    async verifyCheckoutSession(@Query('session_id') sessionId: string) {
        if (!sessionId) {
            throw new BadRequestException('Session ID is required');
        }
        const result = await this.billingService.verifyCheckoutSession(sessionId);
        return {
            success: true,
            data: result,
        };
    }

    // ===== SUBSCRIPTION ENDPOINTS =====

    @Get('subscription')
    @UseGuards(JwtAuthGuard)
    async getSubscription(@CurrentUser() user: AuthUser) {
        const subscription = await this.billingService.getUserSubscription(user);
        return {
            success: true,
            data: subscription,
        };
    }

    @Post('portal')
    @UseGuards(JwtAuthGuard)
    async createPortal(@CurrentUser() user: AuthUser) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const session = await this.billingService.createPortalSession(user.organizationId);
        return {
            success: true,
            data: session,
        };
    }

    // ===== REPORTS ENDPOINTS =====

    @Get('reports')
    @UseGuards(JwtAuthGuard)
    async getUserReports(@CurrentUser() user: AuthUser) {
        const reports = await this.billingService.getUserReports(user);
        return {
            success: true,
            data: { reports },
        };
    }

    @Get('history')
    @UseGuards(JwtAuthGuard)
    async getSubscriberHistory(@CurrentUser() user: AuthUser) {
        const history = await this.billingService.getSubscriberHistory(user);
        return {
            success: true,
            data: history,
        };
    }

    // ===== USAGE ENDPOINTS =====

    @Get('usage')
    @UseGuards(JwtAuthGuard)
    async getUsage(@CurrentUser() user: AuthUser) {
        if (!user.organizationId) {
            throw new ForbiddenException('User is not part of an organization');
        }
        const usage = await this.billingService.getUsage(user.organizationId);
        return {
            success: true,
            data: usage,
        };
    }

    // ===== WEBHOOK ENDPOINT =====

    @Post('webhook')
    @SkipThrottle()
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string
    ) {
        const rawBody = req.rawBody;
        if (!rawBody) {
            throw new ForbiddenException('No raw body found');
        }
        await this.billingService.handleWebhook(signature, rawBody);
        return { received: true };
    }
}
