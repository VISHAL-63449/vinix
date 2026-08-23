import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight, Code2, Users, Award, Globe, Play,
    Star, Sparkles, Send, CheckCircle, MessageSquare
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

export const Home: React.FC = () => {
    const navigate = useNavigate();

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
            name: 'Aravind Swamy',
            domain: 'Full Stack Development',
            college: 'SRM University',
            text: 'Vinix completely changed how I learn programming. The task-based module is excellent. Getting my offer letter instantly and having practical items to show in my GitHub portfolio got me selected at my tier-1 developer job.',
            rating: 5
        },
        {
            id: 2,
            name: 'Pooja Hegde',
            domain: 'Data Science & AI',
            college: 'VIT Chennai',
            text: 'I worked on 8 major assignments including AI model evaluation and python tasks. The custom QR verification on the completion certificate is flawless! Highly recommend this remote self-paced internship for developers.',
            rating: 5
        },
        {
            id: 3,
            name: 'Rohan Sharma',
            domain: 'Java Development',
            college: 'Delhi Technological University',
            text: 'I really appreciated the flexibility. 100% remote layout meant I could finish assignments during semesters. The official MSME registered stamp on LOR document makes it very reliable for professional use.',
            rating: 5
        },
        {
            id: 4,
            name: 'Neha Roy',
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

                        {/* ── RIGHT Side Image ── */}
                        <div className="flex-1 flex justify-center items-center z-10 w-full min-w-[320px] max-w-[550px] lg:max-w-none">
                            <img
                                src="/home-image.png"
                                alt="Vinix Logo and Stats"
                                className="w-full h-auto object-contain select-none filter drop-shadow-xl hover:scale-[1.02] transition-transform duration-500"
                            />
                        </div>

                    </div>
                </div>
            </section>

            {/* ═══════ TAGS BAND / BENEFITS STRIP ═══════ */}
            <section className="border-y border-slate-150/80 dark:border-slate-800/80
                                bg-slate-50/50 dark:bg-slate-900/30 py-8 relative z-10">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-405 dark:text-slate-500">
                        What You'll Gain
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {['Offer Letter', 'ID Card', 'Completion Certificate', 'Letter of Recommendation (LOR)',
                            'QR Verification Badge', 'Portfolio Github Projects', 'LinkedIn verified Credential'].map((tag, idx) => (
                                <span key={idx} className="px-4.5 py-2 text-xs font-bold bg-white
                                                     dark:bg-slate-900 border border-slate-200/60
                                                     dark:border-slate-800 text-slate-650
                                                     dark:text-slate-300 rounded-full shadow-sm hover:border-blue-400 transition cursor-default">
                                    {tag}
                                </span>
                            ))}
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
                                        placeholder="e.g. Aravind Swamy"
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

            {/* ═══════ CONTACT SECTION ═══════ */}
            <section id="contact" className="py-20 border-t border-slate-100 dark:border-slate-900 relative z-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">

                    <div className="text-center space-y-3 mb-14">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50/60 dark:bg-amber-955/20 border border-amber-100/50 dark:border-amber-900/30 rounded-full text-[10px] font-extrabold text-amber-650 dark:text-amber-300 uppercase tracking-widest">
                            <Users size={11} className="text-amber-500" />
                            <span>Connect Now</span>
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Get in Touch</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto font-medium">
                            Have query about domains, tasks, reviews, or verification? Drop us a prompt line.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-5xl mx-auto">

                        {/* Left Info tiles */}
                        <div className="lg:col-span-5 space-y-6">

                            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-150/80 dark:border-slate-800/80 rounded-2xl space-y-2 flex items-start gap-4">
                                <span className="p-3 bg-blue-100/50 text-blue-700 rounded-xl flex items-center justify-center text-sm">✉</span>
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Email Inquiry</h4>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">info@vinix.com</p>
                                    <p className="text-[10px] text-slate-400">Response within 12-24 business hours.</p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-150/80 dark:border-slate-800/80 rounded-2xl space-y-2 flex items-start gap-4">
                                <span className="p-3 bg-emerald-100/50 text-emerald-700 rounded-xl flex items-center justify-center text-sm">📍</span>
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Office Address</h4>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">Chennai, Tamil Nadu, India</p>
                                    <p className="text-[10px] text-slate-400">Registered Tech and MSME Platforms.</p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-150/80 dark:border-slate-800/80 rounded-2xl space-y-2 flex items-start gap-4">
                                <span className="p-3 bg-amber-100/50 text-amber-700 rounded-xl flex items-center justify-center text-sm">🕒</span>
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Operation Hours</h4>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">Mon - Sat | 9:00 AM - 7:00 PM IST</p>
                                    <p className="text-[10px] text-slate-400">Support tickets are closed on national holidays.</p>
                                </div>
                            </div>

                        </div>

                        {/* Right Contact form */}
                        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
                            {contactSent ? (
                                <div className="text-center py-10 space-y-4">
                                    <div className="w-16 h-16 bg-green-100 border border-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl animate-float">
                                        ✓
                                    </div>
                                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Message Dispatched Successfully!</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">We will review your submission and connect with you on the registered email address.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Vishal R"
                                                value={contactName}
                                                onChange={(e) => setContactName(e.target.value)}
                                                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="e.g. info@vinix.com"
                                                value={contactEmail}
                                                onChange={(e) => setContactEmail(e.target.value)}
                                                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Subject</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Inquiry regarding Course Assignments"
                                            value={contactSubject}
                                            onChange={(e) => setContactSubject(e.target.value)}
                                            className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Your Message</label>
                                        <textarea
                                            required
                                            rows={5}
                                            placeholder="Write detail coordinates to help our support managers answer accurately..."
                                            value={contactMsg}
                                            onChange={(e) => setContactMsg(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs  rounded-xl transition shadow active:scale-[0.98]"
                                    >
                                        Send Message
                                    </button>
                                </form>
                            )}
                        </div>

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
