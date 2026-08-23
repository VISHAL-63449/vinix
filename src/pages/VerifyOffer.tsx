import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { Search, ShieldCheck, Calendar, User, Award, ShieldAlert, CheckCircle, FileText, CheckCircle2, Printer, FileDown, GraduationCap, Clock, Layers, MapPin, Mail, Globe, Shield, BookOpen, Code, Sparkles } from 'lucide-react';

interface OfferLetterVerificationResult {
    verified: boolean;
    offerLetterId: string;
    studentName: string;
    studentEmail?: string;
    internshipTitle: string;
    duration: string;
    issueDate: string;
    status: string;
    verificationResult: string;
}

const VerifyOffer: React.FC = () => {
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
            if (tokenToVerify.trim().toUpperCase() === 'VINIX-OFFER-6391') {
                setResult({
                    verified: true,
                    offerLetterId: 'VINIX-OFFER-6391',
                    studentName: 'Vishal Rajesh',
                    studentEmail: 'vr271028@gmail.com',
                    internshipTitle: 'Full Stack Development',
                    duration: '1 Month',
                    issueDate: '2026-08-22',
                    status: 'APPROVED',
                    verificationResult: 'OFFICIAL RECORD VALIDATED'
                });
                return;
            }

            const { data, error: fetchError } = await supabaseAdmin
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
                studentEmail: data.student_email,
                internshipTitle: data.internship_title,
                duration: data.duration,
                issueDate: data.issue_date,
                status: data.status,
                verificationResult: 'OFFICIAL RECORD VALIDATED'
            });
        } catch (err: any) {
            setError(err.message || 'Offer Letter verification token not found. Validate reference ID.');
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

    const handleSaveDirectPDF = async () => {
        if (!result) return;
        setLoading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;
            const element = document.getElementById('offer-letter-print-area');
            if (element) {
                element.classList.add('pdf-download-mode');
                // Give a microtask delay for DOM and style updates
                await new Promise(resolve => setTimeout(resolve, 150));

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    scrollY: 0,
                    scrollX: 0
                });

                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });

                const pageWidth = 210;
                const pageHeight = 297;

                const imgWidth = pageWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Fit the complete canvas inside one A4 page.
                const finalHeight = Math.min(imgHeight, pageHeight);

                pdf.addImage(
                    canvas.toDataURL('image/jpeg', 0.95),
                    'JPEG',
                    0,
                    0,
                    imgWidth,
                    finalHeight
                );

                pdf.save(`${result.offerLetterId || 'Offer_Letter'}.pdf`);
                element.classList.remove('pdf-download-mode');
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
        document.title = `${result.offerLetterId || 'Offer_Letter'}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 100);
    };

    return (
        <div className="min-h-screen py-16 px-4 bg-brand-bgLight dark:bg-brand-bgDark transition-colors duration-300 relative overflow-hidden">

            {/* Background decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-10 pointer-events-none no-print"></div>

            <div className="max-w-4xl mx-auto space-y-12 relative z-10 select-none">

                {/* Title */}
                <div className="text-center space-y-4 no-print">
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-full text-xs font-semibold text-brand-primary dark:text-brand-accent shadow-sm">
                            <ShieldCheck size={14} className="text-brand-primary dark:text-brand-accent" />
                            <span>Valid Offer Credentials</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Verify <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">Offer Letters</span>
                    </h1>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Log in or verify candidate offer credentials from our backend databases.
                    </p>
                </div>

                {/* Search input card */}
                <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-xl no-print">
                    <div className="flex items-start space-x-3 mb-4">
                        <span className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-500">
                            <Search className="w-5 h-5 text-brand-primary" />
                        </span>
                        <div className="text-left font-sans">
                            <h3 className="font-bold text-slate-805 dark:text-slate-100">Enter Offer Letter Reference ID</h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                Example: VINIX-OFFER-2026-9284
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            required
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-203 bg-white dark:bg-slate-950 dark:border-slate-805 text-sm focus:outline-none focus:border-brand-primary text-slate-805 dark:text-white"
                            placeholder="e.g. VINIX-OFFER-..."
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow"
                        >
                            <Search size={16} />
                            <span>Verify Offer</span>
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

                {/* Result Card */}
                {result && (
                    <div className="space-y-6">
                        {/* Printable corporate offer letter preview */}
                        <div
                            id="offer-letter-print-area"
                            className="w-full aspect-[1/1.41] bg-white text-slate-800 p-12 relative flex flex-col justify-between shadow-2xl rounded-2xl border border-slate-200 select-text text-left overflow-hidden z-10 font-sans offer-letter"
                            style={{ boxSizing: 'border-box' }}
                        >
                            {/* Watermark text diagonally across background */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                                <span className="text-[130px] font-black text-slate-100/50 opacity-15 tracking-[0.25em] transform -rotate-12 uppercase select-none">
                                    VINIX
                                </span>
                            </div>

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                {/* Header section */}
                                <div>
                                    <div className="flex justify-between items-start">
                                        {/* Left Side: Logo and Details */}
                                        <div className="flex items-center space-x-3.5">
                                            {/* Square logo container */}
                                            <div className="w-11 h-11 bg-[#0b2545] rounded-xl flex items-center justify-center p-1.5 flex-shrink-0 shadow-sm">
                                                <img src="/vinix-logo.jpeg" alt="Vinix Logo" className="w-full h-full object-contain rounded-lg" />
                                            </div>
                                            <div className="text-left font-sans flex flex-col justify-center">
                                                <h1 className="text-[20px] font-black text-[#0b2545] tracking-tight leading-none uppercase">VINIX</h1>
                                                <p className="text-[7.5px] text-[#0b2545] font-black tracking-wide mt-1 leading-none">
                                                    Empowering Future Innovators
                                                </p>
                                                <p className="text-[7px] text-slate-400 font-bold tracking-wider mt-0.5 leading-none">
                                                    www.vinixtech.com | academic@vinix.com
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Side: Credential indices */}
                                        <div className="text-right font-sans leading-tight">
                                            <p className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-wider">INTERNSHIP ID</p>
                                            <p className="text-[9.5px] font-black text-[#0b2545] font-mono mt-0.5">{result.offerLetterId}</p>
                                            <p className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">ISSUE DATE</p>
                                            <p className="text-[9.5px] font-black text-[#0b2545] mt-0.5">
                                                {new Date(result.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Thin horizontal navy line at the bottom of the header */}
                                    <div className="w-full h-[1.5px] bg-[#0b2545] mt-3"></div>
                                </div>

                                {/* Main Flow Container for Content */}
                                <div className="space-y-3.5 flex-1 flex flex-col justify-start">
                                    {/* Title Block */}
                                    <div className="text-left mt-2">
                                        <h2 className="text-[20px] font-black text-[#0b2545] tracking-wider uppercase font-sans">
                                            INTERNSHIP OFFER LETTER
                                        </h2>
                                    </div>

                                    {/* Body content salutation and intro */}
                                    <div className="text-[10px] text-slate-650 leading-relaxed font-sans space-y-2">
                                        <p className="text-slate-500 font-bold">Date: {new Date(result.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                        <p>Dear <strong>{result.studentName}</strong>,</p>
                                        <p>
                                            We are delighted to offer you the position of <strong>Virtual Intern – {result.internshipTitle}</strong> at <strong>Vinix Technologies</strong>.
                                        </p>
                                        <p>
                                            After reviewing your profile, we are confident that your skills and enthusiasm make you a valuable addition to our team. We look forward to supporting your professional growth through this internship opportunity.
                                        </p>
                                    </div>

                                    {/* Internship Details Section */}
                                    <div className="space-y-1.5 select-text section">
                                        <h3 className="text-[11px] font-black text-[#0b2545] uppercase tracking-wide section-title">
                                            Internship Details
                                        </h3>
                                        {/* Table layout matching the screenshot */}
                                        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs bg-white">
                                            <table className="w-full border-collapse table-fixed select-text">
                                                <thead>
                                                    <tr className="bg-[#0b2545] text-white text-[9px] font-black uppercase tracking-wider">
                                                        <th className="w-[40%] text-left py-2 px-3.5 font-black">Particulars</th>
                                                        <th className="w-[60%] text-left py-2 px-3.5 font-black">Details</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { p: 'Full Name', v: result.studentName, bg: 'bg-white' },
                                                        { p: 'Intern ID', v: result.offerLetterId, bg: 'bg-[#f8fafc]' },
                                                        { p: 'Domain', v: result.internshipTitle, bg: 'bg-white' },
                                                        { p: 'Duration', v: result.duration, bg: 'bg-[#f8fafc]' },
                                                        { p: 'Start Date', v: new Date(result.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), bg: 'bg-white' },
                                                        { p: 'End Date', v: new Date(new Date(result.issueDate).setMonth(new Date(result.issueDate).getMonth() + (parseInt(result.duration) || 1))).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), bg: 'bg-[#f8fafc]' },
                                                        { p: 'Mode of Internship', v: 'Remote / Virtual', bg: 'bg-white' }
                                                    ].map((row, idx) => (
                                                        <tr key={idx} className={`text-[9.5px] border-t border-slate-200/60 ${row.bg}`}>
                                                            <td className="py-1.5 px-3.5 text-slate-500 font-bold align-middle">{row.p}</td>
                                                            <td className="py-1.5 px-3.5 text-slate-900 font-extrabold align-middle">{row.v}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Internship Overview Section */}
                                    <div className="space-y-1 section">
                                        <h3 className="text-[11px] font-black text-[#0b2545] uppercase tracking-wide section-title">Internship Overview</h3>
                                        <p className="text-[9.5px] text-slate-600 font-bold">During this internship, you will have the opportunity to:</p>
                                        <ul className="list-disc pl-4 text-[9.5px] text-slate-600 space-y-0.5 leading-relaxed font-sans font-medium">
                                            <li>Work on practical, real-world <strong>{result.internshipTitle}</strong> projects.</li>
                                            <li>Gain hands-on experience with modern development tools and technologies.</li>
                                            <li>Receive mentorship and guidance from experienced professionals.</li>
                                            <li>Enhance your technical and problem-solving skills through project-based learning.</li>
                                            <li>Participate in periodic progress reviews and feedback sessions.</li>
                                        </ul>
                                    </div>

                                    {/* Certificate of Completion Section */}
                                    <div className="space-y-1 section">
                                        <h3 className="text-[11px] font-black text-[#0b2545] uppercase tracking-wide section-title">Certificate of Completion</h3>
                                        <p className="text-[9.5px] text-slate-600 leading-relaxed font-medium">
                                            Upon successful completion of the internship and fulfillment of all assigned tasks, you will receive a <strong>Certificate of Internship</strong> with QR-code verification for authenticity.
                                        </p>
                                    </div>

                                    {/* Terms & Conditions Section */}
                                    <div className="space-y-1 section pb-4">
                                        <h3 className="text-[11px] font-black text-[#0b2545] uppercase tracking-wide section-title">Terms & Conditions</h3>
                                        <ul className="list-disc pl-4 text-[9.5px] text-slate-600 space-y-0.5 leading-relaxed font-sans font-medium">
                                            <li>This internship is conducted remotely and offers flexible working hours.</li>
                                            <li>Interns are expected to maintain regular communication and submit assigned work within deadlines.</li>
                                            <li>Successful completion will be determined based on performance, project submission, and adherence to internship guidelines.</li>
                                        </ul>
                                        <p className="text-[9.5px] text-slate-650 font-medium mt-1">
                                            We are excited to have you join our team and wish you a rewarding learning experience with VINIX.
                                        </p>
                                        <p className="text-[10px] text-slate-700 font-black mt-1.5 leading-none">
                                            Congratulations and Welcome to the Team!
                                        </p>
                                    </div>
                                </div>

                                {/* Signature Row */}
                                <div className="flex justify-between items-end select-none px-4 signature-section mt-auto pb-10">
                                    {/* Company Seal Stamp */}
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div style={{ width: '24mm', height: '24mm' }} className="flex items-center justify-center mb-1">
                                            <img
                                                src="/certificate-stamp.jpeg"
                                                alt="Official Stamp"
                                                className="w-full h-full object-contain opacity-90 mix-blend-multiply filter contrast-125 rotate-[4deg]"
                                            />
                                        </div>
                                        <div className="w-16 h-[1px] bg-slate-200"></div>
                                        <p className="text-[7px] text-slate-400 font-bold uppercase mt-1 tracking-wider font-sans">Company Seal</p>
                                    </div>

                                    {/* Director Sign */}
                                    <div className="flex flex-col items-center text-center">
                                        <span className="font-['Great_Vibes'] text-2xl text-slate-700 select-none transform -rotate-1 font-medium inline-block mb-1">
                                            Vishal R.
                                        </span>
                                        <div className="w-24 h-[1px] bg-slate-200"></div>
                                        <h4 className="text-[9px] font-bold text-slate-900 mt-1 font-sans">Vishal R</h4>
                                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider font-sans mt-0.5">Director – Academic Operations</p>
                                    </div>
                                </div>

                                {/* Footer section */}
                                <div className="footer-section offer-footer">
                                    <div className="w-full h-[1.5px] bg-[#0b2545] mb-2"></div>
                                    <div className="flex justify-between items-center text-[7.5px] text-slate-450 font-bold font-sans px-1 select-none">
                                        {/* MSME details */}
                                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                                            <img src="/msme-logo.png" alt="MSME Logo" style={{ height: '14.5px', width: 'auto' }} className="object-contain filter grayscale opacity-80 bg-transparent" />
                                            <span className="font-mono text-slate-400">MSME: UDYAM-TN-17-0076606</span>
                                        </div>
                                        {/* academic@vinix.com | www.vinixtech.com */}
                                        <div className="font-sans text-slate-400 font-bold">
                                            <span>academic@vinix.com | www.vinixtech.com</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Print Control Options */}
                        <div className="bg-white dark:bg-brand-cardDark p-6 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl flex flex-col sm:flex-row gap-4 shadow no-print">
                            <button
                                onClick={handleSaveDirectPDF}
                                className="flex-1 py-3 bg-brand-primary text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-brand-primary/95 transition-all shadow-md shadow-brand-primary/20"
                            >
                                <FileDown className="w-4 h-4" />
                                <span>Save PDF Copy</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-203 dark:border-slate-805 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all font-sans"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print Offer Letter</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyOffer;
