import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient, supabase } from '@/api/supabaseClient';

export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "gerente" | "funcionario" | string;
    change_password_required?: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        try {
            setIsLoading(true);
            const storedUser = localStorage.getItem('auth_user');
            const storedToken = localStorage.getItem('auth_token');

            if (storedUser && storedToken && storedUser !== 'undefined' && storedUser !== 'null') {
                const parsed = JSON.parse(storedUser);
                // Optimistically set user from storage
                setUser(parsed);

                // Sync token with Native Supabase Client for direct direct direct direct DB access (Notifications, etc)
                if (storedToken) {
                    supabase.auth.setSession({
                        access_token: storedToken,
                        refresh_token: '',
                    }).catch(err => console.error('Error syncing Supabase session:', err));
                }

                // Then verify/refresh in background
                try {
                    // Try /me (backend permissions module handles this at /api/me)
                    const res = await supabaseClient.get('/me').catch(async () => {
                        console.log('DEBUG: /auth/me failed, trying /users/id');
                        return await supabaseClient.get(`/users/${parsed.id}`);
                    });

                    if (res) {
                        // Refresh data (role might have changed)
                        const updatedUser = { ...parsed, ...res };
                        if (JSON.stringify(updatedUser) !== storedUser) {
                            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
                            setUser(updatedUser);
                        }
                    }
                } catch (error) {
                    // Verification failed but token might still be valid (or just a network issue)
                    console.error('Session verification failed, keeping cached user:', error);
                    // We don't clear user here to avoid aggressive redirects on refresh
                }
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (userData: User) => {
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        supabase.auth.signOut();
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
