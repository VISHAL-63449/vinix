import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle, Send, Sparkles, User, Award, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Testimonial {
    id: number;
    name: string;
    domain: string;
    college: string;
    text: string;
    rating: number;
}

export const Reviews: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([
        {
            id: 1,
            name: 'Aravind Swamy',
            domain: 'Full Stack Development',
            college: 'SRM University',
            text: 'Vinix completely changed how I learn programming. The task-based module is excellent. Getting my offer letter instantly and having practical items to show in my GitHub portfolio got me selected at my tier-1 developer job.',
            rating: 5
        },
        {
            id: 2,
            name: 'Pooja Hegde',
            domain: 'Data Science & AI',
            college: 'VIT Chennai',
            text: 'I worked on 8 major assignments including AI model evaluation and python tasks. The custom QR verification on the completion certificate is flawless! Highly recommend this remote self-paced internship for developers.',
            rating: 5
        },
        {
            id: 3,
            name: 'Rohan Sharma',
            domain: 'Java Development',
            college: 'Delhi Technological University',
            text: 'I really appreciated the flexibility. 100% remote layout meant I could finish assignments during semesters. The official MSME registered stamp on LOR document makes it very reliable for professional use.',
            rating: 5
        },
        {
            id: 4,
            name: 'Neha Roy',
            domain: 'Python Development',
            college: 'Jadavpur University',
            text: 'Best practical learning experience ever. Implementing code tasks and getting them reviewed. The instant ID card gave me verified intern community access. A complete package!',
            rating: 5
        }
    ]);

    // Testimonial Form State
    const [newName, setNewName] = useState('');
    const [newCollege, setNewCollege] = useState('');
    const [newDomain, setNewDomain] = useState('Full Stack Development');
    const [newRating, setNewRating] = useState(5);
    const [newText, setNewText] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter State
    const [selectedDomain, setSelectedDomain] = useState('All');

    const handleAddReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate minor API lag
        await new Promise((resolve) => setTimeout(resolve, 800));

        const freshTestimonial: Testimonial = {
            id: Date.now(),
            name: newName,
            domain: newDomain,
            college: newCollege,
            text: newText,
            rating: newRating
        };

        setTestimonials([freshTestimonial, ...testimonials]);
        setNewName('');
        setNewCollege('');
        setNewText('');
        setNewRating(5);
        setIsSubmitting(false);
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 5000);
    };

    const tracks = ['All', 'Full Stack Development', 'Data Science & AI', 'Java Development', 'Python Development', 'Cyber Security'];

    // Map domains to custom gradients/colors for styling
    const getDomainStyles = (domain: string) => {
        switch (domain) {
            case 'Full Stack Development':
                return {
                    badge: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/30',
                    gradient: 'from-blue-600 to-indigo-650',
                    shadow: 'hover:shadow-[0_10px_35px_-10px_rgba(59,130,246,0.2)]'
                };
            case 'Data Science & AI':
                return {
                    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/30',
                    gradient: 'from-emerald-600 to-teal-650',
                    shadow: 'hover:shadow-[0_10px_35px_-10px_rgba(16,185,129,0.2)]'
                };
            case 'Java Development':
                return {
                    badge: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/30',
                    gradient: 'from-orange-500 to-amber-600',
                    shadow: 'hover:shadow-[0_10px_35px_-10px_rgba(245,158,11,0.2)]'
                };
            case 'Python Development':
                return {
                    badge: 'bg-yellow-50 text-yellow-800 border-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-900/30',
                    gradient: 'from-yellow-500 to-amber-500',
                    shadow: 'hover:shadow-[0_10px_35px_-10px_rgba(234,179,8,0.2)]'
                };
            case 'Cyber Security':
                return {
                    badge: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/30',
                    gradient: 'from-rose-600 to-red-650',
                    shadow: 'hover:shadow-[0_10px_35px_-10px_rgba(244,63,94,0.2)]'
                };
            default:
                return {
                    badge: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/30',
                    gradient: 'from-purple-600 to-indigo-600',
                    shadow: 'hover:shadow-[0_10px_35px_-10px_rgba(124,58,237,0.2)]'
                };
        }
    };

    const filteredTestimonials = selectedDomain === 'All'
        ? testimonials
        : testimonials.filter(t => t.domain === selectedDomain);

    return (
        <div className="relative min-h-screen py-24 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden flex flex-col justify-center">
            {/* Background Grid & Ambient Highlights */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415508_1px,transparent_1px),linear-gradient(to_bottom,#33415508_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#38bdf805_1px,transparent_1px),linear-gradient(to_bottom,#38bdf805_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_10%,#000_80%,transparent_100%)] pointer-events-none z-0"></div>

            {/* Ambient Lighting bubbles */}
            <div className="absolute top-1/4 right-1/4 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-purple-500/10 dark:bg-purple-600/5 blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-1/4 left-1/4 w-[380px] h-[380px] rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] pointer-events-none z-0"></div>

            <div className="relative max-w-7xl mx-auto px-6 lg:px-12 space-y-16 z-10 w-full">

                {/* Header Banner */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100/50 dark:border-purple-900/30 rounded-full text-[10px] font-extrabold text-purple-650 dark:text-purple-300 uppercase tracking-widest"
                    >
                        <MessageSquare size={11} className="text-purple-500 animate-pulse" />
                        <span>Intern Feedback Panel</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none"
                    >
                        Loved by Interns Across India
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed"
                    >
                        Read verified reviews, domain learnings, and project completion experiences from graduates who accelerated their development career at Vinix.
                    </motion.p>
                </div>

                {/* Filter Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto"
                >
                    {tracks.map((track) => (
                        <button
                            key={track}
                            onClick={() => setSelectedDomain(track)}
                            className={`px-4.5 py-2.5 rounded-full text-[11px] font-extrabold border transition-all duration-300 cursor-pointer ${selectedDomain === track
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                : 'bg-white/80 dark:bg-slate-905/80 backdrop-blur-sm border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            {track}
                        </button>
                    ))}
                </motion.div>

                {/* Stats Summary Panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-205/65 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm divide-y md:divide-y-0 md:divide-x divide-slate-150 dark:divide-slate-800 text-center z-10 relative"
                >
                    <div className="pb-4 md:pb-0">
                        <div className="text-3xl font-black text-slate-950 dark:text-white">4.9 ★</div>
                        <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 mt-1">Average Intern Rating</div>
                    </div>
                    <div className="py-4 md:py-0 md:px-6">
                        <div className="text-3xl font-black text-slate-950 dark:text-white">100%</div>
                        <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 mt-1">Verified Completion Reviews</div>
                    </div>
                    <div className="pt-4 md:pt-0">
                        <div className="text-3xl font-black text-slate-950 dark:text-white">4,800+</div>
                        <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 mt-1">Active Career Placements</div>
                    </div>
                </motion.div>

                {/* Reviews grid Layout */}
                <div className="relative min-h-[250px]">
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredTestimonials.map((t) => {
                                const styles = getDomainStyles(t.domain);
                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                        key={t.id}
                                        whileHover={{ y: -6 }}
                                        className={`group p-6 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col justify-between transition-all duration-300 ${styles.shadow}`}
                                    >
                                        <div className="space-y-4.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <Star
                                                            key={idx}
                                                            size={13}
                                                            className={idx < t.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"}
                                                        />
                                                    ))}
                                                </div>
                                                <span className={`text-[8px] font-black px-2.5 py-1 border rounded-full uppercase tracking-wider ${styles.badge}`}>
                                                    {t.domain}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed font-semibold italic">
                                                "{t.text}"
                                            </p>
                                        </div>

                                        <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                            <div className={`w-8.5 h-8.5 rounded-full bg-gradient-to-tr ${styles.gradient} text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                {t.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-none truncate group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition duration-200">
                                                    {t.name}
                                                </h4>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <GraduationCap size={10} className="text-slate-400 flex-shrink-0" />
                                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold truncate block">
                                                        {t.college}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>

                    <AnimatePresence>
                        {filteredTestimonials.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full py-16 text-center text-slate-400 dark:text-slate-500 font-extrabold text-sm flex flex-col items-center justify-center gap-2"
                            >
                                <Award size={28} className="text-slate-300 dark:text-slate-700 animate-bounce" />
                                <span>No reviews listed for this domain. Share yours below!</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Form to submit review */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 max-w-2xl mx-auto relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-purple-550/10 dark:bg-purple-500/5 rounded-full blur-2xl"></div>

                    <div className="space-y-1.5 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center space-x-2">
                            <Sparkles size={16} className="text-indigo-500 animate-spin-slow" />
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Share Your Experience</h3>
                        </div>
                        <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold leading-relaxed">
                            Your feedback helps other students choose virtual internships that benefit their careers.
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {submitSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="py-8 text-center space-y-4"
                            >
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                    <CheckCircle size={24} className="animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Review Captured Successfully!</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                                        Thank you for providing your feedback. We have added the review to the board.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleAddReview} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Your Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Aravind Swamy"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all duration-200 text-slate-850 dark:text-white shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">College / Institution</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. SRM University"
                                            value={newCollege}
                                            onChange={(e) => setNewCollege(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all duration-200 text-slate-850 dark:text-white shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-455 dark:text-slate-500 tracking-wider">Internship Track</label>
                                        <select
                                            value={newDomain}
                                            onChange={(e) => setNewDomain(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all duration-200 text-slate-850 dark:text-white cursor-pointer shadow-inner"
                                        >
                                            <option value="Full Stack Development">Full Stack Development</option>
                                            <option value="Java Development">Java Development</option>
                                            <option value="Python Development">Python Development</option>
                                            <option value="Data Science & AI">Data Science & AI</option>
                                            <option value="Cyber Security">Cyber Security</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-455 dark:text-slate-500 tracking-wider">Rating Score</label>
                                        <div className="flex gap-2 pt-2.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setNewRating(star)}
                                                    className="focus:outline-none transition transform hover:scale-125 duration-100"
                                                >
                                                    <Star
                                                        size={20}
                                                        className={`transition ${star <= newRating
                                                            ? 'text-amber-400 fill-amber-400'
                                                            : 'text-slate-200 dark:text-slate-700'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-455 dark:text-slate-500 tracking-wider">Your Feedback Message</label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="Write details of projects, mentors, LOR benefits..."
                                        value={newText}
                                        onChange={(e) => setNewText(e.target.value)}
                                        className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all duration-200 text-slate-850 dark:text-white resize-none shadow-inner"
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-550 hover:to-indigo-550 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-[0_4px_15px_-3px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_20px_-3px_rgba(124,58,237,0.5)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send size={12} className="text-white" />
                                            <span>Publish Internship Review</span>
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        )}
                    </AnimatePresence>
                </motion.div>

            </div>
        </div>
    );
};

export default Reviews;
