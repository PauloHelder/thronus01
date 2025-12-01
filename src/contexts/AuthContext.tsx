import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export type UserRole = 'admin' | 'leader' | 'member' | string;

export interface User {
    id: string;
    email: string;
    fullName: string;
    churchName: string;
    phone?: string;
    role: UserRole;
    permissions?: string[];
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (emailOrPhone: string, password: string) => Promise<boolean>;
    signup: (data: SignupData) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    hasPermission: (permission: string) => boolean;
}

interface SignupData {
    churchName: string;
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    role?: UserRole; // Optional role for signup (default to admin for new church signup)
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

        // Add mock member user if not exists (FOR TESTING PURPOSES)
        const mockMemberEmail = 'membro@teste.com';
        if (!users.find((u: any) => u.email === mockMemberEmail)) {
            users.push({
                id: 'mock-member-1',
                email: mockMemberEmail,
                password: '123',
                fullName: 'Membro Teste',
                churchName: 'Igreja Teste',
                role: 'member'
            });
            localStorage.setItem('thronus_users', JSON.stringify(users));
        }

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
                role: foundUser.role || 'admin', // Default to admin for legacy users
                permissions: getPermissionsByRole(foundUser.role || 'admin')
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
            role: data.role || 'admin', // Default to admin if not specified (e.g. creating a new church)
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
            phone: newUser.phone,
            role: newUser.role as UserRole,
            permissions: getPermissionsByRole(newUser.role as UserRole)
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

    const getPermissionsByRole = (role: UserRole): string[] => {
        // Check for custom permissions in localStorage
        const storedPermissions = localStorage.getItem('thronus_role_permissions');
        if (storedPermissions) {
            const parsedPermissions = JSON.parse(storedPermissions);
            if (parsedPermissions[role]) {
                return parsedPermissions[role];
            }
        }

        // Default permissions if not found in storage
        switch (role) {
            case 'admin':
                return ['all'];
            case 'leader':
                return ['view_all', 'edit_department', 'create_event', 'edit_event', 'view_members'];
            case 'member':
                return ['view_only'];
            default:
                return [];
        }
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (user.permissions?.includes('all')) return true;
        return user.permissions?.includes(permission) || false;
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            signup,
            logout,
            loading,
            hasPermission
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
