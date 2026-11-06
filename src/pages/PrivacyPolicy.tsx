import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileText, ArrowLeft, Mail, Cookie, Globe2, Eye } from 'lucide-react';
import SEO from '../components/SEO';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-brand-bgDark text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <SEO
                title="Privacy Policy"
                description="VINIX Privacy Policy: Learn how we collect, protect, and use student information, cookie usage, Google AdSense compliance, and candidate data rights."
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last Updated: November 2026 • Official VINIX Platform & Advertising Policy</p>
                    </div>
                </div>

                <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6">
                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">1. Overview & Scope</h2>
                        <p>
                            VINIX ("we", "our", or "us"), founded by Vishal R, is committed to safeguarding the privacy of students, candidates, and visitors using <a href="https://www.vinix.online/" className="text-blue-600 dark:text-blue-400 underline">https://www.vinix.online/</a>. This Privacy Policy details our practices concerning data collection, storage, cookie usage, third-party advertising, and processing standards in full alignment with international privacy regulations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">2. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-1.5 mt-2">
                            <li><strong>Candidate Credentials:</strong> Full name, email address, phone number, college/university name, and degree/year of study entered during internship registration.</li>
                            <li><strong>Academic Submissions:</strong> GitHub repositories, live demo URLs, milestone documentation, and project deliverables submitted for task evaluations.</li>
                            <li><strong>Certificate Verification Records:</strong> Publicly verifiable credential identifiers, issuance timestamps, and completion grades for employer and university validation.</li>
                            <li><strong>Technical & Log Data:</strong> Browser user agent, device type, IP address, operating system, referring URLs, and access timestamps recorded automatically in standard server logs.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">3. How Your Information Is Used</h2>
                        <p>
                            Collected information is utilized strictly to provide virtual internship training, evaluate engineering milestones, issue verifiable digital certificates & Letters of Recommendation (LORs), facilitate platform communication, and prevent fraudulent activity. We never sell, lease, or monetize student personal data to third-party marketing entities.
                        </p>
                    </section>

                    {/* Google AdSense & Cookies Section (Required by Google AdSense Policy) */}
                    <section className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold mb-2">
                            <Cookie className="w-5 h-5" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Cookies and Third-Party Advertising (Google AdSense)</h2>
                        </div>
                        <p className="mb-3">
                            Like most educational platforms, VINIX uses "cookies" and similar tracking technologies to enhance user navigation, analyze platform performance, and serve relevant contextual advertisements.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                            <li>
                                <strong>Third-Party Vendors & Google:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites on the internet.
                            </li>
                            <li>
                                <strong>DoubleClick DART Cookies:</strong> Google's use of advertising cookies (such as DoubleClick cookies) enables it and its partners to serve ads to users based on their visits to VINIX and/or other sites across the World Wide Web.
                            </li>
                            <li>
                                <strong>User Opt-Out of Personalized Advertising:</strong> Users may opt out of personalized advertising by visiting Google's <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">Google Ads Settings</a> or via <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">Ads Settings</a>.
                            </li>
                            <li>
                                <strong>Third-Party Ad Networks Opt-Out:</strong> Alternatively, users can opt out of a third-party vendor's use of cookies for personalized advertising by visiting the Network Advertising Initiative at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">www.aboutads.info/choices</a> or the European Interactive Digital Advertising Alliance at <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">www.youronlinechoices.eu</a>.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">5. Categories of Cookies We Employ</h2>
                        <ul className="list-disc pl-5 space-y-1.5 mt-2">
                            <li><strong>Essential & Authentication Cookies:</strong> Required to keep you authenticated in the Student Portal and verify role security.</li>
                            <li><strong>Preferences Cookies:</strong> Remember your interface preferences, such as Dark Mode or Light Mode theme selection.</li>
                            <li><strong>Performance & Analytics Cookies:</strong> Measure platform speed, identify error states, and optimize learning modules.</li>
                            <li><strong>Advertising Cookies:</strong> Utilized by authorized ad networks (e.g., Google AdSense) to deliver non-intrusive, relevant advertisements to support free education tracks.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">6. User Rights (GDPR & CCPA/CPRA Compliance)</h2>
                        <p>
                            Depending on your jurisdiction, you have specific rights regarding your personal information, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li>The right to access, inspect, or request copies of your personal data.</li>
                            <li>The right to request rectification of inaccurate academic or identity information.</li>
                            <li>The right to request erasure ("Right to be Forgotten") of your student account.</li>
                            <li>The right to restrict or object to certain types of processing or withdraw consent.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">7. Data Protection & Security</h2>
                        <p>
                            Candidate records and authentication tokens are encrypted using TLS 1.3 in transit and cryptographic standards at rest via certified cloud infrastructure. Verification records are publicly available solely by exact certificate verification serial identifier to preserve candidate legitimacy without exposing unnecessary private details.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">8. Contact & Data Protection Officer</h2>
                        <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            For questions, data access requests, or policy inquiries, contact our platform team at <a href="mailto:foundervinix@gmail.com" className="text-blue-600 dark:text-blue-400 underline font-semibold">foundervinix@gmail.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
