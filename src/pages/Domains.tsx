import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, DomainModel } from '../utils/supabase';
import * as Icons from 'lucide-react';

const { Search, ArrowRight, Sparkles, BookOpen, Layers } = Icons;

interface DomainWithCount extends DomainModel {
    internshipCount: number;
}

export default function Domains() {
    const [domains, setDomains] = useState<DomainWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        async function fetchDomains() {
            try {
                setLoading(true);
                // Fetch domains and their active internships directly
                const { data: domainsData, error: domainsErr } = await supabase
                    .from('domains')
                    .select('*, internships(id, status, is_active)')
                    .eq('is_active', true);

                if (domainsErr) throw domainsErr;

                const mapped: DomainWithCount[] = (domainsData || []).map((d: any) => {
                    const activeInternships = (d.internships || []).filter(
                        (i: any) => i.status === 'active' || i.is_active === true
                    );
                    return {
                        id: d.id,
                        name: d.name,
                        slug: d.slug,
                        description: d.description,
                        icon: d.icon,
                        image: d.image,
                        skills: d.skills || [],
                        is_active: d.is_active,
                        internshipCount: activeInternships.length
                    };
                });

                setDomains(mapped);
            } catch (err) {
                console.error('Error fetching domains:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchDomains();
    }, []);

    // Filter based on search query
    const filteredDomains = domains.filter((d) => {
        const query = debouncedQuery.toLowerCase();
        return (
            d.name.toLowerCase().includes(query) ||
            d.description.toLowerCase().includes(query) ||
            d.skills.some((s) => s.toLowerCase().includes(query))
        );
    });

    const getIconElement = (iconName: string) => {
        const LucideIcon = (Icons as any)[iconName];
        if (LucideIcon) return <LucideIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
        return <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wider bg-blue-100/30 text-blue-600 dark:text-blue-400 uppercase border border-blue-500/10 inline-flex items-center space-x-1.5 mb-4 max-w-fit">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Interactive Learning Tracks</span>
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                        Explore Virtual Internship <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Domains</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                        Advance your technical capabilities, construct enterprise portfolios, and earn industry-grade certifications across diverse paths.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-xl mx-auto mb-16 relative">
                    <div className="relative group">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-650 opacity-15 blur-sm group-hover:opacity-25 transition duration-300"></div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4.5 pointer-events-none">
                                <Search className="h-5 h-5 text-slate-400" />
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search domains, skills, or tools (e.g. React, Python)..."
                                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white pl-12 pr-4.5 py-3.5 rounded-full border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold shadow-sm text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 animate-pulse space-y-4">
                                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                                <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                                <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                    <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredDomains.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200/50 dark:border-slate-800/45 max-w-xl mx-auto shadow-sm">
                        <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">No domains found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 px-6 text-sm font-semibold">
                            We couldn't find any domains matching "{searchQuery}". Try refining your keywords or search query.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredDomains.map((domain) => (
                            <div
                                key={domain.id}
                                className="group relative bg-white dark:bg-slate-900/65 rounded-3xl border border-slate-250/60 dark:border-slate-800/40 hover:border-blue-500/50 dark:hover:border-blue-500/30 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col min-h-[420px]"
                            >
                                {/* Static Header Decorative Image */}
                                {domain.image ? (
                                    <div className="h-36 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <img
                                            src={domain.image}
                                            alt={domain.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent"></div>
                                    </div>
                                ) : (
                                    <div className="h-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                                )}

                                <div className="p-6.5 flex-grow flex flex-col justify-between">
                                    <div className="space-y-4">
                                        {/* Icon & Title */}
                                        <div className="flex items-center space-x-3.5">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center border border-blue-200/30 transition-transform group-hover:scale-108 duration-300">
                                                {getIconElement(domain.icon)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {domain.name}
                                                </h3>
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                                    {domain.internshipCount} {domain.internshipCount === 1 ? 'Internship' : 'Internships'} Available
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-350 leading-relaxed line-clamp-3">
                                            {domain.description}
                                        </p>

                                        {/* Skills */}
                                        <div className="space-y-2 pt-2">
                                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">Skills Highlighted</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {domain.skills.slice(0, 4).map((skill, sIdx) => (
                                                    <span
                                                        key={sIdx}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {domain.skills.length > 4 && (
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-blue-650 bg-blue-50 dark:bg-blue-950/20 border border-blue-200/25">
                                                        +{domain.skills.length - 4} More
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="pt-6.5">
                                        <Link
                                            to={`/domains/${domain.slug}`}
                                            className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md group-hover:shadow-lg transition-all duration-300 cursor-pointer"
                                        >
                                            <span>Explore Internships</span>
                                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition duration-200" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
