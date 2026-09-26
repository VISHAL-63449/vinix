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

    const currentPath = (location.pathname || '').toLowerCase();
    if (currentPath.includes('/dashboard') || currentPath.includes('/admin')) {
        return null;
    }

    return (
        <nav className={`sticky top-0 z-50 w-full border-b transition-all duration-300 no-print ${isScrolled
            ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 shadow-md'
            : 'bg-white/80 backdrop-blur-md border-slate-200/80 dark:bg-slate-950/80 dark:border-slate-800/80'
            }`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo & Brand */}
                    <div className="flex items-center shrink-0">
                        <Link to="/" className="flex items-center hover:opacity-90 transition shrink-0">
                            <img
                                src={window.location.origin + import.meta.env.BASE_URL + 'vinix-title.png'}
                                alt="Vinix"
                                className="h-8 w-auto shrink-0 object-contain mix-blend-multiply dark:mix-blend-normal dark:invert transition-all duration-300"
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

                                <div className="flex items-center space-x-2 pl-2.5 border-l border-slate-200 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs select-none overflow-hidden">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'
                                        )}
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
                    <div className="flex lg:hidden items-center space-x-1.5 sm:space-x-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-brand-primary dark:text-slate-400 dark:hover:text-brand-accent hover:bg-slate-100 dark:hover:bg-brand-hoverDark transition-all duration-200"
                        >
                            {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>

                        {/* Mobile Auth Button Quick Links */}
                        {!user ? (
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    navigate('/login');
                                }}
                                className="flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm select-none"
                            >
                                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="whitespace-nowrap">Login / Register</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    navigate(profile?.role === 'admin' ? '/admin' : profile?.role === 'mentor' ? '/mentor' : '/dashboard');
                                }}
                                className="flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm select-none"
                            >
                                <LayoutDashboard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="whitespace-nowrap">Dashboard</span>
                            </button>
                        )}

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-hoverDark"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="absolute top-[64px] left-0 w-full h-[100vh] z-40 bg-slate-50 dark:bg-slate-950 overflow-y-auto px-4 py-6 border-t border-slate-100 dark:border-slate-800 shadow-xl lg:hidden">
                    <div className="max-w-md mx-auto space-y-6 pb-24">

                        {/* User Profile / Header Box */}
                        <div className="bg-blue-50/60 dark:bg-slate-900/50 border border-blue-100/50 dark:border-slate-800 rounded-[24px] p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3.5">
                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm select-none overflow-hidden">
                                    {user ? (
                                        profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()
                                        )
                                    ) : 'V'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-bold text-slate-900 dark:text-white">
                                        {user ? (profile?.full_name || 'User') : 'Guest'}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {user ? user.email : 'Login to access features'}
                                    </span>
                                </div>
                            </div>

                            {/* Theme Toggle in Mobile Sidebar */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2.5 rounded-full bg-white dark:bg-slate-800 border-none shadow-sm text-slate-500 dark:text-slate-400 active:scale-95 transition-transform"
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </div>

                        {/* Navigation Section */}
                        <div className="relative flex items-center justify-center pt-2">
                            <div className="absolute inset-x-0 h-px bg-slate-200 dark:bg-slate-800"></div>
                            <span className="relative bg-slate-50 dark:bg-slate-950 px-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                Navigation
                            </span>
                        </div>

                        <div className="space-y-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.path);
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`relative flex items-center space-x-4 px-3 py-2 rounded-2xl transition-all ${active
                                            ? 'bg-blue-50/80 dark:bg-blue-900/20'
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-900/30'
                                            }`}
                                    >
                                        {active && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[55%] bg-blue-600 rounded-r-md"></div>
                                        )}
                                        <div className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center shadow-sm ${active
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                            }`}>
                                            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                                        </div>
                                        <span className={`text-[15px] font-bold ${active ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                                            }`}>
                                            {link.name}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Account Section */}
                        <div className="relative flex items-center justify-center pt-6">
                            <div className="absolute inset-x-0 h-px bg-slate-200 dark:bg-slate-800"></div>
                            <span className="relative bg-slate-50 dark:bg-slate-950 px-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                Account
                            </span>
                        </div>

                        <div className="space-y-1">
                            {user ? (
                                <>
                                    <Link
                                        to={profile?.role === 'admin' ? '/admin' : profile?.role === 'mentor' ? '/mentor' : '/dashboard'}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center space-x-4 px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900/30 transition-all"
                                    >
                                        <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm flex items-center justify-center">
                                            <LayoutDashboard size={18} />
                                        </div>
                                        <span className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Dashboard</span>
                                    </Link>

                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center space-x-4 px-3 py-2 mt-2 w-full text-left rounded-2xl bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                                    >
                                        <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-red-500 shadow-sm flex items-center justify-center">
                                            <LogOut size={18} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[15px] font-bold text-red-600 dark:text-red-400">Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 px-3 pt-2">
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex justify-center py-3.5 px-4 bg-white dark:bg-slate-800 text-[14px] font-bold rounded-2xl text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex justify-center py-3.5 px-4 bg-blue-600 text-[14px] font-bold rounded-2xl text-white shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="pt-10 pb-6 text-center">
                            <p className="text-xs font-semibold text-slate-400/80">© 2026 Skyrovix IT Solutions.</p>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
