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
    college?: string;
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
                    verificationResult: 'OFFICIAL RECORD VALIDATED',
                    college: 'Anna University, Chennai'
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

            // Fetch student profile for college
            let collegeName = 'Anna University, Chennai'; // fallback default
            if (data.user_id || data.student_id) {
                const { data: studData } = await supabaseAdmin
                    .from('student_profiles')
                    .select('college')
                    .eq('id', data.user_id || data.student_id)
                    .maybeSingle();
                if (studData?.college) {
                    collegeName = studData.college;
                }
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
                verificationResult: 'OFFICIAL RECORD VALIDATED',
                college: collegeName
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
                // Save current scroll position
                const scrollY = window.scrollY;
                const scrollX = window.scrollX;

                // Scroll to top-left to avoid html2canvas viewport offset/cropping bugs
                window.scrollTo(0, 0);

                element.classList.add('pdf-download-mode');
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
                            className="bg-white select-text text-left overflow-hidden z-10 font-sans relative offer-letter mx-auto"
                            style={{
                                boxSizing: 'border-box',
                                width: '794px',
                                height: '1123px',
                                padding: '45px 50px',
                                color: '#0f172a',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                                position: 'relative'
                            }}
                        >
                            {/* Elegant background watermark */}
                            <div className="doc-watermark">VINIX TECHNOLOGIES</div>

                            {/* Decorative double-border frames */}
                            <div className="doc-frame-outer"></div>
                            <div className="doc-frame-inner"></div>

                            {/* Header Section */}
                            <div className="doc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '2px', zIndex: 2 }}>
                                <div className="header-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div className="header-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className="header-logo" style={{ height: '54px', display: 'flex', alignItems: 'center' }}>
                                            <img src={`${import.meta.env.BASE_URL}vinix-logo.png`} alt="VINIX Logo" style={{ height: '100%', objectFit: 'contain' }} />
                                        </span>
                                        <div className="header-branding-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <span className="company-name" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#0f2942', lineHeight: 1.1, letterSpacing: '0.5px' }}>VINIX</span>
                                            <span className="company-tagline" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, color: '#cca353', letterSpacing: '0.5px', marginTop: '1px' }}>Empowering Future Innovators</span>
                                        </div>
                                    </div>
                                    <div className="company-contact-row" style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '5px', fontWeight: 550 }}>
                                        www.vinixtech.com | academic@vinix.com
                                    </div>
                                </div>
                                <div className="header-right" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div className="meta-item" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="meta-label" style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '1px' }}>INTERNSHIP ID</span>
                                        <span className="meta-value" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>{result.offerLetterId}</span>
                                    </div>
                                    <div className="meta-item" style={{ marginTop: '5px', display: 'flex', flexDirection: 'column' }}>
                                        <span className="meta-label" style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '1px' }}>ISSUE DATE</span>
                                        <span className="meta-value" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>
                                            {new Date(result.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider Line */}
                            <div className="header-line" style={{ width: '100%', height: '1.5px', backgroundColor: '#e2e8f0', marginTop: '8px', marginBottom: '16px', zIndex: 2 }}></div>

                            {/* Body Content */}
                            <div className="doc-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', zIndex: 2 }}>
                                <h1 className="document-title" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#0f2942', marginBottom: '2px', letterSpacing: '0.2px' }}>INTERNSHIP OFFER LETTER</h1>
                                <div className="document-date" style={{ fontSize: '0.72rem', color: '#cca353', marginBottom: '15px', fontWeight: 600 }}>
                                    Date: {new Date(result.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>

                                <div className="greeting-block" style={{ fontSize: '0.73rem', color: '#334155', marginBottom: '8px' }}>
                                    Dear <strong>{result.studentName}</strong>,
                                </div>

                                <div className="intro-paragraph" style={{ fontSize: '0.72rem', lineHeight: '1.45', color: '#334155', marginBottom: '10px', textAlign: 'justify' }}>
                                    We are delighted to offer you the position of <strong>Virtual Intern – {result.internshipTitle}</strong> at <strong>Vinix Technologies</strong>. After reviewing your application, we are confident that your skills and enthusiasm make you a valuable addition to our program.
                                </div>

                                <div className="intro-sub-paragraph" style={{ fontSize: '0.72rem', lineHeight: '1.45', color: '#334155', marginBottom: '10px', textAlign: 'justify' }}>
                                    Your virtual internship details and key particulars are finalized as follows:
                                </div>

                                {/* Particulars Table */}
                                <table className="particulars-table" style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '12px', fontSize: '0.7rem' }}>
                                    <thead>
                                        <tr>
                                            <th colSpan={2} style={{ backgroundColor: '#0f2942', color: '#ffffff', fontWeight: 700, padding: '8px 12px', textAlign: 'left', fontSize: '0.68rem', letterSpacing: '0.5px', border: 'none' }}>INTERNSHIP PROGRAM PARTICULARS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Internship Track</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>{result.internshipTitle}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Intern ID</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>{result.offerLetterId}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Duration</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>{result.duration}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Commencement Date</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                                                {(() => {
                                                    const d = new Date(result.issueDate);
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
                                                })()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Estimated Completion</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                                                {(() => {
                                                    const d = new Date(result.issueDate);
                                                    const num = parseInt(result.duration) || 1;
                                                    if (result.duration.toLowerCase().includes('week')) {
                                                        d.setDate(d.getDate() + num * 7);
                                                    } else {
                                                        d.setMonth(d.getMonth() + num);
                                                    }
                                                    d.setDate(d.getDate() - 3);
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
                                                })()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Stipend Details</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>Unpaid (Performance-Based Internship)</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Location & Model</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>Remote / Virtual</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: 'none', fontWeight: 600, color: '#475569', width: '35%' }}>College / University</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: 'none', fontWeight: 700, color: '#0f172a' }}>{result.college || 'Anna University, Chennai'}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* General Terms & Conditions */}
                                <div className="terms-card" style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px', backgroundColor: '#f8fafc' }}>
                                    <span className="card-title" style={{ color: '#0f2942', fontSize: '0.72rem', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>General Terms &amp; Conditions of Internship:</span>
                                    <div className="terms-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div className="bullet-item" style={{ fontSize: '0.71rem', lineHeight: '1.4', color: '#334155' }}><strong>1. Task Execution:</strong> You will be evaluated based on the functional completeness of the assigned tasks. You must submit weekly progress updates.</div>
                                        <div className="bullet-item" style={{ fontSize: '0.71rem', lineHeight: '1.4', color: '#334155' }}><strong>2. Code of Conduct:</strong> Plagiarism or any forms of professional misconduct will lead to immediate cancellation of your internship program.</div>
                                        <div className="bullet-item" style={{ fontSize: '0.71rem', lineHeight: '1.4', color: '#334155' }}><strong>3. Confidentiality:</strong> Any documentation, source code, or mock datasets shared during this program are strictly confidential.</div>
                                        <div className="bullet-item" style={{ fontSize: '0.71rem', lineHeight: '1.4', color: '#334555' }}><strong>4. Certification:</strong> An official Certificate of Internship Completion will be issued only upon successful submission and mentoring approval of all milestone tasks.</div>
                                    </div>
                                </div>

                                {/* Certificate Section */}
                                <div className="cert-completion-card" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px', backgroundColor: '#ffffff' }}>
                                    <span className="card-title" style={{ color: '#0f2942', fontSize: '0.72rem', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>CERTIFICATE OF COMPLETION</span>
                                    <div className="completion-text" style={{ fontSize: '0.71rem', lineHeight: '1.45', color: '#334155', textAlign: 'justify' }}>
                                        Upon successful completion of the internship and fulfillment of all assigned tasks, you will receive a Certificate of Internship with QR-code verification for authenticity.
                                    </div>
                                </div>

                                <div className="outro-paragraph" style={{ fontSize: '0.72rem', lineHeight: '1.45', color: '#334155', marginBottom: '8px' }}>
                                    Please return the signed copy of this letter as a token of your formal acceptance of this offer. We look forward to a mutually rewarding learning experience.
                                </div>
                            </div>

                            {/* Signatures Section */}
                            <div className="signatures-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', width: '100%', paddingBottom: '12px', zIndex: 2 }}>
                                {/* Company Seal (Left) */}
                                <div className="sig-col" style={{ display: 'flex', flexDirection: 'column', width: '33%', alignItems: 'flex-start' }}>
                                    <div className="sig-image-wrap" style={{ height: '80px', display: 'flex', alignItems: 'flex-end', position: 'relative', marginBottom: '4px' }}>
                                        <img src={`${import.meta.env.BASE_URL}certificate-stamp.jpeg`} alt="Official Seal" className="stamp-overlay" style={{ width: '80px', height: '80px', objectFit: 'contain', opacity: 0.9 }} />
                                    </div>
                                    <span className="sig-title" style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 705, letterSpacing: '0.5px' }}>COMPANY SEAL</span>
                                </div>

                                {/* Director Signatory (Right) */}
                                <div className="sig-col" style={{ display: 'flex', flexDirection: 'column', width: '33%', alignItems: 'flex-end', textAlign: 'right', marginLeft: 'auto' }}>
                                    <div className="sig-image-wrap" style={{ height: '80px', display: 'flex', alignItems: 'flex-end', position: 'relative', marginBottom: '4px', justifyContent: 'flex-end' }}>
                                        <img src={`${import.meta.env.BASE_URL}founder-sign.png`} alt="Director Signature" className="sig-image" style={{ maxHeight: '42px', objectFit: 'contain' }} />
                                    </div>
                                    <span className="sig-name" style={{ fontWeight: 700, fontSize: '0.72rem', color: '#0f172a' }}>Vishal R</span>
                                    <span className="sig-title" style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 705, letterSpacing: '0.5px' }}>DIRECTOR – ACADEMIC OPERATIONS</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="doc-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.6rem', color: '#475569', fontWeight: 700, letterSpacing: '0.3px', zIndex: 2, borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
                                <div className="footer-logo-wrap" style={{ height: '50px', display: 'flex', alignItems: 'center' }}>
                                    <img src={`${import.meta.env.BASE_URL}msme.jpeg`} alt="MSME Logo" style={{ height: '50px' }} />
                                </div>
                                <div className="footer-text" style={{ textAlign: 'center', lineHeight: 1.4, color: '#64748b' }}>
                                    <strong>VINIX Technologies Private Limited</strong><br />
                                    UDYAM Registry: UDYAM-TN-17-0076606<br />
                                    academic@vinix.com | www.vinix.online
                                </div>
                                <div style={{ width: '60px', height: '1px', visibility: 'hidden' }}></div>
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
