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
        const initAuth = async () => {
            console.log("[AuthContext] Initializing auth session check...");
            setLoading(true);
            try {
                // 1. Fetch current user session from Supabase first
                const { data: { user: sbUser } } = await supabase.auth.getUser();
                console.log("[AuthContext] CURRENT AUTH USER on init:", sbUser);

                if (sbUser) {
                    console.log("[AuthContext] Restoring login details for user:", sbUser.id);
                    try {
                        const res = await api.get('/auth/me');
                        setUser(res.data);
                    } catch (err) {
                        console.warn("[AuthContext] Local /me endpoint failed, reconstructing from Supabase profile metadata:", err);
                        setUser({
                            id: sbUser.id,
                            name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Student',
                            email: sbUser.email || '',
                            role: sbUser.user_metadata?.role || 'STUDENT',
                            skills: []
                        });
                    }
                } else {
                    // Fall back to local check (e.g. mock user or local account without Supabase sync)
                    const storedToken = localStorage.getItem('vionix_token');
                    if (storedToken) {
                        try {
                            const res = await api.get('/auth/me');
                            setUser(res.data);
                        } catch (error) {
                            console.error('[AuthContext] Failed to get local profile of stored token:', error);
                            // Do not call logout() which could clear local token if connection is transiently offline
                        }
                    }
                }
            } catch (err) {
                console.error("[AuthContext] Auth session initialization skipped/error:", err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for Supabase authorization state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("[AuthContext] SUPABASE AUTH EVENT TRIGGERED:", event);
            console.log("SESSION USER:", session?.user?.id);

            if (event === 'SIGNED_IN' && session?.user) {
                const sbUser = session.user;
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch (err) {
                    console.warn("[AuthContext] Syncing on signed_in event failed, setting local state to Supabase profile:", err);
                    setUser({
                        id: sbUser.id,
                        name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Student',
                        email: sbUser.email || '',
                        role: sbUser.user_metadata?.role || 'STUDENT',
                        skills: []
                    });
                }
            } else if (event === 'SIGNED_OUT') {
                console.log("[AuthContext] User log out event received.");
                setUser(null);
                setToken(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        console.log("[AuthContext] Initiating login for:", email);
        try {
            // 1. Authenticate with Supabase Auth
            let sbUser: Record<string, unknown> | null = null;
            try {
                const { data, error: sbError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (sbError) {
                    console.warn('[AuthContext] Supabase login error status:', sbError.status, sbError.message);
                } else if (data?.user) {
                    sbUser = data.user as unknown as Record<string, unknown>;
                    console.log('[AuthContext] Supabase login success:', sbUser.id);
                }
            } catch (err) {
                console.warn('[AuthContext] Supabase offline/error, proceeding with local auth:', (err as Error).message);
            }

            // 2. Authenticate with Local Server
            try {
                console.log("[AuthContext] Authenticating with local server...");
                const res = await api.post('/auth/login', { email, password });
                const { token: receivedToken, user: receivedUser } = res.data;
                console.log("[AuthContext] Local server authentication success for role:", receivedUser.role);
                localStorage.setItem('vionix_token', receivedToken);
                setToken(receivedToken);
                setUser(receivedUser);
            } catch (localErr) {
                const errObj = localErr as Record<string, unknown>;
                const responseObj = errObj.response as Record<string, unknown> | undefined;
                const dataObj = responseObj?.data as Record<string, unknown> | undefined;
                console.warn("[AuthContext] Local login failed:", (dataObj?.message as string) || (errObj.message as string));
                // If local login fails but we did authenticate with Supabase, auto-create local record
                if (sbUser) {
                    try {
                        console.log("[AuthContext] Syncing Supabase user to local DB...");
                        const metadata = sbUser.user_metadata as Record<string, unknown> | undefined;
                        const name = metadata?.name as string | undefined || email.split('@')[0];
                        const role = metadata?.role as string | undefined || 'STUDENT';

                        const registerRes = await api.post('/auth/register', { id: sbUser.id as string, name, email, password, role });
                        const { token: receivedToken, user: receivedUser } = registerRes.data;
                        console.log("[AuthContext] Sync completed, logged in local user:", receivedUser.id);
                        localStorage.setItem('vionix_token', receivedToken);
                        setToken(receivedToken);
                        setUser(receivedUser);
                    } catch (syncErr) {
                        const errObjSync = syncErr as Record<string, unknown>;
                        const responseObjSync = errObjSync.response as Record<string, unknown> | undefined;
                        const dataObjSync = responseObjSync?.data as Record<string, unknown> | undefined;
                        throw new Error((dataObjSync?.message as string) || (errObjSync.message as string) || 'Authentication synchronization failed.');
                    }
                } else {
                    throw localErr;
                }
            }
        } catch (error) {
            setLoading(false);
            console.error("[AuthContext] Login failed with error:", error);
            const errObj = error as Record<string, unknown>;
            const responseObj = errObj.response as Record<string, unknown> | undefined;
            const dataObj = responseObj?.data as Record<string, unknown> | undefined;
            throw new Error((dataObj?.message as string) || (errObj.message as string) || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string, role = 'STUDENT') => {
        setLoading(true);
        try {
            // 1. Register user on Supabase Auth
            let sbUserId: string | undefined = undefined;
            let isAlreadyRegistered = false;
            try {
                const { data: sbSignUpData, error: sbError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name, role }
                    }
                });
                if (sbSignUpData?.user) {
                    sbUserId = sbSignUpData.user.id;
                }
                if (sbError) {
                    if (sbError.status === 400 || sbError.status === 422 || sbError.message?.includes('already')) {
                        isAlreadyRegistered = true;
                    } else {
                        console.warn('Supabase registration warning:', sbError);
                    }
                }
            } catch (err) {
                const errObj = err as Record<string, unknown>;
                const status = errObj.status as number | undefined;
                const msg = errObj.message as string | undefined;
                if (status === 400 || status === 422 || msg?.includes('already')) {
                    isAlreadyRegistered = true;
                } else {
                    console.warn('Supabase offline or unreachable. Registering user on Local/Mock database only.');
                }
            }

            if (isAlreadyRegistered) {
                // Check if they can log in to that account on Supabase (validating password)
                try {
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });
                    if (signInData?.user) {
                        sbUserId = signInData.user.id;
                    }
                    if (signInError) {
                        const msg = signInError.message?.toLowerCase() || '';
                        if (msg.includes('confirm') || msg.includes('verification')) {
                            // Password is correct, but email is not confirmed yet. Allow recovery of local DB sync.
                        } else {
                            throw new Error('This email is already registered. If you are the owner, please use the correct password.');
                        }
                    }
                } catch (signInErr) {
                    const errObj = signInErr as Record<string, unknown>;
                    const msg = (errObj.message as string | undefined)?.toLowerCase() || '';
                    if (!msg.includes('confirm') && !msg.includes('verification')) {
                        throw new Error((errObj.message as string) || 'This email is already registered. If you are the owner, please use the correct password.');
                    }
                }
            }

            // 2. Save user on the Database through Local Server (passing custom Supabase UUID id)
            const res = await api.post('/auth/register', { id: sbUserId, name, email, password, role });
            const { token: receivedToken, user: receivedUser } = res.data;
            localStorage.setItem('vionix_token', receivedToken);
            setToken(receivedToken);
            setUser(receivedUser);
        } catch (error) {
            setLoading(false);
            const errObj = error as Record<string, unknown>;
            const responseObj = errObj.response as Record<string, unknown> | undefined;
            const dataObj = responseObj?.data as Record<string, unknown> | undefined;
            throw new Error((dataObj?.message as string) || (errObj.message as string) || 'Registration failed.');
        } finally {
            setLoading(false);
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
        } catch (error) {
            const errObj = error as Record<string, unknown>;
            const responseObj = errObj.response as Record<string, unknown> | undefined;
            const dataObj = responseObj?.data as Record<string, unknown> | undefined;
            throw new Error((dataObj?.message as string) || 'Failed to update profile.');
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
