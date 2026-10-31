import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import {
    NewsTickerItem,
    getNewsTickerItems,
    NEWS_TICKER_CHANGED_EVENT
} from '../utils/newsTicker';

export const NewsTicker: React.FC = () => {
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

    const activeItems = items.filter((item) => item.isActive);
    if (activeItems.length === 0) {
        return null;
    }

    // Duplicate list for infinite smooth scrolling marquee
    const displayList = [...activeItems, ...activeItems];

    const handleItemClick = (item: NewsTickerItem) => {
        if (!item.link) return;
        if (item.isExternal || item.link.startsWith('http://') || item.link.startsWith('https://')) {
            window.open(item.link, '_blank', 'noopener,noreferrer');
        } else {
            navigate(item.link);
        }
    };

    const getTagBadge = (tag?: string, color?: NewsTickerItem['tagColor']) => {
        if (!tag) return null;
        let colorClasses = 'bg-blue-500/20 text-cyan-300 border-blue-400/30';
        if (color === 'emerald') colorClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
        if (color === 'rose') colorClasses = 'bg-rose-500/20 text-rose-300 border-rose-400/30';
        if (color === 'amber') colorClasses = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
        if (color === 'purple') colorClasses = 'bg-purple-500/20 text-purple-300 border-purple-400/30';

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider shrink-0 ${colorClasses}`}>
                {tag}
            </span>
        );
    };

    return (
        <aside
            aria-label="Website Latest Updates"
            className="w-full bg-[#081226] border-b border-blue-950/80 text-white relative z-40 select-none shadow-sm transition-colors"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between overflow-hidden">
                {/* Left Fixed Badge with Solid Background and Divider */}
                <div className="flex items-center shrink-0 pr-3 sm:pr-4 border-r border-white/15 bg-[#081226] z-20 h-full">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#154ED0] text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                        </span>
                        <span className="whitespace-nowrap font-sans">Latest Updates</span>
                    </div>
                </div>

                {/* Center Scrolling Ticker Track */}
                <div
                    className="flex-1 overflow-hidden relative h-full flex items-center pl-4 cursor-pointer"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onTouchStart={() => setIsHovered(true)}
                    onTouchEnd={() => setIsHovered(false)}
                    title="Hover to pause • Click to view"
                >
                    {/* Left Gradient Fade Mask */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#081226] to-transparent pointer-events-none z-10" />

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
                                className="inline-flex items-center space-x-2 mr-8 text-xs sm:text-[13px] font-medium text-slate-200 hover:text-cyan-300 transition-colors group shrink-0"
                            >
                                {getTagBadge(item.tag, item.tagColor)}
                                <span className="group-hover:underline underline-offset-2">
                                    {item.text}
                                </span>
                                {item.link && (
                                    <span className="inline-flex items-center text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity">
                                        {item.isExternal ? (
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        ) : (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        )}
                                    </span>
                                )}
                                <span
                                    aria-hidden="true"
                                    className="ml-6 text-blue-400/50 font-bold select-none text-xs"
                                >
                                    ✦
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Right Gradient Fade Mask */}
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#081226] to-transparent pointer-events-none z-10" />
                </div>
            </div>
        </aside>
    );
};

export default NewsTicker;
