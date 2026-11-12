import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleAd from '../components/GoogleAd';
import NewsTicker from '../components/NewsTicker';
import CollegeTicker from '../components/CollegeTicker';
import type { LucideIcon } from 'lucide-react';
import SEO from '../components/SEO';
import {
    ArrowRight, Code2, Users, Award, Globe, Play,
    Star, Sparkles, Send, CheckCircle, MessageSquare,
    BookOpen, Calendar, FolderOpen, ShieldCheck, ChevronDown, Check,
    Briefcase
} from 'lucide-react';

/* ─── Floating Tech Icons (Desktop only to prevent cluttering mobile text) ─── */
const FloatTechLogo = ({ children, style, className = "" }: { children: React.ReactNode; style: React.CSSProperties; className?: string }) => (
    <div
        style={style}
        className={`hidden lg:block absolute z-0 pointer-events-none opacity-[0.16] dark:opacity-[0.08] transition duration-500 hover:scale-110 select-none ${className}`}
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
    <div className={`flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border ${bgClass} ${borderClass} ${textClass} shadow-xs hover:shadow transition-all duration-300 w-full min-w-0`}>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/70 dark:bg-slate-900/50 shadow-xs">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
        </div>
        <span className="text-[10px] xs:text-[11px] sm:text-xs font-bold leading-tight break-words truncate sm:whitespace-nowrap">{label}</span>
    </div>
);

