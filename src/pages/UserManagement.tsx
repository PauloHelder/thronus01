import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Search, Filter, Trash2, Shield, UserCog, Mail, Phone } from 'lucide-react';

interface SystemUser {
    id: string;
    email: string;
    fullName: string;
    churchName: string;
    phone?: string;
    role: string; // Changed from UserRole to string to support custom roles
    createdAt?: string;
    isActive?: boolean;
}

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [customRoles, setCustomRoles] = useState<string[]>([]);

    useEffect(() => {
        // Fetch users and custom roles from localStorage
        const storedUsers = JSON.parse(localStorage.getItem('thronus_users') || '[]');
        const storedRoles = JSON.parse(localStorage.getItem('thronus_custom_roles') || '[]');
        setUsers(storedUsers);
        setCustomRoles(storedRoles);
    }, []);

    const handleRoleChange = (userId: string, newRole: string) => {
        if (userId === currentUser?.id) {
            alert('Você não pode alterar seu próprio nível de acesso.');
            return;
        }

        const updatedUsers = users.map(u =>
            u.id === userId ? { ...u, role: newRole } : u
        );

        setUsers(updatedUsers);
        localStorage.setItem('thronus_users', JSON.stringify(updatedUsers));
    };

    const handleToggleActive = (userId: string) => {
        if (userId === currentUser?.id) {
            alert('Você não pode desativar sua própria conta.');
            return;
        }

        const updatedUsers = users.map(u =>
            u.id === userId ? { ...u, isActive: u.isActive === false ? true : false } : u
        );

        setUsers(updatedUsers);
        localStorage.setItem('thronus_users', JSON.stringify(updatedUsers));
    };

    const handleDeleteUser = (userId: string) => {
        if (userId === currentUser?.id) {
            alert('Você não pode excluir sua própria conta.');
            return;
        }

        if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            const updatedUsers = users.filter(u => u.id !== userId);
            setUsers(updatedUsers);
            localStorage.setItem('thronus_users', JSON.stringify(updatedUsers));
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'leader': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'member': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'Administrador';
            case 'leader': return 'Líder';
            case 'member': return 'Membro';
            default: return role;
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    if (currentUser?.role !== 'admin' && currentUser?.role !== 'superuser') {
        return (
            <div className="p-8 text-center">
                <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
                <p className="text-slate-600">Você não tem permissão para acessar esta página.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Gestão de Usuários</h1>
                    <p className="text-slate-600 mt-1">Gerencie o acesso e permissões dos usuários do sistema</p>
                </div>
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
                            <option value="leader">Líder</option>
                            <option value="member">Membro</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase">
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Contato</th>
                                <th className="px-6 py-4">Função</th>
                                <th className="px-6 py-4">Data de Cadastro</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg">
                                                {user.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{user.fullName}</p>
                                                <p className="text-xs text-slate-500">{user.churchName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Mail size={14} />
                                                <span>{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Phone size={14} />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border outline-none cursor-pointer ${getRoleBadgeColor(user.role)}`}
                                            disabled={user.id === currentUser?.id}
                                        >
                                            <option value="admin">Administrador</option>
                                            <option value="leader">Líder</option>
                                            <option value="member">Membro</option>
                                            {customRoles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleToggleActive(user.id)}
                                                disabled={user.id === currentUser?.id}
                                                className={`p-2 rounded-lg transition-colors ${user.isActive !== false
                                                    ? 'text-green-600 hover:bg-green-50'
                                                    : 'text-gray-400 hover:bg-gray-100'
                                                    } ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={user.isActive !== false ? "Desativar Usuário" : "Ativar Usuário"}
                                            >
                                                {user.isActive !== false ? <Shield size={18} /> : <Shield size={18} className="text-gray-400" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={user.id === currentUser?.id}
                                                className={`p-2 rounded-lg transition-colors ${user.id === currentUser?.id
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                                    }`}
                                                title="Excluir Usuário"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <UserCog size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-slate-600">Nenhum usuário encontrado</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
