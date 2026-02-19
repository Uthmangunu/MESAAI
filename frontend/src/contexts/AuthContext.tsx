import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, MeResponse } from '../lib/api';

interface AuthContextType {
    user: MeResponse | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, orgName: string) => Promise<{ message: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<MeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount, restore session from localStorage
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            api.auth.me()
                .then((data) => setUser(data))
                .catch(() => {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const data = await api.auth.login(email, password);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        // Fetch full user profile after login
        const me = await api.auth.me();
        setUser(me);
    }, []);

    const signup = useCallback(async (email: string, password: string, orgName: string) => {
        return api.auth.signup(email, password, orgName);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
