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
    Sparkles, Clock, CalendarDays, FileText, CheckCircle
} from 'lucide-react';

interface Enrollment {
    id: string;
    internship_id: string;
    progress: number;
    status: string;
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
}

interface TaskProgress {
    id: string;
    task_id: string;
    status: string;
    github_url?: string;
    linkedin_url?: string;
    student_note?: string;
    admin_feedback?: string;
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
}

const Dashboard: React.FC = () => {
    const { user, profile, studentProfile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { toasts, showToast, dismiss } = useToast();

    const [activeTab, setActiveTab] = useState<'overview' | 'workspace' | 'idcard' | 'certificates' | 'settings'>('overview');
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
    const [editCollege, setEditCollege] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editGithub, setEditGithub] = useState('');
    const [editLinkedin, setEditLinkedin] = useState('');
    const [editSkills, setEditSkills] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);

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

            showToast('Milestone submission recorded! Evaluators will grade your code shortly.', 'success');
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

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark flex items-center justify-center p-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
            </div>
        );
    }

    const activeEnrollment = enrollments.find(e => e.status === 'active' || e.status === 'completed');
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

    return (
        <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col md:flex-row">
            <ToastContainer toasts={toasts} dismiss={dismiss} />
            {/* Left navigation Center Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-brand-cardDark border-r border-slate-200 dark:border-slate-800/80 p-6 flex flex-col select-none no-print">
                <div className="space-y-6 text-left">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Navigation Center</p>
                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                                    }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Dashboard</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (activeEnrollment) setActiveTab('workspace');
                                    else showToast('Please register/enroll in an active internship track first.', 'warning');
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'workspace'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                                    }`}
                            >
                                <Layers className="w-4 h-4" />
                                <span>My Workspace</span>
                            </button>
                            <button
                                onClick={() => navigate('/internships')}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <Briefcase className="w-4 h-4" />
                                <span>Apply Internship</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (activeEnrollment) setActiveTab('workspace');
                                    else showToast('Please register/enroll in an active internship track first.', 'warning');
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <FileCode className="w-4 h-4" />
                                <span>Projects submit</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (activeEnrollment) setActiveTab('certificates');
                                    else showToast('Please register/enroll in an active internship track first.', 'warning');
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'certificates'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'text-slate-605 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Award className="w-4 h-4" />
                                <span>Certificates</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (activeEnrollment) setActiveTab('overview');
                                    else showToast('Please register/enroll in an active internship track first.', 'warning');
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Offer Letters</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Settings className="w-4 h-4" />
                                <span>Profile Settings</span>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

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
                        <div className="bg-gradient-to-r from-[#031d38] via-[#0b2b4e] to-[#041c38] text-white rounded-[24px] p-8 shadow-xl mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden select-none no-print">
                            {/* Background glows */}
                            <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[140%] bg-gradient-to-br from-brand-primary/10 to-transparent blur-3xl pointer-events-none"></div>
                            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[140%] bg-gradient-to-tr from-brand-secondary/15 to-transparent blur-3xl pointer-events-none"></div>

                            {/* Left content column */}
                            <div className="flex-1 text-left z-10 w-full">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase font-extrabold tracking-widest text-[#f59e0b]">
                                    <Sparkles className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]/20" />
                                    <span>WELCOME INTERN</span>
                                </div>

                                <h1 className="text-3xl font-extrabold tracking-tight mt-3 text-white">
                                    {activeOffer?.student_name || profile?.full_name || 'Intern'}
                                </h1>

                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-full text-xs font-bold">
                                        {activeEnrollment?.internship?.title || 'Virtual Internship'}
                                    </span>
                                    {activeOffer?.offer_letter_id && (
                                        <span className="px-3 py-1 bg-white/10 text-white/95 border border-white/20 rounded-full text-xs font-mono font-bold">
                                            ID: {activeOffer.offer_letter_id}
                                        </span>
                                    )}
                                </div>

                                {/* Meta details list */}
                                <div className="flex flex-wrap items-center gap-4 mt-6">
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white/80 font-medium">
                                        <CalendarDays className="w-4 h-4 text-white/60" />
                                        <span>Enrolled: {activeOffer ? new Date(activeOffer.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '21 Jul 2026'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white/80 font-medium">
                                        <Clock className="w-4 h-4 text-white/60" />
                                        <span>Duration: {activeOffer?.duration || '3 Months'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white/80 font-medium">
                                        <CheckCircle className="w-4 h-4 text-emerald-450" />
                                        <span>Tasks: {approvedCount} / {totalTaskCount || taskProgresses.length} Approved</span>
                                    </div>
                                </div>

                                {/* Action Buttons list */}
                                <div className="flex flex-wrap items-center gap-3 mt-6">
                                    {activeOffer && (
                                        <button
                                            onClick={handleDownloadOfferLetterDirect}
                                            disabled={downloadingOffer}
                                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>{downloadingOffer ? 'Downloading...' : 'Download Offer Letter'}</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setActiveTab('idcard'); setTimeout(() => handleIdCardPrint(), 100); }}
                                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>Download ID Card</span>
                                    </button>
                                    <a
                                        href="https://chat.whatsapp.com/example"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2.5 bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-lg shadow-[#25d366]/20"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Join WhatsApp Group</span>
                                    </a>
                                    {certificates.length > 0 && (
                                        <button
                                            onClick={() => handleDownloadCertificateDirect(certificates[0])}
                                            disabled={downloadingCert}
                                            className="px-4 py-2.5 bg-[#009688] hover:bg-[#00796b] text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
                                        >
                                            <Award className="w-4 h-4" />
                                            <span>{downloadingCert ? 'Downloading...' : 'Download Certificate'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right circular progress */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 z-10">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    {/* SVG progress circle */}
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            className="stroke-white/10"
                                            strokeWidth="8"
                                            fill="transparent"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            className="stroke-emerald-400 transition-all duration-500 ease-out"
                                            strokeWidth="8"
                                            strokeDasharray={2 * Math.PI * 40}
                                            strokeDashoffset={2 * Math.PI * 40 * (1 - dynamicProgress / 100)}
                                            strokeLinecap="round"
                                            fill="transparent"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center text-center">
                                        <span className="text-2xl font-black text-white leading-none">{dynamicProgress}%</span>
                                        <span className="text-[8px] text-white/60 font-bold uppercase tracking-wider mt-1">Progress</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tab strip */}
                        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-855/70 rounded-2xl mb-8 shadow-sm no-print">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${activeTab === 'overview' ? 'bg-brand-primary text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350'
                                    }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Overview</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('workspace')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${activeTab === 'workspace' ? 'bg-brand-primary text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350'
                                    }`}
                            >
                                <Layers className="w-4 h-4" />
                                <span>Quest Workspace</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('idcard')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${activeTab === 'idcard' ? 'bg-brand-primary text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350'
                                    }`}
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>ID Card</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('certificates')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${activeTab === 'certificates' ? 'bg-brand-primary text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350'
                                    }`}
                            >
                                <Award className="w-4 h-4" />
                                <span>Credentials</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${activeTab === 'settings' ? 'bg-brand-primary text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350'
                                    }`}
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </button>
                        </div>

                        {/* Tab displays */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">

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

                                {/* Quick Access Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                    {/* Left Column: Recent Milestone Feedback */}
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Milestone Feedback Logs</h3>
                                            <div className="space-y-4">
                                                {taskProgresses.filter(p => p.admin_feedback).length === 0 ? (
                                                    <p className="text-xs text-slate-400 py-6 text-center italic">No mentor comments received yet.</p>
                                                ) : (
                                                    taskProgresses.filter(p => p.admin_feedback).map(p => (
                                                        <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-850">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold">{p.internship_tasks?.title}</span>
                                                                <span className={`text-[10px] uppercase font-bold ${p.status === 'approved' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                    {p.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                                                                "{p.admin_feedback}"
                                                            </p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setActiveTab('workspace')}
                                            className="mt-6 w-full py-2.5 border border-brand-primary/20 text-brand-primary dark:text-brand-accent dark:hover:bg-brand-primary/10 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                                        >
                                            <span>Open Quest Log Workspace</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Right Column: Code Sandbox Quick Access */}
                                    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 text-white flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-850 rounded-lg text-brand-accent text-xs font-bold">
                                                <Code className="w-3.5 h-3.5" />
                                                <span>Embedded Sandbox VM</span>
                                            </div>
                                            <h3 className="text-lg font-bold">Test Sandbox Sandbox</h3>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Test your HTML styling scripts or custom REST models directly inside the browser using our isolated VM lab container before pushing files to GitHub.
                                            </p>
                                        </div>

                                        <div className="pt-6">
                                            <button
                                                onClick={() => navigate('/codelab')}
                                                className="w-full py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-xs font-bold transition shadow-lg hover:opacity-95"
                                            >
                                                Launch Lab Environment
                                            </button>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        )}

                        {/* Tab displayed: Quest Workspace */}
                        {activeTab === 'workspace' && (
                            <div className="space-y-6">
                                <div className="border-b border-slate-205 dark:border-slate-805 pb-4">
                                    <h2 className="text-xl font-bold flex items-center space-x-2">
                                        <Layers className="w-5 h-5 text-brand-primary" />
                                        <span>Internship Quest Workspace</span>
                                    </h2>
                                    <p className="text-xs text-slate-450 mt-0.5">
                                        Complete milestones in serial order. Submit links to GitHub repository commits or documentation URLs.
                                    </p>
                                </div>

                                {taskProgresses.length === 0 ? (
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-205 dark:border-slate-805 rounded-xl p-12 text-center shadow-sm">
                                        <Layers className="w-12 h-12 text-slate-350 mx-auto mb-4" />
                                        <h3 className="text-base font-bold">No Milestones generated</h3>
                                        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                                            Accept your pending offer letter in the Overview dashboard or contact admins to seed milestones.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {taskProgresses.map((task) => {
                                            const isTaskApproved = task.status === 'approved';
                                            const isLinkedInTask = task.internship_tasks?.task_number === 1;

                                            // A task is locked if it's not the LinkedIn task AND LinkedIn post hasn't been approved yet!
                                            const isLocked = !isLinkedInTask && !hasUnlockedInternship;

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-5 shadow-sm transition-all duration-200 ${isLocked ? 'opacity-50 select-none' : ''
                                                        }`}
                                                >
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                        <div className="space-y-1.5 flex-grow">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 uppercase">
                                                                    Milestone {task.internship_tasks?.task_number}
                                                                </span>

                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${task.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                                                                    task.status === 'submitted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400' :
                                                                        task.status === 'resubmission_required' ? 'bg-rose-100 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450' :
                                                                            'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                                                                    }`}>
                                                                    {task.status === 'submitted' ? 'pending' : task.status === 'approved' ? 'successful' : task.status}
                                                                </span>
                                                            </div>

                                                            <h4 className="text-sm font-bold text-slate-850 dark:text-white capitalize">
                                                                {task.internship_tasks?.title}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-405 leading-relaxed max-w-4xl">
                                                                {task.internship_tasks?.description}
                                                            </p>

                                                            {task.admin_feedback && (
                                                                <div className="mt-2.5 p-3 bg-amber-500/[0.04] border-l-2 border-brand-primary rounded-r-lg text-[11px] text-slate-500 dark:text-slate-400 italic">
                                                                    Mentor Feedback: "{task.admin_feedback}"
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-shrink-0 w-full sm:w-auto text-right">
                                                            {isLocked ? (
                                                                <span className="text-xs text-slate-400 font-bold block select-none">🔒 Locked</span>
                                                            ) : isTaskApproved ? (
                                                                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg shadow-sm">
                                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                                    <span>Successful</span>
                                                                </span>
                                                            ) : task.status === 'submitted' ? (
                                                                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-55 border border-amber-200 text-amber-700 text-xs font-bold rounded-lg shadow-sm">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    <span>Pending</span>
                                                                </span>
                                                            ) : isLinkedInTask ? (
                                                                <div className="flex flex-col items-stretch space-y-2">
                                                                    <form
                                                                        onSubmit={(e) => handleLinkedInVerificationSubmit(e, task.id)}
                                                                        className="flex gap-1"
                                                                    >
                                                                        <input
                                                                            type="url"
                                                                            required
                                                                            value={linkedinUrl}
                                                                            onChange={(e) => setLinkedinUrl(e.target.value)}
                                                                            placeholder="Paste Link..."
                                                                            className="px-2 py-1 text-xs border border-slate-200 bg-slate-50 dark:bg-slate-950 rounded-lg outline-none w-32 focus:border-brand-primary"
                                                                        />
                                                                        <button
                                                                            type="submit"
                                                                            className="px-2.5 py-1 bg-brand-primary text-white rounded-lg text-xs font-bold tracking-wide"
                                                                        >
                                                                            Submit Link
                                                                        </button>
                                                                    </form>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setSelectedTaskForSubmission(task)}
                                                                    className="w-full sm:w-auto px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-bold rounded-xl shadow transition"
                                                                >
                                                                    {task.status === 'resubmission_required' ? 'Resubmit' : 'Submit Milestone'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                                                    src={`${import.meta.env.BASE_URL}vinix-logo-title.jpeg`}
                                                    alt="VINIX Logo"
                                                    className="h-5.5 w-auto object-contain"
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
                                                        src={`${import.meta.env.BASE_URL}founder-sign.png`}
                                                        alt="Founder Signature"
                                                        className="h-6 w-auto object-contain"
                                                    />
                                                    <div className="w-16 h-[0.75px] bg-[#0f2942]/40 mt-1 mb-0.5"></div>
                                                    <span className="text-[5.5px] font-bold text-[#0f2942]/60 uppercase tracking-widest leading-none">Founder's Sign</span>
                                                </div>

                                                {/* Right: MSME Logo (Big Size) */}
                                                <div className="flex-shrink-0 flex items-center justify-end">
                                                    <img
                                                        src={`${import.meta.env.BASE_URL}msme.jpeg`}
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
            {selectedTaskForSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none">
                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
                        <h3 className="text-lg font-bold flex items-center space-x-2">
                            <FileCode className="w-5 h-5 text-brand-primary" />
                            <span>Submit Milestone Solution</span>
                        </h3>
                        <p className="text-xs text-brand-primary dark:text-brand-accent mt-1 uppercase font-bold tracking-wide">
                            {selectedTaskForSubmission.internship_tasks?.title}
                        </p>

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
                                    placeholder="Describe your design choices, database schema config, or features completed..."
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
                                    onClick={() => setSelectedTaskForSubmission(null)}
                                    disabled={submittingTask}
                                    className="flex-1 py-3 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 text-slate-650 dark:text-slate-350 dark:hover:bg-slate-850 text-xs font-bold rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingTask}
                                    className="flex-1 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white text-xs font-bold rounded-xl transition shadow"
                                >
                                    {submittingTask ? 'Pushing Commit...' : 'Send Solution'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hidden Offer Letter Component for Direct PDF Download */}
            {activeOffer && (
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
                                <div className="header-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="header-logo" style={{ height: '54px', display: 'flex', alignItems: 'center' }}>
                                        <img src={`${import.meta.env.BASE_URL}vinix-logo.png`} alt="VINIX Logo" style={{ height: '100%', objectFit: 'contain' }} />
                                    </span>
                                    <div className="header-branding-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <span className="company-name" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#0f2942', lineHeight: 1.1, letterSpacing: '0.5px' }}>VINIX</span>
                                        <span className="company-tagline" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, color: '#cca353', letterSpacing: '0.5px', marginTop: '1px' }}>Empowering Future Innovators</span>
                                    </div>
                                </div>
                                <div className="company-contact-row" style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '5px', fontWeight: 550 }}>
                                    www.vinixtech.com | academic@vinix.com
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
                                        <td className="label-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '35%' }}>Location & Model</td>
                                        <td className="value-cell" style={{ padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>Remote / Virtual</td>
                                    </tr>
                                    <tr>
                                        <td className="label-cell" style={{ padding: '6px 12px', borderBottom: 'none', fontWeight: 600, color: '#475569', width: '35%' }}>College / University</td>
                                        <td className="value-cell" style={{ padding: '6px 12px', borderBottom: 'none', fontWeight: 700, color: '#0f172a' }}>{studentProfile?.college || 'Anna University, Chennai'}</td>
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
                                    <img src={`${import.meta.env.BASE_URL}certificate-stamp.jpeg`} alt="Official Seal" className="stamp-overlay" style={{ width: '80px', height: '80px', objectFit: 'contain', opacity: 0.9 }} />
                                </div>
                                <span className="sig-title" style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 705, letterSpacing: '0.5px' }}>COMPANY SEAL</span>
                            </div>

                            {/* Director Signatory (Right) */}
                            <div className="sig-col" style={{ display: 'flex', flexDirection: 'column', width: '33%', alignItems: 'flex-end', textAlign: 'right', marginLeft: 'auto' }}>
                                <div className="sig-image-wrap" style={{ height: '80px', display: 'flex', alignItems: 'flex-end', position: 'relative', marginBottom: '4px', justifyContent: 'flex-end' }}>
                                    <img src={`${import.meta.env.BASE_URL}founder-sign.png`} alt="Director Signature" className="sig-image" style={{ maxHeight: '42px', objectFit: 'contain' }} />
                                </div>
                                <span className="sig-name" style={{ fontWeight: 700, fontSize: '0.72rem', color: '#0f172a' }}>Vishal R</span>
                                <span className="sig-title" style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 705, letterSpacing: '0.5px' }}>DIRECTOR – ACADEMIC OPERATIONS</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="doc-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.6rem', color: '#475569', fontWeight: 700, letterSpacing: '0.3px', zIndex: 2, borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
                            <div className="footer-logo-wrap" style={{ height: '50px', display: 'flex', alignItems: 'center' }}>
                                <img src={`${import.meta.env.BASE_URL}msme.jpeg`} alt="MSME Logo" style={{ height: '50px' }} />
                            </div>
                            <div className="footer-text" style={{ textAlign: 'center', lineHeight: 1.4, color: '#64748b' }}>
                                <strong>VINIX Technologies Private Limited</strong><br />
                                UDYAM Registry: UDYAM-TN-17-0076606<br />
                                academic@vinix.com | www.vinix.online
                            </div>
                            <div style={{ width: '60px', height: '1px', visibility: 'hidden' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Certificate Component for Direct PDF Download */}
            {activeCertForDownload && (
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
                                <img src={`${import.meta.env.BASE_URL}vinix-logo.png`} alt="VINIX Logo" />
                            </div>

                            <div className="cert-brand-center">
                                <span className="cert-brand-name">VINIX</span>
                                <span className="cert-brand-tagline">Empowering Future Innovators</span>
                            </div>

                            <div className="cert-logo-right">
                                <img src={`${import.meta.env.BASE_URL}msme.jpeg`} alt="MSME Seal" />
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
                                    <img src={`${import.meta.env.BASE_URL}certificate-stamp.jpeg`} alt="Company Stamp" className="stamp-img" style={{ mixBlendMode: 'multiply' }} />
                                </div>
                                <div className="detail-center-block">
                                    <span>Intern ID: VINIX-{activeCertForDownload.certificate_number.split('-').pop()}</span>
                                    <span>Verify at: <a href={`https://verify.vinix.co/credentials/${activeCertForDownload.certificate_number}`} className="verify-web-link" target="_blank" rel="noreferrer">verify.vinix.co/{activeCertForDownload.certificate_number}</a></span>
                                </div>
                            </div>

                            {/* Founder Signatory Column (Right side) */}
                            <div className="footer-col-right flex-col items-center">
                                <div className="signature-area w-full" style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                    <img src={`${import.meta.env.BASE_URL}founder-sign.png`} alt="Founder Signature" className="signature-img" />
                                </div>
                                <div className="signer-line"></div>
                                <span className="signer-name" style={{ textAlign: 'center' }}>Vishal R</span>
                                <span className="signer-title" style={{ textAlign: 'center' }}>Founder & CEO</span>
                                <span className="detail-right" style={{ textAlign: 'center' }}>Certificate ID: {activeCertForDownload.certificate_number}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
