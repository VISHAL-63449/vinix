import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { supabase } from '../utils/supabase';

export const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);

            const courseId = searchParams.get('courseId');
            const action = searchParams.get('redirect');

            if (action === 'internship') {
                navigate(courseId ? `/internship?courseId=${courseId}` : '/internship');
                return;
            }

            if (action === 'enroll' && courseId) {
                try {
                    const { data: { user: sbUser } } = await supabase.auth.getUser();
                    if (sbUser) {
                        const { data: existing } = await supabase
                            .from('internship_enrollments')
                            .select('*')
                            .eq('user_id', sbUser.id)
                            .eq('internship_id', courseId);

                        if (!existing || existing.length === 0) {
                            const { data: enrolledRecord, error: enrollErr } = await supabase
                                .from('internship_enrollments')
                                .insert({
                                    user_id: sbUser.id,
                                    internship_id: courseId,
                                    status: 'active',
                                    application_status: 'active'
                                })
                                .select()
                                .single();

                            if (!enrollErr && enrolledRecord) {
                                // Seed offer letter
                                const offerLetterNumber = `VINIX-OFFER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                                const { data: profile } = await supabase
                                    .from('profiles')
                                    .select('*')
                                    .eq('id', sbUser.id)
                                    .single();

                                await supabase
                                    .from('offer_letters')
                                    .insert({
                                        enrollment_id: enrolledRecord.id,
                                        user_id: sbUser.id,
                                        offer_letter_id: offerLetterNumber,
                                        student_name: profile?.full_name || sbUser.email?.split('@')[0] || 'student',
                                        student_email: sbUser.email || '',
                                        internship_title: 'Developer Internship',
                                        duration: '3 Months',
                                        status: 'GENERATED'
                                    });

                                // Seed task progress
                                const { data: tasks } = await supabase
                                    .from('internship_tasks')
                                    .select('*')
                                    .eq('internship_id', courseId)
                                    .order('task_number', { ascending: true });

                                if (tasks && tasks.length > 0) {
                                    const progressToInsert = tasks.map(t => ({
                                        user_id: sbUser.id,
                                        internship_id: courseId,
                                        task_id: t.id,
                                        status: t.task_number === 1 ? 'approved' : t.task_number === 2 ? 'available' : 'locked'
                                    }));
                                    await supabase
                                        .from('task_progress')
                                        .insert(progressToInsert);
                                }
                            }
                        }
                    }
                    navigate('/dashboard');
                    return;
                } catch (err) {
                    console.error('Autoenroll error:', err);
                }
            }

            const { data: { user: sbUser } } = await supabase.auth.getUser();
            if (sbUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', sbUser.id)
                    .maybeSingle();

                if (profile?.role?.toUpperCase() === 'ADMIN' || profile?.role?.toUpperCase() === 'FOUNDER') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const errorObj = err as { message?: string };
            setError(errorObj.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-805 shadow-2xl grid grid-cols-1 md:grid-cols-2">

                {/* LEFT BLUE BRANDING PANEL */}
                <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-blue-950 text-white p-10 flex flex-col justify-between relative overflow-hidden select-none">

                    {/* Abstract Grid Glows */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

                    {/* Logo */}
                    <div className="flex items-center space-x-1.5 z-10">
                        <GraduationCap className="h-7 w-7 text-blue-400" />
                        <span className="text-xl font-extrabold tracking-tight">vio</span>
                        <span className="text-xl font-extrabold text-blue-400">nix</span>
                    </div>

                    {/* Content Infolist */}
                    <div className="my-10 space-y-6 z-10">

                        {/* MSME Banner */}
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 text-[9px] uppercase tracking-wider font-extrabold bg-white/10 dark:bg-slate-900/40 rounded-full border border-white/15 text-blue-200">
                            <span className="text-amber-400">★</span>
                            <span>MSME Registered Internship Platform</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold leading-[1.25] tracking-tight">
                            Build real projects.<br />
                            <span className="text-blue-300">Earn verified credentials.</span>
                        </h2>

                        <p className="text-xs font-semibold text-slate-350 leading-relaxed max-w-md">
                            Complete task-based virtual internships, receive detailed mentor code feedback, and unlock QR-coded certificates to power your career.
                        </p>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-3 gap-3 pt-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-0.5 backdrop-blur-sm">
                                <h4 className="text-lg font-extrabold text-blue-300">10+</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Domains</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-0.5 backdrop-blur-sm">
                                <h4 className="text-lg font-extrabold text-blue-300">50+</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tasks</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-0.5 backdrop-blur-sm">
                                <h4 className="text-lg font-extrabold text-blue-300">100%</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Online</p>
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 z-10 pt-4 border-t border-white/10">
                        <span>© {new Date().getFullYear()} Vionix</span>
                        <span>Registered IT Company</span>
                    </div>

                </div>

                {/* RIGHT INPUT PANEL */}
                <div className="p-10 flex flex-col justify-between bg-slate-50/30 dark:bg-slate-900/20">

                    <div className="space-y-6">

                        {/* Header titles */}
                        <div className="space-y-1.5">
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Portal Gateway</h3>
                            <p className="text-xs text-slate-400 font-semibold">Access your virtual internship task submissions panel.</p>
                        </div>

                        {/* Tab selectors matching screen 1 and screen 2 */}
                        <div className="p-1 bg-slate-100/80 dark:bg-slate-950 rounded-xl flex items-center space-x-1 w-fit border border-slate-205 dark:border-slate-805">
                            <button className="px-5 py-2 text-xs font-bold bg-white text-slate-900 rounded-lg shadow-sm dark:bg-slate-900 dark:text-white">
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="px-5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 transition"
                            >
                                Create Account
                            </button>
                        </div>

                        {error && (
                            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300 flex items-center space-x-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse"></span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                                    Registered Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@college.edu"
                                    className="w-full px-4 py-3 border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-650 focus:ring-1 focus:ring-blue-650 text-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                                    Account Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-slate-202 bg-white dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-650 focus:ring-1 focus:ring-blue-650 text-slate-800 dark:text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white rounded-xl font-bold transition shadow-lg text-xs flex items-center justify-center space-x-1.5 active:scale-[0.98] transform duration-100"
                            >
                                <span>{loading ? 'Accessing Gateway...' : 'Access Dashboard'}</span>
                                <ArrowRight size={13} />
                            </button>
                        </form>

                    </div>

                    {/* Bottom Helper presets */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-semibold space-y-1">
                        <p>💡 Demo Credentials:</p>
                        <p>Student: student@vionix.com | PW: student123</p>
                        <p>Admin: vishal@vinix.com | PW: vis@2007</p>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Login;
