import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, Layers, Award, ShieldCheck, ArrowRight, Code, Users, Briefcase,
    MapPin, CheckCircle, Smartphone, Globe, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';

const Linkedin = ({ size = 18 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

const Github = ({ size = 18 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.2 1.23-.1 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
);

export const About: React.FC = () => {
    const navigate = useNavigate();

    const milestones = [
        { number: '25+', label: 'Domains' },
        { number: '300+', label: 'Projects' },
        { number: '100%', label: 'Self-paced' },
        { number: '₹0', label: 'Application fee' }
    ];

    const steps = [
        {
            no: '01',
            title: 'Apply & Get Offer',
            desc: 'Pick a domain, fill your details, and receive your offer letter instantly — no interview needed.',
            icon: Briefcase,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
        },
        {
            no: '02',
            title: 'Receive ID Card',
            desc: "Get your digital identity card with a unique intern ID. You're officially part of Vinix.",
            icon: Users,
            color: 'text-purple-650 bg-purple-50 dark:bg-purple-950/20'
        },
        {
            no: '03',
            title: 'Complete Projects',
            desc: 'Work through 5-12 real-world tasks per track. Each task is reviewed by mentors.',
            icon: Code,
            color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/20'
        },
        {
            no: '04',
            title: 'Earn Certificate',
            desc: 'Finish your track, get a QR-verified certificate. Share it on LinkedIn, resume, everywhere.',
            icon: Award,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
        }
    ];

    return (
        <div className="overflow-x-hidden min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">

            {/* HERO BANNER SECTION */}
            <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 bg-gradient-to-b from-blue-50/40 via-white to-transparent dark:from-slate-900/20 dark:via-slate-950 dark:to-transparent">

                {/* Glow Spheres */}
                <div className="absolute top-20 left-1/4 -z-10 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-10 right-1/4 -z-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
                    <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 text-[10px] uppercase font-bold text-slate-800 bg-white shadow-sm border border-slate-100 rounded-full dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350">
                        <Sparkles size={11} className="text-blue-550" />
                        <span>About Vinix</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                        Bridging education & industry
                    </h1>

                    <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-semibold">
                        We run a task-based virtual internship program that helps students gain genuine, portfolio-grade experience — not just a certificate.
                    </p>
                </div>
            </section>

            {/* OUR MISSION BLOCK */}
            <section className="py-16 border-t border-slate-100 dark:border-slate-800/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                        {/* Left contents */}
                        <div className="lg:col-span-6 space-y-5">
                            <span className="inline-flex px-3 py-1 text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded-full tracking-wider">
                                OUR MISSION
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                MSME-registered. Student-built.
                            </h2>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                                The gap between college coursework and real-world work is huge. We close that gap with structured, mentor-reviewed internship tracks across 10 in-demand technology domains.
                            </p>
                        </div>

                        {/* Right statistics cards */}
                        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                            {milestones.map((item, idx) => (
                                <div key={idx} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl shadow-sm text-center space-y-1 hover:shadow-lg transition">
                                    <h3 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{item.number}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </section>

            {/* LEADERSHIP / FOUNDER SECTION */}
            <section className="py-20 bg-slate-50/40 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-850">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-12">

                    <div className="space-y-4">
                        <span className="inline-flex px-3.5 py-1 text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 dark:bg-amber-955/30 dark:text-amber-400 rounded-full tracking-wide">
                            Founder & Leadership
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-950 dark:text-white tracking-tight">
                            Meet the Founder
                        </h2>
                        <p className="text-sm text-slate-550 max-w-lg mx-auto font-semibold">
                            Powering student opportunities and building pathways to engineering careers.
                        </p>
                    </div>

                    {/* Vishal R detailed Profile Card */}
                    <div className="mx-auto max-w-xl p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-205 dark:border-slate-805 shadow-xl flex flex-col md:flex-row items-center gap-8 text-left hover:shadow-2xl transition duration-300">

                        {/* Founder Avatar Display */}
                        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-900 flex items-center justify-center text-white text-3xl font-extrabold shadow-md flex-shrink-0">
                            VR
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Vishal R</h3>
                                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block font-mono">Founder & CEO</span>
                            </div>

                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                                Vishal R leads Vinix with the vision of making high-fidelity project internships free and accessible to students. Aiming to provide hands-on experience, guidance, and portfolio projects that help engineers scale key developer positions.
                            </p>

                            <div className="flex items-center space-x-3 pt-1">
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-650 rounded-lg transition dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700">
                                    <Linkedin size={14} />
                                </a>
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg transition dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700">
                                    <Github size={14} />
                                </a>
                                <a href="mailto:ceo@vinix.com" className="p-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition dark:bg-slate-805 dark:text-slate-355 dark:hover:bg-slate-705">
                                    <Mail size={14} />
                                </a>
                            </div>
                        </div>

                    </div>

                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section className="py-20 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <span className="inline-flex px-3.5 py-1 text-[10px] font-extrabold uppercase bg-purple-50 text-purple-750 dark:bg-purple-950/40 dark:text-purple-300 rounded-full tracking-wide">
                            How It Works
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Your internship journey
                        </h2>
                        <p className="text-sm font-semibold text-slate-550 dark:text-slate-400">
                            From signup to certificate — four simple steps.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((s, idx) => {
                            const Icon = s.icon;
                            return (
                                <div key={idx} className="relative p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl shadow-sm space-y-4 hover:-translate-y-1 transition duration-300">

                                    {/* Step No badge */}
                                    <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-900 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                                        {s.no}
                                    </span>

                                    <div className={`p-3 rounded-2xl w-fit ${s.color}`}>
                                        <Icon size={20} />
                                    </div>

                                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{s.title}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{s.desc}</p>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </section>

            {/* CTA FOOTER BANNER - SCREEN 3 */}
            <section className="py-16">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="relative p-8 md:p-12 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl"></div>

                        <div className="space-y-4 text-center md:text-left z-10">
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Be part of the Vinix journey</h2>
                            <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Get your offer letter in seconds. No application fee.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 z-10 w-full sm:w-auto">
                            <button
                                onClick={() => navigate('/internship')}
                                className="px-6 py-3.5 bg-white text-indigo-900 rounded-xl hover:bg-slate-100 font-bold transition flex items-center justify-center space-x-1.5 shadow"
                            >
                                <span>Browse Internships</span>
                                <ArrowRight size={14} />
                            </button>
                            <button
                                onClick={() => navigate('/#contact')}
                                className="px-6 py-3.5 bg-transparent border border-white/30 text-white rounded-xl hover:bg-white/10 font-bold transition text-center"
                            >
                                Get in Touch
                            </button>
                        </div>

                    </div>
                </div>
            </section>

        </div>
    );
};

export default About;
