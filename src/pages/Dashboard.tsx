import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast, ToastContainer } from '../components/Toast';
import {
    LayoutDashboard, BookOpen, Layers, FileCode, Award, User,
    CheckCircle2, XCircle, ExternalLink, FileDown, Play, CheckCheck,
    MessageSquare, Printer, GraduationCap, Briefcase, Settings, Code,
    QrCode, Linkedin, Github, CreditCard, Shield, Send, ArrowRight,
    Sparkles, Clock, CalendarDays, FileText, CheckCircle, LogOut, Home, ClipboardList,
    RotateCcw, AlertCircle
} from 'lucide-react';

interface Enrollment {
    id: string;
    internship_id: string;
    progress: number;
    status: string;
    certificate_status?: string;
    completion_status?: string;
    application_status?: string;
    internship: {
        title: string;
        domain: string;
        description: string;
        duration: string;
    };
}

interface InternshipApplication {
    id: string;
    domain: string;
    duration: string;
    status: string;
}

interface OfferLetter {
    id: string;
    offer_letter_id: string;
    student_name: string;
    internship_title: string;
    duration: string;
    issue_date: string;
    status: string;
    verification_token: string;
    offer_letter_url?: string;
}

interface TaskProgress {
    id: string;
    task_id: string;
    status: string;
    github_url?: string;
    linkedin_url?: string;
    student_note?: string;
    admin_feedback?: string;
    submission_url?: string;
    internship_tasks: {
        task_number: number;
        title: string;
        description: string;
    };
}

interface CertificateData {
    id: string;
    certificate_number: string;
    course_name: string;
    issue_date: string;
    status: string;
    certificate_url?: string;
}

