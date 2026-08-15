import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Search, ShieldCheck, Calendar, User, Award, ShieldAlert, CheckCircle } from 'lucide-react';

interface OfferLetterVerificationResult {
    verified: boolean;
    offerLetterId: string;
    studentName: string;
    internshipTitle: string;
    duration: string;
    issueDate: string;
    status: string;
    verificationResult: string;
}

export const VerifyOffer: React.FC = () => {
    const { token } = useParams<{ token?: string }>();
    const navigate = useNavigate();

    const [inputVal, setInputVal] = useState(token || '');
    const [result, setResult] = useState<OfferLetterVerificationResult | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchVerify = async (tokenToVerify: string) => {
        if (!tokenToVerify.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('offer_letters')
                .select('*')
                .or(`offer_letter_id.eq.${tokenToVerify.trim()},verification_token.eq.${tokenToVerify.trim()}`)
                .maybeSingle();

            if (fetchError || !data) {
                throw new Error('Offer Letter verification token not found or invalid.');
            }

            setResult({
                verified: true,
                offerLetterId: data.offer_letter_id,
                studentName: data.student_name,
                internshipTitle: data.internship_title,
                duration: data.duration,
                issueDate: data.issue_date,
                status: data.status,
                verificationResult: 'OFFICIAL RECORD VALIDATED'
            });
        } catch (err: any) {
            setError(err.message || 'Offer Letter verification token not found or invalid.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            setInputVal(token);
            fetchVerify(token);
        }
    }, [token]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputVal.trim()) {
            navigate(`/verify/offer/${inputVal.trim()}`);
        }
    };

    return (
        <div className="min-h-screen py-16 px-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
            {/* Elegant Background Grid & Blur accents */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-10 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto space-y-12 relative z-10">

                {/* Title and Badges info */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400 shadow-sm select-none">
                            <ShieldCheck size={14} className="text-blue-500" />
                            <span>Offer Letter Verification</span>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none text-center">
                        Verify <span className="text-blue-600 dark:text-blue-400">Offer Letter</span>
                    </h1>

                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 text-center font-medium">
                        Enter an Offer Letter ID to verify candidate authenticity.
                    </p>
                </div>

                {/* Search Card exactly matching mockup */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-xl select-none space-y-4">
                    <div className="flex items-start gap-3 text-left">
                        <span className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl text-slate-500 flex items-center justify-center">
                            <Search className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight">Enter Offer Letter ID</h3>
                            <p className="text-xs text-slate-450 mt-1 font-medium font-mono">
                                Example: <span className="font-semibold text-slate-650 dark:text-slate-350">VINIX-OFFER-2026-XXXX</span>
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-2">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                                <Search size={18} />
                            </span>
                            <input
                                type="text"
                                required
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-sm focus:outline-none focus:border-blue-500 text-slate-850 dark:text-white font-medium placeholder-slate-400"
                                placeholder="Insert verification token..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3.5 font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                        >
                            <Search size={16} />
                            <span>Verify</span>
                        </button>
                    </form>
                </div>

                {/* Loading Spinner */}
                {loading && (
                    <div className="text-center py-10">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    </div>
                )}

                {/* Error panel */}
                {error && (
                    <div className="p-4 max-w-xl mx-auto bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center space-x-3 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300">
                        <ShieldAlert size={20} className="flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Result Card */}
                {result && (
                    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-8 space-y-6">

                        {/* Verification Ribbon */}
                        <div className="flex items-center space-x-3 bg-green-500/10 border-b border-green-500/20 -mx-8 -mt-8 px-8 py-5">
                            <ShieldCheck className="text-green-600 dark:text-green-400 flex-shrink-0" size={24} />
                            <div className="flex-1">
                                <h4 className="text-base font-bold text-green-800 dark:text-green-300 flex items-center gap-1.5">
                                    {result.verificationResult}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                                    This internship offer letter is officially registered under the VINIX system database.
                                </p>
                            </div>
                            <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-green-150 text-green-900 rounded-full dark:bg-green-950 dark:text-green-300">
                                {result.status}
                            </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            <div className="flex flex-col space-y-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Offer Letter ID</span>
                                <p className="text-sm font-bold text-slate-850 dark:text-slate-100">{result.offerLetterId}</p>
                            </div>

                            <div className="flex flex-col space-y-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Selected Graduate</span>
                                <p className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                                    <User size={14} className="text-slate-500" />
                                    <span>{result.studentName}</span>
                                </p>
                            </div>

                            <div className="flex flex-col space-y-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Internship Domain</span>
                                <p className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                    <Award size={14} className="text-blue-500" />
                                    <span>{result.internshipTitle}</span>
                                </p>
                            </div>

                            <div className="flex flex-col space-y-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Duration</span>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-350">{result.duration}</p>
                            </div>

                            <div className="flex flex-col space-y-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Issue Date</span>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                                    <Calendar size={14} className="text-slate-500" />
                                    <span>{new Date(result.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </p>
                            </div>

                            <div className="flex flex-col space-y-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</span>
                                <p className={`text-sm font-extrabold ${result.status === 'ACCEPTED' ? 'text-green-600' : result.status === 'DECLINED' ? 'text-red-500' : 'text-blue-600'}`}>{result.status}</p>
                            </div>
                        </div>

                        {/* Verified Banner note */}
                        <div className="border border-blue-100 dark:border-slate-800 bg-blue-50/20 dark:bg-slate-900/40 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-650 dark:text-slate-400">
                            <CheckCircle className="text-blue-650 dark:text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                            <div className="space-y-1">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">Official Authenticated VINIX Registry Document</p>
                                <p>This query verified that the candidate met the selection criteria for the Virtual Internship program and has been generated an official offer letter. Scanning this QR Code confirms the authenticity of this credentials.</p>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default VerifyOffer;
