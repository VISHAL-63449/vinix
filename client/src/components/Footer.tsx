import React from 'react';
import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    return (
        <footer className="border-t border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">

                    {/* Brand Details */}
                    <div className="lg:col-span-4 space-y-4">
                        <Link to="/" className="flex items-center space-x-1.5 text-xl font-extrabold tracking-tight transition hover:opacity-90">
                            <div className="flex items-center text-slate-900 dark:text-white">
                                <span className="font-extrabold text-[19px] text-blue-600 dark:text-blue-400">vin</span>
                                <span className="relative font-extrabold text-[19px] text-slate-800 dark:text-white inline-flex items-center">
                                    <span className="relative inline-block">
                                        i
                                        <GraduationCap className="absolute -top-[5px] -left-[2.5px] h-2.8 w-2.8 text-blue-600 dark:text-blue-400 rotate-[12deg]" />
                                    </span>
                                    x
                                </span>
                            </div>
                        </Link>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                            Build real-world skills through industry-focused virtual internships. Complete practical tasks, gain hands-on experience, and earn verified certificates trusted by employers.
                        </p>
                    </div>

                    {/* Internship Domains */}
                    <div className="lg:col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Internship Domains</span>
                        <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            <li><Link to="/internship" className="hover:text-blue-600 dark:hover:text-blue-400">⟨/⟩ Full Stack Development</Link></li>
                            <li><Link to="/internship" className="hover:text-blue-600 dark:hover:text-blue-400">⟨/⟩ Python Development</Link></li>
                            <li><Link to="/internship" className="hover:text-blue-600 dark:hover:text-blue-400">⟨/⟩ Java Development</Link></li>
                            <li><Link to="/internship" className="hover:text-blue-600 dark:hover:text-blue-400">⟨/⟩ Data Science</Link></li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="lg:col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Company</span>
                        <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            <li><Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400">About Vinix</Link></li>
                            <li><Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</Link></li>
                            <li><Link to="/reviews" className="hover:text-blue-600 dark:hover:text-blue-400">Student Reviews</Link></li>
                            <li><a href="/#faq" className="hover:text-blue-600 dark:hover:text-blue-400">FAQ</a></li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div className="lg:col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Resources</span>
                        <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            <li><Link to="/verify" className="hover:text-blue-600 dark:hover:text-blue-400">Verify Certificate</Link></li>
                            <li><Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">Student Dashboard</Link></li>
                            <li><Link to="/privacy" className="hover:text-blue-650 dark:hover:text-blue-400">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Contact & Trust Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Contact & Trust</span>
                        <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            <li className="flex items-center gap-1.5">
                                <span className="text-slate-400">✉</span>
                                <a href="mailto:info@vinix.com" className="hover:underline">info@vinix.com</a>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <span className="text-slate-400">📍</span>
                                <span>India</span>
                            </li>
                            <li className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400">🕒</span>
                                    <span>Mon – Sat</span>
                                </div>
                                <span className="text-[10px] text-slate-450 block ml-4">9:00 AM – 7:00 PM IST</span>
                            </li>
                        </ul>
                    </div>

                </div>
                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-500">
                    <p>© {new Date().getFullYear()} Vinix. All rights reserved. Registered MSME Platform.</p>
                </div>
            </div>
        </footer>
    );
};
export default Footer;
