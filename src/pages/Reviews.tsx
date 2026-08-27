import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle, Send, Sparkles, Award, GraduationCap, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Testimonial {
    id: number | string;
    name: string;
    domain: string;
    college: string;
    text: string;
    rating: number;
}

export const Reviews: React.FC = () => {
    const { user, profile, studentProfile } = useAuth();
    const navigate = useNavigate();

    const INITIAL_MOCK_TESTIMONIALS: Testimonial[] = [
        {
            id: 1,
            name: 'Harish',
            domain: 'Full Stack Development',
            college: 'SRM University',
            text: 'Vinix completely changed how I learn programming. The task-based module is excellent. Getting my offer letter instantly and having practical items to show in my GitHub portfolio got me selected at my tier-1 developer job.',
            rating: 5
        },
        {
            id: 2,
            name: 'Kavin',
            domain: 'Data Science & AI',
            college: 'VIT Chennai',
            text: 'I worked on 8 major assignments including AI model evaluation and python tasks. The custom QR verification on the completion certificate is flawless! Highly recommend this remote self-paced internship for developers.',
            rating: 5
        },
        {
            id: 3,
            name: 'Dinesh',
            domain: 'Java Development',
            college: 'Delhi Technological University',
            text: 'I really appreciated the flexibility. 100% remote layout meant I could finish assignments during semesters. The official MSME registered stamp on LOR document makes it very reliable for professional use.',
            rating: 5
        },
        {
            id: 4,
            name: 'Mugilan',
            domain: 'Python Development',
            college: 'Jadavpur University',
            text: 'Best practical learning experience ever. Implementing code tasks and getting them reviewed. The instant ID card gave me verified intern community access. A complete package!',
            rating: 5
        },
        {
            id: 5,
            name: 'Tamilarasan',
            domain: 'Cyber Security',
            college: 'PSG College of Technology',
            text: 'The cybersecurity track assignments were highly realistic. Analyzing network logs, identifying vulnerabilities, and testing standard protocols gave me solid industry-ready credentials.',
            rating: 5
        }
    ];

    const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_MOCK_TESTIMONIALS);

    // Testimonial Form State
    const [newName, setNewName] = useState('');
    const [newCollege, setNewCollege] = useState('');
    const [newText, setNewText] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Internships State
    const [dbInternships, setDbInternships] = useState<{ id: string; title: string }[]>([]);
    const [selectedInternshipId, setSelectedInternshipId] = useState('');

    // Filter State
    const [selectedDomain, setSelectedDomain] = useState('All');

    // Fetch dynamic reviews and join with student profile details
    const fetchReviews = async () => {
        try {
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select(`
                    id,
                    rating,
                    review,
                    created_at,
                    student_id,
                    internships (
                        id,
                        title,
                        category
                    )
                `)
                .order('created_at', { ascending: false });

            if (reviewsError) {
                console.error('Error fetching reviews:', reviewsError);
                return;
            }

            const studentIds = [...new Set((reviewsData || []).map(r => r.student_id).filter(Boolean))];

            let profilesMap = new Map();
            if (studentIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, college')
                    .in('id', studentIds);

                if (profilesData) {
                    profilesData.forEach(p => profilesMap.set(p.id, p));
                }
            }

            const mapped = (reviewsData || []).map((r: any) => {
                const prf = profilesMap.get(r.student_id);
                return {
                    id: r.id,
                    name: prf?.full_name || 'Anonymous Student',
                    domain: r.internships?.title || 'Virtual Internship',
                    college: prf?.college || 'Institution',
                    text: r.review,
                    rating: r.rating
                };
            });

            // Combine database reviews with INITIAL_MOCK_TESTIMONIALS
            setTestimonials([...mapped, ...INITIAL_MOCK_TESTIMONIALS]);
        } catch (err) {
            console.error('Failed to load testimonials:', err);
        }
    };

    // Fetch dynamic internships for the dropdown
    const fetchInternships = async () => {
        try {
            const { data, error } = await supabase
                .from('internships')
                .select('id, title')
                .order('title', { ascending: true });

            if (data) {
                setDbInternships(data);
                if (data.length > 0) {
                    setSelectedInternshipId(data[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch internships:', err);
        }
    };

    useEffect(() => {
        fetchReviews();
        fetchInternships();
    }, []);

    // Set pre-filled details when user logs status updates
    useEffect(() => {
        if (user && profile) {
            setNewName(profile.full_name || '');
            setNewCollege(studentProfile?.college || '');
        } else {
            setNewName('');
            setNewCollege('');
        }
    }, [user, profile, studentProfile]);

    const handleAddReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        try {
            let finalInternshipId = selectedInternshipId;
            if (!finalInternshipId && dbInternships.length > 0) {
                finalInternshipId = dbInternships[0].id;
            }

            const { error: insErr } = await supabase
                .from('reviews')
                .insert({
                    student_id: user.id,
                    internship_id: finalInternshipId || null,
                    rating: newRating,
                    review: newText
                });

            if (insErr) throw insErr;

            setNewText('');
            setNewRating(5);
            setSubmitSuccess(true);
            setTimeout(() => setSubmitSuccess(false), 5000);

            await fetchReviews();
        } catch (err: any) {
            console.error('Failed to submit review:', err);
            alert(err.message || 'Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInitials = (fullName: string) => {
        if (!fullName) return 'U';
        const parts = fullName.trim().replace(/\s+/g, ' ').split(' ');
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const tracks = ['All', 'Full Stack Development', 'Data Science & AI', 'Java Development', 'Python Development', 'Cyber Security', 'SQL & Database Development', 'AI & Machine Learning', 'UI/UX Design'];


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
                    badge: 'bg-yellow-50 text-yellow-805 border-yellow-105 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-900/30',
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
        <div className="relative min-h-screen py-24 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden flex flex-col justify-center animate-fade-in-up">
            {/* Background Grid & Ambient Highlights */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415508_1px,transparent_1px),linear-gradient(to_bottom,#33415508_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#38bdf805_1px,transparent_1px),linear-gradient(to_bottom,#38bdf805_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_10%,#000_80%,transparent_100%)] pointer-events-none z-0"></div>

            {/* Ambient Lighting bubbles */}
            <div className="absolute top-1/4 right-1/4 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-purple-500/10 dark:bg-purple-600/5 blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-1/4 left-1/4 w-[380px] h-[380px] rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] pointer-events-none z-0"></div>

            <div className="relative max-w-7xl mx-auto px-6 lg:px-12 space-y-16 z-10 w-full animate-fade-in">

                {/* Header Banner */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100/50 dark:border-purple-900/30 rounded-full text-[10px] font-extrabold text-purple-600 dark:text-purple-300 uppercase tracking-widest">
                        <MessageSquare size={11} className="text-purple-500 animate-pulse" />
                        <span>Intern Feedback Panel</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        Loved by Interns Across India
                    </h1>

                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
                        Read verified reviews, domain learnings, and project completion experiences from graduates who accelerated their development career at Vinix.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
                    {tracks.map((track) => (
                        <button
                            key={track}
                            onClick={() => setSelectedDomain(track)}
                            className={`px-5 py-2 rounded-full text-[11px] font-extrabold border transition-all duration-300 cursor-pointer ${selectedDomain === track
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-transparent text-white shadow-md shadow-indigo-600/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            {track}
                        </button>
                    ))}
                </div>

                {/* Stats Summary Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm divide-y md:divide-y-0 md:divide-x divide-slate-150 dark:divide-slate-800 text-center z-10 relative">
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
                </div>

                {/* Reviews grid Layout */}
                <div className="relative min-h-[250px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredTestimonials.map((t) => {
                            const styles = getDomainStyles(t.domain);
                            return (
                                <div
                                    key={t.id}
                                    className={`group p-6 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${styles.shadow}`}
                                >
                                    <div className="space-y-4">
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
                                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold italic">
                                            "{t.text}"
                                        </p>
                                    </div>

                                    <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                                            {getInitials(t.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-none truncate">
                                                {t.name}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate block mt-1.5">
                                                {t.college}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredTestimonials.length === 0 && (
                        <div className="w-full py-16 text-center text-slate-400 dark:text-slate-500 font-extrabold text-sm flex flex-col items-center justify-center gap-2">
                            <Award size={28} className="text-slate-300 dark:text-slate-700 animate-bounce" />
                            <span>No reviews listed for this domain. Share yours below!</span>
                        </div>
                    )}
                </div>

                {/* Form to submit review */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 max-w-2xl mx-auto relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-purple-550/10 dark:bg-purple-500/5 rounded-full blur-2xl"></div>

                    <div className="space-y-1.5 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center space-x-2">
                            <Sparkles size={16} className="text-indigo-500 animate-spin-slow" />
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Share Your Experience</h3>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-405 font-semibold leading-relaxed">
                            Your feedback helps other students choose virtual internships that benefit their careers.
                        </p>
                    </div>

                    {!user ? (
                        <div className="py-10 text-center space-y-5 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-inner">
                                <Lock size={22} className="text-slate-400" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Gated Action</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                                    Please login to your dashboard to submit an official internship review.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition duration-300 shadow-md cursor-pointer"
                            >
                                Sign In to Write a Review
                            </button>
                        </div>
                    ) : submitSuccess ? (
                        <div className="py-8 text-center space-y-4">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle size={24} className="animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Review Captured Successfully!</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                                    Thank you for providing your feedback. We have added the review to the board.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleAddReview} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex flex-col justify-start">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Your Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        disabled
                                        placeholder="e.g. Harish"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full text-xs font-semibold bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-80"
                                    />
                                    <span className="text-[9px] text-slate-450 font-semibold mt-1">LinkedIn Profile Name Linked</span>
                                </div>
                                <div className="space-y-1.5 flex flex-col justify-start">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">College / Institution</label>
                                    <input
                                        type="text"
                                        required
                                        disabled
                                        placeholder="e.g. SRM University"
                                        value={newCollege}
                                        onChange={(e) => setNewCollege(e.target.value)}
                                        className="w-full text-xs font-semibold bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-80"
                                    />
                                    <span className="text-[9px] text-slate-450 font-semibold mt-1">Official Student College Linked</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Internship Track</label>
                                    <select
                                        value={selectedInternshipId}
                                        onChange={(e) => setSelectedInternshipId(e.target.value)}
                                        className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all duration-200 text-slate-805 dark:text-white cursor-pointer shadow-inner"
                                    >
                                        {dbInternships.length > 0 ? (
                                            dbInternships.map(intern => (
                                                <option key={intern.id} value={intern.id}>{intern.title}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="c37a2171-7412-488b-9ab1-ccf01f0fb90e">Full Stack Development</option>
                                                <option value="3af0cd52-af0d-4d74-926e-6890c876fe11">Python Development</option>
                                                <option value="141124c2-cf77-4022-9b9b-18796585527e">SQL & Database Development</option>
                                                <option value="25bddada-1e53-4c82-b172-92474cd2a193">AI & Machine Learning</option>
                                                <option value="ca600a93-45ca-48db-920d-49d6f23463a7">Java Development</option>
                                                <option value="f75aba63-5989-484a-83f3-c68f7a67f464">UI/UX Design</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Rating Score</label>
                                    <div className="flex gap-2 pt-2.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewRating(star)}
                                                className="focus:outline-none transition transform hover:scale-125 duration-100 bg-transparent border-0 cursor-pointer"
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
                                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Your Feedback Message</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Write details of projects, mentors, LOR benefits..."
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                    className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all duration-200 text-slate-805 dark:text-white resize-none shadow-inner"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-[0_4px_15px_-3px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_20px_-3px_rgba(124,58,237,0.5)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send size={12} className="text-white" />
                                        <span>Publish Internship Review</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Reviews;
