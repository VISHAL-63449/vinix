import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, ArrowLeft, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import SEO from '../components/SEO';

export const RefundPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-brand-bgDark text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <SEO
                title="Cancellation & Refund Policy"
                description="VINIX Cancellation and Refund Policy: Learn our terms regarding certification processing fees and transaction resolution."
                canonicalPath="/refund"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.vinix.online/" },
                        { "@type": "ListItem", "position": 2, "name": "Refund Policy", "item": "https://www.vinix.online/refund" }
                    ]
                }}
            />

            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800 text-left">
                <Link to="/" className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-8">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Home
                </Link>

                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                        <RotateCcw className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Cancellation &amp; Refund Policy</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Effective Date: October 2026 • Official Financial Guidelines</p>
                    </div>
                </div>

                <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6">
                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">1. Free Internship Access</h2>
                        <p>
                            All curriculum tasks, internship learning tracks, and milestone submissions on VINIX are 100% free of tuition and access fees.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">2. Certificate Processing &amp; Verification Fees</h2>
                        <p>
                            Any optional administration, identity verification, or hardcopy dispatch processing fee paid upon successful milestone completion covers manual verification, digital signature generation, and permanent blockchain/database ledger hosting.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">3. Refund Eligibility &amp; Failed Transactions</h2>
                        <ul className="list-disc pl-5 space-y-1.5 mt-2">
                            <li><strong>Duplicate Charges:</strong> In the event of an accidental double debit or duplicate payment during verification, the extra transaction will be fully refunded within 5-7 business days.</li>
                            <li><strong>Non-Issuance:</strong> If a technical issue prevents credential issuance after successful verification, a full refund or immediate credential resolution will be provided.</li>
                            <li><strong>Post-Issuance:</strong> Once an official verifiable certificate and Letter of Recommendation (LOR) has been generated and issued to a candidate, the digital processing fee is non-refundable.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">4. Requesting a Refund</h2>
                        <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            To initiate a transaction inquiry or refund request, email <a href="mailto:foundervinix@gmail.com" className="text-blue-600 underline font-semibold">foundervinix@gmail.com</a> with your transaction ID / UTR and registered email.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
