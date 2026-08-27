import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight, Code2, Users, Award, Globe, Play,
    Star, Sparkles, Send, CheckCircle, MessageSquare,
    BookOpen, Calendar, FolderOpen, ShieldCheck, ChevronDown
} from 'lucide-react';

/* ─── Floating Tech Icons ─── */
const FloatTechLogo = ({ children, style, className = "" }: { children: React.ReactNode; style: React.CSSProperties; className?: string }) => (
    <div
        style={style}
        className={`absolute z-0 pointer-events-none opacity-[0.16] dark:opacity-[0.08] transition duration-500 hover:scale-110 select-none ${className}`}
    >
        {children}
    </div>
);

// High-fidelity inline SVGs for tech stack
const HTML5Logo = () => (
    <svg className="w-12 h-12 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.07 6.136H5.432l.4 4.49h7.333l-.408 4.577-3.758 1.017-3.75-1.017-.255-2.864H3.012l.51 5.72 5.478 1.483 5.485-1.483.743-8.334H3.85l-.4-4.51h15.22l-.1-1.079z" />
    </svg>
);

const JSLogo = () => (
    <div className="w-12 h-12 bg-yellow-400 text-slate-900 font-extrabold flex items-end justify-end p-1 text-[18px] rounded-lg shadow-sm">
        JS
    </div>
);

const TSLogo = () => (
    <div className="w-12 h-12 bg-blue-600 text-white font-extrabold flex items-end justify-end p-1 text-[17px] rounded-lg shadow-sm">
        TS
    </div>
);

const ReactLogo = ({ className = "w-14 h-14 text-cyan-400" }: { className?: string }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="20" cy="20" r="3.5" fill="currentColor" stroke="none" />
        <ellipse cx="20" cy="20" rx="17" ry="6.5" />
        <ellipse cx="20" cy="20" rx="17" ry="6.5" transform="rotate(60 20 20)" />
        <ellipse cx="20" cy="20" rx="17" ry="6.5" transform="rotate(120 20 20)" />
    </svg>
);

const PythonLogo = () => (
    <svg className="w-12 h-12 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.927 0C5.358 0 5.518 2.85 5.518 2.85V5.59h6.54v.928H5.518s-4.664-.535-4.664 5.378c0 5.914 4.093 5.688 4.093 5.688h2.44V14.9s-.237-3.23 3.14-3.23h6.398s3.04.094 3.04-3.141V3.136s.182-3.136-4.9-3.136h-3.14zm-2.825 1.571a.928.928 0 1 1 0 1.856.928.928 0 0 1 0-1.856zm9.324 5.485v2.678h2.46s4.093-.226 4.093 5.688c0 5.914-4.664 5.378-4.664 5.378h-6.54v-.928h6.54s3.376.237 3.376-3.14c0-3.377-3.14-3.141-3.14-3.141H14.12s-3.376.103-3.376 3.23v2.68H5.85s-.18 3.136 4.9 3.136h3.14c6.568 0 6.408-2.85 6.408-2.85V18.41h-2.46v-3.791zm-6.284 10.373a.928.928 0 1 1 0 1.856.928.928 0 0 1 0-1.856z" />
    </svg>
);

const GitLogo = () => (
    <svg className="w-12 h-12 text-orange-600 animate-pulse-glow" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.384 11.41L12.59.616a1.686 1.686 0 0 0-2.385 0L9.13 1.692l3.228 3.228a2.915 2.915 0 0 1 4.129 4.13a2.914 2.914 0 0 1-4.135 4.122L9.208 10.03v3.916a2.923 2.923 0 0 1 1.71 2.645 2.927 2.927 0 1 1-5.854 0 2.92 2.92 0 0 1 1.705-2.645V9.92a2.934 2.934 0 0 1-1.705-2.653 2.92 2.92 0 0 1 1.71-2.645L7.042 1.39l-5.65 5.65a1.686 1.686 0 0 0 0 2.386l10.79 10.796a1.686 1.686 0 0 0 2.386 0l10.82-10.824a1.682 1.682 0 0 0 0-2.388" />
    </svg>
);

