'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser } from '@aeo-live/shared';
import { api } from './api';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.getMe();
            if (response.success && response.data?.user) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            if (typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
                await refreshUser();
            }
            setIsLoading(false);
        };
        initAuth();
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        const response = await api.login({ email, password });
        if (!response.success) {
            throw new Error(response.error?.message || 'Login failed');
        }
        if (response.data) {
            api.setTokens(response.data.tokens);
            setUser(response.data.user);
        }
    };

    const register = async (email: string, password: string, name?: string) => {
        const response = await api.register({ email, password, name });
        if (!response.success) {
            throw new Error(response.error?.message || 'Registration failed');
        }
        if (response.data) {
            api.setTokens(response.data.tokens);
            setUser(response.data.user);
        }
    };

    const logout = async () => {
        await api.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
