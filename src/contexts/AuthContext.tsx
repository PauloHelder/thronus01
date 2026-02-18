import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'leader' | 'member' | 'supervisor' | string;

export interface User {
    id: string;
    email: string;
    fullName: string;
    churchName: string;
    churchId: string;
    churchSlug: string;
    phone?: string;
    role: UserRole; // Primary role
    roles: string[]; // All roles
    permissions: string[]; // Computed permissions
    churchSettings?: any;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (emailOrPhone: string, password: string) => Promise<boolean>;
    signup: (data: SignupData) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
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

    // Check for existing session on mount & Listen for Auth Changes
    useEffect(() => {
        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth Event (Global):", event);

            if (event === 'PASSWORD_RECOVERY') {
                // Force redirect to reset password page
                // Using hash directly since we are using HashRouter
                window.location.hash = '/reset-password';
            }

            if (event === 'SIGNED_IN') {
                checkSession();
            }
            if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('thronus_user');
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
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
                    const { data: churchData } = await supabase
                        .from('churches')
                        .select('name, slug, settings')
                        .eq('id', (userData as any).church_id)
                        .single();

                    const dbPermissions = (userData as any).permissions || {};
                    // Determine roles: use permissions.roles if available, else single role
                    const primaryRole = (userData as any).role as string;
                    const roles: string[] = dbPermissions.roles && Array.isArray(dbPermissions.roles) && dbPermissions.roles.length > 0
                        ? dbPermissions.roles
                        : [primaryRole];

                    // Computed permissions based on church settings
                    const churchSettings = (churchData as any)?.settings || {};
                    const rolePermissionsMap = churchSettings.role_permissions || {};

                    // Default permissions if setting is missing (fallback)
                    const defaultPermissions: Record<string, string[]> = {
                        'supervisor': ['members_view', 'members_edit', 'members_create', 'groups_view', 'groups_create', 'groups_edit', 'groups_delete', 'discipleship_view', 'discipleship_create', 'discipleship_edit', 'events_view', 'events_create', 'events_edit', 'events_delete', 'departments_view', 'departments_edit', 'departments_create', 'teaching_view', 'teaching_create', 'teaching_edit', 'services_view', 'services_create', 'services_edit', 'assets_view', 'assets_create', 'assets_edit', 'assets_delete'],
                        'leader': ['members_view', 'members_edit', 'groups_view', 'groups_create', 'groups_edit', 'discipleship_view', 'discipleship_create', 'discipleship_edit', 'events_view', 'events_create', 'events_edit', 'departments_edit', 'departments_create', 'teaching_view', 'teaching_create', 'teaching_edit', 'services_view', 'services_create', 'services_edit', 'assets_view', 'assets_create', 'assets_edit'],
                        'member': ['members_view', 'groups_view', 'discipleship_view', 'events_view', 'services_view', 'teaching_view', 'assets_view']
                    };

                    const computedPermissions = new Set<string>();

                    roles.forEach(r => {
                        let perms: string[] = [];
                        if (r === 'admin' || r === 'superuser') perms = ['all'];
                        else if (rolePermissionsMap[r]) {
                            perms = rolePermissionsMap[r];
                        } else if (defaultPermissions[r]) {
                            perms = defaultPermissions[r];
                        }

                        perms.forEach(p => computedPermissions.add(p));
                    });

                    const userInfo: User = {
                        id: (userData as any).id,
                        email: (userData as any).email,
                        fullName: (userData as any).member?.name || 'Usuário',
                        churchName: (churchData && (churchData as any).name) || 'Igreja',
                        churchId: (userData as any).church_id,
                        churchSlug: (churchData && (churchData as any).slug) || '',
                        phone: (userData as any).member?.phone,
                        role: primaryRole,
                        roles: roles,
                        permissions: Array.from(computedPermissions),
                        churchSettings: churchSettings
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

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (user.roles.includes('admin') || user.roles.includes('superuser') || user.permissions.includes('all')) return true;

        // Simple permission check
        if (user.permissions.includes(permission)) return true;

        return false;
    };

    const hasRole = (role: string): boolean => {
        if (!user) return false;
        // Admin has all roles conceptually? Maybe not for specific logic.
        return user.roles.includes(role);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            signup,
            logout,
            loading,
            hasPermission,
            hasRole
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
