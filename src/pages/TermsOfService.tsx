import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';
import SEO from '../components/SEO';

export const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-brand-bgDark text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <SEO
                title="Terms of Service"
                description="VINIX Terms of Service: Read our terms and conditions governing virtual internship participation, code submissions, and certificate issuance."
                canonicalPath="/terms"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.vinix.online/" },
                        { "@type": "ListItem", "position": 2, "name": "Terms of Service", "item": "https://www.vinix.online/terms" }
                    ]
                }}
            />

            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800 text-left">
                <Link to="/" className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-8">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Home
                </Link>

                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Effective Date: October 2026 • Official Platform Terms</p>
                    </div>
                </div>

                <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6">
                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
                        <p>
                            By registering for an internship track or accessing <a href="https://www.vinix.online/" className="text-blue-600 underline">https://www.vinix.online/</a>, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must discontinue platform use.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">2. Internship Program Guidelines</h2>
                        <p>
                            VINIX provides educational task-based virtual internships. Enrolled candidates are expected to independently develop task solutions, follow industry standards, and submit original code or project assets. Plagiarized work or copied repositories will result in task rejection.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">3. Certificate Verification & Authenticity</h2>
                        <p>
                            Completion certificates and Letters of Recommendation issued by VINIX feature cryptographic verification numbers and authentic QR codes. Verification is publicly available through <Link to="/verify" className="text-blue-600 underline">https://www.vinix.online/verify</Link>. Any unauthorized modification or falsification of certificates is strictly prohibited.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">4. Intellectual Property</h2>
                        <p>
                            Candidates retain full ownership of the original software code and personal projects they build during their internship. The VINIX brand, curriculum materials, grading rubrics, and platform assets remain the intellectual property of VINIX.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">5. Governing Law & Contact</h2>
                        <p>
                            These terms are governed by the laws of India. For any legal notices or program inquiries, please contact <a href="mailto:foundervinix@gmail.com" className="text-blue-600 underline font-semibold">foundervinix@gmail.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
