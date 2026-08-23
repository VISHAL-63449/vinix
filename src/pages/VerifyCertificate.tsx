import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Search, ShieldCheck, Calendar, User, Award, ShieldAlert, FileDown, Printer, GraduationCap, Briefcase, FileCode, CalendarDays } from 'lucide-react';

interface VerificationResult {
    verified: boolean;
    certificateNumber: string;
    studentName: string;
    courseName: string;
    issueDate: string;
    organization: string;
    status: string;
}

const VerifyCertificate: React.FC = () => {
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
            const { data, error: fetchError } = await supabase
                .from('certificates')
                .select('*')
                .eq('certificate_number', idToVerify.trim())
                .maybeSingle();

            if (fetchError || !data) {
                throw new Error('Certificate ID not found. Verify spelling.');
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', data.user_id)
                .maybeSingle();

            setResult({
                verified: true,
                certificateNumber: data.certificate_number,
                studentName: profile?.full_name || 'Vinix Graduate',
                courseName: data.course_name,
                issueDate: data.issue_date,
                organization: 'Vinix Technologies',
                status: data.status
            });
        } catch (err: any) {
            setError(err.message || 'Certificate ID not found. Verify character spelling.');
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

    const handleSaveDirectPDF = async () => {
        if (!result) return;
        setLoading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;
            const element = document.getElementById('certificate-print-area');
            if (element) {
                element.classList.add('cert-pdf-download-mode');
                // Give a microtask delay for DOM and style updates
                await new Promise(resolve => setTimeout(resolve, 150));

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#0b1a30',
                    logging: false,
                    scrollY: 0,
                    scrollX: 0
                });

                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });

                const pageWidth = 297;
                const pageHeight = 210;

                const imgWidth = pageWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Fit the complete canvas inside one A4 landscape page.
                const finalHeight = Math.min(imgHeight, pageHeight);

                pdf.addImage(
                    canvas.toDataURL('image/jpeg', 0.95),
                    'JPEG',
                    0,
                    0,
                    imgWidth,
                    finalHeight
                );

                pdf.save(`${result.certificateNumber || 'Certificate'}.pdf`);
                element.classList.remove('cert-pdf-download-mode');
            }
        } catch (err: any) {
            alert(`Direct download failed: ${err.message}. Using fallback print option.`);
            handleDownload();
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        const originalTitle = document.title;
        document.title = `${result.certificateNumber || 'Certificate'}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 100);
    };

    const verificationURL = result ? `${window.location.origin}/verify/${result.certificateNumber}` : '';

    return (
        <div className="min-h-screen py-16 px-4 bg-brand-bgLight dark:bg-brand-bgDark transition-colors duration-300 relative overflow-hidden select-none">

            {/* Background decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-10 pointer-events-none no-print"></div>

            <div className="max-w-4xl mx-auto space-y-12 relative z-10">

                {/* Title */}
                <div className="text-center space-y-4 no-print">
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-full text-xs font-semibold text-brand-primary dark:text-brand-accent shadow-sm">
                            <ShieldCheck size={14} className="text-brand-primary dark:text-brand-accent animate-pulse" />
                            <span>Verifiable Blockchain Credentials</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Verify <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">Certificates</span>
                    </h1>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Input a Certificate Number or Intern ID to check official verification records.
                    </p>
                </div>

                {/* Search input card */}
                <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-xl no-print">
                    <div className="flex items-start space-x-3 mb-4">
                        <span className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-550">
                            <Search className="w-5 h-5 text-brand-primary" />
                        </span>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-850 dark:text-slate-100">Enter Certificate Number</h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                Example format: VINIX-CERT-2026-1025
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            required
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-204 bg-white dark:bg-slate-950 dark:border-slate-805 text-sm focus:outline-none focus:border-brand-primary text-slate-800 dark:text-white"
                            placeholder="e.g. VINIX-CERT-..."
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow"
                        >
                            <Search size={16} />
                            <span>Verify ID</span>
                        </button>
                    </form>
                </div>

                {/* Loading Spinner */}
                {loading && (
                    <div className="text-center py-10 no-print">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto"></div>
                    </div>
                )}

                {/* Error panel */}
                {error && (
                    <div className="p-4 max-w-xl mx-auto bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center space-x-3 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300 no-print">
                        <ShieldAlert size={20} className="flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Results preview */}
                {result && (
                    <div className="space-y-6">

                        {/* Visual template mimic (printable style) */}
                        <div
                            id="certificate-print-area"
                            className="w-full aspect-[1.414/1] bg-[#0b1a30] p-[10px] relative flex flex-col justify-between overflow-hidden shadow-2xl rounded-2xl border border-[#b45309]/30 select-text"
                        >
                            {/* White card layout inner */}
                            <div className="absolute inset-[10px] bg-white rounded-[10px] z-0"></div>
                            {/* Gold borders */}
                            <div className="absolute inset-[18px] border-2 border-amber-600 pointer-events-none rounded-[8px] z-10"></div>

                            {/* Authority header */}
                            <div className="relative flex justify-between items-center z-20 px-10 pt-8 w-full">
                                {/* Left side: MSME Logo */}
                                <div className="flex items-center space-x-2">
                                    <img src="/msme-logo.png" alt="MSME Certified" className="h-9 object-contain" />
                                    <div className="text-left leading-none">
                                        <p className="text-[5.5px] font-black text-rose-700 tracking-wider">REG. NO: UDYAM-TN-02-XXXX</p>
                                        <p className="text-[4.5px] text-slate-400 font-semibold">Govt. of India Enterprise</p>
                                    </div>
                                </div>

                                {/* Center: Brand details */}
                                <div className="text-center flex flex-col items-center">
                                    <div className="flex items-center space-x-1.5">
                                        <GraduationCap className="w-5 h-5 text-brand-primary" />
                                        <span className="text-lg font-black text-[#0b1a30] tracking-wide">VINIX</span>
                                    </div>
                                    <span className="text-[6.5px] font-black text-slate-400 tracking-[0.2em] block mt-0.5">
                                        TECHNOLOGIES ACADEMIC DEPT.
                                    </span>
                                </div>

                                {/* Right side: ID Ref */}
                                <div className="text-right">
                                    <p className="text-[6.5px] font-mono text-slate-650 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-bold">
                                        REF NO: {result.certificateNumber}
                                    </p>
                                    <p className="text-[5px] text-slate-400 mt-1 uppercase font-bold tracking-wide">MSME ISO 9001:2015 CERTIFIED</p>
                                </div>
                            </div>

                            {/* Certificate content body */}
                            <div className="text-center my-auto space-y-3 z-20 px-10">
                                <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest">
                                    Certificate of Virtual Internship Completion
                                </p>
                                <div className="space-y-1">
                                    <p className="text-[9px] text-slate-450 italic">This is proudly presented to</p>
                                    <h3 className="text-2xl font-serif font-black text-slate-900 capitalize select-all">
                                        {result.studentName}
                                    </h3>
                                </div>

                                <div className="w-32 h-[1px] bg-amber-600 mx-auto"></div>

                                <p className="text-[10px] text-slate-500 max-w-lg mx-auto leading-relaxed">
                                    for outstanding dedication and active submission evaluations in the{' '}
                                    <strong className="text-brand-primary select-all">{result.courseName}</strong> virtual pathway,
                                    obtaining mentor validation criteria set by Vinix Technologies.
                                </p>
                            </div>

                            {/* Verification Info Bar */}
                            <div className="z-20 px-8">
                                <div className="grid grid-cols-4 border-y border-slate-200/80 py-2 text-left">
                                    <div>
                                        <span className="text-[6.5px] font-bold text-slate-400 block tracking-widest uppercase">Pathway</span>
                                        <span className="text-[8px] font-bold text-slate-805 block truncate select-all">{result.courseName}</span>
                                    </div>
                                    <div className="border-l border-slate-100 pl-3">
                                        <span className="text-[6.5px] font-bold text-slate-400 block tracking-widest uppercase">Certificate ID</span>
                                        <span className="text-[8px] font-bold text-slate-805 block truncate select-all">{result.certificateNumber}</span>
                                    </div>
                                    <div className="border-l border-slate-100 pl-3">
                                        <span className="text-[6.5px] font-bold text-slate-400 block tracking-widest uppercase">Issue Date</span>
                                        <span className="text-[8px] font-bold text-slate-805 block">
                                            {new Date(result.issueDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="border-l border-slate-100 pl-3">
                                        <span className="text-[6.5px] font-bold text-slate-400 block tracking-widest uppercase">RLS Verified</span>
                                        <span className="text-[8px] font-bold text-emerald-600 block uppercase">AUTHENTIC</span>
                                    </div>
                                </div>
                            </div>

                            {/* QR and CEO footer area */}
                            <div className="flex justify-between items-end z-20 px-10 pb-6">
                                <div className="flex items-center space-x-2 border border-slate-100 bg-white rounded-lg p-1 w-32 shadow-sm">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verificationURL)}`}
                                        alt="QR"
                                        className="w-10 h-10 object-contain"
                                    />
                                    <div className="text-left">
                                        <h5 className="text-[6.5px] font-extrabold text-slate-800">SCAN TO VERIFY</h5>
                                        <p className="text-[5.5px] text-slate-400 leading-none">Database validation link</p>
                                    </div>
                                </div>

                                {/* Seal / Stamp */}
                                <div className="relative w-16 h-16 flex items-center justify-center -mb-2">
                                    <img
                                        src="/certificate-stamp.jpeg"
                                        alt="Official Stamp"
                                        className="w-14 h-14 object-contain opacity-85 mix-blend-multiply filter contrast-125 saturate-150 rotate-6"
                                    />
                                </div>

                                <div className="text-center flex flex-col items-center relative min-w-[125px] pb-1">
                                    <span className="font-['Great_Vibes'] text-3xl text-slate-805 select-none transform -rotate-2 font-medium inline-block mb-1">
                                        Vishal R.
                                    </span>
                                    <div className="w-24 h-[1px] bg-slate-350"></div>
                                    <p className="text-[6px] font-extrabold text-[#0b1a30] tracking-wider uppercase mt-1">FOUNDER & CEO</p>
                                </div>
                            </div>
                        </div>

                        {/* Printing Options */}
                        <div className="bg-white dark:bg-brand-cardDark p-6 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl flex flex-col sm:flex-row gap-4 shadow no-print">
                            <button
                                onClick={handleSaveDirectPDF}
                                className="flex-1 py-3 bg-brand-primary text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2"
                            >
                                <FileDown className="w-4 h-4" />
                                <span>Save PDF Copy</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-2"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print Document</span>
                            </button>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default VerifyCertificate;
