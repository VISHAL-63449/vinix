import React from 'react';
import FounderProfile from '../components/FounderProfile';
import SEO from '../components/SEO';

export const Founder: React.FC = () => {
    return (
        <div className="overflow-x-hidden min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
            <SEO
                title="Vishal R — Founder & CEO of VINIX"
                description="Meet Vishal R, Founder & CEO of VINIX. Dedicated to democratizing tech careers and real project experience through virtual internship education."
                canonicalPath="/founder"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "Person",
                    "name": "Vishal R",
                    "jobTitle": "Founder & CEO",
                    "worksFor": {
                        "@type": "Organization",
                        "name": "VINIX",
                        "url": "https://www.vinix.online/"
                    },
                    "url": "https://www.vinix.online/founder",
                    "sameAs": [
                        "https://www.linkedin.com/company/vinix-technologies"
                    ]
                }}
            />

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
