import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileText, ArrowLeft, Mail } from 'lucide-react';
import SEO from '../components/SEO';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-brand-bgDark text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <SEO
                title="Privacy Policy"
                description="VINIX Privacy Policy: Learn how we collect, protect, and use student information for virtual internship programs and certificate verification."
                canonicalPath="/privacy"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.vinix.online/" },
                        { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://www.vinix.online/privacy" }
                    ]
                }}
            />

            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800 text-left">
                <Link to="/" className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-8">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Home
                </Link>

                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last Updated: October 2026 • Official VINIX Platform Policy</p>
                    </div>
                </div>

                <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6">
                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">1. Overview & Scope</h2>
                        <p>
                            VINIX ("we", "our", or "us"), founded by Vishal R, is committed to safeguarding the privacy of students, candidates, and visitors using <a href="https://www.vinix.online/" className="text-blue-600 underline">https://www.vinix.online/</a>. This Privacy Policy details our practices concerning data collection, storage, and processing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">2. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-1.5 mt-2">
                            <li><strong>Candidate Credentials:</strong> Full name, email address, phone number, college/university name, and degree/year of study entered during registration.</li>
                            <li><strong>Academic Submissions:</strong> GitHub repositories, milestone documentation, and project deliverables submitted for task evaluations.</li>
                            <li><strong>Certificate Verification Records:</strong> Publicly verifiable credential identifiers, issuance timestamps, and completion grades for employer validation.</li>
                            <li><strong>Technical Data:</strong> Browser user agent, IP address, and cookie identifiers used strictly for portal authentication and security integrity.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">3. How Your Information Is Used</h2>
                        <p>
                            Collected information is utilized strictly to provide virtual internship training, evaluate engineering milestones, issue verifiable digital certificates & Letters of Recommendation (LORs), and communicate vital curriculum updates. We never sell, lease, or monetize student personal data to third-party marketing entities.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">4. Data Protection & Security</h2>
                        <p>
                            Candidate records are protected using modern TLS encryption in transit and encrypted data storage at rest via Supabase infrastructure. Access to candidate evaluation files is restricted to authorized academic mentors and council administrators.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">5. Contact & Data Inquiries</h2>
                        <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            For questions, data access requests, or deletion inquiries, email us at <a href="mailto:foundervinix@gmail.com" className="text-blue-600 underline font-semibold">foundervinix@gmail.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
