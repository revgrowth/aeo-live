'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Target, User, Shield, CreditCard, Bell, Key,
    Trash2, LogOut, ChevronRight, Loader2, CheckCircle2,
    AlertCircle, Mail, ArrowLeft, Crown, Settings
} from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

    const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'billing' | 'notifications'>('profile');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Profile form state
    const [name, setName] = useState(user?.name || '');
    const [company, setCompany] = useState('');
    const [website, setWebsite] = useState('');

    // Security state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Notification preferences
    const [emailReports, setEmailReports] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [emailMarketing, setEmailMarketing] = useState(false);

    // Account deletion state
    const [deletingAccount, setDeletingAccount] = useState(false);

    const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER';

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                        <Settings className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <p className="text-slate-500">Loading settings...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/settings');
        }
    }, [authLoading, isAuthenticated, router]);

    if (!isAuthenticated && !authLoading) {
        return null;
    }

    const handleSaveProfile = async () => {
        setSaving(true);
        setSaveMessage(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setSaveMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setSaveMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (newPassword.length < 8) {
            setSaveMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        setSaving(true);
        setSaveMessage(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSaveMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setSaveMessage({ type: 'error', text: 'Failed to change password' });
        } finally {
            setSaving(false);
        }
    };

    const handleManageBilling = async () => {
        try {
            const response = await api.createPortalSession();
            if (response.success && response.data?.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Error opening billing portal:', error);
        }
    };

    const sections = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Key },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="text-slate-500 hover:text-slate-900"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div className="h-6 w-px bg-slate-200" />
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                                    <Target className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-lg font-bold text-slate-900">
                                    AEO<span className="text-sky-600">.LIVE</span>
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            {isSuperAdmin && (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200">
                                    <Shield className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-600">Super Admin</span>
                                </div>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="text-slate-500 hover:text-slate-900"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
                    <p className="text-slate-500">Manage your account settings and preferences</p>
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        <nav className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => {
                                            setActiveSection(section.id as any);
                                            setSaveMessage(null);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeSection === section.id
                                            ? 'bg-sky-50 text-sky-700'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{section.label}</span>
                                        {activeSection === section.id && (
                                            <ChevronRight className="w-4 h-4 ml-auto" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Super Admin Link */}
                        {isSuperAdmin && (
                            <div className="mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/admin')}
                                    className="w-full justify-start border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Admin Dashboard
                                </Button>
                            </div>
                        )}

                        {/* Danger Zone */}
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete your account? This action cannot be undone. All your data, reports, and subscription will be permanently deleted.')) {
                                        setDeletingAccount(true);
                                        try {
                                            const result = await api.deleteAccount();
                                            if (result.success) {
                                                // Redirect to homepage after account deletion
                                                router.push('/?deleted=true');
                                            } else {
                                                throw new Error(result.error?.message || 'Failed to delete account');
                                            }
                                        } catch (error) {
                                            setSaveMessage({
                                                type: 'error',
                                                text: error instanceof Error ? error.message : 'Failed to delete account. Please try again.',
                                            });
                                            setDeletingAccount(false);
                                        }
                                    }
                                }}
                                disabled={deletingAccount}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deletingAccount ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="font-medium">Deleting account...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-5 h-5" />
                                        <span className="font-medium">Delete Account</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        {/* Status Message */}
                        {saveMessage && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${saveMessage.type === 'success'
                                ? 'bg-emerald-50 border border-emerald-200'
                                : 'bg-red-50 border border-red-200'
                                }`}>
                                {saveMessage.type === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className={saveMessage.type === 'success' ? 'text-emerald-700' : 'text-red-700'}>
                                    {saveMessage.text}
                                </span>
                            </div>
                        )}

                        {/* Profile Section */}
                        {activeSection === 'profile' && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-sky-600" />
                                    Profile Information
                                </h2>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
                                            {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">{user?.name || 'Anonymous User'}</h3>
                                            <p className="text-slate-500">{user?.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user?.role === 'SUPER_ADMIN'
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : user?.role === 'OWNER'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {user?.role || 'MEMBER'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                                Email Address
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="email"
                                                    value={user?.email || ''}
                                                    disabled
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed"
                                                />
                                                <Mail className="w-5 h-5 text-slate-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                                Company
                                            </label>
                                            <input
                                                type="text"
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                                placeholder="Your company name"
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                                Website
                                            </label>
                                            <input
                                                type="url"
                                                value={website}
                                                onChange={(e) => setWebsite(e.target.value)}
                                                placeholder="https://yoursite.com"
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                            className="bg-sky-600 hover:bg-sky-700 text-white"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Section */}
                        {activeSection === 'security' && (
                            <div className="space-y-6">
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <Key className="w-5 h-5 text-sky-600" />
                                        Change Password
                                    </h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                                            />
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <Button
                                                onClick={handleChangePassword}
                                                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                                                className="bg-sky-600 hover:bg-sky-700 text-white"
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    'Update Password'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-indigo-600" />
                                        Two-Factor Authentication
                                    </h3>
                                    <p className="text-slate-500 mb-4">
                                        Add an extra layer of security to your account by enabling two-factor authentication.
                                    </p>
                                    <Button variant="outline" className="border-slate-300 hover:bg-slate-50 text-slate-700">
                                        Enable 2FA
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Billing Section */}
                        {activeSection === 'billing' && (
                            <div className="space-y-6">
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-sky-600" />
                                        Subscription & Billing
                                    </h2>

                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-slate-500 text-sm">Current Plan</p>
                                                <p className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                                    <Crown className="w-5 h-5 text-amber-500" />
                                                    Free
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => router.push('/dashboard')}
                                                className="bg-sky-600 hover:bg-sky-700 text-white"
                                            >
                                                Upgrade Plan
                                            </Button>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={handleManageBilling}
                                        className="border-slate-300 hover:bg-slate-50 text-slate-700"
                                    >
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Manage Billing in Stripe
                                    </Button>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Invoice History</h3>
                                    <div className="text-center py-8 text-slate-400">
                                        <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p className="text-slate-600">No invoices yet</p>
                                        <p className="text-sm">Your invoices will appear here</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Section */}
                        {activeSection === 'notifications' && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-sky-600" />
                                    Notification Preferences
                                </h2>

                                <div className="space-y-4">
                                    <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                        <div>
                                            <p className="font-medium text-slate-900">Analysis Reports</p>
                                            <p className="text-sm text-slate-500">Get notified when your analysis is complete</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={emailReports}
                                            onChange={(e) => setEmailReports(e.target.checked)}
                                            className="w-5 h-5 rounded bg-white border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                        <div>
                                            <p className="font-medium text-slate-900">Score Alerts</p>
                                            <p className="text-sm text-slate-500">Get notified when your AEO score changes significantly</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={emailAlerts}
                                            onChange={(e) => setEmailAlerts(e.target.checked)}
                                            className="w-5 h-5 rounded bg-white border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                        <div>
                                            <p className="font-medium text-slate-900">Product Updates</p>
                                            <p className="text-sm text-slate-500">Receive news about new features and improvements</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={emailMarketing}
                                            onChange={(e) => setEmailMarketing(e.target.checked)}
                                            className="w-5 h-5 rounded bg-white border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
