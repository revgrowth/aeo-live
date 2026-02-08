import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '@/common/database/prisma.service';
import { PLAN_CONFIGS, PlanType, AuthUser } from '@aeo-live/shared';

// Add-on pricing by plan tier
const ADDON_PRICES: Record<string, number> = {
    STARTER: 2900,      // $29
    GROWTH: 2500,       // $25
    SCALE: 1900,        // $19
    SCALE_PLUS: 1500,   // $15
    NON_SUBSCRIBER: 4900, // $49
};

@Injectable()
export class BillingService {
    private stripe: Stripe;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService
    ) {
        const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (stripeSecretKey && stripeSecretKey !== 'sk_test_...') {
            this.stripe = new Stripe(stripeSecretKey, {
                apiVersion: '2023-10-16',
            });
        } else {
            this.stripe = null as unknown as Stripe;
        }
    }

    // ===== NEW CHECKOUT METHODS =====

    /**
     * Create checkout for tier-based purchase (one-time report or subscription)
     */
    async createTierCheckout(
        user: AuthUser | null,
        tier: PlanType,
        isSubscription: boolean,
        analysisId?: string
    ): Promise<{ url: string }> {
        this.ensureStripeConfigured();

        // Determine price ID
        const priceEnvKey = isSubscription
            ? `STRIPE_PRICE_${tier}_MONTHLY`
            : `STRIPE_PRICE_${tier}_ONETIME`;
        const priceId = this.configService.get<string>(priceEnvKey);

        if (!priceId || priceId.startsWith('price_')) {
            // Check if it's a placeholder
            if (priceId === 'price_...' || priceId === 'price_TODO') {
                throw new BadRequestException('Pricing not configured for this plan');
            }
        }

        // Get or create customer
        let customerId: string | undefined;
        if (user?.organizationId) {
            const org = await this.prisma.organization.findUnique({
                where: { id: user.organizationId },
            });
            if (org?.stripeCustomerId) {
                customerId = org.stripeCustomerId;
            } else if (org) {
                const customer = await this.stripe.customers.create({
                    email: user.email,
                    metadata: {
                        organizationId: user.organizationId,
                        userId: user.id,
                    },
                });
                customerId = customer.id;
                await this.prisma.organization.update({
                    where: { id: user.organizationId },
                    data: { stripeCustomerId: customerId },
                });
            }
        }

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: isSubscription ? 'subscription' : 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${this.configService.get('WEB_URL')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.configService.get('WEB_URL')}/checkout?canceled=true`,
            metadata: {
                tier,
                isSubscription: String(isSubscription),
                analysisId: analysisId || '',
                userId: user?.id || '',
                organizationId: user?.organizationId || '',
            },
        };

        if (customerId) {
            sessionParams.customer = customerId;
        } else {
            sessionParams.customer_creation = 'always';
            sessionParams.customer_email = user?.email;
        }

        const session = await this.stripe.checkout.sessions.create(sessionParams);
        return { url: session.url || '' };
    }

    /**
     * Create add-on checkout based on user's subscription tier
     */
    async createAddonCheckout(
        user: AuthUser | null,
        analysisId?: string
    ): Promise<{ url: string; price: number }> {
        this.ensureStripeConfigured();

        // Determine user's tier to get correct pricing
        let userTier = 'NON_SUBSCRIBER';
        let customerId: string | undefined;

        if (user?.organizationId) {
            const org = await this.prisma.organization.findUnique({
                where: { id: user.organizationId },
                include: { subscriptions: { where: { status: 'ACTIVE' }, take: 1 } },
            });

            if (org?.subscriptions?.[0]) {
                userTier = org.subscriptions[0].plan;
            }
            customerId = org?.stripeCustomerId || undefined;
        }

        // Get price ID for this tier's add-on
        const priceEnvKey = userTier === 'NON_SUBSCRIBER'
            ? 'STRIPE_PRICE_ADDON_NON_SUBSCRIBER'
            : `STRIPE_PRICE_ADDON_${userTier}`;
        const priceId = this.configService.get<string>(priceEnvKey);

        if (!priceId || priceId.startsWith('price_...')) {
            throw new BadRequestException('Add-on pricing not configured');
        }

        const price = ADDON_PRICES[userTier] || ADDON_PRICES.NON_SUBSCRIBER;

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${this.configService.get('WEB_URL')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.configService.get('WEB_URL')}/dashboard?canceled=true`,
            metadata: {
                type: 'addon',
                tier: userTier,
                analysisId: analysisId || '',
                userId: user?.id || '',
                organizationId: user?.organizationId || '',
            },
        };

        if (customerId) {
            sessionParams.customer = customerId;
        } else if (user?.email) {
            sessionParams.customer_email = user.email;
        }

        const session = await this.stripe.checkout.sessions.create(sessionParams);
        return { url: session.url || '', price: price / 100 };
    }

    /**
     * Verify checkout session and return purchase details
     */
    async verifyCheckoutSession(sessionId: string): Promise<{
        type: 'report' | 'subscription';
        tier: string;
        reportId?: string;
    }> {
        this.ensureStripeConfigured();

        const session = await this.stripe.checkout.sessions.retrieve(sessionId);

        const isSubscription = session.metadata?.isSubscription === 'true';
        const tier = session.metadata?.tier || 'STARTER';

        return {
            type: isSubscription ? 'subscription' : 'report',
            tier,
            reportId: session.metadata?.analysisId || undefined,
        };
    }

    /**
     * Get user's subscription status with add-on pricing
     */
    async getUserSubscription(user: AuthUser): Promise<{
        plan: string | null;
        status: string | null;
        currentPeriodEnd?: string;
        cancelAtPeriodEnd?: boolean;
        addOnPrice?: number;
    }> {
        if (!user.organizationId) {
            return {
                plan: null,
                status: null,
                addOnPrice: ADDON_PRICES.NON_SUBSCRIBER / 100,
            };
        }

        const org = await this.prisma.organization.findUnique({
            where: { id: user.organizationId },
            include: {
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    take: 1,
                },
            },
        });

        if (!org) {
            return {
                plan: null,
                status: null,
                addOnPrice: ADDON_PRICES.NON_SUBSCRIBER / 100,
            };
        }

        const subscription = org.subscriptions[0];
        const addOnPrice = subscription
            ? (ADDON_PRICES[subscription.plan] || ADDON_PRICES.STARTER) / 100
            : ADDON_PRICES.NON_SUBSCRIBER / 100;

        return {
            plan: subscription?.plan || org.plan || null,
            status: subscription?.status || null,
            currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString(),
            cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
            addOnPrice,
        };
    }

    /**
     * Get all reports for user (including free teaser analyses)
     */
    async getUserReports(user: AuthUser): Promise<{
        id: string;
        analysisId: string;
        yourUrl: string;
        competitorUrl: string;
        yourScore: number;
        competitorScore: number;
        createdAt: string;
        tier: string;
        isPurchased: boolean;
    }[]> {
        // Get all completed analyses linked to this user's email
        const analyses = await this.prisma.analysisRun.findMany({
            where: {
                status: 'complete',
                lead: {
                    email: user.email,
                },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                lead: true,
            },
        });

        return analyses.map((analysis) => ({
            id: analysis.id,
            analysisId: analysis.id,
            yourUrl: analysis.businessUrl,
            competitorUrl: analysis.competitorUrl || '',
            yourScore: analysis.yourScore || 0,
            competitorScore: analysis.competitorScore || 0,
            createdAt: analysis.createdAt.toISOString(),
            tier: analysis.purchasedFullReport ? 'PURCHASED' : 'FREE',
            isPurchased: analysis.purchasedFullReport || false,
        }));
    }


    /**
     * Get subscriber's history with trend data
     */
    async getSubscriberHistory(user: AuthUser): Promise<{
        reports: {
            id: string;
            analysisId: string;
            yourUrl: string;
            competitorUrl: string;
            yourScore: number;
            competitorScore: number;
            createdAt: string;
        }[];
        trends: {
            date: string;
            yourScore: number;
            competitorScore: number;
        }[];
    }> {
        // Get all completed analyses for this user by email
        const analyses = await this.prisma.analysisRun.findMany({
            where: {
                status: 'complete',
                lead: {
                    email: user.email,
                },
            },
            orderBy: { createdAt: 'asc' },
            include: {
                lead: true,
            },
        });

        const reports = analyses.map((analysis) => ({
            id: analysis.id,
            analysisId: analysis.id,
            yourUrl: analysis.businessUrl,
            competitorUrl: analysis.competitorUrl || '',
            yourScore: analysis.yourScore || 0,
            competitorScore: analysis.competitorScore || 0,
            createdAt: analysis.createdAt.toISOString(),
        }));

        // Generate trend data from analyses
        const trends = analyses.map((analysis) => ({
            date: analysis.createdAt.toISOString().split('T')[0],
            yourScore: analysis.yourScore || 0,
            competitorScore: analysis.competitorScore || 0,
        }));

        return { reports, trends };
    }

    // ===== EXISTING METHODS (kept for compatibility) =====

    async getSubscription(orgId: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    take: 1,
                },
            },
        });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        const subscription = org.subscriptions[0];
        const planConfig = PLAN_CONFIGS[org.plan as PlanType];

        return {
            plan: org.plan,
            planConfig,
            subscription: subscription
                ? {
                    id: subscription.id,
                    status: subscription.status,
                    currentPeriodStart: subscription.currentPeriodStart,
                    currentPeriodEnd: subscription.currentPeriodEnd,
                    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                }
                : null,
        };
    }

    async createCheckoutSession(
        orgId: string,
        plan: PlanType,
        isSubscription: boolean
    ): Promise<{ url: string }> {
        this.ensureStripeConfigured();

        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        let customerId = org.stripeCustomerId;
        if (!customerId) {
            const customer = await this.stripe.customers.create({
                metadata: { organizationId: orgId },
            });
            customerId = customer.id;

            await this.prisma.organization.update({
                where: { id: orgId },
                data: { stripeCustomerId: customerId },
            });
        }

        const priceEnvKey = isSubscription
            ? `STRIPE_PRICE_${plan}_MONTHLY`
            : `STRIPE_PRICE_${plan}_ONETIME`;
        const priceId = this.configService.get<string>(priceEnvKey);

        if (!priceId || priceId.startsWith('price_...')) {
            throw new BadRequestException('Pricing not configured for this plan');
        }

        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: isSubscription ? 'subscription' : 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${this.configService.get('WEB_URL')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.configService.get('WEB_URL')}/checkout?canceled=true`,
            metadata: {
                organizationId: orgId,
                plan,
                isSubscription: String(isSubscription),
            },
        });

        return { url: session.url || '' };
    }

    async createPortalSession(orgId: string): Promise<{ url: string }> {
        this.ensureStripeConfigured();

        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!org?.stripeCustomerId) {
            throw new BadRequestException('No billing account found');
        }

        const session = await this.stripe.billingPortal.sessions.create({
            customer: org.stripeCustomerId,
            return_url: `${this.configService.get('WEB_URL')}/dashboard`,
        });

        return { url: session.url };
    }

    async getUsage(orgId: string, startDate?: Date, endDate?: Date) {
        const where: { organizationId: string; createdAt?: { gte?: Date; lte?: Date } } = {
            organizationId: orgId,
        };

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const events = await this.prisma.usageEvent.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        const summary = events.reduce(
            (acc, event) => {
                acc.totalEvents++;
                acc.totalCostCents += event.costCents || 0;
                acc.byType[event.eventType] = (acc.byType[event.eventType] || 0) + 1;
                return acc;
            },
            { totalEvents: 0, totalCostCents: 0, byType: {} as Record<string, number> }
        );

        return {
            summary,
            events: events.slice(0, 100),
        };
    }

    async handleWebhook(signature: string, payload: Buffer): Promise<void> {
        this.ensureStripeConfigured();

        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new BadRequestException('Webhook secret not configured');
        }

        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch {
            throw new BadRequestException('Invalid webhook signature');
        }

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
                break;
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
                break;
            case 'invoice.payment_failed':
                await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
                break;
        }
    }

    private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
        const { organizationId, tier, plan, isSubscription, analysisId, userId, type } = session.metadata || {};

        const orgId = organizationId;
        const planToUse = tier || plan;

        if (!planToUse) return;

        // Handle add-on purchase
        if (type === 'addon' && analysisId) {
            // Mark the analysis as purchased/accessible
            // The analysis is already associated with the org, so nothing else needed
            return;
        }

        if (!orgId) return;

        if (isSubscription === 'true' && session.subscription) {
            const stripeSubscription = await this.stripe.subscriptions.retrieve(
                session.subscription as string
            );

            await this.prisma.subscription.create({
                data: {
                    organizationId: orgId,
                    stripeSubscriptionId: stripeSubscription.id,
                    plan: planToUse as PlanType,
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                },
            });
        }

        // Update organization plan
        await this.prisma.organization.update({
            where: { id: orgId },
            data: { plan: planToUse as PlanType },
        });

        // Log usage event
        await this.prisma.usageEvent.create({
            data: {
                organizationId: orgId,
                eventType: isSubscription === 'true' ? 'subscription_started' : 'one_time_purchase',
                metadata: { plan: planToUse, sessionId: session.id },
            },
        });
    }

    private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
        const dbSubscription = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
        });

        if (!dbSubscription) return;

        const status = this.mapStripeStatus(subscription.status);

        await this.prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
                status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
        });
    }

    private async handlePaymentFailed(invoice: Stripe.Invoice) {
        if (!invoice.subscription) return;

        const subscription = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: invoice.subscription as string },
        });

        if (!subscription) return;

        await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' },
        });
    }

    private mapStripeStatus(
        status: Stripe.Subscription.Status
    ): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' {
        const statusMap: Record<string, 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED'> = {
            active: 'ACTIVE',
            canceled: 'CANCELED',
            past_due: 'PAST_DUE',
            trialing: 'TRIALING',
            incomplete: 'INCOMPLETE',
            incomplete_expired: 'INCOMPLETE_EXPIRED',
        };
        return statusMap[status] || 'ACTIVE';
    }

    private ensureStripeConfigured() {
        if (!this.stripe) {
            throw new BadRequestException(
                'Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment.'
            );
        }
    }
}
