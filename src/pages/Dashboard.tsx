import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast, ToastContainer } from '../components/Toast';
import StudentNavbar from '../components/StudentNavbar';
import {
    LayoutDashboard, BookOpen, Layers, FileCode, Award, User,
    CheckCircle2, XCircle, ExternalLink, FileDown, Play, CheckCheck,
    MessageSquare, Printer, GraduationCap, Briefcase, Settings, Code,
    QrCode, Linkedin, Github, CreditCard, Shield, Send, ArrowRight,
    Sparkles, Clock, CalendarDays, FileText, CheckCircle, LogOut, Home, ClipboardList,
    RotateCcw, AlertCircle, X, Eye, Instagram, Check, LayoutGrid, ListChecks, Gift, Crown, ChevronLeft, Flag
} from 'lucide-react';
import { getGenuineStudentAvatar } from '../utils/studentAvatars';

interface Enrollment {
    id: string;
    internship_id: string;
    progress: number;
    status: string;
    certificate_status?: string;
    completion_status?: string;
    application_status?: string;
    joined_at?: string;
    created_at?: string;
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
    college?: string;
    full_name?: string;
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
    student_name?: string;
    verification_token?: string;
}

const Dashboard: React.FC = () => {
    const { user, profile, studentProfile, refreshProfile, signOut } = useAuth();
    const authenticAvatar = getGenuineStudentAvatar(user?.id, user?.email, profile?.avatar_url);
    const navigate = useNavigate();
    const { toasts, showToast, dismiss } = useToast();

    const DASH_CACHE_PREFIX = 'vinix_student_dash_cache_v2_';
    function getStudentDashCache(uid?: string) {
        if (!uid) return null;
        try {
            const raw = localStorage.getItem(`${DASH_CACHE_PREFIX}${uid}`) || sessionStorage.getItem(`${DASH_CACHE_PREFIX}${uid}`);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
            return null;
        } catch {
            return null;
        }
    }
    function saveStudentDashCache(uid: string, data: any) {
        if (!uid) return;
        try {
            const payload = JSON.stringify({
                ...data,
                _cachedAt: Date.now()
            });
            localStorage.setItem(`${DASH_CACHE_PREFIX}${uid}`, payload);
            sessionStorage.setItem(`${DASH_CACHE_PREFIX}${uid}`, payload);
        } catch (e) {
            console.warn('Failed to save dashboard cache:', e);
        }
    }

    const initialDashCache = React.useMemo(() => getStudentDashCache(user?.id), [user?.id]);
    const [activeTab, setActiveTab] = useState<'overview' | 'workspace' | 'idcard' | 'certificates' | 'settings' | 'payment'>('overview');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState<boolean>(() => !initialDashCache);

    // Database Data States
    const [enrollments, setEnrollments] = useState<Enrollment[]>(() => initialDashCache?.enrollments || []);
    const [application, setApplication] = useState<InternshipApplication | null>(() => initialDashCache?.application || null);
    const [offerLetters, setOfferLetters] = useState<OfferLetter[]>(() => initialDashCache?.offerLetters || []);
    const [taskProgresses, setTaskProgresses] = useState<TaskProgress[]>(() => initialDashCache?.taskProgresses || []);
    const [certificates, setCertificates] = useState<CertificateData[]>(() => initialDashCache?.certificates || []);
    const [totalTaskCount, setTotalTaskCount] = useState<number>(() => initialDashCache?.totalTaskCount || 0);

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
            const safetyTimer = setTimeout(() => setLoading(false), 8000);

            // Fetch dashboard datasets in parallel
            const [enrollRes, appRes, offerRes, certsRes, progressRes] = await Promise.allSettled([
                supabaseAdmin.from('internship_enrollments').select('*, internship:internships(title, description, duration)').eq('user_id', user.id),
                supabaseAdmin.from('internship_applications').select('id, domain, duration, status').eq('student_id', user.id).order('applied_at', { ascending: false }).limit(1).maybeSingle(),
                supabaseAdmin.from('offer_letters').select('*').eq('user_id', user.id),
                supabaseAdmin.from('certificates').select('*').eq('user_id', user.id),
                supabaseAdmin.from('task_progress').select('*, internship_tasks:internship_tasks(task_number, title, description)').eq('user_id', user.id)
            ]);

            clearTimeout(safetyTimer);

            const enrollData = enrollRes.status === 'fulfilled' ? (enrollRes.value as any)?.data : [];
            const appData = appRes.status === 'fulfilled' ? (appRes.value as any)?.data : null;
            const offerData = offerRes.status === 'fulfilled' ? (offerRes.value as any)?.data : [];
            const certsData = certsRes.status === 'fulfilled' ? (certsRes.value as any)?.data : [];
            const progressData = progressRes.status === 'fulfilled' ? (progressRes.value as any)?.data : [];

            const sortedProgress = (progressData || []).sort((a: any, b: any) =>
                (a.internship_tasks?.task_number || 0) - (b.internship_tasks?.task_number || 0)
            );

            // Fetch total task count for current internship
            let totalTasks = sortedProgress.length;
            const firstEnroll = (enrollData || [])[0];
            if (firstEnroll?.internship_id) {
                try {
                    const { count } = await supabaseAdmin
                        .from('internship_tasks')
                        .select('id', { count: 'exact', head: true })
                        .eq('internship_id', firstEnroll.internship_id);
                    if (count && count > 0) totalTasks = count;
                } catch { }
            }

            const formattedEnrolls = (enrollData || []).map((e: any) => ({
                id: e.id,
                internship_id: e.internship_id,
                progress: e.progress || 0,
                status: e.status,
                joined_at: e.created_at || e.joined_at || e.enrolled_at,
                created_at: e.created_at,
                certificate_status: e.certificate_status || 'NOT_ELIGIBLE',
                completion_status: e.completion_status || 'IN_PROGRESS',
                internship: {
                    title: e.internship?.title || 'Virtual Internship',
                    domain: appData?.domain || 'Software Engineering',
                    description: e.internship?.description || '',
                    duration: e.internship?.duration || appData?.duration || '3 Months'
                }
            }));

            setEnrollments(formattedEnrolls);
            setApplication(appData || null);
            setOfferLetters(offerData || []);
            setCertificates(certsData || []);
            setTaskProgresses(sortedProgress);
            setTotalTaskCount(totalTasks);

            saveStudentDashCache(user.id, {
                enrollments: formattedEnrolls,
                application: appData || null,
                offerLetters: offerData || [],
                certificates: certsData || [],
                taskProgresses: sortedProgress,
                totalTaskCount: totalTasks
            });

            // Prep editing fields with profile values
            if (profile) {
                setEditName(profile.full_name || profile.name || '');
                setEditAvatarUrl(profile.avatar_url || '');
                setEditCollege(studentProfile?.college || profile.college || appData?.college || '');
                setEditBio(profile.bio || '');
                setEditGithub(profile.github_url || profile.github || '');
                setEditLinkedin(profile.linkedin_url || profile.linkedin || '');
                setEditSkills((profile.skills || []).join(', '));
            }

        } catch (err) {
            console.error('Failed to load student dashboard:', err);
        } finally {
            setLoading(false);
        }
    }

    // Keep profile editing fields in sync when profile or studentProfile updates
    useEffect(() => {
        if (profile) {
            setEditName(prev => prev || profile.full_name || profile.name || '');
            setEditAvatarUrl(prev => prev || profile.avatar_url || '');
            setEditCollege(prev => prev || studentProfile?.college || profile.college || application?.college || '');
            setEditBio(prev => prev || profile.bio || '');
            setEditGithub(prev => prev || profile.github_url || profile.github || '');
            setEditLinkedin(prev => prev || profile.linkedin_url || profile.linkedin || '');
            setEditSkills(prev => prev || (profile.skills || []).join(', '));
        }
    }, [profile, studentProfile, application]);

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

    // Automatically reset scroll position to the top when navigating between tabs
    useEffect(() => {
        const mainEl = document.getElementById('dashboard-main-content');
        if (mainEl) {
            mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaveLoading(true);

        try {
            const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);

            // 1. Prepare profile payload with columns matching public.profiles schema
            const profilePayload: Record<string, any> = {
                full_name: editName.trim(),
                name: editName.trim(),
                avatar_url: editAvatarUrl.trim(),
                college: editCollege.trim(),
                bio: editBio.trim(),
                github_url: editGithub.trim(),
                linkedin_url: editLinkedin.trim(),
                updated_at: new Date().toISOString()
            };

            // 2. Perform adaptive update: try with skills, fallback without skills if column not in schema cache
            let { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    ...profilePayload,
                    skills: skillsArray
                })
                .eq('id', user.id);

            // If PostgREST fails due to missing skills column or column mismatch, retry with pure profilePayload
            if (error) {
                const errMsg = error.message || '';
                if (errMsg.includes('skills') || errMsg.includes('schema cache')) {
                    const retry = await supabaseAdmin
                        .from('profiles')
                        .update(profilePayload)
                        .eq('id', user.id);
                    error = retry.error;
                }
            }

            // If error regarding column names (e.g. github_url vs github in alternative setups)
            if (error && (error.message?.includes('github_url') || error.message?.includes('linkedin_url'))) {
                const altPayload: Record<string, any> = {
                    full_name: editName.trim(),
                    name: editName.trim(),
                    avatar_url: editAvatarUrl.trim(),
                    college: editCollege.trim(),
                    bio: editBio.trim(),
                    github: editGithub.trim(),
                    linkedin: editLinkedin.trim(),
                    updated_at: new Date().toISOString()
                };
                const retryAlt = await supabaseAdmin
                    .from('profiles')
                    .update(altPayload)
                    .eq('id', user.id);
                error = retryAlt.error;
            }

            if (error) throw error;

            // 3. Upsert student_profiles table (for student role or general profile completeness)
            try {
                await supabaseAdmin
                    .from('student_profiles')
                    .upsert({
                        id: user.id,
                        college: editCollege.trim(),
                        updated_at: new Date().toISOString()
                    });
            } catch (studErr) {
                console.warn('student_profiles upsert note:', studErr);
            }

            // 4. Sync name and college to internship_applications so offer letters & certificates update too
            try {
                await supabaseAdmin
                    .from('internship_applications')
                    .update({
                        full_name: editName.trim(),
                        college: editCollege.trim()
                    })
                    .eq('user_id', user.id);
            } catch (appErr) {
                console.warn('internship_applications sync note:', appErr);
            }

            // 5. Update local state and cached profile immediately
            if (application) {
                setApplication(prev => prev ? { ...prev, full_name: editName.trim(), college: editCollege.trim() } : null);
            }

            await refreshProfile();
            showToast('Your profile and engineering bio were updated successfully!', 'success');
        } catch (err: any) {
            console.error('Error updating profile:', err);
            showToast(`Error updating profile: ${err.message || 'Check database connection'}`, 'error');
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
        if (!activeOffer) {
            showToast('Loading your offer letter data. Please try again in a moment...', 'info');
            return;
        }
        if (activeOffer.offer_letter_url) {
            window.open(activeOffer.offer_letter_url, '_blank');
            return;
        }
        setDownloadingOffer(true);
        showToast('Preparing your Offer Letter PDF...', 'info');
        try {
            // Poll for download element to guarantee it exists on first click
            let element = document.getElementById('offer-letter-download-area');
            if (!element) {
                for (let i = 0; i < 20; i++) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    element = document.getElementById('offer-letter-download-area');
                    if (element) break;
                }
            }

            if (!element) {
                throw new Error('Offer letter template not ready.');
            }

            // Quick font wait with strict 500ms cap
            if (document.fonts) {
                await Promise.race([
                    document.fonts.ready,
                    new Promise(resolve => setTimeout(resolve, 500))
                ]);
            }

            const canvas = await html2canvas(element, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 794,
                height: 1123,
                windowWidth: 794,
                windowHeight: 1123,
                scrollX: 0,
                scrollY: 0
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
                canvas.toDataURL('image/jpeg', 0.92),
                'JPEG',
                0,
                0,
                imgWidth,
                finalHeight
            );

            pdf.save(`${activeOffer.offer_letter_id || 'Offer_Letter'}.pdf`);
            showToast('Offer letter downloaded successfully!', 'success');
        } catch (err: any) {
            showToast('Direct download note: Opening offer letter view...', 'info');
            if (activeOffer.offer_letter_id) {
                navigate('/verify/offer/' + activeOffer.offer_letter_id);
            }
        } finally {
            setDownloadingOffer(false);
        }
    };

    const handleDownloadCertificateDirect = async (cert: CertificateData) => {
        const targetCert = cert || (certificates && certificates[0]);
        if (!targetCert) {
            showToast('No certificate available yet. Complete all tasks first.', 'info');
            return;
        }
        setDownloadingCert(true);
        setActiveCertForDownload(targetCert);
        showToast('Preparing your Certificate PDF...', 'info');
        try {
            // Poll for download element so it never misses on the first click
            let element = document.getElementById('certificate-download-area');
            if (!element) {
                for (let i = 0; i < 20; i++) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    element = document.getElementById('certificate-download-area');
                    if (element) break;
                }
            }

            if (!element) {
                throw new Error('Certificate template not ready.');
            }

            // Quick font wait with strict 500ms cap
            if (document.fonts) {
                await Promise.race([
                    document.fonts.ready,
                    new Promise(resolve => setTimeout(resolve, 500))
                ]);
            }

            const canvas = await html2canvas(element, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 1123,
                height: 794,
                windowWidth: 1123,
                windowHeight: 794,
                scrollX: 0,
                scrollY: 0
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
                canvas.toDataURL('image/jpeg', 0.92),
                'JPEG',
                0,
                0,
                imgWidth,
                finalHeight
            );

            pdf.save(`${targetCert.certificate_number || 'Certificate'}.pdf`);
            showToast('Certificate downloaded successfully!', 'success');
        } catch (err: any) {
            showToast('Direct download note: Opening certificate view...', 'info');
            if (targetCert.certificate_number) {
                navigate('/verify/' + targetCert.certificate_number);
            }
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
            <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark flex flex-col items-center justify-center p-4">
                <div className="relative w-12 h-12 mb-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 animate-pulse">Loading Student Portal...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Preparing your workspace and milestones</p>
            </div>
        );
    }

    const activeEnrollment = enrollments.find(e => ['active', 'completed'].includes(e.status));
    const pendingEnrollment = enrollments.find(e => e.status === 'pending') ||
        (!activeEnrollment && application && application.status === 'pending' ? { internship: { title: application.domain + ' Internship' } } as any : null);
    const activeOffer = offerLetters[0] || (activeEnrollment || application ? {
        id: activeEnrollment?.id || application?.id || 'active-offer',
        offer_letter_id: (activeEnrollment?.id ? `VINIX-2026-${activeEnrollment.id.slice(0, 4).toUpperCase()}` : 'VINIX-2026-1757'),
        student_name: profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Vishal R'),
        internship_title: activeEnrollment?.internship?.title || application?.domain || 'Full Stack Development',
        duration: activeEnrollment?.internship?.duration || '3 Months',
        issue_date: activeEnrollment?.joined_at || new Date().toISOString(),
        status: 'ACCEPTED'
    } as any : null);

    const studentFirstName = (
        activeOffer?.student_name ||
        profile?.full_name ||
        (user?.email ? user.email.split('@')[0] : 'vishal')
    ).split(' ')[0].toLowerCase();

    const studentFullName = activeOffer?.student_name || profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Vishal R');

    const studentInitials = (() => {
        if (studentFullName) {
            const parts = studentFullName.trim().split(/\s+/);
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return parts[0].slice(0, 2).toUpperCase();
        }
        return 'VI';
    })();

    const studentIdDisplay = (() => {
        if (activeOffer?.offer_letter_id) return activeOffer.offer_letter_id;
        if (activeEnrollment?.id) return `VINIX-2026-${activeEnrollment.id.slice(0, 4).toUpperCase()}`;
        return 'VINIX-2026-1757';
    })();

    const studentDomain = activeEnrollment?.internship?.domain || activeEnrollment?.internship?.title || application?.domain || 'Full Stack Development';
    const studentTrackTitle = activeEnrollment?.internship?.title || studentDomain;

    const enrolledDate = activeOffer?.issue_date
        ? new Date(activeOffer.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : (activeEnrollment?.joined_at
            ? new Date(activeEnrollment.joined_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '21 Jul 2026');

    const durationText = activeEnrollment?.internship?.duration || activeOffer?.duration || '3 Months';

    const handleViewOffer = () => {
        if (activeOffer?.offer_letter_url) {
            window.open(activeOffer.offer_letter_url, '_blank');
        } else if (activeOffer?.verification_token || activeOffer?.offer_letter_id) {
            navigate('/verify-offer/' + (activeOffer.verification_token || activeOffer.offer_letter_id));
        } else {
            showToast('Offer letter is ready to download below.', 'info');
        }
    };

    // Dynamic progress computed from real approved task count vs total
    const approvedCount = taskProgresses.filter(p => p.status === 'approved').length;
    const dynamicProgress = totalTaskCount > 0 ? Math.round((approvedCount / totalTaskCount) * 100) : (activeEnrollment?.progress || 0);

    const isVerifiedAndIssued = certificates.length > 0 || (dynamicProgress === 100 && (activeEnrollment?.application_status?.startsWith('ISSUED:') || activeEnrollment?.status === 'completed'));
    const isTasksCompleted = dynamicProgress === 100 || (totalTaskCount > 0 && approvedCount >= totalTaskCount);
    const isTasksInProgress = approvedCount > 0 && !isTasksCompleted;

    const effectiveCertificates: CertificateData[] = certificates.length > 0 ? certificates : (
        isVerifiedAndIssued ? [{
            id: 'cert-' + (activeEnrollment?.id || 'default'),
            certificate_number: activeEnrollment?.application_status?.startsWith('ISSUED:')
                ? activeEnrollment.application_status.replace('ISSUED:', '').trim()
                : `VINIX-${(studentDomain || 'FS').slice(0, 3).toUpperCase()}-2026-${(activeEnrollment?.id || '8888').slice(0, 4).toUpperCase()}`,
            course_name: studentTrackTitle,
            issue_date: new Date().toISOString(),
            status: 'verified',
            student_name: studentFullName,
            verification_token: `VERIFY-${(activeEnrollment?.id || '8888').slice(0, 6).toUpperCase()}`
        }] : []
    );

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
        <div className="h-screen bg-[#F8FAFC] dark:bg-zinc-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col w-full overflow-hidden">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* ══════ 1. TOP NAVBAR (FULL WIDTH ACROSS THE ENTIRE SCREEN) ══════ */}
            <StudentNavbar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                activeEnrollment={activeEnrollment}
                onReviewClick={() => navigate('/reviews')}
                hasSidebar={true}
            />

            {/* ══════ 2. BELOW TOP NAVBAR: FIXED SIDEBAR + SCROLLABLE RIGHT CONTENT ══════ */}
            <div className="flex-1 w-full flex flex-row items-start overflow-hidden">
                {/* ══════ LEFT SIDEBAR (FIXED - DOES NOT SCROLL) ══════ */}
                <aside className={`hidden lg:flex flex-col shrink-0 bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800/90 rounded-[28px] h-[calc(100vh-86px)] ml-3 sm:ml-4 my-2.5 z-30 select-none no-print transition-all duration-300 shadow-sm overflow-hidden justify-between p-3.5 ${sidebarCollapsed ? 'w-20' : 'w-64 xl:w-72'}`}>
                {/* 1. Student Profile Card (Pic 1 Design with Pic 2 Data) */}
                {!sidebarCollapsed ? (
                    <div className="bg-[#F8F9FA] dark:bg-zinc-900/80 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-3 mb-2 text-left">
                        <div className="flex items-center gap-3">
                            {/* Red circular avatar */}
                            <div className="w-11 h-11 rounded-full bg-red-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
                                {studentInitials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                    {studentFullName}
                                </h4>
                                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 truncate tracking-wide">
                                    {studentIdDisplay}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                    {studentTrackTitle}
                                </p>
                            </div>
                        </div>

                        {/* Track pill & status row */}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/50 dark:border-zinc-800/60">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                Standard Track
                            </span>
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                                <span>Active Track</span>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="w-11 h-11 mx-auto rounded-full bg-red-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20 mb-2">
                        {studentInitials}
                    </div>
                )}

                {/* 2. Navigation Sections (Pic 1 Design with Pic 2 Data) */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 py-1">
                    {/* Section: WORKSPACE */}
                    <div>
                        {!sidebarCollapsed && (
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-3 mb-1.5 text-left">
                                WORKSPACE
                            </p>
                        )}
                        <div className="space-y-1">
                            {/* Dashboard (Active Pitch-Black Pill with Red Grid Icon from Pic 1) */}
                            <button
                                onClick={() => {
                                    setActiveTab('overview');
                                    document.getElementById('dashboard-main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'overview'
                                        ? 'bg-[#18181b] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900'
                                }`}
                                title="Dashboard"
                            >
                                <LayoutGrid className={`w-4 h-4 shrink-0 ${activeTab === 'overview' ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
                                {!sidebarCollapsed && <span>Dashboard</span>}
                            </button>

                            {/* My Tasks */}
                            <button
                                onClick={() => {
                                    setActiveTab('overview');
                                    setTimeout(() => {
                                        document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                                title="My Tasks"
                            >
                                <ListChecks className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                                {!sidebarCollapsed && <span>My Tasks</span>}
                            </button>
                        </div>
                    </div>

                    {/* Section: ACADEMIC & RECORDS */}
                    <div>
                        {!sidebarCollapsed && (
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-3 mt-3 mb-1.5 text-left">
                                ACADEMIC &amp; RECORDS
                            </p>
                        )}
                        <div className="space-y-1">
                            {/* My Internships */}
                            <button
                                onClick={() => navigate('/internships')}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                                title="My Internships"
                            >
                                <Briefcase className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                                {!sidebarCollapsed && <span>My Internships</span>}
                            </button>

                            {/* Payment */}
                            <button
                                onClick={() => setActiveTab('payment')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'payment'
                                        ? 'bg-[#18181b] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900'
                                }`}
                                title="Payment"
                            >
                                <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'payment' ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
                                {!sidebarCollapsed && <span>Payment</span>}
                            </button>

                            {/* Certificates */}
                            <button
                                onClick={() => setActiveTab('certificates')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'certificates'
                                        ? 'bg-[#18181b] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900'
                                }`}
                                title="Certificates"
                            >
                                <Award className={`w-4 h-4 shrink-0 ${activeTab === 'certificates' ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
                                {!sidebarCollapsed && <span>Certificates</span>}
                            </button>

                            {/* Profile */}
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'settings'
                                        ? 'bg-[#18181b] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900'
                                }`}
                                title="Profile"
                            >
                                <User className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
                                {!sidebarCollapsed && <span>Profile</span>}
                            </button>

                            {/* Review */}
                            <button
                                onClick={() => navigate('/reviews')}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                                title="Review"
                            >
                                <MessageSquare className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                                {!sidebarCollapsed && <span>Review</span>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Bottom Domain & Task Progress Card */}
                {!sidebarCollapsed && (
                    <div className="bg-gradient-to-br from-rose-50/80 via-red-50/40 to-rose-100/50 dark:from-zinc-900 dark:via-red-950/25 dark:to-zinc-900 border border-red-200/90 dark:border-red-900/40 rounded-2xl p-3 my-2 text-left shadow-xs">
                        {/* Domain Header */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white truncate">
                                <Crown className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0" />
                                <span className="truncate">{studentDomain}</span>
                            </div>
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-950/60 px-1.5 py-0.5 rounded-md shrink-0">
                                {dynamicProgress}%
                            </span>
                        </div>

                        {/* Task Progress Info */}
                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1">
                            <span>Tasks Progress</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                                {approvedCount}/{totalTaskCount || 5} Done
                            </span>
                        </div>

                        {/* Mini Task Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2.5">
                            <div
                                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${dynamicProgress}%` }}
                            />
                        </div>

                        {/* Action Button: View Tasks */}
                        <button
                            onClick={() => {
                                setActiveTab('overview');
                                setTimeout(() => {
                                    document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                            className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                        >
                            <ListChecks className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>View My Tasks</span>
                        </button>
                    </div>
                )}

                {/* 4. Footer: Collapse Sidebar & Logout */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between px-2">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer select-none"
                        title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {!sidebarCollapsed && <span>Collapse Sidebar</span>}
                        <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={async () => { await signOut(); navigate('/login'); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </aside>

            {/* ══════ MAIN CONTENT PANE (ONLY RIGHT SIDE SCROLLS) ══════ */}
            <div id="dashboard-main-content" className="flex-1 min-w-0 h-[calc(100vh-74px)] overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-[1520px] mx-auto space-y-6 scroll-smooth">
                {!activeEnrollment ? (
                    <div className="space-y-6 text-left">
                        {activeTab === 'settings' ? (
                            renderSettingsTab()
                        ) : activeTab === 'certificates' ? (
                            <div className="space-y-6 text-left">
                                <div className="border-b border-slate-205 dark:border-slate-805 pb-4">
                                    <h2 className="text-xl font-bold flex items-center space-x-2">
                                        <Award className="w-5 h-5 text-brand-primary" />
                                        <span>Verified Certificates &amp; Alumni Directory</span>
                                    </h2>
                                    <p className="text-xs text-slate-450 mt-0.5">
                                        Locate and verify your issued certificates.
                                    </p>
                                </div>
                                {certificates.length === 0 ? (
                                    <div className="bg-white dark:bg-brand-cardDark border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                                        <Award className="w-12 h-12 text-slate-350 mx-auto mb-4" />
                                        <h3 className="text-base font-bold">No certificates generated yet</h3>
                                        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                                            Enroll in an internship track to start earning verified certificates.
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
                                                <div className="flex items-center justify-between text-xs text-slate-405 border-t border-slate-100 dark:border-slate-805 pt-3">
                                                    <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                                                    <button
                                                        onClick={() => navigate(`/verify/${cert.certificate_number}`)}
                                                        className="text-brand-primary font-bold flex items-center space-x-1"
                                                    >
                                                        <span>Verify</span>
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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
                                        className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-500/25 flex items-center gap-1.5"
                                    >
                                        <span>Apply Internship</span>
                                    </button>
                                </div>

                                {/* Referral Banner */}
                                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/40 rounded-[20px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
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
                                        className="px-4 py-2 border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50/50 text-xs transition flex items-center gap-1.5"
                                    >
                                        <span>Copy Link</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Quest Log Header */}
                                <div id="tasks-section">
                                    <div className="flex items-center gap-2 mb-4">
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-red-600" />
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
                                                    <span className="px-2 py-0.5 rounded bg-red-100/50 border border-red-200 text-red-600 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50 text-[9px] font-bold uppercase tracking-wider">
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
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-500/25 flex items-center gap-1.5"
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
                        {/* ══════ TAB: OVERVIEW (Home / Dashboard / Milestones) ══════ */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* ══════ 1. WELCOME HERO BANNER (Clean, Perfectly Aligned) ══════ */}
                        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-gradient-to-r from-zinc-950 via-[#111116] to-black border border-red-900/30 text-white shadow-2xl p-5 sm:p-7 select-none no-print">
                            {/* Sweeping red flare background glow on top-left and right */}
                            <div className="absolute -top-12 -left-12 w-48 h-48 bg-red-600/30 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-12 -right-12 w-72 h-72 bg-gradient-to-tl from-red-600/50 via-rose-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                            {/* Aerodynamic red curve overlay on right side */}
                            <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none opacity-30 bg-gradient-to-l from-red-600/40 via-red-900/10 to-transparent" />
                            {/* Faint Graduation Cap watermark in background */}
                            <GraduationCap className="absolute right-40 top-1/2 -translate-y-1/2 w-44 h-44 text-white/[0.04] pointer-events-none transform -rotate-12" />

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
                                {/* Left: Student Avatar, Welcome & Name */}
                                <div className="flex items-center gap-3.5 sm:gap-4 w-full md:w-auto">
                                    {/* Student Photo */}
                                    <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                                        {authenticAvatar ? (
                                            <img
                                                src={authenticAvatar}
                                                alt="Student"
                                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-red-500 shadow-lg shadow-red-600/30"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center ring-2 ring-red-500 shadow-lg shadow-red-600/30">
                                                {studentInitials}
                                            </div>
                                        )}
                                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-zinc-950 flex items-center justify-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        </span>
                                    </div>

                                    {/* Name & Track block */}
                                    <div className="space-y-1 text-left min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black tracking-wider uppercase shadow-sm">
                                                <Sparkles className="w-3 h-3 fill-white" />
                                                <span>WELCOME STUDENT</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-bold">
                                                <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                                                <span className="truncate max-w-[130px] sm:max-w-none">{studentTrackTitle}</span>
                                            </span>
                                        </div>
                                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight truncate">
                                            Hi, <span className="text-red-500 capitalize">{studentFirstName}!</span>
                                        </h1>
                                        <p className="text-[11px] sm:text-xs text-slate-300 font-medium truncate">
                                            Keep learning, keep growing with VINIX 🚀
                                        </p>
                                    </div>
                                </div>

                                {/* Center: Enrolled Date, Duration, and Student ID */}
                                <div className="flex items-center justify-center gap-4 sm:gap-6 bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3 w-full sm:w-auto">
                                    {/* Enrolled On */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center shrink-0">
                                            <CalendarDays className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Enrolled On</p>
                                            <p className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">{enrolledDate}</p>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px h-10 bg-white/15" />

                                    {/* Duration */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center shrink-0">
                                            <Clock className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Duration</p>
                                            <p className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">{durationText}</p>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="hidden md:block w-px h-10 bg-white/15" />

                                    {/* Student ID */}
                                    <div className="hidden md:flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center shrink-0">
                                            <Award className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Student ID</p>
                                            <p className="text-xs sm:text-sm font-mono font-bold text-red-400 whitespace-nowrap">{studentIdDisplay}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Circular Course Progress Ring */}
                                <div className="flex flex-col items-center justify-center shrink-0 self-center md:self-auto">
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" className="stroke-zinc-800" strokeWidth="8" fill="transparent" />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                className="stroke-red-600 transition-all duration-700 ease-out drop-shadow-[0_0_10px_rgba(220,38,38,0.7)]"
                                                strokeWidth="8"
                                                strokeDasharray={2 * Math.PI * 40}
                                                strokeDashoffset={2 * Math.PI * 40 * (1 - (dynamicProgress || 100) / 100)}
                                                strokeLinecap="round"
                                                fill="transparent"
                                            />
                                        </svg>
                                        <span className="absolute text-base sm:text-lg font-black text-white">{dynamicProgress || 100}%</span>
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-300 mt-1 whitespace-nowrap">Course Progress</span>
                                </div>
                            </div>
                        </div>

                        {/* ══════ 2. QUICK ACCESS CARD (Sample Image Card 2) ══════ */}
                        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm select-none text-left">
                            {/* Red curved badge in top-left */}
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white text-[10px] sm:text-[11px] font-black tracking-wider uppercase px-4 sm:px-5 py-1.5 rounded-br-2xl shadow-sm z-10">
                                <span>Quick Access</span>
                            </div>

                            {/* Corner subtle red aerodynamic curve */}
                            <div className="absolute bottom-0 right-0 w-24 h-16 pointer-events-none opacity-20 bg-gradient-to-tl from-red-600 to-transparent rounded-tl-full" />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 md:gap-0 md:divide-x divide-slate-100 dark:divide-zinc-800/80 pt-10 sm:pt-9 md:pt-6 pb-2.5 sm:py-3 px-2.5 sm:px-4">
                                {/* Item 1: View Offer */}
                                <button
                                    onClick={handleViewOffer}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between p-3 sm:p-3.5 md:p-4 bg-slate-50/70 dark:bg-zinc-800/40 md:bg-transparent md:dark:bg-transparent border border-slate-150/70 dark:border-zinc-800/80 md:border-0 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-zinc-800/70 md:hover:bg-slate-50 md:dark:hover:bg-zinc-800/50 transition group cursor-pointer text-left w-full"
                                >
                                    <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-2.5 sm:gap-3 min-w-0">
                                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Eye className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="md:hidden w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </div>
                                        <div className="hidden md:block min-w-0">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">View Offer</h4>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Explore new opportunities</p>
                                        </div>
                                    </div>
                                    <div className="md:hidden w-full mt-2.5">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">View Offer</h4>
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Explore & preview</p>
                                    </div>
                                    <div className="hidden md:flex w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:bg-red-600 group-hover:text-white items-center justify-center shrink-0 transition-colors ml-2">
                                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                </button>

                                {/* Item 2: Offer Letter */}
                                <button
                                    onClick={handleDownloadOfferLetterDirect}
                                    disabled={downloadingOffer}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between p-3 sm:p-3.5 md:p-4 bg-slate-50/70 dark:bg-zinc-800/40 md:bg-transparent md:dark:bg-transparent border border-slate-150/70 dark:border-zinc-800/80 md:border-0 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-zinc-800/70 md:hover:bg-slate-50 md:dark:hover:bg-zinc-800/50 transition group cursor-pointer text-left w-full"
                                >
                                    <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-2.5 sm:gap-3 min-w-0">
                                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <FileText className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="md:hidden w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </div>
                                        <div className="hidden md:block min-w-0">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {downloadingOffer ? 'Downloading...' : 'Offer Letter'}
                                            </h4>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Download your offer letter</p>
                                        </div>
                                    </div>
                                    <div className="md:hidden w-full mt-2.5">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                            {downloadingOffer ? 'Downloading...' : 'Offer Letter'}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Download PDF</p>
                                    </div>
                                    <div className="hidden md:flex w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:bg-red-600 group-hover:text-white items-center justify-center shrink-0 transition-colors ml-2">
                                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                </button>

                                {/* Item 3: ID Card */}
                                <button
                                    onClick={() => { setActiveTab('idcard'); setTimeout(() => handleIdCardPrint(), 100); }}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between p-3 sm:p-3.5 md:p-4 bg-slate-50/70 dark:bg-zinc-800/40 md:bg-transparent md:dark:bg-transparent border border-slate-150/70 dark:border-zinc-800/80 md:border-0 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-zinc-800/70 md:hover:bg-slate-50 md:dark:hover:bg-zinc-800/50 transition group cursor-pointer text-left w-full"
                                >
                                    <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-2.5 sm:gap-3 min-w-0">
                                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <CreditCard className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="md:hidden w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </div>
                                        <div className="hidden md:block min-w-0">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">ID Card</h4>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Get your ID card</p>
                                        </div>
                                    </div>
                                    <div className="md:hidden w-full mt-2.5">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">ID Card</h4>
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Get your ID card</p>
                                    </div>
                                    <div className="hidden md:flex w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:bg-red-600 group-hover:text-white items-center justify-center shrink-0 transition-colors ml-2">
                                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                </button>

                                {/* Item 4: Certificate */}
                                <button
                                    onClick={() => {
                                        if (certificates.length > 0) {
                                            handleDownloadCertificateDirect(certificates[0]);
                                        } else {
                                            showToast('Complete all milestone tasks and get admin verification to download your certificate.', 'info');
                                            setActiveTab('certificates');
                                        }
                                    }}
                                    disabled={downloadingCert}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between p-3 sm:p-3.5 md:p-4 bg-slate-50/70 dark:bg-zinc-800/40 md:bg-transparent md:dark:bg-transparent border border-slate-150/70 dark:border-zinc-800/80 md:border-0 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-zinc-800/70 md:hover:bg-slate-50 md:dark:hover:bg-zinc-800/50 transition group cursor-pointer text-left w-full"
                                >
                                    <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-2.5 sm:gap-3 min-w-0">
                                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Award className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="md:hidden w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </div>
                                        <div className="hidden md:block min-w-0">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {downloadingCert ? 'Downloading...' : 'Certificate'}
                                            </h4>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                                                {certificates.length > 0 ? 'Download certificate' : 'Unlock on completion'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="md:hidden w-full mt-2.5">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                            {downloadingCert ? 'Downloading...' : 'Certificate'}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                                            {certificates.length > 0 ? 'Download certificate' : 'Unlock on completion'}
                                        </p>
                                    </div>
                                    <div className="hidden md:flex w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:bg-red-600 group-hover:text-white items-center justify-center shrink-0 transition-colors ml-2">
                                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* ══════ 3. COMMUNITY & SOCIAL ROW (Sample Image Card 3 & 4) ══════ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 select-none">
                            {/* WhatsApp Card */}
                            <a
                                href="https://whatsapp.com/channel/0029Vb8nHh8LdQeYcWSNzi0i"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 sm:p-5 shadow-md flex items-center justify-between gap-4 group transition-transform hover:scale-[1.01]"
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-48 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
                                <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                                        <img
                                            src="/whatsapp-logo.png"
                                            alt="WhatsApp"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm sm:text-base font-black text-white">Join Our WhatsApp Group</h4>
                                        <p className="text-[11px] sm:text-xs text-red-100 font-medium">Get updates, notices and more</p>
                                    </div>
                                </div>
                                <div className="relative z-10 shrink-0">
                                    <span className="px-4 py-2 bg-white text-red-600 font-black rounded-full text-xs shadow-sm group-hover:bg-red-50 flex items-center gap-1.5 transition-all">
                                        <span>Join Now</span>
                                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </span>
                                </div>
                            </a>

                            {/* Instagram Card */}
                            <a
                                href="https://www.instagram.com/vinix_technology?stkn=aThjaGhjMW1zODdr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-4 sm:p-5 shadow-sm flex items-center justify-between gap-4 group transition-transform hover:scale-[1.01]"
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none opacity-20 bg-gradient-to-l from-red-600 to-transparent" />
                                <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4] p-0.5 shadow-sm flex items-center justify-center shrink-0">
                                        <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-[14px] flex items-center justify-center">
                                            <Instagram className="w-6 h-6 text-rose-500" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Follow Us on Instagram</h4>
                                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Stay connected for latest updates</p>
                                    </div>
                                </div>
                                <div className="relative z-10 shrink-0">
                                    <span className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-red-600 text-red-600 group-hover:bg-red-600 group-hover:text-white font-black text-xs transition-all flex items-center gap-1.5">
                                        <span>Follow</span>
                                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </span>
                                </div>
                            </a>
                        </div>

                        {/* ══════ 4. ADMIN VERIFICATION / TASK COMPLETION BANNER ══════ */}
                        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-50/90 via-red-50/50 to-rose-100/70 dark:from-red-950/30 dark:via-zinc-900 dark:to-red-950/40 border border-red-200/90 dark:border-red-900/40 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left select-none">
                            <div className="absolute right-0 top-0 bottom-0 w-64 opacity-15 pointer-events-none bg-gradient-to-l from-red-600 to-transparent" />
                            <div className="flex items-center gap-3.5 sm:gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/30">
                                    {isVerifiedAndIssued ? (
                                        <Check className="w-6 h-6 stroke-[3]" />
                                    ) : (
                                        <GraduationCap className="w-6 h-6" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                                        {isVerifiedAndIssued
                                            ? 'Admin Successfully Verified 🎉'
                                            : 'Complete All the Tasks & Download Certificate 🎓'}
                                    </h3>
                                    <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                                        {isVerifiedAndIssued
                                            ? 'Your payment and tasks have been verified. Download your verified completion certificate!'
                                            : 'Complete all milestone tasks and get admin verification to unlock and download your completion certificate!'}
                                    </p>
                                </div>
                            </div>
                            <div className="relative z-10 shrink-0 w-full sm:w-auto">
                                {isVerifiedAndIssued ? (
                                    <button
                                        onClick={() => {
                                            if (certificates.length > 0) {
                                                handleDownloadCertificateDirect(certificates[0]);
                                            } else {
                                                setActiveTab('certificates');
                                            }
                                        }}
                                        disabled={downloadingCert}
                                        className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-red-600/30 flex items-center justify-center gap-2 transition active:scale-95 whitespace-nowrap cursor-pointer"
                                    >
                                        <FileDown className="w-4 h-4 stroke-[2.5]" />
                                        <span>{downloadingCert ? 'Downloading...' : 'Download Certificate'}</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setActiveTab('overview');
                                            setTimeout(() => {
                                                document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' });
                                            }, 100);
                                        }}
                                        className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-red-600/30 flex items-center justify-center gap-2 transition active:scale-95 whitespace-nowrap cursor-pointer"
                                    >
                                        <ClipboardList className="w-4 h-4 stroke-[2.5]" />
                                        <span>Complete All Tasks</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ══════ 5. INTERNSHIP PROGRESS TRACKER ══════ */}
                        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 sm:p-6 shadow-sm text-left select-none">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 sm:mb-9">
                                <div className="flex items-center gap-2">
                                    <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 fill-red-500 shrink-0" />
                                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                                        Internship Progress
                                    </h3>
                                </div>

                                {/* Dynamic Live Progress Indicator */}
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1.5 ${
                                        isVerifiedAndIssued
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                            : isTasksCompleted
                                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                                : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    }`}>
                                        <span className={`w-2 h-2 rounded-full ${
                                            isVerifiedAndIssued ? 'bg-emerald-500' : isTasksCompleted ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                                        }`} />
                                        <span>
                                            {isVerifiedAndIssued
                                                ? 'Certified & Complete'
                                                : isTasksCompleted
                                                    ? 'Pending Verification'
                                                    : `${dynamicProgress}% Complete`}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            {/* Horizontal Progress Track */}
                            <div className="relative w-full pb-2">
                                {/* Base Track Line */}
                                <div className="absolute top-4 sm:top-4.5 left-6 sm:left-10 right-6 sm:right-10 h-[2.5px] bg-slate-300 dark:bg-zinc-700 -translate-y-1/2 rounded-full z-0" />

                                {/* Active Colored Progress Fill Line */}
                                <div
                                    className="absolute top-4 sm:top-4.5 left-6 sm:left-10 h-[2.5px] bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-400 -translate-y-1/2 rounded-full transition-all duration-700 z-0"
                                    style={{
                                        width: isVerifiedAndIssued
                                            ? 'calc(100% - 3rem)'
                                            : isTasksCompleted
                                                ? 'calc(50% - 1.5rem)'
                                                : isTasksInProgress
                                                    ? `calc(${16.66 + (dynamicProgress / 100) * 33.33}% - 1rem)`
                                                    : '16.66%'
                                    }}
                                />

                                {/* 3 Step Milestones */}
                                <div className="relative z-10 grid grid-cols-3 w-full">
                                    {/* Step 1: Application Submitted */}
                                    <div
                                        className="flex flex-col items-center text-center group cursor-pointer"
                                        onClick={() => showToast('Application submitted & approved!', 'success')}
                                    >
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 ring-4 ring-white dark:ring-zinc-900 transition-transform group-hover:scale-110">
                                            <Check className="w-4 h-4 stroke-[3]" />
                                        </div>
                                        <div className="mt-3">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                                Application Submitted
                                            </h4>
                                            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                                                Verified
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step 2: Tasks Completed & Approved */}
                                    <div
                                        className="flex flex-col items-center text-center group cursor-pointer"
                                        onClick={() => {
                                            setActiveTab('overview');
                                            setTimeout(() => {
                                                document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' });
                                            }, 100);
                                        }}
                                    >
                                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-zinc-900 transition-transform group-hover:scale-110 ${
                                            isTasksCompleted
                                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                                : isTasksInProgress
                                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 animate-pulse'
                                                    : 'bg-white dark:bg-zinc-800 border-2 border-slate-300 dark:border-zinc-700 text-slate-400'
                                        }`}>
                                            {isTasksCompleted ? (
                                                <Check className="w-4 h-4 stroke-[3]" />
                                            ) : isTasksInProgress ? (
                                                <span className="text-[10px] sm:text-xs font-black">{dynamicProgress}%</span>
                                            ) : (
                                                <Clock className="w-4 h-4 stroke-[2.5]" />
                                            )}
                                        </div>
                                        <div className="mt-3 max-w-[130px] sm:max-w-[180px]">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                                Tasks Completed & Approved
                                            </h4>
                                            <p className={`text-[10px] sm:text-xs font-semibold mt-0.5 ${
                                                isTasksCompleted
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : isTasksInProgress
                                                        ? 'text-amber-600 dark:text-amber-400'
                                                        : 'text-slate-400 dark:text-slate-500'
                                            }`}>
                                                {isTasksCompleted
                                                    ? 'All Tasks Approved'
                                                    : isTasksInProgress
                                                        ? `${approvedCount}/${totalTaskCount || 4} Approved`
                                                        : 'Pending Tasks'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step 3: Certificate */}
                                    <div
                                        className="flex flex-col items-center text-center group cursor-pointer"
                                        onClick={() => {
                                            if (isVerifiedAndIssued) {
                                                if (certificates.length > 0) {
                                                    handleDownloadCertificateDirect(certificates[0]);
                                                } else {
                                                    setActiveTab('certificates');
                                                }
                                            } else if (isTasksCompleted) {
                                                showToast('All tasks completed! Awaiting admin verification.', 'info');
                                            } else {
                                                showToast('Complete all milestone tasks to unlock certificate.', 'info');
                                            }
                                        }}
                                    >
                                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-zinc-900 transition-transform group-hover:scale-110 ${
                                            isVerifiedAndIssued
                                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                                : isTasksCompleted
                                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 animate-pulse'
                                                    : 'bg-white dark:bg-zinc-800 border-2 border-slate-300 dark:border-zinc-700 text-slate-400'
                                        }`}>
                                            {isVerifiedAndIssued ? (
                                                <Check className="w-4 h-4 stroke-[3]" />
                                            ) : isTasksCompleted ? (
                                                <Clock className="w-4 h-4 stroke-[2.5]" />
                                            ) : (
                                                <Award className="w-4 h-4 stroke-[2] opacity-40" />
                                            )}
                                        </div>
                                        <div className="mt-3">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                                Certificate
                                            </h4>
                                            <p className={`text-[10px] sm:text-xs font-semibold mt-0.5 ${
                                                isVerifiedAndIssued
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : isTasksCompleted
                                                        ? 'text-amber-600 dark:text-amber-400'
                                                        : 'text-slate-400 dark:text-slate-500'
                                            }`}>
                                                {isVerifiedAndIssued
                                                    ? 'Ready to Download'
                                                    : isTasksCompleted
                                                        ? 'Verification'
                                                        : 'Locked'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Milestone Tasks & Quest Log Section */}
                        <div className="space-y-8">

                                {/* 100% Completion Payment Prompt Banner */}
                                {dynamicProgress === 100 && activeEnrollment && !activeEnrollment.application_status?.startsWith('PAYMENT_') && !activeEnrollment.application_status?.startsWith('ISSUED:') && certificates.length === 0 && (
                                    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-lg relative overflow-hidden text-left animate-fade-in-up">
                                        <div className="hidden sm:flex absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                                            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                                        </div>
                                        <div className="p-4 bg-white/20 rounded-2xl flex-shrink-0 backdrop-blur-md">
                                            <Award className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1 text-white z-10">
                                            <h3 className="text-xl font-black mb-1">Congratulations! You've completed all tasks!</h3>
                                            <p className="text-sm text-red-100 font-medium">
                                                Your internship progress is at 100%. Please complete your certificate processing fee to receive your verified completion certificate.
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 z-10 w-full sm:w-auto">
                                            <button
                                                onClick={() => setActiveTab('payment')}
                                                className="w-full sm:w-auto px-8 py-3.5 bg-white text-red-600 hover:bg-red-50 text-sm font-bold rounded-xl shadow-lg shadow-black/10 transition-colors"
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
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center space-x-3 text-left">
                                            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Payment Successful</h4>
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
                                <div id="tasks-section" className="mt-12 space-y-6">
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
                                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${isSuccess ? 'bg-[#22c55e]/15 text-[#22c55e]' : isLinkedInTask ? 'bg-red-50 text-red-600' : isResubmitRequired ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50' : 'bg-red-50 text-red-600'}`}>
                                                                {isLinkedInTask ? <Linkedin className="w-5 h-5 fill-current" /> : (task.internship_tasks?.task_number || (idx + 1))}
                                                            </div>
                                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${isSuccess ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : isResubmitRequired ? 'bg-amber-50 text-amber-600 border border-amber-200' : isSubmitted ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
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
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 uppercase tracking-wide">
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
                                                            {isResubmitRequired && (
                                                                <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-left">
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                                        <span>Mentor Feedback (Changes Required):</span>
                                                                    </div>
                                                                    <p className="text-[12px] text-slate-700 dark:text-slate-300 italic leading-snug whitespace-pre-wrap break-words">
                                                                        "{task.admin_feedback || 'Your mentor has requested revisions on this submission. Please update your solution and resubmit.'}"
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Mentor feedback note if milestone is approved */}
                                                            {isSuccess && task.admin_feedback && (
                                                                <div className="p-3 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-left">
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">
                                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                        <span>Mentor Review Feedback:</span>
                                                                    </div>
                                                                    <p className="text-[12px] text-slate-700 dark:text-slate-300 italic leading-snug whitespace-pre-wrap break-words">
                                                                        "{task.admin_feedback}"
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Mock key features and expected outcome as per layout request */}
                                                            <div className="space-y-3 mt-4 border-t border-slate-100 pt-4 px-1">
                                                                <div>
                                                                    <h5 className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest mb-1">Key Features:</h5>
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
                                                                <div className="w-full py-3 bg-red-50 text-red-600 rounded-2xl text-center text-[13px] font-extrabold flex items-center justify-center gap-2 border border-red-200">
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
                                                                    <button type="submit" disabled={submittingLinkedin} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-500/20 cursor-pointer">
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
                                                                    className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-2xl text-[13px] font-bold transition shadow-md shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer"
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
                        </div>
                    )}



                        {/* Tab display: virtual student ID card */}
                        {activeTab === 'idcard' && (
                            <div className="space-y-6">
                                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center space-x-2 text-slate-800 dark:text-white">
                                            <CreditCard className="w-5 h-5 text-brand-primary" />
                                            <span>Virtual Internship ID Card</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Official digital credentials and authentic badge for Vinix interns.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleIdCardPrint}
                                        className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>Print / Save as PDF</span>
                                    </button>
                                </div>

                                {/* HIGH FIDELITY ID CARD BODY WITH LANYARD RIG */}
                                <div className="flex flex-col items-center justify-center py-6 select-none">

                                    <div className="flex flex-col items-center relative">
                                        {/* Metallic Clip Assembly */}
                                        <div className="flex flex-col items-center relative z-10 -mb-4 no-print">
                                            <div className="w-11 h-10 bg-gradient-to-b from-white/95 to-slate-100/90 border border-slate-300 rounded-t-lg rounded-b flex items-center justify-center shadow-md relative">
                                                <div className="w-3.5 h-3.5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#cbd5e1_55%,#94a3b8_100%)] shadow-sm relative flex items-center justify-center">
                                                    <div className="w-1 h-1 rounded-full bg-slate-500/70"></div>
                                                </div>
                                            </div>
                                            <div className="w-8 h-7 -mt-1 bg-gradient-to-b from-white/50 via-slate-200/70 to-slate-300/90 border border-white/80 rounded shadow-sm"></div>
                                        </div>

                                        {/* Physical ID Card Container */}
                                        <div
                                            id="id-card-print-area"
                                            className="w-[380px] max-w-[92vw] bg-white rounded-[28px] border border-slate-200/90 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.18)] p-5 relative overflow-hidden text-left"
                                        >
                                            {/* Lanyard punch slot */}
                                            <div className="w-12 h-2.5 bg-slate-200 border border-slate-300 rounded-full mx-auto mb-3 shadow-inner"></div>

                                            {/* Cyber vector circuit traces in background */}
                                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 380 520" fill="none">
                                                <path d="M 295 170 L 270 170 L 255 188 L 255 228" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                                                <circle cx="255" cy="228" r="3.2" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" opacity="0.9"/>
                                                <path d="M 255 228 L 276 228 L 276 260 L 295 280" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                                                <path d="M 262 296 L 262 316 L 288 332" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
                                                <circle cx="262" cy="296" r="2.5" fill="#38bdf8" opacity="0.85"/>
                                                <path d="M 98 285 L 98 310 L 82 328 L 82 355" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                                                <path d="M 102 382 L 108 382 L 118 396" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                                                <circle cx="108" cy="382" r="2" fill="#38bdf8"/>
                                                <path d="M 134 402 L 158 402 L 172 416 L 198 416" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                                            </svg>

                                            <div className="relative z-10 flex flex-col">
                                                {/* Header Company Logo */}
                                                <div className="flex flex-col items-center justify-center mb-4">
                                                    <div className="h-10 flex items-center justify-center">
                                                        <img
                                                            src={window.location.origin + import.meta.env.BASE_URL + 'COMPANY LOGO.png'}
                                                            onError={(e: any) => {
                                                                e.target.onerror = null;
                                                                e.target.src = window.location.origin + import.meta.env.BASE_URL + 'vinix-title.png';
                                                            }}
                                                            alt="VINIX"
                                                            className="h-9 max-w-[210px] object-contain"
                                                        />
                                                    </div>
                                                    <div className="text-[8px] font-extrabold text-slate-500 uppercase tracking-[3px] mt-1.5 flex items-center gap-1.5">
                                                        BUILD <span className="text-slate-400">•</span> DESIGN <span className="text-slate-400">•</span> GROW
                                                    </div>
                                                </div>

                                                {/* Middle Student Info Grid */}
                                                <div className="grid grid-cols-[112px_1fr] gap-3.5 items-start mb-3.5">
                                                    {/* Photo Column */}
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-rose-500 via-red-600 to-red-700 shadow-[0_0_0_3px_rgba(220,38,38,0.25),0_6px_16px_rgba(220,38,38,0.25)] flex items-center justify-center overflow-hidden">
                                                            {authenticAvatar ? (
                                                                <img
                                                                    src={authenticAvatar}
                                                                    alt={profile?.full_name || 'Student'}
                                                                    className="w-full h-full object-cover rounded-full border-2 border-white bg-slate-100"
                                                                    onError={(e: any) => {
                                                                        e.target.style.display = 'none';
                                                                        const fallback = e.target.nextElementSibling;
                                                                        if (fallback) fallback.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className={`w-full h-full rounded-full border-2 border-white bg-gradient-to-br from-slate-50 via-red-50 to-red-100 items-center justify-center text-red-800 font-black text-2xl tracking-wide select-none shadow-inner ${authenticAvatar ? 'hidden' : 'flex'}`}
                                                            >
                                                                {(profile?.full_name || 'S').trim().charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-black text-slate-900 mt-2 leading-tight">
                                                            {profile?.full_name || 'Student Name'}
                                                        </div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] mt-1"></div>
                                                    </div>

                                                    {/* Details Column */}
                                                    <div className="flex flex-col gap-1.5 text-left">
                                                        <div>
                                                            <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">STUDENT ID:</span>
                                                            <span className="text-xs font-black text-slate-900 tracking-tight font-mono">
                                                                {activeOffer?.offer_letter_id || 'VINIX-2026-6391'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">NAME:</span>
                                                            <span className="text-[14px] font-black text-slate-950 tracking-tight leading-tight block">
                                                                {profile?.full_name || 'Vishal Rajesh'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">ROLE:</span>
                                                            <span className="text-xs font-extrabold text-[#0284c7] tracking-tight block">
                                                                {activeEnrollment ? `${activeEnrollment.internship.title} Intern` : 'Full Stack Developer Intern'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">DEPARTMENT:</span>
                                                            <span className="text-[11px] font-bold text-slate-800 tracking-tight block">
                                                                {activeEnrollment?.internship.domain || 'Software & Web Engg'}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-1.5">
                                                            <div>
                                                                <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">JOINING:</span>
                                                                <span className="text-[11px] font-bold text-slate-900 block">
                                                                    {activeEnrollment?.joined_at ? new Date(activeEnrollment.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '22 Aug 2026'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">VALID THRU:</span>
                                                                <span className="text-[11px] font-bold text-slate-900 block">August 2027</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider block">GMAIL:</span>
                                                            <span className="text-[10.5px] font-bold text-[#0284c7] break-all block">
                                                                {user?.email || 'vr271028@gmail.com'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Dashed Separator */}
                                                <div className="border-t border-dashed border-sky-200 my-2.5 w-full"></div>

                                                {/* Lower Row: Hologram Chip + Verified Status + Working QR Code */}
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2.5">
                                                            {/* Authentic Hologram Chip */}
                                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white via-sky-50 to-sky-100 border border-sky-300 shadow-sm flex flex-col items-center justify-center p-1 flex-shrink-0">
                                                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                                                    <path d="M6 7 L12 18 L18 7" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                                <span className="text-[5px] font-black text-[#0369a1] tracking-wider uppercase mt-0.5">AUTHENTIC</span>
                                                            </div>

                                                            {/* Verified Badge */}
                                                            <div>
                                                                <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#0284c7] uppercase tracking-wide">
                                                                    <svg className="w-3 h-3 fill-[#0284c7]" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                                    </svg>
                                                                    VERIFIED ID
                                                                </div>
                                                                <div className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                                                                    RFID &amp; ENCRYPTED
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Portal Link */}
                                                        <div>
                                                            <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-wider block">PORTAL:</span>
                                                            <a href="https://vinix.online" target="_blank" rel="noreferrer" className="text-xs font-black text-[#0284c7] hover:underline">
                                                                vinix.online
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/* Working QR Code */}
                                                    <div className="flex flex-col items-center flex-shrink-0">
                                                        <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">SCAN FOR PROFILE</span>
                                                        <a
                                                            href={`https://vinix.online/verify/offer/${activeOffer?.offer_letter_id || 'VINIX-OFFER-6391'}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Click or scan to verify student credentials"
                                                            className="w-16 h-16 p-1 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center hover:scale-105 transition-transform hover:border-sky-400"
                                                        >
                                                            <img
                                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                                                    `https://vinix.online/verify/offer/${activeOffer?.offer_letter_id || 'VINIX-OFFER-6391'}`
                                                                )}&margin=0`}
                                                                alt="Verify QR"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Footer Pill Capsule */}
                                                <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                                                    <div className="w-5 h-5 rounded bg-sky-100 border border-sky-300 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3 h-3 text-[#0284c7]" viewBox="0 0 20 20" fill="none">
                                                            <path d="M5 6 L10 15 L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    </div>
                                                    <span className="text-[9.5px] font-bold text-slate-700 tracking-tight text-center flex-1">
                                                        vinix.online &nbsp;|&nbsp; contact@vinix.online
                                                    </span>
                                                    <div className="grid grid-cols-3 gap-0.5 flex-shrink-0">
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
                                                    className="w-full sm:w-auto px-10 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition shadow shadow-red-600/25 flex items-center justify-center space-x-2 mb-6"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    <span>Pay via GPay / UPI App</span>
                                                </a>

                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Supported Payment Apps</span>
                                                <div className="flex items-center space-x-2 mb-8">
                                                    <span className="px-3 py-1 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-xs font-bold rounded-full">GPay</span>
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
                                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono outline-none shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-shadow"
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
                            <div className="space-y-6 text-left animate-fade-in">
                                {/* Header Banner */}
                                <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-zinc-950 via-[#111116] to-black border border-red-900/30 text-white p-6 sm:p-8 shadow-xl">
                                    <div className="absolute -top-12 -left-12 w-48 h-48 bg-red-600/30 rounded-full blur-3xl pointer-events-none" />
                                    <div className="absolute -bottom-12 -right-12 w-72 h-72 bg-gradient-to-tl from-red-600/40 via-rose-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                                    <GraduationCap className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-40 text-white/[0.04] pointer-events-none transform -rotate-12" />

                                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="space-y-1.5">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-wider">
                                                <Award className="w-3.5 h-3.5 text-red-500" />
                                                <span>Official Credentials</span>
                                            </div>
                                            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                                Verified Certificates &amp; Credentials
                                            </h2>
                                            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                                                Official internship completion certificates with tamper-proof blockchain &amp; QR verification.
                                            </p>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2">
                                            {effectiveCertificates.length > 0 ? (
                                                <span className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                    <span>1 Certificate Issued</span>
                                                </span>
                                            ) : isTasksCompleted ? (
                                                <span className="px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-amber-400" />
                                                    <span>Pending Verification</span>
                                                </span>
                                            ) : (
                                                <span className="px-4 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-slate-300 text-xs font-black flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <span>{dynamicProgress}% Completed</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {effectiveCertificates.length === 0 ? (
                                    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl p-8 sm:p-12 shadow-sm text-center">
                                        <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
                                            <Award className="w-10 h-10 stroke-[2.2]" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                            Certificate Locked — Complete Tasks to Unlock
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                                            Your completion certificate for <strong className="text-slate-800 dark:text-slate-200">{studentTrackTitle}</strong> will be generated once all milestone tasks are approved by mentors.
                                        </p>

                                        {/* Progress bar inside card */}
                                        <div className="max-w-md mx-auto mt-6 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                                                <span>Milestone Progress</span>
                                                <span className="text-red-600 dark:text-red-400">{approvedCount}/{totalTaskCount} Tasks Approved ({dynamicProgress}%)</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${dynamicProgress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Steps to Unlock */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-6 text-left">
                                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                                    isTasksCompleted ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'
                                                }`}>
                                                    {isTasksCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Complete Tasks</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{approvedCount}/{totalTaskCount} approved</p>
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                                    isVerifiedAndIssued ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-500'
                                                }`}>
                                                    {isVerifiedAndIssued ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Admin Review</p>
                                                    <p className="text-[10px] text-slate-400 truncate">Verification check</p>
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                                    isVerifiedAndIssued ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-500'
                                                }`}>
                                                    {isVerifiedAndIssued ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Get Certificate</p>
                                                    <p className="text-[10px] text-slate-400 truncate">Instant PDF &amp; link</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                            {dynamicProgress === 100 ? (
                                                <button
                                                    onClick={() => setActiveTab('payment')}
                                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-red-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                                                >
                                                    <span>Proceed to Certificate Fee Payment</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setActiveTab('overview');
                                                        setTimeout(() => {
                                                            document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' });
                                                        }, 100);
                                                    }}
                                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-red-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                                                >
                                                    <span>Go to My Tasks to Complete</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {effectiveCertificates.map((cert) => (
                                            <div
                                                key={cert.id}
                                                className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-sm text-left group hover:border-red-500/40 transition-all duration-300"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-20 bg-gradient-to-bl from-red-600 to-transparent rounded-bl-full" />

                                                <div className="flex items-start justify-between gap-3">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span>Verified &amp; Authentic</span>
                                                    </span>
                                                    <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-zinc-500">
                                                        {cert.certificate_number}
                                                    </span>
                                                </div>

                                                <div className="mt-4 space-y-1">
                                                    <h4 className="text-lg font-black text-slate-900 dark:text-white capitalize group-hover:text-red-600 transition-colors">
                                                        {cert.course_name}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                        Issued to <strong className="text-slate-800 dark:text-slate-200">{cert.student_name || studentFullName}</strong>
                                                    </p>
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-405">
                                                    <span className="text-[11px] font-medium text-slate-400">
                                                        Issued: {new Date(cert.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>

                                                <div className="mt-4 pt-3 flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => handleDownloadCertificateDirect(cert)}
                                                        disabled={downloadingCert}
                                                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/25 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                                                    >
                                                        <FileDown className="w-3.5 h-3.5 stroke-[2.5]" />
                                                        <span>{downloadingCert ? 'Generating...' : 'Download PDF'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/verify/${cert.certificate_number}`)}
                                                        className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        <span>Verify Online</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/verify/${cert.certificate_number}`);
                                                            showToast('Certificate verification link copied!', 'success');
                                                        }}
                                                        className="p-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
                                                        title="Copy Verification Link"
                                                    >
                                                        <Sparkles className="w-4 h-4 text-red-500" />
                                                    </button>
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
            </div>

            {/* Modal / Dialog for Milestone Submission Form */}
            {
                selectedTaskForSubmission && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm select-none overflow-y-auto animate-fade-in">
                        <div className="bg-white dark:bg-brand-cardDark border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative text-left max-h-[92vh] flex flex-col overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                                <div className="min-w-0 pr-2">
                                    <h3 className="text-base sm:text-lg font-bold flex items-center space-x-2 text-slate-900 dark:text-white truncate">
                                        <FileCode className="w-5 h-5 text-brand-primary shrink-0" />
                                        <span className="truncate">{selectedTaskForSubmission.status === 'resubmission_required' ? 'Resubmit Milestone Solution' : 'Submit Milestone Solution'}</span>
                                    </h3>
                                    <p className="text-xs text-brand-primary dark:text-brand-accent mt-0.5 uppercase font-bold tracking-wide truncate">
                                        {selectedTaskForSubmission.internship_tasks?.title}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedTaskForSubmission(null);
                                        setGithubUrl('');
                                        setStudentNote('');
                                        setProjectImageUrl('');
                                    }}
                                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
                                    aria-label="Close dialog"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form with scrollable body & sticky footer */}
                            <form onSubmit={handleMilestoneSubmission} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                                    {/* Mentor feedback note if resubmitting */}
                                    {selectedTaskForSubmission.status === 'resubmission_required' && (
                                        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs">
                                            <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wide">
                                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                <span>Mentor Feedback (Changes Required):</span>
                                            </div>
                                            <div className="max-h-28 overflow-y-auto pr-1">
                                                <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed whitespace-pre-wrap break-words">
                                                    "{selectedTaskForSubmission.admin_feedback || 'Your mentor has requested changes on this milestone. Please update your code and submit your revision.'}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

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
                                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block">
                                                Submission Notes / Code Summary
                                            </label>
                                            <span className="text-[9px] text-slate-400 font-medium">Explain your implementation</span>
                                        </div>
                                        <textarea
                                            required
                                            value={studentNote}
                                            onChange={(e) => setStudentNote(e.target.value)}
                                            placeholder={selectedTaskForSubmission.status === 'resubmission_required' ? "Describe the changes and fixes you made based on the evaluator feedback..." : "Describe your design choices, database schema config, or features completed..."}
                                            rows={4}
                                            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary resize-none"
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
                                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary"
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
                                </div>

                                {/* Modal Footer (Sticky/Pinned at bottom) */}
                                <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex space-x-3 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTaskForSubmission(null);
                                            setGithubUrl('');
                                            setStudentNote('');
                                            setProjectImageUrl('');
                                        }}
                                        disabled={submittingTask}
                                        className="flex-1 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 text-xs font-bold rounded-xl transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingTask}
                                        className={`flex-1 py-2.5 sm:py-3 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer ${
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
                    <div style={{ position: 'fixed', left: '-99999px', top: 0, width: '794px', height: '1123px', overflow: 'hidden', zIndex: -100, opacity: 1, pointerEvents: 'none' }}>
                        <div
                            id="offer-letter-download-area"
                            className="bg-white select-text text-left overflow-hidden z-10 font-sans relative offer-letter mx-auto"
                        >
                            {/* Watermark */}
                            <div className="doc-watermark">VINIX TECHNOLOGIES</div>

                            {/* Top Ribbon Stripe */}
                            <div className="doc-top-bar"></div>

                            {/* 4-Tier Luxury Royal Red & Gold Frame */}
                            <div className="doc-frame-outer"></div>
                            <div className="doc-frame-gold-mid"></div>
                            <div className="doc-frame-inner"></div>
                            <div className="doc-frame-gold-hairline"></div>

                            {/* 4 Corner Ornate Accents */}
                            <svg className="doc-corner-filigree doc-corner-tl" viewBox="0 0 40 40"><path d="M 4 36 L 4 4 L 36 4" fill="none" stroke="#d4af37" strokeWidth="2.5"/><path d="M 9 32 L 9 9 L 32 9" fill="none" stroke="#b71c1c" strokeWidth="1.5"/><circle cx="9" cy="9" r="2.5" fill="#800000"/><circle cx="4" cy="4" r="2" fill="#d4af37"/></svg>
                            <svg className="doc-corner-filigree doc-corner-tr" viewBox="0 0 40 40"><path d="M 4 36 L 4 4 L 36 4" fill="none" stroke="#d4af37" strokeWidth="2.5"/><path d="M 9 32 L 9 9 L 32 9" fill="none" stroke="#b71c1c" strokeWidth="1.5"/><circle cx="9" cy="9" r="2.5" fill="#800000"/><circle cx="4" cy="4" r="2" fill="#d4af37"/></svg>
                            <svg className="doc-corner-filigree doc-corner-bl" viewBox="0 0 40 40"><path d="M 4 36 L 4 4 L 36 4" fill="none" stroke="#d4af37" strokeWidth="2.5"/><path d="M 9 32 L 9 9 L 32 9" fill="none" stroke="#b71c1c" strokeWidth="1.5"/><circle cx="9" cy="9" r="2.5" fill="#800000"/><circle cx="4" cy="4" r="2" fill="#d4af37"/></svg>
                            <svg className="doc-corner-filigree doc-corner-br" viewBox="0 0 40 40"><path d="M 4 36 L 4 4 L 36 4" fill="none" stroke="#d4af37" strokeWidth="2.5"/><path d="M 9 32 L 9 9 L 32 9" fill="none" stroke="#b71c1c" strokeWidth="1.5"/><circle cx="9" cy="9" r="2.5" fill="#800000"/><circle cx="4" cy="4" r="2" fill="#d4af37"/></svg>

                            {/* Header Section */}
                            <div className="doc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '2px', zIndex: 2 }}>
                                <div className="header-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div className="header-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span className="header-logo" style={{ height: '48px', display: 'flex', alignItems: 'center' }}>
                                            <img crossOrigin="anonymous" src={window.location.origin + import.meta.env.BASE_URL + 'vinix-title.png'} alt="VINIX Logo" style={{ height: '48px', objectFit: 'contain' }} />
                                        </span>
                                        <div className="header-branding-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <span className="company-name" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '1.25rem', color: '#111111', lineHeight: 1.1, letterSpacing: '1px' }}>VINIX</span>
                                            <span className="company-tagline" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 800, color: '#b71c1c', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px' }}>Empowering Future Innovators</span>
                                        </div>
                                    </div>
                                    <div className="company-contact-row" style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '4px', fontWeight: 600, letterSpacing: '0.3px' }}>
                                        academic@vinix.online • www.vinix.online
                                    </div>
                                </div>
                                <div className="header-right" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div className="meta-item" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="meta-label" style={{ fontSize: '0.55rem', color: '#b71c1c', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1px' }}>INTERNSHIP ID</span>
                                        <span className="meta-value" style={{ fontSize: '0.75rem', fontWeight: 750, color: '#111111' }}>{activeOffer.offer_letter_id}</span>
                                    </div>
                                    <div className="meta-item" style={{ marginTop: '4px', display: 'flex', flexDirection: 'column' }}>
                                        <span className="meta-label" style={{ fontSize: '0.55rem', color: '#b71c1c', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1px' }}>ISSUE DATE</span>
                                        <span className="meta-value" style={{ fontSize: '0.75rem', fontWeight: 750, color: '#111111' }}>
                                            {(() => {
                                                const d = new Date(activeOffer.issue_date);
                                                return isNaN(d.getTime()) ? activeOffer.issue_date : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider Line */}
                            <div className="header-line" style={{ width: '100%', height: '2.5px', background: 'linear-gradient(90deg, #800000 0%, #b71c1c 30%, #d4af37 50%, #b71c1c 70%, #800000 100%)', marginTop: '8px', marginBottom: '12px', zIndex: 2, borderRadius: '2px' }}></div>

                            {/* Body Content */}
                            <div className="doc-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', zIndex: 2, paddingTop: '2px' }}>
                                <div className="offer-ribbon-tag" style={{ display: 'inline-block', textAlign: 'center', background: 'linear-gradient(135deg, #7f0000 0%, #b71c1c 50%, #991b1b 100%)', backgroundColor: '#800000', color: '#ffffff', fontFamily: 'Montserrat, Inter, sans-serif', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', height: '24px', lineHeight: '22px', padding: '0 20px', borderRadius: '9999px', border: '1.5px solid #d4af37', boxShadow: '0 2px 8px rgba(183, 28, 28, 0.3)', marginBottom: '8px', boxSizing: 'border-box', verticalAlign: 'middle', whiteSpace: 'nowrap', width: 'fit-content' }}>
                                    <span style={{ color: '#ffffff', display: 'inline', lineHeight: 'inherit', fontWeight: 800 }}>★ OFFICIAL VERIFIED CREDENTIAL ★</span>
                                </div>

                                <h1 className="document-title" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '1.25rem', color: '#111111', marginBottom: '3px', letterSpacing: '1px', textTransform: 'uppercase' }}>INTERNSHIP OFFER LETTER</h1>
                                <div className="document-date" style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '10px', fontWeight: 600 }}>
                                    Date: {(() => {
                                        const d = new Date(activeOffer.issue_date);
                                        return isNaN(d.getTime()) ? activeOffer.issue_date : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                                    })()}
                                </div>

                                <div className="greeting-block" style={{ fontSize: '0.73rem', color: '#1e293b', marginBottom: '6px' }}>
                                    Dear <strong style={{ color: '#111111' }}>{activeOffer.student_name}</strong>,
                                </div>

                                <div className="intro-paragraph" style={{ fontSize: '0.72rem', lineHeight: '1.45', color: '#334155', marginBottom: '6px', textAlign: 'justify' }}>
                                    We are delighted to offer you the position of <strong style={{ color: '#111111' }}>Virtual Intern – {activeOffer.internship_title}</strong> at <strong style={{ color: '#111111' }}>Vinix Technologies</strong>. After reviewing your application, we are confident that your skills and enthusiasm make you a valuable addition to our program.
                                </div>

                                <div className="intro-sub-paragraph" style={{ fontSize: '0.72rem', lineHeight: '1.45', color: '#334155', marginBottom: '8px', textAlign: 'justify' }}>
                                    Your virtual internship details and key particulars are finalized as follows:
                                </div>

                                {/* Particulars Table */}
                                <table className="particulars-table" style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '6px', overflow: 'hidden', border: '1.5px solid rgba(212, 175, 55, 0.45)', marginBottom: '10px', fontSize: '0.7rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
                                    <thead>
                                        <tr>
                                            <th colSpan={2} style={{ background: 'linear-gradient(135deg, #111111 0%, #800000 55%, #b71c1c 100%)', color: '#ffffff', fontWeight: 800, padding: '7px 12px', textAlign: 'left', fontSize: '0.68rem', letterSpacing: '1px', borderBottom: '2px solid #d4af37' }}>INTERNSHIP PROGRAM PARTICULARS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#475569', width: '35%' }}>Internship Track</td>
                                            <td className="value-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#111111' }}>{activeOffer.internship_title}</td>
                                        </tr>
                                        <tr style={{ backgroundColor: '#faf9f6' }}>
                                            <td className="label-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#475569', width: '35%' }}>Intern ID</td>
                                            <td className="value-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#111111' }}>{activeOffer.offer_letter_id}</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#475569', width: '35%' }}>Duration</td>
                                            <td className="value-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#111111' }}>{activeOffer.duration || '4 Weeks'}</td>
                                        </tr>
                                        <tr style={{ backgroundColor: '#faf9f6' }}>
                                            <td className="label-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#475569', width: '35%' }}>Commencement Date</td>
                                            <td className="value-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#111111' }}>
                                                {(() => {
                                                    const d = new Date(activeOffer.issue_date);
                                                    if (isNaN(d.getTime())) return '01-Sep-2026';
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
                                                })()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#475569', width: '35%' }}>Estimated Completion</td>
                                            <td className="value-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#111111' }}>
                                                {(() => {
                                                    const d = new Date(activeOffer.issue_date);
                                                    if (isNaN(d.getTime())) return '28-Sep-2026';
                                                    const num = parseInt(activeOffer.duration) || 1;
                                                    if ((activeOffer.duration || '').toLowerCase().includes('week')) {
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
                                        <tr style={{ backgroundColor: '#faf9f6' }}>
                                            <td className="label-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#475569', width: '35%' }}>Stipend Details</td>
                                            <td className="value-cell" style={{ padding: '5px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#111111' }}>Unpaid (Performance-Based Internship)</td>
                                        </tr>
                                        <tr>
                                            <td className="label-cell" style={{ padding: '5px 12px', borderBottom: 'none', fontWeight: 600, color: '#475569', width: '35%' }}>Location &amp; Model</td>
                                            <td className="value-cell" style={{ padding: '5px 12px', borderBottom: 'none', fontWeight: 700, color: '#111111' }}>Remote / Virtual</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* General Terms & Conditions */}
                                <div className="terms-card" style={{ border: '1px solid rgba(212, 175, 55, 0.4)', borderLeft: '3.5px solid #800000', borderRadius: '6px', padding: '8px 12px', marginBottom: '8px', backgroundColor: '#fdfbf7' }}>
                                    <span className="card-title" style={{ color: '#800000', fontSize: '0.72rem', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>General Terms &amp; Conditions of Internship:</span>
                                    <div className="terms-list" style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.7rem', lineHeight: '1.38', color: '#334155' }}>
                                        <div className="bullet-item"><strong>1. Task Execution:</strong> You will be evaluated based on the functional completeness of the assigned tasks. You must submit weekly progress updates.</div>
                                        <div className="bullet-item"><strong>2. Code of Conduct:</strong> Plagiarism or any forms of professional misconduct will lead to immediate cancellation of your internship program.</div>
                                        <div className="bullet-item"><strong>3. Confidentiality:</strong> Any documentation, source code, or mock datasets shared during this program are strictly confidential.</div>
                                        <div className="bullet-item"><strong>4. Certification:</strong> An official Certificate of Internship Completion will be issued only upon successful submission and mentoring approval of all milestone tasks.</div>
                                    </div>
                                </div>

                                {/* Certificate Section */}
                                <div className="cert-completion-card" style={{ border: '1px solid rgba(212, 175, 55, 0.4)', borderLeft: '3.5px solid #d4af37', borderRadius: '6px', padding: '8px 12px', marginBottom: '8px', backgroundColor: '#ffffff' }}>
                                    <span className="card-title" style={{ color: '#111111', fontSize: '0.72rem', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>CERTIFICATE OF COMPLETION</span>
                                    <div className="completion-text" style={{ fontSize: '0.7rem', lineHeight: '1.4', color: '#334155', textAlign: 'justify' }}>
                                        Upon successful completion of the internship and fulfillment of all assigned tasks, you will receive a Certificate of Internship with QR-code verification for authenticity.
                                    </div>
                                </div>

                                <div className="outro-paragraph" style={{ fontSize: '0.7rem', lineHeight: '1.4', color: '#334155', marginBottom: '6px' }}>
                                    Please return the signed copy of this letter as a token of your formal acceptance of this offer. We look forward to a mutually rewarding learning experience.
                                </div>
                            </div>

                            {/* Signatures Section */}
                            <div className="signatures-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', width: '100%', paddingBottom: '6px', zIndex: 2 }}>
                                {/* Company Seal (Left) */}
                                <div className="sig-col" style={{ display: 'flex', flexDirection: 'column', width: '33%', alignItems: 'flex-start' }}>
                                    <div className="sig-image-wrap" style={{ height: '64px', display: 'flex', alignItems: 'flex-end', position: 'relative', marginBottom: '3px' }}>
                                        <img crossOrigin="anonymous" src={window.location.origin + import.meta.env.BASE_URL + 'certificate-stamp.jpeg'} alt="Official Seal" className="stamp-overlay" style={{ width: '64px', height: '64px', objectFit: 'contain', opacity: 0.92 }} />
                                    </div>
                                    <div className="sig-title" style={{ fontSize: '0.58rem', color: '#800000', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.8px', lineHeight: '14px' }}>COMPANY SEAL</div>
                                </div>

                                {/* Director Signatory (Right) */}
                                <div className="sig-col" style={{ display: 'flex', flexDirection: 'column', width: '33%', alignItems: 'flex-end', textAlign: 'right', marginLeft: 'auto' }}>
                                    <div className="sig-image-wrap" style={{ height: '64px', display: 'flex', alignItems: 'flex-end', position: 'relative', marginBottom: '3px', justifyContent: 'flex-end' }}>
                                        <img crossOrigin="anonymous" src={window.location.origin + import.meta.env.BASE_URL + 'founder-sign.png'} alt="Director Signature" className="sig-image" style={{ maxHeight: '42px', objectFit: 'contain' }} />
                                    </div>
                                    <div className="sig-name" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.86rem', color: '#111111', lineHeight: '16px' }}>Vishal R</div>
                                    <div className="sig-title" style={{ fontSize: '0.58rem', color: '#800000', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.8px', lineHeight: '14px', marginTop: '1px' }}>FOUNDER &amp; CEO</div>
                                </div>
                            </div>

                            {/* Footer with MSME, Partners & Official Record ID */}
                            <div className="doc-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.62rem', color: '#64748b', fontWeight: 600, zIndex: 2, borderTop: '1.5px solid #d4af37', paddingTop: '8px', paddingBottom: '2px', marginTop: 'auto' }}>
                                {/* Left Column: MSME + Skyrovix */}
                                <div className="footer-left-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
                                    <img crossOrigin="anonymous" src={window.location.origin + import.meta.env.BASE_URL + 'msme.png'} alt="MSME Logo" style={{ height: '34px', objectFit: 'contain' }} />
                                    <div style={{ width: '1px', height: '24px', backgroundColor: '#cbd5e1' }}></div>
                                    <img crossOrigin="anonymous" src={window.location.origin + import.meta.env.BASE_URL + 'skyrovix.jpeg'} alt="Skyrovix Logo" style={{ height: '24px', objectFit: 'contain' }} />
                                </div>
                                {/* Center Column: Text */}
                                <div className="footer-text" style={{ textAlign: 'center', lineHeight: 1.45, color: '#475569', fontSize: '0.62rem', flex: 1, padding: '0 6px' }}>
                                    <strong style={{ color: '#111111', fontWeight: 800, fontSize: '0.65rem' }}>VINIX Technologies Private Limited</strong><br />
                                    <span style={{ color: '#b71c1c', fontWeight: 700 }}>UDYAM Registry:</span> <span style={{ color: '#111111', fontWeight: 700 }}>UDYAM-TN-21-0066185</span><br />
                                    <span style={{ color: '#64748b', fontSize: '0.58rem' }}>academic@vinix.online • www.vinix.online</span>
                                </div>
                                {/* Right Column: Yrnovatech & Official Record Badge */}
                                <div className="footer-right-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', minWidth: '150px' }}>
                                    <img crossOrigin="anonymous" src={window.location.origin + import.meta.env.BASE_URL + 'yrnovatech.png'} alt="Yrnovatech Logo" style={{ height: '28px', objectFit: 'contain' }} />
                                    <div className="record-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <div style={{ fontSize: '0.52rem', letterSpacing: '1px', color: '#800000', fontWeight: 800, textTransform: 'uppercase', lineHeight: '13px', whiteSpace: 'nowrap', textAlign: 'right' }}>OFFICIAL RECORD</div>
                                        <div style={{ color: '#0f172a', fontSize: '0.68rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.5px', lineHeight: '14px', whiteSpace: 'nowrap', textAlign: 'right' }}>{activeOffer.offer_letter_id}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Hidden Certificate Component for Direct PDF Download */}
            {
                (activeCertForDownload || (certificates && certificates[0])) && (() => {
                    const certToRender = activeCertForDownload || certificates[0];
                    return (
                        <div style={{ position: 'fixed', left: '-99999px', top: 0, width: '1123px', height: '794px', overflow: 'hidden', zIndex: -100, opacity: 1, pointerEvents: 'none' }}>
                            <div
                                id="certificate-download-area"
                                className="certificate-container"
                            >
                            {/* Security Pinstripe Pattern */}
                            <div className="cert-security-pattern"></div>

                            {/* Intricate Banknote Guilloche Security Rosette */}
                            <svg className="cert-watermark-guilloche" viewBox="0 0 400 400">
                                <circle cx="200" cy="200" r="185" fill="none" stroke="#c59b27" strokeWidth="0.8" opacity="0.45" />
                                <circle cx="200" cy="200" r="172" fill="none" stroke="#b71c1c" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.35" />
                                <circle cx="200" cy="200" r="158" fill="none" stroke="#c59b27" strokeWidth="0.6" strokeDasharray="1,2" opacity="0.4" />
                                <circle cx="200" cy="200" r="140" fill="none" stroke="#b71c1c" strokeWidth="0.5" opacity="0.25" />
                                <polygon points="200 20, 240 148, 380 148, 270 228, 310 356, 200 276, 90 356, 130 228, 20 148, 160 148" fill="none" stroke="#c59b27" strokeWidth="0.75" opacity="0.32" />
                                <polygon points="200 35, 235 152, 365 152, 262 225, 298 342, 200 270, 102 342, 138 225, 35 152, 165 152" fill="none" stroke="#b71c1c" strokeWidth="0.75" opacity="0.25" />
                                <path d="M 200 50 Q 230 110 290 110 T 350 200 T 290 290 T 200 350 T 110 290 T 50 200 T 110 110 Z" fill="none" stroke="#c59b27" strokeWidth="0.6" opacity="0.2" />
                                <path d="M 200 65 Q 225 115 275 115 T 335 200 T 275 285 T 200 335 T 125 285 T 65 200 T 125 115 Z" fill="none" stroke="#b71c1c" strokeWidth="0.6" opacity="0.2" />
                            </svg>

                            {/* 4-Tier Luxury Royal Red & Gold Borders */}
                            <div className="cert-border-outer"></div>
                            <div className="cert-border-gold-mid"></div>
                            <div className="cert-border-inner"></div>
                            <div className="cert-border-gold-hairline"></div>

                            {/* 4 Ornate Royal Corner Filigree Ornaments */}
                            <svg className="cert-corner-filigree corner-tl" viewBox="0 0 50 50">
                                <path d="M 4 46 L 4 4 L 46 4" fill="none" stroke="#c59b27" strokeWidth="3" />
                                <path d="M 10 40 L 10 10 L 40 10" fill="none" stroke="#7f0000" strokeWidth="1.8" />
                                <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="#e5b93b" strokeWidth="0.8" />
                                <circle cx="10" cy="10" r="3" fill="#7f0000" stroke="#e5b93b" strokeWidth="0.75" />
                                <circle cx="4" cy="4" r="2.5" fill="#c59b27" />
                                <polygon points="18 4, 22 8, 18 12, 14 8" fill="#c59b27" />
                                <polygon points="4 18, 8 22, 4 26, 0 22" fill="#c59b27" />
                            </svg>
                            <svg className="cert-corner-filigree corner-tr" viewBox="0 0 50 50">
                                <path d="M 4 46 L 4 4 L 46 4" fill="none" stroke="#c59b27" strokeWidth="3" />
                                <path d="M 10 40 L 10 10 L 40 10" fill="none" stroke="#7f0000" strokeWidth="1.8" />
                                <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="#e5b93b" strokeWidth="0.8" />
                                <circle cx="10" cy="10" r="3" fill="#7f0000" stroke="#e5b93b" strokeWidth="0.75" />
                                <circle cx="4" cy="4" r="2.5" fill="#c59b27" />
                                <polygon points="18 4, 22 8, 18 12, 14 8" fill="#c59b27" />
                                <polygon points="4 18, 8 22, 4 26, 0 22" fill="#c59b27" />
                            </svg>
                            <svg className="cert-corner-filigree corner-bl" viewBox="0 0 50 50">
                                <path d="M 4 46 L 4 4 L 46 4" fill="none" stroke="#c59b27" strokeWidth="3" />
                                <path d="M 10 40 L 10 10 L 40 10" fill="none" stroke="#7f0000" strokeWidth="1.8" />
                                <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="#e5b93b" strokeWidth="0.8" />
                                <circle cx="10" cy="10" r="3" fill="#7f0000" stroke="#e5b93b" strokeWidth="0.75" />
                                <circle cx="4" cy="4" r="2.5" fill="#c59b27" />
                                <polygon points="18 4, 22 8, 18 12, 14 8" fill="#c59b27" />
                                <polygon points="4 18, 8 22, 4 26, 0 22" fill="#c59b27" />
                            </svg>
                            <svg className="cert-corner-filigree corner-br" viewBox="0 0 50 50">
                                <path d="M 4 46 L 4 4 L 46 4" fill="none" stroke="#c59b27" strokeWidth="3" />
                                <path d="M 10 40 L 10 10 L 40 10" fill="none" stroke="#7f0000" strokeWidth="1.8" />
                                <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="#e5b93b" strokeWidth="0.8" />
                                <circle cx="10" cy="10" r="3" fill="#7f0000" stroke="#e5b93b" strokeWidth="0.75" />
                                <circle cx="4" cy="4" r="2.5" fill="#c59b27" />
                                <polygon points="18 4, 22 8, 18 12, 14 8" fill="#c59b27" />
                                <polygon points="4 18, 8 22, 4 26, 0 22" fill="#c59b27" />
                            </svg>

                            {/* Top branding elements */}
                            <div className="cert-top-row">
                                <div className="cert-logo-left">
                                    <img src={window.location.origin + import.meta.env.BASE_URL + 'vinix-title.png'} alt="VINIX Logo" />
                                </div>

                                <div className="cert-brand-center">
                                    <div className="brand-crest-stars">
                                        <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                        <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                        <svg className="center-star" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                        <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                        <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                    </div>
                                    <span className="cert-credential-heading">ACADEMIC &amp; PROFESSIONAL CREDENTIAL</span>
                                    <span className="cert-brand-tagline">GOVERNMENT REGISTERED MSME ENTERPRISE</span>
                                </div>

                                <div className="cert-logo-right">
                                    <div className="cert-msme-container">
                                        <img src={window.location.origin + import.meta.env.BASE_URL + 'msme.png'} alt="MSME Seal" />
                                    </div>
                                </div>
                            </div>

                            {/* Certificate Headings */}
                            <div className="cert-title-section">
                                <div className="cert-ribbon-tag" style={{ display: 'inline-block', textAlign: 'center', background: 'linear-gradient(135deg, #7f0000 0%, #b71c1c 50%, #991b1b 100%)', backgroundColor: '#800000', color: '#ffffff', fontFamily: 'Montserrat, Inter, sans-serif', fontSize: '0.64rem', fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', height: '24px', lineHeight: '22px', padding: '0 24px', borderRadius: '9999px', border: '1.5px solid #e5b93b', boxShadow: '0 3px 10px rgba(183, 28, 28, 0.35)', marginBottom: '8px', boxSizing: 'border-box', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                    <span style={{ color: '#ffffff', display: 'inline', lineHeight: 'inherit', fontWeight: 800 }}>★ OFFICIAL VERIFIED CREDENTIAL ★</span>
                                </div>
                                <h1 className="cert-title-main">CERTIFICATE</h1>
                                <div className="cert-title-sub-wrap">
                                    <div className="cert-hairline"></div>
                                    <svg width="8" height="8" viewBox="0 0 10 10" style={{ display: 'block', flexShrink: 0 }}><polygon points="5,0 10,5 5,10 0,5" fill="#7f0000" stroke="#e5b93b" strokeWidth="1.5"/></svg>
                                    <h3 className="cert-title-sub">OF INTERNSHIP COMPLETION</h3>
                                    <svg width="8" height="8" viewBox="0 0 10 10" style={{ display: 'block', flexShrink: 0 }}><polygon points="5,0 10,5 5,10 0,5" fill="#7f0000" stroke="#e5b93b" strokeWidth="1.5"/></svg>
                                    <div className="cert-hairline"></div>
                                </div>
                            </div>

                            {/* Certificate main body */}
                            <div className="cert-body-section">
                                <p className="cert-presentation-text">This certificate is proudly presented to</p>
                                <h2 className="cert-recipient-name" style={{ margin: '6px 0 16px 0' }}>{profile?.full_name || 'Vinix Graduate'}</h2>
                                <div className="cert-name-accent-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '0px', marginBottom: '18px' }}>
                                    <div className="line-side" style={{ width: '170px', height: '1.5px', background: 'linear-gradient(90deg, transparent, #d4af37, #d4af37)' }}></div>
                                    <div className="gem-wrap" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '5px', height: '5px', background: '#d4af37', transform: 'rotate(45deg)' }}></div>
                                        <div style={{ width: '9px', height: '9px', background: '#7f0000', transform: 'rotate(45deg)', border: '1.5px solid #d4af37', boxShadow: '0 0 6px rgba(197, 155, 39, 0.6)' }}></div>
                                        <div style={{ width: '5px', height: '5px', background: '#d4af37', transform: 'rotate(45deg)' }}></div>
                                    </div>
                                    <div className="line-side" style={{ width: '170px', height: '1.5px', background: 'linear-gradient(90deg, #d4af37, #d4af37, transparent)' }}></div>
                                </div>

                                <p className="cert-description-text" style={{ fontSize: '0.88rem', lineHeight: 1.65, color: '#334155', maxWidth: '840px', margin: '0 auto' }}>
                                    for successfully completing the task-based virtual internship program in <strong className="domain-highlight" style={{ color: '#7f0000', fontWeight: 800 }}>{certToRender.course_name}</strong> at <strong>VINIX Technologies</strong>, demonstrating exceptional technical competency, professional diligence, and excellence in project execution throughout the program.
                                </p>
                            </div>

                            {/* Footer signatory block */}
                            <div className="cert-footer-row">
                                {/* Date of Issuance Column (Left side) */}
                                <div className="cert-footer-col left-col">
                                    <div className="cert-date-wrap">
                                        <div className="cert-date-value">
                                            {new Date(certToRender.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="cert-sig-line"></div>
                                    <div className="cert-signer-name">Date of Issuance</div>
                                    <span className="cert-signer-title">OFFICIAL RECORD</span>
                                </div>

                                {/* Official Stamp Column (Center) */}
                                <div className="cert-footer-col center-col">
                                    <div className="cert-stamp-wrap">
                                        <div className="cert-stamp-badge">
                                            <img src={window.location.origin + import.meta.env.BASE_URL + 'certificate-stamp.jpeg'} alt="Company Stamp" className="cert-stamp-img" />
                                        </div>
                                    </div>
                                    <div className="cert-meta-verify">
                                        <span className="cert-meta-intern-id">Intern ID: VINIX-{certToRender.certificate_number.split('-').pop()}</span>
                                        <span className="cert-meta-verify-link">Verify at: <strong>verify.vinix.online/{certToRender.certificate_number}</strong></span>
                                    </div>
                                </div>

                                {/* Founder Signatory Column (Right side) */}
                                <div className="cert-footer-col right-col">
                                    <div className="cert-signature-wrap">
                                        <img src={window.location.origin + import.meta.env.BASE_URL + 'founder-sign.png'} alt="Founder Signature" className="cert-signature-img" />
                                    </div>
                                    <div className="cert-sig-line"></div>
                                    <div className="cert-signer-name">Vishal R</div>
                                    <span className="cert-signer-title">FOUNDER &amp; CEO, VINIX</span>
                                </div>
                            </div>

                            {/* Bottom compliance bar */}
                            <div className="cert-bottom-bar">
                                <div className="cert-compliance-tag">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                                    <span>Tamper-Proof Blockchain Credential • ISO 9001:2015 Certified • MSME Reg: UDYAM-TN-21-0066185</span>
                                </div>
                                <div className="cert-id-wrap" style={{ color: '#0c0f17', fontWeight: 800 }}>
                                    Cert ID: <span className="cert-id-badge" style={{ color: '#b48324', fontWeight: 800, fontFamily: 'monospace' }}>{certToRender.certificate_number}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })()
            }
        </div>
    );
};

export default Dashboard;
