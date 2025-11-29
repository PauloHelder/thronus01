import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
    id: string;
    email: string;
    fullName: string;
    churchName: string;
    phone?: string;
    role?: 'admin' | 'superuser';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (emailOrPhone: string, password: string) => Promise<boolean>;
    signup: (data: SignupData) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

interface SignupData {
    churchName: string;
    fullName: string;
    email: string;
    phone?: string;
    password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('thronus_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (emailOrPhone: string, password: string): Promise<boolean> => {
        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if user exists in localStorage (mock database)
        const users = JSON.parse(localStorage.getItem('thronus_users') || '[]');
        const foundUser = users.find((u: any) =>
            (u.email === emailOrPhone || u.phone === emailOrPhone) && u.password === password
        );

        if (foundUser) {
            const userData: User = {
                id: foundUser.id,
                email: foundUser.email,
                fullName: foundUser.fullName,
                churchName: foundUser.churchName,
                phone: foundUser.phone,
                role: foundUser.role || 'admin' // Default to admin for church admins
            };
            setUser(userData);
            localStorage.setItem('thronus_user', JSON.stringify(userData));
            setLoading(false);
            return true;
        }

        setLoading(false);
        return false;
    };

    const signup = async (data: SignupData): Promise<boolean> => {
        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('thronus_users') || '[]');
        const existingUser = users.find((u: any) => u.email === data.email);

        if (existingUser) {
            setLoading(false);
            return false; // User already exists
        }

        // Create new user
        const newUser = {
            id: crypto.randomUUID(),
            ...data,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('thronus_users', JSON.stringify(users));

        // Auto-login after signup
        const userData: User = {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            churchName: newUser.churchName,
            phone: newUser.phone
        };
        setUser(userData);
        localStorage.setItem('thronus_user', JSON.stringify(userData));

        setLoading(false);
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('thronus_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            signup,
            logout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
