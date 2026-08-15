import React, { createContext, useContext, useState, useEffect } from 'react';
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
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAndSyncProfile = async (sbUser: any) => {
        if (!sbUser) return null;
        try {
            // Check if profile exists
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sbUser.id)
                .maybeSingle();

            if (error) throw error;

            let finalProfile = profile;
            if (!finalProfile) {
                // Try backfilling profile
                const fullName = sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'New Student';
                const email = sbUser.email || '';
                const role = sbUser.user_metadata?.role || 'student';

                const { data: inserted, error: insertErr } = await supabase
                    .from('profiles')
                    .insert({
                        id: sbUser.id,
                        full_name: fullName,
                        email: email,
                        role: role
                    })
                    .select()
                    .single();

                if (insertErr) {
                    console.warn('[AuthContext] Profile backfill insert error:', insertErr);
                } else {
                    finalProfile = inserted;
                }
            }

            const mappedRole = (finalProfile?.role === 'admin' || finalProfile?.role === 'founder') ? 'ADMIN' : 'STUDENT';
            return {
                id: sbUser.id,
                name: finalProfile?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Student',
                email: sbUser.email || '',
                role: mappedRole,
                skills: []
            } as User;
        } catch (err) {
            console.error('[AuthContext] Error syncing user profile:', err);
            // Return a safe fallback context
            return {
                id: sbUser.id,
                name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Student',
                email: sbUser.email || '',
                role: (sbUser.user_metadata?.role === 'admin') ? 'ADMIN' : 'STUDENT',
                skills: []
            } as User;
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            console.log("[AuthContext] Initializing auth session check...");
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const mappedUser = await checkAndSyncProfile(session.user);
                    setUser(mappedUser);
                    setToken(session.access_token);
                } else {
                    setUser(null);
                    setToken(null);
                }
            } catch (err) {
                console.error("[AuthContext] Auth session initialization failed:", err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("[AuthContext] SUPABASE AUTH EVENT TRIGGERED:", event);
            if (session?.user) {
                const mappedUser = await checkAndSyncProfile(session.user);
                setUser(mappedUser);
                setToken(session.access_token);
            } else {
                setUser(null);
                setToken(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        console.log("[AuthContext] Initiating login for:", email);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data?.user) {
                const mappedUser = await checkAndSyncProfile(data.user);
                setUser(mappedUser);
                setToken(data.session?.access_token || null);
            }
        } catch (error: any) {
            console.error("[AuthContext] login failed:", error);
            throw new Error(error.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string, role = 'STUDENT') => {
        setLoading(true);
        try {
            const cleanRole = role.toLowerCase();
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        role: cleanRole
                    }
                }
            });

            if (error) throw error;

            if (data?.user) {
                const mappedUser = await checkAndSyncProfile(data.user);
                setUser(mappedUser);
                setToken(data.session?.access_token || null);
            }
        } catch (error: any) {
            console.error("[AuthContext] registration failed:", error);
            throw new Error(error.message || 'Registration failed.');
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
        setUser(null);
        setToken(null);
        setLoading(false);
    };

    const updateProfile = async (name: string, skills: string[]) => {
        try {
            const { data: { user: sbUser } } = await supabase.auth.getUser();
            if (!sbUser) throw new Error('No user session found.');

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: name
                })
                .eq('id', sbUser.id);

            if (error) throw error;
            setUser(prev => prev ? { ...prev, name, skills } : null);
        } catch (error: any) {
            console.error('[AuthContext] Update profile error:', error);
            throw new Error(error.message || 'Failed to update profile.');
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
