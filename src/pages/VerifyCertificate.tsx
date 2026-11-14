import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { Search, ShieldCheck, Calendar, User, Award, ShieldAlert, FileDown, Printer, GraduationCap, Briefcase, FileCode, CalendarDays } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import SEO from '../components/SEO';

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
        let meta = document.querySelector('meta[name="robots"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'robots');
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', 'noindex, follow');

        return () => {
            meta?.remove();
        };
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

    const captureCertificateCanvas = async () => {
        const element = document.getElementById('certificate-print-area');
        if (!element) throw new Error('Certificate element not found.');

        // Ensure all custom fonts are completely loaded before rasterization
        if (document.fonts) {
            await document.fonts.ready;
            await Promise.all([
                document.fonts.load('900 48px Cinzel'),
                document.fonts.load('800 12px Montserrat'),
                document.fonts.load('800 16px Inter')
            ]).catch(() => {});
        }

        // Wait for all images to be fully loaded
        const certImages = element.querySelectorAll('img');
        await Promise.all(
            Array.from(certImages).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                    setTimeout(resolve, 800);
                });
            })
        );

        // Save current scroll position
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        // Scroll to top-left to avoid html2canvas viewport offset/cropping bugs
        window.scrollTo(0, 0);

        // Give a microtask delay for DOM and style updates
        await new Promise(resolve => setTimeout(resolve, 150));

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: 1123,
            height: 794,
            windowWidth: 1123,
            windowHeight: 794,
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
                const scaleWrapper = clonedDoc.getElementById('cert-scale-wrapper');
                if (scaleWrapper) {
                    scaleWrapper.style.width = '1123px';
                    scaleWrapper.style.height = '794px';
                    scaleWrapper.style.transform = 'none';
                }
                const printArea = clonedDoc.getElementById('certificate-print-area');
                if (printArea && printArea.parentElement) {
                    printArea.parentElement.style.transform = 'none';
                    printArea.parentElement.style.position = 'static';
                    printArea.parentElement.style.left = '0';
                    printArea.parentElement.style.top = '0';
                }
            }
        });

        // Restore scroll positions immediately
        window.scrollTo(scrollX, scrollY);
        return canvas;
    };

    const handleSaveDirectPDF = async () => {
        if (!result) return;
        setLoading(true);
        try {
            const canvas = await captureCertificateCanvas();
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
        } catch (err: any) {
            alert(`Direct download failed: ${err.message}. Using fallback print option.`);
            handleDownload();
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDirectPNG = async () => {
        if (!result) return;
        setLoading(true);
        try {
            const canvas = await captureCertificateCanvas();
            const link = document.createElement('a');
            link.download = `${result.certificateNumber || 'Certificate'}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } catch (err: any) {
            alert(`Direct PNG download failed: ${err.message}`);
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
            <SEO
                title="Verify Internship Certificate & Credentials | VINIX"
                description="Verify the authenticity of VINIX internship completion certificates, offer letters, and credentials using our public certificate verification system."
                canonicalPath={certNo ? `/verify/${certNo}` : '/verify'}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "VINIX Certificate Verification System",
                    "description": "Verify official VINIX internship certificates and credentials.",
                    "url": "https://www.vinix.online/verify"
                }}
            />

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
                                    {/* Security Pinstripe Pattern */}
                                    <div className="cert-security-pattern"></div>

                                    {/* Intricate Banknote Guilloche Security Rosette */}
                                    <svg className="cert-watermark-guilloche" viewBox="0 0 400 400">
                                        <circle cx="200" cy="200" r="185" fill="none" stroke="#c59b27" strokeWidth="0.8" opacity="0.45" />
                                        <circle cx="200" cy="200" r="172" fill="none" stroke="#b71c1c" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.35" />
                                        <circle cx="200" cy="200" r="158" fill="none" stroke="#c59b27" strokeWidth="0.6" strokeDasharray="1,2" opacity="0.4" />
                                        <circle cx="200" cy="200" r="140" fill="none" stroke="#b71c1c" strokeWidth="0.5" opacity="0.25" />
                                        <polygon points="200 20, 240 148, 380 148, 270 228, 310 356, 200 276, 90 356, 130 228, 20 148, 160 148" fill="none" stroke="#c59b27" strokeWidth="0.75" opacity="0.32" />
                                        <polygon points="200 35, 235 152, 365 152, 262 225, 298 342, 200 270, 102 342, 138 225, 35 152, 165 152" fill="none" stroke="#b71c1c" strokeWidth="0.75" opacity="0.25" />
                                        <path d="M 200 50 Q 230 110 290 110 T 350 200 T 290 290 T 200 350 T 110 290 T 50 200 T 110 110 Z" fill="none" stroke="#c59b27" strokeWidth="0.6" opacity="0.2" />
                                        <path d="M 200 65 Q 225 115 275 115 T 335 200 T 275 285 T 200 335 T 125 285 T 65 200 T 125 115 Z" fill="none" stroke="#b71c1c" strokeWidth="0.6" opacity="0.2" />
                                    </svg>

                                    {/* 4-Tier Luxury Royal Red & Gold Borders */}
                                    <div className="cert-border-outer"></div>
                                    <div className="cert-border-gold-mid"></div>
                                    <div className="cert-border-inner"></div>
                                    <div className="cert-border-gold-hairline"></div>

                                    {/* 4 Ornate Royal Corner Filigree Ornaments */}
                                    <svg className="cert-corner-filigree corner-tl" viewBox="0 0 50 50">
                                        <path d="M 4 46 L 4 4 L 46 4" fill="none" stroke="#c59b27" strokeWidth="3" />
                                        <path d="M 10 40 L 10 10 L 40 10" fill="none" stroke="#7f0000" strokeWidth="1.8" />
                                        <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="#e5b93b" strokeWidth="0.8" />
                                        <circle cx="10" cy="10" r="3" fill="#7f0000" stroke="#e5b93b" strokeWidth="0.75" />
                                        <circle cx="4" cy="4" r="2.5" fill="#c59b27" />
                                        <polygon points="18 4, 22 8, 18 12, 14 8" fill="#c59b27" />
                                        <polygon points="4 18, 8 22, 4 26, 0 22" fill="#c59b27" />
                                    </svg>
                                    <svg className="cert-corner-filigree corner-tr" viewBox="0 0 50 50">
                                        <path d="M 4 46 L 4 4 L 46 4" fill="none" stroke="#c59b27" strokeWidth="3" />
                                        <path d="M 10 40 L 10 10 L 40 10" fill="none" stroke="#7f0000" strokeWidth="1.8" />
                                        <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="#e5b93b" strokeWidth="0.8" />
                                        <circle cx="10" cy="10" r="3" fill="#7f0000" stroke="#e5b93b" strokeWidth="0.75" />
                                        <circle cx="4" cy="4" r="2.5" fill="#c59b27" />
                                        <polygon points="18 4, 22 8, 18 12, 14 8" fill="#c59b27" />
                                        <polygon points="4 18, 8 22, 4 26, 0 22" fill="#c59b27" />
                                    </svg>
                                    <svg className="cert-corner-filigree corner-bl" viewBox="0 0 50 50">
                                        <path d="M 4 46 L 4 4 L 46 4" fill="none" stroke="#c59b27" strokeWidth="3" />
                                        <path d="M 10 40 L 10 10 L 40 10" fill="none" stroke="#7f0000" strokeWidth="1.8" />
                                        <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="#e5b93b" strokeWidth="0.8" />
                                        <circle cx="10" cy="10" r="3" fill="#7f0000" stroke="#e5b93b" strokeWidth="0.75" />
                                        <circle cx="4" cy="4" r="2.5" fill="#c59b27" />
                                        <polygon points="18 4, 22 8, 18 12, 14 8" fill="#c59b27" />
                                        <polygon points="4 18, 8 22, 4 26, 0 22" fill="#c59b27" />
                                    </svg>
                                    <svg className="cert-corner-filigree corner-br" viewBox="0 0 50 50">
                                        <path d="M 4 46 L 4 4 L 46 4" fill="none" stroke="#c59b27" strokeWidth="3" />
                                        <path d="M 10 40 L 10 10 L 40 10" fill="none" stroke="#7f0000" strokeWidth="1.8" />
                                        <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="#e5b93b" strokeWidth="0.8" />
                                        <circle cx="10" cy="10" r="3" fill="#7f0000" stroke="#e5b93b" strokeWidth="0.75" />
                                        <circle cx="4" cy="4" r="2.5" fill="#c59b27" />
                                        <polygon points="18 4, 22 8, 18 12, 14 8" fill="#c59b27" />
                                        <polygon points="4 18, 8 22, 4 26, 0 22" fill="#c59b27" />
                                    </svg>

                                    {(() => {
                                        const isOfficial = ['APPROVED', 'ACCEPTED', 'ISSUED', 'ACTIVE', 'COMPLETED'].includes((result.status || '').toUpperCase());
                                        return (
                                            <>
                                                {/* Top branding elements */}
                                                <div className="cert-top-row">
                                                    <div className="cert-logo-left">
                                                        {isOfficial && <img src={`${import.meta.env.BASE_URL}vinix-title.png`} alt="VINIX Logo" />}
                                                    </div>

                                                    <div className="cert-brand-center">
                                                        <div className="brand-crest-stars">
                                                            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                                            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                                            <svg className="center-star" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                                            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                                            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                                        </div>
                                                        <span className="cert-credential-heading">ACADEMIC &amp; PROFESSIONAL CREDENTIAL</span>
                                                        <span className="cert-brand-tagline">GOVERNMENT REGISTERED MSME ENTERPRISE</span>
                                                    </div>

                                                    <div className="cert-logo-right">
                                                        <div className="cert-msme-container">
                                                            {isOfficial && <img src={`${import.meta.env.BASE_URL}msme.png`} alt="MSME Seal" />}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Certificate Headings */}
                                                <div className="cert-title-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                                    <div className="cert-ribbon-tag" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', textAlign: 'center', background: 'linear-gradient(135deg, #7f0000 0%, #b71c1c 50%, #991b1b 100%)', backgroundColor: '#800000', color: '#ffffff', fontFamily: 'Montserrat, Inter, sans-serif', fontSize: '0.64rem', fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', height: '22px', lineHeight: '1', padding: '0 22px', borderRadius: '9999px', border: '1.5px solid #e5b93b', boxShadow: '0 3px 10px rgba(183, 28, 28, 0.35)', margin: '0 auto 10px auto', boxSizing: 'border-box', whiteSpace: 'nowrap' }}>
                                                        <span style={{ color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1', fontWeight: 800, position: 'relative', top: '-2px', transform: 'translateY(-0.5px)' }}>★ OFFICIAL VERIFIED CREDENTIAL ★</span>
                                                    </div>
                                                    <h1 className="cert-title-main" style={{ display: 'block', margin: '0 0 4px 0', lineHeight: 1.15, textAlign: 'center' }}>CERTIFICATE</h1>
                                                    <div className="cert-title-sub-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '4px' }}>
                                                        <div className="cert-hairline"></div>
                                                        <svg width="8" height="8" viewBox="0 0 10 10" style={{ display: 'block', flexShrink: 0 }}><polygon points="5,0 10,5 5,10 0,5" fill="#7f0000" stroke="#e5b93b" strokeWidth="1.5"/></svg>
                                                        <h3 className="cert-title-sub">OF INTERNSHIP COMPLETION</h3>
                                                        <svg width="8" height="8" viewBox="0 0 10 10" style={{ display: 'block', flexShrink: 0 }}><polygon points="5,0 10,5 5,10 0,5" fill="#7f0000" stroke="#e5b93b" strokeWidth="1.5"/></svg>
                                                        <div className="cert-hairline"></div>
                                                    </div>
                                                </div>

                                                {/* Certificate main body */}
                                                <div className="cert-body-section">
                                                    <p className="cert-presentation-text">This certificate is proudly presented to</p>
                                                    <h2 className="cert-recipient-name" style={{ margin: '6px 0 16px 0' }}>{result.studentName}</h2>
                                                    <div className="cert-name-accent-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '0px', marginBottom: '18px' }}>
                                                        <div className="line-side" style={{ width: '170px', height: '1.5px', background: 'linear-gradient(90deg, transparent, #d4af37, #d4af37)' }}></div>
                                                        <div className="gem-wrap" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <div style={{ width: '5px', height: '5px', background: '#d4af37', transform: 'rotate(45deg)' }}></div>
                                                            <div style={{ width: '9px', height: '9px', background: '#7f0000', transform: 'rotate(45deg)', border: '1.5px solid #d4af37', boxShadow: '0 0 6px rgba(197, 155, 39, 0.6)' }}></div>
                                                            <div style={{ width: '5px', height: '5px', background: '#d4af37', transform: 'rotate(45deg)' }}></div>
                                                        </div>
                                                        <div className="line-side" style={{ width: '170px', height: '1.5px', background: 'linear-gradient(90deg, #d4af37, #d4af37, transparent)' }}></div>
                                                    </div>

                                                    <p className="cert-description-text" style={{ fontSize: '0.88rem', lineHeight: 1.65, color: '#334155', maxWidth: '840px', margin: '0 auto' }}>
                                                        for successfully completing the task-based virtual internship program in <strong className="domain-highlight" style={{ color: '#7f0000', fontWeight: 800 }}>{result.courseName}</strong> at <strong>VINIX Technologies</strong>, demonstrating exceptional technical competency, professional diligence, and excellence in project execution throughout the program.
                                                    </p>
                                                </div>

                                                {/* Footer signatory block */}
                                                <div className="cert-footer-row">
                                                    {/* Date of Issuance Column (Left side) with Scan to Verify QR Code */}
                                                    <div className="cert-footer-col left-col">
                                                        <div className="cert-qr-block">
                                                            <div className="cert-qr-frame">
                                                                <span className="qr-corner qr-corner-tl"></span>
                                                                <span className="qr-corner qr-corner-tr"></span>
                                                                <span className="qr-corner qr-corner-bl"></span>
                                                                <span className="qr-corner qr-corner-br"></span>
                                                                <img 
                                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://vinix.online/verify/${result.certificateNumber || 'VNXCERT202691990'}`)}`}
                                                                    alt="Scan to Verify Certificate"
                                                                    className="cert-qr-img"
                                                                    crossOrigin="anonymous"
                                                                />
                                                            </div>
                                                            <div className="cert-qr-text-group">
                                                                <div className="cert-qr-line-1">Scan to Verify</div>
                                                                <div className="cert-qr-line-2">Certificate</div>
                                                            </div>
                                                        </div>
                                                        <div className="cert-date-col">
                                                            <div className="cert-date-wrap">
                                                                <div className="cert-date-value">
                                                                    {isOfficial ? (
                                                                        new Date(result.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                                                                    ) : '23 August 2026'}
                                                                </div>
                                                            </div>
                                                            <div className="cert-sig-line"></div>
                                                            <div className="cert-signer-name">Date of Issuance</div>
                                                            <span className="cert-signer-title cert-record-red">OFFICIAL RECORD</span>
                                                        </div>
                                                    </div>

                                                    {/* Official Stamp Column (Center) */}
                                                    <div className="cert-footer-col center-col">
                                                        <div className="cert-stamp-wrap">
                                                            <div className="cert-stamp-badge">
                                                                {isOfficial ? (
                                                                    <img src={`${import.meta.env.BASE_URL}certificate-stamp.jpeg`} alt="Company Stamp" className="cert-stamp-img" />
                                                                ) : (
                                                                    <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 800, transform: 'rotate(-15deg)', padding: '6px', border: '2px dashed #dc2626', borderRadius: '4px' }}>UNVERIFIED / PENDING</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="cert-meta-verify">
                                                            <span className="cert-meta-intern-id">Intern ID: VINIX-{result.certificateNumber.split('-').pop()}</span>
                                                            <span className="cert-meta-verify-link">Verify at: <strong>verify.vinix.online/{result.certificateNumber}</strong></span>
                                                        </div>
                                                    </div>

                                                    {/* Founder Signatory Column (Right side) */}
                                                    <div className="cert-footer-col right-col">
                                                        <div className="cert-signature-wrap">
                                                            {isOfficial && <img src={`${import.meta.env.BASE_URL}founder-sign.png`} alt="Founder Signature" className="cert-signature-img" />}
                                                        </div>
                                                        <div className="cert-sig-line"></div>
                                                        <div className="cert-signer-name">Vishal R</div>
                                                        <span className="cert-signer-title">FOUNDER &amp; CEO, VINIX</span>
                                                    </div>
                                                </div>

                                                {/* Bottom compliance bar */}
                                                <div className="cert-bottom-bar">
                                                    <div className="cert-compliance-tag">
                                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                                                        <span>Tamper-Proof Blockchain Credential • ISO 9001:2015 Certified • MSME Reg: UDYAM-TN-21-0066185</span>
                                                    </div>
                                                    <div className="cert-id-wrap" style={{ color: '#0c0f17', fontWeight: 800 }}>
                                                        Cert ID: <span className="cert-id-badge" style={{ color: '#b48324', fontWeight: 800, fontFamily: 'monospace' }}>{result.certificateNumber}</span>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
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
                                onClick={handleSaveDirectPNG}
                                className="flex-1 py-3 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2"
                            >
                                <FileDown className="w-4 h-4" />
                                <span>Save PNG Image</span>
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
