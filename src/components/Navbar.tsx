import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImg from '../assets/vinix-logo.png';
import {
    Sun, Moon, Menu, X, Rocket, LogOut, LayoutDashboard, Briefcase,
    User, Settings, ShieldAlert, Code, Home, Info,
    MessageSquare, Mail, ShieldCheck, Share2, LogIn, BookOpen
} from 'lucide-react';

interface NavbarProps {
    darkMode: boolean;
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [shareTooltip, setShareTooltip] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
            if (scrollTop > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        // Initialize scroll state on mount
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
            document.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const navLinks = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Internship', path: '/internships', icon: Briefcase },
        { name: 'About', path: '/about', icon: Info },
        { name: 'Reviews', path: '/reviews', icon: MessageSquare },
        { name: 'Contact', path: '/contact', icon: Mail },
        { name: 'Verify', path: '/verify', icon: ShieldCheck },
    ];

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.origin);
        setShareTooltip(true);
        setTimeout(() => setShareTooltip(false), 2000);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <nav className={`sticky top-0 z-50 w-full border-b transition-all duration-300 no-print ${isScrolled
            ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 shadow-md'
            : 'bg-white/80 backdrop-blur-md border-slate-200/80 dark:bg-slate-950/80 dark:border-slate-800/80'
            }`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo & Brand */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center hover:opacity-90 transition">
                            <img
                                src={`${import.meta.env.BASE_URL}vinix-title.png`}
                                alt="Vinix"
                                className="h-8 w-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:invert transition-all duration-300"
                            />
                        </Link>
                    </div>

                    {/* Desktop Nav Links */}
                    <div className="hidden lg:flex items-center space-x-6">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const active = isActive(link.path);
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`relative flex items-center space-x-1 px-1 py-1 text-sm font-semibold transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${active
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                                    <span>{link.name}</span>
                                    {active && (
                                        <div className="absolute bottom-[-22px] left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Controls */}
                    <div className="hidden lg:flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 text-slate-500 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                            aria-label="Toggle theme"
                        >
                            {darkMode ? <Sun className="w-3.75 h-3.75" /> : <Moon className="w-3.75 h-3.75" />}
                        </button>

                        {/* Share Button with Tooltip */}
                        <div className="relative">
                            <button
                                onClick={handleShare}
                                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-purple-650 bg-purple-50/50 hover:bg-purple-100/60 dark:text-purple-400 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-full transition cursor-pointer"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Share</span>
                            </button>
                            {shareTooltip && (
                                <div className="absolute right-0 top-12 bg-slate-900 dark:bg-slate-800 text-white text-[10px] px-2.5 py-1 rounded shadow-md whitespace-nowrap animate-pulse z-50">
                                    Portal link copied!
                                </div>
                            )}
                        </div>

                        {/* Auth Buttons */}
                        {user ? (
                            <div className="flex items-center space-x-3.5">
                                {/* Dashboard Button */}
                                <Link
                                    to={profile?.role === 'admin' ? '/admin' : profile?.role === 'mentor' ? '/mentor' : '/dashboard'}
                                    className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition shadow select-none cursor-pointer"
                                >
                                    <LayoutDashboard className="w-3.25 h-3.25" />
                                    <span>Dashboard</span>
                                </Link>

                                {/* Logout Button */}
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-105 rounded-full transition cursor-pointer"
                                >
                                    <LogOut className="w-3.25 h-3.25" />
                                    <span>Logout</span>
                                </button>

                                {/* Separator Line & Avatar Details */}
                                <div className="flex items-center space-x-2 pl-2.5 border-l border-slate-200 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs select-none">
                                        {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-xs text-slate-550 dark:text-slate-400 font-semibold max-w-[90px] truncate select-none">
                                        {profile?.full_name ? profile.full_name.split(' ')[0].toLowerCase() : 'user'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-1.5">
                                <Link
                                    to="/login"
                                    className="flex items-center space-x-1 px-3.5 py-2 text-[13px] font-bold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-white transition-all duration-200 cursor-pointer"
                                >
                                    <LogIn className="w-3.5 h-3.5" />
                                    <span>Login</span>
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex items-center justify-center px-6 py-2 rounded-full text-[13px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:opacity-95 shadow-md transform hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex lg:hidden items-center space-x-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-xl text-slate-500 hover:text-brand-primary dark:text-slate-400 dark:hover:text-brand-accent hover:bg-slate-100 dark:hover:bg-brand-hoverDark transition-all duration-200"
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-hoverDark"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer */}
            {
                mobileMenuOpen && (
                    <div
                        style={{
                            backgroundColor: darkMode ? '#0D0E12' : '#FFFFFF',
                            borderColor: darkMode ? '#1E293B' : '#E2E8F0',
                        }}
                        className="lg:hidden border-t py-3 px-4 space-y-2"
                    >
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-base font-semibold ${isActive(link.path)
                                        ? 'bg-brand-hoverLight text-brand-primary dark:bg-brand-hoverDark dark:text-brand-accent'
                                        : 'text-slate-650 hover:text-brand-primary dark:text-slate-300 dark:hover:text-brand-accent'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            {user ? (
                                <>
                                    <div className="px-4 py-2">
                                        <p className="text-xs text-slate-400 font-medium">Logged in as</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile?.full_name || user.email}</p>
                                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-brand-primary/10 text-brand-primary uppercase">
                                            {profile?.role || 'student'}
                                        </span>
                                    </div>

                                    {profile?.role === 'admin' ? (
                                        <Link
                                            to="/admin"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-hoverDark"
                                        >
                                            <ShieldAlert className="w-5 h-5 text-rose-500" />
                                            <span className="font-semibold">Admin Portal</span>
                                        </Link>
                                    ) : profile?.role === 'mentor' ? (
                                        <Link
                                            to="/mentor"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-hoverDark"
                                        >
                                            <ShieldAlert className="w-5 h-5 text-violet-500" />
                                            <span className="font-semibold">Mentor Portal</span>
                                        </Link>
                                    ) : (
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-hoverDark"
                                        >
                                            <LayoutDashboard className="w-5 h-5 text-brand-primary" />
                                            <span className="font-semibold">Student Dashboard</span>
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center space-x-2 w-full text-left px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span className="font-semibold">Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 px-2">
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-700 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-305 hover:bg-slate-50 dark:hover:bg-brand-hoverDark"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex justify-center py-2 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-sm font-semibold rounded-xl text-white shadow"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </nav >
    );
};

export default Navbar;
