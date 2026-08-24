import React, { useState } from 'react';
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
        <nav className="sticky top-0 z-40 w-full transition-all duration-300 glass border-b border-slate-200/50 dark:border-slate-800/40 no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Brand */}
                    <div className="flex items-center font-extrabold text-slate-900 dark:text-white">
                        <Link to="/" className="flex items-center transition hover:opacity-85">
                            <img
                                src={logoImg}
                                alt="Vinix"
                                className={`h-8 w-auto object-contain transition-all duration-300 ${darkMode
                                        ? 'invert brightness-200 mix-blend-screen'
                                        : 'mix-blend-multiply'
                                    }`}
                            />
                        </Link>
                    </div>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center space-x-1 h-full">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`relative flex items-center space-x-1.5 px-3.5 h-16 text-[14px] font-semibold transition-all duration-200 select-none ${isActive(link.path)
                                        ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600 dark:border-blue-400'
                                        : 'text-slate-550 hover:text-blue-600 dark:text-slate-350 dark:hover:text-blue-400'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Controls */}
                    <div className="hidden md:flex items-center space-x-3.5">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 flex items-center justify-center cursor-pointer"
                            aria-label="Toggle theme"
                        >
                            {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                        </button>

                        {/* Share Button with Tooltip */}
                        <div className="relative">
                            <button
                                onClick={handleShare}
                                className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-full border border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-105 dark:hover:bg-purple-900/30 transition-all duration-205 cursor-pointer"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Share</span>
                            </button>
                            {shareTooltip && (
                                <div className="absolute right-0 top-12 bg-slate-900 dark:bg-slate-800 text-white text-[10px] px-2.5 py-1 rounded shadow-md whitespace-nowrap animate-pulse">
                                    Portal link copied!
                                </div>
                            )}
                        </div>

                        {/* Auth Buttons */}
                        {user ? (
                            <div className="flex items-center space-x-3">
                                {/* Dashboard Button */}
                                <Link
                                    to={profile?.role === 'admin' ? '/admin' : profile?.role === 'mentor' ? '/mentor' : '/dashboard'}
                                    className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md shadow-blue-500/10 transition-all duration-200 select-none cursor-pointer"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span>Dashboard</span>
                                </Link>

                                {/* Logout Button */}
                                <button
                                    onClick={handleSignOut}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-red-500 hover:text-red-650 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all duration-200 select-none cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>

                                {/* Separator Line */}
                                <div className="h-5 w-[1px] bg-slate-205 dark:bg-slate-805 mx-1"></div>

                                {/* Avatar Initials and Full Name */}
                                <div className="flex items-center space-x-2 select-none pl-1">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center">
                                        {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-550 dark:text-slate-400 capitalize max-w-[100px] truncate">
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
                                    className="flex items-center justify-center px-6 py-2.5 rounded-full text-[13px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:opacity-95 shadow-md transform hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center space-x-2">
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
            {mobileMenuOpen && (
                <div className="md:hidden glass border-t border-slate-200/50 dark:border-slate-800/40 py-3 px-4 space-y-2">
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
            )}
        </nav>
    );
};

export default Navbar;
