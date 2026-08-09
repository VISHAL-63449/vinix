import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Share2, LogIn, LogOut, Menu, X, Award, LayoutDashboard, GraduationCap, Home, Briefcase, Info, MessageSquare, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
    darkMode: boolean;
    setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [shareToast, setShareToast] = useState(false);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.origin);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
    };

    const navItems = [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Internship', path: '/internship', icon: Briefcase },
        { label: 'About', path: '/about', icon: Info },
        { label: 'Reviews', path: '/reviews', icon: MessageSquare },
        { label: 'Contact', path: '/contact', icon: Mail },
        { label: 'Verify', path: '/verify', icon: ShieldCheck },
    ];

    const handleNavClick = (path: string) => {
        setMobileOpen(false);
        if (path.startsWith('/#')) {
            const sectionId = path.substring(2);
            // If dynamic navigation on different pages
            if (location.pathname !== '/') {
                navigate('/');
                setTimeout(() => {
                    const target = document.getElementById(sectionId);
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                const el = document.getElementById(sectionId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                }
            }
        } else {
            navigate(path);
        }
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80 transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">

                    {/* Logo matching Vinix Brand */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-1.5 text-2xl font-extrabold tracking-tight transition hover:opacity-90">
                            <div className="flex items-center text-slate-900 dark:text-white">
                                <span className="font-extrabold text-[23px] text-blue-600 dark:text-blue-400">vin</span>
                                <span className="relative font-extrabold text-[23px] text-slate-800 dark:text-white inline-flex items-center">
                                    <span className="relative inline-block">
                                        i
                                        <GraduationCap className="absolute -top-[5px] -left-[3px] h-3 w-3 text-blue-800 dark:text-white rotate-[12deg]" />
                                    </span>
                                    x
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Menu - with icons per item as in screenshot */}
                    <div className="hidden lg:flex items-center space-x-6">
                        {navItems.map((item) => {
                            const IconComponent = item.icon;
                            const isActive = location.pathname === item.path || (item.path.startsWith('/#') && location.hash === `#${item.path.substring(2)}`);
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => handleNavClick(item.path)}
                                    className={`relative flex items-center space-x-1 px-1 py-1 text-sm font-semibold transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                >
                                    <IconComponent size={14} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute bottom-[-22px] left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Actions & Profile */}
                    <div className="hidden sm:flex items-center space-x-4">

                        {/* Theme Toggle in a circular button */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 text-slate-500 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                        </button>

                        {/* Share Button (Pill card border, light purple/lilac colored branding) */}
                        <div className="relative">
                            <button
                                onClick={handleShare}
                                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-purple-650 bg-purple-50/50 hover:bg-purple-100/60 dark:text-purple-400 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-full transition"
                            >
                                <Share2 size={12} />
                                <span>Share</span>
                            </button>
                            {shareToast && (
                                <div className="absolute top-10 right-0 px-2 py-1 text-xs text-white bg-slate-800 rounded shadow-md whitespace-nowrap">
                                    Link copied!
                                </div>
                            )}
                        </div>

                        {/* Profile / Auth logic */}
                        {user ? (
                            <div className="flex items-center space-x-3.5">
                                <Link
                                    to={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                                    className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow"
                                >
                                    <LayoutDashboard size={13} />
                                    <span>Dashboard</span>
                                </Link>

                                {/* Red Logout design matching screenshot */}
                                <button
                                    onClick={logout}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-105 rounded-full transition"
                                >
                                    <LogOut size={13} />
                                    <span>Logout</span>
                                </button>

                                {/* Initials avatar and display name */}
                                <div className="flex items-center space-x-2 pl-2.5 border-l border-slate-200 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-[90px] truncate">
                                        {user.name}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link
                                    to="/login"
                                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-905 dark:text-slate-350 dark:hover:text-white"
                                >
                                    <LogIn size={14} />
                                    <span>Login</span>
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition shadow-sm"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile hamburger icon */}
                    <div className="flex items-center sm:hidden space-x-2">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 text-slate-500 rounded-lg hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-2 pb-4 space-y-2">
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <button
                                key={item.label}
                                onClick={() => handleNavClick(item.path)}
                                className="flex items-center space-x-2 w-full text-left py-2 px-3 text-base font-semibold rounded-lg text-slate-650 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                            >
                                <IconComponent size={16} className="text-slate-400" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-2">
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center space-x-1.5 py-2 text-sm font-semibold bg-slate-100 text-slate-800 rounded-lg dark:bg-slate-900 dark:text-slate-300"
                        >
                            <Share2 size={16} />
                            <span>Share Dashboard</span>
                        </button>
                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center justify-center space-x-2 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg"
                                >
                                    <LayoutDashboard size={16} />
                                    <span>Go to Dashboard ({user.name})</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        setMobileOpen(false);
                                    }}
                                    className="flex items-center justify-center space-x-2 py-2 text-sm font-medium text-red-650 bg-red-50 rounded-lg dark:bg-red-950/20"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    to="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center justify-center py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 dark:border-slate-800 dark:text-slate-300"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center justify-center py-2 text-sm font-medium text-white bg-blue-600 rounded-lg animate-pulse"
                                >
                                    Register
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
