import React from 'react';
import { GraduationCap, Sparkles, Building2 } from 'lucide-react';

interface College {
    id: string;
    name: string;
    fullName: string;
    file: string;
    type: string;
}

const ROW_1_COLLEGES: College[] = [
    {
        id: 'bits-pilani',
        name: 'BITS Pilani',
        fullName: 'Birla Institute of Technology and Science, Pilani',
        file: 'bits-pilani.jpg',
        type: 'Premier Deemed University'
    },
    {
        id: 'gtu',
        name: 'Gujarat Tech University',
        fullName: 'Gujarat Technological University (GTU)',
        file: 'gtu.webp',
        type: 'State Technical University'
    },
    {
        id: 'guru-ghasidas',
        name: 'Guru Ghasidas Univ',
        fullName: 'Guru Ghasidas Vishwavidyalaya (Central University)',
        file: 'guru-ghasidas.png',
        type: 'Central University'
    },
    {
        id: 'dce',
        name: 'DCE Gurgaon',
        fullName: 'Dronacharya College of Engineering',
        file: 'dce.png',
        type: 'Premier Engineering College'
    },
    {
        id: 'mount-zion',
        name: 'Mount Zion CET',
        fullName: 'Mount Zion College of Engineering and Technology',
        file: 'mount-zion.png',
        type: 'Engineering & Technology'
    },
    {
        id: 'sa-engg',
        name: 'S.A. Engineering College',
        fullName: 'S.A. Engineering College (Autonomous), Chennai',
        file: 'sa-engg.png',
        type: 'Autonomous College'
    },
    {
        id: 'shanmuganathan',
        name: 'Shanmuganathan EC',
        fullName: 'Shanmuganathan Engineering College',
        file: 'shanmuganathan.png',
        type: 'Engineering College'
    },
    {
        id: 'siva-sivani',
        name: 'Siva Sivani Degree College',
        fullName: 'Siva Sivani Degree College, Hyderabad',
        file: 'siva-sivani.png',
        type: 'Degree & Management College'
    },
    {
        id: 'adustech',
        name: 'ADUSTECH University',
        fullName: 'Aliko Dangote University of Science and Technology',
        file: 'adustech.jpeg',
        type: 'Science & Technology University'
    }
];

const ROW_2_COLLEGES: College[] = [
    {
        id: 'pec',
        name: 'PEC Engineering College',
        fullName: 'Prathyusha / Punjab Engineering College',
        file: 'pec.png',
        type: 'Technical & Engineering Institute'
    },
    {
        id: 'gjust',
        name: 'Guru Jambheshwar Univ',
        fullName: 'Guru Jambheshwar University of Science & Technology',
        file: 'gjust.png',
        type: 'State Technical University'
    },
    {
        id: 'sns',
        name: 'SNS Institutions',
        fullName: 'SNS College of Technology & Institutions',
        file: 'sns.jpeg',
        type: 'Autonomous College'
    },
    {
        id: 'shivaji',
        name: 'Shivaji University & Colleges',
        fullName: 'Shivaji University / College',
        file: 'shivaji.png',
        type: 'State University Network'
    },
    {
        id: 'st-anns',
        name: 'St. Ann\'s CET',
        fullName: 'St. Ann\'s College of Engineering and Technology',
        file: 'st-anns.png',
        type: 'Engineering College'
    },
    {
        id: 'thamirabharani',
        name: 'Thamirabharani EC',
        fullName: 'Thamirabharani Engineering College',
        file: 'thamirabharani.png',
        type: 'Engineering & Research'
    },
    {
        id: 'vkr-vnb',
        name: 'VKR, VNB & AGK EC',
        fullName: 'VKR, VNB & AGK College of Engineering',
        file: 'vkr-vnb.png',
        type: 'Engineering College'
    },
    {
        id: 'sudharsan',
        name: 'Sudharsan EC',
        fullName: 'Sudharsan Engineering College',
        file: 'sudharsan.png',
        type: 'Engineering & Technology'
    },
    {
        id: 'gtu-itr',
        name: 'GTU Innovation & Tech',
        fullName: 'Gujarat Technological University - ITR Cell',
        file: 'gtu-itr.webp',
        type: 'Technology & Research'
    }
];

const CollegeCard: React.FC<{ college: College }> = ({ college }) => {
    return (
        <div
            className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-red-500/50 hover:-translate-y-0.5 transition-all duration-300 group cursor-default select-none"
            title={college.fullName}
        >
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white p-1.5 flex items-center justify-center border border-slate-100 dark:border-slate-700/60 shadow-xs flex-shrink-0 overflow-hidden">
                <img
                    src={`${import.meta.env.BASE_URL}colleges/${college.file}`}
                    alt={college.name}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain filter contrast-105 group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLElement).style.display = 'none';
                    }}
                />
            </div>
            <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[12px] sm:text-[13px] font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors whitespace-nowrap">
                    {college.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 truncate max-w-[160px] sm:max-w-[200px] leading-tight mt-0.5">
                    {college.type}
                </span>
            </div>
        </div>
    );
};

export const CollegeTicker: React.FC = () => {
    return (
        <section className="py-14 sm:py-16 relative z-10 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/20 backdrop-blur-xs overflow-hidden select-none">
            {/* Header Content */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center space-y-3 mb-10">
                <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 bg-red-50/80 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 rounded-full text-[10px] sm:text-[11px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest shadow-xs">
                    <GraduationCap size={13} className="text-red-500" />
                    <span>Campus Talent Network</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Students From Leading Colleges &amp; Universities Intern at VINIX
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                    Empowering ambitious undergraduates and postgraduates across India with industry-ready virtual internships, verified credentials, and real production experience.
                </p>
            </div>

            {/* Scrolling Ticker Track */}
            <div className="relative w-full overflow-hidden space-y-4 select-none" title="Hover to pause">
                {/* Left and Right Gradient Edge Fades */}
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-slate-50/95 dark:from-brand-dark/95 to-transparent z-20" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-slate-50/95 dark:from-brand-dark/95 to-transparent z-20" />

                {/* Row 1 Marquee (Scrolls Left) */}
                <div className="flex overflow-hidden">
                    <div className="animate-college-marquee-left flex items-center gap-4 py-1 px-2 hover:[animation-play-state:paused]">
                        {[...ROW_1_COLLEGES, ...ROW_1_COLLEGES].map((col, idx) => (
                            <CollegeCard key={`c1-${col.id}-${idx}`} college={col} />
                        ))}
                    </div>
                </div>

                {/* Row 2 Marquee (Scrolls Right) */}
                <div className="flex overflow-hidden">
                    <div className="animate-college-marquee-right flex items-center gap-4 py-1 px-2 hover:[animation-play-state:paused]">
                        {[...ROW_2_COLLEGES, ...ROW_2_COLLEGES].map((col, idx) => (
                            <CollegeCard key={`c2-${col.id}-${idx}`} college={col} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Counter Strip */}
            <div className="max-w-7xl mx-auto px-6 mt-8 flex items-center justify-center gap-6 text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-red-500" />
                    <span>50+ Partner &amp; Affiliated Colleges</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Pan-India Engineering &amp; Degree Talent</span>
                </span>
            </div>
        </section>
    );
};

export default CollegeTicker;

