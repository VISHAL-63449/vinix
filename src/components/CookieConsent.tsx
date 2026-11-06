import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, ShieldCheck } from 'lucide-react';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        try {
            const consent = localStorage.getItem('vinix_cookie_consent');
            if (!consent) {
                // Show after brief delay so it doesn't jarringly block initial render
                const timer = setTimeout(() => setIsVisible(true), 1200);
                return () => clearTimeout(timer);
            }
        } catch (e) {
            // Fail silently if localStorage is restricted
        }
    }, []);

    const handleAccept = () => {
        try {
            localStorage.setItem('vinix_cookie_consent', 'accepted');
        } catch (e) { }
        setIsVisible(false);
    };

    const handleEssentialOnly = () => {
        try {
            localStorage.setItem('vinix_cookie_consent', 'essential');
        } catch (e) { }
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <aside
            aria-label="Cookie consent banner"
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-fade-in-up"
        >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl text-left">
                <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                        <Cookie className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1.5 pr-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>Cookie &amp; Privacy Notice</span>
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            We use cookies and third-party advertising partners (including Google AdSense) to deliver tailored learning content, analyze site usage, and verify digital credentials.
                        </p>
                        <div className="pt-1">
                            <Link
                                to="/privacy"
                                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-700"
                            >
                                Review our Privacy Policy →
                            </Link>
                        </div>
                    </div>
                    <button
                        onClick={handleEssentialOnly}
                        aria-label="Dismiss banner"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleEssentialOnly}
                        className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    >
                        Essential Only
                    </button>
                    <button
                        type="button"
                        onClick={handleAccept}
                        className="px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default CookieConsent;

