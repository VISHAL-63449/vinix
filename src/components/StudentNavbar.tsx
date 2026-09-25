import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Home,
    ClipboardList,
    Briefcase,
    CreditCard,
    Award,
    User,
    MessageSquare,
    LogOut,
    Bell,
    Moon,
    Sun,
    ChevronDown,
    Menu,
    X,
    Share2
} from 'lucide-react';

export interface StudentNavbarProps {
    activeTab: 'overview' | 'workspace' | 'idcard' | 'certificates' | 'settings' | 'payment';
    setActiveTab: (tab: 'overview' | 'workspace' | 'idcard' | 'certificates' | 'settings' | 'payment') => void;
    activeEnrollment?: any;
    unreadNotifications?: number;
    onReviewClick?: () => void;
}

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    type: 'task' | 'offer' | 'info';
    actionTab?: 'overview' | 'certificates' | 'payment';
}

const StudentNavbar: React.FC<StudentNavbarProps> = ({
    activeTab,
    setActiveTab,
    activeEnrollment,
    onReviewClick
}) => {
    const { user, profile, studentProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // UI States
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    // Theme state
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return (
            localStorage.getItem('darkMode') === 'true' ||
            (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        );
    });

    // Refs for outside-click detection
    const notifRef = useRef<HTMLDivElement>(null);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Dynamic Notifications
    const [notifications, setNotifications] = useState<NotificationItem[]>([
        {
            id: '1',
            title: 'Offer Letter Available',
            description: 'Your virtual internship credentials & offer letter are ready to verify.',
            time: '10m ago',
            read: false,
            type: 'offer',
            actionTab: 'overview'
        },
        {
            id: '2',
            title: 'Milestone Tasks Active',
            description: 'Submit your Task #1 link on LinkedIn to unlock further project milestones.',
            time: '1h ago',
            read: false,
            type: 'task',
            actionTab: 'overview'
        },
        {
            id: '3',
            title: 'Welcome to Vinix Workspace',
            description: 'Access task instructions, learning resources, and completion certificates.',
            time: '1d ago',
            read: false,
            type: 'info'
        }
    ]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Synchronize Dark Mode with DOM & LocalStorage
    const toggleDarkMode = () => {
        setIsDarkMode((prev) => {
            const nextMode = !prev;
            if (nextMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('darkMode', 'false');
            }
            window.dispatchEvent(new Event('theme-change'));
            return nextMode;
        });
    };

    // Close popovers on ESC and click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotificationOpen(false);
            }
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
                setUserDropdownOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setNotificationOpen(false);
                setUserDropdownOpen(false);
                setDrawerOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [drawerOpen]);

    // Ensure drawer is automatically closed on laptop / desktop viewport
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setDrawerOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Student Info Extraction (Dynamic from auth context)
    const studentHandle =
        (user?.email ? user.email.split('@')[0] : null) ||
        profile?.full_name?.toLowerCase().replace(/\s+/g, '') ||
        'student';

    const studentDisplayName =
        profile?.full_name?.trim() || studentHandle;

    const studentEmail = user?.email || 'student@domain.com';

    // Compute first letter for avatar pill (e.g. "V" / "S")
    const studentInitial = (
        (studentHandle && studentHandle.charAt(0)) ||
        (profile?.full_name && profile.full_name.trim().charAt(0)) ||
        'V'
    ).toUpperCase();

    // Handlers
    const handleSignOut = async () => {
        setDrawerOpen(false);
        setUserDropdownOpen(false);
        await signOut();
        navigate('/login');
    };

    const handleSharePlatform = () => {
        navigator.clipboard.writeText(window.location.origin);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
    };

    const handleMarkAllNotificationsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const handleSelectNotification = (item: NotificationItem) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
        );
        if (item.actionTab) {
            setActiveTab(item.actionTab);
        }
        setNotificationOpen(false);
    };

    const handleNavClick = (
        target: 'home' | 'tasks' | 'internships' | 'payment' | 'certificates' | 'profile' | 'review'
    ) => {
        setDrawerOpen(false);

        switch (target) {
            case 'home':
                setActiveTab('overview');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'tasks':
                setActiveTab('overview');
                setTimeout(() => {
                    const taskSection = document.getElementById('tasks-section');
                    if (taskSection) {
                        taskSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
                break;
            case 'internships':
                navigate('/internships');
                break;
            case 'payment':
                setActiveTab('payment');
                break;
            case 'certificates':
                setActiveTab('certificates');
                break;
            case 'profile':
                setActiveTab('settings');
                break;
            case 'review':
                if (onReviewClick) {
                    onReviewClick();
                } else {
                    navigate('/reviews');
                }
                break;
        }
    };

    // Helper to evaluate active state for navigation items
    const isItemActive = (item: 'home' | 'tasks' | 'internships' | 'payment' | 'certificates' | 'profile') => {
        if (item === 'tasks') {
            return activeTab === 'overview' || activeTab === 'workspace';
        }
        if (item === 'payment') return activeTab === 'payment';
        if (item === 'certificates') return activeTab === 'certificates';
        if (item === 'profile') return activeTab === 'settings';
        return false;
    };

    return (
        <>
            {/* Top Navigation Bar (Header) - Matching Laptop View in Image 3 */}
            <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-colors duration-200">
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 sm:h-[68px] items-center justify-between">
                        {/* Left: Brand Logo */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => handleNavClick('home')}
                                className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer group"
                                aria-label="Vinix Student Portal Home"
                            >
                                <img
                                    src={window.location.origin + import.meta.env.BASE_URL + 'vinix-title.png'}
                                    alt="Vinix"
                                    className="h-7 sm:h-8 w-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:invert transition-all duration-300"
                                />
                            </button>
                        </div>

                        {/* Laptop Navigation Links - Matching Image 3 cleanly without wrapping container */}
                        <nav className="hidden lg:flex items-center space-x-5 xl:space-x-7">
                            {/* Home */}
                            <button
                                onClick={() => handleNavClick('home')}
                                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                    activeTab === 'overview' && window.scrollY < 100
                                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                            >
                                <Home className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                <span>Home</span>
                            </button>

                            {/* My Tasks (Active in Image 3: solid blue pill button with white text & icon) */}
                            {isItemActive('tasks') ? (
                                <button
                                    onClick={() => handleNavClick('tasks')}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shadow-blue-500/25 transition-all cursor-pointer"
                                >
                                    <ClipboardList className="w-4 h-4 text-white" />
                                    <span>My Tasks</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleNavClick('tasks')}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                    <ClipboardList className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <span>My Tasks</span>
                                </button>
                            )}

                            {/* My Internships */}
                            <button
                                onClick={() => handleNavClick('internships')}
                                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            >
                                <Briefcase className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                <span>My Internships</span>
                            </button>

                            {/* Payment */}
                            {isItemActive('payment') ? (
                                <button
                                    onClick={() => handleNavClick('payment')}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shadow-blue-500/25 transition-all cursor-pointer"
                                >
                                    <CreditCard className="w-4 h-4 text-white" />
                                    <span>Payment</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleNavClick('payment')}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                    <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <span>Payment</span>
                                </button>
                            )}

                            {/* Certificates */}
                            {isItemActive('certificates') ? (
                                <button
                                    onClick={() => handleNavClick('certificates')}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shadow-blue-500/25 transition-all cursor-pointer"
                                >
                                    <Award className="w-4 h-4 text-white" />
                                    <span>Certificates</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleNavClick('certificates')}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                    <Award className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <span>Certificates</span>
                                </button>
                            )}

                            {/* Profile */}
                            {isItemActive('profile') ? (
                                <button
                                    onClick={() => handleNavClick('profile')}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shadow-blue-500/25 transition-all cursor-pointer"
                                >
                                    <User className="w-4 h-4 text-white" />
                                    <span>Profile</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleNavClick('profile')}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <span>Profile</span>
                                </button>
                            )}

                            {/* Review */}
                            <button
                                onClick={() => handleNavClick('review')}
                                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            >
                                <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                <span>Review</span>
                            </button>
                        </nav>

                        {/* Right: Controls matching Image 2 */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* 1. Notification Bell Button */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => {
                                        setNotificationOpen(!notificationOpen);
                                        setUserDropdownOpen(false);
                                    }}
                                    className="relative w-10 h-10 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs cursor-pointer focus:outline-none"
                                    aria-label="Student notifications"
                                >
                                    <Bell className="w-[18px] h-[18px]" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-[#f43f5e] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-950 animate-in fade-in">
                                            9+
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown Popover */}
                                {notificationOpen && (
                                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Notifications
                                                </h4>
                                                {unreadCount > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                                                        {unreadCount} new
                                                    </span>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllNotificationsRead}
                                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {notifications.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleSelectNotification(item)}
                                                    className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3 text-left ${
                                                        !item.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                                                            item.type === 'offer'
                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                                                : item.type === 'task'
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        {item.type === 'offer' ? '📄' : item.type === 'task' ? '🚀' : '✨'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                                {item.title}
                                                            </p>
                                                            <span className="text-[10px] text-slate-400 shrink-0">
                                                                {item.time}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 2. Dark Mode Toggle Button */}
                            <button
                                onClick={toggleDarkMode}
                                className="w-10 h-10 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors shadow-xs cursor-pointer focus:outline-none"
                                aria-label="Toggle dark mode"
                            >
                                {isDarkMode ? (
                                    <Sun className="w-[18px] h-[18px] text-amber-400" />
                                ) : (
                                    <Moon className="w-[18px] h-[18px]" />
                                )}
                            </button>

                            {/* 3. User Avatar Pill with Dropdown Chevron - Matching Image 2 */}
                            <div className="relative" ref={userDropdownRef}>
                                <button
                                    onClick={() => {
                                        setUserDropdownOpen(!userDropdownOpen);
                                        setNotificationOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shadow-xs cursor-pointer focus:outline-none"
                                    aria-label="Student profile menu"
                                >
                                    {/* Circle Avatar with initial in vibrant blue matching Pic 2 */}
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                                        {profile?.avatar_url ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt={studentHandle}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>{studentInitial}</span>
                                        )}
                                    </div>

                                    {/* Student username handle (e.g. vishal9932 / sandhiya) */}
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 max-w-[140px] truncate">
                                        {studentHandle}
                                    </span>

                                    {/* Chevron arrow flips when open */}
                                    <ChevronDown
                                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                            userDropdownOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {/* User Dropdown Popover - Matching Image 3 layout */}
                                {userDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                                        {/* Top grey user info header card */}
                                        <div className="p-4 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800/80">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {studentHandle}
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5 font-medium">
                                                {studentEmail}
                                            </p>
                                            {studentProfile?.college && (
                                                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                                                    {studentProfile.college}
                                                </span>
                                            )}
                                        </div>

                                        {/* Action buttons matching Image 3 */}
                                        <div className="p-2 space-y-1">
                                            {/* Share Platform */}
                                            <button
                                                onClick={handleSharePlatform}
                                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    <span>Share Platform</span>
                                                </div>
                                                {shareCopied && (
                                                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        Copied!
                                                    </span>
                                                )}
                                            </button>

                                            {/* Sign Out */}
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4 text-rose-500" />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 4. Hamburger / Close Menu Toggle Button - ONLY on mobile/tablet */}
                            <button
                                onClick={() => setDrawerOpen(!drawerOpen)}
                                className="lg:hidden w-10 h-10 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs cursor-pointer focus:outline-none"
                                aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                            >
                                {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Student Navigation Drawer - ONLY on mobile/tablet, NEVER on laptop */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
                    {/* Darkened Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity duration-300"
                        onClick={() => setDrawerOpen(false)}
                    />

                    {/* Drawer Panel */}
                    <aside
                        ref={drawerRef}
                        className="fixed inset-y-0 right-0 w-full sm:w-[420px] max-w-full bg-[#fbfcfe] dark:bg-[#0b1120] shadow-2xl flex flex-col z-50 border-l border-slate-200/80 dark:border-slate-800/80 transition-transform duration-300 ease-in-out"
                    >
                        {/* Drawer Header (Exact match to top bar with Close 'X') */}
                        <div className="flex h-16 sm:h-[68px] items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 shrink-0">
                            {/* Brand Logo */}
                            <div className="flex items-center">
                                <img
                                    src={window.location.origin + import.meta.env.BASE_URL + 'vinix-title.png'}
                                    alt="Vinix"
                                    className="h-7 sm:h-8 w-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:invert"
                                />
                            </div>

                            {/* Header Action Buttons in Drawer */}
                            <div className="flex items-center gap-2 sm:gap-2.5">
                                {/* Bell */}
                                <button
                                    onClick={() => setNotificationOpen(!notificationOpen)}
                                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-xs"
                                    aria-label="Notifications"
                                >
                                    <Bell className="w-4 h-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#f43f5e] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                                            {unreadCount > 3 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Theme toggle */}
                                <button
                                    onClick={toggleDarkMode}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-xs"
                                    aria-label="Toggle theme"
                                >
                                    {isDarkMode ? (
                                        <Sun className="w-4 h-4 text-amber-400" />
                                    ) : (
                                        <Moon className="w-4 h-4" />
                                    )}
                                </button>

                                {/* User Pill Matching Pic 2 */}
                                <div className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center overflow-hidden">
                                        {profile?.avatar_url ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt={studentDisplayName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>{studentInitial}</span>
                                        )}
                                    </div>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </div>

                                {/* Close Button 'X' */}
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs cursor-pointer"
                                    aria-label="Close menu drawer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Drawer Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-left">
                            {/* 1. Student Profile Card (Matching Image 3) */}
                            <div className="bg-[#eff6ff] dark:bg-slate-900/80 border border-blue-100/80 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 overflow-hidden">
                                        {profile?.avatar_url ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt={studentDisplayName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>{studentInitial}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate leading-tight">
                                            {studentHandle}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                                            {studentEmail}
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Theme Toggle inside Profile Card */}
                                <button
                                    onClick={toggleDarkMode}
                                    className="w-9 h-9 rounded-full border border-blue-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform shadow-2xs shrink-0 cursor-pointer"
                                    title="Toggle theme"
                                    aria-label="Toggle theme in card"
                                >
                                    {isDarkMode ? (
                                        <Sun className="w-4 h-4 text-amber-400" />
                                    ) : (
                                        <Moon className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Section Header: DASHBOARD */}
                            <div className="pt-1 pb-1">
                                <p className="text-center text-[11px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase select-none">
                                    DASHBOARD
                                </p>
                            </div>

                            {/* Navigation Items (Matching Image 1 & Image 3) */}
                            <div className="space-y-2.5">
                                {/* Item 1: Home */}
                                <button
                                    onClick={() => handleNavClick('home')}
                                    className="w-full bg-[#f8fafc] dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/70 rounded-2xl p-3.5 flex items-center gap-3.5 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all group cursor-pointer"
                                >
                                    <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-colors shadow-2xs">
                                        <Home className="w-4 h-4" />
                                    </div>
                                    <span>Home</span>
                                </button>

                                {/* Item 2: My Tasks (Active in images) */}
                                {isItemActive('tasks') ? (
                                    <button
                                        onClick={() => handleNavClick('tasks')}
                                        className="w-full bg-[#edf4ff] dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-3.5 flex items-center gap-3.5 relative overflow-hidden transition-all shadow-xs cursor-pointer"
                                    >
                                        {/* Left Active Indicator Bar */}
                                        <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-blue-600 rounded-r-full" />
                                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
                                            <ClipboardList className="w-4 h-4" />
                                        </div>
                                        <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                            My Tasks
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleNavClick('tasks')}
                                        className="w-full bg-[#f8fafc] dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/70 rounded-2xl p-3.5 flex items-center gap-3.5 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all group cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-colors shadow-2xs">
                                            <ClipboardList className="w-4 h-4" />
                                        </div>
                                        <span>My Tasks</span>
                                    </button>
                                )}

                                {/* Item 3: My Internships */}
                                <button
                                    onClick={() => handleNavClick('internships')}
                                    className="w-full bg-[#f8fafc] dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/70 rounded-2xl p-3.5 flex items-center gap-3.5 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all group cursor-pointer"
                                >
                                    <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-colors shadow-2xs">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <span>My Internships</span>
                                </button>

                                {/* Item 4: Payment */}
                                {isItemActive('payment') ? (
                                    <button
                                        onClick={() => handleNavClick('payment')}
                                        className="w-full bg-[#edf4ff] dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-3.5 flex items-center gap-3.5 relative overflow-hidden transition-all shadow-xs cursor-pointer"
                                    >
                                        <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-blue-600 rounded-r-full" />
                                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                            Payment
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleNavClick('payment')}
                                        className="w-full bg-[#f8fafc] dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/70 rounded-2xl p-3.5 flex items-center gap-3.5 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all group cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-colors shadow-2xs">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <span>Payment</span>
                                    </button>
                                )}

                                {/* Item 5: Certificates */}
                                {isItemActive('certificates') ? (
                                    <button
                                        onClick={() => handleNavClick('certificates')}
                                        className="w-full bg-[#edf4ff] dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-3.5 flex items-center gap-3.5 relative overflow-hidden transition-all shadow-xs cursor-pointer"
                                    >
                                        <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-blue-600 rounded-r-full" />
                                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
                                            <Award className="w-4 h-4" />
                                        </div>
                                        <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                            Certificates
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleNavClick('certificates')}
                                        className="w-full bg-[#f8fafc] dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/70 rounded-2xl p-3.5 flex items-center gap-3.5 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all group cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-colors shadow-2xs">
                                            <Award className="w-4 h-4" />
                                        </div>
                                        <span>Certificates</span>
                                    </button>
                                )}

                                {/* Item 6: Profile */}
                                {isItemActive('profile') ? (
                                    <button
                                        onClick={() => handleNavClick('profile')}
                                        className="w-full bg-[#edf4ff] dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-3.5 flex items-center gap-3.5 relative overflow-hidden transition-all shadow-xs cursor-pointer"
                                    >
                                        <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-blue-600 rounded-r-full" />
                                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                            Profile
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleNavClick('profile')}
                                        className="w-full bg-[#f8fafc] dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/70 rounded-2xl p-3.5 flex items-center gap-3.5 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all group cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-colors shadow-2xs">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span>Profile</span>
                                    </button>
                                )}

                                {/* Item 7: Review */}
                                <button
                                    onClick={() => handleNavClick('review')}
                                    className="w-full bg-[#f8fafc] dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/70 rounded-2xl p-3.5 flex items-center gap-3.5 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all group cursor-pointer"
                                >
                                    <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-colors shadow-2xs">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <span>Review</span>
                                </button>
                            </div>

                            {/* Section Header: ACCOUNT (Matching Image 1) */}
                            <div className="pt-4 pb-2">
                                <p className="text-center text-[11px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase select-none">
                                    ACCOUNT
                                </p>
                            </div>

                            {/* Sign Out Button (Matching Image 1: soft red background, red icon in circle, red text) */}
                            <button
                                onClick={handleSignOut}
                                className="w-full bg-[#fef2f2] dark:bg-rose-950/20 hover:bg-[#fee2e2] dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-3.5 flex items-center gap-3.5 text-rose-600 dark:text-rose-400 font-extrabold text-sm transition-all cursor-pointer shadow-2xs"
                            >
                                <div className="w-9 h-9 rounded-full bg-white dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-rose-500 flex items-center justify-center shadow-2xs shrink-0">
                                    <LogOut className="w-4 h-4" />
                                </div>
                                <span>Sign Out</span>
                            </button>

                            {/* Footer Copyright Note (Matching Image 1) */}
                            <div className="pt-6 pb-2 text-center">
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    &copy; 2026 Vinix IT Solutions.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
};

export default StudentNavbar;
