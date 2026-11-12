import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import {
    PromoPopup,
    getActivePromoPopup,
    isPopupDismissed,
    dismissPopup,
    POPUP_CHANGED_EVENT
} from '../utils/promoPopup';

interface PromoPopupModalProps {
    forcePopup?: PromoPopup | null;
    onCloseForce?: () => void;
}

export const PromoPopupModal: React.FC<PromoPopupModalProps> = ({
    forcePopup,
    onCloseForce
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [popup, setPopup] = useState<PromoPopup | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [dontShowToday, setDontShowToday] = useState(false);

    useEffect(() => {
        let timer: any = null;

        const evaluate = () => {
            if (forcePopup) {
                setPopup(forcePopup);
                setIsOpen(true);
                return;
            }

            // Do not popup inside /admin to avoid interrupting admin workflow
            if (location.pathname.startsWith('/admin')) {
                setIsOpen(false);
                return;
            }

            const active = getActivePromoPopup();
            if (active && !isPopupDismissed(active.id)) {
                setPopup(active);
                timer = setTimeout(() => {
                    setIsOpen(true);
                }, 800);
            } else {
                setIsOpen(false);
            }
        };

        evaluate();

        window.addEventListener(POPUP_CHANGED_EVENT, evaluate);
        return () => {
            if (timer) clearTimeout(timer);
            window.removeEventListener(POPUP_CHANGED_EVENT, evaluate);
        };
    }, [location.pathname, forcePopup]);

    const handleClose = () => {
        if (popup) {
            dismissPopup(popup.id, dontShowToday ? 24 : 4);
        }
        setIsOpen(false);
        if (onCloseForce) onCloseForce();
    };

    const handleActionClick = () => {
        if (!popup) return;
        handleClose();

        if (popup.linkUrl.startsWith('http://') || popup.linkUrl.startsWith('https://')) {
            window.open(popup.linkUrl, '_blank', 'noopener,noreferrer');
        } else {
            navigate(popup.linkUrl);
        }
    };

    if (!isOpen || !popup) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none">
            <div
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative transform transition-all animate-scale-up text-left"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button ("X") */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition shadow-lg backdrop-blur-md active:scale-90"
                    aria-label="Close popup"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Banner Image */}
                <div className="h-56 sm:h-64 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    <img
                        src={popup.imageUrl}
                        alt={popup.title}
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                            e.target.src = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-7 space-y-4">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-wider border border-red-200/60 dark:border-red-900">
                            <Sparkles className="w-3 h-3" />
                            <span>Featured Announcement</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                            {popup.title}
                        </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {popup.description}
                    </p>

                    {/* Action & Options */}
                    <div className="pt-2 space-y-3">
                        <button
                            type="button"
                            onClick={handleActionClick}
                            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold shadow-lg shadow-red-600/25 transition-all flex items-center justify-center space-x-2 active:scale-98"
                        >
                            <span>{popup.linkLabel || 'Learn More'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-1">
                            <label className="flex items-center space-x-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={dontShowToday}
                                    onChange={(e) => setDontShowToday(e.target.checked)}
                                    className="rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-500"
                                />
                                <span>Don't show again today</span>
                            </label>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="hover:text-slate-600 dark:hover:text-slate-300 transition"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoPopupModal;
