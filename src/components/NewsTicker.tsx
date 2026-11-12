import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import {
    NewsTickerItem,
    getNewsTickerItems,
    NEWS_TICKER_CHANGED_EVENT
} from '../utils/newsTicker';

export interface NewsTickerProps {
    embedded?: boolean;
    className?: string;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ embedded = false, className = '' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [items, setItems] = useState<NewsTickerItem[]>(() => getNewsTickerItems());
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handler = () => {
            setItems(getNewsTickerItems());
        };
        window.addEventListener(NEWS_TICKER_CHANGED_EVENT, handler);
        return () => window.removeEventListener(NEWS_TICKER_CHANGED_EVENT, handler);
    }, []);

    // Do not show on admin or student dashboard layouts
    const currentPath = (location.pathname || '').toLowerCase();
    if (currentPath.includes('/admin') || currentPath.includes('/dashboard')) {
        return null;
    }

    // When not embedded, hide on the home page so Home can render its own embedded NewsTicker inside the hero section (under the hero background image)
    const isHomePage = location.pathname === '/' || location.pathname === '';
    if (!embedded && isHomePage) {
        return null;
    }

    const activeItems = items.filter((item) => item.isActive);
    if (activeItems.length === 0) {
        return null;
    }

    // Duplicate list for infinite smooth scrolling marquee
    const displayList = [...activeItems, ...activeItems];

    const handleItemClick = (item: NewsTickerItem) => {
        if (!item.link) {
            navigate('/internships');
            return;
        }
        if (item.isExternal || item.link.startsWith('http://') || item.link.startsWith('https://')) {
            window.open(item.link, '_blank', 'noopener,noreferrer');
        } else {
            navigate(item.link);
        }
    };

    // Highlight key phrase in red matching the sample design
    const renderStyledText = (text: string) => {
        const regex = /(Admissions Open|Free Task-Based Virtual Internships|100% Free|New Track Launched|Instant Digital)/gi;
        const parts = text.split(regex);
        return parts.map((part, i) => {
            if (/Admissions Open/i.test(part)) {
                return (
                    <span key={i} className="text-red-600 dark:text-red-400 font-black">
                        {part}
                    </span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <aside
            aria-label="Website Latest Updates"
            className={className || "w-full relative z-30 select-none px-4 sm:px-6 lg:px-8 pt-2 pb-1"}
        >
            <div className="mx-auto max-w-7xl h-10 sm:h-12 bg-white/95 dark:bg-zinc-950/90 border border-red-200/90 dark:border-red-900/50 rounded-full shadow-[0_2px_15px_-3px_rgba(220,38,38,0.12)] backdrop-blur-md flex items-center justify-between overflow-hidden">
                {/* Left Badge: Solid Red Pill Tag with LATEST UPDATES */}
                <div className="h-full shrink-0 flex items-center">
                    <div className="h-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black text-[9px] xs:text-[10px] sm:text-xs tracking-wider uppercase px-2.5 xs:px-3 sm:px-5 flex items-center justify-center rounded-l-full shadow-sm whitespace-nowrap">
                        <span>LATEST UPDATES</span>
                    </div>
                </div>

                {/* Center Scrolling Ticker Track */}
                <div
                    className="flex-1 overflow-hidden relative h-full flex items-center px-2 sm:px-4 cursor-pointer"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onTouchStart={() => setIsHovered(true)}
                    onTouchEnd={() => setIsHovered(false)}
                    title="Hover to pause • Click to open"
                >
                    {/* Left Gradient Fade Mask */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent pointer-events-none z-10" />

                    {/* Scrolling Track */}
                    <div
                        className={`animate-ticker-marquee flex items-center py-1 ${
                            isHovered ? 'ticker-paused' : ''
                        }`}
                    >
                        {displayList.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                onClick={() => handleItemClick(item)}
                                className="inline-flex items-center space-x-2 mr-8 sm:mr-12 text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 hover:text-red-600 dark:hover:text-red-400 transition-colors group shrink-0"
                            >
                                <span className="text-sm shrink-0">🎓</span>
                                <span className="group-hover:underline underline-offset-2">
                                    {renderStyledText(item.text)}
                                </span>
                                {item.link && (
                                    <span className="inline-flex items-center text-red-500 opacity-70 group-hover:opacity-100 transition-opacity">
                                        {item.isExternal ? (
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        ) : (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        )}
                                    </span>
                                )}
                                <span
                                    aria-hidden="true"
                                    className="ml-6 sm:ml-8 text-red-400/60 font-black select-none text-xs"
                                >
                                    ✦
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Right Gradient Fade Mask */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent pointer-events-none z-10" />
                </div>

                {/* Right Action Button: Red Pill with View All -> */}
                <div className="shrink-0 pr-1.5 sm:pr-2 flex items-center">
                    <button
                        onClick={() => navigate('/internships')}
                        className="inline-flex items-center gap-1 px-2.5 xs:px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-[9.5px] xs:text-[10px] sm:text-xs font-black tracking-wide shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        title="View All Internships & Updates"
                    >
                        <span>View All</span>
                        <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default NewsTicker;
