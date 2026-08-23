import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard, CheckSquare, Search, ShieldCheck, User, FolderOpen,
    Award, FileSpreadsheet, Plus, Trash2, Edit3, X, Megaphone, Mail,
    Sparkles, PlusCircle, Bell, Moon, ChevronDown, ListTodo, Users, ExternalLink,
    Briefcase, BookOpen, Layers, Check, Activity
} from 'lucide-react';

interface Internship {
    id: string;
    title: string;
    category: string;
    description: string;
    duration: string;
}

interface Enrollment {
    id: string;
    user_id: string;
    internship_id: string;
    status: string;
    joined_at: string;
    profiles?: {
        full_name: string;
        email: string;
        college: string;
        year_of_study?: string;
        course_branch?: string;
        state?: string;
        district?: string;
        city?: string;
    };
    internships?: {
        title: string;
    };
}

interface TaskProgress {
    id: string;
    user_id: string;
    internship_id: string;
    task_id: string;
    status: string;
    github_url?: string;
    linkedin_url?: string;
    student_note?: string;
    admin_feedback?: string;
    submitted_at?: string;
    profiles?: {
        full_name: string;
        email: string;
    };
    internship_tasks?: {
        task_number: number;
        title: string;
        description: string;
    };
}

interface Certificate {
    id: string;
    certificate_number: string;
    user_id: string;
    course_name: string;
    issue_date: string;
    status: string;
    profiles?: {
        full_name: string;
    };
}

interface OfferLetter {
    id: string;
    offer_letter_id: string;
    student_name: string;
    student_email: string;
    internship_title: string;
    issue_date: string;
    status: string;
}

interface Domain {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    image?: string;
    skills: string[];
    is_active: boolean;
    created_at?: string;
}

