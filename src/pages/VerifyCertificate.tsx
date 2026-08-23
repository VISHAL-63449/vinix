import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../utils/supabase';
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
            const { data, error: fetchError } = await supabaseAdmin
                .from('certificates')
                .select('*')
                .eq('certificate_number', idToVerify.trim())
                .maybeSingle();

            if (fetchError || !data) {
                throw new Error('Certificate ID not found. Verify spelling.');
            }

            const { data: profile } = await supabaseAdmin
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
                // Save current scroll position
                const scrollY = window.scrollY;
                const scrollX = window.scrollX;

                // Scroll to top-left to avoid html2canvas viewport offset/cropping bugs
                window.scrollTo(0, 0);

                element.classList.add('cert-pdf-download-mode');
                // Give a microtask delay for DOM and style updates
                await new Promise(resolve => setTimeout(resolve, 250));

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    scrollY: 0,
                    scrollX: 0
                });

                // Restore scroll positions immediately
                window.scrollTo(scrollX, scrollY);

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
                            className="w-full aspect-[1.414/1] bg-white relative flex flex-col justify-between overflow-hidden shadow-2xl border-[12px] border-[#0b1a30] p-8 select-text"
                        >
                            {/* Inner thin border */}
                            <div className="absolute inset-[8px] border border-[#0b1a30] pointer-events-none z-10"></div>

                            {/* Authority header */}
                            <div className="relative flex justify-between items-center z-20 px-10 pt-6 w-full">
                                {/* Left side: VINIX Block Logo (mimics pic 1) */}
                                <div className="flex items-center space-x-2">
                                    <div className="bg-[#0b1a30] text-white p-2 rounded-lg flex items-center justify-center font-bold tracking-tight text-sm w-12 h-12 shadow select-none">
                                        <span className="font-sans font-black flex flex-col leading-none text-center">
                                            <span className="text-[7.5px] uppercase tracking-[0.2em] font-normal text-amber-500">vnx</span>
                                            <span className="text-[12px] font-black uppercase text-white tracking-widest mt-0.5">vinix</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Center: Brand details */}
                                <div className="text-center flex flex-col items-center">
                                    <span className="text-xl font-extrabold text-[#0b1a30] tracking-[0.25em] block leading-none font-sans uppercase">
                                        VINIX TECHNOLOGIES
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 tracking-[0.18em] block mt-1.5 uppercase">
                                        Empowering Future Innovators
                                    </span>
                                </div>

                                {/* Right side: MSME Logo */}
                                <div className="flex items-center space-x-2">
                                    <img src={`${import.meta.env.BASE_URL}msme-logo.png`} alt="MSME Certified" className="h-10 object-contain" />
                                    <div className="text-left leading-none">
                                        <p className="text-[6.5px] font-black text-rose-700 tracking-wider">REG. NO: UDYAM-TN-02-XXXX</p>
                                        <p className="text-[5.5px] text-slate-450 font-semibold">Govt. of India Enterprise</p>
                                    </div>
                                </div>
                            </div>

                            {/* Certificate main title block */}
                            <div className="relative text-center z-20 mt-4 flex flex-col items-center">
                                <h2 className="text-[36px] font-black text-[#0b1a30] tracking-[0.25em] leading-none uppercase">
                                    CERTIFICATE
                                </h2>
                                <h4 className="text-[10px] font-extrabold text-slate-450 tracking-[0.4em] leading-none mt-2.5 uppercase">
                                    OF INTERNSHIP COMPLETION
                                </h4>
                            </div>

                            {/* Recipient presentation line */}
                            <div className="relative text-center z-20 flex flex-col items-center mt-2">
                                <p className="text-[11px] text-slate-500 italic">This certificate is proudly presented to</p>
                                <h3 className="text-3xl font-bold text-[#0b1a30] tracking-wide mt-1.5 border-b border-amber-600/35 pb-1 px-12 min-w-[280px] inline-block capitalize font-sans leading-snug">
                                    {result.studentName}
                                </h3>
                            </div>

                            {/* Body description */}
                            <div className="relative text-center z-20 px-12 mt-2">
                                <p className="text-[11px] text-slate-650 max-w-[620px] mx-auto leading-relaxed">
                                    for successfully completing the task-based virtual internship program in{' '}
                                    <strong className="text-[#0b1a30] font-extrabold">{result.courseName}</strong> at{' '}
                                    <strong className="text-[#0b1a30] font-extrabold">Vinix Technologies</strong>, demonstrating
                                    dedication, technical skill, and professional excellence throughout the program.
                                </p>
                            </div>

                            {/* Signatures & Seal Area */}
                            <div className="relative flex justify-between items-end z-20 px-14 mt-4">
                                {/* Left Signature */}
                                <div className="text-center flex flex-col items-center min-w-[140px] pb-1">
                                    <span className="font-['Great_Vibes'] text-3xl text-slate-800 select-none transform -rotate-1 font-medium inline-block mb-1">
                                        Vishal R.
                                    </span>
                                    <div className="w-28 h-[1px] bg-slate-300"></div>
                                    <h5 className="text-[10px] font-bold text-[#0b1a30] mt-1 leading-none">Vishal R</h5>
                                    <p className="text-[8px] font-medium text-slate-400 mt-0.5 leading-none">Founder & CEO</p>
                                </div>

                                {/* Circular Seal Stamp */}
                                <div className="relative w-20 h-20 flex items-center justify-center -mb-2">
                                    <img
                                        src={`${import.meta.env.BASE_URL}certificate-stamp.jpeg`}
                                        alt="Official Seal"
                                        className="w-18 h-18 object-contain opacity-95 mix-blend-multiply filter contrast-125 saturate-150 rotate-3"
                                    />
                                </div>

                                {/* Right Signature */}
                                <div className="text-center flex flex-col items-center min-w-[140px] pb-1">
                                    <span className="font-['Great_Vibes'] text-3xl text-slate-800 select-none transform -rotate-2 font-medium inline-block mb-1">
                                        Gireesh K.
                                    </span>
                                    <div className="w-28 h-[1px] bg-slate-300"></div>
                                    <h5 className="text-[10px] font-bold text-[#0b1a30] mt-1 leading-none">Gireesh K</h5>
                                    <p className="text-[8px] font-medium text-slate-400 mt-0.5 leading-none">Co-Founder & CTO</p>
                                </div>
                            </div>

                            {/* Bottom references footer bar */}
                            <div className="relative flex justify-between items-center z-20 px-10 pt-4 pb-2 border-t border-slate-100 mt-4 text-[7px] text-slate-450 font-mono">
                                <div>Certificate ID: {result.certificateNumber}</div>
                                <div className="text-center">
                                    <div>Intern ID: VINIX-{result.certificateNumber.split('-').pop()}</div>
                                    <div className="mt-0.5">Verify at: {window.location.origin}/verify/{result.certificateNumber}</div>
                                </div>
                                <div className="text-right">Issued: {new Date(result.issueDate).toLocaleDateString()}</div>
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

            </div >
        </div >
    );
};

export default VerifyCertificate;
