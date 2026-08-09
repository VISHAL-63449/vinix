import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { supabase } from '../utils/supabase';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'ADMIN';
    skills: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role?: string) => Promise<void>;
    logout: () => void;
    updateProfile: (name: string, skills: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('vionix_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMe = async () => {
            const storedToken = localStorage.getItem('vionix_token');
            if (storedToken) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch (error) {
                    console.error('Failed to authenticate token:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        fetchMe();
    }, [token]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            // 1. Authenticate with Supabase Auth (with network fallback)
            let sbUser: any = null;
            try {
                const { data, error: sbError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (sbError) {
                    console.warn('Supabase authentication warning:', sbError.status, sbError.message);
                } else if (data?.user) {
                    sbUser = data.user;
                }
            } catch (err: any) {
                console.warn('Supabase offline or unreachable. Proceeding to check Local repository.', err.message);
            }

            // 2. Authenticate with Local Server
            try {
                const res = await api.post('/auth/login', { email, password });
                const { token: receivedToken, user: receivedUser } = res.data;
                localStorage.setItem('vionix_token', receivedToken);
                setToken(receivedToken);
                setUser(receivedUser);
            } catch (localErr: any) {
                // If local login fails but we did authenticate with Supabase, auto-create local record
                if (sbUser) {
                    try {
                        const name = sbUser.user_metadata?.name || email.split('@')[0];
                        const role = sbUser.user_metadata?.role || 'STUDENT';

                        const registerRes = await api.post('/auth/register', { name, email, password, role });
                        const { token: receivedToken, user: receivedUser } = registerRes.data;
                        localStorage.setItem('vionix_token', receivedToken);
                        setToken(receivedToken);
                        setUser(receivedUser);
                    } catch (syncErr: any) {
                        throw new Error(syncErr.response?.data?.message || syncErr.message || 'Authentication synchronization failed.');
                    }
                } else {
                    throw localErr;
                }
            }
        } catch (error: any) {
            setLoading(false);
            throw new Error(error.response?.data?.message || error.message || 'Login failed.');
        }
    };

    const register = async (name: string, email: string, password: string, role = 'STUDENT') => {
        setLoading(true);
        try {
            // 1. Register user on Supabase Auth (with network fallback)
            let isAlreadyRegistered = false;
            try {
                const { error: sbError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name, role }
                    }
                });
                if (sbError) {
                    if (sbError.status === 400 || sbError.status === 422 || sbError.message?.includes('already')) {
                        isAlreadyRegistered = true;
                    } else {
                        console.warn('Supabase registration warning:', sbError);
                    }
                }
            } catch (err: any) {
                if (err.status === 400 || err.status === 422 || err.message?.includes('already')) {
                    isAlreadyRegistered = true;
                } else {
                    console.warn('Supabase offline or unreachable. Registering user on Local/Mock database only.');
                }
            }

            if (isAlreadyRegistered) {
                // Check if they can log in to that account on Supabase (validating password)
                try {
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });
                    if (signInError) {
                        const msg = signInError.message?.toLowerCase() || '';
                        if (msg.includes('confirm') || msg.includes('verification')) {
                            // Password is correct, but email is not confirmed yet. Allow recovery of local DB sync.
                        } else {
                            throw new Error('This email is already registered. If you are the owner, please use the correct password.');
                        }
                    }
                } catch (signInErr: any) {
                    const msg = signInErr.message?.toLowerCase() || '';
                    if (!msg.includes('confirm') && !msg.includes('verification')) {
                        throw new Error(signInErr.message || 'This email is already registered. If you are the owner, please use the correct password.');
                    }
                }
            }

            // 2. Save user on the Database through Local Server
            const res = await api.post('/auth/register', { name, email, password, role });
            const { token: receivedToken, user: receivedUser } = res.data;
            localStorage.setItem('vionix_token', receivedToken);
            setToken(receivedToken);
            setUser(receivedUser);
        } catch (error: any) {
            setLoading(false);
            throw new Error(error.response?.data?.message || error.message || 'Registration failed.');
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Failed to sign out from Supabase Auth:', err);
        }
        localStorage.removeItem('vionix_token');
        setToken(null);
        setUser(null);
        setLoading(false);
    };


    const updateProfile = async (name: string, skills: string[]) => {
        try {
            const res = await api.put('/auth/profile', { name, skills });
            setUser(res.data);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update profile.');
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