const AdminPortal: React.FC = () => {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'submissions' | 'certificates' | 'domains'>('overview');
    const [subTab, setSubTab] = useState<'domains' | 'internships'>('domains');

    // Database Data States
    const [domainsList, setDomainsList] = useState<Domain[]>([]);
    const [internships, setInternships] = useState<Internship[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [submissions, setSubmissions] = useState<TaskProgress[]>([]);
    const [allSubmissions, setAllSubmissions] = useState<TaskProgress[]>([]);
    const [gradingSubTab, setGradingSubTab] = useState<'pending' | 'all'>('pending');
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
    const [loading, setLoading] = useState(true);

    // Submissions search & filters
    const [submissionSearch, setSubmissionSearch] = useState('');

    // Evaluation modal
    const [selectedSubForReview, setSelectedSubForReview] = useState<TaskProgress | null>(null);
    const [adminFeedback, setAdminFeedback] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    // Domain CRUD States
    const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
    const [domainName, setDomainName] = useState('');
    const [domainSlug, setDomainSlug] = useState('');
    const [domainIcon, setDomainIcon] = useState('Code');
    const [domainImage, setDomainImage] = useState('');
    const [domainSkills, setDomainSkills] = useState('');
    const [domainIsActive, setDomainIsActive] = useState(true);
    const [savingDomain, setSavingDomain] = useState(false);

    // Internship Creator States (Upgraded)
    const [domainTitle, setDomainTitle] = useState('');
    const [domainCategory, setDomainCategory] = useState('');
    const [domainDesc, setDomainDesc] = useState('');
    const [domainDuration, setDomainDuration] = useState('3 Months');
    const [selectedDomainId, setSelectedDomainId] = useState('');
    const [internshipStipend, setInternshipStipend] = useState('Unpaid');
    const [internshipDifficulty, setInternshipDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
    const [internshipMode, setInternshipMode] = useState<'Remote' | 'Hybrid' | 'In-office'>('Remote');
    const [savingInternship, setSavingInternship] = useState(false);
    const [selectedEnrollForDetails, setSelectedEnrollForDetails] = useState<Enrollment | null>(null);

    // Issue Certificate Form
    const [certStudentId, setCertStudentId] = useState('');
    const [certCourseName, setCertCourseName] = useState('');
    const [issuingCert, setIssuingCert] = useState(false);

    async function loadData() {
        try {
            setLoading(true);

            // Fetch domains
            const { data: doms } = await supabaseAdmin
                .from('domains')
                .select('*')
                .order('name');

            // Fetch internships Include domain details if available
            const { data: inters } = await supabaseAdmin
                .from('internships')
                .select('*');

            // Fetch internship applications to pull user-filled personal details (like correct Gmail, name, college)
            const { data: apps } = await supabaseAdmin
                .from('internship_applications')
                .select('*');

            // Fetch enrollments with internship details (joining profiles in JS instead of PostgREST)
            const { data: enrolls } = await supabaseAdmin
                .from('internship_enrollments')
                .select('*, internships:internship_id(title)')
                .order('joined_at', { ascending: false });

            // Fetch submissions (joining profiles in JS instead of PostgREST)
            const { data: subs } = await supabaseAdmin
                .from('task_progress')
                .select('*, internship_tasks:task_id(task_number, title, description)')
                .order('submitted_at', { ascending: false });

            // Fetch certificates (joining profiles in JS instead of PostgREST)
            const { data: certs } = await supabaseAdmin
                .from('certificates')
                .select('*');

            // Fetch offer letters
            const { data: offers } = await supabaseAdmin
                .from('offer_letters')
                .select('*');

            // Collect all unique user IDs from enrolls, subs, and certs
            const enrolledUserIds = (enrolls || []).map(e => e.user_id);
            const subUserIds = (subs || []).map(s => s.user_id);
            const certUserIds = (certs || []).map(c => c.user_id);
            const allUserIds = Array.from(new Set([...enrolledUserIds, ...subUserIds, ...certUserIds].filter(Boolean)));

            // Fetch profiles in bulk
            let profilesMap: Record<string, { full_name: string; email: string; college?: string }> = {};
            if (allUserIds.length > 0) {
                const { data: profiles } = await supabaseAdmin
                    .from('profiles')
                    .select('id, full_name, email, college')
                    .in('id', allUserIds);

                if (profiles) {
                    profiles.forEach(p => {
                        profilesMap[p.id] = {
                            full_name: p.full_name || 'Alumnus',
                            email: p.email || '',
                            college: p.college || ''
                        };
                    });
                }
            }

            // Map internship applications by user_id + internship_id
            const appsMap: Record<string, {
                student_name: string;
                email: string;
                college?: string;
                year_of_study?: string;
                course_branch?: string;
                state?: string;
                district?: string;
                city?: string;
            }> = {};
            if (apps) {
                apps.forEach(app => {
                    const key = `${app.student_id}_${app.internship_id}`;
                    appsMap[key] = {
                        student_name: app.student_name,
                        email: app.email,
                        college: app.college,
                        year_of_study: app.year_of_study,
                        course_branch: app.course_branch,
                        state: app.state,
                        district: app.district,
                        city: app.city
                    };
                });
            }

            // Map profiles into the data array client-side (prioritizing custom details entered in the application form)
            const finalEnrolls = (enrolls || []).map(e => {
                const appDetail = appsMap[`${e.user_id}_${e.internship_id}`] || appsMap[`${e.student_id}_${e.internship_id}`];
                const profileDetail = profilesMap[e.user_id];
                return {
                    ...e,
                    profiles: {
                        full_name: appDetail?.student_name || profileDetail?.full_name || 'Alumnus',
                        email: appDetail?.email || profileDetail?.email || '',
                        college: appDetail?.college || profileDetail?.college || '',
                        year_of_study: appDetail?.year_of_study || '',
                        course_branch: appDetail?.course_branch || '',
                        state: appDetail?.state || '',
                        district: appDetail?.district || '',
                        city: appDetail?.city || ''
                    }
                };
            });

            const finalSubs = (subs || []).map(s => {
                const appDetail = appsMap[`${s.user_id}_${s.internship_id}`] || appsMap[`${s.student_id}_${s.internship_id}`];
                const profileDetail = profilesMap[s.user_id];
                return {
                    ...s,
                    profiles: {
                        full_name: appDetail?.student_name || profileDetail?.full_name || 'Unknown',
                        email: appDetail?.email || profileDetail?.email || ''
                    }
                };
            });

            const finalCerts = (certs || []).map(c => {
                const profileDetail = profilesMap[c.user_id];
                return {
                    ...c,
                    profiles: {
                        full_name: profileDetail?.full_name || 'Unknown'
                    }
                };
            });

            setDomainsList(doms || []);
            setInternships(inters || []);
            setEnrollments(finalEnrolls);
            setSubmissions(finalSubs.filter(s => s.status === 'submitted'));
            setAllSubmissions(finalSubs);
            setCertificates(finalCerts);
            setOfferLetters(offers || []);

        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();

        // Subscribe to real-time changes
        const enrollChan = supabase
            .channel('public:enrollments_admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'internship_enrollments' }, () => {
                loadData();
            })
            .subscribe();

        const subChan = supabase
            .channel('public:task_progress_admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_progress' }, () => {
                loadData();
            })
            .subscribe();

        const domChan = supabase
            .channel('public:domains_admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'domains' }, () => {
                loadData();
            })
            .subscribe();

        return () => {
            enrollChan.unsubscribe();
            subChan.unsubscribe();
            domChan.unsubscribe();
        };
    }, []);

    // Approve new candidate application
    const handleApproveEnrollment = async (enroll: Enrollment) => {
        if (!confirm(`Generate internship offer credentials and approve ${enroll.profiles?.full_name}?`)) return;

        try {
            const offerId = `VINIX-OFFER-${Math.floor(1000 + Math.random() * 9000)}`;
            const token = `tok_${Math.random().toString(36).substring(2, 15)}`;

            // 1. Generate Offer Letter
            await supabaseAdmin.from('offer_letters').insert({
                user_id: enroll.user_id,
                offer_letter_id: offerId,
                student_name: enroll.profiles?.full_name || 'Alumnus',
                student_email: enroll.profiles?.email || '',
                internship_title: enroll.internships?.title || 'Engineering Internship',
                duration: '3 Months',
                status: 'SENT',
                verification_token: token,
                issue_date: new Date().toISOString()
            });

            // 2. Update Enrollment Details
            await supabaseAdmin
                .from('internship_enrollments')
                .update({ status: 'active' })
                .eq('id', enroll.id);

            // 3. Populate tasks progress for the student
            const { data: tasks } = await supabaseAdmin
                .from('internship_tasks')
                .select('id, task_number')
                .eq('internship_id', enroll.internship_id);

            if (tasks && tasks.length > 0) {
                const progressInserts = tasks.map(t => ({
                    user_id: enroll.user_id,
                    internship_id: enroll.internship_id,
                    task_id: t.id,
                    status: t.task_number === 1 ? 'available' : 'locked'
                }));
                await supabaseAdmin.from('task_progress').insert(progressInserts);
            }

            alert('Internship application approved. Offer credentials generated successfully!');
            loadData();
        } catch (err: any) {
            alert(`Approval error: ${err.message}`);
        }
    };

    // Reject new candidate application
    const handleRejectEnrollment = async (enrollId: string) => {
        if (!confirm('Reject this application?')) return;
        try {
            await supabaseAdmin
                .from('internship_enrollments')
                .update({ status: 'rejected' })
                .eq('id', enrollId);

            alert('Application status marked as rejected.');
            loadData();
        } catch (err: any) {
            alert(`Reject error: ${err.message}`);
        }
    };

    // Evaluate task solution submission
    const handleGradeSubmission = async (status: 'approved' | 'resubmission_required') => {
        if (!selectedSubForReview) return;
        setReviewLoading(true);

        try {
            // 1. Update status and feedback for current task
            const { error } = await supabaseAdmin
                .from('task_progress')
                .update({
                    status,
                    admin_feedback: adminFeedback,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', selectedSubForReview.id);

            if (error) throw error;

            // 2. If modernizing workflow: LinkedIn verification (task 1) unlocked -> set subsequent tasks as 'available'
            if (status === 'approved' && selectedSubForReview.internship_tasks?.task_number === 1) {
                // Unlock next milestones by changing status from 'locked' to 'available'
                await supabaseAdmin
                    .from('task_progress')
                    .update({ status: 'available' })
                    .eq('user_id', selectedSubForReview.user_id)
                    .eq('internship_id', selectedSubForReview.internship_id)
                    .eq('status', 'locked');
            }

            // 3. Recalculate student progress and check if certificate should be issued
            const { data: progressItems } = await supabaseAdmin
                .from('task_progress')
                .select('status')
                .eq('user_id', selectedSubForReview.user_id)
                .eq('internship_id', selectedSubForReview.internship_id);

            if (progressItems && progressItems.length > 0) {
                const approvedCount = progressItems.filter(p => p.status === 'approved').length;
                const totalCount = progressItems.length;
                const calProgress = Math.round((approvedCount / totalCount) * 100);

                // Update internship_enrollments
                await supabaseAdmin
                    .from('internship_enrollments')
                    .update({
                        progress: calProgress,
                        status: calProgress === 100 ? 'completed' : 'active',
                        completed_at: calProgress === 100 ? new Date().toISOString() : null
                    })
                    .eq('user_id', selectedSubForReview.user_id)
                    .eq('internship_id', selectedSubForReview.internship_id);

                // Update enrollments
                await supabaseAdmin
                    .from('enrollments')
                    .update({
                        progress: calProgress,
                        status: calProgress === 100 ? 'completed' : 'active',
                        completed_at: calProgress === 100 ? new Date().toISOString() : null
                    })
                    .eq('user_id', selectedSubForReview.user_id)
                    .eq('internship_id', selectedSubForReview.internship_id);

                // Auto-issue certificate if 100% completed
                if (calProgress === 100) {
                    const courseName = internships.find(i => i.id === selectedSubForReview.internship_id)?.title || 'Virtual Internship';
                    const { data: existingCerts } = await supabaseAdmin
                        .from('certificates')
                        .select('id')
                        .eq('user_id', selectedSubForReview.user_id)
                        .eq('course_name', courseName)
                        .limit(1);

                    if (!existingCerts || existingCerts.length === 0) {
                        const certNo = `VINIX-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                        await supabaseAdmin
                            .from('certificates')
                            .insert({
                                user_id: selectedSubForReview.user_id,
                                certificate_number: certNo,
                                course_name: courseName,
                                status: 'issued',
                                issue_date: new Date().toISOString()
                            });
                    }
                }
            }

            alert(`Milestone marked as ${status}.`);
            setSelectedSubForReview(null);
            setAdminFeedback('');
            loadData();
        } catch (err: any) {
            alert(`Failed to grade task: ${err.message}`);
        } finally {
            setReviewLoading(false);
        }
    };

    // Domain Save handler (Create / Update CRUD)
    const handleSaveDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domainName.trim()) {
            alert('Domain Name is required.');
            return;
        }
        setSavingDomain(true);

        const slug = domainSlug.trim() || domainName.toLowerCase().replace(/[^a-z0-0]+/g, '-').replace(/(^-|-$)/g, '');
        const skillsArray = domainSkills.split(',').map(s => s.trim()).filter(Boolean);

        try {
            if (editingDomainId) {
                // Update
                const { error } = await supabaseAdmin
                    .from('domains')
                    .update({
                        name: domainName,
                        slug,
                        description: domainDesc,
                        icon: domainIcon,
                        image: domainImage || null,
                        skills: skillsArray,
                        is_active: domainIsActive,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingDomainId);

                if (error) throw error;
                alert('Domain category updated successfully!');
            } else {
                // Insert new
                const { error } = await supabaseAdmin
                    .from('domains')
                    .insert({
                        name: domainName,
                        slug,
                        description: domainDesc,
                        icon: domainIcon,
                        image: domainImage || null,
                        skills: skillsArray,
                        is_active: domainIsActive
                    });

                if (error) throw error;
                alert('Domain category created successfully!');
            }

            // Reset Form Fields
            setEditingDomainId(null);
            setDomainName('');
            setDomainSlug('');
            setDomainIcon('Code');
            setDomainImage('');
            setDomainSkills('');
            setDomainIsActive(true);
            setDomainDesc('');
            loadData();
        } catch (err: any) {
            alert(`Domain operation failed: ${err.message}`);
        } finally {
            setSavingDomain(false);
        }
    };

    // Toggle Domain Active Status Immediately
    const handleToggleDomainActive = async (dom: Domain) => {
        try {
            const { error } = await supabaseAdmin
                .from('domains')
                .update({ is_active: !dom.is_active })
                .eq('id', dom.id);
            if (error) throw error;
            loadData();
        } catch (err: any) {
            alert(`Failed to toggle state: ${err.message}`);
        }
    };

    // Delete Domain category
    const handleDeleteDomain = async (id: string) => {
        if (!confirm('Are you sure you want to delete this Domain? This will set all linked internships domain_id to NULL.')) return;
        try {
            const { error } = await supabaseAdmin
                .from('domains')
                .delete()
                .eq('id', id);
            if (error) throw error;
            alert('Domain deleted successfully');
            loadData();
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        }
    };

    // Create Internship Track Linked to Selected Domain Category
    const handleCreateInternship = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domainTitle.trim() || !selectedDomainId) {
            alert('Please specify a Title and choose a Domain category');
            return;
        }

        setSavingInternship(true);

        try {
            // Find category name from selectedDomainId
            const categoryObj = domainsList.find(d => d.id === selectedDomainId);
            const categoryName = categoryObj ? categoryObj.name : 'Virtual Internship';
            const slug = domainTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            const { data: newIntern, error } = await supabaseAdmin
                .from('internships')
                .insert({
                    title: domainTitle,
                    category: categoryName,
                    domain_id: selectedDomainId,
                    description: domainDesc,
                    duration: domainDuration,
                    stipend: internshipStipend,
                    difficulty: internshipDifficulty,
                    level: internshipDifficulty,
                    mode: internshipMode,
                    slug,
                    status: 'active',
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            // Populate standard milestone tasks (Quest log tasks template)
            if (newIntern) {
                const defaultTasks = [];
                for (let i = 1; i <= 6; i++) {
                    defaultTasks.push({
                        internship_id: newIntern.id,
                        task_number: i,
                        title: i === 1 ? 'LinkedIn Offer Post Requirement' : `Milestone ${i - 1} Engineering Requirement`,
                        description: i === 1 ? 'Share your internship selection announcement on LinkedIn to unlock tasks.' : 'Complete technical assignment objectives.'
                    });
                }
                await supabaseAdmin.from('internship_tasks').insert(defaultTasks);
            }

            alert('Virtual internship track initialized with 6 milestones!');
            setDomainTitle('');
            setSelectedDomainId('');
            setDomainDesc('');
            loadData();
        } catch (err: any) {
            alert(`Failed to save internship: ${err.message}`);
        } finally {
            setSavingInternship(false);
        }
    };

    // Generate certificate
    const handleIssueCertificate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!certStudentId || !certCourseName) return;
        setIssuingCert(true);

        try {
            const certNo = `VINIX-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            const { error } = await supabaseAdmin
                .from('certificates')
                .insert({
                    user_id: certStudentId,
                    certificate_number: certNo,
                    course_name: certCourseName,
                    status: 'issued',
                    issue_date: new Date().toISOString()
                });

            if (error) throw error;

            alert(`Certificate issued: ${certNo}`);
            setCertStudentId('');
            setCertCourseName('');
            loadData();
        } catch (err: any) {
            alert(`Failed to issue certificate: ${err.message}`);
        } finally {
            setIssuingCert(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark flex items-center justify-center p-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
            </div>
        );
    }

    // Active dashboard stat evaluations
    const totalEnrolls = enrollments.filter(e => e.status === 'active').length;
    const pendingApps = enrollments.filter(e => e.status === 'pending');
    const pendingSubCount = submissions.length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 flex flex-col md:flex-row transition-all duration-300">

            {/* Sidebar navigation */}
            <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-205 dark:border-slate-805 flex flex-col justify-between p-4 flex-shrink-0 select-none">
                <div className="space-y-6">
                    <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black flex items-center justify-center text-sm shadow">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-extrabold text-sm tracking-tight block">Vinix Academic</span>
                            <span className="text-[9px] font-bold text-brand-primary uppercase tracking-widest leading-none">ADMIN CORE</span>
                        </div>
                    </div>

                    <div className="space-y-1 text-left">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wider ${activeTab === 'overview' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Metrics Overview</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wider ${activeTab === 'applications' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <FolderOpen className="w-4 h-4" />
                                <span>Admissions</span>
                            </div>
                            {pendingApps.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 animate-pulse">
                                    {pendingApps.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('submissions')}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wider ${activeTab === 'submissions' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <CheckSquare className="w-4 h-4" />
                                <span>Grading Lab</span>
                            </div>
                            {pendingSubCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-700">
                                    {pendingSubCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('certificates')}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wider ${activeTab === 'certificates' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500'
                                }`}
                        >
                            <Award className="w-4 h-4" />
                            <span>Certificates</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('domains')}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wider ${activeTab === 'domains' ? 'bg-brand-primary text-white shadow' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500'
                                }`}
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Intern Track CSV</span>
                        </button>
                    </div>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                    Logged in: <span className="font-bold underline select-all">{profile?.full_name}</span>
                </div>
            </aside>

            {/* Main content display */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top bar header */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-205 dark:border-slate-805 px-6 flex items-center justify-between select-none">
                    <div className="flex items-center space-x-2">
                        <h2 className="font-extrabold text-sm tracking-wide uppercase">Admin Dashboard Workspace</h2>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                        <span>Supabase Sync Connected</span>
                    </div>
                </header>

                <main className="flex-grow p-6 sm:p-8 space-y-8 overflow-y-auto">

                    {activeTab === 'overview' && (
                        <div className="space-y-8">

                            {/* Stats card grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                                <div className="bg-white dark:bg-brand-cardDark p-5 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Enrolled Interns</span>
                                    <h3 className="text-3xl font-extrabold mt-1">{totalEnrolls}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Enrolled student catalog</p>
                                </div>

                                <div className="bg-white dark:bg-brand-cardDark p-5 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pending Admissions</span>
                                    <h3 className="text-3xl font-extrabold mt-1 text-amber-600">{pendingApps.length}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Awaiting offer letter releases</p>
                                </div>

                                <div className="bg-white dark:bg-brand-cardDark p-5 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pending Submissions</span>
                                    <h3 className="text-3xl font-extrabold mt-1 text-blue-600">{pendingSubCount}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Milestones evaluation queue</p>
                                </div>

                                <div className="bg-white dark:bg-brand-cardDark p-5 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Certificates Issued</span>
                                    <h3 className="text-3xl font-extrabold mt-1">{certificates.length}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Verified credentials deployed</p>
                                </div>
                            </div>

                            {/* Quick Actions / Activity Feed */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">

                                {/* Pending applications list summary */}
                                <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 mb-4">Admissions Request Board</h3>
                                    {pendingApps.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-6 text-center italic">No pending admission requests.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingApps.map(app => (
                                                <div key={app.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-850 flex items-center justify-between gap-4">
                                                    <div>
                                                        <h4
                                                            onClick={() => setSelectedEnrollForDetails(app)}
                                                            className="text-xs font-bold text-slate-850 dark:text-slate-100 hover:text-brand-primary dark:hover:text-brand-accent cursor-pointer transition flex items-center space-x-1"
                                                        >
                                                            <span>{app.profiles?.full_name}</span>
                                                            <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                                                            Domain: <b>{app.internships?.title}</b> • College: {app.profiles?.college}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleApproveEnrollment(app)}
                                                        className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg transition"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Submissions queue review */}
                                <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 mb-4">Pending evaluations</h3>
                                    {submissions.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-6 text-center italic">No submissions awaiting reviews.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {submissions.slice(0, 3).map(sub => (
                                                <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-850 flex items-center justify-between gap-4">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100">{sub.profiles?.full_name}</h4>
                                                        <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                                                            Task {sub.internship_tasks?.task_number}: {sub.internship_tasks?.title}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedSubForReview(sub)}
                                                        className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg transition"
                                                    >
                                                        Grade
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>

                        </div>
                    )}

                    {activeTab === 'applications' && (
                        <div className="space-y-6 text-left">
                            <div className="border-b border-slate-205 dark:border-slate-805 pb-4">
                                <h2 className="text-xl font-bold flex items-center space-x-2">
                                    <FolderOpen className="w-5 h-5 text-brand-primary" />
                                    <span>Admissions Request Pipeline</span>
                                </h2>
                                <p className="text-xs text-slate-450 mt-0.5">Manage new student registrations and issue program offers.</p>
                            </div>

                            {enrollments.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-10">No students are currently registered in pipelines.</p>
                            ) : (
                                <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full border-collapse text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-805 text-slate-500 font-bold uppercase text-[9px]">
                                                <th className="p-4">Student</th>
                                                <th className="p-4">Track</th>
                                                <th className="p-4">School</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                            {enrollments.map(enroll => (
                                                <tr key={enroll.id} className="hover:bg-slate-50/[0.4] dark:hover:bg-slate-900/[0.2]">
                                                    <td className="p-4">
                                                        <span
                                                            onClick={() => setSelectedEnrollForDetails(enroll)}
                                                            className="font-bold flex items-center space-x-1 hover:text-brand-primary dark:hover:text-brand-accent cursor-pointer transition"
                                                        >
                                                            <span>{enroll.profiles?.full_name}</span>
                                                            <ExternalLink className="w-3 h-3 opacity-60 inline flex-shrink-0" />
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">{enroll.profiles?.email}</span>
                                                    </td>
                                                    <td className="p-4 font-bold">{enroll.internships?.title}</td>
                                                    <td className="p-4 text-slate-500">{enroll.profiles?.college}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${enroll.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20' :
                                                            enroll.status === 'pending' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                                                                'bg-rose-100 text-rose-700'
                                                            }`}>
                                                            {enroll.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right flex items-center justify-end space-x-2">
                                                        {enroll.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApproveEnrollment(enroll)}
                                                                    className="px-3 py-1 bg-brand-primary text-white font-bold rounded-lg transition"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectEnrollment(enroll.id)}
                                                                    className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'submissions' && (
                        <div className="space-y-6 text-left">
                            <div className="border-b border-slate-205 dark:border-slate-805 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center space-x-2">
                                        <CheckSquare className="w-5 h-5 text-brand-primary" />
                                        <span>Student Grading Lab Workspace</span>
                                    </h2>
                                    <p className="text-xs text-slate-450 mt-0.5">Evaluate milestone submissions, review Git branches, and provide feedback.</p>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by student name..."
                                    value={submissionSearch}
                                    onChange={(e) => setSubmissionSearch(e.target.value)}
                                    className="px-3.5 py-1.5 border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none w-full sm:w-64"
                                />
                            </div>

                            <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                                <button
                                    onClick={() => setGradingSubTab('pending')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer ${gradingSubTab === 'pending'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                >
                                    Pending Grading Queue ({submissions.length})
                                </button>
                                <button
                                    onClick={() => setGradingSubTab('all')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer ${gradingSubTab === 'all'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                >
                                    All Student Submissions ({allSubmissions.length})
                                </button>
                            </div>

                            {gradingSubTab === 'pending' ? (
                                submissions.filter(sub =>
                                    !submissionSearch ||
                                    (sub.profiles?.full_name || '').toLowerCase().includes(submissionSearch.toLowerCase())
                                ).length === 0 ? (
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-12 text-center">
                                        <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <h4 className="text-slate-850 dark:text-white font-bold">Grading queue empty</h4>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            All student submissions matching filters are graded.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {submissions
                                            .filter(sub =>
                                                !submissionSearch ||
                                                (sub.profiles?.full_name || '').toLowerCase().includes(submissionSearch.toLowerCase())
                                            )
                                            .map(sub => (
                                                <div key={sub.id} className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-5 shadow-sm space-y-4">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                                                        <div>
                                                            <h4 className="text-xs font-bold text-slate-805 dark:text-slate-100 uppercase tracking-wide">
                                                                {sub.profiles?.full_name} • Milestone {sub.internship_tasks?.task_number}
                                                            </h4>
                                                            <h3 className="text-sm font-semibold capitalize mt-0.5">{sub.internship_tasks?.title}</h3>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setAdminFeedback(sub.admin_feedback || '');
                                                                setSelectedSubForReview(sub);
                                                            }}
                                                            className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl transition shadow"
                                                        >
                                                            Grade Submission
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                        <div>
                                                            <span className="font-bold text-slate-400 uppercase tracking-widest block text-[9px]">GitHub / LinkedIn Solution Link</span>
                                                            <a
                                                                href={sub.github_url || sub.linkedin_url || '#'}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-brand-primary dark:text-brand-accent underline hover:opacity-90 font-mono mt-1 block truncate"
                                                            >
                                                                {sub.github_url || sub.linkedin_url || 'N/A'}
                                                            </a>
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-slate-400 uppercase tracking-widest block text-[9px]">Student Note</span>
                                                            <p className="text-slate-500 dark:text-slate-400 mt-1">{sub.student_note || 'No notes added.'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )
                            ) : (
                                allSubmissions.filter(sub =>
                                    !submissionSearch ||
                                    (sub.profiles?.full_name || '').toLowerCase().includes(submissionSearch.toLowerCase())
                                ).length === 0 ? (
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-12 text-center">
                                        <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <h4 className="text-slate-850 dark:text-white font-bold">No submissions found</h4>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            No student progress entries exist matching the filter.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full border-collapse text-left text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-805 text-slate-500 font-bold uppercase text-[9px]">
                                                    <th className="p-4">Student</th>
                                                    <th className="p-4">Milestone</th>
                                                    <th className="p-4">Solution Link</th>
                                                    <th className="p-4">Status</th>
                                                    <th className="p-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                                {allSubmissions
                                                    .filter(sub =>
                                                        !submissionSearch ||
                                                        (sub.profiles?.full_name || '').toLowerCase().includes(submissionSearch.toLowerCase())
                                                    )
                                                    .map(sub => (
                                                        <tr key={sub.id} className="hover:bg-slate-50/[0.4] dark:hover:bg-slate-900/[0.2]">
                                                            <td className="p-4">
                                                                <span className="font-bold block">{sub.profiles?.full_name}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">{sub.profiles?.email}</span>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="font-bold block text-slate-700 dark:text-slate-300">Milestone {sub.internship_tasks?.task_number}</span>
                                                                <span className="text-[10px] text-slate-400 block truncate max-w-xs">{sub.internship_tasks?.title}</span>
                                                            </td>
                                                            <td className="p-4 font-mono text-[10px]">
                                                                {sub.github_url || sub.linkedin_url ? (
                                                                    <a
                                                                        href={sub.github_url || sub.linkedin_url || '#'}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-brand-primary dark:text-brand-accent underline hover:opacity-90 block truncate max-w-xs"
                                                                    >
                                                                        {sub.github_url || sub.linkedin_url}
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-slate-400">N/A</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${sub.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20' :
                                                                    sub.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                                                        sub.status === 'resubmission_required' ? 'bg-rose-100 text-rose-700' :
                                                                            sub.status === 'available' ? 'bg-sky-100 text-sky-700' :
                                                                                'bg-slate-100 text-slate-450 dark:bg-slate-900'
                                                                    }`}>
                                                                    {sub.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                {(sub.status === 'submitted' || sub.status === 'approved' || sub.status === 'resubmission_required') && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setAdminFeedback(sub.admin_feedback || '');
                                                                            setSelectedSubForReview(sub);
                                                                        }}
                                                                        className="px-2.5 py-1 bg-brand-primary text-white text-[10px] font-bold rounded-lg transition"
                                                                    >
                                                                        {sub.status === 'submitted' ? 'Grade' : 'Review'}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {activeTab === 'certificates' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">

                            {/* Issuing Form */}
                            <div className="lg:col-span-1 bg-white dark:bg-brand-cardDark border border-slate-202 dark:border-slate-805 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Issue New Certificate</h3>
                                <form onSubmit={handleIssueCertificate} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Student</label>
                                        <select
                                            required
                                            value={certStudentId}
                                            onChange={(e) => setCertStudentId(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                        >
                                            <option value="">-- Choose Intern --</option>
                                            {enrollments.map(e => (
                                                <option key={e.id} value={e.user_id}>
                                                    {e.profiles?.full_name} ({e.internships?.title})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Course/Domain Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={certCourseName}
                                            onChange={(e) => setCertCourseName(e.target.value)}
                                            placeholder="e.g. Full-Stack Web Development"
                                            className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={issuingCert}
                                        className="w-full py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl shadow transition"
                                    >
                                        {issuingCert ? 'Issuing...' : 'Issue Certificate'}
                                    </button>
                                </form>
                            </div>

                            {/* Registry Directory logs list */}
                            <div className="lg:col-span-2 bg-white dark:bg-brand-cardDark border border-slate-202 dark:border-slate-805 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Verification Registry logs</h3>

                                {certificates.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-10">No certificates issued yet.</p>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-[400px] overflow-y-auto pr-2">
                                        {certificates.map(cert => (
                                            <div key={cert.id} className="py-3 flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="font-bold block capitalize">{cert.profiles?.full_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{cert.certificate_number}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-slate-700 dark:text-slate-205">{cert.course_name}</span>
                                                    <span className="text-[10px] text-slate-400 block">{new Date(cert.issue_date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {activeTab === 'domains' && (
                        <div className="space-y-6 text-left">
                            {/* Toggle Subtabs */}
                            <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                                <button
                                    onClick={() => setSubTab('domains')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer ${subTab === 'domains'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                >
                                    Manage Domain Pathways ({domainsList.length})
                                </button>
                                <button
                                    onClick={() => setSubTab('internships')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer ${subTab === 'internships'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                >
                                    Manage Internship Tracks ({internships.length})
                                </button>
                            </div>

                            {subTab === 'domains' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Domain CRUD Form */}
                                    <div className="lg:col-span-1 bg-white dark:bg-brand-cardDark border border-slate-202 dark:border-slate-805 rounded-2xl p-6 shadow-sm space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                                            {editingDomainId ? 'Edit Domain Pathway' : 'Create New Pathway'}
                                        </h3>
                                        <form onSubmit={handleSaveDomain} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Domain Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={domainName}
                                                    onChange={(e) => setDomainName(e.target.value)}
                                                    placeholder="e.g. Artificial Intelligence"
                                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Custom Slug (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={domainSlug}
                                                    onChange={(e) => setDomainSlug(e.target.value)}
                                                    placeholder="e.g. artificial-intelligence"
                                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Icon Identifier</label>
                                                <select
                                                    value={domainIcon}
                                                    onChange={(e) => setDomainIcon(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                >
                                                    <option value="Code">Code (Software)</option>
                                                    <option value="Layers">Layers (Full-Stack)</option>
                                                    <option value="Smartphone">Smartphone (Mobile)</option>
                                                    <option value="Database">Database (Data Sci)</option>
                                                    <option value="Shield">Shield (Cybersecurity)</option>
                                                    <option value="Globe">Globe (Cloud/DevOps)</option>
                                                    <option value="Cpu">Cpu (IoT/Embedded)</option>
                                                    <option value="Server">Server (Backend)</option>
                                                    <option value="Brain">Brain (AI/ML)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Decorative Banner Image URL (Optional)</label>
                                                <input
                                                    type="url"
                                                    value={domainImage}
                                                    onChange={(e) => setDomainImage(e.target.value)}
                                                    placeholder="https://images.unsplash.com/..."
                                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Core Skills (Comma separated)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={domainSkills}
                                                    onChange={(e) => setDomainSkills(e.target.value)}
                                                    placeholder="Python, Tensorflow, PyTorch"
                                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Brief Description</label>
                                                <textarea
                                                    required
                                                    value={domainDesc}
                                                    onChange={(e) => setDomainDesc(e.target.value)}
                                                    placeholder="Write curriculum description..."
                                                    className="w-full px-3 py-2 border border-slate-205 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none h-20"
                                                />
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="domainIsActive"
                                                    checked={domainIsActive}
                                                    onChange={(e) => setDomainIsActive(e.target.checked)}
                                                    className="rounded border-slate-350 outline-none"
                                                />
                                                <label htmlFor="domainIsActive" className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer">
                                                    Visible to Students (Active)
                                                </label>
                                            </div>

                                            <div className="pt-2 flex justify-end space-x-2">
                                                {editingDomainId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingDomainId(null);
                                                            setDomainName('');
                                                            setDomainSlug('');
                                                            setDomainIcon('Code');
                                                            setDomainImage('');
                                                            setDomainSkills('');
                                                            setDomainIsActive(true);
                                                            setDomainDesc('');
                                                        }}
                                                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    disabled={savingDomain}
                                                    className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow transition duration-200 hover:bg-blue-500 cursor-pointer"
                                                >
                                                    {savingDomain ? 'Saving...' : editingDomainId ? 'Save Changes' : 'Create Pathways'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Active Domains Table List */}
                                    <div className="lg:col-span-2 bg-white dark:bg-brand-cardDark border border-slate-202 dark:border-slate-805 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Pathway Domain Inventory</h3>
                                        <div className="overflow-x-auto max-h-[600px]">
                                            <table className="w-full text-xs text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-805 text-slate-500 font-bold uppercase text-[9px]">
                                                        <th className="p-3">Track Info</th>
                                                        <th className="p-3">Skills Included</th>
                                                        <th className="p-3">Visibility</th>
                                                        <th className="p-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                                    {domainsList.map(dom => (
                                                        <tr key={dom.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10">
                                                            <td className="p-3">
                                                                <span className="font-extrabold text-slate-900 dark:text-white block capitalize">{dom.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">/{dom.slug} • Icon: {dom.icon}</span>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {dom.skills?.map((s, idx) => (
                                                                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-350">
                                                                            {s}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${dom.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20' : 'bg-slate-100 text-slate-500'
                                                                    }`}>
                                                                    {dom.is_active ? 'Active' : 'Hidden'}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-right space-x-2">
                                                                <button
                                                                    onClick={() => handleToggleDomainActive(dom)}
                                                                    className="text-slate-400 hover:text-blue-600 transition p-1"
                                                                    title="Toggle Visibility"
                                                                >
                                                                    <Activity className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingDomainId(dom.id);
                                                                        setDomainName(dom.name);
                                                                        setDomainSlug(dom.slug);
                                                                        setDomainIcon(dom.icon);
                                                                        setDomainImage(dom.image || '');
                                                                        setDomainSkills(dom.skills?.join(', ') || '');
                                                                        setDomainIsActive(dom.is_active);
                                                                        setDomainDesc(dom.description || '');
                                                                    }}
                                                                    className="text-slate-400 hover:text-yellow-600 transition p-1"
                                                                    title="Edit details"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteDomain(dom.id)}
                                                                    className="text-slate-400 hover:text-red-600 transition p-1"
                                                                    title="Delete Pathway"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Create Internship Form */}
                                    <div className="lg:col-span-1 bg-white dark:bg-brand-cardDark border border-slate-202 dark:border-slate-805 rounded-2xl p-6 shadow-sm space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                                            Initialize Internship Track
                                        </h3>
                                        <form onSubmit={handleCreateInternship} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Internship Title</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={domainTitle}
                                                    onChange={(e) => setDomainTitle(e.target.value)}
                                                    placeholder="e.g. Next.js Frontend Intern"
                                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Parent Domain Pathway</label>
                                                <select
                                                    required
                                                    value={selectedDomainId}
                                                    onChange={(e) => setSelectedDomainId(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                >
                                                    <option value="">-- Choose Domain Pathway --</option>
                                                    {domainsList.map(dom => (
                                                        <option key={dom.id} value={dom.id}>{dom.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Duration</label>
                                                    <select
                                                        value={domainDuration}
                                                        onChange={(e) => setDomainDuration(e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                    >
                                                        <option value="4 Weeks">4 Weeks</option>
                                                        <option value="8 Weeks">8 Weeks</option>
                                                        <option value="3 Months">3 Months</option>
                                                        <option value="6 Months">6 Months</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Compensation</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={internshipStipend}
                                                        onChange={(e) => setInternshipStipend(e.target.value)}
                                                        placeholder="e.g. Unpaid / ₹5,000"
                                                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Difficulty Level</label>
                                                    <select
                                                        value={internshipDifficulty}
                                                        onChange={(e) => setInternshipDifficulty(e.target.value as any)}
                                                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                    >
                                                        <option value="Beginner">Beginner</option>
                                                        <option value="Intermediate">Intermediate</option>
                                                        <option value="Advanced">Advanced</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Work Mode</label>
                                                    <select
                                                        value={internshipMode}
                                                        onChange={(e) => setInternshipMode(e.target.value as any)}
                                                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none"
                                                    >
                                                        <option value="Remote">Remote</option>
                                                        <option value="Hybrid">Hybrid</option>
                                                        <option value="In-office">In-office</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Job Description</label>
                                                <textarea
                                                    required
                                                    value={domainDesc}
                                                    onChange={(e) => setDomainDesc(e.target.value)}
                                                    placeholder="Role responsibilities, technical tasks, milestones outcomes..."
                                                    className="w-full px-3 py-2 border border-slate-205 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs outline-none h-20"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={savingInternship}
                                                className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow transition duration-205 hover:bg-blue-500 cursor-pointer"
                                            >
                                                {savingInternship ? 'Creating Track...' : 'Initialize Internship Track'}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Active Internships Database List */}
                                    <div className="lg:col-span-2 bg-white dark:bg-brand-cardDark border border-slate-202 dark:border-slate-805 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Active Internship Inventory</h3>
                                        <div className="overflow-x-auto max-h-[600px]">
                                            <table className="w-full text-xs text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-805 text-slate-500 font-bold uppercase text-[9px]">
                                                        <th className="p-3">Role Info</th>
                                                        <th className="p-3">Domain Group</th>
                                                        <th className="p-3">Compensation</th>
                                                        <th className="p-3">Work Mode</th>
                                                        <th className="p-3 text-right">Delete</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                                    {internships.map(track => {
                                                        const domObj = domainsList.find(d => d.id === (track as any).domain_id);
                                                        return (
                                                            <tr key={track.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10">
                                                                <td className="p-3">
                                                                    <span className="font-extrabold text-slate-900 dark:text-white block capitalize">{track.title}</span>
                                                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{track.duration} • {(track as any).difficulty || 'Intermediate'}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="font-bold text-blue-650 dark:text-blue-450 block truncate max-w-[120px]">
                                                                        {domObj ? domObj.name : track.category}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 font-semibold">
                                                                    {(track as any).stipend || 'Unpaid'}
                                                                </td>
                                                                <td className="p-3 capitalize font-semibold">
                                                                    {(track as any).mode || 'Remote'}
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (!confirm('Are you sure you want to delete this internship track?')) return;
                                                                            try {
                                                                                const { error } = await supabase
                                                                                    .from('internships')
                                                                                    .delete()
                                                                                    .eq('id', track.id);
                                                                                if (error) throw error;
                                                                                alert('Internship track deleted successfully.');
                                                                                loadData();
                                                                            } catch (err: any) {
                                                                                alert(`Delete error: ${err.message}`);
                                                                            }
                                                                        }}
                                                                        className="text-slate-400 hover:text-red-650 transition p-1"
                                                                        title="Delete role track"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                </main>
            </div>

            {/* Grade Submission Dialog Modal */}
            {selectedSubForReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none">
                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
                        <h3 className="text-lg font-bold">Grade Student Submission</h3>
                        <p className="text-xs text-brand-primary dark:text-brand-accent mt-1 uppercase font-bold tracking-wide">
                            {selectedSubForReview.profiles?.full_name} • Milestone {selectedSubForReview.internship_tasks?.task_number}
                        </p>

                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2 text-xs">
                            <div>
                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Solution Link</span>
                                <a
                                    href={selectedSubForReview.github_url || selectedSubForReview.linkedin_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-primary dark:text-brand-accent underline font-mono break-all"
                                >
                                    {selectedSubForReview.github_url || selectedSubForReview.linkedin_url}
                                </a>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-850 pt-2">
                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Student notes</span>
                                <p className="text-slate-650 dark:text-slate-350">{selectedSubForReview.student_note || 'No notes.'}</p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mentor Feedback Comments</label>
                                <textarea
                                    required
                                    value={adminFeedback}
                                    onChange={(e) => setAdminFeedback(e.target.value)}
                                    placeholder="Explain requirements missed or design suggestions. Good comments are highly interactive..."
                                    className="w-full px-3 py-2 border border-slate-205 bg-slate-50 dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs outline-none h-20"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                                <button
                                    type="button"
                                    onClick={() => handleGradeSubmission('resubmission_required')}
                                    disabled={reviewLoading}
                                    className="flex-1 py-2.5 border border-rose-300 hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/20 text-xs font-bold rounded-xl transition"
                                >
                                    Request Resubmission
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleGradeSubmission('approved')}
                                    disabled={reviewLoading}
                                    className="flex-grow py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl transition shadow"
                                >
                                    Approve milestone
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedSubForReview(null)}
                                className="w-full py-1 text-center text-[10px] text-slate-400 font-bold tracking-wider uppercase hover:underline"
                            >
                                Close Dialog
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Details Dialog Modal */}
            {selectedEnrollForDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none">
                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-left">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-850">
                            <h3 className="text-base font-bold flex items-center space-x-2">
                                <User className="w-5 h-5 text-brand-primary" />
                                <span>Student Application Profile</span>
                            </h3>
                            <button
                                onClick={() => setSelectedEnrollForDetails(null)}
                                className="text-slate-400 hover:text-slate-650 transition p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Full Name</span>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                        {selectedEnrollForDetails.profiles?.full_name || 'N/A'}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-855 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Email Address</span>
                                    <p className="text-sm font-semibold text-slate-855 dark:text-slate-100 mt-0.5 font-mono">
                                        {selectedEnrollForDetails.profiles?.email || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl">
                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">College / University Name</span>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                    {selectedEnrollForDetails.profiles?.college || 'N/A'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Year of Study</span>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                        {selectedEnrollForDetails.profiles?.year_of_study || 'N/A'}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-855 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Course / Branch</span>
                                    <p className="text-sm font-semibold text-slate-855 dark:text-slate-100 mt-0.5">
                                        {selectedEnrollForDetails.profiles?.course_branch || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">State / UT</span>
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                        {selectedEnrollForDetails.profiles?.state || 'N/A'}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">District</span>
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                        {selectedEnrollForDetails.profiles?.district || 'N/A'}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">City / Town</span>
                                    <p className="text-xs font-semibold text-slate-850 dark:text-slate-100 mt-0.5">
                                        {selectedEnrollForDetails.profiles?.city || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-850 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedEnrollForDetails(null)}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer justify-center flex items-center"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminPortal;
