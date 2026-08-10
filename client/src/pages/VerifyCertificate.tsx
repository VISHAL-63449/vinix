import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, ShieldCheck, Calendar, User, Award, ShieldAlert, FileDown, Printer, GraduationCap, Briefcase, FileCode2, CalendarRange } from 'lucide-react';

interface VerificationResult {
    verified: boolean;
    certificateNumber: string;
    studentName: string;
    courseName: string;
    issueDate: string;
    organization: string;
    status: string;
}

export const VerifyCertificate: React.FC = () => {
    const { certNo } = useParams<{ certNo?: string }>();
    const navigate = useNavigate();

    const [inputVal, setInputVal] = useState(certNo || '');
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchVerify = async (idToVerify: string) => {
        if (!idToVerify.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await api.get(`/certificates/verify/${idToVerify.trim()}`);
            setResult(res.data);
        } catch (err) {
            const errorObj = err as Record<string, unknown>;
            const responseObj = errorObj.response as Record<string, unknown> | undefined;
            const dataObj = responseObj?.data as Record<string, unknown> | undefined;
            setError((dataObj?.message as string) || 'Certificate ID not found. Verify character spelling.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (certNo) {
            setInputVal(certNo);
            fetchVerify(certNo);
        }
    }, [certNo]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputVal.trim()) {
            navigate(`/verify/${inputVal.trim()}`);
        }
    };

    const verificationURL = result ? `${window.location.origin}/verify/${result.certificateNumber}` : '';

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
                            <span>Certificate Verification</span>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                        Verify <span className="text-blue-600 dark:text-blue-400">Certificate</span>
                    </h1>

                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
                        Enter a Certificate ID or Intern ID to verify authenticity.
                    </p>
                </div>

                {/* Search Card exactly matching mockup */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-xl select-none space-y-4">
                    <div className="flex items-start gap-3 text-left">
                        <span className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl text-slate-500 flex items-center justify-center">
                            <Search className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight">Enter Certificate ID or Intern ID</h3>
                            <p className="text-xs text-slate-450 mt-1 font-medium font-mono">
                                Example: <span className="font-semibold text-slate-650 dark:text-slate-350">VINIX-OFFER-2026-XXXX</span> or <span className="font-semibold text-slate-650 dark:text-slate-350">VINIX-CERT-2026-XXXX</span>
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
                                placeholder="e.g. VINIX-2026-XXXX"
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

                {/* Result Card with Live Interactive Mock Preview */}
                {result && (
                    <div className="space-y-6 animate-float">

                        {/* VERIFIABLE CERTIFICATE PREVIEW CONTAINER */}
                        <div
                            id="certificate-print-area"
                            className="w-full aspect-[1.414/1] bg-[#0b1a30] p-[10px] relative flex flex-col justify-between overflow-hidden shadow-2xl rounded-3xl selection:bg-transparent"
                        >
                            {/* White core backdrop inside blue border */}
                            <div className="absolute inset-[10px] bg-white pointer-events-none rounded-[14px] z-0"></div>

                            {/* Outer Gold double border frame constraints */}
                            <div className="absolute inset-[18px] border-[1.5px] border-[#b45309] pointer-events-none rounded-[10px] z-10"></div>
                            <div className="absolute inset-[22px] border-[0.5px] border-[#d97706] pointer-events-none rounded-[8px] z-10"></div>

                            {/* Corner Ornaments */}
                            {/* Top-Left blue triangle and gold stripes */}
                            <div className="absolute top-[10px] left-[10px] w-28 h-28 bg-[#0b1a30] z-20 pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
                            <div className="absolute top-[10px] left-[10px] w-[116px] h-[116px] border-b-2 border-r-2 border-[#d97706] rotate-45 z-10 pointer-events-none origin-top-left translate-x-[-1px] translate-y-[-1px]"></div>
                            <div className="absolute top-[10px] left-[10px] w-[122px] h-[122px] border-b-[0.5px] border-r-[0.5px] border-[#b45309] rotate-45 z-10 pointer-events-none origin-top-left translate-x-[-1px] translate-y-[-1px]"></div>

                            {/* Bottom-Right blue triangle and gold stripes */}
                            <div className="absolute bottom-[10px] right-[10px] w-28 h-28 bg-[#0b1a30] z-20 pointer-events-none" style={{ clipPath: 'polygon(100% 100%, 100% 0, 0 100%)' }}></div>
                            <div className="absolute bottom-[10px] right-[10px] w-[116px] h-[116px] border-t-2 border-l-2 border-[#d97706] rotate-45 z-10 pointer-events-none origin-bottom-right translate-x-[1px] translate-y-[1px]"></div>
                            <div className="absolute bottom-[10px] right-[10px] w-[122px] h-[122px] border-t-[0.5px] border-l-[0.5px] border-[#b45309] rotate-45 z-10 pointer-events-none origin-bottom-right translate-x-[1px] translate-y-[1px]"></div>

                            {/* Top-Right & Bottom-Left gold bracket angles */}
                            <div className="absolute top-[40px] right-[40px] w-8 h-8 border-t-2 border-r-2 border-[#d97706] pointer-events-none z-10"></div>
                            <div className="absolute bottom-[40px] left-[40px] w-8 h-8 border-b-2 border-l-2 border-[#d97706] pointer-events-none z-10"></div>

                            {/* Top Section Layout */}
                            <div className="relative flex justify-center items-center z-20 px-8 pt-8 w-full">
                                {/* MSME Register Logo (Left Side) */}
                                <div className="absolute left-[145px] top-[26px] w-[58px] h-[64px] bg-white flex items-center justify-center select-none">
                                    <img src="/msme-logo.png" alt="MSME Registered" className="w-full h-full object-contain" />
                                </div>

                                {/* Authority Crest Logo (Perfect Center) */}
                                <div className="text-center flex flex-col items-center">
                                    <div className="flex items-center justify-center space-x-1.5 ">
                                        <GraduationCap size={24} className="text-blue-600" />
                                        <span className="text-xl font-black text-[#0b1a30] tracking-tight">VINIX</span>
                                    </div>
                                    <span className="text-[7.5px] font-black text-slate-500 tracking-[0.3em] block leading-none mt-0.5 whitespace-nowrap">
                                        TECHNOLOGIES
                                    </span>
                                </div>

                                {/* Reference Document Tag (Right Side) */}
                                <div className="absolute right-[46px] top-[38px] text-right text-[8px] font-bold text-slate-500 font-mono select-none">
                                    REF: {result.certificateNumber}
                                </div>
                            </div>

                            {/* Body Section Layout */}
                            <div className="text-center my-auto space-y-3 sm:space-y-4 z-20 px-6 sm:px-16 pt-2">
                                {/* Sparkle diamond element */}
                                <div className="flex justify-center">
                                    <div className="w-2.5 h-2.5 bg-[#d97706] rotate-45 rounded-[1px] shadow-sm"></div>
                                </div>

                                <h2 className="text-lg sm:text-2xl font-serif font-black text-[#0b1a30] tracking-wide select-none">
                                    CERTIFICATE OF VIRTUAL INTERNSHIP
                                </h2>

                                <div className="space-y-1">
                                    <p className="text-[10px] sm:text-xs text-slate-500 font-semibold italic">
                                        This certificate is proudly presented to
                                    </p>
                                    <h3 className="text-xl sm:text-3.5xl font-black font-serif text-[#0d1e3d] flex items-center justify-center gap-1.5 select-all leading-tight">
                                        {result.studentName}
                                    </h3>
                                </div>

                                {/* Custom separator lines & diamond */}
                                <div className="flex items-center justify-center space-x-3 w-[260px] mx-auto py-0.5">
                                    <div className="h-[0.7px] flex-grow bg-[#d97706]/70"></div>
                                    <div className="w-1.5 h-1.5 bg-[#d97706] rotate-45"></div>
                                    <div className="h-[0.7px] flex-grow bg-[#d97706]/70"></div>
                                </div>

                                <p className="text-[9.5px] sm:text-[11px] text-slate-650 max-w-xl mx-auto leading-relaxed">
                                    for outstanding performance and successful completion of the{' '}
                                    <strong className="text-blue-630 font-bold select-all whitespace-nowrap">{result.courseName}</strong>{' '}
                                    virtual internship program at{' '}
                                    <span className="font-semibold text-[#0d1e3d]">Vinix Technologies</span>.
                                </p>
                            </div>

                            {/* Metadata Horizontal Compartments Y=305 */}
                            <div className="z-20 px-[55px] mb-2">
                                <div className="grid grid-cols-4 bg-slate-500/[0.015] border-t border-b border-[#d97706]/65 py-1.5 text-left">
                                    {/* Column 1: Internship */}
                                    <div className="pl-4 pr-2 flex items-center space-x-2.5">
                                        <Briefcase size={12} className="text-blue-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <span className="text-[6.5px] font-black text-slate-400 block tracking-wider leading-none uppercase">INTERNSHIP</span>
                                            <span className="text-[8px] font-black text-slate-700 block truncate mt-0.5 select-all">{result.courseName}</span>
                                        </div>
                                    </div>

                                    {/* Column 2: Certificate ID */}
                                    <div className="px-4 flex items-center space-x-2.5 border-l border-slate-200">
                                        <FileCode2 size={12} className="text-blue-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <span className="text-[6.5px] font-black text-slate-400 block tracking-wider leading-none uppercase">CERTIFICATE ID</span>
                                            <span className="text-[8px] font-black text-slate-700 block truncate mt-0.5 select-all">{result.certificateNumber}</span>
                                        </div>
                                    </div>

                                    {/* Column 3: Issue Date */}
                                    <div className="px-4 flex items-center space-x-2.5 border-l border-slate-200">
                                        <CalendarRange size={12} className="text-blue-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <span className="text-[6.5px] font-black text-slate-400 block tracking-wider leading-none uppercase">ISSUE DATE</span>
                                            <span className="text-[8px] font-black text-slate-700 block truncate mt-0.5 select-all">
                                                {new Date(result.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Column 4: Verification Status */}
                                    <div className="px-4 flex items-center space-x-2.5 border-l border-slate-200">
                                        <ShieldCheck size={12} className="text-blue-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <span className="text-[6.5px] font-black text-slate-400 block tracking-wider leading-none uppercase">STATUS</span>
                                            <span className="text-[8px] font-black text-emerald-600 block mt-0.5 leading-none uppercase">{result.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Row Layout */}
                            <div className="flex justify-between items-end z-20 px-[55px] pb-6 pt-1">
                                {/* Bottom Left: Scan verification QR panel */}
                                <div className="border border-slate-200 bg-white rounded-lg p-1.5 flex items-center space-x-2.5 w-[145px] shadow-sm">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verificationURL)}`}
                                        alt="Verify QR"
                                        className="w-11 h-11 object-contain select-none"
                                    />
                                    <div className="min-w-0">
                                        <h5 className="text-[7px] font-black text-slate-800 leading-none">SCAN TO VERIFY</h5>
                                        <p className="text-[6px] text-slate-450 mt-0.5 leading-none">Certificate Validity</p>
                                        <div className="h-[0.5px] bg-slate-100 my-1 w-16"></div>
                                        <p className="text-[5px] text-slate-400 leading-tight">Verify this credential online.</p>
                                    </div>
                                </div>

                                {/* Bottom Center: Official Certificate Stamp (Medium size, high clarity) */}
                                <div className="w-20 h-20 flex items-center justify-center select-none translate-y-[-4px]">
                                    <img
                                        src="/certificate-stamp.jpeg"
                                        alt="Official Certificate Stamp"
                                        className="w-[72px] h-[72px] object-contain rounded-full shadow-md border border-slate-200 bg-white"
                                    />
                                </div>

                                {/* Bottom Right: Authorized Signature */}
                                <div className="w-[145px] text-center flex flex-col items-center">
                                    {/* Simulated Cursive Signature text */}
                                    <span className="font-serif italic text-lg sm:text-2xl text-blue-800 tracking-wide select-none leading-none mb-0.5">
                                        Vishal R.
                                    </span>
                                    <div className="h-[0.8px] w-full bg-[#d97706]"></div>
                                    <h4 className="text-[8px] font-extrabold text-[#0b1a30] uppercase mt-1 leading-none">Vishal R</h4>
                                    <p className="text-[7px] text-slate-500 leading-none mt-0.5">Founder & CEO</p>
                                    <p className="text-[6px] text-slate-400 font-semibold leading-none mt-0.5">Vinix Technologies</p>
                                </div>
                            </div>

                            {/* Bottom-most Trapezoid Banner Block */}
                            <div className="absolute bottom-[10px] left-1/2 transform -translate-x-1/2 w-48 h-6 bg-[#0b1a30] border-t border-l border-r border-[#d97706] rounded-t-lg z-20 flex flex-col items-center justify-center pointer-events-none select-none">
                                <span className="text-[6.5px] font-extrabold text-[#d97706] tracking-[0.12em] leading-none mb-0.5">VINIX TECHNOLOGIES</span>
                                <span className="text-[5.5px] font-medium text-white/95 leading-none">Certificate of Virtual Internship</span>
                            </div>
                        </div>

                        {/* Top Summary & Action Options */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-205 dark:border-slate-805 p-6 shadow-xl">

                            <div className="flex items-center space-x-3 mb-6 bg-green-500/10 border-b border-green-55/20 -mx-6 -mt-6 px-6 py-4">
                                <ShieldCheck className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold text-green-800 dark:text-green-300 uppercase tracking-wide">Valid Verification Records Found</h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">The certificate code corresponds to a registered virtual internship graduate.</p>
                                </div>
                                <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-850 rounded-full dark:bg-green-950 dark:text-green-300">
                                    {result.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-6">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Internship Graduate</span>
                                    <p className="text-xs font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1">
                                        <User size={12} className="text-slate-400" />
                                        <span>{result.studentName}</span>
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Learning Domain</span>
                                    <p className="text-xs font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1">
                                        <Award size={12} className="text-slate-400" />
                                        <span>{result.courseName}</span>
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Issue Date</span>
                                    <p className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1">
                                        <Calendar size={12} className="text-slate-400" />
                                        <span>{new Date(result.issueDate).toLocaleDateString()}</span>
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Organization</span>
                                    <p className="text-xs font-bold text-slate-855 dark:text-slate-205">{result.organization}</p>
                                </div>
                            </div>

                            {/* Interaction Action triggers */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <a
                                    href={`http://localhost:5000/api/certificates/pdf/${result.certificateNumber}`}
                                    className="flex-1 flex items-center justify-center space-x-1.5 py-3 text-xs font-bold text-white bg-blue-650 hover:bg-blue-700 rounded-xl transition shadow active:scale-[0.98]"
                                >
                                    <FileDown size={14} />
                                    <span>Download PDF Document</span>
                                </a>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 flex items-center justify-center space-x-1.5 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition dark:text-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98]"
                                >
                                    <Printer size={14} />
                                    <span>Print Certificate</span>
                                </button>
                            </div>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default VerifyCertificate;
