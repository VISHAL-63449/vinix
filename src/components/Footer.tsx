import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Mail, MapPin, Clock, ArrowRight, Code2, Users, Rocket,
    Award, Heart, Shield, Cpu, Palette, Lock, Cloud, Database,
    GraduationCap, Building2
} from 'lucide-react';
import logoImg from '../assets/vinix-logo.png';

const Footer: React.FC = () => {
    const year = new Date().getFullYear();
    const navigate = useNavigate();
    const location = useLocation();

    // Hide footer on mobile devices on login or register pages
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    if (location.pathname === '/dashboard' || location.pathname === '/admin' || location.pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <footer className={`border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-cardDark transition-colors duration-300 no-print ${isAuthPage ? 'hidden lg:block' : ''}`}>

            {/* ── Main Grid ── */}
            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-10 lg:gap-8">

                {/* Brand & Left Info */}
                <div className="col-span-2 lg:col-span-3 space-y-5">
                    <Link to="/" className="flex items-center hover:opacity-90 transition">
                        <img
                            src={logoImg}
                            alt="VINIX"
                            className="h-9 sm:h-10 w-auto object-contain dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.7)] transition-all duration-300"
                        />
                    </Link>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-sm">
                        Build real-world skills through industry-focused virtual internships.
                        Complete practical tasks, gain hands-on experience, and earn verified
                        certificates trusted by employers.
                    </p>

                    {/* Buttons: side-by-side on mobile to save vertical space */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2.5 pt-1">
                        <button
                            onClick={() => navigate('/internships')}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-950 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white rounded-xl text-[11px] font-black transition shadow-sm"
                        >
                            <Rocket size={13} className="text-red-500 flex-shrink-0" />
                            <span className="truncate">Start Internship</span>
                        </button>
                        <button
                            onClick={() => navigate('/verify')}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-black border border-slate-200 dark:border-slate-800 transition shadow-sm"
                        >
                            <Award size={13} className="text-amber-500 flex-shrink-0" />
                            <span className="truncate">Verify Certificate</span>
                        </button>
                    </div>

                    {/* Social Media Links */}
                    <div className="flex items-center gap-3 pt-1">
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-red-500 dark:hover:border-red-400 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center transition">
                            <span className="text-[11px] font-bold">in</span>
                        </a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-800 dark:hover:border-white hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition">
                            <span className="text-[11px] font-bold">git</span>
                        </a>
                        <a href="https://www.instagram.com/vinix_technology?stkn=aThjaGhjMW1zODdr" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-pink-500 dark:hover:border-pink-400 hover:text-pink-500 dark:hover:text-pink-400 flex items-center justify-center transition">
                            <span className="text-[11px] font-bold">ig</span>
                        </a>
                        <a href="https://whatsapp.com/channel/0029Vb8nHh8LdQeYcWSNzi0i" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center justify-center transition">
                            <span className="text-[11px] font-bold">wa</span>
                        </a>
                    </div>
                </div>

                {/* Internship Domains (Left Column on mobile, 3 cols on desktop) */}
                <div className="col-span-1 lg:col-span-3 space-y-3.5">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                        Internship Domains
                    </p>
                    <ul className="space-y-2 sm:space-y-2.5">
                        {[
                            { label: 'Full Stack Development', icon: Code2 },
                            { label: 'Python Development', icon: Code2 },
                            { label: 'Java Development', icon: Code2 },
                            { label: 'Data Science', icon: Database },
                            { label: 'AI & Machine Learning', icon: Cpu },
                            { label: 'UI/UX Design', icon: Palette },
                            { label: 'Cyber Security', icon: Lock },
                            { label: 'Cloud Computing', icon: Cloud }
                        ].map((lbl) => (
                            <li key={lbl.label}>
                                <Link to="/internships" className="text-[11px] sm:text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-1.5 sm:gap-2 leading-tight">
                                    <lbl.icon size={13} className="text-slate-400 flex-shrink-0" />
                                    <span>{lbl.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="pt-1 flex align-middle">
                        <Link to="/internships" className="text-[11px] sm:text-[12px] font-extrabold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1">
                            <span>View All Domains</span>
                            <ArrowRight size={12} />
                        </Link>
                    </div>
                </div>

                {/* Right Column on Mobile: Company & Resources grouped vertically on mobile, side-by-side on desktop */}
                <div className="col-span-1 lg:col-span-4 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
                    {/* Company */}
                    <div className="space-y-3.5">
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                            Company
                        </p>
                        <ul className="space-y-2 sm:space-y-2.5">
                            {[
                                { label: 'About Vinix', to: '/about' },
                                { label: 'Contact', to: '/contact' },
                                { label: 'Student Reviews', to: '/reviews' },
                                { label: 'FAQ', to: '/' }
                            ].map(({ label, to }) => (
                                <li key={label}>
                                    {to === '/' ? (
                                        <button
                                            onClick={() => {
                                                navigate('/');
                                                setTimeout(() => {
                                                    const el = document.getElementById('faq');
                                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                                }, 100);
                                            }}
                                            className="text-[11px] sm:text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition text-left"
                                        >
                                            {label}
                                        </button>
                                    ) : (
                                        <Link to={to} className="text-[11px] sm:text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition">
                                            {label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-3.5">
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                            Resources
                        </p>
                        <ul className="space-y-2 sm:space-y-2.5">
                            {[
                                { label: 'Verify Certificate', to: '/verify' },
                                { label: 'Student Dashboard', to: '/dashboard' },
                                { label: 'Privacy Policy', to: '/privacy' },
                                { label: 'Terms of Service', to: '/terms' },
                                { label: 'Refund Policy', to: '/refund' },
                                { label: 'Help Center', to: '/contact' }
                            ].map(({ label, to }) => (
                                <li key={label}>
                                    <Link to={to} className="text-[11px] sm:text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Contact & Trust: On mobile divided 2 right & left; on desktop vertical in 2 cols */}
                <div className="col-span-2 lg:col-span-2 pt-6 lg:pt-0 border-t border-slate-200/60 dark:border-slate-800/60 lg:border-t-0 space-y-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                        Contact &amp; Trust
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-4 items-start">
                        {/* Contact details (Left on mobile) */}
                        <ul className="space-y-2.5 sm:space-y-3">
                            <li className="flex items-center gap-2 text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-400 font-semibold">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                                <a href="mailto:foundervinix@gmail.com" className="hover:text-red-600 break-all">foundervinix@gmail.com</a>
                            </li>
                            <li className="flex items-center gap-2 text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-400 font-semibold">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                                <span>India</span>
                            </li>
                            <li className="flex items-start gap-2 text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-400 font-semibold">
                                <Clock className="w-3.5 h-3.5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                                <span>Mon – Sat<br />9:00 AM – 7:00 PM IST</span>
                            </li>
                        </ul>

                        {/* MSME Badge (Right on mobile) with NEW MSME Logo */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                            <img
                                src={window.location.origin + import.meta.env.BASE_URL + 'msme.png'}
                                alt="MSME Registered Enterprise"
                                className="h-11 sm:h-12 w-auto object-contain rounded-lg bg-white p-1 border border-slate-100 dark:border-slate-700 shadow-sm flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider leading-tight">
                                    MSME Registered
                                </span>
                                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-400 leading-tight mt-0.5">
                                    Govt. of India
                                </span>
                                <span className="text-[8.5px] font-mono font-bold text-red-600 dark:text-red-400 leading-tight mt-0.5 truncate">
                                    UDYAM-TN-21-0066185
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ── Stats Strip ── */}
            <div className="max-w-7xl mx-auto px-6 pb-12 select-none">
                <div className="bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl py-6 px-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4 items-center text-center">

                    <div className="flex flex-col items-center gap-1 border-r border-slate-200/50 last:border-r-0 dark:border-zinc-800/60">
                        <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                            <Users size={16} />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1">Growing Every Day</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Students Enrolled</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 border-r border-slate-200/50 last:border-r-0 dark:border-zinc-800/60">
                        <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                            <Building2 size={16} />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1">more colleges across India</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Colleges</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 border-r border-slate-200/50 last:border-r-0 dark:border-zinc-800/60">
                        <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                            <GraduationCap size={16} />
                        </div>
                        <h4 className="text-base font-black text-slate-800 dark:text-white mt-0.5">10+</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Domains</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 border-r border-slate-200/50 last:border-r-0 dark:border-zinc-800/60">
                        <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                            <Clock size={16} />
                        </div>
                        <h4 className="text-base font-black text-slate-850 dark:text-white mt-0.5">95%</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Completion</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 border-r-0">
                        <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                            <Award size={16} />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1">Verified</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Certificates</p>
                    </div>

                </div>
            </div>

            {/* Copyright bar */}
            <div className="border-t border-slate-200 dark:border-zinc-800/80 py-6 bg-slate-50/50 dark:bg-zinc-950">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-slate-500 dark:text-slate-400 font-semibold">
                    <div>
                        © {year} Vinix. All Rights Reserved.
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                        <span>Made with</span>
                        <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" />
                        <span>in India</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/privacy" className="hover:text-red-600 dark:hover:text-red-400 transition">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-red-600 dark:hover:text-red-400 transition">Terms</Link>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="hover:text-red-600 dark:hover:text-red-400 transition font-extrabold flex items-center gap-1"
                        >
                            <span>Back to Top</span>
                            <span>↑</span>
                        </button>
                    </div>
                </div>
            </div>

        </footer>
    );
};

export default Footer;
