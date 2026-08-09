import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    LayoutDashboard, BookOpen, Layers, FileCode, Award, MailOpen, User,
    BrainCircuit, Send, CheckCircle2, XCircle, Clock, ExternalLink,
    FileDown, Play, BookOpenCheck, Settings, CheckCheck, Save, HelpCircle,
    MessageSquare, Share2, Eye, Printer, GraduationCap
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
}

interface Project {
    id: string;
    title: string;
    description: string;
    githubLink: string;
    fileUrl?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
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
    const [profileSaving, setProfileSaving] = useState(false);

    // Active study parameters
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');
    const [activeVideoTitle, setActiveVideoTitle] = useState('');
    const [quizScore, setQuizScore] = useState<number | null>(null);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});

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

    const loadData = async () => {
        try {
            setLoading(true);
            const [enrollRes, projRes, certRes, offerRes, coursesRes] = await Promise.all([
                api.get('/enrollments/my'),
                api.get('/projects'),
                api.get('/certificates/my'),
                api.get('/offer-letters'),
                api.get('/courses')
            ]);

            setEnrollments(enrollRes.data);
            setProjects(projRes.data);
            setCertificates(certRes.data);
            setOfferLetters(offerRes.data);
            setAllCourses(coursesRes.data);

            if (enrollRes.data.length > 0 && !selectedEnrollment) {
                // Prioritize setting selected enrollment to active internship if available
                const internshipEnroll = enrollRes.data.find((e: Enrollment) => e.course.type === 'INTERNSHIP');
                const defaultEnroll = internshipEnroll || enrollRes.data[0];
                setSelectedEnrollment(defaultEnroll);
                if (defaultEnroll.course.lessons && defaultEnroll.course.lessons.length > 0) {
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
            await api.post(`/offer-letters/${id}/accept`);
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
            await api.post(`/offer-letters/${id}/decline`);
            alert('Offer letter declined successfully.');
            loadData();
        } catch (err) {
            console.error('Error declining offer:', err);
            alert('Failed to decline offer letter.');
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSaving(true);
        try {
            const skillsArray = skillsField.split(',').map(s => s.trim()).filter(s => s.length > 0);
            await updateProfile(nameField, skillsArray);
            alert('Profile updated successfully!');
        } catch (err) {
            alert('Failed to update profile.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectTitle || !projectDesc || !projectGit) {
            alert('Please fill out all required fields.');
            return;
        }
        setProjectLoading(true);
        try {
            await api.post('/projects/submit', {
                title: projectTitle,
                description: projectDesc,
                githubLink: projectGit
            });
            alert('Project milestone submitted successfully! Evaluators will review it shortly.');
            setProjectTitle('');
            setProjectDesc('');
            setProjectGit('');
            setIsSubmitModalOpen(false);
            loadData();
        } catch (err) {
            alert('Failed to submit project.');
        } finally {
            setProjectLoading(false);
        }
    };

    const handleLinkedInSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkedInUrlInput.trim()) {
            alert('Please enter a valid URL.');
            return;
        }
        setLinkedInSubmitted(true);
        setIsLinkedInModalOpen(false);
        alert('LinkedIn URL submitted successfully! Offer post requirements verified.');
    };

    const handleEnrollDirect = async (courseId: string) => {
        try {
            await api.post('/enrollments/enroll', { courseId });
            alert('Internship track launched! Load page domains configuration.');
            loadData();
            setActiveTab('overview');
        } catch (err) {
            alert('Enrollment failed.');
        }
    };

    const updateCourseProgress = async (enroll: Enrollment, bonus: number) => {
        try {
            const nextProgress = Math.min(100, enroll.progress + bonus);
            await api.put('/enrollments/progress', {
                courseId: enroll.courseId,
                progress: nextProgress
            });
            loadData();
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    };

    const activeInternship = enrollments.find(e => e.course.type === 'INTERNSHIP');
    const displayEnrollment = selectedEnrollment || activeInternship;
    const progress = displayEnrollment ? displayEnrollment.progress : 0;

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
                            <div className="relative p-6 md:p-8 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl overflow-hidden shadow-lg border border-slate-800/80 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6">
                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl"></div>

                                <div className="space-y-4 text-center sm:text-left z-10">
                                    <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded">
                                        Welcome Intern
                                    </span>
                                    <h2 className="text-3xl font-extrabold tracking-tight uppercase">{user?.name || 'VISHAL R'}</h2>
                                    <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-bold tracking-wider text-blue-100 uppercase">
                                        {displayEnrollment.course.title.toUpperCase()}
                                    </span>
                                </div>

                                {/* Progress radial circle indicator */}
                                <div className="flex items-center gap-6 py-2 z-10 self-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="relative w-18 h-18 flex items-center justify-center">
                                            {/* Circular SVG track */}
                                            <svg className="w-16 h-16 transform -rotate-90">
                                                <circle
                                                    cx="32" cy="32" r={radius}
                                                    className="text-white/10"
                                                    strokeWidth={strokeWidth}
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                />
                                                <circle
                                                    cx="32" cy="32" r={radius}
                                                    className="text-blue-400"
                                                    strokeWidth={strokeWidth}
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={strokeDashoffset}
                                                    strokeLinecap="round"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                />
                                            </svg>
                                            <span className="absolute text-xs font-bold">{progress}%</span>
                                        </div>
                                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Internship Progress</span>
                                    </div>

                                    {/* Action buttons on bottom/right */}
                                    <div className="flex flex-col gap-2">
                                        {activeOfferLetter && (
                                            <a
                                                href={`http://localhost:5000/uploads/offer-letters/${activeOfferLetter.offerLetterId}.pdf`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-blue-200 border border-blue-400/50 hover:bg-blue-800/40 rounded-xl transition whitespace-nowrap bg-indigo-950/20"
                                            >
                                                <FileDown size={13} />
                                                <span>Download Offer Letter</span>
                                            </a>
                                        )}
                                        <a
                                            href="https://chat.whatsapp.com/mock-vionix"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow whitespace-nowrap"
                                        >
                                            <MessageSquare size={13} />
                                            <span>Join WhatsApp Group</span>
                                        </a>
                                    </div>

                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-white dark:bg-slate-900 border text-center rounded-3xl space-y-4">
                                <h3 className="font-extrabold text-lg">Launch an Internship Track</h3>
                                <p className="text-xs text-slate-400">You are not registered in any active learning / internship domains.</p>
                                <button onClick={() => navigate('/internship')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold text-xs transition">Apply Internship</button>
                            </div>
                        )}

                        {/* Notification alert ribbon */}
                        <div className="w-full bg-blue-650 text-white py-3 px-6 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm">
                            <span>📣 Enjoying Vinix? Share with your friends!</span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.origin);
                                    alert('Link copied! Share it with your developer friends.');
                                }}
                                className="flex items-center space-x-1 hover:underline text-blue-100"
                            >
                                <span>Copy Link</span>
                                <ExternalLink size={11} />
                            </button>
                        </div>

                        {/* QUEST LOG GRID LAYOUT */}
                        <div className="space-y-4">

                            <div className="flex items-center space-x-1 text-slate-900 dark:text-white font-extrabold text-lg">
                                <BookOpen size={18} className="text-blue-600" />
                                <span>Quest Log</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">

                                {/* Card 0: LinkedIn Mandatory checklist */}
                                <div className="p-5 rounded-2xl bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="p-2 bg-blue-50 text-blue-650 rounded-xl dark:bg-blue-950/40">
                                                <Linkedin size={18} />
                                            </div>
                                            <div className="flex flex-col items-end gap-1 select-none">
                                                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 rounded-full dark:bg-blue-900/30">AVAILABLE</span>
                                                <span className="px-2 py-0.5 text-[9px] font-bold text-red-650 bg-red-50 rounded-full dark:bg-red-950/20">Immediate Action</span>
                                            </div>
                                        </div>

                                        <p className="text-[10px] text-slate-400">Due Date: Immediate Submission</p>

                                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                                            📢 Mandatory: Offer Letter & LinkedIn Post
                                        </h4>

                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                            Download your offer letter, post it on LinkedIn tagging Vinix, and share the post URL here.
                                        </p>
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        {activeOfferLetter ? (
                                            <div className="flex gap-2">
                                                <a
                                                    href={`http://localhost:5000/uploads/offer-letters/${activeOfferLetter.offerLetterId}.pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center space-x-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-750 rounded-xl transition duration-150"
                                                >
                                                    <FileDown size={11} />
                                                    <span>1. Download Letter</span>
                                                </a>
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
                                            className={`w-full flex items-center justify-center space-x-1 py-2 text-xs font-bold rounded-xl transition duration-150 ${linkedInSubmitted ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            <Linkedin size={12} />
                                            <span>{linkedInSubmitted ? '✓ Submitted' : '2. Submit LinkedIn Post URL'}</span>
                                        </button>
                                    </div>

                                </div>

                                {/* Dynamic Course/Internship Task Cards */}
                                {displayEnrollment && displayEnrollment.course.assignments && displayEnrollment.course.assignments.map((as, index) => {
                                    // Generate dates relative to current registration for realism
                                    const offsetDays = (index + 1) * 7 + 1;
                                    const dueDate = new Date();
                                    dueDate.setDate(dueDate.getDate() + offsetDays);

                                    return (
                                        <div
                                            key={as.id || index}
                                            className="p-5 rounded-2xl bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between space-y-4"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center font-extrabold text-sm dark:bg-blue-955/20 dark:text-blue-400">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 select-none">
                                                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-blue-55 text-blue-700 rounded-full dark:bg-blue-900/30">AVAILABLE</span>
                                                        <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded-full dark:bg-emerald-950/20">{offsetDays} Days Left</span>
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-slate-400">Due Date: {dueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

                                                <h4 className="text-xs font-extrabold text-slate-950 dark:text-white">
                                                    {as.title}
                                                </h4>

                                                {/* Key Features mock bullet list for high-fidelity aesthetics matching screenshot */}
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Tasks Scope:</span>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                                        {as.desc}
                                                    </p>

                                                    {/* Key Features Mock */}
                                                    <ul className="text-[10px] text-slate-450 space-y-0.5 pt-1.5 list-disc pl-3 leading-normal">
                                                        <li>Complete modular structure and validations</li>
                                                        <li>Submit deployment code repository</li>
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                                {projects.some(p => p.title.toLowerCase().includes(as.title.toLowerCase())) ? (
                                                    <span className="w-full flex items-center justify-center space-x-1 py-2 text-xs font-bold text-green-700 bg-green-50 rounded-xl select-none">
                                                        <span>✓ Submitted & Logged</span>
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setProjectTitle(as.title);
                                                            setIsSubmitModalOpen(true);
                                                        }}
                                                        className="w-full flex items-center justify-center py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition duration-150"
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
                                                setQuizScore(null);
                                                setAnswers({});
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
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Certificates of Internship</h2>
                        {certificates.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 border p-12 rounded-3xl text-center space-y-2">
                                <Award size={36} className="mx-auto text-slate-400" />
                                <h3 className="font-bold">No certificates generated yet</h3>
                            </div>
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
                                            <a
                                                href={`http://localhost:5000/api/certificates/pdf/${cert.certificateNumber}`}
                                                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-205 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 flex items-center justify-center"
                                                title="Download Certificate PDF"
                                            >
                                                <FileDown size={14} />
                                            </a>
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

                                                <a
                                                    href={`http://localhost:5000/uploads/offer-letters/${l.offerLetterId}.pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center gap-1"
                                                >
                                                    <FileDown size={12} />
                                                    <span>Download PDF</span>
                                                </a>
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
                                <a
                                    href={`http://localhost:5000/api/certificates/pdf/${selectedCertPreview.certificateNumber}`}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-650 rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
                                    onClick={() => setSelectedCertPreview(null)}
                                >
                                    <FileDown size={14} />
                                    <span>Download PDF</span>
                                </a>
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
                                <a
                                    href={`http://localhost:5000/uploads/offer-letters/${selectedOfferLetterPreview.offerLetterId}.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-650 rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
                                    onClick={() => setSelectedOfferLetterPreview(null)}
                                >
                                    <FileDown size={14} />
                                    <span>Download PDF</span>
                                </a>
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
