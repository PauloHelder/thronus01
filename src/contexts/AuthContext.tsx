import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'leader' | 'member' | string;

export interface User {
    id: string;
    email: string;
    fullName: string;
    churchName: string;
    churchId: string;
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
    role?: UserRole;
    // Dados adicionais da igreja do formulário
    sigla?: string;
    denominacao?: string;
    nif?: string;
    endereco?: string;
    provincia?: string;
    municipio?: string;
    bairro?: string;
    categoria?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Buscar dados do usuário no banco
                const { data: userData } = await supabase
                    .from('users')
                    .select(`
                        id,
                        email,
                        role,
                        permissions,
                        church_id,
                        member:member_id (
                            name,
                            phone
                        )
                    `)
                    .eq('id', session.user.id)
                    .single();

                if (userData) {
                    // Buscar nome da igreja
                    const { data: churchData } = await supabase
                        .from('churches')
                        .select('name')
                        .eq('id', (userData as any).church_id)
                        .single();

                    const userInfo: User = {
                        id: (userData as any).id,
                        email: (userData as any).email,
                        fullName: (userData as any).member?.name || 'Usuário',
                        churchName: (churchData && (churchData as any).name) || 'Igreja',
                        churchId: (userData as any).church_id,
                        phone: (userData as any).member?.phone,
                        role: (userData as any).role as UserRole,
                        permissions: getPermissionsByRole((userData as any).role as UserRole, (userData as any).permissions)
                    };

                    setUser(userInfo);
                    localStorage.setItem('thronus_user', JSON.stringify(userInfo));
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (emailOrPhone: string, password: string): Promise<boolean> => {
        setLoading(true);

        try {
            // Login com Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailOrPhone,
                password: password,
            });

            if (error) {
                console.error('Login error:', error);
                setLoading(false);
                return false;
            }

            if (data.user) {
                await checkSession();
                return true;
            }

            setLoading(false);
            return false;
        } catch (error) {
            console.error('Login exception:', error);
            setLoading(false);
            return false;
        }
    };

    const signup = async (data: SignupData): Promise<boolean> => {
        setLoading(true);

        try {
            // 1. Criar usuário no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
            });

            if (authError) {
                console.error('Auth signup error:', authError);
                setLoading(false);
                return false;
            }

            if (!authData.user) {
                console.error('No user returned from signup');
                setLoading(false);
                return false;
            }

            // 2. Preparar dados para a RPC
            const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const slug = (data.sigla || data.churchName)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '') + '-' + randomSuffix;

            // 3. Chamar a função segura de cadastro (RPC)
            // @ts-ignore - RPC types are not properly inferred
            const { data: rpcData, error: rpcError } = await supabase.rpc('complete_signup', {
                p_user_id: authData.user.id,
                p_email: data.email,
                p_church_name: data.churchName,
                p_church_slug: slug,
                p_phone: data.phone || '',
                p_address: data.endereco || '',
                p_neighborhood: data.bairro || '',
                p_district: data.municipio || '',
                p_province: data.provincia || '',
                p_settings: {
                    sigla: data.sigla,
                    denominacao: data.denominacao,
                    nif: data.nif,
                    categoria: data.categoria
                },
                p_full_name: data.fullName
            } as any);

            if (rpcError) {
                console.error('RPC Signup error:', rpcError);
                // Tenta limpar o usuário do Auth se a criação dos dados falhar
                await supabase.auth.signOut();
                setLoading(false);
                return false;
            }

            if (rpcData && !(rpcData as any).success) {
                console.error('RPC Signup logic error:', (rpcData as any).error);
                setLoading(false);
                return false;
            }

            // 4. Finalização
            // Se tivermos sessão (email confirmado ou auto-confirm), atualizamos o estado local.
            if (authData.session) {
                await checkSession();
            }

            setLoading(false);
            return true;

        } catch (error) {
            console.error('Signup exception:', error);
            setLoading(false);
            return false;
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('thronus_user');
    };

    const getPermissionsByRole = (role: UserRole, customPermissions?: any): string[] => {
        // Se houver permissões customizadas, usar elas
        if (customPermissions && Object.keys(customPermissions).length > 0) {
            return Object.keys(customPermissions).filter(key => customPermissions[key] === true);
        }

        // Permissões padrão por role
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
