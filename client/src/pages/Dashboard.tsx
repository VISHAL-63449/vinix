import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

import {
    LayoutDashboard, BookOpen, Layers, FileCode, Award, MailOpen, User,
    CheckCircle2, XCircle, ExternalLink,
    FileDown, Play, CheckCheck,
    MessageSquare, Eye, Printer, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Linkedin = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-linkedin ${className}`}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

interface Course {
    id: string;
    title: string;
    category: string;
    description: string;
    duration: string;
    type: 'COURSE' | 'INTERNSHIP';
    skills: string[];
    lessons: Array<{ title: string; videoUrl: string; duration: string }>;
    assignments: Array<{ id: string; title: string; desc: string }>;
    quizzes: Array<{ question: string; options: string[]; answer: string }>;
}

interface Enrollment {
    id: string;
    courseId: string;
    progress: number;
    status: string;
    course: Course;
    linkedinUrl?: string;
}

interface Project {
    id: string;
    title: string;
    description: string;
    githubLink: string;
    fileUrl?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUBMITTED' | 'RESUBMISSION_REQUIRED';
    feedback?: string;
    submittedAt: string;
}

interface Certificate {
    id: string;
    courseName: string;
    certificateNumber: string;
    issueDate: string;
    verificationURL: string;
}

interface OfferLetter {
    id: string;
    offerLetterId: string;
    studentId: string;
    internshipId?: string;
    studentName: string;
    studentEmail: string;
    internshipTitle: string;
    internshipDomain: string;
    startDate: string;
    endDate: string;
    duration: string;
    mentorName: string;
    issueDate: string;
    status: 'GENERATED' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
    pdfUrl?: string;
    verificationToken: string;
    createdAt: string;
    updatedAt: string;
}

export const Dashboard: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    // Database states
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);

    const [loading, setLoading] = useState(true);

    // Profile fields editing
    const [nameField, setNameField] = useState(user?.name || '');
    const [skillsField, setSkillsField] = useState(user?.skills.join(', ') || '');

    // Active study parameters
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');
    const [activeVideoTitle, setActiveVideoTitle] = useState('');

    // Submit project forms state
    const [projectTitle, setProjectTitle] = useState('');
    const [projectDesc, setProjectDesc] = useState('');
    const [projectGit, setProjectGit] = useState('');
    const [projectLoading, setProjectLoading] = useState(false);

    // LinkedIn submit popover modal state
    const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
    const [linkedInUrlInput, setLinkedInUrlInput] = useState('');
    const [linkedInSubmitted, setLinkedInSubmitted] = useState(false);

    // Default Submission Dialog values
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

    // Document Preview states
    const [selectedOfferLetterPreview, setSelectedOfferLetterPreview] = useState<OfferLetter | null>(null);
    const [selectedCertPreview, setSelectedCertPreview] = useState<Certificate | null>(null);

    const activeInternship = enrollments.find(e => e.course.type === 'INTERNSHIP');

    const displayEnrollment = selectedEnrollment || activeInternship || null;
    const hasLinkedIn = !!(linkedInSubmitted || displayEnrollment?.linkedinUrl);

    // Dynamically calculate progress metrics for tasks indicator
    const totalAssignments = displayEnrollment?.course?.assignments?.length || 0;
    const approvedProjects = projects.filter(p =>
        p.status === 'APPROVED' &&
        displayEnrollment?.course?.assignments?.some((as: { title: string }) =>
            p.title.toLowerCase().includes(as.title.toLowerCase()) ||
            as.title.toLowerCase().includes(p.title.toLowerCase())
        )
    );
    const approvedProjectsCount = approvedProjects.length;
    const completedTasksCount = (hasLinkedIn ? 1 : 0) + approvedProjectsCount;
    const totalTasksCount = (displayEnrollment?.course?.assignments ? 1 + totalAssignments : 1);

    const progress = (() => {
        if (!displayEnrollment) return 0;
        const totalAssignmentsCount = displayEnrollment.course?.assignments?.length || 0;
        if (totalAssignmentsCount === 0) {
            return Math.max(displayEnrollment.progress, hasLinkedIn ? 100 : 0);
        }
        const computed = (hasLinkedIn ? 20 : 0) + Math.round((approvedProjectsCount / totalAssignmentsCount) * 80);
        return Math.min(100, Math.max(displayEnrollment.progress, computed));
    })();

    const getLatestTaskSubmission = (taskTitle: string) => {
        const subs = projects.filter(p =>
            p.title.toLowerCase().includes(taskTitle.toLowerCase()) ||
            taskTitle.toLowerCase().includes(p.title.toLowerCase())
        );
        if (subs.length === 0) return null;
        return subs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
    };

    const loadData = async () => {
        try {
            setLoading(true);
            console.log("[Dashboard] Fetching user session from Supabase Auth...");
            const { data: { user: sbUser }, error: userError } = await supabase.auth.getUser();

            if (userError) {
                console.warn("[Dashboard] Error fetching Supabase user session:", userError);
                setLoading(false);
                return;
            }

            if (!sbUser) {
                console.log("[Dashboard] No active Supabase user session.");
                setLoading(false);
                return;
            }

            console.log("[Dashboard] Supabase active user UUID:", sbUser.id);

            // Fetch profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sbUser.id)
                .maybeSingle();

            // Fetch published internships for Explore tab
            const { data: internshipsList } = await supabase
                .from('internships')
                .select('*')
                .eq('status', 'published');

            const activeInternships: any[] = internshipsList || [];

            const coursesList: Course[] = activeInternships.map(i => {
                const mockTasksList = [];
                for (let t_idx = 1; t_idx <= 12; t_idx++) {
                    let t_title = '';
                    let t_desc = '';
                    if (t_idx === 1) {
                        t_title = 'LinkedIn Offer Post Requirement';
                        t_desc = 'Share your internship offer letter on your LinkedIn profile, tag Vinix Technologies, and submit the link below to unlock the learning workspace.';
                    } else if (t_idx === 2) {
                        t_title = 'Milestone 1 — Repository Initialization';
                        t_desc = 'Initialize the project repository on GitHub, configure standard project structures, design schemas, and set up your development environment.';
                    } else if (t_idx === 3) {
                        t_title = 'Milestone 2 — Core Operations Architecture';
                        t_desc = 'Implement the primary schemas, endpoints, business logic models, and UI component views representing current state operations.';
                    } else if (t_idx === 4) {
                        t_title = 'Milestone 3 — Interactive UI Integration';
                        t_desc = 'Integrate state containers, responsive layout frameworks, input forms, and dynamic action states across core views.';
                    } else if (t_idx === 5) {
                        t_title = 'Milestone 4 — Security & Validation';
                        t_desc = 'Secure all APIs, configure proper credentials/authentication flows, and enforce input validation rules.';
                    } else {
                        t_title = `Milestone ${t_idx - 1} — Advanced Integration`;
                        t_desc = 'Optimize resources, implement advanced features, CI/CD integrations, or final review adjustments.';
                    }
                    mockTasksList.push({
                        id: `mock-task-${t_idx}`,
                        internship_id: i.id,
                        task_number: t_idx,
                        title: t_title,
                        description: t_desc
                    });
                }

                return {
                    id: i.id,
                    title: i.title,
                    category: i.domain,
                    description: i.description || '',
                    duration: i.duration || '3 Months',
                    type: 'INTERNSHIP',
                    skills: [i.domain],
                    lessons: [
                        { title: 'Project Overview & Setup', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '10 mins' },
                        { title: 'Milestone Implementation Walkthrough', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15 mins' }
                    ],
                    assignments: mockTasksList.filter(t => t.task_number > 1).map(t => ({
                        id: t.id,
                        title: t.title,
                        desc: t.description || 'Milestone submission requirement.'
                    })),
                    quizzes: []
                };
            });
            setAllCourses(coursesList);

            // Fetch enrollments
            const { data: enrollRes } = await supabase
                .from('internship_enrollments')
                .select('*')
                .eq('user_id', sbUser.id);

            const finalEnrollments: Enrollment[] = [];
            const allProjects: Project[] = [];

            for (const enroll of (enrollRes || [])) {
                const internship = activeInternships.find(i => i.id === enroll.internship_id);
                if (!internship) continue;

                // Load tasks
                const { data: tasksRes } = await supabase
                    .from('internship_tasks')
                    .select('*')
                    .eq('internship_id', internship.id)
                    .order('task_number', { ascending: true });

                let tasks = tasksRes || [];
                if (tasks.length === 0) {
                    const mockTasksList = [];
                    for (let t_idx = 1; t_idx <= 12; t_idx++) {
                        let t_title = '';
                        let t_desc = '';
                        if (t_idx === 1) {
                            t_title = 'LinkedIn Offer Post Requirement';
                            t_desc = 'Share your internship offer letter on your LinkedIn profile, tag Vinix Technologies, and submit the link below to unlock the learning workspace.';
                        } else if (t_idx === 2) {
                            t_title = 'Milestone 1 — Repository Initialization';
                            t_desc = 'Initialize the project repository on GitHub, configure standard project structures, design schemas, and set up your development environment.';
                        } else if (t_idx === 3) {
                            t_title = 'Milestone 2 — Core Operations Architecture';
                            t_desc = 'Implement the primary schemas, endpoints, business logic models, and UI component views representing current state operations.';
                        } else if (t_idx === 4) {
                            t_title = 'Milestone 3 — Interactive UI Integration';
                            t_desc = 'Integrate state containers, responsive layout frameworks, input forms, and dynamic action states across core views.';
                        } else if (t_idx === 5) {
                            t_title = 'Milestone 4 — Security & Validation';
                            t_desc = 'Secure all APIs, configure proper credentials/authentication flows, and enforce input validation rules.';
                        } else {
                            t_title = `Milestone ${t_idx - 1} — Advanced Integration`;
                            t_desc = 'Optimize resources, implement advanced features, CI/CD integrations, or final review adjustments.';
                        }
                        mockTasksList.push({
                            id: `mock-task-${t_idx}`,
                            internship_id: internship.id,
                            task_number: t_idx,
                            title: t_title,
                            description: t_desc
                        });
                    }
                    tasks = mockTasksList;
                }

                // Load progress
                const { data: progressRes } = await supabase
                    .from('task_progress')
                    .select('*')
                    .eq('user_id', sbUser.id)
                    .eq('internship_id', internship.id);

                const progressArray = progressRes || [];



                // Map progress to project/submissions structure
                for (const prog of progressArray) {
                    const task = tasks.find(t => t.id === prog.task_id);
                    if (!task) continue;

                    allProjects.push({
                        id: prog.id,
                        title: task.title,
                        description: prog.student_note || '',
                        githubLink: prog.github_url || '',
                        fileUrl: prog.deployment_url || prog.linkedin_url || '',
                        status: prog.status === 'submitted' ? 'PENDING' : prog.status.toUpperCase() as any,
                        feedback: prog.admin_feedback || '',
                        submittedAt: prog.submitted_at || prog.created_at
                    });
                }

                // Check if LinkedIn task (task_number 1) is submitted
                const linkedinProg = progressArray.find(p => {
                    const task = tasks.find(t => t.id === p.task_id);
                    return task?.task_number === 1;
                });
                if (linkedinProg && (linkedinProg.status === 'submitted' || linkedinProg.status === 'approved')) {
                    setLinkedInSubmitted(true);
                    setLinkedInUrlInput(linkedinProg.linkedin_url || '');
                }

                const courseObj: Course = {
                    id: internship.id,
                    title: internship.title,
                    category: internship.domain,
                    description: internship.description || '',
                    duration: internship.duration || '3 Months',
                    type: 'INTERNSHIP',
                    skills: [internship.domain],
                    lessons: [
                        { title: 'Project Overview & Setup', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '10 mins' },
                        { title: 'Milestone Implementation Walkthrough', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15 mins' }
                    ],
                    assignments: tasks.filter(t => t.task_number > 1).map(t => ({
                        id: t.id,
                        title: t.title,
                        desc: t.description || 'Milestone submission requirement.'
                    })),
                    quizzes: []
                };

                finalEnrollments.push({
                    id: enroll.id,
                    courseId: internship.id,
                    progress: enroll.progress || 0,
                    status: enroll.status,
                    course: courseObj,
                    linkedinUrl: enroll.linkedin_url || undefined
                });
            }

            setEnrollments(finalEnrollments);
            setProjects(allProjects);

            // Fetch certificates
            const { data: certs } = await supabase
                .from('certificates')
                .select('*')
                .eq('user_id', sbUser.id);

            setCertificates((certs || []).map(c => ({
                id: c.id,
                courseName: c.course_name,
                certificateNumber: c.certificate_number,
                issueDate: c.issue_date,
                verificationURL: `${window.location.origin}/verify/${c.certificate_number}`
            })));

            // Fetch offer letters
            const { data: letters } = await supabase
                .from('offer_letters')
                .select('*')
                .eq('user_id', sbUser.id);

            const mappedLetters = (letters || []).map(l => ({
                id: l.id,
                offerLetterId: l.offer_letter_id,
                studentId: l.user_id,
                studentName: l.student_name,
                studentEmail: l.student_email,
                internshipTitle: l.internship_title,
                internshipDomain: l.internship_title.split(' ')[0],
                startDate: l.issue_date,
                endDate: l.issue_date,
                duration: l.duration,
                mentorName: 'Vishal R',
                issueDate: l.issue_date,
                status: l.status as any,
                pdfUrl: l.pdf_url,
                verificationToken: l.verification_token,
                createdAt: l.created_at,
                updatedAt: l.updated_at
            }));

            setOfferLetters(mappedLetters);

            if (finalEnrollments.length > 0 && !selectedEnrollment) {
                const internshipEnroll = finalEnrollments.find(e => e.course.type === 'INTERNSHIP');
                const defaultEnroll = internshipEnroll || finalEnrollments[0];
                setSelectedEnrollment(defaultEnroll);
                if (defaultEnroll.course.lessons?.length > 0) {
                    setCurrentVideoUrl(defaultEnroll.course.lessons[0].videoUrl);
                    setActiveVideoTitle(defaultEnroll.course.lessons[0].title);
                }
            }
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOffer = async (id: string) => {
        try {
            const { error } = await supabase
                .from('offer_letters')
                .update({ status: 'ACCEPTED' })
                .eq('id', id);

            if (error) throw error;
            alert('Congratulations! You have accepted the internship offer letter.');
            loadData();
        } catch (err) {
            console.error('Error accepting offer:', err);
            alert('Failed to accept offer letter.');
        }
    };

    const handleDeclineOffer = async (id: string) => {
        if (!window.confirm('Are you sure you want to decline this internship offer?')) return;
        try {
            const { error } = await supabase
                .from('offer_letters')
                .update({ status: 'DECLINED' })
                .eq('id', id);

            if (error) throw error;
            alert('Offer letter declined successfully.');
            loadData();
        } catch (err) {
            console.error('Error declining offer:', err);
            alert('Failed to decline offer letter.');
        }
    };

    useEffect(() => {
        loadData();

        const progressSub = supabase
            .channel('public:task_progress_dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_progress' }, () => {
                console.log('[Dashboard] Realtime task_progress change detected, reloading...');
                loadData();
            })
            .subscribe();

        const enrollSub = supabase
            .channel('public:internship_enrollments_dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'internship_enrollments' }, () => {
                console.log('[Dashboard] Realtime internship_enrollments change detected, reloading...');
                loadData();
            })
            .subscribe();

        return () => {
            progressSub.unsubscribe();
            enrollSub.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const skillsArray = skillsField.split(',').map(s => s.trim()).filter(s => s.length > 0);
            await updateProfile(nameField, skillsArray);
            alert('Profile updated successfully!');
        } catch {
            alert('Failed to update profile.');
        }
    };

    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectTitle || !projectDesc || !projectGit) {
            alert('Please fill out all required fields.');
            return;
        }
        if (!displayEnrollment) {
            alert('No active enrollment found.');
            return;
        }
        setProjectLoading(true);
        try {
            const { data: { user: sbUser } } = await supabase.auth.getUser();
            if (!sbUser) {
                alert('Session expired. Please log in.');
                return;
            }

            // Find matching task in database
            const { data: taskRes } = await supabase
                .from('internship_tasks')
                .select('*')
                .eq('internship_id', displayEnrollment.courseId)
                .eq('title', projectTitle)
                .single();

            if (!taskRes) {
                throw new Error('Task not found in the database. Please contact support.');
            }

            const { error } = await supabase
                .from('task_progress')
                .upsert({
                    user_id: sbUser.id,
                    internship_id: displayEnrollment.courseId,
                    task_id: taskRes.id,
                    status: 'submitted',
                    github_url: projectGit,
                    student_note: projectDesc,
                    submitted_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,task_id'
                });

            if (error) throw error;

            alert('Project milestone submitted successfully! Evaluators will review it shortly.');
            setProjectTitle('');
            setProjectDesc('');
            setProjectGit('');
            setIsSubmitModalOpen(false);
            loadData();
        } catch (err: any) {
            console.error('Failed to submit milestone project:', err);
            alert('Failed to submit project: ' + err.message);
        } finally {
            setProjectLoading(false);
        }
    };

    const handleLinkedInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkedInUrlInput.trim()) {
            alert('Please enter a valid URL.');
            return;
        }
        if (!displayEnrollment) return;

        try {
            const { data: { user: sbUser } } = await supabase.auth.getUser();
            if (!sbUser) {
                alert('Session expired. Please log in.');
                return;
            }

            try {
                const { data: taskRes } = await supabase
                    .from('internship_tasks')
                    .select('*')
                    .eq('internship_id', displayEnrollment.courseId)
                    .eq('task_number', 1)
                    .single();

                if (taskRes) {
                    await supabase
                        .from('task_progress')
                        .upsert({
                            user_id: sbUser.id,
                            internship_id: displayEnrollment.courseId,
                            task_id: taskRes.id,
                            status: 'approved',
                            linkedin_url: linkedInUrlInput,
                            submitted_at: new Date().toISOString()
                        }, {
                            onConflict: 'user_id,task_id'
                        });
                }

                await supabase
                    .from('internship_enrollments')
                    .update({ linkedin_url: linkedInUrlInput })
                    .eq('user_id', sbUser.id)
                    .eq('internship_id', displayEnrollment.courseId);
            } catch (dbErr) {
                console.warn('[Dashboard] Database call failed for LinkedIn URL submission:', dbErr);
            }

            setLinkedInSubmitted(true);
            setIsLinkedInModalOpen(false);
            alert('LinkedIn URL submitted successfully! Offer post requirements verified.');
            loadData();
        } catch (err: any) {
            console.error('LinkedIn URL submission error:', err);
            alert('Failed to submit LinkedIn URL: ' + err.message);
        }
    };

    const handleEnrollDirect = async (courseId: string) => {
        try {
            const { data: { user: sbUser } } = await supabase.auth.getUser();
            if (!sbUser) {
                alert('Session expired. Please log in.');
                return;
            }

            const { data: existing } = await supabase
                .from('internship_enrollments')
                .select('*')
                .eq('user_id', sbUser.id)
                .eq('internship_id', courseId);

            if (existing && existing.length > 0) {
                alert('Already enrolled in this track.');
                return;
            }

            const { data: enrolledRecord, error: enrollErr } = await supabase
                .from('internship_enrollments')
                .insert({
                    user_id: sbUser.id,
                    internship_id: courseId,
                    status: 'active',
                    application_status: 'active'
                })
                .select()
                .single();

            if (enrollErr) throw enrollErr;

            // Seed offer letter
            const offerLetterNumber = `VINIX-OFFER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sbUser.id)
                .single();

            await supabase
                .from('offer_letters')
                .insert({
                    enrollment_id: enrolledRecord.id,
                    user_id: sbUser.id,
                    offer_letter_id: offerLetterNumber,
                    student_name: profile?.full_name || sbUser.email?.split('@')[0] || 'student',
                    student_email: sbUser.email || '',
                    internship_title: allCourses.find(c => c.id === courseId)?.title || 'Developer Internship',
                    duration: '3 Months',
                    status: 'GENERATED'
                });

            // Seed task_progress records
            const { data: tasks } = await supabase
                .from('internship_tasks')
                .select('*')
                .eq('internship_id', courseId)
                .order('task_number', { ascending: true });

            if (tasks && tasks.length > 0) {
                const progressToInsert = tasks.map(t => ({
                    user_id: sbUser.id,
                    internship_id: courseId,
                    task_id: t.id,
                    status: t.task_number === 1 ? 'approved' : t.task_number === 2 ? 'available' : 'locked'
                }));
                await supabase
                    .from('task_progress')
                    .insert(progressToInsert);
            }

            alert('Internship track launched! Load page domains configuration.');
            loadData();
            setActiveTab('overview');
        } catch (err: any) {
            console.error('Enrollment failed:', err);
            alert('Enrollment failed: ' + err.message);
        }
    };

    const updateCourseProgress = async (enroll: Enrollment, bonus: number) => {
        try {
            const nextProgress = Math.min(100, enroll.progress + bonus);
            const { data: { user: sbUser } } = await supabase.auth.getUser();
            if (sbUser) {
                await supabase
                    .from('internship_enrollments')
                    .update({ progress: nextProgress })
                    .eq('user_id', sbUser.id)
                    .eq('internship_id', enroll.courseId);
            }
            loadData();
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    };



    // Circle SVG specifications matching Image 3 Circular indicator
    const radius = 30;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Get matching offer letter
    const activeOfferLetter = offerLetters.find(o =>
        displayEnrollment && o.internshipTitle.toLowerCase().includes(displayEnrollment.course.title.split(' ')[0].toLowerCase())
    ) || (offerLetters.length > 0 ? offerLetters[0] : null);

    const sidebarItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'courses', label: 'My Workspace', icon: BookOpen },
        { id: 'internships', label: 'Explore domains', icon: Layers },
        { id: 'projects', label: 'Projects submit', icon: FileCode },
        { id: 'credentials', label: 'Certificates', icon: Award },
        { id: 'letters', label: 'Offer Letters', icon: MailOpen },
        { id: 'profile', label: 'Profile Settings', icon: User },
    ];

    if (loading && enrollments.length === 0 && allCourses.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-650 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">

            {/* Sidebar Navigation Panel */}
            <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-205 dark:border-slate-800 flex flex-col p-4 space-y-2 flex-shrink-0 transition-colors duration-300">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Navigation Center</div>
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === item.id
                                ? 'bg-blue-600 text-white font-bold shadow'
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
                                }`}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </aside>

            {/* Main Interactive Workspace Area */}
            <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full transition-colors duration-300">

                {/* 1. OVERVIEW HUB - MATCHING PAGE 3 AND PAGE 4 */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">

                        {/* Top Student Banner Card */}
                        {displayEnrollment ? (
                            <div className="relative p-6 md:p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800/60 flex flex-col lg:flex-row justify-between items-center sm:items-start lg:items-center gap-6">
                                {/* Ambient Glow Background Blobs */}
                                <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
                                <div className="absolute -bottom-12 -left-12 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

                                <div className="space-y-4 text-center sm:text-left z-10">
                                    <span className="inline-block text-[10px] uppercase font-black tracking-widest bg-blue-550/20 text-blue-300 border border-blue-400/20 px-2.5 py-1 rounded-md">
                                        Welcome Intern
                                    </span>
                                    <h2 className="text-3xl font-extrabold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-200">
                                        {user?.name || 'VISHAL R'}
                                    </h2>
                                    <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 backdrop-blur rounded-full text-xs font-bold tracking-wider text-blue-200 uppercase">
                                        🎓 {displayEnrollment.course.title.toUpperCase()}
                                    </span>
                                </div>

                                {/* Progress radial circle indicator and buttons */}
                                <div className="flex flex-col sm:flex-row items-center gap-6 py-2 z-10 self-center lg:self-auto">

                                    {/* Radial Progress Ring */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="relative w-20 h-20 flex items-center justify-center">
                                            {/* Circular SVG track */}
                                            <svg className="w-20 h-20 transform -rotate-90">
                                                <circle
                                                    cx="40" cy="40" r={radius}
                                                    className="text-white/5"
                                                    strokeWidth={strokeWidth}
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                />
                                                <circle
                                                    cx="40" cy="40" r={radius}
                                                    className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-700 ease-out"
                                                    strokeWidth={strokeWidth}
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={strokeDashoffset}
                                                    strokeLinecap="round"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center text-center">
                                                <span className="text-xs font-black text-white">{progress}%</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Internship Progress</span>
                                        <span className="text-[9px] text-blue-300 font-semibold bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
                                            {completedTasksCount} of {totalTasksCount} tasks
                                        </span>
                                    </div>

                                    {/* Action buttons on bottom/right */}
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        {activeOfferLetter && (
                                            <button
                                                onClick={() => setSelectedOfferLetterPreview(activeOfferLetter)}
                                                className="flex items-center justify-center space-x-1.5 px-4 py-2.5 text-xs font-bold text-blue-200 border border-blue-400/30 hover:border-blue-400/60 hover:bg-blue-900/20 rounded-xl transition duration-150 whitespace-nowrap bg-indigo-950/20 shadow-sm cursor-pointer"
                                            >
                                                <Eye size={13} />
                                                <span>View & Print Offer Letter</span>
                                            </button>
                                        )}
                                        <a
                                            href="https://chat.whatsapp.com/mock-vionix"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition duration-150 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 ease-out whitespace-nowrap"
                                        >
                                            <MessageSquare size={13} />
                                            <span>Join WhatsApp Group</span>
                                        </a>
                                    </div>

                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-center rounded-3xl shadow-sm space-y-4">
                                <h3 className="font-extrabold text-lg text-slate-850 dark:text-slate-100">Launch an Internship Track</h3>
                                <p className="text-xs text-slate-400">You are not registered in any active learning / internship domains.</p>
                                <button onClick={() => navigate('/internship')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold text-xs transition">Apply Internship</button>
                            </div>
                        )}

                        {/* Dynamic Stats Grid Card Row */}
                        {displayEnrollment && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Card 1: Active Domain */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md transition duration-200">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl dark:bg-blue-955/20 dark:text-blue-400">
                                        <GraduationCap size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block leading-none mb-1">Internship Domain</span>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">{displayEnrollment.course.title}</span>
                                        <span className="text-[8px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">Active Track</span>
                                    </div>
                                </div>

                                {/* Card 2: Tasks Status */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md transition duration-200">
                                    <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl dark:bg-indigo-955/20 dark:text-indigo-400">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block leading-none mb-1">Milestones Status</span>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{completedTasksCount} / {totalTasksCount} Completed</span>
                                        <span className="text-[8px] font-semibold text-indigo-500 bg-indigo-505/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                                            {totalTasksCount - completedTasksCount} Action Pending
                                        </span>
                                    </div>
                                </div>

                                {/* Card 3: Mentorship */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md transition duration-200">
                                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl dark:bg-rose-955/20 dark:text-rose-455">
                                        <User size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block leading-none mb-1">Assigned Mentor</span>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{activeOfferLetter?.mentorName || 'Vishal R'}</span>
                                        <span className="text-[8px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                                            Online Support
                                        </span>
                                    </div>
                                </div>

                                {/* Card 4: Evaluation Status */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md transition duration-200">
                                    <div className="p-3 bg-amber-50 text-amber-500 rounded-xl dark:bg-amber-955/20 dark:text-amber-500">
                                        <Award size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block leading-none mb-1">Evaluation Grade</span>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                            {progress === 100 ? 'A+ Outstanding' : progress >= 50 ? 'B+ Good Job' : 'Needs Submission'}
                                        </span>
                                        <span className="text-[8px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">Real-time Grade</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notification alert ribbon */}
                        <div className="w-full bg-blue-600/10 border border-blue-500/20 text-blue-750 dark:text-blue-300 py-3.5 px-6 rounded-2xl flex items-center justify-between text-xs font-extrabold shadow-sm bg-gradient-to-r dark:from-slate-900 dark:via-blue-955 dark:to-slate-900">
                            <span className="flex items-center gap-1.5">
                                <span>📣</span>
                                <span>Enjoying Vinix? Share dynamic referral with developer friends!</span>
                            </span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.origin);
                                    alert('Link copied! Share it with your developer friends.');
                                }}
                                className="flex items-center space-x-1 hover:underline text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 border dark:border-slate-850 shadow px-3 py-1 rounded-lg"
                            >
                                <span>Copy Link</span>
                                <ExternalLink size={11} />
                            </button>
                        </div>

                        {/* QUEST LOG GRID LAYOUT */}
                        <div className="space-y-4 pt-2">

                            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-extrabold text-lg">
                                <BookOpen size={20} className="text-blue-600" />
                                <span>Quest Log</span>
                                <span className="bg-slate-100 dark:bg-slate-800 border dark:border-slate-700/80 text-[10px] font-black text-slate-505 px-2 py-0.5 rounded-full select-none">
                                    Checklist
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">

                                {/* Card 0: LinkedIn Mandatory checklist */}
                                <div className="p-5 rounded-2xl bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-850 flex flex-col justify-between space-y-4 hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="p-2.5 bg-blue-50 text-blue-650 rounded-xl dark:bg-blue-950/40">
                                                <Linkedin size={18} />
                                            </div>
                                            <div className="flex flex-col items-end gap-1 select-none">
                                                <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide rounded-full ${linkedInSubmitted ? 'bg-green-500/10 text-green-500' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30'}`}>
                                                    {linkedInSubmitted ? '✓ SUBMITTED' : 'AVAILABLE'}
                                                </span>
                                                {!linkedInSubmitted && (
                                                    <span className="px-2 py-0.5 text-[8px] font-bold text-red-650 bg-red-50 rounded-full dark:bg-red-950/20">Immediate Action</span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-[10px] text-slate-400 font-bold">Due Date: Immediate Submission</p>

                                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                                            <span>📢 Mandatory Checklist: Offer & Social Post</span>
                                        </h4>

                                        <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                                            Download offer letter, verify with a professional LinkedIn post tagging @Vinix, and submit post URL.
                                        </p>
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        {activeOfferLetter ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedOfferLetterPreview(activeOfferLetter)}
                                                    className="flex-1 flex items-center justify-center space-x-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition duration-150 shadow-sm"
                                                >
                                                    <Eye size={11} />
                                                    <span>1. View & Print Letter</span>
                                                </button>
                                                <button
                                                    onClick={() => setSelectedOfferLetterPreview(activeOfferLetter)}
                                                    className="px-2.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-205 rounded-xl transition dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750"
                                                    title="Preview Offer Letter"
                                                >
                                                    <Eye size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button disabled className="w-full flex items-center justify-center space-x-1 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-xl">
                                                Offer Letter Unissued
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setIsLinkedInModalOpen(true)}
                                            className={`w-full flex items-center justify-center space-x-1 py-2 text-xs font-bold rounded-xl transition duration-150 ${linkedInSubmitted ? 'bg-green-500/10 text-green-750 border border-green-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                                }`}
                                        >
                                            <Linkedin size={12} />
                                            <span>{linkedInSubmitted ? '✓ Verified & submitted' : '2. Submit LinkedIn Post URL'}</span>
                                        </button>
                                    </div>

                                </div>

                                {/* Dynamic Course/Internship Task Cards */}
                                {displayEnrollment && displayEnrollment.course.assignments && displayEnrollment.course.assignments.map((as, index) => {
                                    // Generate dates relative to current registration for realism
                                    const offsetDays = (index + 1) * 7 + 1;
                                    const dueDate = new Date();
                                    dueDate.setDate(dueDate.getDate() + offsetDays);

                                    const sub = getLatestTaskSubmission(as.title);

                                    let isUnlocked = false;
                                    if (index === 0) {
                                        isUnlocked = linkedInSubmitted;
                                    } else if (displayEnrollment.course.assignments) {
                                        const prevTask = displayEnrollment.course.assignments[index - 1];
                                        const prevSub = getLatestTaskSubmission(prevTask.title);
                                        isUnlocked = !!prevSub && prevSub.status === 'APPROVED';
                                    }

                                    return (
                                        <div
                                            key={as.id || index}
                                            className={`p-5 rounded-2xl bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-850 flex flex-col justify-between space-y-4 shadow-sm transition-all duration-300 ${!isUnlocked ? 'opacity-65 saturate-50 select-none' : 'hover:shadow-lg hover:border-blue-500/30 transform hover:-translate-y-0.5'
                                                }`}
                                        >
                                            <div className="space-y-3 font-sans">
                                                <div className="flex justify-between items-center">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center font-extrabold text-sm dark:bg-blue-955/20 dark:text-blue-400">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 select-none">
                                                        {!isUnlocked ? (
                                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wide rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                                🔒 LOCKED
                                                            </span>
                                                        ) : sub ? (
                                                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wide rounded-full ${sub.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                                                sub.status === 'REJECTED' || sub.status === 'RESUBMISSION_REQUIRED' ? 'bg-red-500/10 text-red-500' :
                                                                    'bg-amber-500/10 text-amber-500'
                                                                }`}>
                                                                {sub.status === 'SUBMITTED' || sub.status === 'PENDING' ? 'PENDING REVIEW' : sub.status}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide rounded-full bg-blue-55 text-blue-700 dark:bg-blue-900/30">
                                                                AVAILABLE
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-slate-405 font-bold font-mono">Due Date: {dueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

                                                <h4 className="text-xs font-extrabold text-slate-950 dark:text-white">
                                                    {as.title}
                                                </h4>

                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Tasks Scope:</span>
                                                    <p className="text-[11px] text-slate-550 dark:text-slate-405 leading-relaxed font-semibold">
                                                        {as.desc}
                                                    </p>
                                                    <ul className="text-[10px] text-slate-450 space-y-1 pt-1.5 list-disc pl-3 leading-normal">
                                                        <li>Complete modular structure and validations</li>
                                                        <li>Submit deployment code repository</li>
                                                    </ul>
                                                </div>

                                                {isUnlocked && sub && (sub.status === 'REJECTED' || sub.status === 'RESUBMISSION_REQUIRED') && sub.feedback && (
                                                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl space-y-1 mt-2">
                                                        <span className="text-[9px] font-black uppercase text-red-500 block">❌ Submission Rejected</span>
                                                        <span className="text-[9px] font-bold text-slate-400 block pb-0.5">Feedback/Reason:</span>
                                                        <p className="text-[10px] text-red-800 dark:text-red-300 font-medium leading-relaxed font-sans">{sub.feedback}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                                {!isUnlocked ? (
                                                    <span className="w-full flex items-center justify-center space-x-1 py-2 text-xs font-bold text-slate-400 bg-slate-105 dark:bg-slate-800 rounded-xl select-none">
                                                        <span>🔒 Locked — Complete previous tasks</span>
                                                    </span>
                                                ) : sub ? (
                                                    sub.status === 'APPROVED' ? (
                                                        <span className="w-full flex items-center justify-center space-x-1 py-2 text-xs font-bold text-green-700 bg-green-50 border border-green-150 rounded-xl select-none">
                                                            <span>✓ Approved ✓</span>
                                                        </span>
                                                    ) : sub.status === 'REJECTED' || sub.status === 'RESUBMISSION_REQUIRED' ? (
                                                        <button
                                                            onClick={() => {
                                                                setProjectTitle(as.title);
                                                                setIsSubmitModalOpen(true);
                                                            }}
                                                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition duration-150 shadow-sm"
                                                        >
                                                            Resubmit Project
                                                        </button>
                                                    ) : (
                                                        <div className="w-full text-center py-2.5 text-[11px] font-bold text-amber-700 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl select-none leading-none flex flex-col items-center justify-center gap-1 border border-amber-205/60">
                                                            <span className="text-xs">✓ Submission Received</span>
                                                            <span className="text-[9px] text-slate-500 font-medium mt-1">⏳ Waiting for Admin Review</span>
                                                        </div>
                                                    )
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setProjectTitle(as.title);
                                                            setIsSubmitModalOpen(true);
                                                        }}
                                                        className="w-full flex items-center justify-center py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition duration-150 shadow-sm"
                                                    >
                                                        Submit Work
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                            </div>

                        </div>

                    </div>
                )}

                {/* Tab 2: My Workspace Rooms */}
                {activeTab === 'courses' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Interactive Learning Rooms</h2>
                        {enrollments.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl text-center space-y-4 border">
                                <BookOpen size={48} className="mx-auto text-slate-450" />
                                <h3 className="font-bold">No active enrollments found</h3>
                                <p className="text-xs text-slate-455">Please register in some learning categories or internships first.</p>
                                <button onClick={() => setActiveTab('internships')} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">Explore Domains</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                                {/* Courses selection list */}
                                <div className="lg:col-span-4 space-y-3">
                                    <span className="text-xs font-bold uppercase text-slate-400 block px-1">Registered Modules</span>
                                    {enrollments.map((en) => (
                                        <button
                                            key={en.id}
                                            onClick={() => {
                                                setSelectedEnrollment(en);
                                                if (en.course.lessons && en.course.lessons.length > 0) {
                                                    setCurrentVideoUrl(en.course.lessons[0].videoUrl);
                                                    setActiveVideoTitle(en.course.lessons[0].title);
                                                } else {
                                                    setCurrentVideoUrl('');
                                                    setActiveVideoTitle('');
                                                }
                                            }}
                                            className={`w-full p-4 rounded-xl text-left border transition ${displayEnrollment?.id === en.id
                                                ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-900/10'
                                                : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                                                }`}
                                        >
                                            <h4 className="font-bold text-sm">{en.course.title}</h4>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-[10px] text-slate-450 capitalize">{en.course.type}</span>
                                                <span className="text-[10px] font-bold text-blue-600">{en.progress}% done</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Active course core area */}
                                {displayEnrollment && (
                                    <div className="lg:col-span-8 space-y-6">
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">

                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="px-2.5 py-0.5 text-[9px] uppercase font-extrabold tracking-wider bg-indigo-50 text-indigo-700 rounded dark:bg-indigo-900/30">Active Studio</span>
                                                    <h3 className="text-xl font-bold mt-1 text-slate-900 dark:text-white">{displayEnrollment.course.title}</h3>
                                                </div>
                                                {displayEnrollment.progress < 100 && (
                                                    <button
                                                        onClick={() => updateCourseProgress(displayEnrollment, 20)}
                                                        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
                                                    >
                                                        <CheckCheck size={12} />
                                                        <span>Increment progress</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Mock Video Lesson */}
                                            {currentVideoUrl ? (
                                                <div className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-400 block font-mono">Instructional Video: {activeVideoTitle}</span>
                                                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 relative">
                                                        <video src={currentVideoUrl} controls className="w-full h-full object-cover">
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No instructional videos loaded for this category. Review the curriculum tasks below.</p>
                                            )}

                                            {/* Lessons Select */}
                                            {displayEnrollment.course.lessons && displayEnrollment.course.lessons.length > 0 && (
                                                <div className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-400 block font-mono">Syllabus Index</span>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {displayEnrollment.course.lessons.map((les, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => {
                                                                    setCurrentVideoUrl(les.videoUrl);
                                                                    setActiveVideoTitle(les.title);
                                                                }}
                                                                className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-medium text-left truncate transition ${activeVideoTitle === les.title
                                                                    ? 'border-indigo-500 bg-indigo-50/20 text-indigo-650'
                                                                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50'
                                                                    }`}
                                                            >
                                                                <Play size={10} className="flex-shrink-0" />
                                                                <span className="truncate">{index + 1}. {les.title} ({les.duration})</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Explore Domains */}
                {activeTab === 'internships' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Explore Internship domains</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {allCourses.filter(c => c.type === 'INTERNSHIP').map((c) => {
                                const isEnrolled = enrollments.some(e => e.courseId === c.id);
                                return (
                                    <div key={c.id} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="px-2.5 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700 rounded dark:bg-slate-800 dark:text-slate-350">{c.category}</span>
                                                <h3 className="font-bold text-lg mt-1">{c.title}</h3>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-400">{c.duration}</span>
                                        </div>
                                        <p className="text-xs text-slate-550 line-clamp-3 leading-relaxed">{c.description}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                            {isEnrolled ? (
                                                <span className="text-xs font-bold text-green-650 flex items-center gap-1">
                                                    <CheckCircle2 size={12} />
                                                    Enrolled
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleEnrollDirect(c.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
                                                >
                                                    Select Track
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tab 4: Submissions */}
                {activeTab === 'projects' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Submissions Registry</h2>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <form onSubmit={handleProjectSubmit} className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-205 dark:border-slate-800/80 shadow-sm space-y-4">
                                <h3 className="font-bold text-base">New Submissions Form</h3>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-450 block mb-1">Project Milestone Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={projectTitle}
                                        onChange={(e) => setProjectTitle(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs"
                                        placeholder="e.g. Portfolio Website Tasks"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-455 block mb-1">GitHub Code Repository URL</label>
                                    <input
                                        type="url"
                                        required
                                        value={projectGit}
                                        onChange={(e) => setProjectGit(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs"
                                        placeholder="https://github.com/username/project"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-455 block mb-1">Work Descriptions / Readme</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={projectDesc}
                                        onChange={(e) => setProjectDesc(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                                        placeholder="Detail the tools and framework pages created..."
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={projectLoading}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                                >
                                    {projectLoading ? 'Uploading...' : 'Submit Repository'}
                                </button>
                            </form>

                            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-205 dark:border-slate-800/80 shadow-sm space-y-4">
                                <h3 className="font-bold text-base">Submission History Log</h3>
                                {projects.length === 0 ? (
                                    <p className="text-xs text-slate-400">No active submissions logged yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {projects.map((p) => (
                                            <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-105 dark:border-slate-850 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-sm">{p.title}</h4>
                                                        <span className="text-[10px] text-slate-400">Submitted: {new Date(p.submittedAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'APPROVED' ? 'bg-green-150 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
                                                        {p.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                                                <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                                                    <span>View Code Repository</span>
                                                    <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 5: Certificates */}
                {activeTab === 'credentials' && (
                    <div className="space-y-6 font-sans">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Award className="text-blue-600" />
                            <span>Certificates of Internship</span>
                        </h2>
                        {certificates.length === 0 ? (
                            (!displayEnrollment || completedTasksCount < totalTasksCount) ? (
                                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-12 rounded-3xl text-center space-y-4 shadow-sm max-w-lg mx-auto">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-2xl">
                                        🔒
                                    </div>
                                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Certificate Locked</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                                        Complete admin verification to receive your certificate. All milestone tasks and the final project submissions must be evaluated and approved.
                                    </p>
                                    <div className="text-[11px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl max-w-xs mx-auto border dark:border-slate-850 space-y-2">
                                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                            <span>Task Progress:</span>
                                            <span>{completedTasksCount} / {totalTasksCount} Approved</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-650 h-full rounded-full transition-all duration-300" style={{ width: `${(completedTasksCount / totalTasksCount) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-12 rounded-3xl text-center space-y-4 shadow-sm max-w-lg mx-auto">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 dark:bg-blue-955/20 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                                        <Award size={32} />
                                    </div>
                                    <h3 className="font-bold text-slate-850 dark:text-white">Eligible for Certificate!</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                                        Congratulations! You have completed all task requirements. Your official certificate is being compiled and will be available to preview shortly.
                                    </p>
                                </div>
                            )
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {certificates.map((cert) => (
                                    <div key={cert.id} className="p-6 bg-white dark:bg-slate-900 border rounded-3xl shadow space-y-3 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-base text-slate-900 dark:text-white">{cert.courseName}</h3>
                                            <p className="text-xs font-mono text-slate-400">ID: {cert.certificateNumber}</p>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => setSelectedCertPreview(cert)}
                                                className="px-4 py-2 text-xs font-bold text-white bg-blue-655 rounded-xl hover:bg-blue-700 flex-1 text-center"
                                            >
                                                Preview certificate
                                            </button>
                                            <button
                                                onClick={() => setSelectedCertPreview(cert)}
                                                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-205 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 flex items-center justify-center"
                                                title="Print Certificate PDF"
                                            >
                                                <Printer size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 6: Offer Letters */}
                {activeTab === 'letters' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MailOpen className="text-blue-600" />
                            <span>My Offer Letters</span>
                        </h2>
                        {offerLetters.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-3xl text-center space-y-3">
                                <MailOpen size={48} className="mx-auto text-slate-400" />
                                <h3 className="font-bold text-slate-700 dark:text-slate-200">No offer letters issued</h3>
                                <p className="text-xs text-slate-450 dark:text-slate-400">Once your application setup and evaluation are processed, your virtual internship offer letter will register here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {offerLetters.map((l) => (
                                    <div key={l.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md flex flex-col justify-between space-y-6">

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[9px] uppercase font-bold tracking-widest bg-blue-50 text-blue-600 dark:bg-blue-955 dark:text-blue-400 px-2 py-0.5 rounded">
                                                        VIONIX OFFICIAL
                                                    </span>
                                                    <h3 className="font-bold text-lg mt-1 text-slate-900 dark:text-white capitalize">{l.internshipTitle}</h3>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                                                    l.status === 'DECLINED' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                                                        l.status === 'EXPIRED' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-955 dark:text-blue-300'
                                                    }`}>
                                                    {l.status}
                                                </span>
                                            </div>

                                            <div className="text-xs text-slate-500 space-y-1">
                                                <p><span className="font-semibold text-slate-400">Offer Code:</span> <span className="font-mono">{l.offerLetterId}</span></p>
                                                <p><span className="font-semibold text-slate-400">Duration:</span> {l.duration}</p>
                                                <p><span className="font-semibold text-slate-400">Mentor:</span> {l.mentorName}</p>
                                                <p><span className="font-semibold text-slate-400">Issue Date:</span> {new Date(l.issueDate).toLocaleDateString()}</p>
                                            </div>

                                            {l.status === 'ACCEPTED' && (
                                                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-750 dark:text-green-305 rounded-xl text-xs font-bold text-center">
                                                    ✓ Internship Offer Accepted
                                                </div>
                                            )}

                                            {l.status === 'DECLINED' && (
                                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-305 rounded-xl text-xs font-bold text-center">
                                                    ✗ Offer Letter Declined
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 pt-3 border-t border-slate-105 dark:border-slate-800">
                                            {/* Action triggers */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedOfferLetterPreview(l)}
                                                    className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
                                                >
                                                    View Letter
                                                </button>

                                                <button
                                                    onClick={() => { setSelectedOfferLetterPreview(l); }}
                                                    className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center gap-1"
                                                >
                                                    <Printer size={12} />
                                                    <span>Print / Save PDF</span>
                                                </button>
                                            </div>

                                            {(l.status === 'GENERATED' || l.status === 'SENT') && (
                                                <div className="flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-850">
                                                    <button
                                                        onClick={() => handleAcceptOffer(l.id)}
                                                        className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition"
                                                    >
                                                        Accept Offer
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineOffer(l.id)}
                                                        className="flex-1 py-2 text-xs font-bold text-white bg-red-650 hover:bg-red-700 rounded-xl transition"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 7: Profile Setting */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileUpdate} className="max-w-xl bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <h2 className="text-2xl font-bold font-mono">Profile Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-450 block mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={nameField}
                                    onChange={(e) => setNameField(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-450 block mb-1">Your Skills</label>
                                <input
                                    type="text"
                                    required
                                    value={skillsField}
                                    onChange={(e) => setSkillsField(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs"
                                />
                            </div>
                        </div>
                        <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700">Save Profile</button>
                    </form>
                )}

            </main>

            {/* A. LINKEDIN DIALOG MODAL */}
            <AnimatePresence>
                {isLinkedInModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-2xl space-y-4 border dark:border-slate-800"
                        >
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Linkedin size={18} className="text-blue-600" />
                                <span>Submit LinkedIn Post URL</span>
                            </h3>
                            <p className="text-xs text-slate-500">
                                Share the link of your Vinix offer letter post on LinkedIn to verify your enrollment.
                            </p>

                            <form onSubmit={handleLinkedInSubmit} className="space-y-4">
                                <input
                                    type="url"
                                    required
                                    value={linkedInUrlInput}
                                    onChange={(e) => setLinkedInUrlInput(e.target.value)}
                                    placeholder="https://www.linkedin.com/posts/..."
                                    className="w-full p-3 border border-slate-250 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-950 dark:text-white"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsLinkedInModalOpen(false)}
                                        className="px-4 py-2 text-xs font-bold text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 text-xs font-bold text-white bg-blue-650 rounded-lg hover:bg-blue-700"
                                    >
                                        Verify Link
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* B. TASK SUBMISSION DIALOG MODAL */}
            <AnimatePresence>
                {isSubmitModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-2xl space-y-4 border dark:border-slate-800"
                        >
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                                <FileCode size={18} className="text-blue-600" />
                                <span>Submit Work Repository</span>
                            </h3>
                            <p className="text-xs text-slate-500">Provide the code link and description details to log task deliverables.</p>

                            <form onSubmit={handleProjectSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-450 block mb-1">Task Title</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={projectTitle}
                                        className="w-full p-2.5 border border-slate-200 bg-slate-105 rounded-xl text-xs font-semibold text-slate-500 select-none dark:bg-slate-950"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-450 block mb-1">GitHub Link *</label>
                                    <input
                                        type="url"
                                        required
                                        value={projectGit}
                                        onChange={(e) => setProjectGit(e.target.value)}
                                        placeholder="https://github.com/username/repo-name"
                                        className="w-full p-2.5 border border-slate-205 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-450 block mb-1">Readme Description *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={projectDesc}
                                        onChange={(e) => setProjectDesc(e.target.value)}
                                        placeholder="Describe the application features and databases configured..."
                                        className="w-full p-2.5 border border-slate-205 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none"
                                    ></textarea>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsSubmitModalOpen(false)}
                                        className="px-4 py-2 text-xs font-bold text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 text-xs font-bold text-white bg-blue-650 rounded-lg hover:bg-blue-700"
                                    >
                                        Upload Deliverables
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* C. CERTIFICATE PREVIEW MODAL */}
            <AnimatePresence>
                {selectedCertPreview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-2xl space-y-6 border dark:border-slate-800 my-8 animate-float"
                        >
                            <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <Award size={18} className="text-amber-500" />
                                    <span>Certificate Preview</span>
                                </h3>
                                <button
                                    onClick={() => setSelectedCertPreview(null)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition"
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>

                            {/* Verification Certificate Preview */}
                            <div
                                className="w-full aspect-[1.414/1] bg-amber-50/15 dark:bg-slate-950/40 border-4 border-double border-blue-900 dark:border-blue-800 p-6 sm:p-10 relative flex flex-col justify-between overflow-hidden rounded-2xl"
                            >
                                <div className="absolute inset-1.5 border border-amber-500/20 pointer-events-none rounded-[12px]"></div>

                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.015]">
                                    <GraduationCap size={240} className="text-slate-900 dark:text-white" />
                                </div>

                                <div className="flex justify-between items-start z-10">
                                    <div className="border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 rounded-lg p-1.5 flex items-center justify-center w-40 select-none">
                                        <img src="/msme.jpeg" alt="MSME Logo" className="h-8 max-w-full object-contain rounded" />
                                    </div>

                                    <div className="text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">VINIX</span>
                                        </div>
                                        <span className="text-[7.5px] font-extrabold text-slate-400 tracking-[0.25em] block leading-none mt-0.5">TECHNOLOGIES</span>
                                    </div>

                                    <div className="text-right text-[7px] font-mono text-slate-400 select-none">
                                        REF: {selectedCertPreview.certificateNumber}
                                    </div>
                                </div>

                                <div className="text-center my-auto space-y-3 z-10 px-4 sm:px-8">
                                    <h2 className="text-lg sm:text-2xl font-serif font-extrabold text-amber-700 dark:text-amber-500 tracking-wide">
                                        CERTIFICATE OF VIRTUAL INTERNSHIP
                                    </h2>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] sm:text-xs text-slate-500 font-semibold italic">This is proudly presented to</p>
                                        <h3 className="text-xl sm:text-3xl font-bold font-serif text-slate-905 dark:text-white underline decoration-amber-500 decoration-1 underline-offset-4">
                                            {user?.name || "Vishal R"}
                                        </h3>
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                                        for outstanding performance and successful completion of the{' '}
                                        <strong className="text-blue-700 dark:text-blue-400 font-bold">{selectedCertPreview.courseName}</strong> virtual internship program at{' '}
                                        <span className="font-semibold text-slate-805 dark:text-slate-205">Vinix Technologies</span>.
                                    </p>
                                </div>

                                <div className="flex justify-between items-end z-10 pt-2 border-t border-slate-150 dark:border-slate-800/80">
                                    <div className="text-[7.5px] uppercase font-mono text-slate-550 space-y-0.5 text-left">
                                        <p><span className="font-bold">STATUS:</span> <span className="text-green-600 dark:text-green-400 font-extrabold">VERIFIED</span></p>
                                        <p><span className="font-bold">ISSUE DATE:</span> {new Date(selectedCertPreview.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <p className="text-blue-600 dark:text-blue-400 truncate max-w-[180px] font-semibold lowercase">
                                            ID: {selectedCertPreview.certificateNumber}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center select-none scale-75 origin-bottom">
                                        <img src="/certificate-stamp.jpeg" alt="Official Seal" className="w-12 h-12 object-contain rotate-6" />
                                        <span className="text-[6px] font-bold text-amber-655 uppercase tracking-widest mt-0.5">OFFICIAL SEAL</span>
                                    </div>

                                    <div className="text-right flex flex-col items-end space-y-0.5">
                                        <span className="font-serif italic text-base sm:text-xl text-blue-750 dark:text-blue-400 tracking-wide select-none pr-2">
                                            Vishal R.
                                        </span>
                                        <div className="h-[1px] w-28 bg-slate-350 dark:bg-slate-700"></div>
                                        <div className="text-right">
                                            <h4 className="text-[8px] font-extrabold text-slate-900 dark:text-white uppercase leading-none">Vishal R</h4>
                                            <p className="text-[7px] text-slate-450">Founder & CEO, Vinix</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-2 border-t dark:border-slate-800">
                                <button
                                    onClick={() => window.print()}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-650 rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
                                >
                                    <FileDown size={14} />
                                    <span>Save / Print PDF</span>
                                </button>
                                <button
                                    onClick={() => {
                                        window.print();
                                    }}
                                    className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-205 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 flex items-center gap-1.5"
                                >
                                    <Printer size={14} />
                                    <span>Print Certificate</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* D. OFFER LETTER PREVIEW MODAL */}
            <AnimatePresence>
                {selectedOfferLetterPreview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-2xl space-y-6 border dark:border-slate-800 my-8 animate-float"
                        >
                            <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <MailOpen size={18} className="text-indigo-500" />
                                    <span>Internship Offer Letter Preview</span>
                                </h3>
                                <button
                                    onClick={() => setSelectedOfferLetterPreview(null)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition"
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>

                            {/* Verification Offer Letter A4 Preview */}
                            <div className="w-full bg-white text-slate-850 p-6 sm:p-10 relative flex flex-col justify-between rounded-xl shadow border border-slate-200 aspect-[0.707/1] max-h-[60vh] overflow-y-auto">

                                {/* Top Header */}
                                {/* Top Header */}
                                <div className="flex justify-between items-start pb-4 border-b-2 border-blue-500 text-left">
                                    <div className="space-y-1">
                                        <h2 className="text-lg sm:text-2xl font-black text-blue-900 tracking-tight leading-none">VINIX TECHNOLOGIES</h2>
                                        <p className="text-[9px] sm:text-xs text-slate-500 font-semibold">Learn. Build. Intern. Get Industry Ready.</p>
                                    </div>
                                    <div className="text-right text-[8px] sm:text-xs text-slate-450 font-mono">
                                        <p className="font-bold">VINIX TECHNOLOGIES</p>
                                        <p>Chennai, Tamil Nadu, India</p>
                                    </div>
                                </div>

                                {/* Title, Ref & Dates */}
                                <div className="text-center pt-4">
                                    <h3 className="text-sm sm:text-lg font-black text-slate-900 tracking-wider">INTERNSHIP OFFER LETTER</h3>
                                </div>

                                <div className="flex justify-between text-[9px] text-slate-500 pt-2 font-semibold uppercase font-mono">
                                    <span>Ref Number: {selectedOfferLetterPreview.offerLetterId}</span>
                                    <span>Date: {new Date(selectedOfferLetterPreview.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>

                                {/* Salutation & Opening Paragraph */}
                                <div className="pt-4 text-left text-xs text-slate-800">
                                    <p className="font-bold">Dear {selectedOfferLetterPreview.studentName},</p>
                                    <p className="pt-2 leading-relaxed text-slate-650">
                                        Following your application and subsequent evaluation processes, we are pleased to offer you the position of Virtual Intern – <strong className="text-slate-900">{selectedOfferLetterPreview.internshipTitle}</strong> at Vinix Technologies. Under the terms of this offer, you will be assigned learning milestones, practical projects, and domain tasks to prepare you for industry work.
                                    </p>
                                </div>

                                {/* Internship Details Table */}
                                <div className="pt-4">
                                    <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                                        <div className="grid grid-cols-2 bg-blue-900 text-white font-bold py-1.5 px-3">
                                            <span>Particulars</span>
                                            <span>Details</span>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {[
                                                { name: 'Full Name', val: selectedOfferLetterPreview.studentName },
                                                { name: 'Intern ID', val: selectedOfferLetterPreview.offerLetterId },
                                                { name: 'Domain', val: selectedOfferLetterPreview.internshipTitle },
                                                { name: 'Duration', val: selectedOfferLetterPreview.duration },
                                                { name: 'Start Date', val: new Date(selectedOfferLetterPreview.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                                                { name: 'End Date', val: new Date(selectedOfferLetterPreview.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                                                { name: 'Mode of Internship', val: 'Remote / Virtual' }
                                            ].map((row, idx) => (
                                                <div key={idx} className={`grid grid-cols-2 py-1.5 px-3 ${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
                                                    <span className="font-bold text-slate-700">{row.name}</span>
                                                    <span className="text-slate-900">{row.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Overview & Terms */}
                                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-[11px] sm:text-xs">
                                    {/* Internship Overview */}
                                    <div className="space-y-1.5">
                                        <h4 className="font-bold text-slate-905 uppercase tracking-wider text-[10px]">Internship Overview:</h4>
                                        <ul className="list-disc pl-4 space-y-1 text-slate-500">
                                            <li>Work on practical, real-world projects.</li>
                                            <li>Gain experience with modern tool/tech stacks.</li>
                                            <li>Receive mentorship milestone feedback.</li>
                                            <li>Enhance key domain knowledge.</li>
                                        </ul>
                                    </div>

                                    {/* Terms & Conditions */}
                                    <div className="space-y-1.5">
                                        <h4 className="font-bold text-slate-905 uppercase tracking-wider text-[10px]">Terms & Conditions:</h4>
                                        <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                                            <li>Virtually conducted with flexible milestones.</li>
                                            <li>Submit code repositories via GitHub.</li>
                                            <li>Completion requires task evaluations.</li>
                                            <li>Seal-registered Certificate on completion.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* Stamp Seal & Signature Block */}
                                <div className="pt-4 flex justify-between items-end border-t border-slate-100 mt-4">
                                    {/* Left: Scan QR Placeholder */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 bg-slate-100 border border-slate-205 flex items-center justify-center rounded p-1">
                                            <div className="w-full h-full bg-slate-300 flex items-center justify-center text-[7px] text-slate-500 font-mono text-center font-bold">QR VERIFIED</div>
                                        </div>
                                        <span className="text-[7px] uppercase tracking-wider text-slate-400 mt-1 font-bold">Scan to Verify</span>
                                    </div>

                                    {/* Center: Stamp Seal */}
                                    <div className="flex flex-col items-center select-none">
                                        <img src="/certificate-stamp.jpeg" alt="Official Stamp" className="w-14 h-14 object-contain rotate-3 hover:scale-105 duration-200" />
                                        <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mt-1">OFFICIAL SEAL</span>
                                    </div>

                                    {/* Right Side Signature block */}
                                    <div className="text-right flex flex-col items-end space-y-0.5">
                                        <span className="font-serif italic text-base sm:text-xl text-blue-700 tracking-wide select-none pr-3">
                                            Vishal R.
                                        </span>
                                        <div className="h-[1px] w-28 bg-slate-300"></div>
                                        <div className="text-right leading-none">
                                            <h4 className="text-[9px] font-extrabold text-slate-905 uppercase">Vishal R</h4>
                                            <p className="text-[7.5px] text-slate-400">Founder & CEO</p>
                                            <p className="text-[6.5px] text-slate-450 uppercase font-bold">Vinix Technologies</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Accent Section */}
                                <div className="pt-2 border-t border-slate-150 flex justify-between items-center text-[7px] text-slate-400 mt-4">
                                    <div className="flex items-center gap-1.5">
                                        <img src="/msme.jpeg" alt="MSME Logo" className="h-4 object-contain rounded" />
                                        <span>Reg No: UDYAM-TN-02-0086782</span>
                                    </div>
                                    <div>
                                        <span>Contact: info@vinixtech.com | Web: www.vinixtech.com</span>
                                    </div>
                                </div>

                            </div>

                            <div className="flex gap-2 justify-end pt-2 border-t dark:border-slate-800">
                                <button
                                    onClick={() => window.print()}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-650 rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
                                >
                                    <FileDown size={14} />
                                    <span>Save / Print PDF</span>
                                </button>
                                <button
                                    onClick={() => {
                                        window.print();
                                    }}
                                    className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-205 dark:text-slate-205 dark:bg-slate-800 dark:hover:bg-slate-750 flex items-center gap-1.5"
                                >
                                    <Printer size={14} />
                                    <span>Print Offer Letter</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};
export default Dashboard;
