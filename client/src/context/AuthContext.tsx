import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'ADMIN';
    skills: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role?: string) => Promise<void>;
    logout: () => void;
    updateProfile: (name: string, skills: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('vionix_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMe = async () => {
            const storedToken = localStorage.getItem('vionix_token');
            if (storedToken) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch (error) {
                    console.error('Failed to authenticate token:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        fetchMe();
    }, [token]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            const { token: receivedToken, user: receivedUser } = res.data;
            localStorage.setItem('vionix_token', receivedToken);
            setToken(receivedToken);
            setUser(receivedUser);
        } catch (error: any) {
            setLoading(false);
            throw new Error(error.response?.data?.message || 'Login failed.');
        }
    };

    const register = async (name: string, email: string, password: string, role = 'STUDENT') => {
        setLoading(true);
        try {
            const res = await api.post('/auth/register', { name, email, password, role });
            const { token: receivedToken, user: receivedUser } = res.data;
            localStorage.setItem('vionix_token', receivedToken);
            setToken(receivedToken);
            setUser(receivedUser);
        } catch (error: any) {
            setLoading(false);
            throw new Error(error.response?.data?.message || 'Registration failed.');
        }
    };

    const logout = () => {
        localStorage.removeItem('vionix_token');
        setToken(null);
        setUser(null);
        setLoading(false);
    };

    const updateProfile = async (name: string, skills: string[]) => {
        try {
            const res = await api.put('/auth/profile', { name, skills });
            setUser(res.data);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update profile.');
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
