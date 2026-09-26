import React from 'react';
import { Quote } from 'lucide-react';
import founderImg from '../assets/founder-ceo.jpeg';

const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

const GithubIcon = ({ size = 16 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.2 1.23-.1 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
);

const MailIcon = ({ size = 16 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const technicalSkills = [
    'React.js',
    'TypeScript',
    'Node.js',
    'UI/UX Design',
    'Firebase',
    'Tailwind CSS',
    'Next.js',
    'Supabase',
    'JavaScript',
    'Git'
];

interface FounderProfileProps {
    showPillBadge?: boolean;
}

export const FounderProfile: React.FC<FounderProfileProps> = ({ showPillBadge = true }) => {
    return (
        <div className="w-full max-w-xl mx-auto text-left font-sans">
            {/* Top Pill Badge */}
            {showPillBadge && (
                <div className="mb-5 flex items-center">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700 shadow-sm">
                        FOUNDER & CEO
                    </span>
                </div>
            )}

            {/* Hero Image Showcase Card - Full Portrait Display */}
            <div className="relative w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900 group">
                {/* Full Founder Image without cropping */}
                <img
                    src={founderImg}
                    alt="Vishal R - Founder & CEO"
                    className="w-full h-auto block select-none transition-transform duration-700 group-hover:scale-[1.015]"
                />

                {/* Subtle Gradient Fade at the Bottom */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/90 via-white/30 to-transparent dark:from-slate-950/90 dark:via-slate-950/30 pointer-events-none" />

                {/* Floating Glassmorphic CEO Badge Overlay */}
                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 shadow-xl border border-white/60 dark:border-slate-700/60 flex items-center gap-3 max-w-[90%] sm:max-w-md transition-all duration-300 hover:shadow-2xl">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#09152b] dark:bg-blue-600 text-white flex items-center justify-center font-black text-xs sm:text-sm tracking-wider flex-shrink-0 shadow-inner">
                        CEO
                    </div>
                    <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                            Vishal R
                        </h4>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            B.Tech IT · Mount Zion College
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Information Block */}
            <div className="mt-8 space-y-4">
                <div>
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Vishal R
                    </h3>
                    <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 mt-1">
                        B.Tech Information Technology · Mount Zion College of Engineering & Technology
                    </p>
                </div>

                {/* Bio Paragraph */}
                <p className="text-sm sm:text-base font-normal text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl pt-1">
                    A passionate entrepreneur, web developer, and technology enthusiast. As the Founder & CEO of Vinix, he leads initiatives focused on website development, digital solutions, e-commerce services, professional training programs, and internship opportunities for students.
                </p>

                {/* Cinematic Quote Card */}
                <div className="pt-2">
                    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-5 sm:p-6 flex items-start gap-4 shadow-sm">
                        <div className="text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5">
                            <Quote className="w-6 h-6 rotate-180" />
                        </div>
                        <p className="text-sm sm:text-base italic font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                            “Bridging high-speed code with cinematic design — building real-world internship experiences from the 3rd Year of B.Tech IT.”
                        </p>
                    </div>
                </div>

                {/* Education & Role Two-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4">
                    {/* Education Card */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition duration-300">
                        <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            EDUCATION
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            B.Tech Information Technology
                        </h4>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                            Mount Zion College of Engineering & Technology
                        </p>
                    </div>

                    {/* Role Card */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition duration-300">
                        <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            ROLE
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            Founder & CEO
                        </h4>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                            Vinix
                        </p>
                    </div>
                </div>

                {/* Technical Skills */}
                <div className="pt-4 space-y-3">
                    <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        TECHNICAL SKILLS
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                        {technicalSkills.map((skill) => (
                            <span
                                key={skill}
                                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-default"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Connect / Social Actions */}
                <div className="pt-4 flex flex-wrap items-center gap-3">
                    <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-650 dark:hover:text-blue-400 text-xs font-bold transition border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <LinkedinIcon size={14} />
                        <span>LinkedIn</span>
                    </a>
                    <a
                        href="https://github.com/vishal6385"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-xs font-bold transition border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <GithubIcon size={14} />
                        <span>GitHub</span>
                    </a>
                    <a
                        href="mailto:foundervinix@gmail.com"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold transition border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <MailIcon size={14} />
                        <span>foundervinix@gmail.com</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default FounderProfile;
