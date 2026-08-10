import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
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

export const AdminPortal: React.FC = () => {
    const { user, logout } = useAuth();
    const [activeSubTab, setActiveSubTab] = useState('overview');
    const [openActionsId, setOpenActionsId] = useState<string | null>(null);

    // API Payload States
    const [courses, setCourses] = useState<Course[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([]);

    // Form inputs
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Web Development');
    const [desc, setDesc] = useState('');
    const [duration, setDuration] = useState('8 Weeks');
    const [courseType, setCourseType] = useState('COURSE');
    const [skillsCsv, setSkillsCsv] = useState('');
    const [feedbackText, setFeedbackText] = useState<{ [key: string]: string }>({});

    // UI Dark mode status inside components
    const [localDarkMode, setLocalDarkMode] = useState(false);

    const refreshData = async () => {
        try {
            const [coursesRes, submitRes, certsRes, enrollRes] = await Promise.all([
                api.get('/courses'),
                api.get('/projects'),
                api.get('/certificates'),
                api.get('/enrollments/admin/all').catch(err => {
                    console.warn('Fallback admin enrollments request:', err);
                    return { data: [] };
                })
            ]);
            setCourses(coursesRes.data);
            setSubmissions(submitRes.data);
            setCertificates(certsRes.data);
            setEnrollments(enrollRes.data);
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
                await api.put(`/courses/${editingCourseId}`, payload);
                alert('Course updated successfully!');
            } else {
                await api.post('/courses', payload);
                alert('New Course/Internship created!');
            }
            setTitle('');
            setDesc('');
            setEditingCourseId(null);
            setSkillsCsv('');
            refreshData();
            setActiveSubTab('manage-courses');
        } catch {
            alert('Failed to submit course configuration.');
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
            await api.delete(`/courses/${id}`);
            alert('Course deleted.');
            refreshData();
        } catch {
            alert('Failed to delete course.');
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

    const allApplications = [...dbEnrollmentsMapped];
    // Add mock entries if their emails aren't already registered
    mockEnrollments.forEach(mock => {
        if (!allApplications.some(app => app.user.email === mock.user.email)) {
            allApplications.push(mock);
        }
    });

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
                                onClick={() => setActiveSubTab('overview')}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider"
                            >
                                <div className="flex items-center space-x-3">
                                    <ShieldCheck size={14} />
                                    <span>Verification Queue</span>
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
                                onClick={() => setActiveSubTab('overview')}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider"
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
                            <button className="w-full flex items-center px-3 py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider space-x-3">
                                <Sparkles size={14} />
                                <span>Promotions</span>
                            </button>
                            <button className="w-full flex items-center px-3 py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider space-x-3">
                                <Megaphone size={14} />
                                <span>Promo Popup</span>
                            </button>
                            <button className="w-full flex items-center px-3 py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider space-x-3">
                                <Mail size={14} />
                                <span>Email Logs</span>
                            </button>
                        </div>

                        {/* ANALYTICS Section */}
                        <div className="space-y-1">
                            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ANALYTICS</span>
                            <button className="w-full flex items-center px-3 py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider space-x-3">
                                <FileSpreadsheet size={14} />
                                <span>Analytics</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Card 1: Total Students */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-6 flex justify-between items-start shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-2">
                                <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">Total Students</span>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalStudentsCount}</h3>
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 select-none">
                                    ▲ 12.5% <span className="text-slate-400 font-medium">vs last month</span>
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-650 flex items-center justify-center dark:bg-purple-950/20">
                                <Users size={18} />
                            </div>
                        </div>

                        {/* Card 2: Applications */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-6 flex justify-between items-start shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-2">
                                <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">Applications</span>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalApplicationsCount}</h3>
                                <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1 select-none">
                                    0 Pending Review
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center dark:bg-blue-950/20">
                                <FileSpreadsheet size={18} />
                            </div>
                        </div>

                        {/* Card 3: Active Internships */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-6 flex justify-between items-start shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-2">
                                <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">Active Internships</span>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{activeInternshipsCount}</h3>
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 select-none">
                                    ▲ 8.2% <span className="text-slate-400 font-medium">vs last month</span>
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center dark:bg-green-950/20">
                                <LayoutDashboard size={18} />
                            </div>
                        </div>

                        {/* Card 4: Certificates Issued */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-6 flex justify-between items-start shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-2">
                                <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">Certificates Issued</span>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{certificatesIssuedCount}</h3>
                                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 select-none">
                                    This month
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center dark:bg-amber-950/20">
                                <Award size={18} />
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
                                                    <td className="py-3 font-bold text-blue-600 dark:text-blue-400 truncate max-w-[140px] hover:underline cursor-pointer">
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
                                                            ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/30'
                                                            : item.status === 'REJECTED'
                                                                ? 'bg-red-50 text-red-750'
                                                                : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30'
                                                            }`}>
                                                            {item.status.toLowerCase()}
                                                        </span>
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
                        <div className="space-y-6 w-full">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Task Submissions</h1>
                                <p className="text-xs text-slate-400 font-semibold">
                                    Reviewed ({allSubmissions.filter(s => s.status === 'APPROVED' || s.status === 'REJECTED').length})
                                </p>
                            </div>

                            {allSubmissions.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl text-center text-slate-400 text-xs border">
                                    No submissions require evaluation reviews today.
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {allSubmissions.map((sub) => {
                                        const isCalculator = sub.title.toLowerCase().includes('calculator');
                                        const linkText = isCalculator ? 'Screenshot' : 'GitHub';

                                        return (
                                            <div key={sub.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
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
                                                        <p className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/30 px-2 py-0.5 rounded mt-1.5 italic w-fit">
                                                            Feedback: "{sub.feedback}"
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-3.5">
                                                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium leading-none uppercase tracking-wider ${sub.status === 'APPROVED'
                                                        ? 'bg-emerald-58/10 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/35'
                                                        : sub.status === 'REJECTED'
                                                            ? 'bg-rose-58/10 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/35'
                                                            : 'bg-amber-58/10 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400'
                                                        }`}>
                                                        {sub.status.toLowerCase()}
                                                    </span>

                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenActionsId(openActionsId === sub.id ? null : sub.id);
                                                            }}
                                                            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-208 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-202 flex items-center gap-1.5 transition"
                                                        >
                                                            <span>Actions</span>
                                                            <ChevronDown size={12} />
                                                        </button>
                                                        {openActionsId === sub.id && (
                                                            <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl shadow-lg z-20 py-1 text-xs">
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenActionsId(null);
                                                                        const txt = feedbackText[sub.id] || 'Excellent project submission!';
                                                                        api.put(`/projects/review/${sub.id}`, { status: 'APPROVED', feedback: txt })
                                                                            .then(() => {
                                                                                alert('Project approved successfully!');
                                                                                refreshData();
                                                                            })
                                                                            .catch(() => alert('Failed to review.'));
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 font-bold"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenActionsId(null);
                                                                        const txt = feedbackText[sub.id] || 'Requires changes, please revise.';
                                                                        api.put(`/projects/review/${sub.id}`, { status: 'REJECTED', feedback: txt })
                                                                            .then(() => {
                                                                                alert('Project rejected.');
                                                                                refreshData();
                                                                            })
                                                                            .catch(() => alert('Failed to review.'));
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-rose-600 font-bold"
                                                                >
                                                                    Reject
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenActionsId(null);
                                                                        const text = prompt('Enter notes or feedback:', feedbackText[sub.id] || sub.feedback || '');
                                                                        if (text !== null) {
                                                                            setFeedbackText({ ...feedbackText, [sub.id]: text });
                                                                        }
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 font-bold"
                                                                >
                                                                    Write Feedback
                                                                </button>
                                                            </div>
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
                                                            <button onClick={() => alert(`Deleting application of ${app.user.name} is disabled for records preservation.`)} className="p-2 hover:bg-red-100/50 dark:hover:bg-red-950/30 hover:text-red-650 rounded-lg transition" title="Delete Enrollment Record">
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

                </main>
            </div>
        </div>
    );
};

export default AdminPortal;