const NodeLogo = () => (
    <div className="w-12 h-12 bg-green-600 text-white font-extrabold flex items-center justify-center p-1 text-[17px] rounded-lg shadow-sm">
        Node
    </div>
);

const AWSLogo = () => (
    <div className="text-[14px] font-black tracking-widest text-[#FF9900] bg-slate-900 border border-slate-700/60 rounded px-2.5 py-1.5 shadow-md">
        aWs
    </div>
);

/* ─── Feature Item ─── */
const FeatureItem = ({
    icon: Icon,
    label,
    bgClass,
    textClass,
    borderClass
}: {
    icon: LucideIcon;
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
}) => (
    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${bgClass} ${borderClass} ${textClass} shadow-sm hover:shadow transition duration-300 hover:scale-[1.03]`}>
        <div className="p-1 rounded-lg">
            <Icon size={16} className="flex-shrink-0 animate-pulse" />
        </div>
        <span className="text-xs font-extrabold whitespace-nowrap">{label}</span>
    </div>
);

/* ─── Testimonial Schema ─── */
interface Testimonial {
    id: number;
    name: string;
    domain: string;
    college: string;
    text: string;
    rating: number;
}

/* ─── FAQ Schema ─── */
interface FAQItem {
    question: string;
    answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
    {
        question: "What is the Vinix internship program?",
        answer: "The Vinix internship program offers self-paced, domain-based virtual internships designed to give students practical skillsets through project-based learning."
    },
    {
        question: "Is there any application fee?",
        answer: "No, there is absolutely ₹0 application fee. The internship program is completely open-access and free of cost to help students build real portfolio work."
    },
    {
        question: "How long does the internship take?",
        answer: "Duration options range from 1 to 3 months depending on the domain track selected. It is 100% remote layout, which means you can complete assignments flexibly."
    },
    {
        question: "What domains are available?",
        answer: "We offer tracks in Full Stack Development, Data Science & AI, Java Development, Python Development, Cyber Security, SQL & Database Development, and UI/UX Design."
    },
    {
        question: "Will I get an offer letter and ID card?",
        answer: "Yes, you receive an instant digital student ID card and official verification of enrollment via an offer letter upon starting your select track."
    },
    {
        question: "Is the certificate verifiable?",
        answer: "Yes, every completion certificate has a custom, tamper-proof QR code that redirects to our official verification portal where employers can authenticate credentials."
    },
    {
        question: "Who reviews my task submissions?",
        answer: "Our system review boards and dedicated mentors evaluate your GitHub link submissions and provide structured, domain-specific feedback logs."
    }
];

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

    /* Typewriter */
    const TARGET = 'Get Certified.';
    const [typed, setTyped] = useState('');
    const [blink, setBlink] = useState(true);

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            i++;
            setTyped(TARGET.slice(0, i));
            if (i >= TARGET.length) clearInterval(timer);
        }, 85);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const t = setInterval(() => setBlink(b => !b), 530);
        return () => clearInterval(t);
    }, []);

    /* Testimonials state */
    const [testimonials, setTestimonials] = useState<Testimonial[]>([
        {
            id: 1,
            name: 'Harish',
            domain: 'Full Stack Development',
            college: 'SRM University',
            text: 'Vinix completely changed how I learn programming. The task-based module is excellent. Getting my offer letter instantly and having practical items to show in my GitHub portfolio got me selected at my tier-1 developer job.',
            rating: 5
        },
        {
            id: 2,
            name: 'Kavin',
            domain: 'Data Science & AI',
            college: 'VIT Chennai',
            text: 'I worked on 8 major assignments including AI model evaluation and python tasks. The custom QR verification on the completion certificate is flawless! Highly recommend this remote self-paced internship for developers.',
            rating: 5
        },
        {
            id: 3,
            name: 'Dinesh',
            domain: 'Java Development',
            college: 'Delhi Technological University',
            text: 'I really appreciated the flexibility. 100% remote layout meant I could finish assignments during semesters. The official MSME registered stamp on LOR document makes it very reliable for professional use.',
            rating: 5
        },
        {
            id: 4,
            name: 'Mugilan',
            domain: 'Python Development',
            college: 'Jadavpur University',
            text: 'Best practical learning experience ever. Implementing code tasks and getting them reviewed. The instant ID card gave me verified intern community access. A complete package!',
            rating: 5
        }
    ]);

    // Testimonial Form State
    const [newName, setNewName] = useState('');
    const [newCollege, setNewCollege] = useState('');
    const [newDomain, setNewDomain] = useState('Full Stack Development');
    const [newText, setNewText] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleAddReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newText.trim() || !newCollege.trim()) return;

        const newReview: Testimonial = {
            id: Date.now(),
            name: newName,
            domain: newDomain,
            college: newCollege,
            text: newText,
            rating: newRating
        };

        setTestimonials([newReview, ...testimonials]);
        setNewName('');
        setNewCollege('');
        setNewText('');
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 5000);
    };

    // Contact Form State
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactSubject, setContactSubject] = useState('');
    const [contactMsg, setContactMsg] = useState('');
    const [contactSent, setContactSent] = useState(false);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactName || !contactEmail || !contactMsg) return;
        setContactSent(true);
        setTimeout(() => {
            setContactSent(false);
            setContactName('');
            setContactEmail('');
            setContactSubject('');
            setContactMsg('');
        }, 4000);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">

            {/* Float background Tech stack labels matching screenshot */}
            <FloatTechLogo style={{ top: '12%', left: '4%' }}>
                <HTML5Logo />
            </FloatTechLogo>
            <FloatTechLogo style={{ top: '22%', left: '80%' }}>
                <TSLogo />
            </FloatTechLogo>
            <FloatTechLogo style={{ top: '55%', left: '2%' }}>
                <JSLogo />
            </FloatTechLogo>
            <FloatTechLogo style={{ top: '15%', left: '60%' }}>
                <ReactLogo />
            </FloatTechLogo>
            <FloatTechLogo style={{ top: '30%', left: '3%' }}>
                <PythonLogo />
            </FloatTechLogo>
            <FloatTechLogo style={{ top: '75%', left: '50%' }}>
                <GitLogo />
            </FloatTechLogo>
            <FloatTechLogo style={{ top: '76%', left: '4%' }}>
                <NodeLogo />
            </FloatTechLogo>
            <FloatTechLogo style={{ top: '82%', left: '5%' }}>
                <AWSLogo />
            </FloatTechLogo>

            {/* ═══════ HERO SECTION ═══════ */}
            <section className="relative z-10 bg-gradient-to-br from-blue-50/40 via-white to-transparent
                                dark:from-slate-900/40 dark:via-slate-955 dark:to-transparent">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 md:py-24">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

                        {/* ── LEFT Hero details ── */}
                        <div className="flex-1 min-w-0 flex flex-col gap-6">

                            {/* Pill */}
                            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5
                                            rounded-full bg-blue-50/50 dark:bg-blue-955/20
                                            border border-blue-100/50 dark:border-blue-900/30
                                            text-[10px] font-black tracking-wider uppercase
                                            text-blue-700 dark:text-blue-350 shadow-sm animate-float">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span>🎓 India's Most Practical Virtual Internship Platform</span>
                            </div>

                            {/* Main Headings */}
                            <div className="font-extrabold text-slate-900 dark:text-white leading-[1.08] tracking-tight text-3.5xl sm:text-5xl md:text-6xl">
                                <div>Build Skills.</div>
                                <div>Gain Experience.</div>
                                <div className="text-blue-600 dark:text-blue-400 flex items-center min-h-[4.5rem]">
                                    <span>{typed}</span>
                                    <span
                                        className="inline-block w-[3px] rounded-sm bg-blue-600 dark:bg-blue-400 ml-1 align-middle animate-pulse"
                                        style={{
                                            height: '0.85em',
                                            opacity: blink ? 1 : 0.2,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Hero Subtitle */}
                            <p className="text-slate-550 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg font-medium">
                                Vinix Internship Program helps students and professionals work on
                                real-world projects, gain practical skills, and receive
                                industry-recognized certificates.
                            </p>

                            {/* Styled pastel Features Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg">
                                <FeatureItem
                                    icon={Code2}
                                    label="Real-world Projects"
                                    bgClass="bg-blue-50/60 dark:bg-blue-955/20"
                                    borderClass="border-blue-100/50 dark:border-blue-900/30"
                                    textClass="text-blue-750 dark:text-blue-300"
                                />
                                <FeatureItem
                                    icon={Users}
                                    label="Mentor Guidance"
                                    bgClass="bg-purple-50/50 dark:bg-purple-955/20"
                                    borderClass="border-purple-100/50 dark:border-purple-900/30"
                                    textClass="text-purple-755 dark:text-purple-300"
                                />
                                <FeatureItem
                                    icon={Award}
                                    label="Certificate & LOR"
                                    bgClass="bg-emerald-50/60 dark:bg-emerald-955/20"
                                    borderClass="border-emerald-100/50 dark:border-emerald-900/30"
                                    textClass="text-emerald-755 dark:text-emerald-300"
                                />
                                <FeatureItem
                                    icon={Globe}
                                    label="100% Remote"
                                    bgClass="bg-amber-50/50 dark:bg-amber-955/20"
                                    borderClass="border-amber-100/50 dark:border-amber-900/30"
                                    textClass="text-amber-755 dark:text-amber-300"
                                />
                            </div>

                            {/* CTA Action Triggers */}
                            <div className="flex flex-wrap gap-4 pt-2">
                                <button
                                    onClick={() => navigate('/internships')}
                                    className="flex items-center gap-2 px-8 py-4 bg-blue-600
                                               hover:bg-blue-750 text-white font-bold rounded-2xl
                                               shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition active:scale-[0.97]"
                                >
                                    <span>Explore Internships</span>
                                    <ArrowRight size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        const el = document.getElementById('how-it-works');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="flex items-center gap-2 px-7 py-4 bg-slate-50
                                               dark:bg-slate-900 border border-slate-200/80
                                               dark:border-slate-800 text-slate-700 dark:text-slate-200
                                               font-bold rounded-2xl transition hover:bg-slate-100
                                               dark:hover:bg-slate-800 active:scale-[0.97]"
                                >
                                    <Play size={13} className="text-slate-400 fill-slate-400" />
                                    <span>How It Works</span>
                                </button>
                            </div>
                        </div>

                        {/* ── RIGHT Side Image with Dynamic Floating Cards ── */}
                        <div className="flex-1 relative z-10 w-full max-w-[550px] lg:max-w-none flex justify-center items-center py-6">
                            {/* Glowing blue backdrops */}
                            <div className="w-[100%] h-[100%] bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-full filter blur-[70px] absolute -z-10 animate-pulse"></div>

                            <div className="relative w-full max-w-[340px] sm:w-[480px] h-[230px] sm:h-[320px] lg:w-[500px] lg:h-[340px] flex justify-center items-center">
                                <img
                                    src={`${import.meta.env.BASE_URL}home-image.jpeg?v=2`}
                                    alt="Vinix Internships"
                                    className="w-full h-full object-cover rounded-3xl border border-slate-100/50 select-none transform hover:scale-[1.01] transition-transform duration-500"
                                />

                                {/* Overlay/floating cards: only display on screens that can fit them nicely */}
                                <div className="absolute inset-0 select-none pointer-events-auto block">
                                    {/* Card 1: Your Progress */}
                                    <div className="absolute -top-4 -left-2 sm:-top-6 sm:-left-8 lg:-left-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-150/80 dark:border-slate-800/80 shadow-lg w-52 animate-float pointer-events-auto scale-[0.65] sm:scale-100 origin-top-left">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Your Progress</span>
                                            <div className="grid grid-cols-3 gap-0.5 opacity-60">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative w-10 h-10 flex-shrink-0">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="20" cy="20" r="16" className="text-slate-100 dark:text-slate-800" strokeWidth="3" fill="transparent" stroke="currentColor" />
                                                    <circle cx="20" cy="20" r="16" className="text-blue-600" strokeWidth="3" fill="transparent" strokeDasharray="100.5" strokeDashoffset="25.1" strokeLinecap="round" stroke="currentColor" />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                    <span className="text-[10px] font-black text-slate-800 dark:text-white leading-none">75%</span>
                                                    <span className="text-[6px] text-slate-405 dark:text-slate-500 font-bold uppercase leading-none mt-0.5">Done</span>
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 leading-tight">Great job!</p>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight font-semibold">Keep going strong.</p>
                                            </div>
                                        </div>
                                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-blue-600 h-full rounded-full" style={{ width: '75%' }}></div>
                                            </div>
                                            <span className="text-[8px] font-extrabold text-slate-455 dark:text-slate-500 mt-1 block">3 of 4 milestones completed</span>
                                        </div>
                                    </div>

                                    {/* Card 2: Live Projects */}
                                    <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-12 lg:-left-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-150/80 dark:border-slate-800/80 shadow-lg w-48 animate-float-delayed pointer-events-auto scale-[0.65] sm:scale-100 origin-bottom-left">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-1">
                                                <span className="p-1 bg-blue-500 text-white rounded flex items-center justify-center text-[8px]">
                                                    <Code2 size={10} className="stroke-[3]" />
                                                </span>
                                                <span className="text-[9px] font-extrabold text-slate-850 dark:text-white">Live Projects</span>
                                            </div>
                                            <span className="w-3.5 h-3.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[7px] text-slate-405">→</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 flex items-center justify-center text-[8px] font-bold">✓</span>
                                            <span className="text-base font-black text-slate-850 dark:text-white">12 Completed</span>
                                        </div>
                                        <p className="text-[8px] text-slate-550 dark:text-slate-400 mt-1.5 font-semibold leading-normal">
                                            Keep building real-world projects and enhance your portfolio.
                                        </p>
                                        <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-purple-650 text-white flex items-center justify-center shadow border border-purple-500 animate-bounce text-[10px]">
                                            🚀
                                        </div>
                                    </div>

                                    {/* Card 3: Certificate Earned */}
                                    <div className="absolute -top-4 -right-2 sm:-top-6 sm:-right-6 lg:-right-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-3.5 rounded-2xl border border-slate-800 shadow-xl w-56 animate-float-delayed pointer-events-auto scale-[0.65] sm:scale-100 origin-top-right">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="space-y-0.5">
                                                <span className="text-[8px] font-bold text-teal-405 uppercase tracking-wider leading-none">Certificate Earned</span>
                                                <h4 className="text-[11px] font-black text-white leading-tight font-sans">Full Stack Web Developer</h4>
                                                <p className="text-[9px] text-indigo-200 opacity-90 leading-none">Virtual Internship</p>
                                            </div>
                                            <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-900 flex items-center justify-center shadow text-xs">
                                                🏆
                                            </div>
                                        </div>

                                        <div className="mt-3.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between animate-pulse-glow">
                                            <div className="text-[8px] text-slate-400">
                                                Issued on 20 May 2025
                                            </div>
                                            <button
                                                onClick={() => navigate('/verify')}
                                                className="flex items-center gap-0.5 text-[8px] font-black text-blue-405 hover:text-blue-300 transition"
                                            >
                                                <span>View Certificate</span>
                                                <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[7px]">→</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card 4: Skills Gained */}
                                    <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-8 lg:-right-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-150/80 dark:border-slate-800/80 shadow-lg w-48 animate-float pointer-events-auto scale-[0.65] sm:scale-100 origin-bottom-right">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Skills Gained</span>
                                            <span className="w-3.5 h-3.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[7px] text-slate-455">→</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 items-center my-1.5 font-sans">
                                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[7px] font-black">HTML</span>
                                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[7px] font-black">CSS</span>
                                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[7px] font-black">JS</span>
                                            <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-705 rounded text-[7px] font-black">React</span>
                                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-750 rounded text-[7px] font-black">+8</span>
                                        </div>
                                        <p className="text-[8px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                                            HTML, CSS, JavaScript, React, Node.js, MongoDB, and more...
                                        </p>
                                        <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow border border-cyan-400/80 text-[10px]">
                                            🌐
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ═══════ PARTNERS STRIP ═══════ */}
            <section className="py-8 border-y border-slate-100 dark:border-slate-800/40 bg-white dark:bg-slate-900 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-12">
                        <div className="md:max-w-xs flex-shrink-0">
                            <h3 className="text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px] leading-tight font-sans">
                                Our Official Strategic & Ecosystem Partners
                            </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-10 md:gap-16 justify-start md:justify-end flex-grow">
                            <img
                                src={`${import.meta.env.BASE_URL}skyrovix.jpeg`}
                                alt="Skyrovix"
                                className="h-10 md:h-12 w-auto object-contain rounded-md border border-slate-100 dark:border-slate-800 shadow-sm"
                            />
                            <img
                                src={`${import.meta.env.BASE_URL}vinix-partner.png`}
                                alt="Vinix Partner"
                                className="h-10 md:h-12 w-auto object-contain dark:brightness-125 transition duration-300"
                            />
                            <img
                                src={`${import.meta.env.BASE_URL}yrnovatech.png`}
                                alt="YR Novatech"
                                className="h-10 md:h-11 w-auto object-contain bg-white rounded p-1 shadow-sm border border-slate-50 dark:border-slate-800"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ BENEFIT STRIP (FROM PIC2) ═══════ */}
            <section className="py-10 relative z-10 border-t border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800/80 rounded-3xl shadow-xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4 select-none">

                        {/* Domain Based Learning */}
                        <div className="flex items-start gap-3.5 p-2 transition duration-300 hover:scale-[1.02]">
                            <div className="w-10 h-10 rounded-full bg-purple-100/70 dark:bg-purple-950/45 text-purple-650 dark:text-purple-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <BookOpen size={18} className="stroke-[2.5]" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">Domain Based Learning</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                                    Learn industry-relevant skills step by step.
                                </p>
                            </div>
                        </div>

                        {/* Monthly Tasks */}
                        <div className="flex items-start gap-3.5 p-2 transition duration-300 hover:scale-[1.02] border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800/60 md:pl-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100/70 dark:bg-blue-955/45 text-blue-650 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Calendar size={18} className="stroke-[2.5]" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight font-sans">Monthly Tasks</h4>
                                <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal font-semibold">
                                    <span className="block font-black text-blue-650 dark:text-blue-400">1 Month – 4 Tasks</span>
                                    <span className="block">2 Months – 8 Tasks</span>
                                    <span className="block">3 Months – 10 Tasks</span>
                                </p>
                            </div>
                        </div>

                        {/* Real World Projects */}
                        <div className="flex items-start gap-3.5 p-2 transition duration-300 hover:scale-[1.02] border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800/60 md:pl-4">
                            <div className="w-10 h-10 rounded-full bg-cyan-100/70 dark:bg-cyan-950/45 text-cyan-605 dark:text-cyan-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <FolderOpen size={18} className="stroke-[2.5]" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight font-sans">Real World Projects</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                                    Work on real projects and build a strong portfolio.
                                </p>
                            </div>
                        </div>

                        {/* Verified Certificates */}
                        <div className="flex items-start gap-3.5 p-2 transition duration-300 hover:scale-[1.02] border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800/60 lg:pl-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100/70 dark:bg-indigo-955/45 text-indigo-650 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <ShieldCheck size={18} className="stroke-[2.5]" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">Verified Certificates</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                                    Earn verified certificates and boost your career.
                                </p>
                            </div>
                        </div>

                        {/* Placement Assistance */}
                        <div className="flex items-start gap-3.5 p-2 transition duration-300 hover:scale-[1.02] border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800/60 lg:pl-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100/70 dark:bg-orange-950/45 text-orange-605 dark:text-orange-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Users size={18} className="stroke-[2.5]" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">Placement Assistance</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                                    Get placement support and job referrals.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ═══════ HOW IT WORKS SECTION ═══════ */}
            <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="text-center space-y-3 mb-14">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50/60 dark:bg-blue-955/20 border border-blue-100/50 dark:border-blue-900/30 rounded-full text-[10px] font-extrabold text-blue-650 dark:text-blue-300 uppercase tracking-widest">
                        <Sparkles size={11} className="text-blue-500" />
                        <span>Simple Process</span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">How It Works</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto font-medium">
                        From registration to holding a verified credential in 4 simple checkpoints.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { no: '01', title: 'Apply & Register', desc: 'Pick a domain, fill in your details, and grab an instant offer letter — no interview processes.', color: 'text-blue-600   bg-blue-50/50   dark:bg-blue-955/20 border-blue-100' },
                        { no: '02', title: 'Get Your ID Card', desc: 'Receive your virtual intern identity card and step into Vinix\'s verified community network.', color: 'text-purple-600 bg-purple-50/50 dark:bg-purple-955/20 border-purple-100' },
                        { no: '03', title: 'Complete Projects', desc: 'Work through 5–12 real-world coding assignments per domain, validated by technical mentors.', color: 'text-pink-600   bg-pink-50/50   dark:bg-pink-955/20 border-pink-100' },
                        { no: '04', title: 'Earn Certificate', desc: 'Get your secure QR-verified certificate. Export it to LinkedIn, your CV, and trigger tech referrals.', color: 'text-emerald-600 bg-emerald-50/50 dark:bg-emerald-955/20 border-emerald-100' },
                    ].map((s, idx) => (
                        <div key={idx} className="relative p-6 bg-white dark:bg-slate-900 border
                                                 border-slate-100 dark:border-slate-800/80 rounded-2xl
                                                 shadow-sm space-y-3.5 hover:-translate-y-1 transition duration-300 hover:shadow-lg">
                            <span className={`absolute top-4 right-4 w-7 h-7 rounded-full ${s.color} border
                                             flex items-center justify-center text-[10px] font-black`}>
                                {s.no}
                            </span>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base pr-8">{s.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════ REVIEWS SECTION ═══════ */}
            <section id="reviews" className="py-20 border-t border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10 relative z-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">

                    <div className="text-center space-y-3 mb-14">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50/60 dark:bg-purple-955/20 border border-purple-100/50 dark:border-purple-900/30 rounded-full text-[10px] font-extrabold text-purple-650 dark:text-purple-300 uppercase tracking-widest">
                            <MessageSquare size={11} className="text-purple-500" />
                            <span>Graduate Voice</span>
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Loved by Interns Across India</h2>
                        <p className="text-slate-500 dark:text-slate-405 text-sm max-w-lg mx-auto font-medium">
                            Read how Vinix helps students build skills, secure credentials, and scale developer achievements.
                        </p>
                    </div>

                    {/* Testimonials Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {testimonials.map((t) => (
                            <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition duration-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-0.5">
                                        {[...Array(t.rating)].map((_, idx) => (
                                            <Star key={idx} size={13} className="text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-extrabold px-2.5 py-1 bg-blue-50 text-blue-750 dark:bg-blue-955/40 dark:text-blue-300 rounded-full">
                                        {t.domain}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold italic">"{t.text}"</p>
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-900 text-white font-bold text-xs flex items-center justify-center">
                                        {t.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-850 dark:text-white leading-none">{t.name}</h4>
                                        <span className="text-[10px] text-slate-405 font-semibold">{t.college}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Interactive Submit Review Area */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl p-8 max-w-2xl mx-auto relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl"></div>

                        <div className="space-y-2 mb-6">
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Interned with us? Share your feedback!</h3>
                            <p className="text-xs text-slate-400 font-semibold">Your review details help prospective candidates evaluate learning benefits.</p>
                        </div>

                        {submitSuccess && (
                            <div className="mb-5 p-4 bg-green-500/10 border border-green-500/20 text-green-750 dark:text-green-300 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-bounce">
                                <CheckCircle size={16} />
                                <span>Thank you! Your testimonial has been captured and submitted for moderation.</span>
                            </div>
                        )}

                        <form onSubmit={handleAddReview} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Your Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Harish"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">College / Institution</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. SRM University"
                                        value={newCollege}
                                        onChange={(e) => setNewCollege(e.target.value)}
                                        className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Playground Track</label>
                                    <select
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white cursor-pointer"
                                    >
                                        <option value="Full Stack Development">Full Stack Development</option>
                                        <option value="Java Development">Java Development</option>
                                        <option value="Python Development">Python Development</option>
                                        <option value="Data Science & AI">Data Science & AI</option>
                                        <option value="Cyber Security">Cyber Security</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rating Score</label>
                                    <div className="flex gap-1.5 pt-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewRating(star)}
                                                className="focus:outline-none"
                                            >
                                                <Star
                                                    size={18}
                                                    className={`transition ${star <= newRating
                                                        ? 'text-amber-400 fill-amber-400 scale-110'
                                                        : 'text-slate-300 dark:text-slate-700'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Your Feedback Message</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Write details of projects, mentors, LOR benefits..."
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                    className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-indigo-900 hover:bg-indigo-850 text-white font-extrabold text-xs  rounded-xl transition shadow active:scale-[0.98] flex items-center justify-center gap-1.5"
                            >
                                <Send size={13} />
                                <span>Publish Internship Review</span>
                            </button>
                        </form>
                    </div>

                </div>
            </section>

            {/* ═══════ FREQUENTLY ASKED QUESTIONS ═══════ */}
            <section id="faq" className="py-20 border-t border-slate-100 dark:border-slate-900 relative z-10">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center space-y-3 mb-14">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
                            Everything you need to know about the Vinix internship program.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {FAQ_ITEMS.map((item, idx) => {
                            const isOpen = faqOpenIndex === idx;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                                    className="bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer select-none"
                                >
                                    <div className="flex justify-between items-center gap-4">
                                        <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-normal">
                                            {item.question}
                                        </h4>
                                        <span className={`text-slate-400 dark:text-slate-500 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={18} />
                                        </span>
                                    </div>
                                    {isOpen && (
                                        <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in-up">
                                            <p className="text-xs text-slate-650 dark:text-slate-450 leading-relaxed font-semibold">
                                                {item.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════ CTA BANNER SECTION ═══════ */}
            <section className="pb-20 max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800
                                to-indigo-900 text-white rounded-3xl shadow-2xl border
                                border-blue-800/50 p-10 md:p-14 flex flex-col md:flex-row
                                items-center justify-between gap-8 animate-float-delayed">
                    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full
                                    bg-blue-400/10 blur-[60px] pointer-events-none" />
                    <div className="space-y-2 z-10 text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                            Start Your Internship Today
                        </h2>
                        <p className="text-blue-200 text-sm font-semibold">
                            No application fee · Instant offer letter · 100% remote self-paced tracks
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3.5 z-10">
                        <button
                            onClick={() => navigate('/internships')}
                            className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-900
                                       font-bold rounded-xl hover:bg-slate-100 transition
                                       active:scale-[0.97] shadow"
                        >
                            <span>Apply Now</span>
                            <ArrowRight size={16} />
                        </button>
                        <button
                            onClick={() => navigate('/verify')}
                            className="px-8 py-4 bg-transparent border border-white/30 text-white
                                       font-semibold rounded-xl hover:bg-white/10 transition"
                        >
                            Verify Credentials
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
