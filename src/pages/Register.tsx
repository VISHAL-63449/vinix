import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { GraduationCap, Lock, Mail, User, ShieldAlert, Award, Rocket, Check, ArrowRight } from 'lucide-react';

const Register: React.FC = () => {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'admin'>('student');
    const [college, setCollege] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Sign up using Supabase Auth
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role,
                        college: role === 'student' ? college : undefined,
                    },
                },
            });

            if (signUpError) {
                throw signUpError;
            }

            if (data.user) {
                setSuccess('Registration successful! Redirecting...');

                // Wait briefly for triggers/profiles to complete
                setTimeout(() => {
                    if (role === 'admin') {
                        navigate('/admin');
                    } else {
                        navigate('/dashboard');
                    }
                }, 1500);
            }
        } catch (err: any) {
            console.error('Registration failed:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-brand-bgLight dark:bg-brand-bgDark transition-colors duration-300">
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
                            <span>SaaS Virtual Internships & Portfolios</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                            Build Real-World Code.<br />
                            <span className="bg-gradient-to-r from-brand-accent to-indigo-300 bg-clip-text text-transparent">Power Your Career.</span>
                        </h2>

                        <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                            Complete hand-on virtual internships, get code submissions evaluated with real ratings, and generate shareable CSS portfolios.
                        </p>

                        {/* List of perks */}
                        <div className="space-y-2.5 pt-4">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-205">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>Department/Year/Sem-aligned Internships</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-205">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>Interactive Lessons & Code Sandbox</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-205">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>Verifiable Certificates & ID Cards</span>
                            </div>
                        </div>
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
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create Account</h3>
                            <p className="text-xs text-slate-500">Sign up in seconds to start building your career portfolio.</p>
                        </div>

                        {/* Switch tabs */}
                        <div className="p-1 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center space-x-1 w-fit border border-slate-200/50 dark:border-slate-800/40">
                            <Link
                                to="/login"
                                className="px-5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 transition"
                            >
                                Sign In
                            </Link>
                            <span className="px-5 py-2 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg shadow-sm">
                                Register
                            </span>
                        </div>

                        {error && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300 flex items-center space-x-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse"></span>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs rounded-xl font-semibold dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300 flex items-center space-x-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></span>
                                <span>{success}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase block mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name (shown on certificates)"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase block mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@college.edu"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            {role === 'student' && (
                                <div>
                                    <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase block mb-1.5">
                                        College / Institution
                                    </label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={college}
                                            onChange={(e) => setCollege(e.target.value)}
                                            placeholder="e.g. Stanford University"
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase block mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3.5 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white rounded-xl font-bold transition shadow-lg text-xs flex items-center justify-center space-x-1.5 active:scale-[0.98] transform duration-100"
                            >
                                <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400 font-semibold flex items-center justify-between">
                            <span>Account Type:</span>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'student' | 'admin')}
                                className="bg-transparent border border-slate-200 dark:border-slate-800 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer font-bold outline-none text-slate-600 dark:text-slate-300"
                            >
                                <option value="student">Student Portal</option>
                                <option value="admin">Admin Console</option>
                            </select>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Register;
