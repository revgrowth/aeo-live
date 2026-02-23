import { AuthTokens, AuthUser, ApiResponse } from '@aeo-live/shared';

// Always use same-origin relative URLs on the client.
// Requests to /api/v1/* are proxied to the backend by next.config.js rewrites.
const API_URL = '';

class ApiClient {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.accessToken = localStorage.getItem('accessToken');
            this.refreshToken = localStorage.getItem('refreshToken');
        }
    }

    setTokens(tokens: AuthTokens | null) {
        if (tokens) {
            this.accessToken = tokens.accessToken;
            this.refreshToken = tokens.refreshToken;
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
        } else {
            this.accessToken = null;
            this.refreshToken = null;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${API_URL}/api/v1${endpoint}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.accessToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                // Try to refresh token on 401
                if (response.status === 401 && this.refreshToken) {
                    const refreshed = await this.refreshTokens();
                    if (refreshed) {
                        // Retry the request
                        return this.request<T>(endpoint, options);
                    }
                }

                return {
                    success: false,
                    error: {
                        code: data.error?.code || 'UNKNOWN_ERROR',
                        message: data.message || 'An error occurred',
                    },
                };
            }

            // If response already has success property, return as-is
            // Otherwise wrap raw data in ApiResponse format
            if ('success' in data) {
                return data as ApiResponse<T>;
            }

            return {
                success: true,
                data: data as T,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Network error',
                },
            };
        }
    }

    private async refreshTokens(): Promise<boolean> {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            if (!response.ok) {
                this.setTokens(null);
                return false;
            }

            const data = await response.json();
            if (data.success && data.data?.tokens) {
                this.setTokens(data.data.tokens);
                return true;
            }

            return false;
        } catch {
            this.setTokens(null);
            return false;
        }
    }

    // Auth endpoints
    async register(data: { email: string; password: string; name?: string; claimCode?: string }) {
        return this.request<{ user: AuthUser; tokens: AuthTokens }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(data: { email: string; password: string }) {
        return this.request<{ user: AuthUser; tokens: AuthTokens }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async logout() {
        const result = await this.request<{ message: string }>('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
        this.setTokens(null);
        return result;
    }

    async getMe() {
        return this.request<{ user: AuthUser }>('/auth/me');
    }

    async forgotPassword(email: string) {
        return this.request<{ message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token: string, password: string) {
        return this.request<{ message: string }>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        });
    }

    async deleteAccount() {
        const result = await this.request<{ message: string }>('/auth/account', {
            method: 'DELETE',
        });
        // Clear tokens after account deletion
        this.setTokens(null);
        return result;
    }

    // Claim Codes
    async validateClaimCode(code: string) {
        return this.request<{ valid: boolean; domain: string | null; status?: string }>(
            `/claim-codes/${encodeURIComponent(code)}/validate`,
        );
    }

    async redeemClaimCode(code: string) {
        return this.request<{ projectId: string; domain: string }>('/claim-codes/redeem', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    }

    // Projects
    async getProjects() {
        return this.request<{ id: string; name: string; primaryDomain: string }[]>('/projects');
    }

    async createProject(data: { name: string; primaryDomain: string; competitors?: string[] }) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getProject(id: string) {
        return this.request(`/projects/${id}`);
    }

    // Audits
    async createAudit(projectId: string) {
        return this.request(`/projects/${projectId}/audits`, {
            method: 'POST',
        });
    }

    async getAuditStatus(auditId: string) {
        return this.request(`/audits/${auditId}/status`);
    }

    async getAuditResults(auditId: string) {
        return this.request(`/audits/${auditId}/results`);
    }

    // Billing
    async getSubscription() {
        return this.request('/billing/subscription');
    }

    async createCheckout(plan: string, isSubscription: boolean) {
        return this.request<{ url: string }>('/billing/checkout', {
            method: 'POST',
            body: JSON.stringify({ plan, isSubscription }),
        });
    }

    // Health
    async healthCheck() {
        return this.request('/health');
    }

    // Free Analysis (no auth required)
    async startFreeAnalysis(data: {
        url: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        businessName: string;
        scope?: 'local' | 'national';
    }) {
        return this.request<{ analysisId: string; token: string }>('/analysis/free', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getCompetitorSuggestions(analysisId: string, token: string, scope?: 'local' | 'national') {
        const scopeParam = scope ? `&scope=${scope}` : '';
        return this.request<{ domain: string; name: string; similarity?: number }[]>(
            `/analysis/${analysisId}/competitors?token=${token}${scopeParam}`
        );
    }

    async selectCompetitorAndAnalyze(analysisId: string, token: string, competitorUrl: string) {
        return this.request<{ status: string }>(
            `/analysis/${analysisId}/competitor?token=${token}`,
            {
                method: 'POST',
                body: JSON.stringify({ competitorUrl }),
            }
        );
    }

    async getAnalysisStatus(analysisId: string, token: string) {
        return this.request<{
            analysisId: string;
            status: 'pending' | 'crawling' | 'analyzing' | 'complete' | 'failed';
            progress: number;
            message?: string;
        }>(`/analysis/${analysisId}/status?token=${token}`);
    }

    async getTeaserResults(analysisId: string, token: string) {
        return this.request<{
            analysisId: string;
            yourUrl: string;
            competitorUrl: string;
            yourScore: number;
            competitorScore: number;
            categories: {
                name: string;
                icon: string;
                yourTeaser: string;
                competitorTeaser: string;
                locked: boolean;
            }[];
            createdAt: string;
        }>(`/analysis/${analysisId}/teaser?token=${token}`);
    }

    // ===== CHECKOUT & BILLING =====

    // Create checkout session for tier purchase
    async createCheckoutSession(data: {
        tier: string;
        billingType: 'onetime' | 'subscription';
        analysisId?: string;
    }) {
        return this.request<{ url: string }>('/billing/checkout/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Create add-on checkout (for subscribers or non-subscribers)
    async createAddonCheckout(analysisId?: string) {
        return this.request<{ url: string; price: number }>('/billing/checkout/addon', {
            method: 'POST',
            body: JSON.stringify({ analysisId }),
        });
    }

    // Verify checkout session after redirect
    async verifyCheckoutSession(sessionId: string) {
        return this.request<{
            type: 'report' | 'subscription';
            tier: string;
            reportId?: string;
        }>(`/billing/checkout/verify?session_id=${sessionId}`);
    }

    // Get user's subscription status
    async getSubscriptionStatus() {
        return this.request<{
            plan: string | null;
            status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | null;
            currentPeriodEnd?: string;
            cancelAtPeriodEnd?: boolean;
            addOnPrice?: number;
        }>('/billing/subscription');
    }

    // Get user's purchased reports
    async getUserReports() {
        return this.request<{
            reports: {
                id: string;
                analysisId: string;
                yourUrl: string;
                competitorUrl: string;
                yourScore: number;
                competitorScore: number;
                createdAt: string;
                tier: string;
                isPurchased: boolean;
            }[];
        }>('/billing/reports');
    }

    // Get subscriber's history with trends
    async getSubscriberHistory() {
        return this.request<{
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
        }>('/billing/history');
    }

    // Get full report (after purchase)
    async getFullReport(analysisId: string) {
        return this.request<{
            analysisId: string;
            yourUrl: string;
            competitorUrl: string;
            yourScore: number;
            competitorScore: number;
            categories: {
                name: string;
                icon: string;
                yourScore: number;
                competitorScore: number;
                insights: string[];
                recommendations: string[];
            }[];
            aiSummary: string;
            recommendations: {
                priority: 'high' | 'medium' | 'low';
                title: string;
                description: string;
                impact: string;
            }[];
            createdAt: string;
        }>(`/analysis/${analysisId}/full`);
    }

    // Create Stripe portal session for managing subscription
    async createPortalSession() {
        return this.request<{ url: string }>('/billing/portal', {
            method: 'POST',
        });
    }
}

export const api = new ApiClient();

