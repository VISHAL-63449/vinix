import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin, DomainModel, InternshipModel } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as Icons from 'lucide-react';

const {
    ArrowLeft, Search, Filter, Clock, MapPin, Award, CheckCircle2,
    Briefcase, Sparkles, X, ChevronRight, CheckCircle, ExternalLink, HelpCircle
} = Icons;

interface DomainDetailState extends DomainModel {
    internshipCount: number;
}

export default function DomainDetails() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    // Data states
    const [domain, setDomain] = useState<DomainDetailState | null>(null);
    const [internships, setInternships] = useState<InternshipModel[]>([]);
    const [userApps, setUserApps] = useState<Record<string, string>>({}); // internshipId -> applicationStatus
    const [userEnrolls, setUserEnrolls] = useState<Record<string, string>>({}); // internshipId -> enrollmentStatus
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtering states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDuration, setFilterDuration] = useState('All');
    const [filterLevel, setFilterLevel] = useState('All');
    const [filterMode, setFilterMode] = useState('All');
    const [filterStipend, setFilterStipend] = useState('All');

    // Application Modal
    const [selectedInternship, setSelectedInternship] = useState<InternshipModel | null>(null);
    const [appForm, setAppForm] = useState({
        name: '',
        email: '',
        phone: '',
        college: '',
        resumeUrl: '',
        githubUrl: '',
        linkedinUrl: ''
    });
    const [submittingApp, setSubmittingApp] = useState(false);
    const [appSuccess, setAppSuccess] = useState(false);
    const [appError, setAppError] = useState('');

    useEffect(() => {
        if (profile) {
            setAppForm(prev => ({
                ...prev,
                name: profile.full_name || '',
                email: user?.email || '',
                phone: profile.phone || '',
                resumeUrl: profile.resume_url || '',
                githubUrl: profile.github || '',
                linkedinUrl: profile.linkedin || ''
            }));
        }
    }, [profile, user]);

    useEffect(() => {
        async function loadDomainAndInternships() {
            if (!slug) return;
            try {
                setLoading(true);
                setError('');

                // 1. Fetch domain details
                const { data: dData, error: dErr } = await supabase
                    .from('domains')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (dErr) {
                    throw new Error('Domain track not found.');
                }

                // 2. Fetch internships linked to this domain (or matching by category/name if needed)
                const { data: iData, error: iErr } = await supabase
                    .from('internships')
                    .select('*')
                    .eq('domain_id', dData.id)
                    .eq('status', 'active');

                if (iErr) throw iErr;

                // 3. Fetch user applications & enrollments if logged in
                if (user) {
                    const { data: appsData } = await supabaseAdmin
                        .from('internship_applications')
                        .select('internship_id, status')
                        .eq('student_id', user.id);

                    const { data: enrollsData } = await supabaseAdmin
                        .from('internship_enrollments')
                        .select('internship_id, status')
                        .eq('user_id', user.id);

                    const appsMap: Record<string, string> = {};
                    (appsData || []).forEach(a => {
                        appsMap[a.internship_id] = a.status;
                    });
                    setUserApps(appsMap);

                    const enrollsMap: Record<string, string> = {};
                    (enrollsData || []).forEach(e => {
                        enrollsMap[e.internship_id] = e.status;
                    });
                    setUserEnrolls(enrollsMap);
                }

                setDomain({
                    ...dData,
                    internshipCount: (iData || []).length
                });
                setInternships(iData || []);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to load details.');
            } finally {
                setLoading(false);
            }
        }
        loadDomainAndInternships();
    }, [slug, user]);

    // Handle Application Submit
    const handleApplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInternship || !user) return;

        // Validation
        if (!appForm.name.trim() || !appForm.email.trim() || !appForm.phone.trim() || !appForm.college.trim() || !appForm.resumeUrl.trim()) {
            setAppError('Please fill out all required fields.');
            return;
        }
        if (appForm.name.length < 3) {
            setAppError('Full Name must be at least 3 characters.');
            return;
        }
        if (appForm.college.length < 3) {
            setAppError('College Name must be at least 3 characters.');
            return;
        }

        try {
            setSubmittingApp(true);
            setAppError('');

            const { error: appErr } = await supabaseAdmin
                .from('internship_applications')
                .insert({
                    student_id: user.id,
                    internship_id: selectedInternship.id,
                    student_name: appForm.name,
                    email: appForm.email,
                    phone: appForm.phone,
                    college: appForm.college,
                    resume_url: appForm.resumeUrl,
                    github_url: appForm.githubUrl,
                    linkedin_url: appForm.linkedinUrl,
                    status: 'pending'
                });

            if (appErr) {
                if (appErr.code === '23505') {
                    throw new Error('You have already applied for this internship track.');
                }
                throw appErr;
            }

            // Sync student details to user's main profile record for admin queries
            await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: appForm.name,
                    name: appForm.name,
                    college: appForm.college,
                    phone: appForm.phone,
                    github_url: appForm.githubUrl,
                    linkedin_url: appForm.linkedinUrl
                })
                .eq('id', user.id);

            // Establish an active enrollment in internship_enrollments for Admin admissions overview path
            const { error: enrollErr } = await supabaseAdmin
                .from('internship_enrollments')
                .insert({
                    user_id: user.id,
                    student_id: user.id,
                    internship_id: selectedInternship.id,
                    status: 'active'
                });

            // Also insert key legacy record in enrollments table
            await supabaseAdmin
                .from('enrollments')
                .insert({
                    user_id: user.id,
                    student_id: user.id,
                    internship_id: selectedInternship.id,
                    status: 'active'
                });

            // Generate offer letter if one doesn't already exist
            const { data: existingOffer } = await supabaseAdmin
                .from('offer_letters')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!existingOffer) {
                const offerLetterId = `VINIX-OFFER-${Math.floor(1000 + Math.random() * 9000)}`;
                const verificationToken = `tok_offer_${Math.floor(100000 + Math.random() * 900000)}`;
                await supabaseAdmin.from('offer_letters').insert({
                    user_id: user.id,
                    student_id: user.id,
                    offer_letter_id: offerLetterId,
                    student_name: appForm.name,
                    student_email: appForm.email,
                    internship_title: selectedInternship.title,
                    internship_id: selectedInternship.id,
                    duration: selectedInternship.duration || '1 Month',
                    status: 'ACCEPTED',
                    verification_token: verificationToken,
                    issue_date: new Date().toISOString()
                });

                // Trigger server-side PDF generation & email delivery
                fetch('/api/generate-offer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: user.id,
                        internshipId: selectedInternship.id
                    })
                }).catch(err => console.error('Failed to trigger server-side offer letter generation:', err));
            }

            // Seed task_progress rows so the dashboard shows correct tasks
            const { data: dbTasks } = await supabaseAdmin
                .from('internship_tasks')
                .select('id, task_number')
                .eq('internship_id', selectedInternship.id)
                .order('task_number');

            if (dbTasks && dbTasks.length > 0) {
                const { data: existingProgress } = await supabaseAdmin
                    .from('task_progress')
                    .select('task_id')
                    .eq('user_id', user.id)
                    .eq('internship_id', selectedInternship.id);

                const existingTaskIds = new Set((existingProgress || []).map(p => p.task_id));
                const progressInserts = dbTasks
                    .filter(t => !existingTaskIds.has(t.id))
                    .map(t => ({
                        user_id: user.id,
                        student_id: user.id,
                        internship_id: selectedInternship.id,
                        task_id: t.id,
                        status: t.task_number === 1 ? 'not_submitted' : 'locked',
                        github_url: null, linkedin_url: null,
                        student_note: null, admin_feedback: null,
                        submitted_at: null, reviewed_at: null
                    }));
                if (progressInserts.length > 0) {
                    await supabaseAdmin.from('task_progress').insert(progressInserts);
                }
            }

            setAppSuccess(true);
            setUserApps(prev => ({
                ...prev,
                [selectedInternship.id]: 'active'
            }));

            setTimeout(() => {
                setSelectedInternship(null);
                setAppSuccess(false);
            }, 1800);

        } catch (err: any) {
            setAppError(err.message || 'Failed to submit application.');
        } finally {
            setSubmittingApp(false);
        }
    };

    // Filter Internships
    const filteredInternships = internships.filter((internship) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            internship.title.toLowerCase().includes(query) ||
            internship.description.toLowerCase().includes(query) ||
            internship.company.toLowerCase().includes(query) ||
            internship.skills.some((s) => s.toLowerCase().includes(query));

        const matchesDuration = filterDuration === 'All' || internship.duration === filterDuration;
        const matchesLevel = filterLevel === 'All' || internship.difficulty === filterLevel || internship.level === filterLevel;
        const matchesMode = filterMode === 'All' || internship.mode === filterMode;

        let matchesStipend = true;
        if (filterStipend !== 'All') {
            const hasStipendVal = internship.stipend && internship.stipend !== 'Unpaid' && internship.stipend !== '0';
            matchesStipend = filterStipend === 'Paid' ? !!hasStipendVal : !hasStipendVal;
        }

        return matchesSearch && matchesDuration && matchesLevel && matchesMode && matchesStipend;
    });

    const getIconElement = (iconName: string) => {
        const LucideIcon = (Icons as any)[iconName];
        if (LucideIcon) return <LucideIcon className="w-10 h-10 text-white" />;
        return <Briefcase className="w-10 h-10 text-white" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-bold dark:text-slate-400">Loading domain details...</p>
            </div>
        );
    }

    if (error || !domain) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-10">
                <div className="p-8 max-w-md bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950 rounded-3xl text-center shadow-lg">
                    <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-950 dark:text-white">Failed to load</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-semibold">{error || 'Domain was not found.'}</p>
                    <Link to="/domains" className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow hover:bg-blue-500 transition">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Domains</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Link */}
                <Link
                    to="/domains"
                    className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold text-xs mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Domains</span>
                </Link>

                {/* Banner Glass Header */}
                <div className="relative rounded-3xl overflow-hidden mb-12 bg-slate-900 text-white min-h-[300px] flex items-center p-8 sm:p-12 border border-slate-700/30">
                    {domain.image && (
                        <div className="absolute inset-0 z-0">
                            <img src={domain.image} alt={domain.name} className="w-full h-full object-cover opacity-30" />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent"></div>
                        </div>
                    )}

                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600/70 backdrop-blur border border-blue-500/20 flex items-center justify-center">
                                {getIconElement(domain.icon)}
                            </div>
                            <div>
                                <span className="text-[10px] tracking-wider uppercase font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/25">
                                    Learning Track
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-black mt-1">
                                    {domain.name}
                                </h1>
                            </div>
                        </div>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-semibold">
                            {domain.description}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {domain.skills.map((skill, sIdx) => (
                                <span key={sIdx} className="px-3 py-1 rounded-xl text-xs font-bold bg-white/10 border border-white/10">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid for Filters + Internships */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Filters Sidebar */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-205 dark:border-slate-800/40 space-y-6 h-fit sticky top-6">
                        <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                            <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center space-x-2">
                                <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span>Filter Internships</span>
                            </h3>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterDuration('All');
                                    setFilterLevel('All');
                                    setFilterMode('All');
                                    setFilterStipend('All');
                                }}
                                className="text-[11px] font-black text-blue-650 hover:text-blue-500 transition cursor-pointer"
                            >
                                Reset All
                            </button>
                        </div>

                        {/* Search Internal */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">Search Within</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by keywords..."
                                    className="w-full bg-slate-50 dark:bg-slate-950 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-905 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Filter Level */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">Difficulty Level</label>
                            <select
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-505 transition text-slate-700 dark:text-slate-300"
                            >
                                <option value="All">All Levels</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>

                        {/* Filter Mode */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">Work Mode</label>
                            <select
                                value={filterMode}
                                onChange={(e) => setFilterMode(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-505 transition text-slate-700 dark:text-slate-300"
                            >
                                <option value="All">All Modes</option>
                                <option value="Remote">Remote</option>
                                <option value="Hybrid">Hybrid</option>
                                <option value="In-office">In-office</option>
                            </select>
                        </div>

                        {/* Filter Duration */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">Duration</label>
                            <select
                                value={filterDuration}
                                onChange={(e) => setFilterDuration(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-505 transition text-slate-700 dark:text-slate-300"
                            >
                                <option value="All">All Durations</option>
                                <option value="4 Weeks">4 Weeks</option>
                                <option value="8 Weeks">8 Weeks</option>
                                <option value="3 Months">3 Months</option>
                                <option value="6 Months">6 Months</option>
                            </select>
                        </div>

                        {/* Filter Stipend */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">Compensation</label>
                            <select
                                value={filterStipend}
                                onChange={(e) => setFilterStipend(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-505 transition text-slate-700 dark:text-slate-300"
                            >
                                <option value="All">All Compensations</option>
                                <option value="Paid">Paid / Stipend Available</option>
                                <option value="Unpaid">Unpaid / Self-paced</option>
                            </select>
                        </div>
                    </div>

                    {/* Right Internships Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex justify-between items-center bg-white dark:bg-slate-900/60 p-4.5 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                                Available Tracks: {filteredInternships.length} of {internships.length}
                            </span>
                        </div>

                        {filteredInternships.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200/50 dark:border-slate-850/45 shadow-sm">
                                <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-slate-850 dark:text-white">No internships match</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 font-semibold">
                                    We couldn't find any internship tracks under this domain matching the selected filter options.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {filteredInternships.map((internship) => {
                                    const appStatus = userApps[internship.id];
                                    const enrollStatus = userEnrolls[internship.id];

                                    return (
                                        <div
                                            key={internship.id}
                                            className="group bg-white dark:bg-slate-900/65 rounded-3xl border border-slate-205 dark:border-slate-800/40 hover:border-blue-500/40 dark:hover:border-blue-500/25 p-6 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
                                        >
                                            <div className="space-y-4 flex-grow max-w-2xl">
                                                {/* Meta Info */}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                                                        {internship.difficulty || internship.level || 'Intermediate'}
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200">
                                                        {internship.mode}
                                                    </span>
                                                    <span className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 text-xs font-bold ml-2">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{internship.duration}</span>
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-650 dark:group-hover:text-blue-450 transition-colors">
                                                        {internship.title}
                                                    </h3>
                                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                                        Offered by {internship.company || internship.company_name || 'VINIX'}
                                                    </span>
                                                </div>

                                                {/* Description */}
                                                <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 leading-relaxed line-clamp-2">
                                                    {internship.description}
                                                </p>

                                                {/* Skills required */}
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {internship.skills.map((skill, sIdx) => (
                                                        <span
                                                            key={sIdx}
                                                            className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-slate-50 dark:bg-slate-800/80 text-slate-650 border border-slate-200/40 dark:border-slate-850"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Action Button Section */}
                                            <div className="flex flex-col justify-center items-stretch md:items-end w-full md:w-auto min-w-[200px] border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                                                <div className="text-center md:text-right mb-4">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block mb-0.5">COMPENSATION</span>
                                                    <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                                        {internship.stipend && internship.stipend !== '0' && internship.stipend !== 'Unpaid'
                                                            ? internship.stipend
                                                            : 'Self-paced (₹0 Application)'
                                                        }
                                                    </span>
                                                </div>

                                                {enrollStatus === 'active' || enrollStatus === 'in_progress' ? (
                                                    <Link
                                                        to="/dashboard"
                                                        className="w-full flex items-center justify-center space-x-1.5 px-6 py-3 rounded-2xl text-xs font-extrabold text-white bg-green-600 hover:bg-green-500 transition shadow hover:shadow-md cursor-pointer"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>Continue Internship</span>
                                                    </Link>
                                                ) : appStatus === 'pending' ? (
                                                    <button
                                                        disabled
                                                        className="w-full px-6 py-3 rounded-2xl text-xs font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 cursor-not-allowed text-center"
                                                    >
                                                        Applied - Under Review
                                                    </button>
                                                ) : appStatus === 'approved' ? (
                                                    <Link
                                                        to="/dashboard"
                                                        className="w-full flex items-center justify-center space-x-1 px-6 py-3 rounded-2xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 transition shadow cursor-pointer"
                                                    >
                                                        <span>Go to Dashboard</span>
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            if (!user) {
                                                                navigate(`/login?redirect=/domains/${slug}`);
                                                            } else {
                                                                setSelectedInternship(internship);
                                                            }
                                                        }}
                                                        className="w-full px-6 py-3 rounded-2xl text-xs font-extrabold text-white bg-blue-606 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 shadow hover:shadow-md transition active:scale-98 cursor-pointer text-center"
                                                    >
                                                        {user ? 'Apply Now' : 'Login to Enroll'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Application Modal Popup */}
            {selectedInternship && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                            <div>
                                <span className="text-[10px] tracking-wider uppercase font-black px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                                    APPLY FOR VIRTUAL INTERNSHIP
                                </span>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                                    {selectedInternship.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedInternship(null)}
                                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {appSuccess ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/20 flex items-center justify-center border border-green-200 dark:border-green-905 mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h4 className="text-xl font-black text-slate-950 dark:text-white">Application Submitted!</h4>
                                <p className="text-slate-550 dark:text-slate-400 text-xs font-semibold max-w-sm mx-auto">
                                    Your candidacy has been successfully registered. The operations department will review your credentials and issue a decision within 24 hours.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleApplySubmit} className="space-y-4">
                                {appError && (
                                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-220 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold">
                                        {appError}
                                    </div>
                                )}

                                {/* Full Name */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-450 block">Full Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={appForm.name}
                                        onChange={(e) => setAppForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter your registered full name"
                                        className="w-full bg-slate-50 dark:bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-xs font-semibold text-slate-850 dark:text-white"
                                    />
                                </div>

                                {/* Email Address */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-450 block">Email Address <span className="text-rose-500">*</span></label>
                                    <input
                                        type="email"
                                        required
                                        value={appForm.email}
                                        onChange={(e) => setAppForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="Enter your contact email"
                                        className="w-full bg-slate-50 dark:bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-xs font-semibold text-slate-850 dark:text-white"
                                    />
                                </div>

                                {/* Phone & College */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-450 block">Phone Number <span className="text-rose-500">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            value={appForm.phone}
                                            onChange={(e) => setAppForm(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="Contact phone"
                                            className="w-full bg-slate-50 dark:bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-xs font-semibold text-slate-850 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-450 block">College Name <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={appForm.college}
                                            onChange={(e) => setAppForm(prev => ({ ...prev, college: e.target.value }))}
                                            placeholder="College/University"
                                            className="w-full bg-slate-50 dark:bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-xs font-semibold text-slate-850 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Resume Link */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-450 block">Resume URL (Doc/PDF Drive Link) <span className="text-rose-500">*</span></label>
                                    <input
                                        type="url"
                                        required
                                        value={appForm.resumeUrl}
                                        onChange={(e) => setAppForm(prev => ({ ...prev, resumeUrl: e.target.value }))}
                                        placeholder="https://drive.google.com/..."
                                        className="w-full bg-slate-50 dark:bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-xs font-semibold text-slate-850 dark:text-white"
                                    />
                                </div>

                                {/* GitHub & LinkedIn */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-450 block">GitHub Profile (Optional)</label>
                                        <input
                                            type="url"
                                            value={appForm.githubUrl}
                                            onChange={(e) => setAppForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                                            placeholder="https://github.com/..."
                                            className="w-full bg-slate-50 dark:bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-xs font-semibold text-slate-850 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-450 block">LinkedIn Profile (Optional)</label>
                                        <input
                                            type="url"
                                            value={appForm.linkedinUrl}
                                            onChange={(e) => setAppForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                            placeholder="https://linkedin.com/in/..."
                                            className="w-full bg-slate-50 dark:bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-xs font-semibold text-slate-850 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Submit button */}
                                <div className="pt-4 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedInternship(null)}
                                        className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-extrabold hover:bg-slate-50 dark:hover:bg-slate-850 transition cursor-pointer text-slate-700 dark:text-slate-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingApp}
                                        className="px-6 py-2.5 rounded-xl bg-blue-606 hover:bg-blue-500 text-xs font-extrabold text-white shadow hover:shadow-md transition cursor-pointer flex items-center space-x-2"
                                    >
                                        {submittingApp && (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                        <span>Submit Application</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
