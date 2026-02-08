'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';

interface DashboardStats {
    totalAnalyses: number;
    completedAnalyses: number;
    totalLeads: number;
    convertedLeads: number;
    subscribedLeads: number;
    conversionRate: number;
    subscriptionRate: number;
    totalCostCents: number;
    totalRevenueCents: number;
}

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    businessName: string;
    businessUrl: string;
    purchasedReport: boolean;
    subscribedMonthly: boolean;
    analysisCount?: number;
    createdAt: string;
}

interface AnalysisRun {
    id: string;
    businessName: string;
    businessUrl: string;
    competitorName?: string;
    competitorUrl: string;
    scope: string;
    yourScore?: number;
    competitorScore?: number;
    status: string;
    createdAt: string;
    completedAt?: string;
    totalCostCents?: number;
    purchasedFullReport: boolean;
    lead: Lead;
    costs?: { service: string; operation: string; costCents: number }[];
    aiConversations?: unknown;
    scoringFactors?: unknown;
}

interface UserAnalysis {
    id: string;
    businessName: string;
    businessUrl: string;
    competitorName: string | null;
    competitorUrl: string;
    yourScore: number | null;
    competitorScore: number | null;
    status: string;
    createdAt: string;
    completedAt: string | null;
    purchasedFullReport: boolean;
}

interface UserReportsData {
    lead: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        businessName: string;
        businessUrl: string;
        purchasedReport: boolean;
        subscribedMonthly: boolean;
        createdAt: string;
    };
    analyses: UserAnalysis[];
}

interface SystemError {
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    source: string;
    message: string;
    stackTrace?: string;
    context: Record<string, unknown>;
    notificationSent: boolean;
    notifiedAt?: string;
    status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'IGNORED';
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    resolution?: string;
    createdAt: string;
}

interface ErrorStats {
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    last24Hours: number;
}