const Dashboard: React.FC = () => {
    const { user, profile, studentProfile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { toasts, showToast, dismiss } = useToast();

    const [activeTab, setActiveTab] = useState<'overview' | 'workspace' | 'idcard' | 'certificates' | 'settings' | 'payment'>('overview');
    const [loading, setLoading] = useState(true);

    // Database Data States
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [application, setApplication] = useState<InternshipApplication | null>(null);
    const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
    const [taskProgresses, setTaskProgresses] = useState<TaskProgress[]>([]);
    const [certificates, setCertificates] = useState<CertificateData[]>([]);
    const [totalTaskCount, setTotalTaskCount] = useState<number>(0);

    // Settings Edit fields
    const [editName, setEditName] = useState('');
    const [editAvatarUrl, setEditAvatarUrl] = useState('');
    const [editCollege, setEditCollege] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editGithub, setEditGithub] = useState('');
    const [editLinkedin, setEditLinkedin] = useState('');
    const [editSkills, setEditSkills] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);

    // Filter and Search States
    const [taskSearchQuery, setTaskSearchQuery] = useState('');
    const [taskFilter, setTaskFilter] = useState<'all' | 'completed' | 'ongoing' | 'pending' | 'overdue'>('all');
    const [taskSort, setTaskSort] = useState<'asc' | 'desc'>('asc');

    // Submit Task Form
    const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<TaskProgress | null>(null);
    const [githubUrl, setGithubUrl] = useState('');
    const [studentNote, setStudentNote] = useState('');
    const [projectImageUrl, setProjectImageUrl] = useState('');
    const [submittingTask, setSubmittingTask] = useState(false);

    // Submit LinkedIn Verification Form
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [submittingLinkedin, setSubmittingLinkedin] = useState(false);
    const [downloadingOffer, setDownloadingOffer] = useState(false);
    const [downloadingCert, setDownloadingCert] = useState(false);
    const [activeCertForDownload, setActiveCertForDownload] = useState<CertificateData | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [utrNumber, setUtrNumber] = useState('');

    async function loadDashboardData() {
        if (!user) return;
        try {
            setLoading(true);

            // Fetch enrollments — join internship title & duration
            const { data: enrollData } = await supabaseAdmin
                .from('internship_enrollments')
                .select('*, internship:internships(title, description, duration)')
                .eq('user_id', user.id);

            // Fetch the student's internship application to get domain & duration chosen
            const { data: appData } = await supabaseAdmin
                .from('internship_applications')
                .select('id, domain, duration, status')
                .eq('student_id', user.id)
                .order('applied_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            // Fetch offer letters
            const { data: offerData } = await supabaseAdmin
                .from('offer_letters')
                .select('*')
                .eq('user_id', user.id);

            // Fetch certificates
            const { data: certsData } = await supabaseAdmin
                .from('certificates')
                .select('*')
                .eq('user_id', user.id);

            // Fetch all tasks progress for this user + join task details
            const { data: progressData } = await supabaseAdmin
                .from('task_progress')
                .select('*, internship_tasks:internship_tasks(task_number, title, description)')
                .eq('user_id', user.id);

            const sortedProgress = (progressData || []).sort((a: any, b: any) =>
                (a.internship_tasks?.task_number || 0) - (b.internship_tasks?.task_number || 0)
            );

            // Fetch total task count for current internship (for accurate progress %)
            let totalTasks = sortedProgress.length;
            const firstEnroll = (enrollData || [])[0];
            if (firstEnroll?.internship_id) {
                const { count } = await supabaseAdmin
                    .from('internship_tasks')
                    .select('id', { count: 'exact', head: true })
                    .eq('internship_id', firstEnroll.internship_id);
                if (count && count > 0) totalTasks = count;
            }

            setEnrollments((enrollData || []).map(e => ({
                id: e.id,
                internship_id: e.internship_id,
                progress: e.progress || 0,
                status: e.status,
                certificate_status: e.certificate_status || 'NOT_ELIGIBLE',
                completion_status: e.completion_status || 'IN_PROGRESS',
                internship: {
                    title: e.internship?.title || 'Virtual Internship',
                    domain: appData?.domain || 'Software Engineering',
                    description: e.internship?.description || '',
                    duration: e.internship?.duration || appData?.duration || '3 Months'
                }
            })));

            setApplication(appData || null);
            setOfferLetters(offerData || []);
            setCertificates(certsData || []);
            setTaskProgresses(sortedProgress);
            setTotalTaskCount(totalTasks);

            // Prep editing fields with profile values
            if (profile) {
                setEditName(profile.full_name || '');
                setEditAvatarUrl(profile.avatar_url || '');
                setEditCollege(studentProfile?.college || '');
                setEditBio(profile.bio || '');
                setEditGithub(profile.github || '');
                setEditLinkedin(profile.linkedin || '');
                setEditSkills((profile.skills || []).join(', '));
            }

        } catch (err) {
            console.error('Failed to load student dashboard:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDashboardData();

        // Subscribe to real-time additions/updates in database for live review triggers
        const progressSub = supabase
            .channel('public:task_progress_student')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_progress', filter: `user_id=eq.${user?.id}` }, () => {
                loadDashboardData();
            })
            .subscribe();

        const certSub = supabase
            .channel('public:certificates_student')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates', filter: `user_id=eq.${user?.id}` }, () => {
                loadDashboardData();
            })
            .subscribe();

        const offerSub = supabase
            .channel('public:offer_letters_student')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'offer_letters', filter: `user_id=eq.${user?.id}` }, () => {
                loadDashboardData();
            })
            .subscribe();

        return () => {
            progressSub.unsubscribe();
            certSub.unsubscribe();
            offerSub.unsubscribe();
        };
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaveLoading(true);

        try {
            const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: editName,
                    avatar_url: editAvatarUrl,
                    bio: editBio,
                    github: editGithub,
                    linkedin: editLinkedin,
                    skills: skillsArray
                })
                .eq('id', user.id);

            if (error) throw error;

            if (profile?.role === 'student') {
                const { error: studError } = await supabaseAdmin
                    .from('student_profiles')
                    .update({ college: editCollege })
                    .eq('id', user.id);
                if (studError) throw studError;
            }

            await refreshProfile();
            showToast('Your profile and engineering bio were updated successfully!', 'success');
        } catch (err: any) {
            showToast(`Error updating profile: ${err.message}`, 'error');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleApplyOfferStatus = async (offerId: string, status: 'ACCEPTED' | 'DECLINED') => {
        try {
            const { error } = await supabaseAdmin
                .from('offer_letters')
                .update({ status })
                .eq('id', offerId);

            if (error) throw error;
            showToast(`Offer letter ${status.toLowerCase()} successfully.`, 'success');

            // If accepted, let's trigger seeding task progress for task 1 (LinkedIn post)
            // or subsequent milestones if not already generated!
            if (status === 'ACCEPTED') {
                const activeEnroll = enrollments[0];
                if (activeEnroll) {
                    // Check database if task_progress rows already exist for the student
                    const { data: existingProgress } = await supabaseAdmin
                        .from('task_progress')
                        .select('id')
                        .eq('user_id', user?.id)
                        .eq('internship_id', activeEnroll.internship_id);

                    if (!existingProgress || existingProgress.length === 0) {
                        // Fetch internships_tasks associated with this internship class
                        const { data: tasks } = await supabaseAdmin
                            .from('internship_tasks')
                            .select('id, task_number')
                            .eq('internship_id', activeEnroll.internship_id);

                        if (tasks && tasks.length > 0) {
                            const inserts = tasks.map(t => ({
                                user_id: user?.id,
                                internship_id: activeEnroll.internship_id,
                                task_id: t.id,
                                status: t.task_number === 1 ? 'available' : 'locked' // lock everything except task 1 (LinkedIn Post)
                            }));
                            await supabaseAdmin.from('task_progress').insert(inserts);
                        }
                    }
                }
            }

            loadDashboardData();
        } catch (err: any) {
            showToast(`Error: ${err.message}`, 'error');
        }
    };

    // Submit Milestone Action
    const handleMilestoneSubmission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTaskForSubmission || !user) return;
        setSubmittingTask(true);

        try {
            const updatePayload: Record<string, any> = {
                status: 'submitted',
                github_url: githubUrl,
                student_note: studentNote,
                submitted_at: new Date().toISOString()
            };
            if (projectImageUrl.trim()) {
                updatePayload.submission_url = projectImageUrl.trim();
            }

            const { error } = await supabaseAdmin
                .from('task_progress')
                .update(updatePayload)
                .eq('id', selectedTaskForSubmission.id);

            if (error) throw error;

            showToast(
                selectedTaskForSubmission.status === 'resubmission_required'
                    ? 'Task solution resubmitted! Evaluators will review your revisions shortly.'
                    : 'Milestone submission recorded! Evaluators will grade your code shortly.',
                'success'
            );
            setSelectedTaskForSubmission(null);
            setGithubUrl('');
            setStudentNote('');
            setProjectImageUrl('');
            loadDashboardData();
        } catch (err: any) {
            showToast(`Failed to submit task: ${err.message}`, 'error');
        } finally {
            setSubmittingTask(false);
        }
    };

    // Submit LinkedIn Verification Link
    const handleLinkedInVerificationSubmit = async (e: React.FormEvent, progressId: string) => {
        e.preventDefault();
        if (!linkedinUrl.trim()) return;
        setSubmittingLinkedin(true);

        try {
            const { error } = await supabaseAdmin
                .from('task_progress')
                .update({
                    status: 'submitted',
                    linkedin_url: linkedinUrl,
                    submitted_at: new Date().toISOString()
                })
                .eq('id', progressId);

            if (error) throw error;

            showToast('LinkedIn profile verification post submitted for mentor approval!', 'success');
            setLinkedinUrl('');
            loadDashboardData();
        } catch (err: any) {
            showToast(`Failed to submit: ${err.message}`, 'error');
        } finally {
            setSubmittingLinkedin(false);
        }
    };

    const handleIdCardPrint = () => {
        const originalTitle = document.title;
        document.title = `${activeOffer?.offer_letter_id || 'VINIX'}_ID_Badge`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 100);
    };

    const handleDownloadOfferLetterDirect = async () => {
        if (!activeOffer) return;
        if (activeOffer.offer_letter_url) {
            window.open(activeOffer.offer_letter_url, '_blank');
            return;
        }
        setDownloadingOffer(true);
        try {
            const element = document.getElementById('offer-letter-download-area');
            if (element) {
                // Set fixed temporary styling for pixel-perfect standard A4 DPI capture
                element.style.width = '794px';
                element.style.height = '1123px';

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    scrollY: 0,
                    scrollX: 0
                });

                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });

                const pageWidth = 210;
                const pageHeight = 297;

                const imgWidth = pageWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const finalHeight = Math.min(imgHeight, pageHeight);

                pdf.addImage(
                    canvas.toDataURL('image/jpeg', 0.95),
                    'JPEG',
                    0,
                    0,
                    imgWidth,
                    finalHeight
                );

                pdf.save(`${activeOffer.offer_letter_id || 'Offer_Letter'}.pdf`);
            }
        } catch (err: any) {
            showToast(`PDF download failed: ${err.message}`, 'error');
            navigate('/verify/offer/' + activeOffer.offer_letter_id);
        } finally {
            setDownloadingOffer(false);
        }
    };

    const handleDownloadCertificateDirect = async (cert: CertificateData) => {
        if (!cert) return;
        if (cert.certificate_url) {
            window.open(cert.certificate_url, '_blank');
            return;
        }
        setDownloadingCert(true);
        setActiveCertForDownload(cert);
        try {
            // Give React a moment to render the offscreen certificate container with cert details
            await new Promise(resolve => setTimeout(resolve, 300));

            const element = document.getElementById('certificate-download-area');
            if (element) {
                element.classList.add('cert-pdf-download-mode');

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    scrollY: 0,
                    scrollX: 0
                });

                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });

                const pageWidth = 297;
                const pageHeight = 210;

                const imgWidth = pageWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const finalHeight = Math.min(imgHeight, pageHeight);

                pdf.addImage(
                    canvas.toDataURL('image/jpeg', 0.95),
                    'JPEG',
                    0,
                    0,
                    imgWidth,
                    finalHeight
                );

                pdf.save(`${cert.certificate_number || 'Certificate'}.pdf`);
            }
        } catch (err: any) {
            showToast(`PDF download failed: ${err.message}`, 'error');
            navigate('/verify/' + cert.certificate_number);
        } finally {
            setActiveCertForDownload(null);
            setDownloadingCert(false);
        }
    };

    const handleProcessPayment = async () => {
        if (!activeEnrollment) return;
        if (!utrNumber || utrNumber.length < 5) {
            showToast('Please enter a valid UTR number.', 'error');
            return;
        }

        setProcessingPayment(true);
        try {
            // Update enrollment status to track payment UTR natively since API isn't available
            const { error } = await supabaseAdmin
                .from('internship_enrollments')
                .update({ application_status: `PAYMENT_PENDING:${utrNumber}` })
                .eq('id', activeEnrollment.id);
            if (error) throw new Error(error.message || 'Payment update failed');

            showToast('Payment successful. Your certificate request has been submitted for admin verification.', 'success');
            loadDashboardData();
        } catch (err: any) {
            showToast(`Payment error: ${err.message}`, 'error');
        } finally {
            setProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark flex items-center justify-center p-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
            </div>
        );
    }

    const activeEnrollment = enrollments.find(e => ['active', 'completed'].includes(e.status));
    const pendingEnrollment = enrollments.find(e => e.status === 'pending') ||
        (!activeEnrollment && application && application.status === 'pending' ? { internship: { title: application.domain + ' Internship' } } as any : null);
    const activeOffer = offerLetters[0];

    // Dynamic progress computed from real approved task count vs total
    const approvedCount = taskProgresses.filter(p => p.status === 'approved').length;
    const dynamicProgress = totalTaskCount > 0 ? Math.round((approvedCount / totalTaskCount) * 100) : (activeEnrollment?.progress || 0);

    // Helper values for locks
    // If task_number = 1 (linkedin post) is approved, we unlock the rest of the milestones!
    const hasUnlockedInternship = taskProgresses.some(p => p.internship_tasks?.task_number === 1 && p.status === 'approved');

    const renderSettingsTab = () => (
        <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto shadow-sm select-none">
            <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-brand-primary" />
                <span>Intern Profile Parameters</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-5 text-left">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Your Full Name</label>
                    <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Profile Photo URL</label>
                    <input
                        type="url"
                        value={editAvatarUrl}
                        onChange={(e) => setEditAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">College/Institution</label>
                    <input
                        type="text"
                        required
                        value={editCollege}
                        onChange={(e) => setEditCollege(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Biography / About Me</label>
                    <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Share details about your stack, engineering passions..."
                        className="w-full px-3.5 py-2.5 border border-slate-205 bg-slate-50 dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none h-20"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">GitHub Profile Link</label>
                        <input
                            type="url"
                            value={editGithub}
                            onChange={(e) => setEditGithub(e.target.value)}
                            placeholder="https://github.com/..."
                            className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">LinkedIn Profile Link</label>
                        <input
                            type="url"
                            value={editLinkedin}
                            onChange={(e) => setEditLinkedin(e.target.value)}
                            placeholder="https://linkedin.com/in/..."
                            className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Engineering Skills (comma separated)</label>
                    <input
                        type="text"
                        value={editSkills}
                        onChange={(e) => setEditSkills(e.target.value)}
                        placeholder="Python, React, TypeScript, Node.js"
                        className="w-full px-3.5 py-2.5 border border-slate-202 bg-slate-50 dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="submit"
                        disabled={saveLoading}
                        className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white text-xs font-bold rounded-xl shadow transition"
                    >
                        {saveLoading ? 'Saving Profile Details...' : 'Save Profile Details'}
                    </button>
                </div>
            </form>
        </div>
    );

    const filteredTasks = taskProgresses.filter((task) => {
        // filter by search query
        if (taskSearchQuery) {
            const query = taskSearchQuery.toLowerCase();
            const titleMatch = task.internship_tasks?.title?.toLowerCase().includes(query) || false;
            const descMatch = task.internship_tasks?.description?.toLowerCase().includes(query) || false;
            if (!titleMatch && !descMatch) return false;
        }

        // filter by status
        if (taskFilter === 'all') return true;
        if (taskFilter === 'completed') return task.status === 'approved';
        if (taskFilter === 'pending') return task.status === 'submitted' || task.status === 'resubmission_required';
        if (taskFilter === 'ongoing') return task.status !== 'approved' && task.status !== 'submitted';
        if (taskFilter === 'overdue') return false; // Overdue is mocked empty

        return true;
    }).sort((a, b) => {
        const numA = a.internship_tasks?.task_number || 0;
        const numB = b.internship_tasks?.task_number || 0;
        return taskSort === 'asc' ? numA - numB : numB - numA;
    });

    return (
        <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col">
            <ToastContainer toasts={toasts} dismiss={dismiss} />



            {/* Top Navigation Bar / Replaced Sidebar */}
            <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md border-slate-200/80 dark:bg-slate-950/80 dark:border-slate-800/80 shadow-sm no-print">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo & Brand */}
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate('/')} className="flex items-center hover:opacity-90 transition cursor-pointer shrink-0">
                                <img
                                    src={window.location.origin + import.meta.env.BASE_URL + 'vinix-title.png'}
                                    alt="Vinix"
                                    className="h-7 sm:h-8 w-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:invert transition-all duration-300"
                                />
                            </button>

                            {/* Desktop Nav Links */}
                            <div className="hidden lg:flex items-center space-x-7 ml-8">
                                <button onClick={() => setActiveTab('overview')} className={`flex items-center space-x-2 text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                                    <Home className="w-[18px] h-[18px]" />
                                    <span>Home</span>
                                </button>

                                <button onClick={() => setActiveTab('overview')} className={`flex items-center space-x-2 text-sm font-semibold transition-colors text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400`}>
                                    <ClipboardList className="w-[18px] h-[18px]" />
                                    <span>My Tasks</span>
                                </button>

                                <button onClick={() => navigate('/internships')} className={`flex items-center space-x-2 text-sm font-semibold transition-colors text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400`}>
                                    <Briefcase className="w-[18px] h-[18px]" />
                                    <span>My Internships</span>
                                </button>

                                <button onClick={() => setActiveTab('payment')} className={`flex items-center space-x-2 text-sm font-semibold transition-colors ${activeTab === 'payment' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                                    <CreditCard className="w-[18px] h-[18px]" />
                                    <span>Payment</span>
                                </button>

                                <button onClick={() => { if (activeEnrollment) setActiveTab('certificates'); else showToast('Please register/enroll in an active internship track first.', 'warning'); }} className={`flex items-center space-x-2 text-sm font-semibold transition-colors ${activeTab === 'certificates' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                                    <Award className="w-[18px] h-[18px]" />
                                    <span>Certificates</span>
                                </button>

                                <button onClick={() => setActiveTab('settings')} className={`flex items-center space-x-2 text-sm font-semibold transition-colors ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                                    <User className="w-[18px] h-[18px]" />
                                    <span>Profile</span>
                                </button>

                                <button className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] text-sm font-bold transition shadow-md shadow-blue-500/20 ml-2">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Review</span>
                                </button>
                            </div>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition shadow-sm">
                                <LogOut className="w-4 h-4 text-slate-400" />
                                <span>Logout</span>
                            </button>

                            <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-700">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-slate-500">{profile?.full_name?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 pr-2">{profile?.full_name?.split(' ')[0] || 'User'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Scrollable Nav */}
                <div className="lg:hidden flex overflow-x-auto gap-5 px-4 py-3 bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 no-scrollbar">
                    <button onClick={() => setActiveTab('overview')} className={`shrink-0 flex items-center space-x-1.5 text-xs font-bold transition-colors ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300'}`}>
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                    </button>
                    <button onClick={() => setActiveTab('overview')} className={`shrink-0 flex items-center space-x-1.5 text-xs font-bold transition-colors text-slate-600 dark:text-slate-300`}>
                        <ClipboardList className="w-4 h-4" />
                        <span>My Tasks</span>
                    </button>
                    <button onClick={() => navigate('/internships')} className={`shrink-0 flex items-center space-x-1.5 text-xs font-bold transition-colors text-slate-600 dark:text-slate-300`}>
                        <Briefcase className="w-4 h-4" />
                        <span>My Internships</span>
                    </button>
                    <button onClick={() => setActiveTab('payment')} className={`shrink-0 flex items-center space-x-1.5 text-xs font-bold transition-colors ${activeTab === 'payment' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300'}`}>
                        <CreditCard className="w-4 h-4" />
                        <span>Payment</span>
                    </button>
                    <button onClick={() => { if (activeEnrollment) setActiveTab('certificates'); else showToast('Please register/enroll in an active internship track first.', 'warning'); }} className={`shrink-0 flex items-center space-x-1.5 text-xs font-bold transition-colors ${activeTab === 'certificates' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300'}`}>
                        <Award className="w-4 h-4" />
                        <span>Certificates</span>
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`shrink-0 flex items-center space-x-1.5 text-xs font-bold transition-colors ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300'}`}>
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                    </button>
                </div>
            </nav>

            {/* Main Content Pane */}
            <div className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
                {!activeEnrollment ? (
                    <div className="space-y-6 text-left">
                        {activeTab === 'settings' ? (
                            renderSettingsTab()
                        ) : pendingEnrollment ? (
                            /* Application submitted — awaiting admin approval */
                            <div className="bg-white dark:bg-brand-cardDark border border-amber-200 dark:border-amber-800/50 rounded-[24px] p-12 text-center flex flex-col items-center justify-center shadow-sm select-none gap-4">
                                <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                                    <span className="text-3xl">⏳</span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Application Under Review</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                                    Your internship application for <strong className="text-slate-700 dark:text-slate-300">{pendingEnrollment?.internship?.title || 'Virtual Internship'}</strong> has been submitted successfully and is awaiting admin approval.
                                </p>
                                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl px-5 py-3">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">Pending Admin Approval — You'll be notified once approved</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">You can close this window. Your application is saved.</p>
                            </div>
                        ) : (
                            <>
                                {/* Launch Card */}
                                <div className="bg-white dark:bg-brand-cardDark border border-slate-200 dark:border-slate-800/80 rounded-[24px] p-12 text-center flex flex-col items-center justify-center shadow-sm select-none">
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Launch an Internship Track</h2>
                                    <p className="text-xs text-slate-400 mt-2 max-w-md">
                                        You are not registered in any active learning / internship domains.
                                    </p>
                                    <button
                                        onClick={() => navigate('/internships')}
                                        className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/25 flex items-center gap-1.5"
                                    >
                                        <span>Apply Internship</span>
                                    </button>
                                </div>

                                {/* Referral Banner */}
                                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 rounded-[20px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                                    <div className="flex items-center space-x-3 text-left">
                                        <span className="text-xl">🔥</span>
                                        <p className="text-xs text-slate-600 dark:text-slate-350 font-bold">
                                            Enjoying Vinix? Share dynamic referral with developer friends!
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.origin);
                                            showToast('Referral link copied to clipboard!', 'success');
                                        }}
                                        className="px-4 py-2 border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-50/50 text-xs transition flex items-center gap-1.5"
                                    >
                                        <span>Copy Link</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Quest Log Header */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-blue-650" />
                                            <span>Quest Log</span>
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 text-slate-500 uppercase tracking-wide">
                                            Checklist
                                        </span>
                                    </div>

                                    {/* LinkedIn post card */}
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/55 dark:border-slate-805/70 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row gap-6 relative select-none">
                                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Linkedin className="w-7 h-7 text-blue-600 fill-white" />
                                        </div>

                                        <div className="flex-1 text-left space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                                                    Mandatory Checklist: Offer & Social Post
                                                </h4>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded bg-blue-100/50 border border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900/50 text-[9px] font-bold uppercase tracking-wider">
                                                        AVAILABLE
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-500 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/50 text-[9px] font-bold uppercase tracking-wider">
                                                        Immediate Action
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-[10px] text-slate-400 capitalize tracking-wider font-extrabold">
                                                Due Date: Immediate Submission
                                            </p>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                                Download offer letter, verify with a professional LinkedIn post tagging @Vinix. and submit post URL.
                                            </p>

                                            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                                                <button
                                                    disabled
                                                    className="px-4 py-2 bg-slate-100 text-slate-400 dark:bg-slate-850 dark:text-slate-655 rounded-xl text-xs font-semibold select-none cursor-not-allowed"
                                                >
                                                    Offer Letter Unissued
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        showToast('No offer letter issued yet. Please register or enroll first.', 'warning');
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/25 flex items-center gap-1.5"
                                                >
                                                    <Linkedin className="w-3.5 h-3.5 fill-white" />
                                                    <span>2. Submit LinkedIn Post URL</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Profile dashboard banner header */}
                        <div className="bg-[#0b2742] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0e3052] to-[#06182c] border border-[#1a3a5a] text-white rounded-[32px] p-5 sm:p-7 shadow-xl mb-8 flex flex-col gap-5 sm:gap-6 relative overflow-hidden select-none no-print">
                            {/* Grid overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

                            {/* ROW 1: Top section with avatar, name, and progress */}
                            <div className="flex flex-row items-center justify-between z-10 w-full gap-2 sm:gap-4 relative">
                                <div className="flex items-center gap-3 sm:gap-5">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[28%] border-[2px] sm:border-[3px] border-[#1d436a] bg-slate-800 overflow-hidden flex items-center justify-center shadow-md">
                                            {profile?.avatar_url ? (
                                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl sm:text-2xl font-extrabold text-white/50">{profile?.full_name?.charAt(0) || 'I'}</span>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-7 sm:h-7 bg-[#10b981] rounded-full border-[2px] sm:border-[3px] border-[#0a233a] flex items-center justify-center shadow-lg">
                                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                        </div>
                                    </div>

                                    {/* Name Column */}
                                    <div className="flex flex-col">
                                        <div className="inline-flex max-w-fit items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 bg-white/10 border border-white/10 rounded-full text-[8px] sm:text-[10px] uppercase font-extrabold tracking-widest text-[#f59e0b] mb-1 shadow-sm">
                                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#facc15] fill-[#facc15]" />
                                            <span>WELCOME INTERN</span>
                                        </div>

                                        <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white mb-1 leading-none">
                                            {activeOffer?.student_name || profile?.full_name || 'Intern'}
                                        </h1>

                                        <div className="flex flex-wrap sm:flex-row sm:items-center gap-2">
                                            <span className="text-[11px] sm:text-[15px] font-extrabold text-[#38bdf8]">
                                                {activeEnrollment?.internship?.title || 'Virtual Internship'}
                                            </span>
                                            {activeOffer?.offer_letter_id && (
                                                <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 bg-[#153451] border border-[#204467] rounded flex-shrink-0 text-[9px] sm:text-[11px] font-semibold text-white/70">
                                                    <span>ID: {activeOffer.offer_letter_id}</span>
                                                    <ClipboardList className="w-2.5 h-2.5 sm:w-3 sm:h-3 cursor-pointer text-white/40 hover:text-white" onClick={() => navigator.clipboard.writeText(activeOffer.offer_letter_id)} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right circular progress */}
                                <div className="flex-shrink-0 flex flex-col items-center justify-center p-1 sm:p-2 z-10 bg-[#163654] border border-[#204467] rounded-[18px] sm:rounded-2xl shadow-inner max-w-fit px-2 sm:px-4 py-2 sm:py-3 mr-1">
                                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" className="stroke-[#0b2742]" strokeWidth="12" fill="transparent" />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                className="stroke-[#2dd4bf] transition-all duration-500 ease-out drop-shadow-[0_0_6px_rgba(45,212,191,0.5)]"
                                                strokeWidth="12"
                                                strokeDasharray={2 * Math.PI * 40}
                                                strokeDashoffset={2 * Math.PI * 40 * (1 - dynamicProgress / 100)}
                                                strokeLinecap="round"
                                                fill="transparent"
                                            />
                                        </svg>
                                        <div className="absolute flex items-center justify-center">
                                            <span className="text-[12px] sm:text-[16px] font-black text-white leading-none">{dynamicProgress}%</span>
                                        </div>
                                    </div>
                                    <span className="text-[8px] sm:text-[10px] text-[#2dd4bf] font-extrabold uppercase tracking-widest mt-1 sm:mt-2">Progress</span>
                                </div>
                            </div>

                            {/* ROW 2: Enrolled and Duration */}
                            <div className="flex flex-row items-center justify-between sm:justify-start bg-[#153451] border border-[#204467] rounded-[16px] px-3 sm:px-6 py-2.5 sm:py-3.5 z-10 gap-3 sm:gap-6">
                                <div className="flex items-center gap-1.5 sm:gap-2.5">
                                    <CalendarDays className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#38bdf8]" />
                                    <span className="text-[10px] sm:text-[14px] text-white/80 font-medium tracking-wide">
                                        Enrolled: <span className="font-bold text-white">{activeOffer ? new Date(activeOffer.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '21 Jul 2026'}</span>
                                    </span>
                                </div>
                                <div className="w-px h-5 sm:h-6 bg-[#204467]"></div>
                                <div className="flex items-center gap-1.5 sm:gap-2.5">
                                    <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#38bdf8]" />
                                    <span className="text-[10px] sm:text-[14px] text-white/80 font-medium tracking-wide">
                                        Duration: <span className="font-bold text-white">{activeOffer?.duration || '3 Months'}</span>
                                    </span>
                                </div>
                            </div>

                            {/* ROW 3: Action Grid Buttons */}
                            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 z-10 w-full mt-1">
                                <button className="flex flex-col items-center justify-center px-1 py-3 sm:p-4 bg-[#14304c] hover:bg-[#1a3a5a] border border-[#1f4060] rounded-[16px] sm:rounded-[20px] transition-colors group">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#1e4873] group-hover:bg-[#2a5b8c] flex items-center justify-center mb-1.5 sm:mb-3 transition-colors shadow-inner">
                                        <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#3b82f6]" />
                                    </div>
                                    <span className="text-[9px] sm:text-xs font-bold text-white/90">View Offer</span>
                                </button>

                                <button onClick={handleDownloadOfferLetterDirect} disabled={downloadingOffer} className="flex flex-col items-center justify-center px-1 py-3 sm:p-4 bg-[#14304c] hover:bg-[#1a3a5a] border border-[#1f4060] rounded-[16px] sm:rounded-[20px] transition-colors group">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#1e4873] group-hover:bg-[#2a5b8c] flex items-center justify-center mb-1.5 sm:mb-3 transition-colors shadow-inner">
                                        <FileDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#3b82f6]" />
                                    </div>
                                    <span className="text-[9px] sm:text-xs font-bold text-white/90">{downloadingOffer ? 'Downloading' : 'Offer Letter'}</span>
                                </button>

                                <button onClick={() => { setActiveTab('idcard'); setTimeout(() => handleIdCardPrint(), 100); }} className="flex flex-col items-center justify-center px-1 py-3 sm:p-4 bg-[#14304c] hover:bg-[#1a3a5a] border border-[#1f4060] rounded-[16px] sm:rounded-[20px] transition-colors group">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#1e4873] group-hover:bg-[#2a5b8c] flex items-center justify-center mb-1.5 sm:mb-3 transition-colors shadow-inner">
                                        <Printer className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#10b981]" />
                                    </div>
                                    <span className="text-[9px] sm:text-xs font-bold text-white/90">ID Card</span>
                                </button>

                                <button onClick={() => { if (certificates.length > 0) handleDownloadCertificateDirect(certificates[0]) }} disabled={downloadingCert} className={`flex flex-col items-center justify-center px-1 py-3 sm:p-4 rounded-[16px] sm:rounded-[20px] transition-colors group ${certificates.length > 0 ? 'bg-[#0f443b] hover:bg-[#125348] border border-[#176d5e]' : 'bg-[#14304c] hover:bg-[#1a3a5a] border border-[#1f4060] opacity-90'}`}>
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#135d51] group-hover:bg-[#197566] flex items-center justify-center mb-1.5 sm:mb-3 transition-colors shadow-inner">
                                        <Award className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#10b981]" />
                                    </div>
                                    <span className="text-[9px] sm:text-xs font-bold text-white/90">{downloadingCert ? 'Downloading' : 'Certificate'}</span>
                                </button>
                            </div>

                            {/* ROW 4: Social Action Buttons */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 z-10 w-full mt-1">
                                <a href="https://whatsapp.com/channel/0029Vb8nHh8LdQeYcWSNzi0i" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-3.5 bg-gradient-to-r from-[#20B050] to-[#25D366] hover:opacity-90 text-white text-[11px] sm:text-[14px] font-extrabold rounded-[16px] sm:rounded-[20px] transition shadow-lg shadow-[#25d366]/20">
                                    <MessageSquare className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                    <span>WhatsApp Group</span>
                                </a>
                                <a href="https://www.instagram.com/vinix_technology?stkn=aThjaGhjMW1zODdr" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-3.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] hover:opacity-90 text-white text-[11px] sm:text-[14px] font-extrabold rounded-[16px] sm:rounded-[20px] transition shadow-lg shadow-[#fd1d1d]/20">
                                    <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                                    <span>Instagram</span>
                                </a>
                            </div>
                        </div>

                        {/* Tab displays */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">

                                {/* 100% Completion Payment Prompt Banner */}
                                {dynamicProgress === 100 && activeEnrollment && !activeEnrollment.application_status?.startsWith('PAYMENT_') && !activeEnrollment.application_status?.startsWith('ISSUED:') && certificates.length === 0 && (
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-lg relative overflow-hidden text-left animate-fade-in-up">
                                        <div className="hidden sm:flex absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                                            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                                        </div>
                                        <div className="p-4 bg-white/20 rounded-2xl flex-shrink-0 backdrop-blur-md">
                                            <Award className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1 text-white z-10">
                                            <h3 className="text-xl font-black mb-1">Congratulations! You've completed all tasks!</h3>
                                            <p className="text-sm text-blue-100 font-medium">
                                                Your internship progress is at 100%. Please complete your certificate processing fee to receive your verified completion certificate.
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 z-10 w-full sm:w-auto">
                                            <button
                                                onClick={() => setActiveTab('payment')}
                                                className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-600 hover:bg-blue-50 text-sm font-bold rounded-xl shadow-lg shadow-black/10 transition-colors"
                                            >
                                                Go To Payment Page
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {dynamicProgress === 100 && activeEnrollment?.application_status?.startsWith('PAYMENT_PENDING') && certificates.length === 0 && (
                                    <div className="bg-gradient-to-r from-amber-500 to-amber-400 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-lg relative overflow-hidden text-left animate-fade-in-up">
                                        <div className="p-4 bg-white/20 rounded-2xl flex-shrink-0 backdrop-blur-md">
                                            <svg className="w-8 h-8 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        </div>
                                        <div className="flex-1 text-white z-10">
                                            <h3 className="text-xl font-black mb-1">Payment Under Verification</h3>
                                            <p className="text-sm text-amber-50 font-medium">
                                                Your payment UTR has been submitted and is currently being verified by an Admin. Check back shortly!
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {dynamicProgress === 100 && (activeEnrollment?.application_status?.startsWith('ISSUED:') || certificates.length > 0) && (
                                    <div className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-lg relative overflow-hidden text-left animate-fade-in-up">
                                        <div className="hidden sm:flex absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                                            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                                        </div>
                                        <div className="p-4 bg-white/20 rounded-2xl flex-shrink-0 backdrop-blur-md">
                                            <Award className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1 text-white z-10">
                                            <h3 className="text-xl font-black mb-1">Admin Successfully Verified 🎉</h3>
                                            <p className="text-sm text-emerald-100 font-medium">
                                                Your payment and tasks have been verified. Download your verified completion certificate!
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 z-10 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleDownloadCertificateDirect(certificates[0])}
                                                className="w-full sm:w-auto px-8 py-3.5 bg-white text-[#16a34a] hover:bg-emerald-50 text-sm font-bold rounded-xl shadow-lg shadow-black/10 transition-colors"
                                            >
                                                Download Certificate
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Overview cards stats banner */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    {/* Card 1: Approved Tasks */}
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/60 dark:border-slate-805/70 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 uppercase tracking-wide">
                                                COMPLETED TASKS
                                            </span>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                                                {approvedCount} / {totalTaskCount || taskProgresses.length}
                                            </h3>
                                            <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold uppercase tracking-wider">Approved Tasks</p>
                                        </div>
                                        <div className="p-3.5 bg-[#22c55e]/10 text-[#22c55e] rounded-2xl flex items-center justify-center shadow-sm">
                                            <CheckCircle className="w-7 h-7" />
                                        </div>
                                    </div>

                                    {/* Card 2: Submitted / Pending tasks */}
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/60 dark:border-slate-805/70 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 uppercase tracking-wide">
                                                SUBMITTED TASKS
                                            </span>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                                                {taskProgresses.filter(p => p.status === 'submitted' || p.status === 'pending').length}
                                            </h3>
                                            <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold uppercase tracking-wider">Pending Review</p>
                                        </div>
                                        <div className="p-3.5 bg-[#f59e0b]/10 text-[#f59e0b] rounded-2xl flex items-center justify-center shadow-sm">
                                            <Clock className="w-7 h-7" />
                                        </div>
                                    </div>

                                    {/* Card 3: Download verified certificate */}
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/60 dark:border-slate-805/70 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/20 uppercase tracking-wide">
                                                DOWNLOAD PDF
                                            </span>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2 truncate max-w-[160px]">
                                                {certificates.length > 0 ? 'Issued' : 'Evaluation Active'}
                                            </h3>
                                            <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold uppercase tracking-wider">Verified Certificate</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (certificates.length > 0) {
                                                    navigate('/verify/' + certificates[0].certificate_number);
                                                } else {
                                                    setActiveTab('certificates');
                                                }
                                            }}
                                            className="p-3.5 bg-[#ec4899]/10 hover:bg-[#ec4899]/20 text-[#ec4899] rounded-2xl flex items-center justify-center shadow-sm transition border border-transparent hover:border-[#ec4899]/20"
                                        >
                                            <Award className="w-7 h-7" />
                                        </button>
                                    </div>
                                </div>

                                {/* Certificate Status Banners */}
                                {activeEnrollment?.application_status?.startsWith('PAYMENT_') && (
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center space-x-3 text-left">
                                            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Payment Successful</h4>
                                                <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">
                                                    Your certificate request has been submitted for admin verification.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeEnrollment?.application_status?.startsWith('ISSUED:') && certificates.length > 0 && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center space-x-3 text-left">
                                            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 flex items-center justify-center">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                                    ✓ Certificate Issued
                                                </h4>
                                                <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">
                                                    Your certificate has been successfully verified and issued. <b>Certificate ID: {certificates[0]?.certificate_number}</b>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => navigate('/verify/' + certificates[0]?.certificate_number)}
                                                className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-lg transition"
                                            >
                                                View Certificate
                                            </button>
                                            <button
                                                onClick={() => handleDownloadCertificateDirect(certificates[0])}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                                            >
                                                Download Certificate
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Offer Letter Action Status Banner */}
                                {activeOffer && activeOffer.status !== 'ACCEPTED' && (
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center space-x-3 text-left">
                                            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 flex items-center justify-center">
                                                <FileCode className="w-6 h-6 animate-pulse" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Pending Internship Offer Letter</h4>
                                                <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">
                                                    Review and accept your generated offer letter for the <b>{activeOffer.internship_title}</b> track to unlock tasks.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleApplyOfferStatus(activeOffer.id, 'ACCEPTED')}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow"
                                            >
                                                Accept Offer
                                            </button>
                                            <button
                                                onClick={() => handleApplyOfferStatus(activeOffer.id, 'DECLINED')}
                                                className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl transition"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Offer Letter accepted but Workspace locked (LinkedIn requirement) */}
                                {activeOffer && activeOffer.status === 'ACCEPTED' && !hasUnlockedInternship && (
                                    <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="space-y-2 max-w-2xl text-left">
                                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wide">
                                                Action Required
                                            </span>
                                            <h4 className="text-lg font-bold">Post Offer to LinkedIn & Unlock Tasks</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Great! You've accepted the offer. To unlock intermediate milestones, share your selection announcement on LinkedIn, tag <b>VINIX</b>, and submit the link below.
                                            </p>

                                            <form
                                                onSubmit={(e) => {
                                                    const lp = taskProgresses.find(p => p.internship_tasks?.task_number === 1);
                                                    if (lp) handleLinkedInVerificationSubmit(e, lp.id);
                                                }}
                                                className="flex gap-2 max-w-md pt-2"
                                            >
                                                <input
                                                    type="url"
                                                    required
                                                    value={linkedinUrl}
                                                    onChange={(e) => setLinkedinUrl(e.target.value)}
                                                    placeholder="Paste LinkedIn post URL here..."
                                                    className="flex-1 px-3 py-2 text-xs border border-slate-200 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-brand-primary"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={submittingLinkedin}
                                                    className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-xs font-bold transition shadow"
                                                >
                                                    Verify Post
                                                </button>
                                            </form>
                                        </div>

                                        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-850 flex items-center justify-center max-w-[200px]">
                                            <Linkedin className="w-16 h-16 text-blue-500 fill-white" />
                                        </div>
                                    </div>
                                )}

                                {/* Workspace Tasks Grid (Same Size Tasks Layout) */}
                                <div className="mt-12 space-y-6">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="relative w-full max-w-lg shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={taskSearchQuery}
                                                onChange={(e) => setTaskSearchQuery(e.target.value)}
                                                placeholder="Search tasks..."
                                                className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-[14px] leading-5 bg-white dark:bg-brand-cardDark text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-primary sm:text-sm transition-colors font-medium placeholder-slate-400"
                                            />
                                        </div>
                                        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-full shadow-sm">
                                            <button onClick={() => setTaskFilter('all')} className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${taskFilter === 'all' ? 'bg-[#0f2942] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>All</button>
                                            <button onClick={() => setTaskFilter('completed')} className={`px-4 py-2.5 rounded-full text-xs font-bold transition ${taskFilter === 'completed' ? 'bg-[#0f2942] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Completed</button>
                                            <button onClick={() => setTaskFilter('ongoing')} className={`px-4 py-2.5 rounded-full text-xs font-bold transition ${taskFilter === 'ongoing' ? 'bg-[#0f2942] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Ongoing</button>
                                            <button onClick={() => setTaskFilter('pending')} className={`px-4 py-2.5 rounded-full text-xs font-bold transition ${taskFilter === 'pending' ? 'bg-[#0f2942] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Pending</button>
                                            <button onClick={() => setTaskFilter('overdue')} className={`px-4 py-2.5 rounded-full text-xs font-bold transition ${taskFilter === 'overdue' ? 'bg-[#0f2942] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Overdue</button>
                                            <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                            <button onClick={() => setTaskSort(prev => prev === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-1.5 px-4 py-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition">
                                                <svg className={`w-4 h-4 transition-transform ${taskSort === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
                                                Sort
                                            </button>
                                        </div>
                                    </div>

                                    {filteredTasks.length === 0 ? (
                                        <div className="bg-white dark:bg-brand-cardDark border border-slate-205 dark:border-slate-805 rounded-3xl p-12 text-center shadow-sm">
                                            <Layers className="w-12 h-12 text-slate-350 mx-auto mb-4" />
                                            <h3 className="text-base font-bold">No tasks matched your filter criteria</h3>
                                            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                                                Try adjusting your search query or switching filters to see other tasks.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                                            {filteredTasks.map((task, idx) => {
                                                const isTaskApproved = task.status === 'approved';
                                                const isLinkedInTask = task.internship_tasks?.task_number === 1;
                                                const isLocked = !isLinkedInTask && !hasUnlockedInternship;

                                                const isSuccess = isTaskApproved;
                                                const isSubmitted = task.status === 'submitted';
                                                const isResubmitRequired = task.status === 'resubmission_required';

                                                return (
                                                    <div
                                                        key={task.id}
                                                        className={`bg-white dark:bg-brand-cardDark rounded-3xl p-6 shadow-sm flex flex-col justify-between border-y border-r border-l-[6px] transition-all duration-200 
                                                        ${isSuccess ? 'border-l-[#22c55e] border-t-slate-200 border-r-slate-200 border-b-slate-200' : isResubmitRequired ? 'border-l-amber-500 border-t-slate-200 border-r-slate-200 border-b-slate-200 shadow-md transform hover:-translate-y-1' : isLocked ? 'border-l-slate-300 border-y-slate-200 border-r-slate-200 opacity-60 pointer-events-none' : 'border-l-brand-primary border-y-slate-200 border-r-slate-200 shadow-md transform hover:-translate-y-1'}`}
                                                    >

                                                        {/* Top row */}
                                                        <div className="flex justify-between items-center mb-5">
                                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${isSuccess ? 'bg-[#22c55e]/15 text-[#22c55e]' : isLinkedInTask ? 'bg-blue-50 text-blue-500' : isResubmitRequired ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50' : 'bg-[#e0e7ff] text-brand-primary'}`}>
                                                                {isLinkedInTask ? <Linkedin className="w-5 h-5 fill-current" /> : (task.internship_tasks?.task_number || (idx + 1))}
                                                            </div>
                                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${isSuccess ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : isResubmitRequired ? 'bg-amber-50 text-amber-600 border border-amber-200' : isSubmitted ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                                                {isSuccess ? <CheckCircle className="w-3.5 h-3.5" /> : isResubmitRequired ? <RotateCcw className="w-3.5 h-3.5" /> : isSubmitted ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 opacity-50" />}
                                                                <span>{isSuccess ? 'Completed' : isResubmitRequired ? 'Resubmit' : isSubmitted ? 'Under Review' : 'Locked'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Meta */}
                                                        <div className="space-y-1.5 mb-5 select-none">
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                                <CalendarDays className="w-3.5 h-3.5" />
                                                                <span>Due Date: <span className="font-bold text-slate-800">21 Sept 2026</span></span>
                                                            </div>
                                                            {isSuccess ? (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#22c55e] uppercase tracking-wide">
                                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                                    <span>Submitted on track</span>
                                                                </div>
                                                            ) : isResubmitRequired ? (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                                    <span>Changes Requested &mdash; Resubmit Required</span>
                                                                </div>
                                                            ) : isSubmitted ? (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    <span>Under Review</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    <span>Waiting for Submission</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Title & Desc */}
                                                        <div className="flex-1 space-y-4 mb-5 relative">
                                                            <h4 className="text-[17px] font-black text-slate-800 dark:text-white leading-snug">
                                                                {task.internship_tasks?.title}
                                                            </h4>
                                                            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                                                {task.internship_tasks?.description || 'Build your professional online presence and learn full-stack deployment workflows.'}
                                                            </p>

                                                            {/* Evaluator feedback note if resubmission required */}
                                                            {isResubmitRequired && task.admin_feedback && (
                                                                <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-left">
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                                        <span>Evaluator Feedback:</span>
                                                                    </div>
                                                                    <p className="text-[12px] text-slate-700 dark:text-slate-300 italic leading-snug">
                                                                        "{task.admin_feedback}"
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Mock key features and expected outcome as per layout request */}
                                                            <div className="space-y-3 mt-4 border-t border-slate-100 pt-4 px-1">
                                                                <div>
                                                                    <h5 className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-1">Key Features:</h5>
                                                                    <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                                                                        <li>Responsive component layout</li>
                                                                        <li>Modern aesthetics and CSS handling</li>
                                                                    </ul>
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-[10px] font-extrabold text-[#22c55e] uppercase tracking-widest mb-1">Expected Outcome:</h5>
                                                                    <p className="text-[11px] text-slate-500 line-clamp-3">
                                                                        Build an application demonstrating an understanding of frontend logic, database integration, and UI principles.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Bottom actions */}
                                                        <div className="mt-auto pt-2">
                                                            {isLocked ? (
                                                                <div className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2 border border-slate-200">
                                                                    <span>Complete previous task</span>
                                                                </div>
                                                            ) : isSuccess ? (
                                                                <div className="w-full py-3 bg-[#e8fbf0] text-[#1e8d47] rounded-2xl text-center text-[13px] font-extrabold flex items-center justify-center gap-2 border border-[#22c55e]/30 shadow-sm shadow-[#22c55e]/10">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    <span>Completed Successfully!</span>
                                                                </div>
                                                            ) : isSubmitted ? (
                                                                <div className="w-full py-3 bg-blue-50 text-blue-600 rounded-2xl text-center text-[13px] font-extrabold flex items-center justify-center gap-2 border border-blue-200">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span>Awaiting Review...</span>
                                                                </div>
                                                            ) : isResubmitRequired ? (
                                                                isLinkedInTask ? (
                                                                    <form onSubmit={(e) => handleLinkedInVerificationSubmit(e, task.id)} className="flex flex-col gap-2">
                                                                        <input
                                                                            type="url"
                                                                            required
                                                                            value={linkedinUrl}
                                                                            onChange={(e) => setLinkedinUrl(e.target.value)}
                                                                            placeholder="Paste updated LinkedIn post URL..."
                                                                            className="w-full px-4 py-2.5 text-xs border border-amber-300 bg-amber-50/40 rounded-xl outline-none focus:border-amber-500 placeholder-slate-400 font-medium"
                                                                        />
                                                                        <button type="submit" disabled={submittingLinkedin} className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer">
                                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                                            <span>Resubmit & Verify Post</span>
                                                                        </button>
                                                                    </form>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setGithubUrl(task.github_url || '');
                                                                            setStudentNote(task.student_note || '');
                                                                            setProjectImageUrl(task.submission_url || '');
                                                                            setSelectedTaskForSubmission(task);
                                                                        }}
                                                                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white rounded-2xl text-[13px] font-bold transition shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
                                                                    >
                                                                        <RotateCcw className="w-4 h-4" />
                                                                        <span>Resubmit Project Solution</span>
                                                                    </button>
                                                                )
                                                            ) : isLinkedInTask ? (
                                                                <form onSubmit={(e) => handleLinkedInVerificationSubmit(e, task.id)} className="flex flex-col gap-2">
                                                                    <input
                                                                        type="url"
                                                                        required
                                                                        value={linkedinUrl}
                                                                        onChange={(e) => setLinkedinUrl(e.target.value)}
                                                                        placeholder="Paste LinkedIn post URL..."
                                                                        className="w-full px-4 py-2.5 text-xs border border-slate-300 bg-slate-50 rounded-xl outline-none focus:border-brand-primary placeholder-slate-400 font-medium"
                                                                    />
                                                                    <button type="submit" disabled={submittingLinkedin} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer">
                                                                        Submit & Verify Post
                                                                    </button>
                                                                </form>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setGithubUrl(task.github_url || '');
                                                                        setStudentNote(task.student_note || '');
                                                                        setProjectImageUrl(task.submission_url || '');
                                                                        setSelectedTaskForSubmission(task);
                                                                    }}
                                                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl text-[13px] font-bold transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                                                                >
                                                                    <ArrowRight className="w-4 h-4" />
                                                                    <span>Submit Project Repository</span>
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
                        )}



                        {/* Tab display: virtual student ID card */}
                        {activeTab === 'idcard' && (
                            <div className="space-y-6">
                                <div className="border-b border-slate-205 dark:border-slate-805 pb-4 no-print">
                                    <h2 className="text-xl font-bold flex items-center space-x-2">
                                        <CreditCard className="w-5 h-5 text-brand-primary" />
                                        <span>Virtual Internship ID Card</span>
                                    </h2>
                                    <p className="text-xs text-slate-450 mt-0.5">
                                        Download your official intern badge. Keep it printed during remote meetings.
                                    </p>
                                </div>

                                {/* HIGH FIDELITY ID CARD BODY */}
                                <div className="flex flex-col items-center justify-center py-6">

                                    <div
                                        id="id-card-print-area"
                                        className="w-72 aspect-[0.63] rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-[14px] flex flex-col justify-between relative overflow-hidden select-none"
                                    >
                                        {/* Double border frame line (matches the certificate and offer letter) */}
                                        <div className="absolute top-1.5 left-1.5 right-1.5 bottom-1.5 border border-[#0f2942]/10 rounded-[22px] pointer-events-none z-0"></div>
                                        <div className="absolute top-[9px] left-[9px] right-[9px] bottom-[9px] border-[0.5px] border-[#cca353]/35 rounded-[19px] pointer-events-none z-0"></div>

                                        {/* Elegant inner background glows */}
                                        <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-50/40 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="absolute top-1/2 -right-8 w-24 h-24 bg-indigo-50/30 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none"></div>

                                        {/* Header logo */}
                                        <div className="flex items-center justify-between z-10 border-b border-slate-100 pb-2">
                                            <div className="flex items-center space-x-1.5">
                                                <img
                                                    src={window.location.origin + import.meta.env.BASE_URL + 'vinix-title.png'}
                                                    alt="VINIX Logo"
                                                    className="h-6 w-auto object-contain"
                                                />
                                            </div>
                                            <span className="text-[6px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 uppercase tracking-widest leading-none">
                                                INTERN IDENTITY
                                            </span>
                                        </div>

                                        {/* Main Photo Preset */}
                                        <div className="flex flex-col items-center justify-center text-center mt-3 z-10 space-y-2">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-slate-200 p-1 flex items-center justify-center relative overflow-hidden shadow-sm">
                                                {profile?.avatar_url ? (
                                                    <img
                                                        src={profile.avatar_url}
                                                        alt={profile.full_name || 'Intern'}
                                                        className="w-full h-full object-cover rounded-[12px]"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-blue-50/50 text-blue-900 rounded-[12px] flex items-center justify-center font-sans font-bold text-3xl">
                                                        {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-[#0f2942] font-black text-sm tracking-wide capitalize select-all">
                                                    {profile?.full_name || 'Vinix Candidate'}
                                                </h4>
                                                <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">
                                                    {activeEnrollment ? activeEnrollment.internship.title.split(' ')[0] : 'Junior'} Developer
                                                </p>
                                            </div>
                                        </div>

                                        {/* Details Box */}
                                        <div className="bg-slate-50/80 border border-slate-200/50 rounded-xl p-2.5 space-y-1.5 text-left z-10 text-[8.5px] font-medium font-sans">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 uppercase font-bold tracking-wider">INTERN ID</span>
                                                <span className="text-slate-800 font-mono font-bold select-all">
                                                    {activeOffer ? activeOffer.offer_letter_id : 'VINIX-PENDING'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center border-t border-slate-200/40 pt-1.5">
                                                <span className="text-slate-400 uppercase font-bold tracking-wider">COLLEGE</span>
                                                <span className="text-slate-800 truncate max-w-[130px] font-bold">{studentProfile?.college || 'Pending Info'}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-t border-slate-200/40 pt-1.5">
                                                <span className="text-slate-400 uppercase font-bold tracking-wider">DURATION</span>
                                                <span className="text-slate-800 font-bold">{activeEnrollment ? activeEnrollment.internship.duration : '3 Months'}</span>
                                            </div>
                                        </div>

                                        {/* Footer signature and MSME block */}
                                        <div className="z-10 pt-2 border-t border-slate-100 flex flex-col gap-2.5">
                                            {/* Row 1: QR Code, Signature, and MSME Logo */}
                                            <div className="flex justify-between items-end">
                                                {/* Left: QR Code */}
                                                <div className="bg-white p-0.5 rounded border border-slate-200 shadow-sm flex-shrink-0">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=45x45&data=${encodeURIComponent(
                                                            window.location.origin + `/verify/offer/${activeOffer?.offer_letter_id || 'verification'}`
                                                        )}`}
                                                        alt="verify QR"
                                                        className="w-9 h-9 object-contain"
                                                    />
                                                </div>

                                                {/* Center: Founder Signature */}
                                                <div className="flex flex-col items-center">
                                                    <img
                                                        src={window.location.origin + import.meta.env.BASE_URL + 'founder-sign.png'}
                                                        alt="Founder Signature"
                                                        className="h-6 w-auto object-contain"
                                                    />
                                                    <div className="w-16 h-[0.75px] bg-[#0f2942]/40 mt-1 mb-0.5"></div>
                                                    <span className="text-[5.5px] font-bold text-[#0f2942]/60 uppercase tracking-widest leading-none">Founder's Sign</span>
                                                </div>

                                                {/* Right: MSME Logo (Big Size) */}
                                                <div className="flex-shrink-0 flex items-center justify-end">
                                                    <img
                                                        src={window.location.origin + import.meta.env.BASE_URL + 'msme.jpeg'}
                                                        alt="MSME Logo"
                                                        className="h-10 w-auto object-contain"
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 2: Final Company Active Record Brand Footer */}
                                            <div className="flex justify-between items-center text-[5.5px] uppercase font-bold tracking-widest text-[#0f2942]/40 border-t border-slate-100/60 pt-1">
                                                <span>VINIX TECHNOLOGIES</span>
                                                <span className="text-[#cca353]">DATABASE ACTIVE RECORD</span>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Print Badges option */}
                                    <div className="mt-6 no-print">
                                        <button
                                            onClick={handleIdCardPrint}
                                            className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-205 text-xs font-bold rounded-xl transition flex items-center space-x-2"
                                        >
                                            <Printer className="w-4 h-4 text-brand-primary" />
                                            <span>Download / Print ID Card</span>
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Tab display: Payment (New Placeholder) */}
                        {activeTab === 'payment' && (
                            <div className="space-y-6">
                                {dynamicProgress === 100 && activeEnrollment && !activeEnrollment.application_status?.startsWith('PAYMENT_') && !activeEnrollment.application_status?.startsWith('ISSUED:') && certificates.length === 0 ? (
                                    <div className="w-full animate-fade-in-up">
                                        <div className="mb-6 text-left">
                                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                                                <CreditCard className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                                <span>Certificate Fee Payment</span>
                                            </h2>
                                            <p className="text-sm text-slate-500 mt-1">Scan the QR code or use the UPI ID below to pay the certification fee.</p>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                            {/* Left Column - Payment Details */}
                                            <div className="bg-white dark:bg-brand-cardDark border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Scan QR code via GPay, PhonePe, Paytm or BHIM</span>

                                                <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-3xl mb-6">
                                                    <img
                                                        src={window.location.origin + import.meta.env.BASE_URL + 'upi-qr.png'}
                                                        alt="UPI QR Code"
                                                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain mix-blend-multiply"
                                                    />
                                                </div>

                                                <a
                                                    href="upi://pay?pa=vr271028-1@okhdfcbank&pn=Vinix&am=100&cu=INR"
                                                    className="w-full sm:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition shadow flex items-center justify-center space-x-2 mb-6"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    <span>Pay via GPay / UPI App</span>
                                                </a>

                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Supported Payment Apps</span>
                                                <div className="flex items-center space-x-2 mb-8">
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded-full">GPay</span>
                                                    <span className="px-3 py-1 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-bold rounded-full">PhonePe</span>
                                                    <span className="px-3 py-1 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 text-xs font-bold rounded-full">Paytm</span>
                                                    <span className="px-3 py-1 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full">BHIM UPI</span>
                                                </div>

                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">UPI ID</span>
                                                <div className="w-full bg-slate-50 dark:bg-slate-900/50 py-3 rounded-xl border border-slate-100 dark:border-slate-800 text-sm font-mono font-bold text-slate-800 dark:text-slate-200 select-all tracking-wide mb-2">
                                                    vr271028-1@okhdfcbank
                                                </div>
                                                <span className="text-xs font-medium text-slate-500">Payee: <span className="font-bold text-slate-700 dark:text-slate-300">Vinix</span></span>
                                            </div>

                                            {/* Right Column - Verification Form */}
                                            <div className="space-y-6 flex flex-col h-full">
                                                <div className="bg-white dark:bg-brand-cardDark border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex-shrink-0 text-left">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Certification Fee</span>
                                                    <span className="text-3xl font-black text-emerald-500">₹100</span>
                                                </div>

                                                <div className="text-left">
                                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 block mb-2">UPI Transaction UTR / Reference Number *</label>
                                                    <input
                                                        type="text"
                                                        value={utrNumber}
                                                        onChange={(e) => setUtrNumber(e.target.value)}
                                                        placeholder="Enter the 12-digit UTR number from your payment"
                                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono outline-none shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                                                    />
                                                    <span className="text-[10px] font-medium text-slate-400 mt-2 block">You can find this in your UPI app payment history</span>
                                                </div>

                                                <div className="text-left flex-1 min-h-[100px]">
                                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 block mb-2">Payment Screenshot (Optional)</label>
                                                    <div className="w-full px-4 py-4 border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl flex items-center space-x-4">
                                                        <label className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition">
                                                            Choose File
                                                            <input type="file" accept="image/*" className="hidden" />
                                                        </label>
                                                        <span className="text-xs text-slate-400">No file chosen</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-4">
                                                    <button
                                                        onClick={handleProcessPayment}
                                                        disabled={processingPayment || !utrNumber || utrNumber.length < 5}
                                                        className="w-full py-4 bg-[#8eb9f0] hover:bg-[#6e9bdc] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                        <span>{processingPayment ? 'Processing...' : 'Pay Fee ₹100 & Verify'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="border-b border-slate-205 dark:border-slate-805 pb-4">
                                            <h2 className="text-xl font-bold flex items-center space-x-2">
                                                <CreditCard className="w-5 h-5 text-brand-primary" />
                                                <span>Payment Details</span>
                                            </h2>
                                            <p className="text-xs text-slate-450 mt-0.5">
                                                View and manage your internship stipends or premium certifications.
                                            </p>
                                        </div>
                                        <div className="bg-white dark:bg-brand-cardDark border border-slate-205 dark:border-slate-805 rounded-xl p-12 text-center shadow-sm">
                                            <CreditCard className="w-12 h-12 text-slate-350 mx-auto mb-4" />
                                            {activeEnrollment?.application_status?.startsWith('PAYMENT_PENDING') && certificates.length === 0 ? (
                                                <>
                                                    <h3 className="text-base font-bold text-amber-600">Payment Under Verification</h3>
                                                    <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                                                        Your payment is currently being reviewed by an admin. You will be notified once it is verified.
                                                    </p>
                                                </>
                                            ) : activeEnrollment?.application_status?.startsWith('ISSUED:') || activeEnrollment?.application_status?.startsWith('PAYMENT_VERIFIED') || certificates.length > 0 ? (
                                                <>
                                                    <h3 className="text-base font-bold text-[#22c55e]">Payment Verified</h3>
                                                    <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                                                        Your certificate processing fee was successfully verified. You can find your certificate in the Certificates tab.
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <h3 className="text-base font-bold">No payments due</h3>
                                                    <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                                                        Your payment portal has no pending fees. Complete all your tasks to unlock your certificate fee.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Tab display: Certificates */}
                        {activeTab === 'certificates' && (
                            <div className="space-y-6">
                                <div className="border-b border-slate-205 dark:border-slate-805 pb-4">
                                    <h2 className="text-xl font-bold flex items-center space-x-2">
                                        <Award className="w-5 h-5 text-brand-primary" />
                                        <span>Verified Certificates & Alumni Directory</span>
                                    </h2>
                                    <p className="text-xs text-slate-450 mt-0.5">
                                        Locate and verify your issued certificates. Shareable links represent blockchain-secure validity.
                                    </p>
                                </div>

                                {certificates.length === 0 ? (
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-205 dark:border-slate-805 rounded-xl p-12 text-center shadow-sm">
                                        <Award className="w-12 h-12 text-slate-350 mx-auto mb-4" />
                                        <h3 className="text-base font-bold">No certificates generated yet</h3>
                                        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                                            Once you complete all milestones and obtain mentor grading approval, your certificate will automatically post here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {certificates.map((cert) => (
                                            <div key={cert.id} className="bg-white dark:bg-brand-cardDark border border-slate-202 dark:border-slate-805 rounded-xl p-5 shadow-sm space-y-4 text-left">
                                                <div>
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-[9px] font-bold uppercase rounded-md">
                                                        {cert.status}
                                                    </span>
                                                    <h4 className="text-base font-bold text-slate-850 dark:text-white mt-2 capitalize">
                                                        {cert.course_name}
                                                    </h4>
                                                    <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {cert.certificate_number}</p>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-slate-405 border-t border-slate-100 dark:border-slate-850 pt-3">
                                                    <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleDownloadCertificateDirect(cert)}
                                                            disabled={downloadingCert}
                                                            className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold flex items-center space-x-1"
                                                        >
                                                            <FileDown className="w-3.5 h-3.5" />
                                                            <span>Download</span>
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/verify/${cert.certificate_number}`)}
                                                            className="text-brand-primary hover:text-brand-primary/80 dark:text-brand-accent dark:hover:text-brand-accent/90 font-bold flex items-center space-x-1"
                                                        >
                                                            <span>Verify</span>
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab display: Settings updates */}
                        {activeTab === 'settings' && (
                            <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto shadow-sm select-none">
                                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                                    <Settings className="w-5 h-5 text-brand-primary" />
                                    <span>Intern Profile Parameters</span>
                                </h3>

                                <form onSubmit={handleUpdateProfile} className="space-y-5 text-left">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Your Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">College/Institution</label>
                                        <input
                                            type="text"
                                            required
                                            value={editCollege}
                                            onChange={(e) => setEditCollege(e.target.value)}
                                            className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Biography / About Me</label>
                                        <textarea
                                            value={editBio}
                                            onChange={(e) => setEditBio(e.target.value)}
                                            placeholder="Share details about your stack, engineering passions..."
                                            className="w-full px-3.5 py-2.5 border border-slate-205 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none h-20"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">GitHub Profile Link</label>
                                            <input
                                                type="url"
                                                value={editGithub}
                                                onChange={(e) => setEditGithub(e.target.value)}
                                                placeholder="https://github.com/..."
                                                className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">LinkedIn Profile Link</label>
                                            <input
                                                type="url"
                                                value={editLinkedin}
                                                onChange={(e) => setEditLinkedin(e.target.value)}
                                                placeholder="https://linkedin.com/in/..."
                                                className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Engineering Skills (comma separated)</label>
                                        <input
                                            type="text"
                                            value={editSkills}
                                            onChange={(e) => setEditSkills(e.target.value)}
                                            placeholder="Python, React, TypeScript, Node.js"
                                            className="w-full px-3.5 py-2.5 border border-slate-202 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="submit"
                                            disabled={saveLoading}
                                            className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white text-xs font-bold rounded-xl shadow transition"
                                        >
                                            {saveLoading ? 'Saving Profile Details...' : 'Save Profile Details'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </>
                )}

            </div>

            {/* Modal / Dialog for Milestone Submission Form */}
            {
                selectedTaskForSubmission && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none">
                        <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
                            <h3 className="text-lg font-bold flex items-center space-x-2">
                                <FileCode className="w-5 h-5 text-brand-primary" />
                                <span>{selectedTaskForSubmission.status === 'resubmission_required' ? 'Resubmit Milestone Solution' : 'Submit Milestone Solution'}</span>
                            </h3>
                            <p className="text-xs text-brand-primary dark:text-brand-accent mt-1 uppercase font-bold tracking-wide">
                                {selectedTaskForSubmission.internship_tasks?.title}
                            </p>

                            {/* Evaluator feedback note if resubmitting */}
                            {selectedTaskForSubmission.status === 'resubmission_required' && selectedTaskForSubmission.admin_feedback && (
                                <div className="mt-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs">
                                    <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wide">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span>Evaluator Feedback:</span>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                        "{selectedTaskForSubmission.admin_feedback}"
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleMilestoneSubmission} className="mt-4 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                        GitHub Repository / Commit URL
                                    </label>
                                    <div className="relative">
                                        <Github className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input
                                            type="url"
                                            required
                                            value={githubUrl}
                                            onChange={(e) => setGithubUrl(e.target.value)}
                                            placeholder="https://github.com/username/project/commit/..."
                                            className="w-full pl-9 pr-3 py-2.5 border border-slate-205 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                        Submission Notes / Code Summary
                                    </label>
                                    <textarea
                                        required
                                        value={studentNote}
                                        onChange={(e) => setStudentNote(e.target.value)}
                                        placeholder={selectedTaskForSubmission.status === 'resubmission_required' ? "Describe the changes and fixes you made based on the evaluator feedback..." : "Describe your design choices, database schema config, or features completed..."}
                                        className="w-full px-3 py-2.5 border border-slate-205 bg-slate-50 dark:bg-slate-950 dark:border-slate-805 rounded-xl text-xs font-semibold focus:outline-none h-24"
                                    />
                                </div>

                                {/* Optional project image / preview URL */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1.5">
                                        Project Screenshot / Preview Image URL
                                        <span className="normal-case font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-[9px]">Optional</span>
                                    </label>
                                    <div className="relative">
                                        <svg className="absolute left-3 top-[10px] w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <input
                                            type="url"
                                            value={projectImageUrl}
                                            onChange={(e) => setProjectImageUrl(e.target.value)}
                                            placeholder="https://i.imgur.com/your-screenshot.png (optional)"
                                            className="w-full pl-9 pr-3 py-2.5 border border-slate-205 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        />
                                    </div>
                                    {projectImageUrl.trim() && (
                                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-32">
                                            <img
                                                src={projectImageUrl}
                                                alt="Project preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTaskForSubmission(null);
                                            setGithubUrl('');
                                            setStudentNote('');
                                            setProjectImageUrl('');
                                        }}
                                        disabled={submittingTask}
                                        className="flex-1 py-3 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 text-slate-650 dark:text-slate-350 dark:hover:bg-slate-850 text-xs font-bold rounded-xl transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingTask}
                                        className={`flex-1 py-3 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2 ${
                                            selectedTaskForSubmission.status === 'resubmission_required'
                                                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                                                : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95'
                                        }`}
                                    >
                                        {submittingTask ? (
                                            'Pushing Commit...'
                                        ) : selectedTaskForSubmission.status === 'resubmission_required' ? (
                                            <>
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                <span>Resubmit Solution</span>
                                            </>
                                        ) : (
                                            'Send Solution'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Hidden Offer Letter Component for Direct PDF Download */}
            {
                activeOffer && (
                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '794px', height: '1123px', overflow: 'hidden' }}>
                        <div
                            id="offer-letter-download-area"
                            className="bg-white select-text text-left overflow-hidden z-10 font-sans relative offer-letter mx-auto"
                            style={{
                                boxSizing: 'border-box',
                                width: '794px',
                                height: '1123px',
                                padding: '45px 50px',
                                color: '#0f172a',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                                position: 'relative'
                            }}
                        >
                            {/* Elegant background watermark */}
                            <div className="doc-watermark">VINIX TECHNOLOGIES</div>

                            {/* Decorative double-border frames */}
                            <div className="doc-frame-outer"></div>
                            <div className="doc-frame-inner"></div>

                            {/* Header Section */}
                            <div className="doc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '2px', zIndex: 2 }}>
                                <div className="header-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div className="header-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="header-logo" style={{ height: '36px', display: 'flex', alignItems: 'center' }}>
                                            <img src={window.location.origin + import.meta.env.BASE_URL + 'vinix-title.png'} alt="VINIX Logo" style={{ height: '100%', objectFit: 'contain' }} />
                                        </span>
                                        <div style={{ width: '1.5px', height: '28px', backgroundColor: '#cbd5e1' }}></div>
                                        <div className="header-branding-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <span className="company-name" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#0f2942', lineHeight: 1.1, letterSpacing: '0.5px' }}>VINIX</span>
                                            <span className="company-tagline" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, color: '#0284c7', letterSpacing: '0.5px', marginTop: '1px' }}>Empowering Future Innovators</span>
                                        </div>
                                    </div>
                                    <div className="company-contact-row" style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '5px', fontWeight: 550 }}>
                                        www.vinix.online | academic@vinix.online
                                    </div>
                                </div>
                                <div className="header-right" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div className="meta-item" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="meta-label" style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '1px' }}>INTERNSHIP ID</span>
                                        <span className="meta-value" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>{activeOffer.offer_letter_id}</span>
                                    </div>
                                    <div className="meta-item" style={{ marginTop: '5px', display: 'flex', flexDirection: 'column' }}>
                                        <span className="meta-label" style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '1px' }}>ISSUE DATE</span>
                                        <span className="meta-value" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>
                                            {new Date(activeOffer.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider Line */}
                            <div className="header-line" style={{ width: '100%', height: '1.5px', backgroundColor: '#e2e8f0', marginTop: '8px', marginBottom: '16px', zIndex: 2 }}></div>

                            {/* Body Content */}
                            <div className="doc-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', zIndex: 2 }}>
                                <h1 className="document-title" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#0f2942', marginBottom: '2px', letterSpacing: '0.2px' }}>INTERNSHIP OFFER LETTER</h1>
                                <div className="document-date" style={{ fontSize: '0.72rem', color: '#cca353', marginBottom: '15px', fontWeight: 600 }}>
                                    Date: {new Date(activeOffer.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>

                                <div className="greeting-block" style={{ fontSize: '0.73rem', color: '#334155', marginBottom: '8px' }}>
                                    Dear <strong>{activeOffer.student_name}</strong>,
                                </div>

                                <div className="intro-paragraph" style={{ fontSize: '0.72rem', lineHeight: '1.45', color: '#334155', marginBottom: '10px', textAlign: 'justify' }}>
                                    We are delighted to offer you the position of <strong>Virtual Intern – {activeOffer.internship_title}</strong> at <strong>Vinix Technologies</strong>. After reviewing your application, we are confident that your skills and enthusiasm make you a valuable addition to our program.
                                </div>

                                <div className="intro-sub-paragraph" style={{ fontSize: '0.72rem', lineHeight: '1.45', color: '#334155', marginBottom: '10px', textAlign: 'justify' }}>
                                    Your virtual internship details and key particulars are finalized as follows:
                                </div>

                                {/* Particulars Table */}
                                <table className="particulars-table" style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '12px', fontSize: '0.7rem' }}>
                                    <thead>
                                        <tr>
                                            <th colSpan={2} style={{ backgroundColor: '#0f2942', color: '#ffffff', fontWeight: 700, padding: '8px 12px', textAlign: 'left', fontSize: '0.68rem', letterSpacing: '0.5px', border: 'none' }}>INTERNSHIP PROGRAM PARTICULARS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Internship Track</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>{activeOffer.internship_title}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Intern ID</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>{activeOffer.offer_letter_id}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Duration</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>{activeOffer.duration}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Commencement Date</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                                                {(() => {
                                                    const d = new Date(activeOffer.issue_date);
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
                                                })()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Estimated Completion</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                                                {(() => {
                                                    const d = new Date(activeOffer.issue_date);
                                                    const num = parseInt(activeOffer.duration) || 1;
                                                    if (activeOffer.duration.toLowerCase().includes('week')) {
                                                        d.setDate(d.getDate() + num * 7);
                                                    } else {
                                                        d.setMonth(d.getMonth() + num);
                                                    }
                                                    d.setDate(d.getDate() - 3);
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
                                                })()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Stipend Details</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>Unpaid (Performance-Based Internship)</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '6px 12px', borderBottom: 'none', fontWeight: 600, color: '#475569', width: '35%' }}>Location & Model</td>
                                            <td className="value-cell" style={{ padding: '6px 12px', borderBottom: 'none', fontWeight: 700, color: '#0f172a' }}>Remote / Virtual</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* General Terms & Conditions */}
                                <div className="terms-card" style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px', backgroundColor: '#f8fafc' }}>
                                    <span className="card-title" style={{ color: '#0f2942', fontSize: '0.72rem', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>General Terms &amp; Conditions of Internship:</span>
                                    <div className="terms-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div className="bullet-item" style={{ fontSize: '0.71rem', lineHeight: '1.4', color: '#334155' }}><strong>1. Task Execution:</strong> You will be evaluated based on the functional completeness of the assigned tasks. You must submit weekly progress updates.</div>
                                        <div className="bullet-item" style={{ fontSize: '0.71rem', lineHeight: '1.4', color: '#334155' }}><strong>2. Code of Conduct:</strong> Plagiarism or any forms of professional misconduct will lead to immediate cancellation of your internship program.</div>
                                        <div className="bullet-item" style={{ fontSize: '0.71rem', lineHeight: '1.4', color: '#334155' }}><strong>3. Confidentiality:</strong> Any documentation, source code, or mock datasets shared during this program are strictly confidential.</div>
                                        <div className="bullet-item" style={{ fontSize: '0.71rem', lineHeight: '1.4', color: '#334555' }}><strong>4. Certification:</strong> An official Certificate of Internship Completion will be issued only upon successful submission and mentoring approval of all milestone tasks.</div>
                                    </div>
                                </div>

                                {/* Certificate Section */}
                                <div className="cert-completion-card" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px', backgroundColor: '#ffffff' }}>
                                    <span className="card-title" style={{ color: '#0f2942', fontSize: '0.72rem', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>CERTIFICATE OF COMPLETION</span>
                                    <div className="completion-text" style={{ fontSize: '0.71rem', lineHeight: '1.45', color: '#334155', textAlign: 'justify' }}>
                                        Upon successful completion of the internship and fulfillment of all assigned tasks, you will receive a Certificate of Internship with QR-code verification for authenticity.
                                    </div>
                                </div>

                                <div className="outro-paragraph" style={{ fontSize: '0.72rem', lineHeight: '1.45', color: '#334155', marginBottom: '8px' }}>
                                    Please return the signed copy of this letter as a token of your formal acceptance of this offer. We look forward to a mutually rewarding learning experience.
                                </div>
                            </div>

                            {/* Signatures Section */}
                            <div className="signatures-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', width: '100%', paddingBottom: '12px', zIndex: 2 }}>
                                {/* Company Seal (Left) */}
                                <div className="sig-col" style={{ display: 'flex', flexDirection: 'column', width: '33%', alignItems: 'flex-start' }}>
                                    <div className="sig-image-wrap" style={{ height: '80px', display: 'flex', alignItems: 'flex-end', position: 'relative', marginBottom: '4px' }}>
                                        <img src={window.location.origin + import.meta.env.BASE_URL + 'certificate-stamp.jpeg'} alt="Official Seal" className="stamp-overlay" style={{ width: '80px', height: '80px', objectFit: 'contain', opacity: 0.9 }} />
                                    </div>
                                    <span className="sig-title" style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 705, letterSpacing: '0.5px' }}>COMPANY SEAL</span>
                                </div>

                                {/* Director Signatory (Right) */}
                                <div className="sig-col" style={{ display: 'flex', flexDirection: 'column', width: '33%', alignItems: 'flex-end', textAlign: 'right', marginLeft: 'auto' }}>
                                    <div className="sig-image-wrap" style={{ height: '80px', display: 'flex', alignItems: 'flex-end', position: 'relative', marginBottom: '4px', justifyContent: 'flex-end' }}>
                                        <img src={window.location.origin + import.meta.env.BASE_URL + 'founder-sign.png'} alt="Director Signature" className="sig-image" style={{ maxHeight: '42px', objectFit: 'contain' }} />
                                    </div>
                                    <span className="sig-name" style={{ fontWeight: 700, fontSize: '0.72rem', color: '#0f172a' }}>Vishal R</span>
                                    <span className="sig-title" style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 705, letterSpacing: '0.5px' }}>DIRECTOR – ACADEMIC OPERATIONS</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="doc-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.6rem', color: '#475569', fontWeight: 700, letterSpacing: '0.3px', zIndex: 2, borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
                                {/* Left Column: MSME + Skyrovix */}
                                <div className="footer-left-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img src={window.location.origin + import.meta.env.BASE_URL + 'msme.jpeg'} alt="MSME Logo" style={{ height: '36px', objectFit: 'contain' }} />
                                    <div style={{ width: '1px', height: '30px', backgroundColor: '#cbd5e1' }}></div>
                                    <img src={window.location.origin + import.meta.env.BASE_URL + 'skyrovix.jpeg'} alt="Skyrovix Logo" style={{ height: '32px', objectFit: 'contain' }} />
                                </div>
                                {/* Center Column: Text */}
                                <div className="footer-text" style={{ textAlign: 'center', lineHeight: 1.45, color: '#64748b' }}>
                                    <strong style={{ color: '#0f2942' }}>VINIX Technologies Private Limited</strong><br />
                                    UDYAM Registry: UDYAM-TN-17-0076606<br />
                                    academic@vinix.online | www.vinix.online
                                </div>
                                {/* Right Column: Yrnovatech */}
                                <div className="footer-right-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    <img src={window.location.origin + import.meta.env.BASE_URL + 'yrnovatech.png'} alt="Yrnovatech Logo" style={{ height: '35px', objectFit: 'contain' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Hidden Certificate Component for Direct PDF Download */}
            {
                activeCertForDownload && (
                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1123px', height: '794px', overflow: 'hidden' }}>
                        <div
                            id="certificate-download-area"
                            className="certificate-container"
                        >
                            {/* Double border lines */}
                            <div className="cert-frame-outer"></div>
                            <div className="cert-frame-inner"></div>

                            {/* Top branding elements */}
                            <div className="cert-top-row">
                                <div className="cert-logo-left">
                                    <img src={window.location.origin + import.meta.env.BASE_URL + 'vinix-title.png'} alt="VINIX Logo" />
                                </div>

                                <div className="cert-brand-center">
                                    <span className="cert-brand-name">VINIX</span>
                                    <span className="cert-brand-tagline">Empowering Future Innovators</span>
                                </div>

                                <div className="cert-logo-right">
                                    <img src={window.location.origin + import.meta.env.BASE_URL + 'msme.jpeg'} alt="MSME Seal" />
                                </div>
                            </div>

                            {/* Certificate Headings */}
                            <div className="cert-title-section">
                                <h1 className="cert-title-main">CERTIFICATE</h1>
                                <h3 className="cert-title-sub">OF INTERNSHIP COMPLETION</h3>
                            </div>

                            {/* Certificate main body */}
                            <div className="cert-body-section">
                                <p className="cert-presentation-text">This certificate is proudly presented to</p>
                                <h2 className="recipient-name" style={{ textTransform: 'uppercase' }}>{profile?.full_name || 'Vinix Graduate'}</h2>

                                <p className="cert-description">
                                    for successfully completing the task-based virtual internship program in <span className="bold-text">{activeCertForDownload.course_name}</span> at <span className="bold-text">VINIX Technologies</span>, demonstrating dedication, technical skill, and professional excellence throughout the program.
                                </p>
                            </div>

                            {/* Footer signatory block with single Founder & Issued Date side */}
                            <div className="cert-footer-section">
                                {/* Date of Issuance Column (Left side) */}
                                <div className="footer-col-left">
                                    <div className="signature-area" style={{ justifyContent: 'flex-start', alignItems: 'flex-end' }}>
                                        <span className="issue-signer-date" style={{ fontWeight: 750, fontSize: '1.05rem', color: '#0f2942', marginBottom: '6px' }}>
                                            {new Date(activeCertForDownload.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="signer-line"></div>
                                    <span className="signer-name">Date of Issuance</span>
                                    <span className="signer-title" style={{ visibility: 'hidden' }}>&nbsp;</span>
                                    <span className="detail-left">Issued Date</span>
                                </div>

                                {/* Official Stamp Column (Center) */}
                                <div className="footer-col-center">
                                    <div className="stamp-container">
                                        <img src={window.location.origin + import.meta.env.BASE_URL + 'certificate-stamp.jpeg'} alt="Company Stamp" className="stamp-img" style={{ mixBlendMode: 'multiply' }} />
                                    </div>
                                    <div className="detail-center-block">
                                        <span>Intern ID: VINIX-{activeCertForDownload.certificate_number.split('-').pop()}</span>
                                        <span>Verify at: <a href={`https://verify.vinix.co/credentials/${activeCertForDownload.certificate_number}`} className="verify-web-link" target="_blank" rel="noreferrer">verify.vinix.co/{activeCertForDownload.certificate_number}</a></span>
                                    </div>
                                </div>

                                {/* Founder Signatory Column (Right side) */}
                                <div className="footer-col-right flex-col items-center">
                                    <div className="signature-area w-full" style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                        <img src={window.location.origin + import.meta.env.BASE_URL + 'founder-sign.png'} alt="Founder Signature" className="signature-img" />
                                    </div>
                                    <div className="signer-line"></div>
                                    <span className="signer-name" style={{ textAlign: 'center' }}>Vishal R</span>
                                    <span className="signer-title" style={{ textAlign: 'center' }}>Founder & CEO</span>
                                    <span className="detail-right" style={{ textAlign: 'center' }}>Certificate ID: {activeCertForDownload.certificate_number}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;
