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
                        .eq('id', userData.church_id)
                        .single();

                    const userInfo: User = {
                        id: userData.id,
                        email: userData.email,
                        fullName: userData.member?.name || 'Usuário',
                        churchName: churchData?.name || 'Igreja',
                        churchId: userData.church_id,
                        phone: userData.member?.phone,
                        role: userData.role as UserRole,
                        permissions: getPermissionsByRole(userData.role as UserRole, userData.permissions)
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
                setLoading(false);
                return false;
            }

            // 2. Criar slug da igreja (nome sem espaços e minúsculas)
            const slug = (data.sigla || data.churchName)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            // 3. Criar igreja no banco
            const { data: churchData, error: churchError } = await supabase
                .from('churches')
                .insert({
                    name: data.churchName,
                    slug: slug,
                    email: data.email,
                    phone: data.phone,
                    address: data.endereco,
                    neighborhood: data.bairro,
                    district: data.municipio,
                    province: data.provincia,
                    plan_id: '00000000-0000-0000-0000-000000000001', // Plano Free por padrão
                    subscription_status: 'trial',
                    settings: {
                        sigla: data.sigla,
                        denominacao: data.denominacao,
                        nif: data.nif,
                        categoria: data.categoria
                    }
                })
                .select()
                .single();

            if (churchError) {
                console.error('Church creation error:', churchError);
                // Deletar usuário do Auth se falhar
                await supabase.auth.admin.deleteUser(authData.user.id);
                setLoading(false);
                return false;
            }

            // 4. Criar membro (pastor) no banco
            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .insert({
                    church_id: churchData.id,
                    name: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    status: 'Active',
                    church_role: 'Pastor',
                    is_baptized: true
                })
                .select()
                .single();

            if (memberError) {
                console.error('Member creation error:', memberError);
                setLoading(false);
                return false;
            }

            // 5. Criar registro de usuário vinculando ao Auth e à igreja
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    church_id: churchData.id,
                    member_id: memberData.id,
                    email: data.email,
                    role: 'admin',
                    permissions: {}
                });

            if (userError) {
                console.error('User record creation error:', userError);
                setLoading(false);
                return false;
            }

            // 6. Criar departamentos padrão
            await supabase.from('departments').insert([
                {
                    church_id: churchData.id,
                    name: 'Secretaria',
                    icon: 'FileText',
                    description: 'Departamento responsável pela administração e documentação',
                    is_default: true
                },
                {
                    church_id: churchData.id,
                    name: 'Finanças',
                    icon: 'DollarSign',
                    description: 'Departamento responsável pela gestão financeira',
                    is_default: true
                },
                {
                    church_id: churchData.id,
                    name: 'Louvor',
                    icon: 'Music',
                    description: 'Departamento de música e louvor',
                    is_default: true
                }
            ]);

            // 7. Criar categorias financeiras padrão
            await supabase.from('transaction_categories').insert([
                { church_id: churchData.id, name: 'Dízimos', type: 'Income', is_system: true },
                { church_id: churchData.id, name: 'Ofertas', type: 'Income', is_system: true },
                { church_id: churchData.id, name: 'Doações', type: 'Income', is_system: true },
                { church_id: churchData.id, name: 'Aluguel', type: 'Expense', is_system: true },
                { church_id: churchData.id, name: 'Água e Luz', type: 'Expense', is_system: true },
                { church_id: churchData.id, name: 'Salários', type: 'Expense', is_system: true }
            ]);

            // 8. Criar estágios cristãos padrão
            await supabase.from('christian_stages').insert([
                { church_id: churchData.id, name: 'Novo Convertido', order_index: 1 },
                { church_id: churchData.id, name: 'Discípulo', order_index: 2 },
                { church_id: churchData.id, name: 'Obreiro', order_index: 3 },
                { church_id: churchData.id, name: 'Líder', order_index: 4 }
            ]);

            // 9. Criar categorias de ensino padrão
            await supabase.from('teaching_categories').insert([
                { church_id: churchData.id, name: 'Homogenia' },
                { church_id: churchData.id, name: 'Adultos' },
                { church_id: churchData.id, name: 'Jovens' },
                { church_id: churchData.id, name: 'Adolescentes' },
                { church_id: churchData.id, name: 'Crianças' }
            ]);

            // 10. Auto-login após signup
            await checkSession();
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
