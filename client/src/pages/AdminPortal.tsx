import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import {
    LayoutDashboard, CheckSquare, Search, ShieldCheck,
    User, FolderOpen, Award, FileSpreadsheet, Plus, Trash2, Edit3,
    X, Megaphone, Mail, Sparkles, PlusCircle, Ticket,
    Download, ArrowRight, Bell, Moon, ChevronDown, ListTodo,
    Users, ExternalLink, Eye
} from 'lucide-react';


interface AdminEnrollment {
    id: string;
    joinedAt: string;
    status: string;
    user?: {
        name: string;
        email: string;
    };
    course?: {
        title: string;
    };
}

interface Course {
    id: string;
    title: string;
    category: string;
    description: string;
    duration: string;
    type: string;
    skills: string[];
    lessons?: unknown[];
    assignments?: unknown[];
}

interface Submission {
    id: string;
    title: string;
    description: string;
    githubLink: string;
    status: string;
    feedback?: string;
    submittedAt: string;
    studentId?: string;
    student: {
        id?: string;
        name: string;
        email: string;
        skills?: string[];
    };
    course?: {
        title: string;
    };
}

interface Certificate {
    id: string;
    certificateNumber: string;
    courseName: string;
    issueDate: string;
    student: {
        name: string;
    };
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
    status: string;
    pdfUrl?: string;
    verificationToken: string;
    createdAt: string;
    updatedAt: string;
}

interface EmailLog {
    id: string;
    emailTo: string;
    studentName: string;
    documentType: string;
    status: string;
    subject: string;
    referenceId?: string;
    errorMessage?: string;
    sentAt: string;
    createdAt: string;
}

