import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseAdmin, ProfileModel, StudentProfileModel } from '../utils/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: ProfileModel | null;
    studentProfile: StudentProfileModel | null;
    loading: boolean;
    dbError: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<ProfileModel | null>(() => {
        try {
            const cached = localStorage.getItem('vinix_user_profile');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [studentProfile, setStudentProfile] = useState<StudentProfileModel | null>(() => {
        try {
            const cached = localStorage.getItem('vinix_student_profile');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState<boolean>(() => {
        try {
            const cached = localStorage.getItem('vinix_user_profile');
            return !cached;
        } catch {
            return true;
        }
    });
    const [dbError, setDbError] = useState(false);
    const inFlightFetch = React.useRef<string | null>(null);

    const fetchProfileData = async (userId: string) => {
        if (inFlightFetch.current === userId) return;
        inFlightFetch.current = userId;
        try {
            setDbError(false);

            // Fetch profile and student profile in parallel for maximum speed
            const [profRes, studRes] = await Promise.allSettled([
                supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle(),
                supabaseAdmin.from('student_profiles').select('*').eq('id', userId).maybeSingle()
            ]);

            const profData = profRes.status === 'fulfilled' ? profRes.value.data : null;
            const profErr = profRes.status === 'fulfilled' ? profRes.value.error : null;
            const studData = studRes.status === 'fulfilled' ? studRes.value.data : null;

            if (profErr) {
                console.error('Error fetching profile:', profErr);
                if (profErr.code === 'PGRST205') {
                    setDbError(true);
                }
                return;
            }

            if (profData) {
                setProfile(profData as ProfileModel);
                try {
                    localStorage.setItem('vinix_user_profile', JSON.stringify(profData));
                } catch { }

                if (studData) {
                    setStudentProfile(studData as StudentProfileModel);
                    try {
                        localStorage.setItem('vinix_student_profile', JSON.stringify(studData));
                    } catch { }
                }
            } else {
                // If logged in via auth.signUp but handle_new_user trigger hadn't fired or failed
                const email = session?.user?.email || '';
                const name = session?.user?.user_metadata?.name || 'New User';
                const role = session?.user?.user_metadata?.role || 'student';

                console.info('Profile missing in DB, trying to create from client...');
                const { data: newProf, error: insErr } = await supabaseAdmin
                    .from('profiles')
                    .insert({
                        id: userId,
                        full_name: name,
                        email: email,
                        role: role,
                        skills: []
                    })
                    .select()
                    .maybeSingle();

                if (insErr) {
                    console.error('Client sync: failed to insert profile:', insErr);
                    if (insErr.code === 'PGRST205') {
                        setDbError(true);
                    }
                } else if (newProf) {
                    setProfile(newProf as ProfileModel);
                    try {
                        localStorage.setItem('vinix_user_profile', JSON.stringify(newProf));
                    } catch { }

                    if (role === 'student') {
                        const { data: newStud } = await supabaseAdmin
                            .from('student_profiles')
                            .insert({
                                id: userId,
                                college: session?.user?.user_metadata?.college || ''
                            })
                            .select()
                            .maybeSingle();

                        if (newStud) {
                            setStudentProfile(newStud as StudentProfileModel);
                            try {
                                localStorage.setItem('vinix_student_profile', JSON.stringify(newStud));
                            } catch { }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load user profile data:', err);
        } finally {
            inFlightFetch.current = null;
        }
    };

    const refreshProfile = async () => {
        if (user?.id) {
            await fetchProfileData(user.id);
        }
    };

    useEffect(() => {
        // Fast safety fallback: ensure loading is never held indefinitely
        const safetyTimer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.id) {
                fetchProfileData(session.user.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser?.id) {
                await fetchProfileData(currentUser.id);
                setLoading(false);
            } else {
                setProfile(null);
                setStudentProfile(null);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!user?.id) return;

        const sendHeartbeat = async () => {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) {
                console.error('Failed to send heartbeat:', error);
            }
        };

        const handleUnload = () => {
            const url = 'https://ioppccrnbuqgcynmjpaa.supabase.co/rest/v1/profiles?id=eq.' + user.id;
            const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

            fetch(url, {
                method: 'PATCH',
                headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': 'Bearer ' + serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    updated_at: '2000-01-01T00:00:00Z'
                }),
                keepalive: true
            });
        };

        // Send immediately on login/load
        sendHeartbeat();

        // Send every 60 seconds to keep session active/online
        const interval = setInterval(sendHeartbeat, 60 * 1000);

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [user?.id]);

    const signOut = async () => {
        setLoading(true);
        if (user?.id) {
            try {
                await supabaseAdmin
                    .from('profiles')
                    .update({ updated_at: '2000-01-01T00:00:00Z' })
                    .eq('id', user.id);
            } catch (err) {
                console.error('Failed to set status offline on sign out:', err);
            }
        }
        await supabase.auth.signOut();
        try {
            localStorage.removeItem('vinix_user_profile');
            localStorage.removeItem('vinix_student_profile');
        } catch {}
        setUser(null);
        setSession(null);
        setProfile(null);
        setStudentProfile(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, studentProfile, loading, dbError, signOut, refreshProfile }}>
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
