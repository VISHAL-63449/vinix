import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast, ToastContainer } from '../components/Toast';
import {
    LayoutDashboard, CheckSquare, Search, ShieldCheck, User, FolderOpen,
    Award, FileText, Briefcase, CalendarDays, Settings, CreditCard, ArrowRight, FileSpreadsheet, Plus, Trash2, Edit3, X, Megaphone, Mail,
    Sparkles, PlusCircle, Bell, Moon, ChevronDown, ListTodo, Users, ExternalLink,
    BookOpen, Layers, Check, Activity, GraduationCap, RefreshCw, Clock, History,
    Menu, Sun, Rocket, LogOut, Tag, IndianRupee, Percent
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
    progress?: number;
    certificate_status?: string;
    completion_status?: string;
    application_status?: string;
    profiles?: {
        full_name: string;
        email: string;
        college: string;
        year_of_study?: string;
        course_branch?: string;
        state?: string;
        district?: string;
        city?: string;
        updated_at?: string;
    };
    internships?: {
        title: string;
        duration?: string;
        category?: string;
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

interface PaymentRecord {
    payment_id: string;
    student_id: string;
    application_id?: string;
    amount: number;
    payment_status: string;
    transaction_id: string;
    payment_date: string;
    profiles?: {
        full_name: string;
    };
    domain_name?: string;
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

const formatLastActive = (updatedAtStr?: string) => {
    if (!updatedAtStr) return '—';
    const date = new Date(updatedAtStr);
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '');
};

const AdminPortal: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const { toasts, showToast, dismiss } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'submissions' | 'certificates' | 'domains' | 'students' | 'student-detail' | 'payments' | 'coupons' | 'promotions'>('overview');
    const [subTab, setSubTab] = useState<'domains' | 'internships'>('domains');
    const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Enrollment | null>(null);
    const [studentsSearch, setStudentsSearch] = useState('');
    const [adminName, setAdminName] = useState<string>('Vishal R');
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark') ||
            localStorage.getItem('darkMode') === 'true';
    });

    const toggleDarkMode = () => {
        const nextDark = !darkMode;
        setDarkMode(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    };

    const handleLogout = async () => {
        try {
            setMobileDrawerOpen(false);
            setProfileDropdownOpen(false);
            showToast('Signing out...', 'info');
            if (signOut) {
                await signOut().catch(err => console.error('Sign out error:', err));
            }
            try {
                localStorage.removeItem('supabase.auth.token');
                localStorage.removeItem('sb-ioppccrnbuqgcynmjpaa-auth-token');
                sessionStorage.clear();
            } catch (e) {
                console.error(e);
            }
            showToast('Logged out successfully', 'success');
            navigate('/login', { replace: true });
        } catch (err: any) {
            console.error('Logout error:', err);
            window.location.href = (window.location.origin + import.meta.env.BASE_URL + 'login').replace('//login', '/login');
        }
    };

    // Database Data States
    const [domainsList, setDomainsList] = useState<Domain[]>([]);
    const [internships, setInternships] = useState<Internship[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [submissions, setSubmissions] = useState<TaskProgress[]>([]);
    const [allSubmissions, setAllSubmissions] = useState<TaskProgress[]>([]);
    const [gradingSubTab, setGradingSubTab] = useState<'all' | 'pending' | 'resubmissions' | 'reviewed'>('all');
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
    const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Submissions and Payments search & filters
    const [submissionSearch, setSubmissionSearch] = useState('');
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'All' | 'Pending' | 'Verified' | 'Rejected'>('All');

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
    const [approvingCertId, setApprovingCertId] = useState<string | null>(null);

    const handleApproveCertificate = async (enrollmentId: string) => {
        setApprovingCertId(enrollmentId);
        try {
            // Find enrollment details
            const { data: enroll, error: fetchErr } = await supabaseAdmin
                .from('internship_enrollments')
                .select('user_id, internship_id, internships(title)')
                .eq('id', enrollmentId)
                .single();

            if (fetchErr || !enroll) throw new Error(fetchErr?.message || 'Enrollment not found');

            const certNo = `VINIX-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            const courseName = (enroll.internships as any)?.title || 'Virtual Internship';

            // Insert certificate
            const { error: certError } = await supabaseAdmin
                .from('certificates')
                .insert({
                    user_id: enroll.user_id,
                    certificate_number: certNo,
                    course_name: courseName,
                    status: 'issued',
                    issue_date: new Date().toISOString()
                });

            if (certError) throw certError;

            // Removed overwriting of application_status so it retains PAYMENT_VERIFIED:{utr}

            showToast('Certificate successfully approved and issued!', 'success');
            loadData();
        } catch (err: any) {
            showToast(`Approval Error: ${err.message}`, 'error');
        } finally {
            setApprovingCertId(null);
        }
    };

    async function loadData() {
        try {
            // Fetch admin profile
            if (profile?.role === 'admin' && profile?.full_name) {
                setAdminName(profile.full_name);
            } else {
                const { data: adminUser } = await supabaseAdmin
                    .from('profiles')
                    .select('full_name')
                    .eq('role', 'admin')
                    .maybeSingle();
                if (adminUser?.full_name) {
                    setAdminName(adminUser.full_name);
                } else {
                    setAdminName('Vishal R');
                }
            }

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
                .select('*, internships:internship_id(title, duration, category)')
                .order('joined_at', { ascending: false });

            // Fetch submissions (any task where student submitted, or status is submitted/approved/resubmission_required)
            const { data: subs } = await supabaseAdmin
                .from('task_progress')
                .select('*, internship_tasks:task_id(task_number, title, description)')
                .or('submitted_at.not.is.null,github_url.not.is.null,linkedin_url.not.is.null,status.eq.submitted,status.eq.approved,status.eq.resubmission_required')
                .order('submitted_at', { ascending: false, nullsFirst: false });

            // Fetch certificates (joining profiles in JS instead of PostgREST)
            const { data: certs } = await supabaseAdmin
                .from('certificates')
                .select('*');

            // Fetch offer letters
            const { data: offers } = await supabaseAdmin
                .from('offer_letters')
                .select('*');

            // Emulate payments by fetching enrollments that have a payment pending/verified encoded in application_status
            const { data: allEnrollsForPayments } = await supabaseAdmin
                .from('internship_enrollments')
                .select('*')
                .or('application_status.ilike.PAYMENT_%,application_status.ilike.ISSUED:%')
                .order('updated_at', { ascending: false });

            // Shape them into PaymentRecord
            const paymentsData = (allEnrollsForPayments || []).map(p => {
                const appStatus = p.application_status || '';
                const parts = appStatus.split(':');
                const pState = parts[0];
                const utr = parts.slice(1).join(':') || 'MANUAL_UPI';
                return {
                    payment_id: `PAY_ENROLL_${p.id}`,
                    student_id: p.user_id,
                    application_id: undefined,
                    amount: 100,
                    payment_status: pState === 'PAYMENT_PENDING' ? 'PENDING' :
                        pState === 'PAYMENT_VERIFIED' || pState === 'ISSUED' ? 'SUCCESS' : 'REJECTED',
                    payment_date: p.updated_at || p.created_at,
                    transaction_id: utr,
                    payment_gateway: 'MANUAL_UPI'
                }
            });

            // Collect all unique user IDs from enrolls, subs, certs, and payments
            const enrolledUserIds = (enrolls || []).map(e => e.user_id);
            const subUserIds = (subs || []).map(s => s.user_id || s.student_id);
            const certUserIds = (certs || []).map(c => c.user_id);
            const paymentUserIds = (paymentsData || []).map(p => p.student_id);
            const allUserIds = Array.from(new Set([...enrolledUserIds, ...subUserIds, ...certUserIds, ...paymentUserIds].filter(Boolean)));

            // Fetch profiles in bulk
            let profilesMap: Record<string, { full_name: string; email: string; college?: string; updated_at?: string }> = {};
            if (allUserIds.length > 0) {
                const { data: profiles } = await supabaseAdmin
                    .from('profiles')
                    .select('id, full_name, email, college, updated_at')
                    .in('id', allUserIds);

                if (profiles) {
                    profiles.forEach(p => {
                        profilesMap[p.id] = {
                            full_name: p.full_name || 'Alumnus',
                            email: p.email || '',
                            college: p.college || '',
                            updated_at: p.updated_at
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
                        city: appDetail?.city || '',
                        updated_at: profileDetail?.updated_at || e.updated_at
                    }
                };
            });

            const finalSubs = (subs || []).map(s => {
                const studentId = s.user_id || s.student_id;
                const appDetail = appsMap[`${studentId}_${s.internship_id}`];
                const profileDetail = profilesMap[studentId] || (s.user_id ? profilesMap[s.user_id] : undefined) || (s.student_id ? profilesMap[s.student_id] : undefined);
                return {
                    ...s,
                    user_id: studentId,
                    student_id: studentId,
                    profiles: {
                        full_name: appDetail?.student_name || profileDetail?.full_name || 'Student',
                        email: appDetail?.email || profileDetail?.email || ''
                    }
                };
            }).sort((a, b) => {
                if (a.status === 'submitted' && b.status !== 'submitted') return -1;
                if (b.status === 'submitted' && a.status !== 'submitted') return 1;
                const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
                const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
                return dateB - dateA;
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

            const finalPayments = (paymentsData || []).map(p => {
                const profileDetail = profilesMap[p.student_id];
                const activeEnrollment = (enrolls || []).find(e => e.user_id === p.student_id);
                return {
                    ...p,
                    profiles: {
                        full_name: profileDetail?.full_name || 'Alumnus'
                    },
                    domain_name: activeEnrollment?.internships?.title || 'Unknown Domain'
                };
            });

            setDomainsList(doms || []);
            setInternships(inters || []);
            setEnrollments(finalEnrolls);
            setSubmissions(finalSubs.filter(s => s.status === 'submitted'));
            setAllSubmissions(finalSubs);
            setCertificates(finalCerts);
            setOfferLetters(offers || []);
            setPaymentsList(finalPayments);

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

        const profileChan = supabase
            .channel('public:profiles_admin')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
                loadData();
            })
            .subscribe();

        return () => {
            enrollChan.unsubscribe();
            subChan.unsubscribe();
            domChan.unsubscribe();
            profileChan.unsubscribe();
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
                duration: enroll.internships?.duration || '3 Months',
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

            showToast('Internship application approved. Offer credentials generated successfully!', 'success');
            loadData();
        } catch (err: any) {
            showToast(`Approval error: ${err.message}`, 'error');
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

            showToast('Application status marked as rejected.', 'warning');
            loadData();
        } catch (err: any) {
            showToast(`Reject error: ${err.message}`, 'error');
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

                // Update internship_enrollments with new Payment Flow statuses
                await supabaseAdmin
                    .from('internship_enrollments')
                    .update({
                        progress: calProgress,
                        status: calProgress === 100 ? 'completed' : 'active',
                        completed_at: calProgress === 100 ? new Date().toISOString() : null
                    })
                    .eq('user_id', selectedSubForReview.user_id)
                    .eq('internship_id', selectedSubForReview.internship_id);

                // For backward compatibility also update enrollments table
                await supabaseAdmin
                    .from('enrollments')
                    .update({
                        progress: calProgress,
                        status: calProgress === 100 ? 'completed' : 'active',
                        completed_at: calProgress === 100 ? new Date().toISOString() : null
                    })
                    .eq('user_id', selectedSubForReview.user_id)
                    .eq('internship_id', selectedSubForReview.internship_id);
            }

            showToast(`Milestone marked as ${status}.`, 'success');
            setSelectedSubForReview(null);
            setAdminFeedback('');
            loadData();
        } catch (err: any) {
            showToast(`Failed to grade task: ${err.message}`, 'error');
        } finally {
            setReviewLoading(false);
        }
    };

    const handlePaymentAction = async (payment: PaymentRecord, act: 'verify' | 'reject') => {
        try {
            if (!payment.payment_id.startsWith('PAY_ENROLL_')) return;
            const enrollId = payment.payment_id.replace('PAY_ENROLL_', '');

            // extract the existing UTR from transaction_id or application_status
            const utr = payment.transaction_id || 'UNKNOWN';
            const newStatus = act === 'verify' ? `PAYMENT_VERIFIED:${utr}` : 'PAYMENT_REJECTED';

            const { error } = await supabaseAdmin
                .from('internship_enrollments')
                .update({ application_status: newStatus })
                .eq('id', enrollId);

            if (error) throw error;

            if (act === 'verify') {
                showToast('Payment Verified! Auto-Issuing Certificate...', 'success');
                // Trigger auto issuance
                await handleApproveCertificate(enrollId);
            } else {
                showToast('Payment Rejected!', 'success');
                loadData();
            }
        } catch (err: any) {
            showToast(`Failed to update payment: ${err.message}`, 'error');
        }
    };

    // Domain Save handler (Create / Update CRUD)
    const handleSaveDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domainName.trim()) {
            showToast('Domain Name is required.', 'warning');
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
                showToast('Domain category updated successfully!', 'success');
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
                showToast('Domain category created successfully!', 'success');
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
            showToast(`Domain operation failed: ${err.message}`, 'error');
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
            showToast(`Failed to toggle state: ${err.message}`, 'error');
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
            showToast('Domain deleted successfully', 'success');
            loadData();
        } catch (err: any) {
            showToast(`Failed to delete: ${err.message}`, 'error');
        }
    };

    // Create Internship Track Linked to Selected Domain Category
    const handleCreateInternship = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domainTitle.trim() || !selectedDomainId) {
            showToast('Please specify a Title and choose a Domain category', 'warning');
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

            showToast('Virtual internship track initialized with 6 milestones!', 'success');
            setDomainTitle('');
            setSelectedDomainId('');
            setDomainDesc('');
            loadData();
        } catch (err: any) {
            showToast(`Failed to save internship: ${err.message}`, 'error');
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

            // Trigger server-side PDF generation & email delivery
            fetch('/api/generate-certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: certStudentId,
                    courseName: certCourseName,
                    certificateNumber: certNo
                })
            }).catch(err => console.error('Failed to trigger server-side certificate generation:', err));

            showToast(`Certificate issued: ${certNo}`, 'success');
            setCertStudentId('');
            setCertCourseName('');
            loadData();
        } catch (err: any) {
            showToast(`Failed to issue certificate: ${err.message}`, 'error');
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
    const uniqueStudentsCount = enrollments.length > 0
        ? (new Set(enrollments.map(e => e.user_id)).size || enrollments.length)
        : 0;

    // Platform Administrator identity: Always ensure Founder & CEO Vishal R
    const isRealAdmin = profile?.role === 'admin';
    const adminFullName = isRealAdmin && profile?.full_name ? profile.full_name : 'Vishal R';
    const adminFirstName = 'Vishal';
    const adminInitial = 'V';

    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, action: () => setActiveTab('overview') },
        { id: 'applications', label: 'Internship Applications', icon: Users, action: () => setActiveTab('applications') },
        { id: 'submissions', label: 'Task Submissions', icon: CheckSquare, action: () => setActiveTab('submissions') },
        { id: 'project-submissions', label: 'Project Submissions', icon: FileSpreadsheet, action: () => { setActiveTab('submissions'); showToast('Showing project submissions', 'info'); } },
        { id: 'verification-queue', label: 'Verification Queue', icon: ShieldCheck, action: () => { setActiveTab('applications'); showToast('Showing verification queue', 'info'); } },
        { id: 'students', label: 'Students', icon: GraduationCap, action: () => setActiveTab('students') },
        { id: 'courses', label: 'Courses', icon: BookOpen, action: () => { setActiveTab('domains'); setSubTab('domains'); } },
        { id: 'certificates', label: 'Certificates', icon: Award, action: () => setActiveTab('certificates') },
        { id: 'payments', label: 'Payment Verification', icon: ShieldCheck, action: () => setActiveTab('payments') },
        { id: 'coupons', label: 'Coupons & Discounts', icon: Tag, action: () => setActiveTab('coupons') },
        { id: 'fees', label: 'Fee Management', icon: IndianRupee, action: () => setActiveTab('payments') },
        { id: 'domains', label: 'Internship Domains', icon: Layers, action: () => setActiveTab('domains') },
        { id: 'manage-tasks', label: 'Manage Tasks', icon: ListTodo, action: () => { setActiveTab('domains'); setSubTab('internships'); } },
    ];

    return (
        <div className="h-screen overflow-hidden bg-[#F9FAFB] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-all duration-300">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Mobile Drawer Backdrop (Image 1) */}
            {mobileDrawerOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity md:hidden"
                    onClick={() => setMobileDrawerOpen(false)}
                />
            )}

            {/* Mobile Off-canvas Drawer Navigation (Image 1) */}
            <aside
                className={`fixed top-0 bottom-0 left-0 z-50 w-[280px] max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-5 px-4 shadow-2xl transition-transform duration-300 ease-in-out md:hidden overflow-y-auto ${
                    mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="space-y-6">
                    {/* Drawer Brand Header */}
                    <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0F286E] to-[#154ED0] text-white flex items-center justify-center shadow-md">
                                <Rocket className="w-5 h-5 text-blue-200 rotate-45" />
                            </div>
                            <div>
                                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                                    Vinix<span className="text-[#154ED0]">Admin</span>
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileDrawerOpen(false)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Drawer Navigation List */}
                    <div className="space-y-1 text-left">
                        <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">MAIN</p>
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const isSelected = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        item.action();
                                        setMobileDrawerOpen(false);
                                    }}
                                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                                        isSelected
                                            ? 'bg-[#154ED0] text-white shadow-md shadow-blue-500/25'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </button>
                            );
                        })}

                        <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 mt-6">MARKETING</p>
                        <button
                            onClick={() => {
                                setActiveTab('promotions');
                                setMobileDrawerOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                                activeTab === 'promotions'
                                    ? 'bg-[#154ED0] text-white shadow-md shadow-blue-500/25'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <Percent className="w-4 h-4 flex-shrink-0" />
                            <span>Promotions</span>
                        </button>
                    </div>
                </div>

                {/* Logout Action (Image 1) */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Desktop Sidebar Navigation */}
            <aside className="w-full md:w-[260px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 flex-shrink-0 select-none overflow-y-auto hidden md:flex">
                <div className="space-y-6">
                    <div className="flex items-center space-x-3 px-2 pb-2">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0F286E] to-[#154ED0] text-white flex items-center justify-center shadow-md">
                            <Rocket className="w-5 h-5 text-blue-200 rotate-45" />
                        </div>
                        <div>
                            <span className="font-extrabold text-base tracking-tight block text-slate-900 dark:text-white">
                                Vinix<span className="text-[#154ED0]">Admin</span>
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1 text-left">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">MAIN</p>
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const isSelected = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={item.action}
                                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                                        isSelected
                                            ? 'bg-[#154ED0] text-white shadow-md'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </button>
                            );
                        })}

                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-6">MARKETING</p>
                        <button
                            onClick={() => setActiveTab('promotions')}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                                activeTab === 'promotions'
                                    ? 'bg-[#154ED0] text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Percent className="w-4 h-4 flex-shrink-0" />
                            <span>Promotions</span>
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content display */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F9FAFB] dark:bg-slate-950">

                {/* Top bar header (Image 2) */}
                {/* Top bar header (Exact sample: media_1790264847589.png) */}
                <header
                    style={{ height: '76px', minHeight: '76px', maxHeight: '76px' }}
                    className="bg-white dark:bg-slate-900 border-none px-6 sm:px-8 flex items-center justify-between select-none sticky top-0 z-30"
                >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Mobile Hamburger Menu Button: 44px x 44px rounded-2xl box */}
                        <button
                            type="button"
                            onClick={() => setMobileDrawerOpen(true)}
                            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px', maxWidth: '44px', maxHeight: '44px' }}
                            className="md:hidden rounded-[14px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 flex-shrink-0"
                            aria-label="Open navigation menu"
                        >
                            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" strokeWidth={2.2} />
                        </button>

                        {/* Desktop Search Bar */}
                        <div className="relative max-w-md w-full hidden md:block">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search students, applications, ⌘K"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            />
                        </div>

                        {/* Desktop Live Sync Active Badge */}
                        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800/40">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">DB Live Sync Active</span>
                        </div>
                    </div>

                    {/* Right Controls: Exactly matching sample (44px circular buttons, 42px avatar + chevron) */}
                    <div className="flex items-center space-x-3 sm:space-x-3.5 flex-shrink-0">
                        {/* Theme Toggle Button: 44px circle */}
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px', maxWidth: '44px', maxHeight: '44px' }}
                            className="rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 flex-shrink-0"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? <Sun className="w-5 h-5 text-amber-400" strokeWidth={2} /> : <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" strokeWidth={2} />}
                        </button>

                        {/* Notification Bell Button: 44px circle, clean without dot */}
                        <button
                            type="button"
                            onClick={() => showToast('All notifications are up to date', 'info')}
                            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px', maxWidth: '44px', maxHeight: '44px' }}
                            className="rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 flex-shrink-0"
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" strokeWidth={2} />
                        </button>

                        {/* User Profile Avatar (V) with dropdown chevron & Profile Dropdown */}
                        <div className="relative flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setProfileDropdownOpen(prev => !prev)}
                                className="flex items-center cursor-pointer group flex-shrink-0 focus:outline-none"
                                aria-expanded={profileDropdownOpen}
                                aria-haspopup="true"
                                aria-label="Admin Profile Menu"
                            >
                                <div
                                    style={{ width: '42px', height: '42px', minWidth: '42px', minHeight: '42px', maxWidth: '42px', maxHeight: '42px' }}
                                    className="rounded-full bg-[#1A62F8] text-white font-black text-base flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0"
                                >
                                    {adminInitial}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ml-2 flex-shrink-0 ${profileDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.2} />
                                <div className="hidden lg:block text-left text-xs leading-none pl-2">
                                    <span className="font-bold text-slate-900 dark:text-white block capitalize">{adminFullName}</span>
                                    <span className="font-medium text-slate-400 text-[10px]">Founder & CEO</span>
                                </div>
                            </button>

                            {/* Admin Profile Dropdown Menu */}
                            {profileDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setProfileDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-50 text-left animate-fade-in-up">
                                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white capitalize">{adminFullName}</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">Founder & CEO • Vishal R</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setActiveTab('overview'); setProfileDropdownOpen(false); }}
                                            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                        >
                                            <LayoutDashboard className="w-4 h-4 text-slate-400" />
                                            <span>Dashboard</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setActiveTab('students'); setProfileDropdownOpen(false); }}
                                            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                        >
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span>Manage Students</span>
                                        </button>
                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-grow px-5 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-7 overflow-y-auto overflow-x-hidden w-full max-w-full">

                    {activeTab === 'overview' && (
                        <div className="space-y-5 sm:space-y-6 animate-fade-in-up w-full max-w-7xl mx-auto">

                            {/* Welcome Banner (Matching sample: clean single title) */}
                            <div className="flex items-center justify-between text-left w-full">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <span>Welcome back, {adminFirstName}!</span>
                                    <span role="img" aria-label="wave">👋</span>
                                </h1>
                                <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-2 shadow-sm text-xs text-slate-600 dark:text-slate-300 font-medium">
                                    <CalendarDays className="w-4 h-4 mr-2 opacity-70" />
                                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>

                            {/* Stats Cards (Exact sample: 112px height, 50px pastel icon box, rounded-[26px]) */}
                            <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 text-left w-full">
                                {/* Total Students */}
                                <div
                                    style={{ height: '112px', minHeight: '112px', maxHeight: '112px' }}
                                    className="bg-white dark:bg-slate-900 px-6 py-5 rounded-[26px] border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between transition hover:shadow-md w-full"
                                >
                                    <div className="space-y-1">
                                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 block mb-1">Total Students</span>
                                        <h3 className="text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                            {uniqueStudentsCount}
                                        </h3>
                                    </div>
                                    <div
                                        style={{ width: '50px', height: '50px', minWidth: '50px', minHeight: '50px', maxWidth: '50px', maxHeight: '50px' }}
                                        className="rounded-2xl bg-[#F5EFFE] text-[#8C52FF] dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center flex-shrink-0 shadow-sm"
                                    >
                                        <Users className="w-6 h-6" strokeWidth={2} />
                                    </div>
                                </div>

                                {/* Applications */}
                                <div
                                    style={{ height: '112px', minHeight: '112px', maxHeight: '112px' }}
                                    className="bg-white dark:bg-slate-900 px-6 py-5 rounded-[26px] border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between transition hover:shadow-md w-full"
                                >
                                    <div className="space-y-1">
                                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 block mb-1">Applications</span>
                                        <h3 className="text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                            {enrollments.length}
                                        </h3>
                                    </div>
                                    <div
                                        style={{ width: '50px', height: '50px', minWidth: '50px', minHeight: '50px', maxWidth: '50px', maxHeight: '50px' }}
                                        className="rounded-2xl bg-[#EEF4FF] text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-sm"
                                    >
                                        <FileText className="w-6 h-6" strokeWidth={2} />
                                    </div>
                                </div>

                                {/* Active Internships */}
                                <div
                                    style={{ height: '112px', minHeight: '112px', maxHeight: '112px' }}
                                    className="bg-white dark:bg-slate-900 px-6 py-5 rounded-[26px] border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between transition hover:shadow-md w-full"
                                >
                                    <div className="space-y-1">
                                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 block mb-1">Active Internships</span>
                                        <h3 className="text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                            {totalEnrolls}
                                        </h3>
                                    </div>
                                    <div
                                        style={{ width: '50px', height: '50px', minWidth: '50px', minHeight: '50px', maxWidth: '50px', maxHeight: '50px' }}
                                        className="rounded-2xl bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm"
                                    >
                                        <Briefcase className="w-6 h-6" strokeWidth={2} />
                                    </div>
                                </div>

                                {/* Certificates Issued */}
                                <div
                                    style={{ height: '112px', minHeight: '112px', maxHeight: '112px' }}
                                    className="bg-white dark:bg-slate-900 px-6 py-5 rounded-[26px] border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between transition hover:shadow-md w-full"
                                >
                                    <div className="space-y-1">
                                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 block mb-1">Certificates Issued</span>
                                        <h3 className="text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                            {certificates.length}
                                        </h3>
                                    </div>
                                    <div
                                        style={{ width: '50px', height: '50px', minWidth: '50px', minHeight: '50px', maxWidth: '50px', maxHeight: '50px' }}
                                        className="rounded-2xl bg-[#FFF7ED] text-[#F97316] dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm"
                                    >
                                        <Award className="w-6 h-6" strokeWidth={2} />
                                    </div>
                                </div>
                            </div>

                            {/* "Upgrade Your Platform" Promotional Banner Card (Matching sample) */}
                            <div className="relative overflow-hidden rounded-[26px] bg-[#091124] text-white p-7 sm:p-9 shadow-xl border border-slate-800 text-center flex flex-col items-center justify-center w-full">
                                {/* Stylized background rocket watermark */}
                                <div className="absolute -bottom-8 -right-6 pointer-events-none opacity-10 select-none text-blue-400">
                                    <Rocket className="w-52 h-52 rotate-45" strokeWidth={1.2} />
                                </div>

                                {/* Pill Badge */}
                                <div className="inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600/30 text-blue-300 border border-blue-400/20 mb-3 shadow-sm">
                                    PREMIUM FEATURES
                                </div>

                                {/* Title */}
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
                                    Upgrade Your Platform
                                </h2>

                                {/* Subtitle */}
                                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto mb-6 leading-relaxed font-normal">
                                    Unlock premium features, advanced analytics & priority support.
                                </p>

                                {/* CTA Button */}
                                <button
                                    onClick={() => showToast('Priority platform upgrade requested!', 'success')}
                                    className="inline-flex items-center space-x-2 px-7 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
                                >
                                    <span>Upgrade Now</span>
                                    <span className="text-base leading-none">›</span>
                                </button>
                            </div>

                            {/* Middle section: Recent Submissions + Quick Actions */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                                {/* Recent Task Submissions Table */}
                                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Task Submissions</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">Live student task submissions and evaluations</p>
                                        </div>
                                        <button onClick={() => setActiveTab('submissions')} className="px-4 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-[#154ED0] dark:text-blue-400 text-xs font-bold rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/60 transition">View All</button>
                                    </div>
                                    <div className="overflow-x-auto flex-1">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="text-xs text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                                                    <th className="pb-3 font-medium">Student</th>
                                                    <th className="pb-3 font-medium">Task</th>
                                                    <th className="pb-3 font-medium">Domain</th>
                                                    <th className="pb-3 font-medium hidden sm:table-cell">Submitted On</th>
                                                    <th className="pb-3 font-medium text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                                {allSubmissions.slice(0, 6).map(sub => {
                                                    const subDate = sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
                                                    const initials = sub.profiles?.full_name?.charAt(0).toUpperCase() || 'S';
                                                    const domainCategory = enrollments.find(e => e.user_id === sub.user_id)?.internships?.category ||
                                                        enrollments.find(e => e.internship_id === sub.internship_id)?.internships?.category || 'Engineering';
                                                    return (
                                                        <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                                            <td className="py-2.5 pr-4">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-[#154ED0] dark:text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                                                        {initials}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <span className="font-semibold text-slate-900 dark:text-white block text-[13px] truncate">{sub.profiles?.full_name || 'Student'}</span>
                                                                        <span className="text-[10px] text-slate-400 truncate block">{sub.profiles?.email || 'Registered Candidate'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 pr-4">
                                                                <span
                                                                    onClick={() => { setSelectedSubForReview(sub); setAdminFeedback(sub.admin_feedback || ''); }}
                                                                    className="font-semibold text-[#154ED0] dark:text-blue-400 text-xs cursor-pointer hover:underline block"
                                                                >
                                                                    Task {sub.internship_tasks?.task_number || 1}: {sub.internship_tasks?.title || 'Milestone Task'}
                                                                </span>
                                                                {sub.github_url && (
                                                                    <a
                                                                        href={sub.github_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1 mt-0.5"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <span>Code link</span>
                                                                        <ExternalLink className="w-2.5 h-2.5" />
                                                                    </a>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 text-xs capitalize whitespace-nowrap">
                                                                {domainCategory}
                                                            </td>
                                                            <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap hidden sm:table-cell">
                                                                {subDate}
                                                            </td>
                                                            <td className="py-2.5 text-center">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${sub.status === 'approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                                                    sub.status === 'submitted' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                                                    }`}>
                                                                    {sub.status === 'approved' ? 'Approved' : sub.status === 'submitted' ? 'Pending' : 'Changes'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {allSubmissions.length === 0 && (
                                                    <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-sm">No recent submissions found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                                    <h3 className="font-bold text-sm text-slate-900 mb-6 flex items-center">
                                        <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
                                        Quick Actions
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 flex-1">
                                        <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <Megaphone className="w-5 h-5 text-[#154ED0] mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Add Announcement</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <Mail className="w-5 h-5 text-purple-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Send Email</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <Layers className="w-5 h-5 text-indigo-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Add Promo / Popup</span>
                                        </button>
                                        <button onClick={() => setActiveTab('domains')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <PlusCircle className="w-5 h-5 text-emerald-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Add New Domain</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <CreditCard className="w-5 h-5 text-pink-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Create Coupon</span>
                                        </button>
                                        <button onClick={() => setActiveTab('students')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <FolderOpen className="w-5 h-5 text-amber-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Export Students</span>
                                        </button>
                                    </div>
                                    <button className="mt-4 w-full py-2.5 bg-[#154ED0] text-white font-semibold text-xs rounded-xl shadow-sm flex justify-center items-center h-10">
                                        Explore All Features <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Section: Charts / Overviews */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 text-left pb-8">
                                {/* Admissions Overview Chart-like UI */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm col-span-1">
                                    <h3 className="font-bold text-base text-slate-900 mb-6">Application Status Overview</h3>
                                    <div className="flex flex-col items-center justify-center gap-6">
                                        <div className="relative w-32 h-32">
                                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                                <path
                                                    className="fill-none stroke-slate-100"
                                                    strokeWidth="3.8"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                {enrollments.length > 0 && (
                                                    <path
                                                        className="fill-none stroke-emerald-500"
                                                        strokeWidth="3.8"
                                                        strokeDasharray={`${((totalEnrolls) / enrollments.length) * 100}, 100`}
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                )}
                                                {enrollments.length > 0 && pendingApps.length > 0 && (
                                                    <path
                                                        className="fill-none stroke-amber-500"
                                                        strokeWidth="3.8"
                                                        strokeDasharray={`${(pendingApps.length / enrollments.length) * 100}, 100`}
                                                        strokeDashoffset={`-${((totalEnrolls) / enrollments.length) * 100}`}
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                )}
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                <span className="text-2xl font-extrabold text-slate-900 leading-none">{enrollments.length}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">TOTAL</span>
                                            </div>
                                        </div>
                                        <div className="w-full space-y-3">
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span>Pending Review</div>
                                                <div className="text-slate-900 font-bold">{pendingApps.length} <span className="text-slate-400 font-medium ml-1">({enrollments.length > 0 ? Math.round((pendingApps.length / enrollments.length) * 100) : 0}%)</span></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Shortlisted</div>
                                                <div className="text-slate-900 font-bold">{pendingSubCount} <span className="text-slate-400 font-medium ml-1">({enrollments.length > 0 ? Math.round((pendingSubCount / enrollments.length) * 100) : 0}%)</span></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Accepted</div>
                                                <div className="text-slate-900 font-bold">{totalEnrolls} <span className="text-slate-400 font-medium ml-1">({enrollments.length > 0 ? Math.round((totalEnrolls / enrollments.length) * 100) : 0}%)</span></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Rejected</div>
                                                <div className="text-slate-900 font-bold">0 <span className="text-slate-400 font-medium ml-1">(0%)</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Domains / Activity feed */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm col-span-1 xl:col-span-1">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-base text-slate-900">Top Domains</h3>
                                        <span className="text-[10px] font-bold text-slate-400 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-100">This Month</span>
                                    </div>
                                    <div className="space-y-5">
                                        {Object.entries(
                                            enrollments.reduce((acc, e) => {
                                                const title = e.internships?.category || e.internships?.title || 'Other';
                                                acc[title] = (acc[title] || 0) + 1;
                                                return acc;
                                            }, {} as Record<string, number>)
                                        )
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 5)
                                            .map(([domain, count], idx) => {
                                                const maxCount = Math.max(1, enrollments.length);
                                                const percentage = Math.min(100, Math.max(10, (count / maxCount) * 100));
                                                return (
                                                    <div key={idx}>
                                                        <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-slate-700">
                                                            <span>{domain}</span>
                                                            <span className="text-slate-900">{count}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                            <div className="bg-[#154ED0] h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        {enrollments.length === 0 && (
                                            <div className="text-sm text-slate-400 py-6 text-center">No domain stats available yet.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Platform Summary (Right-most col in reference) */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm col-span-1 xl:col-span-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-base text-slate-900 mb-6 flex justify-between items-center">Upcoming Deadlines <span className="text-[10px] text-[#154ED0] cursor-pointer">View All</span></h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex flex-col items-center justify-center bg-red-50 text-red-600 rounded-lg w-10 h-10 flex-shrink-0 shadow-sm border border-red-100">
                                                    <span className="text-[9px] font-black uppercase">Jul</span>
                                                    <span className="text-sm font-bold leading-none">22</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">Task 2: REST API with CRUD</p>
                                                    <p className="text-[10px] text-slate-500">Due in 2 days</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex flex-col items-center justify-center bg-amber-50 text-amber-600 rounded-lg w-10 h-10 flex-shrink-0 shadow-sm border border-amber-100">
                                                    <span className="text-[9px] font-black uppercase">Jul</span>
                                                    <span className="text-sm font-bold leading-none">24</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">Task 4: Real-time Chat App</p>
                                                    <p className="text-[10px] text-slate-500">Due in 4 days</p>
                                                </div>
                                            </div>

                                        </div>

                                        <h3 className="font-bold text-base text-slate-900 mt-8 mb-4">Platform Summary</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-50 pb-2">
                                                <div className="flex items-center"><div className="w-4 h-4 flex items-center justify-center text-emerald-500 mr-2"><CreditCard className="w-3.5 h-3.5" /></div>Total Revenue</div>
                                                <div className="font-bold text-slate-900">₹400 <span className="text-[9px] text-emerald-500 ml-1 font-bold">+15.4%</span></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-50 pb-2">
                                                <div className="flex items-center"><div className="w-4 h-4 flex items-center justify-center text-amber-500 mr-2"><CreditCard className="w-3.5 h-3.5" /></div>Pending Payments</div>
                                                <div className="font-bold text-slate-900">₹0 <span className="text-[9px] text-amber-500 ml-1 bg-amber-50 px-1 py-[1px] rounded font-bold">0</span></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-50 pb-2">
                                                <div className="flex items-center"><div className="w-4 h-4 flex items-center justify-center text-[#154ED0] mr-2"><Award className="w-3.5 h-3.5" /></div>Active Coupons</div>
                                                <div className="font-bold text-slate-900">{certificates.length}</div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                                <div className="flex items-center"><div className="w-4 h-4 flex items-center justify-center text-purple-500 mr-2"><Mail className="w-3.5 h-3.5" /></div>Email Credits Left</div>
                                                <div className="font-bold text-slate-900">2,450 <span className="text-[9px] text-emerald-600 ml-1 bg-emerald-50 px-1 py-[1px] rounded font-bold">Enough</span></div>
                                            </div>
                                        </div>
                                    </div>
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
                                <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-x-auto shadow-sm">
                                    <table className="w-full min-w-[640px] border-collapse text-left text-xs">
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
                                                            enroll.status === 'completed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/20' :
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
                            {/* Header Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Task Submissions</h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review, approve, or request revisions for intern task submissions.</p>
                                </div>
                                <button
                                    onClick={loadData}
                                    className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 rounded-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    <RefreshCw className="w-4 h-4" /> Refresh List
                                </button>
                            </div>

                            {/* Filters and Search */}
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                                <div className="flex bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 p-1 overflow-x-auto max-w-full no-scrollbar">
                                    <button
                                        onClick={() => setGradingSubTab('all')}
                                        className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${gradingSubTab === 'all' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                    >
                                        All Submissions ({allSubmissions.length})
                                    </button>
                                    <button
                                        onClick={() => setGradingSubTab('pending')}
                                        className={`px-4 py-2 font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-1.5 rounded-full ${gradingSubTab === 'pending' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                    >
                                        <Clock className="w-3.5 h-3.5" /> Pending Review ({allSubmissions.filter(s => s.status === 'submitted').length})
                                    </button>
                                    <button
                                        onClick={() => setGradingSubTab('resubmissions')}
                                        className={`px-4 py-2 font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-1.5 rounded-full ${gradingSubTab === 'resubmissions' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                    >
                                        <History className="w-3.5 h-3.5" /> Resubmissions ({allSubmissions.filter(s => s.status === 'resubmission_required').length})
                                    </button>
                                    <button
                                        onClick={() => setGradingSubTab('reviewed')}
                                        className={`px-4 py-2 font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-1.5 rounded-full ${gradingSubTab === 'reviewed' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                    >
                                        <Check className="w-3.5 h-3.5" /> Reviewed ({allSubmissions.filter(s => s.status === 'approved').length})
                                    </button>
                                </div>
                                <div className="relative w-full xl:w-80 flex-shrink-0">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                                    <input
                                        type="text"
                                        placeholder="Search intern name, email, task..."
                                        value={submissionSearch}
                                        onChange={(e) => setSubmissionSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-full text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                                    />
                                </div>
                            </div>

                            {/* Submission List */}
                            <div className="space-y-4">
                                {(() => {
                                    const filteredList = allSubmissions.filter(sub => {
                                        if (gradingSubTab === 'pending' && sub.status !== 'submitted') return false;
                                        if (gradingSubTab === 'resubmissions' && sub.status !== 'resubmission_required') return false;
                                        if (gradingSubTab === 'reviewed' && sub.status !== 'approved') return false;
                                        if (submissionSearch) {
                                            const q = submissionSearch.toLowerCase();
                                            return (sub.profiles?.full_name || '').toLowerCase().includes(q) ||
                                                (sub.profiles?.email || '').toLowerCase().includes(q) ||
                                                (sub.internship_tasks?.title || '').toLowerCase().includes(q);
                                        }
                                        return true;
                                    });

                                    if (filteredList.length === 0) {
                                        return (
                                            <div className="bg-white dark:bg-brand-cardDark border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                                                <ListTodo className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                                <h4 className="text-slate-700 dark:text-slate-300 font-bold mb-1">No submissions found</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">There are no tasks matching the selected filters.</p>
                                            </div>
                                        );
                                    }

                                    return filteredList.map(sub => {
                                        let statusConfig = { label: 'Unknown', borderClass: 'bg-slate-500', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', Icon: Clock };
                                        if (sub.status === 'submitted') {
                                            statusConfig = { label: 'Pending Review', borderClass: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', Icon: Clock };
                                        } else if (sub.status === 'resubmission_required') {
                                            statusConfig = { label: 'Resubmission', borderClass: 'bg-purple-500', badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', Icon: History };
                                        } else if (sub.status === 'approved') {
                                            statusConfig = { label: 'Approved', borderClass: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', Icon: CheckSquare };
                                        }

                                        return (
                                            <div key={sub.id} className="bg-white dark:bg-brand-cardDark border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col xl:flex-row xl:items-center justify-between p-5 relative overflow-hidden shadow-sm hover:shadow transition-shadow group">
                                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusConfig.borderClass}`}></div>
                                                <div className="pl-4 xl:w-2/3">
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">Task {sub.internship_tasks?.task_number}: {sub.internship_tasks?.title}</h3>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1.5 mb-2 font-semibold">
                                                        {sub.profiles?.full_name || 'Unknown Student'} · {sub.profiles?.email}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                                                        <p className="text-slate-500 dark:text-slate-400">
                                                            Submitted: <span className="font-bold text-slate-700 dark:text-slate-300">{formatLastActive(sub.submitted_at || '')}</span>
                                                        </p>
                                                        {(sub.github_url || sub.linkedin_url) && (
                                                            <a href={sub.github_url || sub.linkedin_url || '#'} target="_blank" rel="noreferrer" className="font-bold text-brand-primary dark:text-blue-400 flex items-center gap-1 hover:underline">
                                                                <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="pl-4 xl:pl-0 mt-4 xl:mt-0 flex flex-wrap xl:flex-nowrap items-center gap-3 xl:w-1/3 xl:justify-end">
                                                    <span className={`${statusConfig.badgeClass} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-black/5 dark:border-white/5`}>
                                                        <statusConfig.Icon className="w-3.5 h-3.5" />
                                                        {statusConfig.label}
                                                    </span>

                                                    <button
                                                        onClick={() => {
                                                            setAdminFeedback(sub.admin_feedback || '');
                                                            setSelectedSubForReview(sub);
                                                        }}
                                                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-full px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm text-slate-700 dark:text-slate-200"
                                                    >
                                                        View Submission
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}

                    {activeTab === 'certificates' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">

                            {/* Verification Queue (New Auto Workflow) */}
                            <div className="lg:col-span-2 bg-white dark:bg-brand-cardDark border border-slate-202 dark:border-slate-805 rounded-2xl p-6 shadow-sm flex flex-col max-h-[600px]">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex justify-between">
                                    <span>Verification Queue</span>
                                    <span className="text-brand-primary">{enrollments.filter(e => e.application_status?.startsWith('PAYMENT_')).length} Pending</span>
                                </h3>

                                <div className="divide-y divide-slate-100 dark:divide-slate-850 overflow-y-auto pr-2 flex-1">
                                    {enrollments.filter(e => e.application_status?.startsWith('PAYMENT_')).length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">No certificates pending verification.</p>
                                    ) : (
                                        enrollments.filter(e => e.application_status?.startsWith('PAYMENT_')).map(enroll => (
                                            <div key={enroll.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 px-2 transition">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm border border-blue-100 dark:border-blue-800">
                                                        {enroll.profiles?.full_name?.charAt(0).toUpperCase() || 'S'}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block capitalize text-sm">{enroll.profiles?.full_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{enroll.profiles?.email}</span>
                                                        <span className="text-[10px] text-emerald-600 font-bold block mt-1">Payment: Verified ✓ (₹100)</span>
                                                    </div>
                                                </div>
                                                <div className="text-left md:text-right flex-1 md:flex-none w-full md:w-auto">
                                                    <span className="font-bold text-slate-700 dark:text-slate-205 block">{enroll.internships?.title || 'Internship Track'}</span>
                                                    <span className="text-[10px] text-slate-400 block mt-1">100% Tasks Completed</span>
                                                </div>
                                                <button
                                                    onClick={() => handleApproveCertificate(enroll.id)}
                                                    disabled={approvingCertId === enroll.id}
                                                    className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow whitespace-nowrap"
                                                >
                                                    {approvingCertId === enroll.id ? 'Approving...' : 'Approve & Issue'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Forms Area */}
                            <div className="lg:col-span-1 space-y-8">
                                {/* Issuing Form */}
                                <div className="bg-white dark:bg-brand-cardDark border border-slate-202 dark:border-slate-805 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Manual Issue</h3>
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
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Course/Domain</label>
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
                                <div className="bg-white dark:bg-brand-cardDark border border-slate-202 dark:border-slate-805 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Verification Registry logs</h3>

                                    {certificates.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">No certificates issued yet.</p>
                                    ) : (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-[300px] overflow-y-auto pr-2">
                                            {certificates.map(cert => (
                                                <div key={cert.id} className="py-3 flex justify-between items-center text-xs">
                                                    <div>
                                                        <span className="font-bold block capitalize">{cert.profiles?.full_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{cert.certificate_number}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-slate-700 dark:text-slate-205 block">{cert.course_name}</span>
                                                        <span className="text-[10px] text-slate-400 block">{new Date(cert.issue_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                    {activeTab === 'payments' && (
                        <div className="space-y-6 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Payments</h2>
                                    <span className="text-sm text-slate-500">{paymentsList.filter(p => {
                                        if (paymentFilter !== 'All') {
                                            const pStatus = p.payment_status?.toLowerCase();
                                            const pFilter = paymentFilter.toLowerCase();
                                            if (pFilter === 'verified' && pStatus === 'success') return true;
                                            return pStatus === pFilter;
                                        }
                                        return true;
                                    }).length} matching · {paymentsList.length} total payments</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <div className="flex space-x-1 sm:space-x-2 bg-slate-50 dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto overflow-x-auto">
                                    {['All', 'Pending', 'Verified', 'Rejected'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setPaymentFilter(filter as any)}
                                            className={`px-3 sm:px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${paymentFilter === filter
                                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 xl:top-3 top-2.5" />
                                    <input
                                        type="text"
                                        placeholder="Search student, UTR..."
                                        value={paymentSearch}
                                        onChange={(e) => setPaymentSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 sm:py-2 border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 rounded-full text-xs sm:text-sm outline-none shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[800px] border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-805 bg-white dark:bg-slate-900">
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Student</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">UTR</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {paymentsList
                                                .filter(p => {
                                                    if (paymentFilter !== 'All') {
                                                        const pStatus = p.payment_status?.toLowerCase();
                                                        const pFilter = paymentFilter.toLowerCase();
                                                        if (pFilter === 'verified' && pStatus === 'success') return true;
                                                        if (pStatus !== pFilter) return false;
                                                    }
                                                    if (paymentSearch) {
                                                        const q = paymentSearch.toLowerCase();
                                                        return (
                                                            p.profiles?.full_name?.toLowerCase().includes(q) ||
                                                            p.transaction_id.toLowerCase().includes(q)
                                                        );
                                                    }
                                                    return true;
                                                })
                                                .map(payment => {
                                                    const initials = payment.profiles?.full_name?.charAt(0).toUpperCase() || 'S';
                                                    const rawStatus = payment.payment_status?.toLowerCase() || 'pending';
                                                    const statusMap: any = {
                                                        'success': 'verified',
                                                        'verified': 'verified',
                                                        'rejected': 'rejected',
                                                        'pending': 'pending'
                                                    };
                                                    const displayStatus = statusMap[rawStatus] || rawStatus;

                                                    let statusBadge = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
                                                    if (displayStatus === 'verified') statusBadge = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                                                    if (displayStatus === 'rejected') statusBadge = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";

                                                    return (
                                                        <tr key={payment.payment_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center space-x-4 text-left">
                                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                                                                        {initials}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-bold text-slate-800 dark:text-slate-100 block leading-tight text-sm">{payment.profiles?.full_name}</span>
                                                                        <span className="text-xs text-slate-400 font-medium leading-none block mt-1 line-clamp-1 max-w-[200px]">{payment.domain_name}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-mono font-medium text-slate-700 dark:text-slate-300">
                                                                {payment.transaction_id}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                                                                ₹{payment.amount}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${statusBadge}`}>
                                                                    {displayStatus}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {displayStatus === 'verified' && (
                                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Completed</span>
                                                                )}
                                                                {displayStatus === 'rejected' && (
                                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Rejected</span>
                                                                )}
                                                                {displayStatus === 'pending' && (
                                                                    <div className="flex justify-end gap-2">
                                                                        <button onClick={() => handlePaymentAction(payment, 'verify')} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm">Verify</button>
                                                                        <button onClick={() => handlePaymentAction(payment, 'reject')} className="px-4 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition shadow-sm">Reject</button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            {paymentsList.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400 font-medium border-t border-dashed border-slate-200 dark:border-slate-800">
                                                        No payments found matching the current filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
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
                                                                                showToast('Internship track deleted successfully.', 'success');
                                                                                loadData();
                                                                            } catch (err: any) {
                                                                                showToast(`Delete error: ${err.message}`, 'error');
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

                    {activeTab === 'students' && (
                        <div className="space-y-6 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Students</h2>
                                    <span className="text-xs text-slate-500">Manage and view all enrolled student interns</span>
                                </div>
                                <div className="relative max-w-sm w-full">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        value={studentsSearch}
                                        onChange={(e) => setStudentsSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-slate-205 bg-white dark:bg-slate-900 dark:border-slate-800 rounded-xl text-xs outline-none shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1000px] border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-900/50">
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Domain</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">College</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intern ID</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Login</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {enrollments.filter(e => {
                                                const query = studentsSearch.toLowerCase();
                                                return (
                                                    e.profiles?.full_name?.toLowerCase().includes(query) ||
                                                    e.profiles?.email?.toLowerCase().includes(query) ||
                                                    e.profiles?.college?.toLowerCase().includes(query) ||
                                                    e.internships?.title?.toLowerCase().includes(query)
                                                );
                                            }).length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-12 text-center text-xs text-slate-400 font-medium">
                                                        No students found matching your search.
                                                    </td>
                                                </tr>
                                            ) : (
                                                enrollments.filter(e => {
                                                    const query = studentsSearch.toLowerCase();
                                                    return (
                                                        e.profiles?.full_name?.toLowerCase().includes(query) ||
                                                        e.profiles?.email?.toLowerCase().includes(query) ||
                                                        e.profiles?.college?.toLowerCase().includes(query) ||
                                                        e.internships?.title?.toLowerCase().includes(query)
                                                    );
                                                }).map((enroll) => {
                                                    const initials = enroll.profiles?.full_name?.charAt(0).toUpperCase() || 'S';
                                                    const internId = offerLetters.find(o => o.student_email === enroll.profiles?.email)?.offer_letter_id || `SKX-2026-${Math.floor(1000 + Math.random() * 9500)}`;
                                                    const joinedDate = enroll.joined_at ? new Date(enroll.joined_at).toLocaleDateString('en-GB') : '23/8/2026';
                                                    const profilUpdatedAt = enroll.profiles?.updated_at;
                                                    const isOnline = (() => {
                                                        if (!profilUpdatedAt) return false;
                                                        const lastSeen = new Date(profilUpdatedAt).getTime();
                                                        return Math.abs(Date.now() - lastSeen) < 3 * 60 * 1000;
                                                    })();

                                                    return (
                                                        <tr key={enroll.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                                                            <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                                                                <div className="flex items-center space-x-3 text-left">
                                                                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                                                        {initials}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-bold text-slate-805 dark:text-slate-100 block leading-tight">{enroll.profiles?.full_name}</span>
                                                                        <span className="text-[11px] text-slate-400 font-medium font-mono leading-none block mt-0.5">{enroll.profiles?.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {isOnline ? (
                                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                                                        Online
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
                                                                        Offline
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                                                    {enroll.internships?.title || enroll.internships?.category || 'Full Stack Development'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[200px] truncate">
                                                                {enroll.profiles?.college || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                                                                {internId}
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                                                {formatLastActive(enroll.profiles?.updated_at)}
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                                {joinedDate}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end space-x-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedStudentForDetail(enroll);
                                                                            setActiveTab('student-detail');
                                                                        }}
                                                                        title="View Student Details"
                                                                        className="p-1.5 border hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-750 text-xs rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                                                    >
                                                                        <Users className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <a
                                                                        href={`mailto:${enroll.profiles?.email}`}
                                                                        title="Send Email"
                                                                        className="p-1.5 border hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-750 text-xs rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                                                    >
                                                                        <Mail className="w-3.5 h-3.5" />
                                                                    </a>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'student-detail' && selectedStudentForDetail && (
                        <div className="space-y-6 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                        <span className="hover:text-slate-650 cursor-pointer hover:underline" onClick={() => setActiveTab('students')}>Students</span>
                                        <span>/</span>
                                        <span className="text-slate-600 dark:text-slate-350">Student Details</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Student Details</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setActiveTab('students')}
                                        className="px-4 py-2 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-205 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer shadow-sm transition"
                                    >
                                        ← Back to Students
                                    </button>
                                    <a
                                        href={`mailto:${selectedStudentForDetail.profiles?.email}`}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <Mail className="w-3.5 h-3.5" />
                                        <span>Send Email</span>
                                    </a>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                                        <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-650 flex items-center justify-center font-bold text-3xl shadow-inner border border-blue-100 dark:border-blue-900/50">
                                            {selectedStudentForDetail.profiles?.full_name?.charAt(0).toUpperCase() || 'S'}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white mt-4 leading-none">
                                            {selectedStudentForDetail.profiles?.full_name}
                                        </h3>
                                        <span className="text-xs text-slate-400 font-mono mt-1.5 select-all">
                                            {selectedStudentForDetail.profiles?.email}
                                        </span>

                                        {(() => {
                                            const profilUpdatedAt = selectedStudentForDetail.profiles?.updated_at;
                                            const isOnline = (() => {
                                                if (!profilUpdatedAt) return false;
                                                const lastSeen = new Date(profilUpdatedAt).getTime();
                                                return Math.abs(Date.now() - lastSeen) < 3 * 60 * 1000;
                                            })();
                                            return (
                                                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                                        {selectedStudentForDetail.status || 'Active'}
                                                    </span>
                                                    {isOnline ? (
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-105 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            Online
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350">
                                                            Offline
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3 text-left">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Joined Platform</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-205">
                                                    {selectedStudentForDetail.joined_at ? new Date(selectedStudentForDetail.joined_at).toLocaleDateString('en-GB') : '23/8/2026'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Current Progress</span>
                                                <span className="font-bold text-blue-605 dark:text-blue-400">{selectedStudentForDetail.progress || 0}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-450 mb-4">Overall Progress</h4>
                                        <div className="relative pt-1">
                                            <div className="flex mb-2 items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold inline-block py-1 px-2.5 uppercase rounded-full text-blue-700 bg-blue-105/30">
                                                        Track Completion
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-black inline-block text-blue-600">
                                                        {selectedStudentForDetail.progress || 0}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div
                                                    style={{ width: `${selectedStudentForDetail.progress || 0}%` }}
                                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3.5">Academic & Personal Profile</h4>
                                        <div className="space-y-2.5 sm:space-y-3">
                                            {/* Full Name & Email */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                                <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl">
                                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Full Name</span>
                                                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{selectedStudentForDetail.profiles?.full_name || 'N/A'}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-830 rounded-xl overflow-hidden">
                                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Email Address</span>
                                                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5 font-mono truncate" title={selectedStudentForDetail.profiles?.email || ''}>{selectedStudentForDetail.profiles?.email || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* College / University */}
                                            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl">
                                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">College / University Name</span>
                                                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{selectedStudentForDetail.profiles?.college || 'N/A'}</p>
                                            </div>

                                            {/* Year of Study & Course/Branch (side-by-side on mobile) */}
                                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                                <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl">
                                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Year of Study</span>
                                                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                                        {selectedStudentForDetail.profiles?.year_of_study || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl">
                                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Course / Branch</span>
                                                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                                        {selectedStudentForDetail.profiles?.course_branch || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Location: State, District, City (side-by-side 3 columns on mobile) */}
                                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                                <div className="p-2.5 sm:p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl min-w-0">
                                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px] sm:text-[9px] block truncate">State / UT</span>
                                                    <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                                                        {selectedStudentForDetail.profiles?.state || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="p-2.5 sm:p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl min-w-0">
                                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px] sm:text-[9px] block truncate">District</span>
                                                    <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                                                        {selectedStudentForDetail.profiles?.district || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="p-2.5 sm:p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl min-w-0">
                                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px] sm:text-[9px] block truncate">City / Town</span>
                                                    <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                                                        {selectedStudentForDetail.profiles?.city || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3.5">Credentials & Assigned Track</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl sm:col-span-2">
                                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Enrolled Internship Track</span>
                                                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                                    {selectedStudentForDetail.internships?.title || 'Full Stack Development'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Duration & Stipend</span>
                                                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                                    {selectedStudentForDetail.internships?.duration || '1 Month'} • Free / Unpaid
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Intern ID</span>
                                                <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                                                    {offerLetters.find(o => o.student_email === selectedStudentForDetail.profiles?.email)?.offer_letter_id || 'SKX-2026-3880'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl sm:col-span-2">
                                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Certificate Issued</span>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 font-mono">
                                                    {certificates.find(c => c.user_id === selectedStudentForDetail.user_id)?.certificate_number || 'No issued certificate yet'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-left">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Milestone Quest Log / Submissions</h4>
                                <div className="space-y-6">
                                    {[1, 2, 3, 4, 5, 6].map((num) => {
                                        const sub = allSubmissions.find(s =>
                                            s.user_id === selectedStudentForDetail.user_id &&
                                            s.internship_id === selectedStudentForDetail.internship_id &&
                                            s.internship_tasks?.task_number === num
                                        );

                                        const taskTitle = num === 1 ? 'LinkedIn Offer Post Requirement' : `Milestone ${num - 1} Engineering Requirement`;
                                        const taskDesc = num === 1 ? 'Share your internship selection announcement on LinkedIn to unlock tasks.' : 'Complete technical assignment objectives.';

                                        let statusColor = 'bg-slate-100 text-slate-500 border border-slate-205 dark:border-slate-800';
                                        let statusText = 'Locked';

                                        if (sub) {
                                            if (sub.status === 'approved') {
                                                statusColor = 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/40';
                                                statusText = 'Approved';
                                            } else if (sub.status === 'submitted') {
                                                statusColor = 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40';
                                                statusText = 'Under Review';
                                            } else if (sub.status === 'resubmission_required') {
                                                statusColor = 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40';
                                                statusText = 'Changes Requested';
                                            } else {
                                                statusColor = 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-805/40';
                                                statusText = 'Active / In Progress';
                                            }
                                        } else if (num === 1) {
                                            statusColor = 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-805/40';
                                            statusText = 'Active / In Progress';
                                        }

                                        return (
                                            <div key={num} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-855 rounded-2xl gap-4 hover:border-slate-200 dark:hover:border-slate-800 transition">
                                                <div className="space-y-1 max-w-xl">
                                                    <div className="flex items-center space-x-2.5">
                                                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                                                            {num}
                                                        </span>
                                                        <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{taskTitle}</h5>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${statusColor}`}>
                                                            {statusText}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 ml-8 leading-relaxed">{sub?.internship_tasks?.description || taskDesc}</p>

                                                    {sub && (
                                                        <div className="ml-8 mt-2 space-y-1.5 text-xs text-left">
                                                            {sub.github_url && (
                                                                <p className="flex items-center space-x-1.5 text-slate-500 font-mono">
                                                                    <span className="font-black text-slate-400">GitHub:</span>
                                                                    <a href={sub.github_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-450 hover:underline inline-flex items-center">
                                                                        {sub.github_url} <ExternalLink className="w-3 h-3 ml-0.5" />
                                                                    </a>
                                                                </p>
                                                            )}
                                                            {sub.linkedin_url && (
                                                                <p className="flex items-center space-x-1.5 text-slate-505 font-mono">
                                                                    <span className="font-black text-slate-405">LinkedIn:</span>
                                                                    <a href={sub.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-450 hover:underline inline-flex items-center">
                                                                        {sub.linkedin_url} <ExternalLink className="w-3 h-3 ml-0.5" />
                                                                    </a>
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center md:justify-end gap-2 ml-8 md:ml-0">
                                                    {sub && sub.status === 'submitted' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSubForReview(sub);
                                                                setAdminFeedback(sub.admin_feedback || '');
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                                                        >
                                                            Evaluate Milestone
                                                        </button>
                                                    )}
                                                    {sub?.admin_feedback && (
                                                        <div className="text-right text-xs max-w-[200px] truncate text-slate-500 font-medium">
                                                            Feedback: <span className="italic block text-[10px] text-slate-500 mt-0.5">"{sub.admin_feedback}"</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Coupons & Discounts Tab */}
                    {activeTab === 'coupons' && (
                        <div className="space-y-6 text-left animate-fade-in-up">
                            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                                <h2 className="text-xl font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
                                    <Tag className="w-5 h-5 text-[#154ED0]" />
                                    <span>Coupons & Discount Codes</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Manage promotional codes, registration fee discounts, and special offers.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-1">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Create New Coupon</h3>
                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Coupon Code</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. VINIX100, SUMMER50"
                                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono uppercase font-bold text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Discount Amount (%)</label>
                                            <input
                                                type="number"
                                                placeholder="e.g. 50"
                                                defaultValue="100"
                                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Maximum Redemptions</label>
                                            <input
                                                type="number"
                                                placeholder="Unlimited or number"
                                                defaultValue="50"
                                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <button
                                            onClick={() => showToast('Coupon code generated successfully!', 'success')}
                                            className="w-full py-2.5 bg-[#154ED0] text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition mt-2"
                                        >
                                            Publish Coupon
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-2">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Active Promotional Coupons</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold pb-2">
                                                    <th className="pb-2">Code</th>
                                                    <th className="pb-2">Discount</th>
                                                    <th className="pb-2">Usage</th>
                                                    <th className="pb-2">Status</th>
                                                    <th className="pb-2 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-medium">
                                                <tr>
                                                    <td className="py-3 font-mono font-bold text-[#154ED0]">VINIX100</td>
                                                    <td className="py-3 font-bold text-emerald-600">100% OFF</td>
                                                    <td className="py-3 text-slate-500">38 / 50 used</td>
                                                    <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">Active</span></td>
                                                    <td className="py-3 text-right"><button onClick={() => showToast('Coupon copied!', 'info')} className="text-slate-400 hover:text-slate-700 text-xs">Copy</button></td>
                                                </tr>
                                                <tr>
                                                    <td className="py-3 font-mono font-bold text-[#154ED0]">CAMPUS50</td>
                                                    <td className="py-3 font-bold text-emerald-600">50% OFF</td>
                                                    <td className="py-3 text-slate-500">12 / 100 used</td>
                                                    <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">Active</span></td>
                                                    <td className="py-3 text-right"><button onClick={() => showToast('Coupon copied!', 'info')} className="text-slate-400 hover:text-slate-700 text-xs">Copy</button></td>
                                                </tr>
                                                <tr>
                                                    <td className="py-3 font-mono font-bold text-[#154ED0]">EARLYBIRD</td>
                                                    <td className="py-3 font-bold text-emerald-600">100% OFF</td>
                                                    <td className="py-3 text-slate-500">50 / 50 used</td>
                                                    <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Expired</span></td>
                                                    <td className="py-3 text-right"><button onClick={() => showToast('Coupon expired', 'warning')} className="text-slate-400 hover:text-slate-700 text-xs">View</button></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Marketing & Promotions Tab */}
                    {activeTab === 'promotions' && (
                        <div className="space-y-6 text-left animate-fade-in-up">
                            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                                <h2 className="text-xl font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
                                    <Percent className="w-5 h-5 text-[#154ED0]" />
                                    <span>Promotions & Announcements</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Broadcast alerts, banner notifications, and marketing updates across candidate dashboards.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Compose Broadcast Notice</h3>
                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Notice Headline</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Summer Batch Certificate Verification Drive"
                                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Message Content</label>
                                            <textarea
                                                rows={4}
                                                placeholder="Enter full announcement details for enrolled candidates..."
                                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <button
                                            onClick={() => showToast('Announcement broadcasted to all students!', 'success')}
                                            className="w-full py-2.5 bg-[#154ED0] text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition"
                                        >
                                            Broadcast Announcement
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Recent Broadcasts</h3>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center justify-between text-[11px] font-bold">
                                                    <span className="text-slate-900 dark:text-white">Milestone Evaluation Guidelines Updated</span>
                                                    <span className="text-slate-400 text-[9px]">2 days ago</span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Students are requested to post GitHub solution links with proper README documentation.</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center justify-between text-[11px] font-bold">
                                                    <span className="text-slate-900 dark:text-white">Certificate Verification Live</span>
                                                    <span className="text-slate-400 text-[9px]">5 days ago</span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Offer letters and certificates can now be validated instantly with official QR codes.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm select-none animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative text-left max-h-[92vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                            <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0F286E] to-[#154ED0] text-white flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
                                    {(selectedEnrollForDetails.profiles?.full_name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                                        {selectedEnrollForDetails.profiles?.full_name || 'Student Profile'}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-medium truncate">
                                        {selectedEnrollForDetails.internships?.title || 'Internship Candidate'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEnrollForDetails(null)}
                                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
                                aria-label="Close dialog"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="mt-3.5 space-y-2.5 overflow-y-auto pr-1 flex-1">
                            {/* Full Name & Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="p-2.5 sm:p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Full Name</span>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                                        {selectedEnrollForDetails.profiles?.full_name || 'N/A'}
                                    </p>
                                </div>
                                <div className="p-2.5 sm:p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl overflow-hidden">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Email Address</span>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5 font-mono truncate" title={selectedEnrollForDetails.profiles?.email || ''}>
                                        {selectedEnrollForDetails.profiles?.email || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* College / University */}
                            <div className="p-2.5 sm:p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl">
                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">College / University Name</span>
                                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                    {selectedEnrollForDetails.profiles?.college || 'N/A'}
                                </p>
                            </div>

                            {/* Year of Study & Course/Branch (2 columns side-by-side on mobile) */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="p-2.5 sm:p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Year of Study</span>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                        {selectedEnrollForDetails.profiles?.year_of_study || 'N/A'}
                                    </p>
                                </div>
                                <div className="p-2.5 sm:p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Course / Branch</span>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                        {selectedEnrollForDetails.profiles?.course_branch || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Location: State, District, City (3 columns side-by-side on mobile) */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                                <div className="p-2 sm:p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl min-w-0">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px] sm:text-[9px] block truncate">State / UT</span>
                                    <p className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                                        {selectedEnrollForDetails.profiles?.state || 'N/A'}
                                    </p>
                                </div>
                                <div className="p-2 sm:p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl min-w-0">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px] sm:text-[9px] block truncate">District</span>
                                    <p className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                                        {selectedEnrollForDetails.profiles?.district || 'N/A'}
                                    </p>
                                </div>
                                <div className="p-2 sm:p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl min-w-0">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px] sm:text-[9px] block truncate">City / Town</span>
                                    <p className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                                        {selectedEnrollForDetails.profiles?.city || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Enrolled Track Badge Card */}
                            <div className="p-2.5 sm:p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl flex items-center justify-between">
                                <div className="min-w-0">
                                    <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest text-[9px] block">Assigned Internship</span>
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                                        {selectedEnrollForDetails.internships?.title || 'Virtual Internship'}
                                    </p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${
                                    selectedEnrollForDetails.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                                    selectedEnrollForDetails.status === 'completed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' :
                                    selectedEnrollForDetails.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                    {selectedEnrollForDetails.status || 'Active'}
                                </span>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-shrink-0">
                            {selectedEnrollForDetails.profiles?.email ? (
                                <a
                                    href={`mailto:${selectedEnrollForDetails.profiles.email}`}
                                    className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                                >
                                    <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>Send Email</span>
                                </a>
                            ) : <div />}
                            <button
                                type="button"
                                onClick={() => setSelectedEnrollForDetails(null)}
                                className="px-5 py-2 bg-[#154ED0] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
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
