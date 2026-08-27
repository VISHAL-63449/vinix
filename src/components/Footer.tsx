import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Mail, MapPin, Clock, ArrowRight, Code2, Users, Rocket,
    Award, Heart, Shield, Cpu, Palette, Lock, Cloud, Database,
    GraduationCap, Building2
} from 'lucide-react';
import logoImg from '../assets/vinix-logo.png';

const Footer: React.FC = () => {
    const year = new Date().getFullYear();
    const navigate = useNavigate();

    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-cardDark transition-colors duration-300 no-print">

            {/* ── Main Grid ── */}
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

                {/* Brand & Left Info */}
                <div className="lg:col-span-3 space-y-6">
                    <Link to="/" className="flex items-center hover:opacity-90 transition">
                        <img
                            src={logoImg}
                            alt="Vinix"
                            className="h-9 w-auto object-contain mix-blend-multiply dark:invert dark:brightness-200 dark:mix-blend-screen transition-all duration-300"
                        />
                    </Link>
                    <p className="text-[12px] text-slate-505 dark:text-slate-400 leading-relaxed font-semibold">
                        Build real-world skills through industry-focused virtual internships.
                        Complete practical tasks, gain hands-on experience, and earn verified
                        certificates trusted by employers.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={() => navigate('/internships')}
                            className="flex items-center justify-center gap-2 py-3 px-5 bg-slate-950 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white rounded-2xl text-[11px] font-black transition shadow-sm"
                        >
                            <Rocket size={13} className="text-blue-400" />
                            <span>Start Internship</span>
                        </button>
                        <button
                            onClick={() => navigate('/verify')}
                            className="flex items-center justify-center gap-2 py-3 px-5 bg-white dark:bg-slate-905 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl text-[11px] font-black border border-slate-200 dark:border-slate-800 transition shadow-sm"
                        >
                            <Award size={13} className="text-amber-500" />
                            <span>Verify Certificate</span>
                        </button>
                    </div>

                    {/* Social Media Links */}
                    <div className="flex items-center gap-3.5 pt-2">
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 flex items-center justify-center transition">
                            <span className="text-xs font-bold">in</span>
                        </a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-800 dark:hover:border-white hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition">
                            <span className="text-xs font-bold">git</span>
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-pink-500 dark:hover:border-pink-400 hover:text-pink-500 dark:hover:text-pink-400 flex items-center justify-center transition">
                            <span className="text-xs font-bold">ig</span>
                        </a>
                        <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-505 dark:hover:text-emerald-400 flex items-center justify-center transition">
                            <span className="text-xs font-bold">wa</span>
                        </a>
                    </div>
                </div>

                {/* Internship Domains */}
                <div className="lg:col-span-3 space-y-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        Internship Domains
                    </p>
                    <ul className="space-y-2.5">
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
                                <Link to="/internships" className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-2">
                                    <lbl.icon size={13} className="text-slate-400" />
                                    <span>{lbl.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="pt-1.5 flex align-middle">
                        <Link to="/internships" className="text-[12px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                            <span>View All Domains</span>
                            <ArrowRight size={12} />
                        </Link>
                    </div>
                </div>

                {/* Company */}
                <div className="lg:col-span-2 space-y-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        Company
                    </p>
                    <ul className="space-y-2.5">
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
                                        className="text-[12px] font-semibold text-slate-505 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition text-left"
                                    >
                                        {label}
                                    </button>
                                ) : (
                                    <Link to={to} className="text-[12px] font-semibold text-slate-550 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                        {label}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Resources */}
                <div className="lg:col-span-2 space-y-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        Resources
                    </p>
                    <ul className="space-y-2.5">
                        {[
                            { label: 'Verify Certificate', to: '/verify' },
                            { label: 'Student Dashboard', to: '/dashboard' },
                            { label: 'Privacy Policy', to: '/privacy' },
                            { label: 'Terms of Service', to: '/terms' },
                            { label: 'Refund Policy', to: '/refund' },
                            { label: 'Help Center', to: '/help' }
                        ].map(({ label, to }) => (
                            <li key={label}>
                                <Link to={to} className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact & Trust */}
                <div className="lg:col-span-2 space-y-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        Contact &amp; Trust
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400 font-semibold">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                            <a href="mailto:info@vinix.com" className="hover:text-blue-600">info@vinix.com</a>
                        </li>
                        <li className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400 font-semibold">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                            <span>India</span>
                        </li>
                        <li className="flex items-start gap-2 text-[12px] text-slate-500 dark:text-slate-400 font-semibold">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <span>Mon – Sat<br />9:00 AM – 7:00 PM IST</span>
                        </li>
                    </ul>

                    {/* MSME Badge */}
                    <div className="pt-4 flex items-center gap-2">
                        <img
                            src={`${import.meta.env.BASE_URL}msme.jpeg`}
                            alt="MSME Registered"
                            className="h-10 w-auto object-contain rounded border border-slate-100 dark:border-slate-800"
                        />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">
                            MSME Registered
                        </span>
                    </div>
                </div>

            </div>

            {/* ── Stats Strip ── */}
            <div className="max-w-7xl mx-auto px-6 pb-12 select-none">
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl py-6 px-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4 items-center text-center">

                    <div className="flex flex-col items-center gap-1 border-r border-slate-200/50 last:border-r-0 dark:border-slate-805/40">
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                            <Users size={16} />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1">Growing Every Day</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Students Enrolled</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 border-r border-slate-200/50 last:border-r-0 dark:border-slate-800/40">
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                            <Building2 size={16} />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1">more colleges across India</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Colleges</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 border-r border-slate-200/50 last:border-r-0 dark:border-slate-800/40">
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                            <GraduationCap size={16} />
                        </div>
                        <h4 className="text-base font-black text-slate-800 dark:text-white mt-0.5">10+</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Domains</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 border-r border-slate-200/50 last:border-r-0 dark:border-slate-800/40">
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                            <Clock size={16} />
                        </div>
                        <h4 className="text-base font-black text-slate-850 dark:text-white mt-0.5">95%</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Completion</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 border-r-0">
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                            <Award size={16} />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1">Verified</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Certificates</p>
                    </div>

                </div>
            </div>

            {/* Copyright bar */}
            <div className="border-t border-slate-200 dark:border-slate-800/60 py-6 bg-slate-50/50 dark:bg-slate-900/10">
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
                        <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-450 transition">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-450 transition">Terms</Link>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="hover:text-blue-600 dark:hover:text-blue-450 transition font-extrabold flex items-center gap-1"
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
