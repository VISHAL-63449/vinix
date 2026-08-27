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
    const [profile, setProfile] = useState<ProfileModel | null>(null);
    const [studentProfile, setStudentProfile] = useState<StudentProfileModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState(false);

    const fetchProfileData = async (userId: string) => {
        try {
            setDbError(false);

            // Fetch from profiles
            const { data: profData, error: profErr } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (profErr) {
                console.error('Error fetching profile:', profErr);
                if (profErr.code === 'PGRST205') {
                    setDbError(true);
                }
                return;
            }

            if (profData) {
                setProfile(profData as ProfileModel);

                // Fetch from student_profiles if user is a student
                if (profData.role === 'student') {
                    const { data: studData, error: studErr } = await supabaseAdmin
                        .from('student_profiles')
                        .select('*')
                        .eq('id', userId)
                        .maybeSingle();

                    if (studErr) {
                        console.error('Error fetching student profile:', studErr);
                    } else if (studData) {
                        setStudentProfile(studData as StudentProfileModel);
                    }
                }
            } else {
                // If logged in via auth.signUp but handle_new_user trigger hadn't fired or failed
                // For development/robustness, try to create standard profile record from client
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

                    if (role === 'student') {
                        const { data: newStud, error: insStudErr } = await supabaseAdmin
                            .from('student_profiles')
                            .insert({
                                id: userId,
                                college: session?.user?.user_metadata?.college || ''
                            })
                            .select()
                            .maybeSingle();

                        if (newStud) {
                            setStudentProfile(newStud as StudentProfileModel);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load user profile data:', err);
        }
    };

    const refreshProfile = async () => {
        if (user?.id) {
            await fetchProfileData(user.id);
        }
    };

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.id) {
                fetchProfileData(session.user.id).then(() => setLoading(false));
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
                setLoading(true);
                await fetchProfileData(currentUser.id);
                setLoading(false);
            } else {
                setProfile(null);
                setStudentProfile(null);
                setLoading(false);
            }
        });

        return () => {
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

        // Send immediately on login/load
        sendHeartbeat();

        // Send every 60 seconds to keep session active/online
        const interval = setInterval(sendHeartbeat, 60 * 1000);

        return () => clearInterval(interval);
    }, [user?.id]);

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
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
