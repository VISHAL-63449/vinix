import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { Search, ShieldCheck, Calendar, User, Award, ShieldAlert, FileDown, Printer, GraduationCap, Briefcase, FileCode, CalendarDays } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
    const [containerWidth, setContainerWidth] = useState(1123);

    useEffect(() => {
        if (!result) return;
        const handleResize = () => {
            const wrapper = document.getElementById('cert-scale-wrapper');
            if (wrapper) {
                setContainerWidth(wrapper.clientWidth);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        const timer = setTimeout(handleResize, 100);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [result]);

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
        document.title = "Verify Internship Certificate | VINIX Credentials";
    }, []);

    useEffect(() => {
        if (certNo) {
            setInputVal(certNo);
            fetchVerify(certNo);
        }
    }, [certNo]);

    useEffect(() => {
        if (result) {
            document.title = `Verify Certificate: ${result.studentName} - ${result.courseName} | VINIX`;
        }
    }, [result]);

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

                        {/* Scale Wrapper Container */}
                        <div
                            id="cert-scale-wrapper"
                            className="w-full overflow-hidden rounded-2xl shadow-2xl relative bg-slate-900/5"
                            style={{ height: `${(containerWidth / 1123) * 794}px` }}
                        >
                            <div
                                style={{
                                    width: '1123px',
                                    height: '794px',
                                    transform: `scale(${containerWidth / 1123})`,
                                    transformOrigin: 'top left',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                }}
                            >
                                <div
                                    id="certificate-print-area"
                                    className="certificate-container"
                                >
                                    {/* Double border lines */}
                                    <div className="cert-frame-outer"></div>
                                    <div className="cert-frame-inner"></div>

                                    {/* Top branding elements */}
                                    <div className="cert-top-row">
                                        <div className="cert-logo-left">
                                            <img src={`${import.meta.env.BASE_URL}vinix-logo.png`} alt="VINIX Logo" />
                                        </div>

                                        <div className="cert-brand-center">
                                            <span className="cert-brand-name">VINIX</span>
                                            <span className="cert-brand-tagline">Empowering Future Innovators</span>
                                        </div>

                                        <div className="cert-logo-right">
                                            <img src={`${import.meta.env.BASE_URL}msme.jpeg`} alt="MSME Seal" />
                                        </div>
                                    </div>

                                    {/* Certificate Headings */}
                                    <div className="cert-title-section">
                                        <h1 className="cert-title-main">CERTIFICATE</h1>
                                        <h3 className="cert-title-sub">OF INTERNSHIP COMPLETION</h3>
                                    </div>

                                    {/* Certificate main body */}
                                    <div className="cert-body-section">
                                        <p className="cert-presentation-text">This certificate is proudly presented to</p>
                                        <h2 className="recipient-name" style={{ textTransform: 'uppercase' }}>{result.studentName}</h2>

                                        <p className="cert-description">
                                            for successfully completing the task-based virtual internship program in <span className="bold-text">{result.courseName}</span> at <span className="bold-text">VINIX Technologies</span>, demonstrating dedication, technical skill, and professional excellence throughout the program.
                                        </p>
                                    </div>

                                    {/* Footer signatory block with single Founder & Issued Date side */}
                                    <div className="cert-footer-section">
                                        {/* Date of Issuance Column (Left side) */}
                                        <div className="footer-col-left">
                                            <div className="signature-area" style={{ justifyContent: 'flex-start', alignItems: 'flex-end' }}>
                                                <span className="issue-signer-date" style={{ fontWeight: 750, fontSize: '1.05rem', color: '#0f2942', marginBottom: '6px' }}>
                                                    {new Date(result.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="signer-line"></div>
                                            <span className="signer-name">Date of Issuance</span>
                                            <span className="signer-title" style={{ visibility: 'hidden' }}>&nbsp;</span>
                                            <span className="detail-left">Issued Date</span>
                                        </div>

                                        {/* Official Stamp Column (Center) */}
                                        <div className="footer-col-center">
                                            <div className="stamp-container">
                                                <img src={`${import.meta.env.BASE_URL}certificate-stamp.jpeg`} alt="Company Stamp" className="stamp-img" style={{ mixBlendMode: 'multiply' }} />
                                            </div>
                                            <div className="detail-center-block">
                                                <span>Intern ID: VINIX-{result.certificateNumber.split('-').pop()}</span>
                                                <span>Verify at: <a href={`https://verify.vinix.co/credentials/${result.certificateNumber}`} className="verify-web-link" target="_blank" rel="noreferrer">verify.vinix.co/{result.certificateNumber}</a></span>
                                            </div>
                                        </div>

                                        {/* Founder Signatory Column (Right side) */}
                                        <div className="footer-col-right flex-col items-center">
                                            <div className="signature-area w-full" style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                                <img src={`${import.meta.env.BASE_URL}founder-sign.png`} alt="Founder Signature" className="signature-img" />
                                            </div>
                                            <div className="signer-line"></div>
                                            <span className="signer-name" style={{ textAlign: 'center' }}>Vishal R</span>
                                            <span className="signer-title" style={{ textAlign: 'center' }}>Founder & CEO</span>
                                            <span className="detail-right" style={{ textAlign: 'center' }}>Certificate ID: {result.certificateNumber}</span>
                                        </div>
                                    </div>
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

            </div >
        </div >
    );
};

export default VerifyCertificate;
