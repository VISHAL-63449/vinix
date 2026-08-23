import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Clock, GraduationCap } from 'lucide-react';

const Footer: React.FC = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-cardDark transition-colors duration-300 no-print">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">

                {/* ── Brand ── */}
                <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-4">
                    <Link to="/" className="flex items-center gap-1 hover:opacity-90 transition">
                        <span className="font-extrabold text-[20px] text-blue-600 dark:text-blue-400">vin</span>
                        <span className="relative font-extrabold text-[20px] text-slate-800 dark:text-white inline-flex items-center">
                            <span className="relative inline-block">
                                i
                                <GraduationCap className="absolute -top-[4px] -left-[2.5px] h-2.5 w-2.5 text-blue-800 dark:text-white rotate-[12deg]" />
                            </span>
                            x
                        </span>
                    </Link>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Build real-world skills through industry-focused virtual internships.
                        Complete practical tasks, gain hands-on experience, and earn verified
                        certificates trusted by employers.
                    </p>
                </div>

                {/* ── Internship Domains ── */}
                <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-brand-primary mb-4">
                        Internship Domains
                    </p>
                    <ul className="space-y-2.5">
                        {['Full Stack Development', 'Python Development', 'Java Development', 'Data Science'].map(lbl => (
                            <li key={lbl}>
                                <Link to="/internships" className="text-[12px] text-slate-500 dark:text-slate-400 hover:text-brand-primary transition flex items-center gap-1.5">
                                    <span className="font-mono text-[10px]">&lt;/&gt;</span> {lbl}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ── Company ── */}
                <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-brand-primary mb-4">Company</p>
                    <ul className="space-y-2.5">
                        {[
                            { label: 'About Vinix', to: '/about' },
                            { label: 'Contact', to: '/contact' },
                            { label: 'Student Reviews', to: '/reviews' },
                            { label: 'FAQ', to: '/' },
                        ].map(({ label, to }) => (
                            <li key={label}>
                                <Link to={to} className="text-[12px] text-slate-500 dark:text-slate-400 hover:text-brand-primary transition">{label}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ── Resources ── */}
                <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-brand-primary mb-4">Resources</p>
                    <ul className="space-y-2.5">
                        {[
                            { label: 'Verify Certificate', to: '/verify' },
                            { label: 'Student Dashboard', to: '/dashboard' },
                            { label: 'Privacy Policy', to: '/' },
                            { label: 'Terms of Service', to: '/' },
                        ].map(({ label, to }) => (
                            <li key={label}>
                                <Link to={to} className="text-[12px] text-slate-500 dark:text-slate-400 hover:text-brand-primary transition">{label}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ── Contact & Trust ── */}
                <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-brand-primary mb-4">Contact &amp; Trust</p>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-brand-primary" /> info@vinix.com
                        </li>
                        <li className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" /> India
                        </li>
                        <li className="flex items-start gap-2 text-[12px] text-slate-500 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0 text-brand-primary mt-0.5" />
                            <span>Mon – Sat<br />9:00 AM – 7:00 PM IST</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Copyright bar */}
            <div className="border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-[12px] text-slate-400 dark:text-slate-500">
                    © {year} Vinix. All rights reserved.{' '}
                    <span className="text-brand-primary font-semibold">Registered MSME Platform.</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
