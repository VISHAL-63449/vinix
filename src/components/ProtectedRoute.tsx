import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRole?: 'student' | 'admin' | 'mentor' | 'STUDENT' | 'ADMIN' | 'MENTOR';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
                <div className="space-y-4 text-center">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-t-2 border-brand-primary animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-t-2 border-brand-secondary animate-spin" style={{ animationDirection: 'reverse' }}></div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading your profile securely...</p>
                </div>
            </div>
        );
    }

    // 1. Not logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Logging roles
    if (allowedRole && profile) {
        const userRole = profile.role.toUpperCase();
        const targetRole = allowedRole.toUpperCase();

        if (userRole !== targetRole) {
            console.warn(`Denied access: expected role ${targetRole}, got ${userRole}`);
            if (userRole === 'ADMIN') {
                return <Navigate to="/admin" replace />;
            } else if (userRole === 'MENTOR') {
                return <Navigate to="/mentor" replace />;
            } else {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
