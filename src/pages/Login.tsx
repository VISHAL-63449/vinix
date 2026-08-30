import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Lock, Mail, Rocket, ArrowRight, Award, ShieldAlert } from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { toasts, showToast, dismiss } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (loginError) {
                throw loginError;
            }

            if (data.user) {
                // Fetch profile to route user properly
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle();

                const role = profile?.role || 'student';

                // Display custom toast notification
                showToast('Welcome back!', 'success');

                // Allow 1 second for the toast animation to render
                setTimeout(() => {
                    // Handle redirect queries if present
                    const redirectPath = searchParams.get('redirect');
                    if (redirectPath) {
                        navigate(redirectPath);
                        return;
                    }

                    if (role === 'admin') {
                        navigate('/admin');
                    } else if (role === 'mentor') {
                        navigate('/mentor');
                    } else {
                        navigate('/dashboard');
                    }
                }, 1000);
            }
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err?.message || 'Invalid email or password.');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-brand-bgLight dark:bg-brand-bgDark transition-colors duration-300">
            <ToastContainer toasts={toasts} dismiss={dismiss} />
            <div className="w-full max-w-5xl bg-white dark:bg-brand-cardDark rounded-[24px] overflow-hidden border border-slate-200/50 dark:border-slate-800/40 shadow-2xl grid grid-cols-1 md:grid-cols-2">

                {/* Left Side: Premium Aesthetic Panel */}
                <div className="bg-gradient-to-b from-brand-primary via-indigo-900 to-slate-950 text-white p-10 flex flex-col justify-between relative overflow-hidden select-none">
                    {/* Neon Glow spots */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-accent/20 blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-brand-secondary/20 blur-[100px] pointer-events-none"></div>

                    {/* Logo */}
                    <div className="flex items-center space-x-2 z-10">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                            <Rocket className="h-4.5 w-4.5 text-brand-accent" />
                        </div>
                        <span className="text-xl font-bold tracking-wide">VINIX</span>
                    </div>

                    {/* Core messages */}
                    <div className="my-10 space-y-6 z-10">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 text-[9px] uppercase tracking-wider font-extrabold bg-white/10 rounded-full border border-white/15 text-brand-accent">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>MSME Registered Internship Platform</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                            Access Your Dashboard.<br />
                            <span className="bg-gradient-to-r from-brand-accent to-indigo-300 bg-clip-text text-transparent">Start Submitting.</span>
                        </h2>

                        <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                            Log back in to view your milestones, complete code reviews, download your ID Card, or verify certificates.
                        </p>
                    </div>

                    <div className="text-[10px] text-slate-400 z-10 border-t border-white/10 pt-4 flex justify-between">
                        <span>© {new Date().getFullYear()} VINIX</span>
                        <span>RLS Secure Database Setup</span>
                    </div>
                </div>

                {/* Right Side: Form Panel */}
                <div className="p-8 sm:p-10 flex flex-col justify-center bg-slate-50/30 dark:bg-slate-900/10">
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Portal Gateway</h3>
                            <p className="text-xs text-slate-505">Access your virtual internship and projects workspace.</p>
                        </div>

                        {/* Switch tabs */}
                        <div className="p-1 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center space-x-1 w-fit border border-slate-200/50 dark:border-slate-800/40">
                            <span className="px-5 py-2 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg shadow-sm">
                                Sign In
                            </span>
                            <Link
                                to="/register"
                                className="px-5 py-2 text-xs font-semibold text-slate-505 hover:text-slate-700 dark:hover:text-slate-350 transition"
                            >
                                Register
                            </Link>
                        </div>

                        {error && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300 flex items-center space-x-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse"></span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email-input" className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        id="email-input"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@college.edu"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-955 dark:focus:bg-slate-955 border border-slate-200 dark:border-slate-805 rounded-xl text-[13px] font-bold text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password-input" className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        id="password-input"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-955 dark:focus:bg-slate-955 border border-slate-200 dark:border-slate-805 rounded-xl text-[13px] font-bold text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                                    />
                                </div>
                            </div>

                            <button
                                id="login-btn"
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white rounded-xl font-extrabold transition shadow-lg text-sm flex items-center justify-center space-x-1.5 active:scale-[0.98] transform duration-100"
                            >
                                <span>{loading ? 'Accessing Gateway...' : 'Access Dashboard'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