/* ─── Testimonial Schema ─── */
interface Testimonial {
    id: number | string;
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

/* ─── Avatar Color and Initials Helper ─── */
const getAvatarConfig = (name: string, domain: string) => {
    const parts = name.trim().split(/\s+/);
    let initials = '';
    if (parts.length === 1) {
        initials = parts[0].slice(0, 1).toUpperCase();
    } else {
        initials = (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
    }

    const colorStyles = [
        'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
        'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
        'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300',
        'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300',
        'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300',
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300',
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300',
        'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300',
        'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300'
    ];

    let hash = 0;
    const str = name + domain;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colorStyles.length;
    return { initials, colorClass: colorStyles[index] };
};

/* ─── Verified Review Card (Pic 2 Design) ─── */
const ReviewCard: React.FC<{ item: Testimonial }> = ({ item }) => {
    const { initials, colorClass } = getAvatarConfig(item.name, item.domain);
    return (
        <div className="w-[330px] sm:w-[390px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between relative group select-none">
            {/* Top curved gradient glow line */}
            <div className="absolute top-0 left-6 right-6 h-[3px] bg-gradient-to-r from-red-600 via-rose-500 to-red-700 rounded-full opacity-80 group-hover:opacity-100 transition-opacity" />

            {/* Top row: Star rating + Verified Badge */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1">
                    {[...Array(item.rating || 5)].map((_, idx) => (
                        <Star key={idx} size={15} className="text-amber-400 fill-amber-400" />
                    ))}
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
                    <Check size={11} className="stroke-[3]" />
                    Verified
                </span>
            </div>

            {/* Review quote body */}
            <p className="my-4 text-[13px] text-slate-650 dark:text-slate-300 leading-relaxed font-normal min-h-[64px]">
                "{item.text}"
            </p>

            {/* Student author footer */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className={`w-9 h-9 rounded-full ${colorClass} font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                    {initials}
                </div>
                <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {item.domain}
                    </p>
                </div>
            </div>
        </div>
    );
};

/* ─── Mock Testimonials from Interns (Pic 2 Format) ─── */
const INITIAL_TESTIMONIALS: Testimonial[] = [
    {
        id: 'r-1',
        name: 'Rohit',
        domain: 'Cyber Security',
        college: 'SRM Institute of Science and Technology',
        text: 'The internship provided hands-on assignments that helped me understand real cybersecurity concepts. I highly recommend Vinix to students looking for practical learning.',
        rating: 5
    },
    {
        id: 'r-2',
        name: 'Sivaraman',
        domain: 'Python Development',
        college: 'Anna University',
        text: 'I enjoyed completing the project-based tasks. The dashboard, offer letter, and certificate verification system were smooth and professional.',
        rating: 5
    },
    {
        id: 'r-3',
        name: 'Manikandan',
        domain: 'Full Stack Development',
        college: 'PSG College of Technology',
        text: 'The internship helped me strengthen both frontend and backend skills. The learning was organized and the admin verification process ensured quality throughout.',
        rating: 5
    },
    {
        id: 'r-4',
        name: 'Sharik',
        domain: 'AI & Machine Learning',
        college: 'Vellore Institute of Technology',
        text: 'Vinix provides an excellent platform for students to gain industry-oriented experience. The practical projects and mentor feedback were extremely helpful.',
        rating: 5
    },
    {
        id: 'r-5',
        name: 'Harish',
        domain: 'Full Stack Development',
        college: 'SRM University',
        text: 'Vinix completely changed how I learn programming. The task-based module is excellent. Getting my offer letter instantly and having practical items to show in my GitHub portfolio got me selected at my tier-1 developer job.',
        rating: 5
    },
    {
        id: 'r-6',
        name: 'Tamilarasan',
        domain: 'Cyber Security',
        college: 'PSG College of Technology',
        text: 'The cybersecurity track assignments were highly realistic. Analyzing network logs, identifying vulnerabilities, and testing standard protocols gave me solid industry-ready credentials.',
        rating: 5
    },
    {
        id: 'r-7',
        name: 'Ananya',
        domain: 'UI/UX Design',
        college: 'National Institute of Design',
        text: 'Completed the UI/UX track in just 3 weeks. The real-world assignments were challenging and realistic. My portfolio looks 10x better now thanks to Vinix!',
        rating: 5
    },
    {
        id: 'r-8',
        name: 'Arjun M',
        domain: 'Data Science',
        college: 'BITS Pilani',
        text: 'Got my certificate the same day I finished. The QR verification impressed my placement officer. Vinix is legit and highly recommended!',
        rating: 5
    },
    {
        id: 'r-9',
        name: 'Karan P',
        domain: 'Backend Development',
        college: 'IIT Kharagpur',
        text: 'Very well structured internship. The tasks pushed me to learn Docker, CI/CD and REST APIs. I came out a much better developer than I was before.',
        rating: 5
    },
    {
        id: 'r-10',
        name: 'Divya K',
        domain: 'Cloud Computing',
        college: 'Amity University',
        text: 'The cloud computing track was fantastic. AWS basics to advanced — all covered. Perfect for anyone wanting a cloud career.',
        rating: 5
    },
    {
        id: 'r-11',
        name: 'Sneha R',
        domain: 'Python Development',
        college: 'Delhi University',
        text: 'Self-paced format was a lifesaver during semester exams. Flexible deadlines and I still got a great certificate and LOR!',
        rating: 5
    },
    {
        id: 'r-12',
        name: 'Kavin',
        domain: 'Data Science & AI',
        college: 'VIT Chennai',
        text: 'I worked on 8 major assignments including AI model evaluation and python tasks. The custom QR verification on the completion certificate is flawless! Highly recommend this remote self-paced internship for developers.',
        rating: 5
    },
    {
        id: 'r-13',
        name: 'Dinesh',
        domain: 'Java Development',
        college: 'Delhi Technological University',
        text: 'I really appreciated the flexibility. 100% remote layout meant I could finish assignments during semesters. The official MSME registered stamp on LOR document makes it very reliable for professional use.',
        rating: 5
    },
    {
        id: 'r-14',
        name: 'Mugilan',
        domain: 'Python Development',
        college: 'Jadavpur University',
        text: 'Best practical learning experience ever. Implementing code tasks and getting them reviewed. The instant ID card gave me verified intern community access. A complete package!',
        rating: 5
    }
];

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

    useEffect(() => {
        document.title = "VINIX | Free Task-Based Virtual Internships & Certificates";
        const scriptId = "faq-schema-markup";
        let script = document.getElementById(scriptId) as HTMLScriptElement;
        if (!script) {
            script = document.createElement("script");
            script.id = scriptId;
            script.type = "application/ld+json";
            script.innerHTML = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": FAQ_ITEMS.map(item => ({
                    "@type": "Question",
                    "name": item.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": item.answer
                    }
                }))
            });
            document.head.appendChild(script);
        }
        return () => {
            const existingScript = document.getElementById(scriptId);
            if (existingScript) existingScript.remove();
        };
    }, []);

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
    const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);

    // Derived 2 rows for the infinite news scroll marquee
    const row1Testimonials = testimonials.filter((_, i) => i % 2 === 0);
    const row2Testimonials = testimonials.filter((_, i) => i % 2 !== 0);



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
            <SEO
                title="VINIX | Free Task-Based Virtual Internships & Certificates"
                description="Join India's most practical task-based virtual internship programs. Build live project portfolios, earn verified certificates & LORs in Web Development, Python, AI, and Cloud."
                canonicalPath="/"
                schema={[
                    {
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "VINIX",
                        "url": "https://www.vinix.online/",
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": "https://www.vinix.online/domains?q={search_term_string}",
                            "query-input": "required name=search_term_string"
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "VINIX",
                        "url": "https://www.vinix.online/",
                        "logo": "https://www.vinix.online/vinix-logo.png",
                        "description": "Virtual Internship and Career Readiness Platform",
                        "founder": {
                            "@type": "Person",
                            "name": "Vishal R",
                            "url": "https://www.vinix.online/founder"
                        },
                        "sameAs": [
                            "https://www.linkedin.com/company/vinix-technologies",
                            "https://www.instagram.com/vinix_technology"
                        ]
                    }
                ]}
            />

            {/* ═══════ HERO SECTION ═══════ */}
            <section className="relative z-10 overflow-hidden">
                {/* ── Background: Dedicated Mobile vs Desktop ── */}
                {/* Mobile Background (940x1672 Portrait): Custom red & black corner accents tailored for phone screens — top ribbon frames news ticker, center is pure clean white for 100% readable text, bottom ribbon frames the bottom */}
                <div
                    className="block sm:hidden absolute inset-0 z-[-2] bg-cover bg-top bg-no-repeat transition-opacity duration-300 dark:opacity-25"
                    style={{ backgroundImage: `url('${window.location.origin}${import.meta.env.BASE_URL}mobile-hero-background.png?v=7')` }}
                ></div>

                {/* Tablet & Desktop Background (1305x731 Landscape): edge-to-edge 100% 100% which user loved ("laptop is super design") */}
                <div
                    className="hidden sm:block absolute inset-0 z-[-2] sm:bg-[length:100%_100%] bg-no-repeat transition-opacity duration-300 dark:opacity-25"
                    style={{ backgroundImage: `url('${window.location.origin}${import.meta.env.BASE_URL}background.png?v=7')` }}
                ></div>

                {/* Ambient Red Glows complementing the red waves */}
                <div className="absolute top-0 left-0 w-80 h-80 bg-red-600/10 dark:bg-red-600/15 rounded-full blur-3xl pointer-events-none z-[-1]"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-600/10 dark:bg-red-600/15 rounded-full blur-3xl pointer-events-none z-[-1]"></div>
                {/* Soft Gradient Overlay for Readability and Contrast */}
                <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/10 via-transparent to-white/20 dark:from-slate-950/70 dark:via-slate-950/50 dark:to-slate-950/80 pointer-events-none"></div>

                {/* ── Top News Ticker: Positioned inside Hero Section so the Hero Background is seamlessly UNDER it ── */}
                <div className="relative z-20 pt-2.5 sm:pt-3">
                    <NewsTicker embedded />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-3 sm:pt-6 md:pt-8 pb-12 sm:pb-20 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-8">

                        {/* ── LEFT Hero details ── */}
                        <div className="flex-1 min-w-0 flex flex-col gap-4 xs:gap-5 sm:gap-6">

                            {/* Pill */}
                            <div className="inline-flex items-center gap-1.5 xs:gap-2 self-start px-2.5 xs:px-3 sm:px-3.5 py-1.5
                                            rounded-full bg-red-50/70 dark:bg-red-950/30
                                            border border-red-100/70 dark:border-red-900/40
                                            text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black tracking-wider uppercase
                                            text-red-700 dark:text-red-400 shadow-xs animate-float max-w-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                                <span className="truncate">🎓 India's Most Practical Virtual Internship Platform</span>
                            </div>

                            {/* Main Headings */}
                            <h1 className="font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight text-3xl xs:text-4xl sm:text-5xl md:text-6xl">
                                <div>Build Skills.</div>
                                <div>Gain Experience.</div>
                                <div className="text-red-600 dark:text-red-500 flex items-center min-h-[2.5rem] xs:min-h-[3rem] sm:min-h-[4.5rem]">
                                    <span>{typed}</span>
                                    <span
                                        className="inline-block w-[3px] rounded-sm bg-red-600 dark:bg-red-500 ml-1 align-middle animate-pulse"
                                        style={{
                                            height: '0.85em',
                                            opacity: blink ? 1 : 0.2,
                                        }}
                                    />
                                </div>
                            </h1>

                            {/* Hero Subtitle */}
                            <p className="text-slate-600 dark:text-slate-350 text-xs xs:text-sm sm:text-base leading-relaxed max-w-lg font-medium">
                                Vinix Internship Program helps students and professionals work on
                                real-world projects, gain practical skills, and receive
                                industry-recognized certificates.
                            </p>

                            {/* Styled pastel Features Grid */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-3.5 w-full max-w-lg">
                                <FeatureItem
                                    icon={Code2}
                                    label="Real-world Projects"
                                    bgClass="bg-red-50/60 dark:bg-red-950/20"
                                    borderClass="border-red-100/70 dark:border-red-900/30"
                                    textClass="text-red-700 dark:text-red-300"
                                />
                                <FeatureItem
                                    icon={Users}
                                    label="Mentor Guidance"
                                    bgClass="bg-purple-50/50 dark:bg-purple-950/20"
                                    borderClass="border-purple-100/70 dark:border-purple-900/30"
                                    textClass="text-purple-700 dark:text-purple-300"
                                />
                                <FeatureItem
                                    icon={Award}
                                    label="Certificate & LOR"
                                    bgClass="bg-emerald-50/60 dark:bg-emerald-950/20"
                                    borderClass="border-emerald-100/70 dark:border-emerald-900/30"
                                    textClass="text-emerald-700 dark:text-emerald-300"
                                />
                                <FeatureItem
                                    icon={Globe}
                                    label="100% Remote"
                                    bgClass="bg-amber-50/50 dark:bg-amber-950/20"
                                    borderClass="border-amber-100/70 dark:border-amber-900/30"
                                    textClass="text-amber-700 dark:text-amber-300"
                                />
                            </div>

                            {/* CTA Action Triggers */}
                            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 pt-1 sm:pt-4 w-full">
                                <button
                                    onClick={() => navigate('/internships')}
                                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-red-600
                                               hover:bg-red-700 text-white font-bold rounded-xl sm:rounded-2xl
                                               shadow-lg shadow-red-600/25 hover:shadow-red-600/40 transition active:scale-[0.97]"
                                >
                                    <span>Explore Internships</span>
                                    <ArrowRight size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        const el = document.getElementById('how-it-works');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-slate-50
                                               dark:bg-slate-900 border border-slate-200/80
                                               dark:border-slate-800 text-slate-700 dark:text-slate-200
                                               font-bold rounded-xl sm:rounded-2xl transition hover:bg-slate-100
                                               dark:hover:bg-slate-800 active:scale-[0.97]"
                                >
                                    <Play size={13} className="text-slate-400 fill-slate-400" />
                                    <span>How It Works</span>
                                </button>
                            </div>
                        </div>

                        {/* ── RIGHT Side Image with Dynamic Floating Cards & Bottom Stats Strip ── */}
                        <div className="flex-1 relative z-10 w-full max-w-[550px] lg:max-w-[580px] xl:max-w-[620px] flex flex-col justify-center items-center py-4 sm:py-6">
                            {/* Glowing red backdrops */}
                            <div className="w-[100%] h-[100%] bg-gradient-to-tr from-red-600/15 to-rose-600/10 rounded-full filter blur-[70px] absolute -z-10 animate-pulse"></div>

                            {/* Image Container with Framing Floating Cards */}
                            <div className="relative w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[480px] lg:max-w-[520px] flex justify-center items-center mx-auto">
                                <img
                                    src={window.location.origin + import.meta.env.BASE_URL + 'home-image.png?v=3'}
                                    alt="Vinix Internships"
                                    className="w-full h-auto max-h-[320px] sm:max-h-[360px] object-contain select-none drop-shadow-2xl transform hover:scale-[1.01] transition-transform duration-500"
                                />

                                {/* Overlay/floating cards: aligned cleanly around the image without overlapping hero text */}
                                <div className="absolute inset-0 select-none pointer-events-none">
                                    {/* Card 1: Your Progress (Top-Left) */}
                                    <div className="absolute -top-3 sm:-top-5 left-0 sm:-left-2 lg:-left-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-150/80 dark:border-slate-800/80 shadow-md w-[125px] xs:w-[135px] sm:w-[175px] animate-float pointer-events-auto">
                                        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                                            <span className="text-[7px] xs:text-[7.5px] sm:text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Your Progress</span>
                                            <div className="grid grid-cols-3 gap-0.5 opacity-60">
                                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"></span>
                                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"></span>
                                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"></span>
                                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"></span>
                                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"></span>
                                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"></span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <div className="relative w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0">
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                                                    <circle cx="20" cy="20" r="16" className="text-slate-100 dark:text-slate-800" strokeWidth="3" fill="transparent" stroke="currentColor" />
                                                    <circle cx="20" cy="20" r="16" className="text-red-600" strokeWidth="3" fill="transparent" strokeDasharray="100.5" strokeDashoffset="25.1" strokeLinecap="round" stroke="currentColor" />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                    <span className="text-[7px] xs:text-[7.5px] sm:text-[9.5px] font-black text-slate-800 dark:text-white leading-none">75%</span>
                                                    <span className="text-[4px] xs:text-[4.5px] sm:text-[5.5px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-none mt-0.5">Done</span>
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[7.5px] xs:text-[8px] sm:text-[10px] font-black text-red-600 dark:text-red-400 leading-tight truncate">Great job!</p>
                                                <p className="text-[6px] xs:text-[6.5px] sm:text-[8px] text-slate-500 dark:text-slate-400 leading-tight font-semibold truncate">Keep going strong.</p>
                                            </div>
                                        </div>
                                        <div className="mt-1 sm:mt-2 pt-1 sm:pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 sm:h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-red-600 h-full rounded-full" style={{ width: '75%' }}></div>
                                            </div>
                                            <span className="text-[5.5px] xs:text-[6px] sm:text-[7.5px] font-extrabold text-slate-400 dark:text-slate-500 mt-0.5 block truncate">3 of 4 milestones completed</span>
                                        </div>
                                    </div>

                                    {/* Card 2: Live Projects (Bottom-Left) */}
                                    <div className="absolute -bottom-2 sm:-bottom-3 left-0 sm:-left-2 lg:-left-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-150/80 dark:border-slate-800/80 shadow-md w-[125px] xs:w-[135px] sm:w-[170px] animate-float-delayed pointer-events-auto">
                                        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <span className="p-0.5 sm:p-1 bg-red-600 text-white rounded flex items-center justify-center flex-shrink-0">
                                                    <Code2 size={9} className="stroke-[3] sm:w-[10px] sm:h-[10px]" />
                                                </span>
                                                <span className="text-[7px] xs:text-[7.5px] sm:text-[8.5px] font-extrabold text-slate-800 dark:text-white truncate">Live Projects</span>
                                            </div>
                                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[5px] sm:text-[7px] text-slate-400 flex-shrink-0">→</span>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-1.5">
                                            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[6px] xs:text-[6.5px] sm:text-[7.5px] font-bold flex-shrink-0">✓</span>
                                            <span className="text-[11px] xs:text-xs sm:text-sm font-black text-slate-800 dark:text-white">12 Completed</span>
                                        </div>
                                        <p className="text-[6px] xs:text-[6.5px] sm:text-[7.5px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-semibold leading-tight line-clamp-2">
                                            Real-world projects &amp; portfolio building.
                                        </p>
                                    </div>

                                    {/* Card 3: Certificate Earned (Top-Right) */}
                                    <div className="absolute -top-3 sm:-top-5 right-0 sm:-right-2 lg:-right-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800 shadow-md w-[130px] xs:w-[140px] sm:w-[185px] animate-float-delayed pointer-events-auto">
                                        <div className="flex justify-between items-start mb-0.5 sm:mb-1.5">
                                            <div className="space-y-0.5 min-w-0 pr-1">
                                                <span className="text-[6px] xs:text-[6.5px] sm:text-[7.5px] font-bold text-teal-400 uppercase tracking-wider leading-none block truncate">Certificate Earned</span>
                                                <h4 className="text-[7.5px] xs:text-[8px] sm:text-[10px] font-black text-white leading-tight font-sans truncate">Full Stack Developer</h4>
                                                <p className="text-[6px] xs:text-[6.5px] sm:text-[7.5px] text-indigo-200 opacity-90 leading-none truncate">Virtual Internship</p>
                                            </div>
                                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-900 flex items-center justify-center shadow text-[8px] sm:text-[10px] flex-shrink-0">
                                                🏆
                                            </div>
                                        </div>

                                        <div className="mt-1 sm:mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                                            <div className="text-[5px] xs:text-[5.5px] sm:text-[7px] text-slate-400 truncate">
                                                Verified Credential
                                            </div>
                                            <button
                                                onClick={() => navigate('/verify')}
                                                className="flex items-center gap-0.5 text-[5.5px] xs:text-[6px] sm:text-[7.5px] font-black text-red-400 hover:text-red-300 transition flex-shrink-0"
                                            >
                                                <span>Verify</span>
                                                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[4px] sm:text-[6px]">→</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card 4: Skills Gained (Bottom-Right) */}
                                    <div className="absolute -bottom-2 sm:-bottom-3 right-0 sm:-right-2 lg:-right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-150/80 dark:border-slate-800/80 shadow-md w-[130px] xs:w-[140px] sm:w-[175px] animate-float pointer-events-auto">
                                        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                                            <span className="text-[7px] xs:text-[7.5px] sm:text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Skills Gained</span>
                                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[5px] sm:text-[7px] text-slate-400 flex-shrink-0">→</span>
                                        </div>
                                        <div className="flex flex-wrap gap-0.5 sm:gap-1 items-center my-0.5 sm:my-1 font-sans">
                                            <span className="px-1 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 rounded text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-black">HTML</span>
                                            <span className="px-1 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-black">CSS</span>
                                            <span className="px-1 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 rounded text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-black">JS</span>
                                            <span className="px-1 py-0.5 bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 rounded text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-black">React</span>
                                            <span className="px-1 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 rounded text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-black">+8</span>
                                        </div>
                                        <p className="text-[5.5px] xs:text-[6px] sm:text-[7.5px] text-slate-500 dark:text-slate-400 leading-normal font-semibold truncate">
                                            HTML, CSS, JS, React, Node...
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Hero Image Bottom Stats Strip (From Reference Pic) ── */}
                            <div className="w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[480px] lg:max-w-[540px] mt-6 sm:mt-7 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 shadow-lg shadow-slate-200/50 dark:shadow-none grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-0 items-center text-center select-none">
                                {/* Stat 1 */}
                                <div className="flex flex-col items-center gap-1 sm:border-r border-slate-150 dark:border-slate-800/80 sm:px-2">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                                        <Users size={16} />
                                    </div>
                                    <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white mt-1">5,000+</h4>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-tight">Students Enrolled</p>
                                </div>

                                {/* Stat 2 */}
                                <div className="flex flex-col items-center gap-1 sm:border-r border-slate-150 dark:border-slate-800/80 sm:px-2">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                                        <Briefcase size={16} />
                                    </div>
                                    <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white mt-1">10+</h4>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-tight">Internship Domains</p>
                                </div>

                                {/* Stat 3 */}
                                <div className="flex flex-col items-center gap-1 sm:border-r border-slate-150 dark:border-slate-800/80 sm:px-2">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                                        <Code2 size={16} />
                                    </div>
                                    <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white mt-1">50+</h4>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-tight">Projects Available</p>
                                </div>

                                {/* Stat 4 */}
                                <div className="flex flex-col items-center gap-1 sm:px-2">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shadow-xs">
                                        <Star size={16} className="fill-amber-400 text-amber-500" />
                                    </div>
                                    <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white mt-1">4.9 / 5</h4>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-tight">Average Rating</p>
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
                                src={window.location.origin + import.meta.env.BASE_URL + 'skyrovix.jpeg'}
                                alt="Skyrovix"
                                className="h-10 md:h-12 w-auto object-contain rounded-md border border-slate-100 dark:border-slate-800 shadow-sm"
                            />
                            <img
                                src={window.location.origin + import.meta.env.BASE_URL + 'vinix-partner.png'}
                                alt="Vinix Partner"
                                className="h-10 md:h-12 w-auto object-contain dark:brightness-125 transition duration-300"
                            />
                            <img
                                src={window.location.origin + import.meta.env.BASE_URL + 'yrnovatech.png'}
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
                            <div className="w-10 h-10 rounded-full bg-red-100/70 dark:bg-red-950/45 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Calendar size={18} className="stroke-[2.5]" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight font-sans">Monthly Tasks</h4>
                                <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal font-semibold">
                                    <span className="block font-black text-red-600 dark:text-red-400">1 Month – 4 Tasks</span>
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

            {/* ═══════ COLLEGE LOGO TICKER / CAMPUS TALENT NETWORK ═══════ */}
            <CollegeTicker />

            {/* ═══════ HOW IT WORKS SECTION ═══════ */}
            <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="text-center space-y-3 mb-14">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-50/60 dark:bg-red-955/20 border border-red-100/50 dark:border-red-900/30 rounded-full text-[10px] font-extrabold text-red-650 dark:text-red-400 uppercase tracking-widest">
                        <Sparkles size={11} className="text-red-500" />
                        <span>Simple Process</span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">How It Works</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto font-medium">
                        From registration to holding a verified credential in 4 simple checkpoints.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { no: '01', title: 'Apply & Register', desc: 'Pick a domain, fill in your details, and grab an instant offer letter — no interview processes.', color: 'text-red-600 bg-red-50/50 dark:bg-red-955/20 border-red-100 dark:border-red-900/40' },
                        { no: '02', title: 'Get Your ID Card', desc: 'Receive your virtual intern identity card and step into Vinix\'s verified community network.', color: 'text-purple-600 bg-purple-50/50 dark:bg-purple-955/20 border-purple-100' },
                        { no: '03', title: 'Complete Projects', desc: 'Work through 5–12 real-world coding assignments per domain, validated by technical mentors.', color: 'text-rose-600 bg-rose-50/50 dark:bg-rose-955/20 border-rose-100' },
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
            <section id="reviews" className="py-20 border-t border-slate-100 dark:border-slate-900 bg-slate-50/40 dark:bg-slate-900/10 relative z-10 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">

                    <div className="text-center space-y-3 mb-12">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50/60 dark:bg-purple-955/20 border border-purple-100/50 dark:border-purple-900/30 rounded-full text-[10px] font-extrabold text-purple-650 dark:text-purple-300 uppercase tracking-widest">
                            <MessageSquare size={11} className="text-purple-500" />
                            <span>Graduate Voice</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Loved by Interns Across India</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium">
                            Real reviews from interns who completed the program.
                        </p>
                    </div>

                </div>

                {/* News Scroll Format Marquee (Pic 2 Format) */}
                <div className="relative w-full overflow-hidden space-y-6 mb-16 select-none" title="Hover to pause">
                    {/* Left and Right Gradient Fade Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-32 bg-gradient-to-r from-slate-50/90 dark:from-[#0a0f1d] to-transparent pointer-events-none z-20" />
                    <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-32 bg-gradient-to-l from-slate-50/90 dark:from-[#0a0f1d] to-transparent pointer-events-none z-20" />

                    {/* Row 1 Marquee (Scroll Left) */}
                    <div className="flex overflow-hidden">
                        <div className="animate-reviews-marquee-left flex items-center gap-6 py-2 px-3 hover:[animation-play-state:paused]">
                            {[...row1Testimonials, ...row1Testimonials].map((t, idx) => (
                                <ReviewCard key={`r1-${t.id}-${idx}`} item={t} />
                            ))}
                        </div>
                    </div>

                    {/* Row 2 Marquee (Scroll Right) */}
                    <div className="flex overflow-hidden">
                        <div className="animate-reviews-marquee-right flex items-center gap-6 py-2 px-3 hover:[animation-play-state:paused]">
                            {[...row2Testimonials, ...row2Testimonials].map((t, idx) => (
                                <ReviewCard key={`r2-${t.id}-${idx}`} item={t} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
                    <button
                        onClick={() => navigate('/reviews')}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:shadow-md transition-all duration-300"
                    >
                        <span>View All Student Reviews</span>
                        <ArrowRight size={14} />
                    </button>
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

            {/* ═══════ GOOGLE AD UNIT ═══════ */}
            <div className="max-w-6xl mx-auto px-6 py-6 relative z-10">
                <GoogleAd />
            </div>

            {/* ═══════ CTA BANNER SECTION ═══════ */}
            <section className="pb-20 max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-neutral-900
                                to-zinc-950 text-white rounded-3xl shadow-2xl border
                                border-red-900/40 p-10 md:p-14 flex flex-col md:flex-row
                                items-center justify-between gap-8 animate-float-delayed">
                    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full
                                    bg-red-600/10 blur-[60px] pointer-events-none" />
                    <div className="space-y-2 z-10 text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                            Start Your Internship Today
                        </h2>
                        <p className="text-red-200 text-sm font-semibold">
                            No application fee · Instant offer letter · 100% remote self-paced tracks
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3.5 z-10">
                        <button
                            onClick={() => navigate('/internships')}
                            className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white
                                       font-bold rounded-xl hover:bg-red-700 transition
                                       active:scale-[0.97] shadow-lg shadow-red-600/30"
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
