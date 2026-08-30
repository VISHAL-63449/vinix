import React, { useState } from 'react';
import { Mail, MapPin, Clock, Send, Sparkles, CheckCircle, MessageSquare, Shield } from 'lucide-react';

export const Contact: React.FC = () => {
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactSubject, setContactSubject] = useState('');
    const [contactMsg, setContactMsg] = useState('');
    const [contactSent, setContactSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setContactSent(true);
        setIsSubmitting(false);
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMsg('');
        setTimeout(() => setContactSent(false), 5000);
    };

    return (
        <div className="relative min-h-screen py-24 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden flex flex-col justify-center animate-fade-in-up">
            {/* Background Grid & Spotlights */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415508_1px,transparent_1px),linear-gradient(to_bottom,#33415508_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#38bdf805_1px,transparent_1px),linear-gradient(to_bottom,#38bdf805_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_10%,#000_80%,transparent_100%)] pointer-events-none z-0"></div>

            {/* Soft Ambient Light Glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[100px] pointer-events-none z-0"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[100px] pointer-events-none z-0"></div>

            <div className="relative max-w-7xl mx-auto px-6 lg:px-12 space-y-16 z-10 w-full">

                {/* Header Section */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50/80 dark:bg-blue-955/35 border border-blue-105/50 dark:border-blue-900/30 rounded-full text-[10px] font-extrabold text-blue-650 dark:text-blue-300 uppercase tracking-widest">
                        <Sparkles size={11} className="text-blue-550 animate-pulse" />
                        <span>Connect Now</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        Get in Touch
                    </h1>

                    <p className="text-slate-550 dark:text-slate-400 text-sm md:text-base font-medium max-w-lg mx-auto leading-relaxed">
                        Have queries about internships, task reviews, certificates, or credentials? Reaching out is simple and rapid.
                    </p>
                </div>

                {/* Main Content Details & Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">

                    {/* Left Info tiles */}
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                        <div className="space-y-6 flex-1 flex flex-col justify-start">
                            {/* Card 1: Email Inquiry */}
                            <div
                                className="group p-6 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex items-start gap-5 shadow-sm transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.15)] hover:-translate-y-1"
                            >
                                <div className="p-3.5 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition duration-300">
                                    <Mail size={18} className="text-white" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Email Inquiry</span>
                                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-blue-650 dark:group-hover:text-[#4fc3f7] transition duration-200">
                                        info@vinix.online
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Response within 12-24 business hours.</p>
                                </div>
                            </div>

                            {/* Card 2: Office Address */}
                            <div
                                className="group p-6 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-205/65 dark:border-slate-800/80 rounded-2xl flex items-start gap-5 shadow-sm transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.15)] hover:-translate-y-1"
                            >
                                <div className="p-3.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition duration-300">
                                    <MapPin size={18} className="text-white" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Office Address</span>
                                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-emerald-650 dark:group-hover:text-emerald-400 transition duration-200">
                                        Chennai, Tamil Nadu, India
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Registered Tech and MSME Platforms.</p>
                                </div>
                            </div>

                            {/* Card 3: Operation Hours */}
                            <div
                                className="group p-6 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex items-start gap-5 shadow-sm transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(245,158,11,0.15)] hover:-translate-y-1"
                            >
                                <div className="p-3.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 transition duration-300">
                                    <Clock size={18} className="text-white" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Operation Hours</span>
                                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition duration-200">
                                        Mon - Sat | 9:00 AM - 7:00 PM IST
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-semibold">Support tickets closed on national holidays.</p>
                                </div>
                            </div>
                        </div>

                        {/* Extra trust elements */}
                        <div
                            className="hidden lg:flex items-center gap-3 px-5 py-3 border border-slate-200/40 dark:border-slate-800/40 rounded-xl bg-slate-100/30 dark:bg-slate-900/20 select-none text-[10px] text-slate-400 dark:text-slate-505 font-semibold"
                        >
                            <Shield size={14} className="text-blue-500/70" />
                            <span>Your communication is secured with end-to-end SSL standards.</span>
                        </div>
                    </div>

                    {/* Right Contact form */}
                    <div
                        className="lg:col-span-7 bg-white/90 dark:bg-slate-905/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-center"
                    >
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-550/10 dark:bg-blue-500/5 rounded-full blur-2xl"></div>

                        <AnimatePresence mode="wait" xmlns="">
                            {contactSent ? (
                                <div
                                    className="text-center py-16 space-y-5 animate-fade-in"
                                >
                                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-955/30 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-550 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md">
                                        <CheckCircle size={28} className="animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white">Message Dispatched!</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-semibold">
                                            Thank you for reaching out. We will review your message and contact you at <span className="text-slate-800 dark:text-slate-200 font-bold">info@vinix.online</span> or via your registered email.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="space-y-5">
                                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-2">
                                        <MessageSquare size={16} className="text-blue-500" />
                                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Leave a Message</h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-405 dark:text-slate-500 tracking-wider">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Harish"
                                                value={contactName}
                                                onChange={(e) => setContactName(e.target.value)}
                                                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all duration-200 text-slate-800 dark:text-white shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-405 dark:text-slate-500 tracking-wider">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="e.g. info@vinix.online"
                                                value={contactEmail}
                                                onChange={(e) => setContactEmail(e.target.value)}
                                                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all duration-200 text-slate-800 dark:text-white shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-405 dark:text-slate-500 tracking-wider">Subject</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Inquiry regarding Course Assignments"
                                            value={contactSubject}
                                            onChange={(e) => setContactSubject(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all duration-200 text-slate-800 dark:text-white shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-405 dark:text-slate-500 tracking-wider">Your Message</label>
                                        <textarea
                                            required
                                            rows={4}
                                            placeholder="Write details of queries or support needed..."
                                            value={contactMsg}
                                            onChange={(e) => setContactMsg(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all duration-200 text-slate-800 dark:text-white resize-none shadow-inner"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-[0_4px_15px_-3px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_20px_-3px_rgba(59,130,246,0.5)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Send size={12} className="text-white" />
                                                <span>Send Message</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

            </div>
        </div>
    );
};

// Dummy wrapper for AnimatePresence compatibility without framer-motion imports
const AnimatePresence: React.FC<{ children: React.ReactNode, mode?: string, xmlns?: string }> = ({ children }) => {
    return <>{children}</>;
};

export default Contact;
