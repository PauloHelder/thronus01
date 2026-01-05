import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { Search, Shield, UserCog, Mail, Phone, Trash2, Plus, Copy, Check, Eye, EyeOff, ChevronDown, X } from 'lucide-react';
import Modal from '../components/Modal';
import { useMembers } from '../hooks/useMembers';

interface SystemUser {
    id: string;
    email: string;
    role: string;
    permissions: { roles?: string[];[key: string]: any };
    created_at: string;
    member?: {
        name: string;
        avatar_url: string | null;
        phone: string | null;
    };
}

// Simple MultiSelect Component
const MultiSelect = ({ options, selected, onChange, placeholder = "Selecione..." }: {
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter(item => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none flex items-center justify-between cursor-pointer min-h-[42px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1">
                    {selected.length === 0 ? (
                        <span className="text-gray-400">{placeholder}</span>
                    ) : (
                        selected.map(val => {
                            const opt = options.find(o => o.value === val);
                            return (
                                <span key={val} className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                    {opt?.label || val}
                                    <span
                                        className="cursor-pointer hover:text-orange-900"
                                        onClick={(e) => { e.stopPropagation(); toggleOption(val); }}
                                    >
                                        &times;
                                    </span>
                                </span>
                            );
                        })
                    )}
                </div>
                <ChevronDown size={16} className="text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {options.map(option => (
                        <div
                            key={option.value}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                            onClick={() => toggleOption(option.value)}
                        >
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${selected.includes(option.value) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                                }`}>
                                {selected.includes(option.value) && <Check size={12} className="text-white" />}
                            </div>
                            <span className="text-sm text-slate-700">{option.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Simple Single Select with Search
const SingleSearchableSelect = ({ options, value, onChange, placeholder = "Selecione..." }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative" ref={containerRef}>
            <div
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none flex items-center justify-between cursor-pointer min-h-[42px]"
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSearchTerm(''); // Reset search on open
                }}
            >
                <span className={selectedOption ? 'text-slate-800' : 'text-slate-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 flex flex-col">
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white rounded-t-lg">
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-md border border-gray-200">
                            <Search size={14} className="text-gray-400" />
                            <input
                                type="text"
                                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center">
                                Nenhum resultado encontrado
                            </div>
                        ) : (
                            filteredOptions.map(option => (
                                <div
                                    key={option.value}
                                    className={`px-4 py-2 hover:bg-orange-50 cursor-pointer flex items-center justify-between transition-colors ${option.value === value ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-700'
                                        }`}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span>{option.label}</span>
                                    {option.value === value && <Check size={14} className="text-orange-600" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');

    const [invites, setInvites] = useState<any[]>([]);

    // Custom roles
    const [customRoles, setCustomRoles] = useState<string[]>([]);

    useEffect(() => {
        if (currentUser?.churchSettings?.custom_system_roles) {
            setCustomRoles(currentUser.churchSettings.custom_system_roles);
        } else {
            setCustomRoles([]);
        }
    }, [currentUser]);

    const { members } = useMembers();
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const [linkToMember, setLinkToMember] = useState(true);

    const availableMembers = members.filter(m => !users.some(u => u.email === m.email)); // Improved filtering based on email uniqueness


    const formatRoleName = (role: string) => {
        if (role === 'admin') return 'Administrador';
        if (role === 'supervisor') return 'Supervisor';
        if (role === 'leader') return 'Líder';
        if (role === 'member') return 'Membro';
        return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
    };

    const getRoleOptions = () => {
        const baseRoles = [
            { value: 'member', label: 'Membro' },
            { value: 'leader', label: 'Líder' },
            { value: 'supervisor', label: 'Supervisor' },
            { value: 'admin', label: 'Administrador' }
        ];
        const custom = customRoles.map(r => ({ value: r, label: formatRoleName(r) }));
        // Filter based on current user permissions
        const userRole = currentUser?.role || 'member';
        let allowed = baseRoles;

        if (userRole === 'leader') allowed = baseRoles.filter(r => r.value === 'member');
        if (userRole === 'supervisor') allowed = baseRoles.filter(r => r.value === 'member' || r.value === 'leader');
        // Admin sees all base + custom
        if (userRole === 'admin' || userRole === 'superuser') return [...baseRoles, ...custom];

        return [...allowed];
    };

    // Fetch users AND invites from Supabase
    const fetchUsers = useCallback(async () => {
        if (!currentUser?.churchId) return;
        setLoading(true);
        try {
            // Fetch Users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select(`
                    *,
                    member:members(name, avatar_url, phone)
                `)
                .eq('church_id', currentUser.churchId);

            if (userError) throw userError;
            setUsers(userData || []);

            // Fetch Invites (Legacy support or for reference)
            const { data: inviteData, error: inviteError } = await supabase
                .from('user_invites')
                .select('*')
                .eq('church_id', currentUser.churchId)
                .order('created_at', { ascending: false });

            if (inviteError) throw inviteError;
            setInvites(inviteData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Erro ao carregar dados. Verifique o console.');
        } finally {
            setLoading(false);
        }
    }, [currentUser?.churchId]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRolesChange = async (userId: string, newRoles: string[]) => {
        if (userId === currentUser?.id) {
            alert('Você não pode alterar seu próprio nível de acesso.');
            return;
        }

        if (newRoles.length === 0) {
            alert('O usuário deve ter pelo menos uma função.');
            return;
        }

        // Primary role (for backward compatibility) is the 'highest' or first one
        // Hierarchy: admin > supervisor > leader > others > member
        const roleHierarchy = ['admin', 'supervisor', 'leader'];
        let primaryRole = newRoles.find(r => roleHierarchy.includes(r)) || newRoles[0];

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    role: primaryRole,
                    permissions: { roles: newRoles }
                })
                .eq('id', userId);

            if (error) throw error;

            // Optimistic update
            setUsers(users.map(u =>
                u.id === userId ? {
                    ...u,
                    role: primaryRole,
                    permissions: { ...u.permissions, roles: newRoles }
                } : u
            ));
        } catch (err) {
            console.error('Error updating roles:', err);
            alert('Erro ao atualizar funções.');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (userId === currentUser?.id) {
            alert('Você não pode excluir sua própria conta.');
            return;
        }

        if (window.confirm('Tem certeza que deseja remover o acesso deste usuário? Esta ação não pode ser desfeita.')) {
            try {
                // Determine if we are deleting from public.users or actually deleting the auth user
                // Usually deleting public.users removes access to this tenant.
                // NOTE: Deleting auth.users requires Service Role/Admin API.
                // Here we usually just delete the record from public.users which revokes app access.

                const { error } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', userId);

                if (error) throw error;

                setUsers(users.filter(u => u.id !== userId));
            } catch (err) {
                console.error('Error deleting user:', err);
                alert('Erro ao remover usuário.');
            }
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'supervisor': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'leader': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'member': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-teal-100 text-teal-700 border-teal-200';
        }
    };

    const filteredUsers = users.filter(u => {
        const name = u.member?.name || 'Usuário Sem Nome';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());

        // Check if user has the selected role in their 'roles' array (permissions.roles or single role)
        const userRoles = u.permissions?.roles || [u.role];
        const matchesRole = filterRole === 'all' || userRoles.includes(filterRole);

        return matchesSearch && matchesRole;
    });

    const [showUserModal, setShowUserModal] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPhone, setNewUserPhone] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // const [newUserRole, setNewUserRole] = useState('member'); // REPLACED
    const [newUserRoles, setNewUserRoles] = useState<string[]>(['member']);
    const [creatingUser, setCreatingUser] = useState(false);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingUser(true);

        if (newUserRoles.length === 0) {
            alert('Selecione pelo menos uma função.');
            setCreatingUser(false);
            return;
        }

        // Validation
        if (newUserPassword.length < 6) {
            alert('A senha deve ter no mínimo 6 caracteres.');
            setCreatingUser(false);
            return;
        }

        try {
            // 1. Create temporary separate client to avoid logging out current user
            const memoryStorage = {
                getItem: () => null,
                setItem: () => { },
                removeItem: () => { }
            };

            const tempClient = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false,
                        storage: memoryStorage
                    }
                }
            );

            // 2. Sign Up User (Creates auth.users record)
            let userId: string | undefined;

            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: newUserEmail,
                password: newUserPassword,
                options: {
                    data: {
                        name: newUserName
                    }
                }
            });

            if (authError) {
                if (authError.message?.includes('already registered')) {
                    console.log('User already registered. Attempting recovery...');
                    const { data: signInData, error: signInError } = await tempClient.auth.signInWithPassword({
                        email: newUserEmail,
                        password: newUserPassword
                    });

                    if (signInError) {
                        throw new Error('Este email já está registrado (e a senha não confere).');
                    }

                    if (signInData.user) {
                        userId = signInData.user.id;
                    }
                } else {
                    throw authError; // Rethrow other errors
                }
            } else {
                if (!authData.user) throw new Error('Falha ao criar usuário (sem dados retornados).');
                userId = authData.user.id;
            }

            if (!userId) throw new Error('Falha ao identificar ID do usuário.');

            // Determine Primary Role
            const roleHierarchy = ['admin', 'supervisor', 'leader'];
            let primaryRole = newUserRoles.find(r => roleHierarchy.includes(r)) || newUserRoles[0];

            // 3. Create Public User Entry + Member Entry via RPC
            // This function creates the user row and sets the 'role' column.
            // @ts-ignore
            const { error: rpcError } = await supabase.rpc('admin_create_user_entry', {
                p_user_id: userId,
                p_email: newUserEmail,
                p_role: primaryRole,
                p_name: newUserName,
                p_phone: newUserPhone || null,
                p_member_id: (linkToMember && selectedMemberId) ? selectedMemberId : null
            });

            if (rpcError) throw rpcError;

            // 4. Update the permissions column to include ALL roles
            const { error: updateError } = await supabase
                .from('users')
                .update({ permissions: { roles: newUserRoles } })
                .eq('id', userId);

            if (updateError) console.error("Error saving multiple roles:", updateError);

            // Success
            alert('Usuário criado (ou vinculado) com sucesso!');
            setShowUserModal(false);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPhone('');
            setNewUserPassword('');
            setNewUserRoles(['member']);
            fetchUsers();

        } catch (err: any) {
            console.error('Error creating user:', err);
            // Show more specific error messages
            let msg = err.message || 'Erro desconhecido';
            if (err.code === '23505') msg = 'Este email já está em uso.';
            if (msg.includes('already registered')) msg = 'Este email já está registrado no sistema.';
            alert('Erro ao criar usuário: ' + msg);
        } finally {
            setCreatingUser(false);
        }
    };

    if (currentUser?.role !== 'admin' && currentUser?.role !== 'superuser' && currentUser?.role !== 'supervisor' && currentUser?.role !== 'leader') {
        return (
            <div className="p-8 text-center">
                <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
                <p className="text-slate-600">Você não tem permissão para acessar esta página.</p>
            </div>
        );
    }

    const canCreateAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superuser';

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Gestão de Usuários</h1>
                    <p className="text-slate-600 mt-1">Gerencie o acesso e permissões dos usuários do sistema</p>
                </div>
                {canCreateAdmin && (
                    <button
                        onClick={() => setShowUserModal(true)}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Novo Usuário
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="all">Todas as Funções</option>
                            <option value="admin">Administrador</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="leader">Líder</option>
                            <option value="member">Membro</option>
                            {customRoles.map(role => (
                                <option key={role} value={role}>{formatRoleName(role)}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Usuários Ativos</h3>
                    <span className="text-sm text-slate-500">{filteredUsers.length} usuários</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase">
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Contato</th>
                                <th className="px-6 py-4">Funções</th>
                                <th className="px-6 py-4">Data de Cadastro</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Carregando usuários...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <UserCog size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-slate-600">Nenhum usuário encontrado</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => {
                                    const userRoles = u.permissions?.roles || [u.role];
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                                                        {u.member?.avatar_url ? (
                                                            <img src={u.member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            (u.member?.name?.[0] || u.email[0]).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{u.member?.name || 'Usuário do Sistema'}</p>
                                                        <p className="text-xs text-slate-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <span>{u.member?.phone || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {userRoles.map(role => (
                                                        <span key={role} className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(role)}`}>
                                                            {formatRoleName(role)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {canCreateAdmin ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Multi Role Edit */}
                                                        <div className="w-48">
                                                            <MultiSelect
                                                                options={getRoleOptions()}
                                                                selected={userRoles}
                                                                onChange={(newRoles) => handleRolesChange(u.id, newRoles)}
                                                            />
                                                        </div>

                                                        <button
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Remover Acesso"
                                                            disabled={u.id === currentUser?.id}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-400 italic">Somente leitura</div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Modal (Now Create User Modal) */}
            <Modal
                isOpen={showUserModal}
                onClose={() => setShowUserModal(false)}
                title="Novo Usuário"
            >
                <form onSubmit={handleCreateUser} className="space-y-4">
                    {/* Toggle Mode */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                        <button
                            type="button"
                            onClick={() => setLinkToMember(true)}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${linkToMember ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Vincular a Membro
                        </button>
                        <button
                            type="button"
                            onClick={() => setLinkToMember(false)}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!linkToMember ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Criar Novo Perfil
                        </button>
                    </div>

                    {linkToMember ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Membro</label>
                            <SingleSearchableSelect
                                options={availableMembers.map(m => ({
                                    value: m.id,
                                    label: `${m.name} ${m.email ? `(${m.email})` : ''}`
                                }))}
                                value={selectedMemberId}
                                onChange={(mId) => {
                                    setSelectedMemberId(mId);
                                    const member = members.find(m => m.id === mId);
                                    if (member) {
                                        setNewUserName(member.name);
                                        setNewUserEmail(member.email || '');
                                        setNewUserPhone(member.phone || '');
                                    }
                                }}
                                placeholder="Selecione um membro..."
                            />
                            <p className="text-xs text-slate-500 mt-1">Isso criará um usuário vinculado ao registro de membro existente.</p>
                        </div>
                    ) : (
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-4">
                            <p className="text-sm text-orange-800 flex items-center gap-2">
                                <UserCog size={16} />
                                Um novo perfil de membro será criado automaticamente.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <input
                            type="text"
                            required
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            // ReadOnly if linking to member to prevent mismatch? Or allow edit?
                            // Allowing edit might be confusing if it doesn't update member.
                            // Let's allow edit but it's mainly for the Auth User.
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="Nome Completo"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="email@exemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (Opcional)</label>
                        <input
                            type="tel"
                            value={newUserPhone}
                            onChange={(e) => setNewUserPhone(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="+244 900 000 000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Senha Inicial</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="******"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Funções</label>
                        <MultiSelect
                            options={getRoleOptions()}
                            selected={newUserRoles}
                            onChange={setNewUserRoles}
                            placeholder="Selecione as funções"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowUserModal(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={creatingUser}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2"
                        >
                            {creatingUser ? 'Criando...' : 'Criar Usuário'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