export const AdminPortal: React.FC = () => {
    const { user, logout } = useAuth();
    const [activeSubTab, setActiveSubTab] = useState('overview');
    const [openActionsId, setOpenActionsId] = useState<string | null>(null);

    // Filter and review states
    const [submissionFilter, setSubmissionFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [reviewingSubmission, setReviewingSubmission] = useState<any | null>(null);
    const [feedbackInput, setFeedbackInput] = useState('');

    // API Payload States
    const [courses, setCourses] = useState<Course[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([]);
    const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

    // Form inputs
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Web Development');
    const [desc, setDesc] = useState('');
    const [duration, setDuration] = useState('8 Weeks');
    const [courseType, setCourseType] = useState('COURSE');
    const [skillsCsv, setSkillsCsv] = useState('');
    const [feedbackText, setFeedbackText] = useState<{ [key: string]: string }>({});

    // Marketing mock states
    const [promoCodes, setPromoCodes] = useState([
        { code: 'VINIXNEWMEMBER', discount: '20%', status: 'ACTIVE', uses: 24, expiry: '2026-12-31' },
        { code: 'DIWALI2026', discount: '30%', status: 'ACTIVE', uses: 8, expiry: '2026-11-15' },
        { code: 'EARLYBIRD', discount: '₹1000 Off', status: 'EXPIRED', uses: 45, expiry: '2026-07-01' }
    ]);
    const [newPromoCode, setNewPromoCode] = useState('');
    const [newPromoDiscount, setNewPromoDiscount] = useState('20%');

    const [promoPopup, setPromoPopup] = useState({
        isActive: true,
        headline: 'MSME Verified Internships Admissions Open for Fall 2026',
        bannerUrl: '',
        buttonText: 'Apply Now',
        redirectUrl: '/internships'
    });

    const [payments, setPayments] = useState([
        { id: 'INV-2026-001', studentName: 'Aravind S', program: 'Java Development', amount: '₹4,999', date: '2026-08-04', status: 'PAID' },
        { id: 'INV-2026-002', studentName: 'Priya Sharma', program: 'Full Stack Development', amount: '₹4,999', date: '2026-08-03', status: 'PAID' },
        { id: 'INV-2026-003', studentName: 'Rohan Gupta', program: 'Python Development', amount: '₹4,999', date: '2026-08-02', status: 'PAID' },
        { id: 'INV-2026-004', studentName: 'Sneha Patel', program: 'UI/UX Design', amount: '₹4,999', date: '2026-08-01', status: 'PAID' },
        { id: 'INV-2026-005', studentName: 'Aniket Verma', program: 'Cyber Security', amount: '₹4,999', date: '2026-07-29', status: 'REFUNDED' }
    ]);

    // UI Dark mode status inside components
    const [localDarkMode, setLocalDarkMode] = useState(false);
    const [deletedMockIds, setDeletedMockIds] = useState<string[]>([]);


    const refreshData = async () => {
        try {
            // 1. Fetch internships (courses)
            const { data: coursesData } = await supabase
                .from('internships')
                .select('*');

            const formattedCourses: Course[] = (coursesData || []).map(i => ({
                id: i.id,
                title: i.title,
                category: i.domain,
                description: i.description || '',
                duration: i.duration || '3 Months',
                type: 'INTERNSHIP',
                skills: [i.domain]
            }));
            setCourses(formattedCourses);

            // 2. Fetch submissions (task_progress)
            const { data: progressData } = await supabase
                .from('task_progress')
                .select(`
                    *,
                    task:task_id (*),
                    profile:user_id (*)
                `)
                .order('submitted_at', { ascending: false });

            const formattedSubmissions: Submission[] = [];
            for (const p of (progressData || [])) {
                if (p.status === 'submitted' || p.status === 'approved' || p.status === 'rejected') {
                    formattedSubmissions.push({
                        id: p.id,
                        title: p.task?.title || 'Milestone Task',
                        description: p.student_note || '',
                        githubLink: p.github_url || p.linkedin_url || '',
                        status: p.status === 'submitted' ? 'PENDING' : p.status.toUpperCase(),
                        feedback: p.admin_feedback || '',
                        submittedAt: p.submitted_at || p.created_at,
                        studentId: p.user_id,
                        student: {
                            id: p.user_id,
                            name: p.profile?.full_name || 'Anonymous student',
                            email: p.profile?.email || ''
                        },
                        course: {
                            title: (coursesData || []).find(c => c.id === p.internship_id)?.title || 'Virtual Internship'
                        }
                    });
                }
            }
            setSubmissions(formattedSubmissions);

            // 3. Fetch certificates
            const { data: certsData } = await supabase
                .from('certificates')
                .select(`
                    *,
                    profile:user_id (*)
                `);

            const formattedCerts: Certificate[] = (certsData || []).map(c => ({
                id: c.id,
                certificateNumber: c.certificate_number,
                courseName: c.course_name,
                issueDate: c.issue_date,
                student: {
                    name: c.profile?.full_name || 'Anonymous'
                }
            }));
            setCertificates(formattedCerts);

            // 4. Fetch enrollments
            const { data: enrollRes } = await supabase
                .from('internship_enrollments')
                .select(`
                    *,
                    profile:user_id (*),
                    internship:internship_id (*)
                `)
                .order('joined_at', { ascending: false });

            const formattedEnrollments: AdminEnrollment[] = (enrollRes || []).map(e => ({
                id: e.id,
                joinedAt: e.joined_at,
                status: e.status,
                user: {
                    name: e.profile?.full_name || 'Anonymous student',
                    email: e.profile?.email || ''
                },
                course: {
                    title: e.internship?.title || 'Virtual Internship'
                }
            }));
            setEnrollments(formattedEnrollments);

            // 5. Fetch offer letters
            const { data: lettersData } = await supabase
                .from('offer_letters')
                .select('*')
                .order('issue_date', { ascending: false });

            const formattedLetters: OfferLetter[] = (lettersData || []).map(l => ({
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
                status: l.status,
                verificationToken: l.verification_token,
                createdAt: l.created_at,
                updatedAt: l.updated_at
            }));
            setOfferLetters(formattedLetters);

            // 6. Fetch admin audit logs (for email logs)
            const { data: logsData } = await supabase
                .from('admin_audit_logs')
                .select('*')
                .order('created_at', { ascending: false });

            const formattedLogs: EmailLog[] = (logsData || []).map(log => ({
                id: log.id,
                emailTo: log.notes || 'system',
                studentName: 'Intern',
                documentType: log.action,
                status: 'SUCCESS',
                subject: `Admin Audit Log: ${log.action}`,
                referenceId: log.target_user_id || undefined,
                sentAt: log.created_at,
                createdAt: log.created_at
            }));
            setEmailLogs(formattedLogs);

        } catch (err) {
            console.error('Failed to load admin payload:', err);
        }
    };


    useEffect(() => {
        refreshData();
    }, []);

    const handleCourseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            title,
            category,
            description: desc,
            duration,
            type: courseType,
            skills: skillsCsv.split(',').map(s => s.trim()).filter(s => s.length > 0),
            lessons: [
                { title: 'Project 1 Overview & Setup', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '10 mins' }
            ],
            assignments: [
                { title: 'Milestone Submission', desc: `Submit the final code repository for the ${title} program.` }
            ],
            quizzes: [
                { question: `Which describes the main objective of studying ${title}?`, options: ['To construct scalable codebases', 'To study configurations', 'No benefits', 'Legacy tools'], answer: 'To construct scalable codebases' }
            ]
        };

        try {
            if (editingCourseId) {
                const { error } = await supabase
                    .from('internships')
                    .update({
                        title: payload.title,
                        domain: payload.category,
                        description: payload.description,
                        duration: payload.duration,
                        status: 'published'
                    })
                    .eq('id', editingCourseId);
                if (error) throw error;
                alert('Course updated successfully!');
            } else {
                const { error } = await supabase
                    .from('internships')
                    .insert({
                        title: payload.title,
                        domain: payload.category,
                        description: payload.description,
                        duration: payload.duration,
                        status: 'published'
                    });
                if (error) throw error;
                alert('New Course/Internship created!');
            }
            setTitle('');
            setDesc('');
            setEditingCourseId(null);
            setSkillsCsv('');
            refreshData();
            setActiveSubTab('manage-courses');
        } catch (err: any) {
            alert('Failed to submit course configuration: ' + err.message);
        }
    };

    const handleEditCourse = (c: Course) => {
        setEditingCourseId(c.id);
        setTitle(c.title);
        setCategory(c.category);
        setDesc(c.description);
        setDuration(c.duration);
        setCourseType(c.type);
        setSkillsCsv(c.skills?.join(', ') || '');
        setActiveSubTab('courses-form');
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm('Are you sure you want to delete this course/internship?')) return;
        try {
            const { error } = await supabase
                .from('internships')
                .delete()
                .eq('id', id);
            if (error) throw error;
            alert('Course deleted.');
            refreshData();
        } catch (err: any) {
            alert('Failed to delete course: ' + err.message);
        }
    };

    const handleDeleteApplication = async (appId: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the enrollment record of ${name}?`)) return;
        if (appId.startsWith('mock-')) {
            setDeletedMockIds(prev => [...prev, appId]);
            alert('Mock entry removed successfully.');
            return;
        }
        try {
            const { error } = await supabase
                .from('internship_enrollments')
                .delete()
                .eq('id', appId);
            if (error) throw error;
            alert('Student enrollment record deleted successfully.');
            refreshData();
        } catch (err: any) {
            console.error('Delete application error:', err);
            alert('Failed to delete user enrollment record: ' + err.message);
        }
    };


    // Helper to get formatted dates
    const getFormattedDate = () => {
        return new Date().toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Padded Enrollments for Internship Applications
    const mockEnrollments = [
        {
            id: 'mock-1',
            user: { name: 'Aravind S', email: 'aravind@gmail.com' },
            course: { title: 'Java Development' },
            college: 'Vinix Academy',
            branch: 'Btech -IT 2nd',
            joinedAt: '2026-08-04T12:00:00.000Z',
            status: 'ongoing'
        },
        {
            id: 'mock-2',
            user: { name: 'Aditya Kumar', email: 'aditya@gmail.com' },
            course: { title: 'Python Development' },
            college: 'PSG College of Technology',
            branch: 'B.E. - CSE',
            joinedAt: '2026-08-04T12:00:00.000Z',
            status: 'ongoing'
        },
        {
            id: 'mock-3',
            user: { name: 'Divya N', email: 'divya@gmail.com' },
            course: { title: 'Python Development' },
            college: 'VIT Chennai',
            branch: 'B.Tech - CSE',
            joinedAt: '2026-08-04T12:00:00.000Z',
            status: 'ongoing'
        },
        {
            id: 'mock-4',
            user: { name: 'Priya Sharma', email: 'priya@gmail.com' },
            course: { title: 'Full Stack Development' },
            college: 'Vinix Institute of Technology',
            branch: 'Btech - IT 3rd year',
            joinedAt: '2026-08-03T12:00:00.000Z',
            status: 'ongoing'
        },
        {
            id: 'mock-5',
            user: { name: 'Rahul Nair', email: 'rahul@gmail.com' },
            course: { title: 'Full Stack Development' },
            college: 'Vinix Academy',
            branch: 'M.Sc - Computer Science',
            joinedAt: '2026-08-03T12:00:00.000Z',
            status: 'ongoing'
        },
        {
            id: 'mock-6',
            user: { name: 'Karthik R', email: 'karthik@gmail.com' },
            course: { title: 'Python Development' },
            college: 'Vinix Institute of Technology',
            branch: 'Btech - IT 3rd year',
            joinedAt: '2026-07-28T12:00:00.000Z',
            status: 'ongoing'
        },
        {
            id: 'mock-7',
            user: { name: 'Hariharan V', email: 'hariharan@gmail.com' },
            course: { title: 'Python Development' },
            college: 'Vinix Academy',
            branch: 'Btech - IT 3rd year',
            joinedAt: '2026-07-25T12:00:00.000Z',
            status: 'ongoing'
        },
        {
            id: 'mock-8',
            user: { name: 'Praveen Kumar', email: 'praveen@gmail.com' },
            course: { title: 'Cyber Security' },
            college: 'Aditya College of Technology',
            branch: 'M.sc computer science 1st year',
            joinedAt: '2026-07-25T12:00:00.000Z',
            status: 'ongoing'
        }
    ];

    // Combine database enrollments with mock applications, ensuring no duplicates
    const dbEnrollmentsMapped = enrollments.map(e => ({
        id: e.id,
        user: { name: e.user?.name || 'Anonymous student', email: e.user?.email || '' },
        course: { title: e.course?.title || 'Virtual Internship' },
        college: 'Vinix Institute of Technology',
        branch: 'B.Tech IT 3rd Year',
        joinedAt: e.joinedAt,
        status: e.status?.toLowerCase() || 'ongoing'
    }));

    const allApplicationsRaw = [...dbEnrollmentsMapped];
    // Add mock entries if their emails aren't already registered
    mockEnrollments.forEach(mock => {
        if (!allApplicationsRaw.some(app => app.user.email === mock.user.email)) {
            allApplicationsRaw.push(mock);
        }
    });

    const allApplications = allApplicationsRaw.filter(app => !deletedMockIds.includes(app.id));


    // Padded Submissions for Task Submissions
    const mockSubmissions = [
        {
            id: 'mocksub-1',
            title: 'Task 1: Calculator App',
            student: { name: 'Hariharan V', email: 'hariharan@gmail.com' },
            enrollmentId: 'VNX-2026-1102',
            course: { title: 'Python Development' },
            submittedAt: '2026-07-30T12:00:00.000Z',
            githubLink: '#',
            description: 'Calculator implemented using Tkinter with robust memory operation supports.',
            status: 'APPROVED',
            feedback: 'Excellent clean code structures.'
        },
        {
            id: 'mocksub-2',
            title: 'Task 9: Real-Time Chat Application',
            student: { name: 'Vishal R', email: 'student@vinix.com' },
            enrollmentId: 'VNX-2026-1757',
            course: { title: 'Full Stack Development' },
            submittedAt: '2026-07-28T12:00:00.000Z',
            githubLink: '#',
            description: 'Instant chat powered by socket.io and React with direct messaging support.',
            status: 'APPROVED',
            feedback: 'Highly scalable architecture design.'
        },
        {
            id: 'mocksub-3',
            title: 'Task 10: Food Ordering System',
            student: { name: 'Vishal R', email: 'student@vinix.com' },
            enrollmentId: 'VNX-2026-1757',
            course: { title: 'Full Stack Development' },
            submittedAt: '2026-07-28T12:00:00.000Z',
            githubLink: '#',
            description: 'A food delivery system with dynamic catalog search and cart integration.',
            status: 'APPROVED',
            feedback: 'Solid responsive layout.'
        },
        {
            id: 'mocksub-4',
            title: 'Task 8: Job Portal',
            student: { name: 'Vishal R', email: 'student@vinix.com' },
            enrollmentId: 'VNX-2026-1757',
            course: { title: 'Full Stack Development' },
            submittedAt: '2026-07-28T12:00:00.000Z',
            githubLink: '#',
            description: 'Interactive job search portal with recruiter filters and resume submissions.',
            status: 'APPROVED',
            feedback: 'Amazing interface designs.'
        },
        {
            id: 'mocksub-5',
            title: 'Task 6: E-Commerce Store',
            student: { name: 'Vishal R', email: 'student@vinix.com' },
            enrollmentId: 'VNX-2026-1757',
            course: { title: 'Full Stack Development' },
            submittedAt: '2026-07-28T12:00:00.057Z',
            githubLink: '#',
            description: 'Fully functional checkout flow with Stripe payment integration.',
            status: 'APPROVED',
            feedback: 'Thoroughly tested transaction system.'
        }
    ];

    // Combine database projects with mock submissions
    const dbSubmissionsMapped = submissions.map(s => {
        // compute dynamic seed ID
        let sum = 0;
        const emailStr = s.student?.email || '';
        for (let i = 0; i < emailStr.length; i++) sum += emailStr.charCodeAt(i);
        const codeNum = 1000 + (sum % 1000);
        const enrollmentId = `VNX-2026-${codeNum}`;

        return {
            id: s.id,
            title: s.title,
            student: { name: s.student?.name || 'Anonymous student', email: s.student?.email || '' },
            enrollmentId,
            course: { title: s.course?.title || 'Virtual Internship' },
            submittedAt: s.submittedAt,
            githubLink: s.githubLink,
            description: s.description,
            status: s.status,
            feedback: s.feedback
        };
    });

    const allSubmissions = [...dbSubmissionsMapped];
    mockSubmissions.forEach(mock => {
        if (!allSubmissions.some(sub => sub.title === mock.title && sub.student.email === mock.student.email)) {
            allSubmissions.push(mock);
        }
    });

    // Calculate display counts
    const totalStudentsCount = allApplications.length;
    const totalApplicationsCount = allApplications.length;
    const activeInternshipsCount = allApplications.filter(a => a.status === 'ongoing' || a.status === 'enrolled').length;
    const certificatesIssuedCount = certificates.length || 3;

    // Approval workflow calculations
    const pendingReviewsCount = allSubmissions.filter(s => s.status === 'SUBMITTED' || s.status === 'PENDING' || s.status === 'UNDER_REVIEW').length;
    const pendingProjectsCount = allSubmissions.filter(s =>
        (s.title.toLowerCase().includes('project') || s.title.toLowerCase().includes('final')) &&
        (s.status === 'SUBMITTED' || s.status === 'PENDING' || s.status === 'UNDER_REVIEW')
    ).length;
    const rejectedSubmissionsCount = allSubmissions.filter(s => s.status === 'REJECTED' || s.status === 'RESUBMISSION_REQUIRED').length;

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">

            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between flex-shrink-0 transition-all duration-300">
                <div className="p-4 space-y-6">
                    {/* Sidebar Logo Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-2.5">
                            <div className="w-8.5 h-8.5 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/20">
                                <Award size={18} />
                            </div>
                            <span className="font-extrabold text-sm tracking-tight text-slate-850 dark:text-white">
                                VinixAdmin
                            </span>
                        </div>
                        <button className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                            <ListTodo size={14} />
                        </button>
                    </div>

                    {/* Navigation Groups */}
                    <div className="space-y-4">
                        {/* MAIN Section */}
                        <div className="space-y-1">
                            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">MAIN</span>
                            <button
                                onClick={() => setActiveSubTab('overview')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'overview'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <LayoutDashboard size={14} />
                                    <span>Dashboard</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveSubTab('applications')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'applications'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <FolderOpen size={14} />
                                    <span>Internship Applications</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveSubTab('approve-projects')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-205 uppercase tracking-wider ${activeSubTab === 'approve-projects'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <CheckSquare size={14} />
                                    <span>Task Submissions</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${submissions.filter(s => s.status === 'PENDING').length > 0
                                    ? 'bg-amber-100 text-amber-700 animate-pulse'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                    }`}>
                                    {submissions.filter(s => s.status === 'PENDING').length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveSubTab('verification-queue')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'verification-queue'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <ShieldCheck size={14} />
                                    <span>Verification Queue</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveSubTab('students')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'students'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <User size={14} />
                                    <span>Students</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveSubTab('certs-log')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'certs-log'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Award size={14} />
                                    <span>Certificates</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveSubTab('payments')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'payments'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <FileSpreadsheet size={14} />
                                    <span>Payments & Invoices</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveSubTab('manage-courses')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'manage-courses'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Plus size={14} />
                                    <span>Internship Domains</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveSubTab('courses-form')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'courses-form'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Edit3 size={14} />
                                    <span>Manage Tasks</span>
                                </div>
                            </button>
                        </div>

                        {/* MARKETING Section */}
                        <div className="space-y-1">
                            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">MARKETING</span>
                            <button
                                onClick={() => setActiveSubTab('promotions')}
                                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'promotions'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Sparkles size={14} />
                                    <span>Promotions</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveSubTab('promo-popup')}
                                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'promo-popup'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Megaphone size={14} />
                                    <span>Promo Popup</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveSubTab('email-logs')}
                                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'email-logs'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Mail size={14} />
                                    <span>Email Logs</span>
                                </div>
                            </button>
                        </div>

                        {/* ANALYTICS Section */}
                        <div className="space-y-1">
                            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ANALYTICS</span>
                            <button
                                onClick={() => setActiveSubTab('analytics')}
                                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 uppercase tracking-wider ${activeSubTab === 'analytics'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <FileSpreadsheet size={14} />
                                    <span>Analytics</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 uppercase tracking-wider transition"
                    >
                        <X size={14} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Viewport content area */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top Bar Header */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-205/60 dark:border-slate-800/80 px-6 flex items-center justify-between z-10 select-none">
                    <div className="flex items-center space-x-4">
                        {/* Search Input Bar */}
                        <div className="relative w-72">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                                <Search size={14} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search students, applications,..."
                                className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white placeholder-slate-400"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
                                ⌘K
                            </span>
                        </div>

                        {/* DB Status Pill */}
                        <div className="flex items-center space-x-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full select-none text-[10px] font-black text-green-700 uppercase tracking-wider">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                            <span>DB Live Sync Active</span>
                        </div>
                    </div>

                    {/* Right User Bar */}
                    <div className="flex items-center space-x-4">
                        {/* Dark Toggle */}
                        <button
                            onClick={() => setLocalDarkMode(!localDarkMode)}
                            className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition"
                        >
                            <Moon size={16} />
                        </button>

                        {/* Notify */}
                        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl relative transition">
                            <Bell size={16} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
                        </button>

                        {/* User profile Pill */}
                        <div className="flex items-center space-x-3 px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-slate-300 transition">
                            <div className="w-8.5 h-8.5 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-inner">
                                {user?.name ? user.name[0].toUpperCase() : 'V'}
                            </div>
                            <div className="text-left">
                                <h4 className="text-xs font-black text-slate-850 dark:text-white leading-none whitespace-nowrap">
                                    {user?.name ? user.name.toLowerCase() : 'vishal r'}
                                </h4>
                                <span className="text-[9px] text-[#6b7280] font-bold block mt-0.5 leading-none">Super Admin</span>
                            </div>
                            <ChevronDown size={12} className="text-slate-400" />
                        </div>
                    </div>
                </header>

                {/* Dashboard Viewport content */}
                <main className="flex-grow p-6 sm:p-8 space-y-6 overflow-y-auto">

                    {/* Welcome Header bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Welcome back, {user?.name ? user.name.split(' ')[0] : 'Hariharan'}! 👋
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                Here's what's happening with your internship platform today.
                            </p>
                        </div>

                        {/* Date Tag */}
                        <div className="inline-flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm leading-none">
                            <span>{getFormattedDate()}</span>
                        </div>
                    </div>

                    {/* Stats Rows */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                        {/* Card 1: Total Students */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-start shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-1">
                                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none">Total Students</span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none pt-1">{totalStudentsCount}</h3>
                                <span className="text-[9px] font-bold text-emerald-600 block leading-none pt-1">
                                    ▲ 12.5%
                                </span>
                            </div>
                        </div>

                        {/* Card 2: Applications */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-start shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-1">
                                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none">Applications</span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none pt-1">{totalApplicationsCount}</h3>
                                <span className="text-[9px] font-bold text-blue-600 block leading-none pt-1">
                                    Total Registered
                                </span>
                            </div>
                        </div>

                        {/* Card 3: Active Internships */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-start shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-1">
                                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none">Active</span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none pt-1">{activeInternshipsCount}</h3>
                                <span className="text-[9px] font-bold text-emerald-600 block leading-none pt-1">
                                    ▲ 8.2%
                                </span>
                            </div>
                        </div>

                        {/* Card 4: Certificates Issued */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-start shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-1">
                                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none">Certs Issued</span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none pt-1">{certificatesIssuedCount}</h3>
                                <span className="text-[9px] font-bold text-amber-500 block leading-none pt-1">
                                    This month
                                </span>
                            </div>
                        </div>

                        {/* Card 5: Pending Reviews */}
                        <div
                            onClick={() => {
                                setSubmissionFilter('PENDING');
                                setActiveSubTab('approve-projects');
                            }}
                            className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-start shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-blue-500/40 group"
                        >
                            <div className="space-y-1 font-sans">
                                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none">Pending Reviews</span>
                                <h3 className="text-xl font-black text-amber-600 dark:text-amber-500 leading-none pt-1 group-hover:scale-105 transition-transform">{pendingReviewsCount}</h3>
                                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 block hover:underline leading-none pt-1">
                                    Review →
                                </span>
                            </div>
                        </div>

                        {/* Card 6: Pending Projects */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-start shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-1">
                                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none">Pending Projects</span>
                                <h3 className="text-xl font-black text-purple-650 dark:text-purple-500 leading-none pt-1">{pendingProjectsCount}</h3>
                                <span className="text-[9px] font-bold text-slate-500 block leading-none pt-1">
                                    Final Submissions
                                </span>
                            </div>
                        </div>

                        {/* Card 7: Rejected Submissions */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-start shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-1">
                                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none">Rejected Tasks</span>
                                <h3 className="text-xl font-black text-red-600 dark:text-red-500 leading-none pt-1">{rejectedSubmissionsCount}</h3>
                                <span className="text-[9px] font-bold text-rose-600 block leading-none pt-1">
                                    Needs Revision
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* TAB VIEWS */}
                    {activeSubTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Left Area: Recent Task Submissions Table */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">Recent Task Submissions</h3>
                                    <button
                                        onClick={() => setActiveSubTab('approve-projects')}
                                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 rounded-lg px-3 py-1.5 uppercase hover:bg-blue-100 transition"
                                    >
                                        View All
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="text-slate-400 font-bold border-b border-slate-150 dark:border-slate-800">
                                                <th className="pb-3 text-[10px] tracking-wider uppercase">Student</th>
                                                <th className="pb-3 text-[10px] tracking-wider uppercase">Task</th>
                                                <th className="pb-3 text-[10px] tracking-wider uppercase">Domain</th>
                                                <th className="pb-3 text-[10px] tracking-wider uppercase">Submitted On</th>
                                                <th className="pb-3 text-[10px] tracking-wider uppercase">Status</th>
                                                <th className="pb-3 text-[10px] tracking-wider uppercase text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {allSubmissions.slice(0, 5).map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-650 dark:text-slate-300">
                                                    <td className="py-3 flex items-center space-x-3.5">
                                                        <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 font-extrabold flex items-center justify-center text-[10px]">
                                                            {item.student?.name ? item.student.name[0] : 'S'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h5 className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                                                                {item.student?.name || 'Anonymous Graduate'}
                                                            </h5>
                                                            <span className="text-[10px] text-slate-400 block truncate mt-0.5 leading-none">
                                                                {item.student?.email}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 font-bold text-blue-605 dark:text-blue-400 truncate max-w-[140px] hover:underline cursor-pointer">
                                                        {item.title}
                                                    </td>
                                                    <td className="py-3 text-[10.5px]">
                                                        {item.course?.title || 'Full Stack Development'}
                                                    </td>
                                                    <td className="py-3 font-medium text-slate-450 whitespace-nowrap">
                                                        {new Date(item.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-wider inline-block leading-none border ${item.status === 'APPROVED'
                                                            ? 'bg-green-50 text-green-705 border-green-100 dark:bg-green-950/20 dark:text-green-300 dark:border-green-909/30'
                                                            : item.status === 'REJECTED'
                                                                ? 'bg-red-50 text-red-750'
                                                                : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30'
                                                            }`}>
                                                            {item.status.toLowerCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        {item.status === 'PENDING' || item.status === 'SUBMITTED' || item.status === 'UNDER_REVIEW' ? (
                                                            <button
                                                                onClick={() => {
                                                                    setReviewingSubmission(item);
                                                                    setFeedbackInput(item.feedback || '');
                                                                }}
                                                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-black uppercase transition-all"
                                                            >
                                                                Review
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setReviewingSubmission(item);
                                                                    setFeedbackInput(item.feedback || '');
                                                                }}
                                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-black uppercase transition-all"
                                                            >
                                                                View
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {allSubmissions.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                                                        No submissions records found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right Area: Quick Actions Panel */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
                                <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                                    <Sparkles size={14} className="text-blue-500" />
                                    <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">Quick Actions</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                    <button onClick={() => alert('Announcement panel triggered')} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition text-center flex flex-col items-center justify-center space-y-2 cursor-pointer group">
                                        <Megaphone size={18} className="text-blue-600 group-hover:scale-110 transition" />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Add Announcement</span>
                                    </button>

                                    <button onClick={() => alert('Send email dialog triggered')} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition text-center flex flex-col items-center justify-center space-y-2 cursor-pointer group">
                                        <Mail size={18} className="text-purple-500 group-hover:scale-110 transition" />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Send Email</span>
                                    </button>

                                    <button onClick={() => alert('Add promo dialog')} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition text-center flex flex-col items-center justify-center space-y-2 cursor-pointer group">
                                        <LayoutDashboard size={18} className="text-amber-500 group-hover:scale-110 transition" />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Add Promo / Popup</span>
                                    </button>

                                    <button onClick={() => setActiveSubTab('courses-form')} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition text-center flex flex-col items-center justify-center space-y-2 cursor-pointer group">
                                        <PlusCircle size={18} className="text-teal-500 group-hover:scale-110 transition" />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Add New Domain</span>
                                    </button>

                                    <button onClick={() => alert('Create coupon')} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition text-center flex flex-col items-center justify-center space-y-2 cursor-pointer group">
                                        <Ticket size={18} className="text-rose-500 group-hover:scale-110 transition" />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Create Coupon</span>
                                    </button>

                                    <button onClick={() => alert('Export student list initiated')} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition text-center flex flex-col items-center justify-center space-y-2 cursor-pointer group">
                                        <Download size={18} className="text-slate-600 dark:text-slate-400 group-hover:scale-110 transition" />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Export Students</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => setActiveSubTab('approve-projects')}
                                    className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 flex items-center justify-center gap-1.5 shadow"
                                >
                                    <span>Explore All Features</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>

                        </div>
                    )}

                    {/* TAB: ADD COURSE / INTERNSHIP FORM */}
                    {activeSubTab === 'courses-form' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-8 shadow-sm w-full space-y-6">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                {editingCourseId ? 'Edit Configuration' : 'Add New Internship Blueprint'}
                            </h2>

                            <form onSubmit={handleCourseSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Title / Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition text-slate-850 dark:text-white"
                                            placeholder="e.g. Web Development Internship"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category Domain</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition text-slate-850 dark:text-white"
                                        >
                                            <option value="Web Development">Web Development</option>
                                            <option value="Programming">Programming</option>
                                            <option value="AI & Data">AI & Data</option>
                                            <option value="Cyber Security">Cyber Security</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Duration</label>
                                        <input
                                            type="text"
                                            required
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition text-slate-850 dark:text-white"
                                            placeholder="e.g. 3 Months"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Program Type</label>
                                        <select
                                            value={courseType}
                                            onChange={(e) => setCourseType(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition text-slate-850 dark:text-white"
                                        >
                                            <option value="COURSE">Standard Syllabus Course</option>
                                            <option value="INTERNSHIP">Task-Based Virtual Internship</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Skills (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={skillsCsv}
                                            onChange={(e) => setSkillsCsv(e.target.value)}
                                            className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition text-slate-855 dark:text-white"
                                            placeholder="React, TypeScript, Figma"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description Statement</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition text-slate-850 dark:text-white resize-none"
                                        placeholder="Outline course milestones..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow"
                                >
                                    {editingCourseId ? 'Save Changes' : 'Create Blueprints'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB: MANAGE COURSES */}
                    {activeSubTab === 'manage-courses' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Curriculum Programs</h2>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-b text-slate-400 uppercase">
                                                <th className="p-5">Title</th>
                                                <th className="p-5">Category</th>
                                                <th className="p-5">Type</th>
                                                <th className="p-5">Duration</th>
                                                <th className="p-5 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courses.map((course) => (
                                                <tr key={course.id} className="border-b hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-350">
                                                    <td className="p-5 font-bold text-slate-900 dark:text-white">{course.title}</td>
                                                    <td className="p-5">{course.category}</td>
                                                    <td className="p-5">{course.type}</td>
                                                    <td className="p-5">{course.duration}</td>
                                                    <td className="p-5 flex justify-center space-x-2 text-slate-400">
                                                        <button onClick={() => handleEditCourse(course)} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"><Edit3 size={15} /></button>
                                                        <button onClick={() => handleDeleteCourse(course.id)} className="p-2 hover:bg-red-55/20 hover:text-red-650 rounded-lg transition"><Trash2 size={15} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: EVALUATE TASK SUBMISSIONS */}
                    {activeSubTab === 'approve-projects' && (
                        <div className="space-y-6 w-full text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Task Submissions</h1>
                                    <p className="text-xs text-slate-400 font-semibold">
                                        Monitor, evaluate, and provide constructive feedback on task deliverables.
                                    </p>
                                </div>
                            </div>

                            {/* Filter controls tabs */}
                            <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                                {[
                                    { value: 'all', label: 'All Submissions', count: allSubmissions.length, color: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' },
                                    { value: 'PENDING', label: 'Pending Review', count: pendingReviewsCount, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                                    { value: 'APPROVED', label: 'Approved', count: allSubmissions.filter(s => s.status === 'APPROVED').length, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                                    { value: 'REJECTED', label: 'Rejected', count: rejectedSubmissionsCount, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-405' }
                                ].map(tab => (
                                    <button
                                        key={tab.value}
                                        onClick={() => setSubmissionFilter(tab.value as any)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${submissionFilter === tab.value
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${submissionFilter === tab.value ? 'bg-white/20 text-white' : tab.color}`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {(() => {
                                const filteredSubmissions = allSubmissions.filter(sub => {
                                    if (submissionFilter === 'all') return true;
                                    if (submissionFilter === 'PENDING') {
                                        return sub.status === 'SUBMITTED' || sub.status === 'PENDING' || sub.status === 'UNDER_REVIEW';
                                    }
                                    if (submissionFilter === 'APPROVED') {
                                        return sub.status === 'APPROVED';
                                    }
                                    if (submissionFilter === 'REJECTED') {
                                        return sub.status === 'REJECTED' || sub.status === 'RESUBMISSION_REQUIRED';
                                    }
                                    return true;
                                });

                                if (filteredSubmissions.length === 0) {
                                    return (
                                        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl text-center text-slate-400 text-xs border border-slate-200 dark:border-slate-800">
                                            No task submissions match this filter.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-3.5">
                                        {filteredSubmissions.map((sub) => {
                                            const isCalculator = sub.title.toLowerCase().includes('calculator');
                                            const linkText = isCalculator ? 'Screenshot' : 'GitHub';

                                            return (
                                                <div key={sub.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                                                            {sub.title}
                                                        </h3>
                                                        <p className="text-xs text-slate-450 font-medium">
                                                            {sub.student?.name} · {sub.enrollmentId} · {sub.course?.title || 'Virtual Internship'}
                                                        </p>
                                                        <a
                                                            href={sub.githubLink && sub.githubLink !== '#' ? sub.githubLink : 'https://github.com'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 mt-1 inline-flex"
                                                        >
                                                            <ExternalLink size={10} />
                                                            <span>{linkText}</span>
                                                        </a>
                                                        {sub.feedback && (
                                                            <p className="text-[10px] text-slate-450 bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded mt-1.5 italic w-fit">
                                                                Feedback: "{sub.feedback}"
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center space-x-3.5">
                                                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium leading-none uppercase tracking-wider ${sub.status === 'APPROVED'
                                                            ? 'bg-emerald-58/10 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/35'
                                                            : sub.status === 'REJECTED'
                                                                ? 'bg-rose-58/10 text-rose-605 border border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/35'
                                                                : 'bg-amber-58/10 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400'
                                                            }`}>
                                                            {sub.status.toLowerCase()}
                                                        </span>

                                                        <button
                                                            onClick={() => {
                                                                setReviewingSubmission(sub);
                                                                setFeedbackInput(sub.feedback || '');
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                                        >
                                                            Evaluate
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* TAB: INTERNSHIP APPLICATIONS */}
                    {activeSubTab === 'applications' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Internship Applications</h2>
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/40 rounded-full text-xs font-bold font-mono">
                                    Total: {allApplications.length}
                                </span>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-b text-slate-400 uppercase">
                                                <th className="p-5">Student</th>
                                                <th className="p-5">Domain</th>
                                                <th className="p-5">College & Branch</th>
                                                <th className="p-5">Date Joined</th>
                                                <th className="p-5">Status</th>
                                                <th className="p-5 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allApplications.map((app) => (
                                                <tr key={app.id} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-350">
                                                    <td className="p-5">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-150 text-blue-600 font-extrabold flex items-center justify-center text-[10px]">
                                                                {app.user.name ? app.user.name[0].toUpperCase() : 'S'}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-bold text-slate-900 dark:text-white leading-tight">
                                                                    {app.user.name}
                                                                </h5>
                                                                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium animate-pulse">
                                                                    {app.user.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 rounded border border-blue-100/50 dark:border-blue-900/30">
                                                            {app.course.title}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 font-medium max-w-[280px]">
                                                        <span className="block text-slate-800 dark:text-slate-200 font-bold truncate">
                                                            {app.college}
                                                        </span>
                                                        <span className="text-[10.5px] text-slate-400 block mt-0.5 truncate">
                                                            {app.branch}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-slate-500 font-medium whitespace-nowrap">
                                                        {new Date(app.joinedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-5">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider leading-none border inline-block ${app.status === 'ongoing' || app.status === 'enrolled'
                                                            ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/30'
                                                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <div className="flex justify-center items-center space-x-2 text-slate-400">
                                                            <button onClick={() => alert(`Viewing application files of ${app.user.name}`)} className="p-2 hover:bg-blue-200/50 dark:hover:bg-blue-950/30 hover:text-blue-600 rounded-lg transition" title="View Application Details">
                                                                <Eye size={15} />
                                                            </button>
                                                            <a href={`mailto:${app.user.email}`} className="p-2 hover:bg-purple-100/50 dark:hover:bg-purple-950/30 hover:text-purple-600 rounded-lg transition" title="Send Email Notification">
                                                                <Mail size={15} />
                                                            </a>
                                                            <button onClick={() => handleDeleteApplication(app.id, app.user.name)} className="p-2 hover:bg-red-100/50 dark:hover:bg-red-950/30 hover:text-red-650 rounded-lg transition" title="Delete Enrollment Record">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: ISSUED CREDENTIALS LOGS */}
                    {activeSubTab === 'certs-log' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Issued Credentials Log</h2>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-b text-slate-400 uppercase">
                                                <th className="p-5">Student</th>
                                                <th className="p-5">Domain</th>
                                                <th className="p-5">Certificate ID</th>
                                                <th className="p-5">Date Issued</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {certificates.map((cert) => (
                                                <tr key={cert.id} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-905 text-slate-700 dark:text-slate-350">
                                                    <td className="p-5 font-bold text-slate-900 dark:text-white">{cert.student?.name}</td>
                                                    <td className="p-5">{cert.courseName}</td>
                                                    <td className="p-5 font-mono text-blue-600 dark:text-blue-400">{cert.certificateNumber}</td>
                                                    <td className="p-5">{new Date(cert.issueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                </tr>
                                            ))}
                                            {certificates.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                                                        No issued certificates on record.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: VERIFICATION QUEUE */}
                    {activeSubTab === 'verification-queue' && (
                        <div className="space-y-6 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Document Verification Center</h2>
                                    <p className="text-xs text-slate-400 font-medium">Verify or revoke official internship offer letters and certificate registers.</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-705 dark:text-green-400 text-xs font-bold rounded-full">
                                        <ShieldCheck size={12} />
                                        <span>System Online</span>
                                    </span>
                                </div>
                            </div>

                            {/* Search inspector */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Verifiable Code Inspector</h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="Enter Certificate No or Offer Letter Token..."
                                        id="adminVerifyInput"
                                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        onClick={() => {
                                            const val = (document.getElementById('adminVerifyInput') as HTMLInputElement)?.value.trim();
                                            if (!val) return;
                                            if (val.startsWith('VINIX-OFFER-')) {
                                                window.open(`/verify/offer/${val}`, '_blank');
                                            } else {
                                                window.open(`/verify/${val}`, '_blank');
                                            }
                                        }}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
                                    >
                                        <ExternalLink size={13} />
                                        <span>Inspect Document</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Offer Letters list */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-955/35">
                                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <FileSpreadsheet className="text-blue-505" size={14} />
                                            <span>Active Offer Letters ({offerLetters.length})</span>
                                        </h4>
                                    </div>
                                    <div className="divide-y dark:divide-slate-800 overflow-y-auto max-h-[380px]">
                                        {offerLetters.map((letter) => (
                                            <div key={letter.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-850 dark:text-white">{letter.studentName}</h5>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{letter.internshipTitle} • {letter.duration}</p>
                                                    <p className="text-[9px] font-mono text-blue-600 dark:text-blue-400 mt-1 font-semibold">{letter.offerLetterId}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${letter.status === 'ACCEPTED'
                                                        ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800'
                                                        : letter.status === 'DECLINED'
                                                            ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-955/20 dark:text-red-300'
                                                            : 'bg-blue-50 text-blue-605 border-blue-100 dark:bg-blue-955/20 dark:text-blue-300'
                                                        }`}>
                                                        {letter.status}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/verify/offer/${letter.verificationToken || letter.offerLetterId}`);
                                                            alert('Link copied to clipboard!');
                                                        }}
                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                                                        title="Copy Verification Link"
                                                    >
                                                        <ExternalLink size={12} />
                                                    </button>
                                                    {letter.status !== 'EXPIRED' && (
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm(`Are you sure you want to revoke offer letter ${letter.offerLetterId}?`)) {
                                                                    try {
                                                                        const { error } = await supabase
                                                                            .from('offer_letters')
                                                                            .update({ status: 'EXPIRED' })
                                                                            .eq('id', letter.id);
                                                                        if (error) throw error;
                                                                        refreshData();
                                                                    } catch (err) {
                                                                        setOfferLetters(prev => prev.map(o => o.id === letter.id ? { ...o, status: 'EXPIRED' } : o));
                                                                    }
                                                                }
                                                            }}
                                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-955/35 text-red-505 rounded"
                                                            title="Revoke Offer"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {offerLetters.length === 0 && (
                                            <div className="p-8 text-center text-slate-400 text-xs font-medium">No offer letters generated yet. Mapped automatically on program enrollment.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Certificates list */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
                                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <Award className="text-blue-500" size={14} />
                                            <span>Active Certificates ({certificates.length})</span>
                                        </h4>
                                    </div>
                                    <div className="divide-y dark:divide-slate-800 overflow-y-auto max-h-[380px]">
                                        {certificates.map((cert) => (
                                            <div key={cert.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-850 dark:text-white">{cert.student?.name}</h5>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{cert.courseName}</p>
                                                    <p className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{cert.certificateNumber}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/verify/${cert.certificateNumber}`);
                                                            alert('Link copied to clipboard!');
                                                        }}
                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                                                        title="Copy Verification Link"
                                                    >
                                                        <ExternalLink size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(`/verify/${cert.certificateNumber}`, '_blank')}
                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                                                        title="View LIVE Certificate"
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {certificates.length === 0 && (
                                            <div className="p-8 text-center text-slate-400 text-xs font-medium">No certificates registered yet. Approve submissions to generate them.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: STUDENTS */}
                    {activeSubTab === 'students' && (
                        <div className="space-y-6 text-left">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Registered Graduates Directory</h2>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-b text-slate-400 uppercase">
                                                <th className="p-5">Student</th>
                                                <th className="p-5">University & Profile</th>
                                                <th className="p-5">Primary Skills Mapped</th>
                                                <th className="p-5 text-center">Active Internships</th>
                                                <th className="p-5 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from(new Set(allApplications.map(a => a.user.email))).map(email => {
                                                const studentApps = allApplications.filter(a => a.user.email === email);
                                                const rep = studentApps[0];
                                                const repSkills = (rep.user as any).skills && (rep.user as any).skills.length > 0 ? (rep.user as any).skills : ['HTML/CSS', 'Javascript', 'React'];
                                                return (
                                                    <tr key={email} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-350">
                                                        <td className="p-5">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-606 dark:bg-blue-900/30 dark:text-blue-300 font-extrabold flex items-center justify-center text-[10px]">
                                                                    {rep.user.name ? rep.user.name[0].toUpperCase() : 'G'}
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-bold text-slate-900 dark:text-white leading-tight">
                                                                        {rep.user.name}
                                                                    </h5>
                                                                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                                                                        {rep.user.email}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-5">
                                                            <span className="block font-bold text-slate-805 dark:text-slate-205">{rep.college}</span>
                                                            <span className="text-[10px] text-slate-400 block mt-0.5">{rep.branch}</span>
                                                        </td>
                                                        <td className="p-5">
                                                            <div className="flex flex-wrap gap-1">
                                                                {repSkills.map((sk: string) => (
                                                                    <span key={sk} className="px-2 py-0.5 bg-slate-101 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9px] font-bold">
                                                                        {sk}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="p-5 text-center font-bold text-slate-900 dark:text-white text-xs">
                                                            {studentApps.length}
                                                        </td>
                                                        <td className="p-5 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                <a href={`mailto:${email}`} className="p-2 hover:bg-purple-100/50 dark:hover:bg-purple-950/30 hover:text-purple-600 rounded-lg transition" title="Direct Email Support">
                                                                    <Mail size={14} />
                                                                </a>
                                                                <button onClick={() => alert(`Showing log details for ${rep.user.name}`)} className="p-2 hover:bg-blue-100/50 dark:hover:bg-blue-955/35 hover:text-blue-500 rounded-lg transition" title="Profile Details">
                                                                    <Eye size={14} />
                                                                </button>
                                                            </div>
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

                    {/* TAB: PAYMENTS */}
                    {activeSubTab === 'payments' && (
                        <div className="space-y-6 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Billing Ledger & Invoices</h2>
                                    <p className="text-xs text-slate-400 font-medium">Overview of program revenues, custom sponsorships, and individual registration fees.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Total Revenues</span>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹24,995</h3>
                                    </div>
                                    <div className="p-3.5 bg-green-500/10 text-green-605 rounded-2xl">
                                        <FileSpreadsheet size={20} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-205 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Completed Invoices</span>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">5</h3>
                                    </div>
                                    <div className="p-3.5 bg-blue-500/10 text-blue-600 rounded-2xl">
                                        <ShieldCheck size={20} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-205 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Pending Clearances</span>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹0</h3>
                                    </div>
                                    <div className="p-3.5 bg-amber-505/10 text-amber-600 rounded-2xl">
                                        <Sparkles size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-b text-slate-400 uppercase">
                                                <th className="p-5">Invoice ID</th>
                                                <th className="p-5">Reference Graduate</th>
                                                <th className="p-5">Internship Domain</th>
                                                <th className="p-5 text-right">Fee Transferred</th>
                                                <th className="p-5">Date Cleared</th>
                                                <th className="p-5">State</th>
                                                <th className="p-5 text-center">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((p) => (
                                                <tr key={p.id} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-350">
                                                    <td className="p-5 font-mono font-bold text-slate-900 dark:text-white">{p.id}</td>
                                                    <td className="p-5 font-semibold text-slate-850 dark:text-white">{p.studentName}</td>
                                                    <td className="p-5 font-medium">{p.program}</td>
                                                    <td className="p-5 text-right font-extrabold text-slate-905 dark:text-white">{p.amount}</td>
                                                    <td className="p-5 font-medium">{new Date(p.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                    <td className="p-5">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border inline-block ${p.status === 'PAID'
                                                            ? 'bg-green-55 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-300'
                                                            : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-955/20'
                                                            }`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <button onClick={() => alert(`Receipt downloaded for ${p.id}`)} className="p-1.5 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Download Transaction Receipt">
                                                            <Download size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PROMOTIONS */}
                    {activeSubTab === 'promotions' && (
                        <div className="space-y-6 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Promotional Discount Coupons</h2>
                                    <p className="text-xs text-slate-400 font-medium">Issue or expire dynamic curriculum program registration discounts.</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Coupon Generator</h3>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!newPromoCode.trim()) return;
                                    setPromoCodes(prev => [
                                        ...prev,
                                        { code: newPromoCode.trim().toUpperCase(), discount: newPromoDiscount, status: 'ACTIVE', uses: 0, expiry: '2026-12-31' }
                                    ]);
                                    setNewPromoCode('');
                                    alert('New promotion code successfully issued!');
                                }} className="flex flex-col sm:flex-row gap-3 items-end">
                                    <div className="flex-1 space-y-1 text-left">
                                        <label className="text-[10px] font-bold text-slate-400">Promo Code</label>
                                        <input
                                            type="text"
                                            required
                                            value={newPromoCode}
                                            onChange={(e) => setNewPromoCode(e.target.value)}
                                            placeholder="e.g. AUTUMN2026"
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="w-full sm:w-40 space-y-1 text-left">
                                        <label className="text-[10px] font-bold text-slate-400">Discount Description</label>
                                        <input
                                            type="text"
                                            required
                                            value={newPromoDiscount}
                                            onChange={(e) => setNewPromoDiscount(e.target.value)}
                                            placeholder="e.g. 20% or ₹1000 Off"
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 w-full sm:w-auto"
                                    >
                                        <Ticket size={14} />
                                        <span>Issue Coupon</span>
                                    </button>
                                </form>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-b text-slate-400 uppercase">
                                                <th className="p-5">Promo Code</th>
                                                <th className="p-5">Discount Offered</th>
                                                <th className="p-5">Valid Expiry</th>
                                                <th className="p-5 text-center">Total Redemptions</th>
                                                <th className="p-5">State</th>
                                                <th className="p-5 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {promoCodes.map((c) => (
                                                <tr key={c.code} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-350">
                                                    <td className="p-5 font-bold font-mono text-slate-905 dark:text-white">{c.code}</td>
                                                    <td className="p-5 font-semibold text-blue-600 dark:text-blue-400">{c.discount}</td>
                                                    <td className="p-5">{new Date(c.expiry).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                    <td className="p-5 text-center font-bold">{c.uses}</td>
                                                    <td className="p-5">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border inline-block ${c.status === 'ACTIVE'
                                                            ? 'bg-green-50 text-green-700 border-green-150'
                                                            : 'bg-red-50 text-red-650 border-red-155'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        {c.status === 'ACTIVE' ? (
                                                            <button
                                                                onClick={() => {
                                                                    setPromoCodes(prev => prev.map(item => item.code === c.code ? { ...item, status: 'EXPIRED' } : item));
                                                                    alert(`Promo code ${c.code} has been declared EXPIRED.`);
                                                                }}
                                                                className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-[9px] font-black hover:bg-red-100"
                                                            >
                                                                Expire
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 font-semibold select-none">No Action</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PROMO POPUP */}
                    {activeSubTab === 'promo-popup' && (
                        <div className="space-y-6 text-left">
                            <div>
                                <h2 className="text-xl font-black text-[#1e293b] dark:text-white uppercase tracking-wider">Master Website Promo Popup</h2>
                                <p className="text-xs text-slate-405 font-medium">Control the marketing flash banner popup shown to visiting visitors on the Vinix Homepage.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-202 dark:border-slate-800 shadow-sm space-y-5 text-left">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Settings Panel</h3>

                                    <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                                        <div>
                                            <h5 className="text-xs font-black text-slate-900 dark:text-white">Active Status</h5>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Toggle visibility of popup to homepage visitors</p>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={promoPopup.isActive}
                                                onChange={(e) => setPromoPopup(prev => ({ ...prev, isActive: e.target.checked }))}
                                                className="w-10 h-5 bg-slate-200 border-none rounded-full cursor-pointer focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 block">Banner Headline Text</label>
                                        <input
                                            type="text"
                                            value={promoPopup.headline}
                                            onChange={(e) => setPromoPopup(prev => ({ ...prev, headline: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 block">Redirect URL Link</label>
                                        <input
                                            type="text"
                                            value={promoPopup.redirectUrl}
                                            onChange={(e) => setPromoPopup(prev => ({ ...prev, redirectUrl: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-808 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 block">Button Call to Action</label>
                                        <input
                                            type="text"
                                            value={promoPopup.buttonText}
                                            onChange={(e) => setPromoPopup(prev => ({ ...prev, buttonText: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <button onClick={() => alert('Website Popup Details saved to database sync registry!')} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition">
                                        Save Popup Configs
                                    </button>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col justify-center items-center">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4 select-none">Live Screen Preview</span>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 max-w-sm rounded-[24px] overflow-hidden shadow-2xl p-6 text-left relative space-y-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto">
                                            <Megaphone size={20} />
                                        </div>
                                        <div className="text-center space-y-1.5">
                                            <h4 className="text-xs font-bold text-slate-850 dark:text-white">Special Announcement</h4>
                                            <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{promoPopup.headline}</p>
                                        </div>
                                        <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold transition shadow-md shadow-blue-500/10">
                                            {promoPopup.buttonText}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: EMAIL LOGS */}
                    {activeSubTab === 'email-logs' && (
                        <div className="space-y-6 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-[#1e293b] dark:text-white uppercase tracking-wider">System Communication Logs</h2>
                                    <p className="text-xs text-slate-400 font-medium">Audit logs of automated offer letter and certificate distribution notifications.</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-b text-slate-400 uppercase">
                                                <th className="p-5">Recipient Details</th>
                                                <th className="p-5 font-center">Document Type</th>
                                                <th className="p-5">Subject Header</th>
                                                <th className="p-5 font-mono text-center">Ref ID</th>
                                                <th className="p-5">Delivery Time</th>
                                                <th className="p-5">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {emailLogs.map((log) => (
                                                <tr key={log.id} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-350 text-left">
                                                    <td className="p-5">
                                                        <div className="font-bold text-slate-905 dark:text-white leading-tight">{log.studentName}</div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">{log.emailTo}</div>
                                                    </td>
                                                    <td className="p-5">
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9px] font-bold uppercase">
                                                            {log.documentType.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 font-medium">{log.subject}</td>
                                                    <td className="p-5 font-mono text-center text-blue-600 dark:text-blue-400">{log.referenceId}</td>
                                                    <td className="p-5 font-medium">{log.sentAt ? new Date(log.sentAt).toLocaleString('en-US') : 'N/A'}</td>
                                                    <td className="p-5">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border inline-block ${log.status === 'sent'
                                                            ? 'bg-green-55 text-green-700 border-green-150'
                                                            : 'bg-amber-50 text-amber-600 border-amber-150'
                                                            }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {emailLogs.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="p-6 text-center text-slate-400 font-semibold text-xs">
                                                        No transaction email logs found in current database registry.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: ANALYTICS */}
                    {activeSubTab === 'analytics' && (
                        <div className="space-y-6 text-left">
                            <h2 className="text-xl font-black text-slate-909 dark:text-white uppercase tracking-wider">Vinix Intelligence & Insights</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Admissions</span>
                                    <div className="flex items-baseline space-x-2 mt-2">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">88%</h3>
                                        <span className="text-[10px] text-green-500 font-black">+4.1% MoM</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full mt-4 overflow-hidden">
                                        <div className="bg-blue-600 h-full rounded-full" style={{ width: '88%' }}></div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-202 dark:border-slate-800 shadow-sm">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Certificate Issue Conversion</span>
                                    <div className="flex items-baseline space-x-2 mt-2">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">94%</h3>
                                        <span className="text-[10px] text-green-500 font-black">Stable</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-955 h-1.5 rounded-full mt-4 overflow-hidden">
                                        <div className="bg-green-600 h-full rounded-full" style={{ width: '94%' }}></div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-202 dark:border-slate-800 shadow-sm">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg. Task Success Rate</span>
                                    <div className="flex items-baseline space-x-2 mt-2">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">76%</h3>
                                        <span className="text-[10px] text-red-500 font-black">-0.6% MoM</span>
                                    </div>
                                    <div className="w-full bg-slate-101 dark:bg-slate-950 h-1.5 rounded-full mt-4 overflow-hidden">
                                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '76%' }}></div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-202 dark:border-slate-800 shadow-sm">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Engagement</span>
                                    <div className="flex items-baseline space-x-2 mt-2">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">92.4%</h3>
                                        <span className="text-[10px] text-green-500 font-black">+2.4% MoM</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full mt-4 overflow-hidden">
                                        <div className="bg-indigo-650 h-full rounded-full" style={{ width: '92.4%' }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Internship Domain Distribution</h3>
                                    <div className="space-y-3.5">
                                        {[
                                            { name: 'MERN Stack Development', count: 18, pct: 45, color: 'bg-blue-600' },
                                            { name: 'Python Development', count: 12, pct: 30, color: 'bg-emerald-500' },
                                            { name: 'Java Development', count: 6, pct: 15, color: 'bg-amber-500' },
                                            { name: 'UI/UX Design & Research', count: 4, pct: 10, color: 'bg-purple-500' }
                                        ].map(item => (
                                            <div key={item.name} className="space-y-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-750 dark:text-slate-205">{item.name}</span>
                                                    <span className="font-semibold text-slate-400">{item.count} Active ({item.pct}%)</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Total Program Stats</h4>
                                    <div className="divide-y dark:divide-slate-800 flex-1 flex flex-col justify-around">
                                        <div className="py-2.5 flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Graduate Placement Status</span>
                                            <span className="font-black text-green-600">84% Placed</span>
                                        </div>
                                        <div className="py-2.5 flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Program Success Rating</span>
                                            <span className="font-black text-blue-600">4.8 / 5.0</span>
                                        </div>
                                        <div className="py-2.5 flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Corporate Partners</span>
                                            <span className="font-black text-slate-850 dark:text-white">12 Verified</span>
                                        </div>
                                    </div>
                                    <button onClick={() => alert('Exporting full analytics summary report PDF!')} className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 text-xs font-bold rounded-xl transition">
                                        Export Analytics Digest
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>

            {/* Evaluate/Review Modal */}
            {reviewingSubmission && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in scale-in duration-200 flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                            <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Evaluate Submission</span>
                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight mt-0.5">{reviewingSubmission.title}</h3>
                            </div>
                            <button
                                onClick={() => setReviewingSubmission(null)}
                                className="p-2 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-655 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                            {/* Student Metadata Card */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-450 font-semibold text-left">Student Name:</span>
                                    <span className="font-extrabold text-slate-850 dark:text-white text-right">{reviewingSubmission.student?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-455 font-semibold text-left">Email Identifier:</span>
                                    <span className="font-medium text-slate-500 text-right">{reviewingSubmission.student?.email}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-450 font-semibold text-left">Enrollment Reference:</span>
                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-right">{reviewingSubmission.enrollmentId}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-450 font-semibold text-left">Internship Title:</span>
                                    <span className="font-bold text-slate-705 dark:text-slate-350 text-right">{reviewingSubmission.course?.title}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-450 font-semibold text-left">Submitted On:</span>
                                    <span className="font-medium text-slate-600 dark:text-slate-400 text-right">
                                        {new Date(reviewingSubmission.submittedAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {/* Code details */}
                            <div className="space-y-1 text-left">
                                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Submission URL / Link</label>
                                <a
                                    href={reviewingSubmission.githubLink && reviewingSubmission.githubLink !== '#' ? reviewingSubmission.githubLink : 'https://github.com'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline truncate flex items-center justify-between"
                                >
                                    <span className="truncate">{reviewingSubmission.githubLink || 'http://github.com'}</span>
                                    <ExternalLink size={13} className="flex-shrink-0" />
                                </a>
                            </div>

                            <div className="space-y-1 text-left">
                                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Student Description Notes</label>
                                <p className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-300 italic min-h-[60px]">
                                    {reviewingSubmission.description || 'No description notes provided by the student.'}
                                </p>
                            </div>

                            {/* Evaluation feedback */}
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Evaluation Review Feedback</label>
                                <textarea
                                    rows={3}
                                    value={feedbackInput}
                                    onChange={(e) => setFeedbackInput(e.target.value)}
                                    placeholder="Provide detailed instruction, critique, or encouraging feedback to the student..."
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal control actions */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-955 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-3">
                            <span className="text-[9px] uppercase font-black text-slate-400">Status Flow Decision</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        try {
                                            const finalFeedback = feedbackInput.trim() || 'Requires review, please refine.';
                                            if (reviewingSubmission.id.startsWith('mocksub-')) {
                                                alert('Action disabled for mock student submissions records.');
                                                setReviewingSubmission(null);
                                                return;
                                            }
                                            const { data: { user: adminUser } } = await supabase.auth.getUser();
                                            const { error } = await supabase
                                                .from('task_progress')
                                                .update({
                                                    status: 'rejected',
                                                    admin_feedback: finalFeedback,
                                                    reviewed_at: new Date().toISOString(),
                                                    reviewed_by: adminUser?.id
                                                })
                                                .eq('id', reviewingSubmission.id);

                                            if (error) throw error;
                                            alert('Task submission reviewed and REJECTED successfully.');
                                            refreshData();
                                            setReviewingSubmission(null);
                                        } catch (error: any) {
                                            alert('Failed to evaluate project submission: ' + error.message);
                                        }
                                    }}
                                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                >
                                    Reject / Revise
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const finalFeedback = feedbackInput.trim() || 'Excellent work. Approved!';
                                            if (reviewingSubmission.id.startsWith('mocksub-')) {
                                                alert('Action disabled for mock student submissions records.');
                                                setReviewingSubmission(null);
                                                return;
                                            }
                                            const { data: { user: adminUser } } = await supabase.auth.getUser();
                                            const { error } = await supabase
                                                .from('task_progress')
                                                .update({
                                                    status: 'approved',
                                                    admin_feedback: finalFeedback,
                                                    reviewed_at: new Date().toISOString(),
                                                    reviewed_by: adminUser?.id
                                                })
                                                .eq('id', reviewingSubmission.id);

                                            if (error) throw error;

                                            // Fetch data for next task unlocking/completion/certificates
                                            const { data: currentProg } = await supabase
                                                .from('task_progress')
                                                .select('*')
                                                .eq('id', reviewingSubmission.id)
                                                .single();

                                            if (currentProg) {
                                                // Load task details to get its task number
                                                const { data: currentTask } = await supabase
                                                    .from('internship_tasks')
                                                    .select('*')
                                                    .eq('id', currentProg.task_id)
                                                    .single();

                                                if (currentTask) {
                                                    const nextTaskNum = currentTask.task_number + 1;
                                                    const { data: nextTask } = await supabase
                                                        .from('internship_tasks')
                                                        .select('*')
                                                        .eq('internship_id', currentProg.internship_id)
                                                        .eq('task_number', nextTaskNum)
                                                        .single();

                                                    if (nextTask) {
                                                        // Unlock the next task as 'available'
                                                        await supabase
                                                            .from('task_progress')
                                                            .upsert({
                                                                user_id: currentProg.user_id,
                                                                internship_id: currentProg.internship_id,
                                                                task_id: nextTask.id,
                                                                status: 'available'
                                                            }, {
                                                                onConflict: 'user_id,task_id'
                                                            });
                                                    } else {
                                                        // No more tasks! Completed!
                                                        await supabase
                                                            .from('internship_enrollments')
                                                            .update({ status: 'completed' })
                                                            .eq('user_id', currentProg.user_id)
                                                            .eq('internship_id', currentProg.internship_id);

                                                        // Generate certificate
                                                        const certNo = `VINIX-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                                                        const { data: internshipRecord } = await supabase
                                                            .from('internships')
                                                            .select('title')
                                                            .eq('id', currentProg.internship_id)
                                                            .single();

                                                        await supabase
                                                            .from('certificates')
                                                            .insert({
                                                                course_id: currentProg.internship_id,
                                                                user_id: currentProg.user_id,
                                                                certificate_number: certNo,
                                                                course_name: internshipRecord?.title || 'Virtual Internship',
                                                                status: 'ACTIVE'
                                                            });
                                                    }
                                                }
                                            }

                                            alert('Task submission reviewed and APPROVED successfully.');
                                            refreshData();
                                            setReviewingSubmission(null);
                                        } catch (error: any) {
                                            alert('Failed to evaluate project submission: ' + error.message);
                                        }
                                    }}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                >
                                    Approve Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPortal;