// Helper function to safely extract hostname from URL
function safeHostname(url: string | undefined | null): string {
    if (!url) return 'unknown';
    try {
        return new URL(url).hostname;
    } catch {
        return url.replace(/^https?:\/\//, '').split('/')[0] || 'unknown';
    }
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'analyses' | 'leads' | 'costs' | 'notifications'>('overview');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [analyses, setAnalyses] = useState<AnalysisRun[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [costs, setCosts] = useState<{ service: string; totalCostCents: number; callCount: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRun | null>(null);
    const [selectedUserReports, setSelectedUserReports] = useState<UserReportsData | null>(null);
    // Separate pagination for analyses
    const [analysesPage, setAnalysesPage] = useState(1);
    const [analysesTotalPages, setAnalysesTotalPages] = useState(1);
    // Separate pagination for leads
    const [leadsPage, setLeadsPage] = useState(1);
    // Notifications state
    const [errors, setErrors] = useState<SystemError[]>([]);
    const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
    const [errorsPage, setErrorsPage] = useState(1);
    const [errorsTotalPages, setErrorsTotalPages] = useState(1);
    const [unreadErrorCount, setUnreadErrorCount] = useState(0);
    const [selectedError, setSelectedError] = useState<SystemError | null>(null);
    const [errorStatusFilter, setErrorStatusFilter] = useState<string>('');
    const [leadsTotalPages, setLeadsTotalPages] = useState(1);

    useEffect(() => {
        fetchStats();
        fetchAnalyses();
        fetchUnreadErrorCount();
    }, []);

    useEffect(() => {
        if (activeTab === 'leads') fetchLeads();
        if (activeTab === 'costs') fetchCosts();
        if (activeTab === 'notifications') {
            fetchErrors();
            fetchErrorStats();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/v1/admin/stats', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setStats(data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchAnalyses = async (p = 1) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/v1/admin/analyses?page=${p}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setAnalyses(data.data.runs);
                setAnalysesTotalPages(data.data.totalPages);
                setAnalysesPage(p);
            }
        } catch (error) {
            console.error('Failed to fetch analyses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLeads = async (p = 1) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/v1/admin/leads?page=${p}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setLeads(data.data.leads);
                setLeadsTotalPages(data.data.totalPages);
                setLeadsPage(p);
            }
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCosts = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/v1/admin/costs', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setCosts(data.data);
        } catch (error) {
            console.error('Failed to fetch costs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAnalysisDetails = async (id: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/v1/admin/analyses/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setSelectedAnalysis(data.data);
        } catch (error) {
            console.error('Failed to fetch analysis details:', error);
        }
    };

    // Admin refresh - bypasses paywall and re-runs analysis
    const refreshAnalysis = async (id: string) => {
        if (!confirm('Re-run this analysis? This will create a new report with fresh data.')) return;
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/v1/analysis/${id}/refresh?admin=true`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success && data.newAnalysisId) {
                alert(`Analysis refreshed! New ID: ${data.newAnalysisId}`);
                fetchAnalyses();
            } else {
                alert(data.message || 'Failed to refresh analysis');
            }
        } catch (error) {
            console.error('Failed to refresh analysis:', error);
            alert('Failed to refresh analysis');
        }
    };

    const fetchLeadAnalyses = async (leadId: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/v1/admin/leads/${leadId}/analyses`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setSelectedUserReports(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch lead analyses:', error);
        }
    };

    const exportLeads = async () => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/v1/admin/leads/export', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const csv = await res.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const fetchUnreadErrorCount = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/v1/admin/errors/unread-count', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setUnreadErrorCount(data.data.count);
        } catch (error) {
            console.error('Failed to fetch unread error count:', error);
        }
    };

    const fetchErrors = async (p = 1, status = errorStatusFilter) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            let url = `/api/v1/admin/errors?page=${p}&limit=20`;
            if (status) url += `&status=${status}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setErrors(data.data.errors);
                setErrorsTotalPages(data.data.totalPages);
                setErrorsPage(p);
            }
        } catch (error) {
            console.error('Failed to fetch errors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchErrorStats = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/v1/admin/errors/stats', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setErrorStats(data.data);
        } catch (error) {
            console.error('Failed to fetch error stats:', error);
        }
    };

    const acknowledgeError = async (errorId: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/v1/admin/errors/${errorId}/acknowledge`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                fetchErrors();
                fetchErrorStats();
                fetchUnreadErrorCount();
            }
        } catch (error) {
            console.error('Failed to acknowledge error:', error);
        }
    };

    const resolveError = async (errorId: string, resolution?: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/v1/admin/errors/${errorId}/resolve`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resolution }),
            });
            const data = await res.json();
            if (data.success) {
                fetchErrors();
                fetchErrorStats();
                fetchUnreadErrorCount();
                setSelectedError(null);
            }
        } catch (error) {
            console.error('Failed to resolve error:', error);
        }
    };

    const ignoreError = async (errorId: string, reason?: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/v1/admin/errors/${errorId}/ignore`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (data.success) {
                fetchErrors();
                fetchErrorStats();
                fetchUnreadErrorCount();
                setSelectedError(null);
            }
        } catch (error) {
            console.error('Failed to ignore error:', error);
        }
    };

    const getSeverityColor = (severity: string): string => {
        switch (severity) {
            case 'CRITICAL': return '#dc2626';
            case 'HIGH': return '#ef4444';
            case 'MEDIUM': return '#f59e0b';
            case 'LOW': return '#3b82f6';
            default: return '#6b7280';
        }
    };

    const getStatusBadge = (status: string): string => {
        switch (status) {
            case 'NEW': return '🔴';
            case 'ACKNOWLEDGED': return '👁️';
            case 'IN_PROGRESS': return '🔧';
            case 'RESOLVED': return '✅';
            case 'IGNORED': return '🚫';
            default: return '❓';
        }
    };

    const formatCurrency = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>
                        <span className={styles.icon}>📊</span>
                        Admin Dashboard
                    </h1>
                    <p className={styles.subtitle}>Analysis logs, leads, and API costs</p>
                </div>
            </header>

            <nav className={styles.tabs}>
                {[
                    { id: 'overview', label: 'Overview', icon: '📈' },
                    { id: 'analyses', label: 'Analyses', icon: '🔍' },
                    { id: 'leads', label: 'Leads', icon: '👥' },
                    { id: 'costs', label: 'Costs', icon: '💰' },
                    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadErrorCount },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab.id as any)}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        {'badge' in tab && tab.badge > 0 && (
                            <span style={{
                                marginLeft: '6px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                borderRadius: '9999px',
                                padding: '2px 8px',
                                fontSize: '12px',
                                fontWeight: 600,
                            }}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            <main className={styles.main}>
                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>🔍</div>
                            <div className={styles.statValue}>{stats.totalAnalyses}</div>
                            <div className={styles.statLabel}>Total Analyses</div>
                            <div className={styles.statSub}>{stats.completedAnalyses} completed</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>👥</div>
                            <div className={styles.statValue}>{stats.totalLeads}</div>
                            <div className={styles.statLabel}>Total Leads</div>
                            <div className={styles.statSub}>{stats.convertedLeads} converted</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>📊</div>
                            <div className={styles.statValue}>{stats.conversionRate.toFixed(1)}%</div>
                            <div className={styles.statLabel}>Conversion Rate</div>
                            <div className={styles.statSub}>{stats.subscriptionRate.toFixed(1)}% subscribed</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>💸</div>
                            <div className={styles.statValue}>{formatCurrency(stats.totalCostCents)}</div>
                            <div className={styles.statLabel}>API Costs</div>
                            <div className={styles.statSub}>Total spend</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.revenueCard}`}>
                            <div className={styles.statIcon}>💵</div>
                            <div className={styles.statValue}>{formatCurrency(stats.totalRevenueCents)}</div>
                            <div className={styles.statLabel}>Revenue</div>
                            <div className={styles.statSub}>From reports</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>📈</div>
                            <div className={styles.statValue}>
                                {stats.totalRevenueCents > 0 ?
                                    ((stats.totalRevenueCents - stats.totalCostCents) / stats.totalRevenueCents * 100).toFixed(1)
                                    : 0}%
                            </div>
                            <div className={styles.statLabel}>Margin</div>
                            <div className={styles.statSub}>Revenue - Costs</div>
                        </div>
                    </div>
                )}

                {/* Analyses Tab */}
                {activeTab === 'analyses' && (
                    <>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Business vs Competitor</th>
                                        <th>Lead</th>
                                        <th>Contact</th>
                                        <th>Scores</th>
                                        <th>Status</th>
                                        <th>Cost</th>
                                        <th>Conversion</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyses.map((run) => (
                                        <tr key={run.id}>
                                            <td className={styles.dateCell}>
                                                {formatDate(run.createdAt)}
                                            </td>
                                            <td className={styles.vsCell}>
                                                <div className={styles.businessName}>{run.businessName}</div>
                                                <div className={styles.vs}>vs</div>
                                                <div className={styles.competitorName}>
                                                    {run.competitorName || safeHostname(run.competitorUrl)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.leadName}>
                                                    {run.lead.firstName} {run.lead.lastName}
                                                </div>
                                            </td>
                                            <td className={styles.contactCell}>
                                                <a href={`mailto:${run.lead.email}`}>{run.lead.email}</a>
                                                <br />
                                                <a href={`tel:${run.lead.phone}`}>{run.lead.phone}</a>
                                            </td>
                                            <td className={styles.scoresCell}>
                                                {run.yourScore !== undefined && run.competitorScore !== undefined ? (
                                                    <span className={run.yourScore > run.competitorScore ? styles.winning : styles.losing}>
                                                        {run.yourScore} vs {run.competitorScore}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                <span className={`${styles.status} ${styles[`status_${run.status}`]}`}>
                                                    {run.status}
                                                </span>
                                            </td>
                                            <td className={styles.costCell}>
                                                {run.totalCostCents ? formatCurrency(run.totalCostCents) : '—'}
                                            </td>
                                            <td>
                                                <div className={styles.conversionBadges}>
                                                    {run.purchasedFullReport && (
                                                        <span className={styles.purchasedBadge}>💳 Purchased</span>
                                                    )}
                                                    {run.lead.subscribedMonthly && (
                                                        <span className={styles.subscribedBadge}>🔄 Subscribed</span>
                                                    )}
                                                    {!run.purchasedFullReport && !run.lead.subscribedMonthly && (
                                                        <span className={styles.freeBadge}>Free</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className={styles.viewBtn}
                                                        onClick={() => fetchAnalysisDetails(run.id)}
                                                    >
                                                        View
                                                    </button>
                                                    {run.status === 'complete' && (
                                                        <>
                                                            <button
                                                                onClick={() => refreshAnalysis(run.id)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                                                                    color: 'white',
                                                                    borderRadius: '6px',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                🔄 Refresh
                                                            </button>
                                                            <a
                                                                href={`/admin/preview/${run.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={styles.previewBtn}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                                                                    color: 'white',
                                                                    borderRadius: '6px',
                                                                    textDecoration: 'none',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                📊 Preview
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.pagination}>
                            <button
                                disabled={analysesPage === 1}
                                onClick={() => fetchAnalyses(analysesPage - 1)}
                            >
                                ← Previous
                            </button>
                            <span>Page {analysesPage} of {analysesTotalPages}</span>
                            <button
                                disabled={analysesPage === analysesTotalPages}
                                onClick={() => fetchAnalyses(analysesPage + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    </>
                )}

                {/* Leads Tab */}
                {activeTab === 'leads' && (
                    <>
                        <div className={styles.toolbar}>
                            <button className={styles.exportBtn} onClick={exportLeads}>
                                📥 Export CSV
                            </button>
                        </div>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Business</th>
                                        <th>Analyses</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr key={lead.id} className={styles.clickableRow}>
                                            <td className={styles.leadName}>
                                                {lead.firstName} {lead.lastName}
                                            </td>
                                            <td>
                                                <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}>{lead.email}</a>
                                            </td>
                                            <td>
                                                <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}>{lead.phone}</a>
                                            </td>
                                            <td>
                                                <div>{lead.businessName}</div>
                                                <a href={lead.businessUrl} target="_blank" rel="noopener" className={styles.urlLink} onClick={(e) => e.stopPropagation()}>
                                                    {safeHostname(lead.businessUrl)}
                                                </a>
                                            </td>
                                            <td className={styles.centerText}>{lead.analysisCount}</td>
                                            <td>
                                                <div className={styles.conversionBadges}>
                                                    {lead.subscribedMonthly && (
                                                        <span className={styles.subscribedBadge}>🔄 Member</span>
                                                    )}
                                                    {lead.purchasedReport && !lead.subscribedMonthly && (
                                                        <span className={styles.purchasedBadge}>💳 Paid</span>
                                                    )}
                                                    {!lead.purchasedReport && !lead.subscribedMonthly && (
                                                        <span className={styles.freeBadge}>Free</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={styles.dateCell}>
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.viewReportsBtn}
                                                    onClick={() => fetchLeadAnalyses(lead.id)}
                                                >
                                                    📊 View Reports
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Costs Tab */}
                {activeTab === 'costs' && (
                    <div className={styles.costsGrid}>
                        {costs.map((cost) => (
                            <div key={cost.service} className={styles.costCard}>
                                <div className={styles.costService}>
                                    {cost.service === 'anthropic' && '🤖'}
                                    {cost.service === 'firecrawl' && '🔥'}
                                    {cost.service === 'dataforseo' && '📊'}
                                    {cost.service === 'pagespeed' && '⚡'}
                                    {' '}{cost.service}
                                </div>
                                <div className={styles.costAmount}>{formatCurrency(cost.totalCostCents)}</div>
                                <div className={styles.costCalls}>{cost.callCount} API calls</div>
                            </div>
                        ))}
                        {costs.length === 0 && (
                            <div className={styles.noCosts}>No costs recorded yet</div>
                        )}
                    </div>
                )}

                {/* Analysis Details Modal */}
                {selectedAnalysis && (
                    <div className={styles.modalOverlay} onClick={() => setSelectedAnalysis(null)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <button className={styles.closeBtn} onClick={() => setSelectedAnalysis(null)}>✕</button>
                            <h2>Analysis Details</h2>

                            <section className={styles.modalSection}>
                                <h3>Lead Information</h3>
                                <div className={styles.detailGrid}>
                                    <div><strong>Name:</strong> {selectedAnalysis.lead.firstName} {selectedAnalysis.lead.lastName}</div>
                                    <div><strong>Email:</strong> {selectedAnalysis.lead.email}</div>
                                    <div><strong>Phone:</strong> {selectedAnalysis.lead.phone}</div>
                                    <div><strong>Business:</strong> {selectedAnalysis.businessName}</div>
                                </div>
                            </section>

                            <section className={styles.modalSection}>
                                <h3>Comparison</h3>
                                <div className={styles.comparisonBox}>
                                    <div className={styles.siteBox}>
                                        <div className={styles.siteLabel}>Your Site</div>
                                        <div className={styles.siteUrl}>{selectedAnalysis.businessUrl}</div>
                                        <div className={styles.siteScore}>{selectedAnalysis.yourScore || '—'}</div>
                                    </div>
                                    <div className={styles.vsBox}>VS</div>
                                    <div className={styles.siteBox}>
                                        <div className={styles.siteLabel}>Competitor</div>
                                        <div className={styles.siteUrl}>{selectedAnalysis.competitorUrl}</div>
                                        <div className={styles.siteScore}>{selectedAnalysis.competitorScore || '—'}</div>
                                    </div>
                                </div>
                            </section>

                            {selectedAnalysis.costs && selectedAnalysis.costs.length > 0 && (
                                <section className={styles.modalSection}>
                                    <h3>API Costs</h3>
                                    <div className={styles.costBreakdown}>
                                        {selectedAnalysis.costs.map((cost: any, i: number) => (
                                            <div key={i} className={styles.costRow}>
                                                <span>{cost.service} - {cost.operation}</span>
                                                <span>{formatCurrency(cost.costCents)}</span>
                                            </div>
                                        ))}
                                        <div className={styles.costTotal}>
                                            <strong>Total:</strong>
                                            <strong>{formatCurrency(selectedAnalysis.totalCostCents || 0)}</strong>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {selectedAnalysis.aiConversations && (
                                <section className={styles.modalSection}>
                                    <h3>AI Conversations</h3>
                                    <pre className={styles.jsonView}>
                                        {JSON.stringify(selectedAnalysis.aiConversations, null, 2)}
                                    </pre>
                                </section>
                            )}

                            {selectedAnalysis.scoringFactors && (
                                <section className={styles.modalSection}>
                                    <h3>Scoring Factors</h3>
                                    <pre className={styles.jsonView}>
                                        {JSON.stringify(selectedAnalysis.scoringFactors, null, 2)}
                                    </pre>
                                </section>
                            )}
                        </div>
                    </div>
                )}

                {/* User Reports Panel */}
                {selectedUserReports && (
                    <>
                        <div className={styles.panelOverlay} onClick={() => setSelectedUserReports(null)} />
                        <div className={styles.userReportsPanel}>
                            <div className={styles.panelHeader}>
                                <button className={styles.panelCloseBtn} onClick={() => setSelectedUserReports(null)}>✕</button>
                                <div className={styles.userHeader}>
                                    <div className={styles.userAvatar}>
                                        {selectedUserReports.lead.firstName.charAt(0)}{selectedUserReports.lead.lastName.charAt(0)}
                                    </div>
                                    <div className={styles.userInfo}>
                                        <h2>{selectedUserReports.lead.firstName} {selectedUserReports.lead.lastName}</h2>
                                        <p className={styles.userEmail}>{selectedUserReports.lead.email}</p>
                                        <p className={styles.userBusiness}>{selectedUserReports.lead.businessName}</p>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.panelContent}>
                                <div className={styles.analysesHeader}>
                                    <h3>🔍 Analysis Reports</h3>
                                    <span className={styles.analysesCount}>{selectedUserReports.analyses.length} reports</span>
                                </div>
                                {selectedUserReports.analyses.length === 0 ? (
                                    <div className={styles.noAnalyses}>
                                        <p>📭</p>
                                        <p>No analyses run yet</p>
                                    </div>
                                ) : (
                                    <div className={styles.analysesList}>
                                        {selectedUserReports.analyses.map((analysis) => {
                                            const getScoreClass = () => {
                                                if (analysis.yourScore === null || analysis.competitorScore === null) return '';
                                                if (analysis.yourScore > analysis.competitorScore) return 'winning';
                                                if (analysis.yourScore < analysis.competitorScore) return 'losing';
                                                return 'tied';
                                            };

                                            return (
                                                <div key={analysis.id} className={styles.analysisCard}>
                                                    <div className={styles.analysisVs}>
                                                        <p className={styles.analysisBrand}>{analysis.businessName}</p>
                                                        <p className={styles.analysisVsText}>vs</p>
                                                        <p className={styles.analysisCompetitor}>
                                                            {analysis.competitorName || new URL(analysis.competitorUrl).hostname}
                                                        </p>
                                                    </div>
                                                    <div className={styles.analysisMeta}>
                                                        <span className={styles.analysisDate}>
                                                            {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                        {analysis.yourScore !== null && analysis.competitorScore !== null && (
                                                            <span className={`${styles.analysisScores} ${styles[getScoreClass()]}`}>
                                                                {analysis.yourScore} vs {analysis.competitorScore}
                                                            </span>
                                                        )}
                                                        <span className={`${styles.status} ${styles[`status_${analysis.status}`]}`}>
                                                            {analysis.status}
                                                        </span>
                                                    </div>
                                                    {analysis.status === 'complete' ? (
                                                        <a
                                                            href={`/admin/preview/${analysis.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={styles.viewReportBtn}
                                                        >
                                                            📊 View Full Report
                                                        </a>
                                                    ) : (
                                                        <span className={`${styles.viewReportBtn} ${styles.viewReportBtnDisabled}`}>
                                                            {analysis.status === 'running' ? '⏳ In Progress...' : '📊 Report Unavailable'}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <>
                        {/* Error Stats Cards */}
                        {errorStats && (
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>🚨</div>
                                    <div className={styles.statValue}>{errorStats.total}</div>
                                    <div className={styles.statLabel}>Total Errors</div>
                                    <div className={styles.statSub}>{errorStats.last24Hours} in last 24h</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>🔴</div>
                                    <div className={styles.statValue}>{errorStats.byStatus['NEW'] || 0}</div>
                                    <div className={styles.statLabel}>New</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>🔧</div>
                                    <div className={styles.statValue}>{errorStats.byStatus['IN_PROGRESS'] || 0}</div>
                                    <div className={styles.statLabel}>In Progress</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>✅</div>
                                    <div className={styles.statValue}>{errorStats.byStatus['RESOLVED'] || 0}</div>
                                    <div className={styles.statLabel}>Resolved</div>
                                </div>
                            </div>
                        )}

                        {/* Filter Controls */}
                        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <label style={{ fontWeight: 500 }}>Filter by Status:</label>
                            <select
                                value={errorStatusFilter}
                                onChange={(e) => {
                                    setErrorStatusFilter(e.target.value);
                                    fetchErrors(1, e.target.value);
                                }}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                }}
                            >
                                <option value="">All</option>
                                <option value="NEW">New</option>
                                <option value="ACKNOWLEDGED">Acknowledged</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="IGNORED">Ignored</option>
                            </select>
                        </div>

                        {/* Error List Table */}
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Severity</th>
                                        <th>Type</th>
                                        <th>Source</th>
                                        <th>Message</th>
                                        <th>Time</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {errors.map((error) => (
                                        <tr key={error.id}>
                                            <td>
                                                <span title={error.status}>{getStatusBadge(error.status)}</span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    backgroundColor: getSeverityColor(error.severity),
                                                    color: 'white',
                                                    padding: '2px 8px',
                                                    borderRadius: '9999px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                }}>
                                                    {error.severity}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '13px' }}>
                                                {error.type.replace(/_/g, ' ')}
                                            </td>
                                            <td style={{ fontSize: '13px', color: '#6b7280' }}>
                                                {error.source}
                                            </td>
                                            <td style={{
                                                maxWidth: '300px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontSize: '13px',
                                            }}>
                                                {error.message}
                                            </td>
                                            <td style={{ fontSize: '12px', color: '#6b7280' }}>
                                                {formatDate(error.createdAt)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {error.status === 'NEW' && (
                                                        <button
                                                            onClick={() => acknowledgeError(error.id)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                background: '#3b82f6',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                            }}
                                                        >
                                                            👁️ Ack
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedError(error)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            background: '#6b7280',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                        }}
                                                    >
                                                        📋 View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {errorsTotalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    onClick={() => fetchErrors(errorsPage - 1)}
                                    disabled={errorsPage <= 1}
                                    className={styles.paginationBtn}
                                >
                                    ← Previous
                                </button>
                                <span>Page {errorsPage} of {errorsTotalPages}</span>
                                <button
                                    onClick={() => fetchErrors(errorsPage + 1)}
                                    disabled={errorsPage >= errorsTotalPages}
                                    className={styles.paginationBtn}
                                >
                                    Next →
                                </button>
                            </div>
                        )}

                        {/* Error Detail Modal */}
                        {selectedError && (
                            <div className={styles.modal} onClick={() => setSelectedError(null)}>
                                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className={styles.modalClose}
                                        onClick={() => setSelectedError(null)}
                                    >
                                        ×
                                    </button>
                                    <h2 style={{ marginBottom: '16px' }}>
                                        {getStatusBadge(selectedError.status)} Error Details
                                    </h2>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div>
                                            <strong>Severity:</strong>{' '}
                                            <span style={{
                                                backgroundColor: getSeverityColor(selectedError.severity),
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '9999px',
                                                fontSize: '12px',
                                            }}>
                                                {selectedError.severity}
                                            </span>
                                        </div>
                                        <div><strong>Type:</strong> {selectedError.type.replace(/_/g, ' ')}</div>
                                        <div><strong>Source:</strong> {selectedError.source}</div>
                                        <div><strong>Status:</strong> {selectedError.status}</div>
                                        <div><strong>Time:</strong> {formatDate(selectedError.createdAt)}</div>
                                        <div>
                                            <strong>Message:</strong>
                                            <p style={{
                                                background: '#fef3c7',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                marginTop: '8px',
                                            }}>
                                                {selectedError.message}
                                            </p>
                                        </div>
                                        {selectedError.stackTrace && (
                                            <div>
                                                <strong>Stack Trace:</strong>
                                                <pre style={{
                                                    background: '#1f2937',
                                                    color: '#e5e7eb',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    overflow: 'auto',
                                                    fontSize: '11px',
                                                    maxHeight: '200px',
                                                    marginTop: '8px',
                                                }}>
                                                    {selectedError.stackTrace}
                                                </pre>
                                            </div>
                                        )}
                                        {Object.keys(selectedError.context).length > 0 && (
                                            <div>
                                                <strong>Context:</strong>
                                                <pre style={{
                                                    background: '#f3f4f6',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    overflow: 'auto',
                                                    fontSize: '12px',
                                                    maxHeight: '200px',
                                                    marginTop: '8px',
                                                }}>
                                                    {JSON.stringify(selectedError.context, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {selectedError.resolution && (
                                            <div>
                                                <strong>Resolution:</strong>
                                                <p style={{ color: '#16a34a' }}>{selectedError.resolution}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{
                                        marginTop: '24px',
                                        display: 'flex',
                                        gap: '12px',
                                        justifyContent: 'flex-end',
                                    }}>
                                        {selectedError.status !== 'RESOLVED' && selectedError.status !== 'IGNORED' && (
                                            <>
                                                <button
                                                    onClick={() => resolveError(selectedError.id, 'Resolved via admin dashboard')}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: '#16a34a',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    ✅ Mark Resolved
                                                </button>
                                                <button
                                                    onClick={() => ignoreError(selectedError.id, 'Ignored via admin dashboard')}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: '#6b7280',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    🚫 Ignore
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => setSelectedError(null)}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#e5e7eb',
                                                color: '#374151',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

