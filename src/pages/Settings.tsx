import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Wallet, Building, Users, BookOpen, ShieldCheck, Check, Calendar, Pencil } from 'lucide-react';
import { TransactionCategory, ChristianStage, TeachingCategory } from '../types';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { MOCK_CATEGORIES } from '../mocks/finance';
import { DEFAULT_CHRISTIAN_STAGES, DEFAULT_TEACHING_CATEGORIES } from '../data/teachingDefaults';
import { useFinance } from '../hooks/useFinance';
import { useTeaching } from '../hooks/useTeaching';
import AccountModal from '../components/modals/AccountModal';
import EventTypesSettings from '../components/settings/EventTypesSettings';

const MODULES = [
    { id: 'members', label: 'Membros' },
    { id: 'services', label: 'Cultos' },
    { id: 'groups', label: 'Grupos' },
    { id: 'finances', label: 'Finanças' },
    { id: 'teaching', label: 'Ensino' },
    { id: 'events', label: 'Eventos' },
    { id: 'departments', label: 'Departamentos' },
    { id: 'discipleship', label: 'Discipulado' },
];

const ACTIONS = [
    { id: 'view', label: 'Visualizar' },
    { id: 'create', label: 'Criar' },
    { id: 'edit', label: 'Editar' },
    { id: 'delete', label: 'Excluir' },
];

