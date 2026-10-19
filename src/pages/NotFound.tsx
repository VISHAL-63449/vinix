import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, Briefcase, Layers, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

export const NotFound: React.FC = () => {
    return (
        <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 dark:bg-brand-bgDark text-slate-800 dark:text-slate-100 px-4 py-16">
            <SEO
                title="Page Not Found (404)"
                description="The requested page could not be found on VINIX. Explore our virtual internships and learning domains."
                canonicalPath="/404"
                noindex={true}
            />

            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-[#154ED0] flex items-center justify-center shadow-sm">
                    <FileQuestion className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase">Error 404</span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Page Not Found</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        The page you are looking for does not exist or may have been moved. Choose a destination below to continue.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-bold">
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-[#154ED0] hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
                    >
                        <Home className="w-4 h-4" />
                        <span>Go to Home</span>
                    </Link>

                    <Link
                        to="/internships"
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow-sm transition"
                    >
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span>Explore Internships</span>
                    </Link>

                    <Link
                        to="/domains"
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow-sm transition sm:col-span-2"
                    >
                        <Layers className="w-4 h-4 text-emerald-500" />
                        <span>Browse 20+ Domains</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
