import React from 'react';
import FounderProfile from '../components/FounderProfile';

export const Founder: React.FC = () => {
    // Inject canonical URL manually since user requested
    React.useEffect(() => {
        let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
        const originalHref = canonical ? canonical.href : '';
        if (canonical) {
            canonical.href = "https://vinix.online/founder";
        }
        return () => {
            if (canonical) {
                canonical.href = originalHref;
            }
        };
    }, []);

    return (
        <div className="overflow-x-hidden min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
            {/* SEO Content for Search Engines */}
            <h1 className="sr-only">Vishal R - Founder & CEO of Vinix</h1>

            <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 bg-gradient-to-b from-blue-50/40 via-white to-transparent dark:from-slate-900/20 dark:via-slate-950 dark:to-transparent">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <FounderProfile showPillBadge={true} />
                </div>
            </section>
        </div>
    );
};

export default Founder;