const Settings: React.FC = () => {
    const { serviceTypes, loading: loadingTypes, createServiceType, updateServiceType, deleteServiceType } = useServiceTypes();
    const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(undefined);
    const [activeTab, setActiveTab] = useState('financial');

    const handleSaveAccount = async (data: any) => {
        if (editingAccount) {
            return await updateAccount(editingAccount.id, data);
        } else {
            return await addAccount(data);
        }
    };

    const openNewAccountModal = () => {
        setEditingAccount(undefined);
        setIsAccountModalOpen(true);
    };

    const openEditAccountModal = (account: any) => {
        setEditingAccount(account);
        setIsAccountModalOpen(true);
    };

    // ... (rest of the code)



    // ... (inside render)


    const [newServiceTypeName, setNewServiceTypeName] = useState('');
    const [newServiceTypeTime, setNewServiceTypeTime] = useState('');
    const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
    const [editingTypeName, setEditingTypeName] = useState('');
    const [editingTypeTime, setEditingTypeTime] = useState('');
    const [categories, setCategories] = useState<TransactionCategory[]>(MOCK_CATEGORIES);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<'Income' | 'Expense'>('Income');

    // Teaching settings
    const {
        stages,
        categories: teachingCategories,
        addStage,
        deleteStage,
        addCategory: addTeachingCategoryFunc,
        deleteCategory: deleteTeachingCategoryFunc
    } = useTeaching();
    // const [stages, setStages] = useState<ChristianStage[]>(DEFAULT_CHRISTIAN_STAGES);
    // const [teachingCategories, setTeachingCategories] = useState<TeachingCategory[]>(DEFAULT_TEACHING_CATEGORIES);
    const [newStageName, setNewStageName] = useState('');
    const [newTeachingCategoryName, setNewTeachingCategoryName] = useState('');

    // Role settings
    const [selectedRole, setSelectedRole] = useState<string>('leader');
    const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // Church roles (ecclesiastical functions)
    const [churchRoles, setChurchRoles] = useState<string[]>([]);
    const [newChurchRole, setNewChurchRole] = useState('');

    useEffect(() => {
        // Load permissions and custom roles from localStorage
        const storedPermissions = localStorage.getItem('thronus_role_permissions');
        const storedChurchRoles = localStorage.getItem('thronus_church_roles');

        if (storedPermissions) {
            setRolePermissions(JSON.parse(storedPermissions));
        } else {
            // Default permissions
            setRolePermissions({
                'leader': ['members_view', 'members_edit', 'events_create', 'events_edit', 'departments_edit'],
                'member': ['members_view', 'events_view', 'services_view']
            });
        }

        if (storedChurchRoles) {
            setChurchRoles(JSON.parse(storedChurchRoles));
        }
    }, []);

    const handleAddChurchRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChurchRole.trim()) return;

        const updatedChurchRoles = [...churchRoles, newChurchRole];
        setChurchRoles(updatedChurchRoles);
        localStorage.setItem('thronus_church_roles', JSON.stringify(updatedChurchRoles));
        setNewChurchRole('');
    };

    const handleDeleteChurchRole = (roleToDelete: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a função "${roleToDelete}"?`)) {
            const updatedChurchRoles = churchRoles.filter(r => r !== roleToDelete);
            setChurchRoles(updatedChurchRoles);
            localStorage.setItem('thronus_church_roles', JSON.stringify(updatedChurchRoles));
        }
    };

    const handlePermissionToggle = (role: string, module: string, action: string) => {
        const permissionKey = `${module}_${action}`;
        const currentPermissions = rolePermissions[role] || [];

        let newPermissions;
        if (currentPermissions.includes(permissionKey)) {
            newPermissions = currentPermissions.filter(p => p !== permissionKey);
        } else {
            newPermissions = [...currentPermissions, permissionKey];
        }

        setRolePermissions({
            ...rolePermissions,
            [role]: newPermissions
        });
    };

    const savePermissions = () => {
        localStorage.setItem('thronus_role_permissions', JSON.stringify(rolePermissions));
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
    };

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        const newCategory: TransactionCategory = {
            id: crypto.randomUUID(),
            name: newCategoryName,
            type: newCategoryType,
            isSystem: false
        };

        setCategories([...categories, newCategory]);
        setNewCategoryName('');
    };

    const handleDeleteCategory = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Configurações</h1>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar de Navegação */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'general'
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-slate-600 hover:bg-gray-50'
                                }`}
                        >
                            <Building size={18} />
                            Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'financial'
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-slate-600 hover:bg-gray-50'
                                }`}
                        >
                            <Wallet size={18} />
                            Financeiro
                        </button>
                        <button
                            onClick={() => setActiveTab('teaching')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'teaching'
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-slate-600 hover:bg-gray-50'
                                }`}
                        >
                            <BookOpen size={18} />
                            Ensino
                        </button>
                        <button
                            onClick={() => setActiveTab('event-types')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'event-types'
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-slate-600 hover:bg-gray-50'
                                }`}
                        >
                            <Calendar size={18} />
                            Tipos de Evento
                        </button>
                        <button
                            onClick={() => setActiveTab('service-types')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'service-types'
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-slate-600 hover:bg-gray-50'
                                }`}
                        >
                            <Calendar size={18} />
                            Tipos de Culto
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'roles'
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-slate-600 hover:bg-gray-50'
                                }`}
                        >
                            <ShieldCheck size={18} />
                            Funções e Permissões
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'users'
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-slate-600 hover:bg-gray-50'
                                }`}
                        >
                            <Users size={18} />
                            Usuários
                        </button>
                    </nav>
                </div>

                {/* Conteúdo Principal */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    {activeTab === 'general' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Building className="text-slate-400" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-slate-800 mb-2">Configurações Gerais</h3>
                            <p className="text-slate-500 max-w-md">
                                As configurações de localização agora estão no Perfil da Igreja.
                                As funções eclesiásticas foram movidas para a aba "Funções e Permissões".
                            </p>
                        </div>
                    )}

                    {activeTab === 'event-types' && (
                        <div>
                            <EventTypesSettings />
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Categorias Financeiras</h2>
                            <p className="text-sm text-slate-500 mb-6">Gerencie os tipos de receitas e despesas disponíveis para lançamento.</p>

                            {/* Formulário de Adição */}
                            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome da Categoria</label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Ex: Venda de Livros"
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                <div className="w-full sm:w-40">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                                    <select
                                        value={newCategoryType}
                                        onChange={(e) => setNewCategoryType(e.target.value as 'Income' | 'Expense')}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    >
                                        <option value="Income">Receita</option>
                                        <option value="Expense">Despesa</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        disabled={!newCategoryName.trim()}
                                        className="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Adicionar
                                    </button>
                                </div>
                            </form>

                            {/* Lista de Categorias */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Receitas
                                    </h3>
                                    <div className="space-y-2">
                                        {categories.filter(c => c.type === 'Income').map(category => (
                                            <div key={category.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 group">
                                                <span className="text-sm text-slate-700">{category.name}</span>
                                                {category.isSystem ? (
                                                    <span className="text-xs text-slate-400 italic">Padrão do sistema</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDeleteCategory(category.id)}
                                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        Despesas
                                    </h3>
                                    <div className="space-y-2">
                                        {categories.filter(c => c.type === 'Expense').map(category => (
                                            <div key={category.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 group">
                                                <span className="text-sm text-slate-700">{category.name}</span>
                                                {category.isSystem ? (
                                                    <span className="text-xs text-slate-400 italic">Padrão do sistema</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDeleteCategory(category.id)}
                                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Contas Bancárias e Caixas */}
                            <div className="mt-10 pt-10 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Contas e Caixas</h2>
                                        <p className="text-sm text-slate-500">Gerencie suas contas bancárias e caixas físicos.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsAccountModalOpen(true)}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Nova Conta
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {accounts.map(account => (
                                        <div key={account.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                                                    style={{ backgroundColor: account.color }}
                                                >
                                                    {account.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-slate-800">{account.name}</h4>
                                                    <p className="text-xs text-slate-500 capitalize">
                                                        {account.type === 'bank' ? 'Conta Bancária' : account.type === 'cash' ? 'Caixa Físico' : 'Investimento'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditAccountModal(account)}
                                                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
                                                            deleteAccount(account.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {accounts.length === 0 && (
                                        <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                            <p className="text-slate-500 text-sm">Nenhuma conta cadastrada.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <AccountModal
                                isOpen={isAccountModalOpen}
                                onClose={() => setIsAccountModalOpen(false)}
                                onSave={handleSaveAccount}
                                account={editingAccount}
                            />
                        </div>
                    )}

                    {activeTab === 'teaching' && (
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 mb-6">Configurações de Ensino</h2>

                            {/* Estágios da Carreira Cristã */}
                            <div className="mb-8">
                                <h3 className="text-md font-semibold text-slate-700 mb-3">Estágios da Carreira Cristã</h3>
                                <form onSubmit={async (e) => { e.preventDefault(); if (newStageName.trim()) { await addStage(newStageName); setNewStageName(''); } }} className="flex gap-2 mb-4">
                                    <input type="text" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="Nome do estágio" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                    <button type="submit" disabled={!newStageName.trim()} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-md text-sm font-medium"><Plus size={16} /></button>
                                </form>
                                <div className="space-y-2">
                                    {stages.map(stage => (
                                        <div key={stage.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <span className="text-sm text-slate-700">{stage.order ? `${stage.order}. ` : ''}{stage.name}</span>
                                            <button onClick={() => deleteStage(stage.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Categorias de Turmas */}
                            <div>
                                <h3 className="text-md font-semibold text-slate-700 mb-3">Categorias de Turmas</h3>
                                <form onSubmit={async (e) => { e.preventDefault(); if (newTeachingCategoryName.trim()) { await addTeachingCategoryFunc(newTeachingCategoryName); setNewTeachingCategoryName(''); } }} className="flex gap-2 mb-4">
                                    <input type="text" value={newTeachingCategoryName} onChange={(e) => setNewTeachingCategoryName(e.target.value)} placeholder="Nome da categoria" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                    <button type="submit" disabled={!newTeachingCategoryName.trim()} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-md text-sm font-medium"><Plus size={16} /></button>
                                </form>
                                <div className="space-y-2">
                                    {teachingCategories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <span className="text-sm text-slate-700">{cat.name}</span>
                                            <button onClick={() => deleteTeachingCategoryFunc(cat.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'service-types' && (
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Tipos de Culto</h2>
                            <p className="text-sm text-slate-500 mb-6">
                                Gerencie os tipos de culto disponíveis para sua igreja. Tipos padrão não podem ser excluídos.
                            </p>

                            {loadingTypes ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                                    <p className="text-slate-600 text-sm">Carregando tipos...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Formulário de Adição */}
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!newServiceTypeName.trim()) return;
                                            try {
                                                await createServiceType(newServiceTypeName, newServiceTypeTime || undefined);
                                                setNewServiceTypeName('');
                                                setNewServiceTypeTime('');
                                            } catch (error) {
                                                alert('Erro ao criar tipo de culto');
                                            }
                                        }}
                                        className="flex flex-col md:flex-row gap-2 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <input
                                            type="text"
                                            value={newServiceTypeName}
                                            onChange={(e) => setNewServiceTypeName(e.target.value)}
                                            placeholder="Nome do novo tipo (ex: Vigília, Culto de Ação de Graças)"
                                            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        />
                                        <input
                                            type="time"
                                            value={newServiceTypeTime}
                                            onChange={(e) => setNewServiceTypeTime(e.target.value)}
                                            placeholder="Horário padrão"
                                            className="w-full md:w-32 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newServiceTypeName.trim()}
                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 justify-center"
                                        >
                                            <Plus size={16} /> Adicionar
                                        </button>
                                    </form>

                                    {/* Lista de Tipos */}
                                    <div className="space-y-2">
                                        {serviceTypes.map((type) => (
                                            <div
                                                key={type.id}
                                                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-orange-200 transition-colors group"
                                            >
                                                {editingTypeId === type.id ? (
                                                    <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={editingTypeName}
                                                            onChange={(e) => setEditingTypeName(e.target.value)}
                                                            className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                            autoFocus
                                                        />
                                                        <input
                                                            type="time"
                                                            value={editingTypeTime}
                                                            onChange={(e) => setEditingTypeTime(e.target.value)}
                                                            className="w-full md:w-32 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={async () => {
                                                                    if (!editingTypeName.trim()) return;
                                                                    try {
                                                                        await updateServiceType(type.id, editingTypeName, editingTypeTime || undefined);
                                                                        setEditingTypeId(null);
                                                                        setEditingTypeName('');
                                                                        setEditingTypeTime('');
                                                                    } catch (error) {
                                                                        alert('Erro ao atualizar tipo');
                                                                    }
                                                                }}
                                                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
                                                            >
                                                                Salvar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingTypeId(null);
                                                                    setEditingTypeName('');
                                                                    setEditingTypeTime('');
                                                                }}
                                                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-slate-700 rounded text-sm font-medium"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-medium text-slate-700">{type.name}</span>
                                                                {type.isDefault && (
                                                                    <span className="text-xs text-slate-400 italic px-2 py-1 bg-gray-100 rounded">Padrão</span>
                                                                )}
                                                            </div>
                                                            {type.defaultStartTime && (
                                                                <span className="text-xs text-slate-500 px-2 py-1 bg-blue-50 text-blue-600 rounded">
                                                                    {type.defaultStartTime.substring(0, 5)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingTypeId(type.id);
                                                                    setEditingTypeName(type.name);
                                                                    setEditingTypeTime(type.defaultStartTime || '');
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Save size={16} />
                                                            </button>
                                                            {!type.isDefault && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm(`Tem certeza que deseja excluir "${type.name}"?`)) {
                                                                            try {
                                                                                await deleteServiceType(type.id);
                                                                            } catch (error: any) {
                                                                                alert(error.message || 'Erro ao excluir tipo');
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Excluir"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {serviceTypes.length === 0 && (
                                            <div className="text-center py-8 text-slate-500">
                                                <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                                                <p>Nenhum tipo de culto cadastrado</p>
                                                <p className="text-sm mt-1">Adicione o primeiro tipo acima</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'roles' && (
                        <div>
                            {/* Funções Eclesiásticas Section */}
                            <div className="mb-10 border-b border-gray-200 pb-10">
                                <h2 className="text-lg font-bold text-slate-800 mb-4">Funções Eclesiásticas</h2>
                                <p className="text-sm text-slate-500 mb-6">
                                    Gerencie as funções eclesiásticas (cargos) disponíveis para os membros da igreja.
                                </p>

                                <form onSubmit={handleAddChurchRole} className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={newChurchRole}
                                        onChange={(e) => setNewChurchRole(e.target.value)}
                                        placeholder="Nova função (ex: Evangelista, Missionário)"
                                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newChurchRole.trim()}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Adicionar
                                    </button>
                                </form>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Default roles */}
                                    {['Membro', 'Diácono', 'Presbítero', 'Pastor', 'Líder de Célula', 'Líder de Louvor', 'Professor', 'Tesoureiro', 'Secretário'].map(role => (
                                        <div key={role} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <span className="text-sm text-slate-700 font-medium">{role}</span>
                                            <span className="text-xs text-slate-400 italic px-2 py-1 bg-gray-100 rounded">Padrão</span>
                                        </div>
                                    ))}

                                    {/* Custom roles */}
                                    {churchRoles.map(role => (
                                        <div key={role} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-200 transition-colors group shadow-sm">
                                            <span className="text-sm text-slate-700 font-medium">{role}</span>
                                            <button
                                                onClick={() => handleDeleteChurchRole(role)}
                                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 rounded"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* System Permissions Section */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Permissões de Acesso</h2>
                                        <p className="text-sm text-slate-500">Defina o que cada nível de acesso pode fazer no sistema.</p>
                                    </div>
                                    <button
                                        onClick={savePermissions}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {showSaveSuccess ? <Check size={16} /> : <Save size={16} />}
                                        {showSaveSuccess ? 'Salvo!' : 'Salvar Permissões'}
                                    </button>
                                </div>

                                {/* Role Selection (Fixed: Leader & Member only) */}
                                <div className="mb-6">
                                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                                        <button
                                            onClick={() => setSelectedRole('leader')}
                                            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${selectedRole === 'leader'
                                                ? 'bg-white text-slate-800 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            Líder
                                        </button>
                                        <button
                                            onClick={() => setSelectedRole('member')}
                                            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${selectedRole === 'member'
                                                ? 'bg-white text-slate-800 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            Membro
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 ml-1">
                                        * Administradores têm acesso total ao sistema por padrão.
                                    </p>
                                </div>

                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Módulo</th>
                                                {ACTIONS.map(action => (
                                                    <th key={action.id} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                                                        {action.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {MODULES.map(module => (
                                                <tr key={module.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                                        {module.label}
                                                    </td>
                                                    {ACTIONS.map(action => {
                                                        const permissionKey = `${module.id}_${action.id}`;
                                                        const isChecked = (rolePermissions[selectedRole] || []).includes(permissionKey);
                                                        return (
                                                            <td key={action.id} className="px-6 py-4 text-center">
                                                                <label className="inline-flex items-center justify-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only peer"
                                                                        checked={isChecked}
                                                                        onChange={() => handlePermissionToggle(selectedRole, module.id, action.id)}
                                                                    />
                                                                    <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center">
                                                                        {isChecked && <Check size={12} className="text-white" />}
                                                                    </div>
                                                                </label>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="text-center py-12 text-slate-500">
                            <Users size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>Gestão de Usuários e Permissões</p>
                            <p className="text-sm mt-2">Para gerenciar usuários, acesse o menu lateral "Usuários".</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
