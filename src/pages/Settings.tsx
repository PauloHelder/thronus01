import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Wallet, Building, Users, BookOpen, ShieldCheck, Check, Calendar, Pencil, Upload, Palette, Image as ImageIcon } from 'lucide-react';
import { TransactionCategory, ChristianStage, TeachingCategory } from '../types';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { MOCK_CATEGORIES } from '../mocks/finance';
import { DEFAULT_CHRISTIAN_STAGES, DEFAULT_TEACHING_CATEGORIES } from '../data/teachingDefaults';
import { useFinance } from '../hooks/useFinance';
import { useTeaching } from '../hooks/useTeaching';
import AccountModal from '../components/modals/AccountModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

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
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check permission - Only admins can access settings
    if (user?.role !== 'admin' && user?.role !== 'superuser') {
        return (
            <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center">
                <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
                <p className="text-slate-600">Você não tem permissão para acessar as configurações do sistema.</p>
            </div>
        );
    }

    const { serviceTypes, loading: loadingTypes, createServiceType, updateServiceType, deleteServiceType } = useServiceTypes();
    const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(undefined);
    const [activeTab, setActiveTab] = useState('general');

    const handleSaveAccount = async (data: any) => {
        if (editingAccount) {
            const result = await updateAccount(editingAccount.id, data);
            setIsAccountModalOpen(false);
            return result;
        } else {
            const result = await addAccount(data);
            setIsAccountModalOpen(false);
            return result;
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

    const [newStageName, setNewStageName] = useState('');
    const [newTeachingCategoryName, setNewTeachingCategoryName] = useState('');

    // Role settings
    const [selectedRole, setSelectedRole] = useState<string>('leader');
    const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

    // Custom System Roles (Profiles)
    const [customSystemRoles, setCustomSystemRoles] = useState<string[]>([]);
    const [newSystemRoleName, setNewSystemRoleName] = useState('');
    const [isAddingSystemRole, setIsAddingSystemRole] = useState(false);

    // Shared Permissions Settings
    const [sharedPermissions, setSharedPermissions] = useState<Record<string, boolean>>({
        view_members: false,
        view_service_stats: false,
        view_discipleship: false,
        view_departments: false,
        view_teaching: false,
        view_events: false
    });

    // Branding Settings
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [primaryColor, setPrimaryColor] = useState<string>('#f97316'); // Default orange-500
    const [secondaryColor, setSecondaryColor] = useState<string>('#1e293b'); // Default slate-800
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [savingBranding, setSavingBranding] = useState(false);

    // Initial Load
    useEffect(() => {
        if (!user?.churchId) return;

        const loadSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('churches')
                    .select('settings, logo_url, primary_color, secondary_color')
                    .eq('id', user.churchId)
                    .single();

                if (data) {
                    // Load branding
                    if (data.logo_url) setLogoUrl(data.logo_url);
                    if (data.primary_color) setPrimaryColor(data.primary_color);
                    if (data.secondary_color) setSecondaryColor(data.secondary_color);

                    // Load JSON settings
                    if ((data as any).settings) {
                        const settings = (data as any).settings;

                        if (settings.role_permissions) {
                            setRolePermissions(settings.role_permissions);
                        } else {
                            // Default permissions
                            setRolePermissions({
                                'supervisor': ['members_view', 'members_edit', 'members_create', 'groups_view', 'events_view', 'events_edit', 'departments_view', 'departments_edit'],
                                'leader': ['members_view', 'members_edit', 'events_create', 'events_edit', 'departments_edit', 'departments_create'],
                                'member': ['members_view', 'events_view', 'services_view']
                            });
                        }

                        if (settings.custom_system_roles) {
                            setCustomSystemRoles(settings.custom_system_roles);
                        }

                        if (settings.shared_permissions) {
                            setSharedPermissions(settings.shared_permissions);
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading settings:", err);
            }
        };

        loadSettings();
    }, [user?.churchId]);

    // Helper to save settings to DB (JSON column)
    const updateChurchSettings = async (key: string, value: any) => {
        if (!user?.churchId) return;
        try {
            // Get current settings first
            const { data } = await supabase.from('churches').select('settings').eq('id', user.churchId).single();
            const currentSettings = (data as any)?.settings || {};

            const updatedSettings = {
                ...currentSettings,
                [key]: value
            };

            const { error } = await supabase
                .from('churches')
                .update({ settings: updatedSettings, updated_at: new Date().toISOString() } as any)
                .eq('id', user.churchId);

            if (error) throw error;
        } catch (err) {
            console.error(`Error saving ${key}:`, err);
            toast.error('Erro ao salvar configurações.');
        }
    };

    const handleAddSystemRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSystemRoleName.trim()) return;

        const roleKey = newSystemRoleName.trim().toLowerCase().replace(/\s+/g, '_');

        if (['admin', 'leader', 'member'].includes(roleKey) || customSystemRoles.includes(roleKey)) {
            alert('Este perfil já existe.');
            return;
        }

        const updatedRoles = [...customSystemRoles, roleKey];
        setCustomSystemRoles(updatedRoles);
        await updateChurchSettings('custom_system_roles', updatedRoles);

        setNewSystemRoleName('');
        setIsAddingSystemRole(false);
        setSelectedRole(roleKey);
    };

    const handleDeleteSystemRole = async (roleToDelete: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o perfil?`)) {
            const updatedRoles = customSystemRoles.filter(r => r !== roleToDelete);
            setCustomSystemRoles(updatedRoles);
            await updateChurchSettings('custom_system_roles', updatedRoles);
            if (selectedRole === roleToDelete) setSelectedRole('leader');
        }
    };

    // Helper to format role name
    const formatRoleName = (role: string) => {
        if (role === 'leader') return 'Líder';
        if (role === 'member') return 'Membro';
        // Capitalize first letter
        return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
    };

    const handlePermissionToggle = async (role: string, module: string, action: string) => {
        const permissionKey = `${module}_${action}`;
        const currentPermissions = rolePermissions[role] || [];

        let newPermissions;
        if (currentPermissions.includes(permissionKey)) {
            newPermissions = currentPermissions.filter(p => p !== permissionKey);
        } else {
            newPermissions = [...currentPermissions, permissionKey];
        }

        const updatedRolePermissions = {
            ...rolePermissions,
            [role]: newPermissions
        };

        setRolePermissions(updatedRolePermissions);
        await updateChurchSettings('role_permissions', updatedRolePermissions);
    };

    const handleSharedPermissionToggle = async (key: string) => {
        const updatedPermissions = {
            ...sharedPermissions,
            [key]: !sharedPermissions[key]
        };
        setSharedPermissions(updatedPermissions);
        await updateChurchSettings('shared_permissions', updatedPermissions);
    };

    // Branding Handlers
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor, selecione apenas arquivos de imagem.');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                toast.error('A imagem deve ter no máximo 2MB.');
                return;
            }

            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveBranding = async () => {
        if (!user?.churchId) return;
        setSavingBranding(true);

        try {
            let finalLogoUrl = logoUrl;

            // Upload logo if changed
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${user.churchId}/logo-${Date.now()}.${fileExt}`;
                const { error: uploadError, data } = await supabase.storage
                    .from('church-assets')
                    .upload(fileName, logoFile, { upsert: true });

                if (uploadError) {
                    // If bucket doesn't exist or permission denied, fallback to dataURL or error
                    console.error('Upload error:', uploadError);

                    // Fallback: If we can't upload, we might need to store Base64 in DB (not recommended but works for small images)
                    // OR assume the user has to create the bucket.
                    // For now, let's warn.
                    toast.error(`Erro ao fazer upload da imagem: ${uploadError.message}. Verifique se o bucket 'church-assets' existe.`);
                    // We continue saving colors anyway
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('church-assets')
                        .getPublicUrl(fileName);
                    finalLogoUrl = publicUrl;
                }
            }

            const { error } = await supabase
                .from('churches')
                .update({
                    logo_url: finalLogoUrl,
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                    updated_at: new Date().toISOString()
                } as any)
                .eq('id', user.churchId);

            if (error) throw error;
            toast.success('Configurações de marca salvas com sucesso!');
            setLogoFile(null);
        } catch (err: any) {
            console.error('Error saving branding:', err);
            toast.error(`Erro ao salvar: ${err.message}`);
        } finally {
            setSavingBranding(false);
        }
    };

    const SHARED_PERMISSION_LABELS: Record<string, string> = {
        view_members: 'Ver Membros',
        view_service_stats: 'Ver Estatísticas de Culto',
        view_discipleship: 'Ver Discipulados',
        view_departments: 'Ver Departamentos',
        view_teaching: 'Ver Ensino',
        view_events: 'Ver Eventos'
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Configurações</h1>

            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 bg-white p-2 rounded-lg sticky top-0 z-10">
                <button onClick={() => setActiveTab('general')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'general' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Geral</button>
                <button onClick={() => setActiveTab('financial')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'financial' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Financeiro</button>
                <button onClick={() => setActiveTab('teaching')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'teaching' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Ensino</button>
                <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'roles' || activeTab === 'permissions' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Permissões</button>
                <button onClick={() => setActiveTab('links')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'links' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Vínculos</button>
            </div>

            {activeTab === 'general' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-slate-800">Identidade Visual</h2>
                            <p className="text-sm text-slate-500">Personalize a aparência do sistema para sua igreja</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Logo Upload */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                                    <ImageIcon size={18} />
                                    Logotipo da Igreja
                                </h3>

                                <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="relative mb-4">
                                        {logoUrl ? (
                                            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                                                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center text-slate-400">
                                                <ImageIcon size={48} />
                                            </div>
                                        )}

                                        {logoUrl && (
                                            <button
                                                onClick={() => {
                                                    setLogoUrl('');
                                                    setLogoFile(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                                                title="Remover logo"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                    />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-slate-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <Upload size={16} />
                                        {logoUrl ? 'Alterar Logo' : 'Carregar Logo'}
                                    </button>

                                    <p className="text-xs text-slate-500 mt-2 text-center">
                                        Recomendado: PNG ou JPG com fundo transparente.<br />Máximo 2MB.
                                    </p>
                                </div>
                            </div>

                            {/* Colors */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                                    <Palette size={18} />
                                    Cores do Sistema
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-2">Cor Primária (Destaques, Botões)</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="w-12 h-12 p-1 rounded cursor-pointer border border-gray-300"
                                            />
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={primaryColor}
                                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm uppercase"
                                                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-600 mb-2">Cor Secundária (Texto, Elementos Escuros)</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                className="w-12 h-12 p-1 rounded cursor-pointer border border-gray-300"
                                            />
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={secondaryColor}
                                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm uppercase"
                                                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <label className="block text-sm font-medium text-slate-700 mb-3">Pré-visualização</label>
                                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col gap-3">
                                            <div className="h-10 rounded-lg flex items-center justify-center text-white font-medium" style={{ backgroundColor: primaryColor }}>
                                                Botão Primário
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>Icon</div>
                                                <span className="font-bold" style={{ color: secondaryColor }}>Título do Texto</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end pt-6 border-t border-gray-200">
                            <button
                                onClick={handleSaveBranding}
                                disabled={savingBranding}
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {savingBranding ? (
                                    <>Salvando...</>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'financial' && (

                <div className="space-y-6">
                    {/* Accounts Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Contas Bancárias / Caixas</h2>
                                <p className="text-sm text-slate-500">Gerencie as contas onde o dinheiro entra e sai</p>
                            </div>
                            <button
                                onClick={openNewAccountModal}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} /> Nova Conta
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {accounts.map(account => (
                                <div key={account.id} className="p-4 rounded-lg border border-gray-200 hover:border-orange-500 transition-colors bg-gray-50 group relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {account.type === 'Bank' ? <Building size={18} className="text-slate-400" /> : <Wallet size={18} className="text-slate-400" />}
                                            <span className="font-semibold text-slate-800">{account.name}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditAccountModal(account)} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => deleteAccount(account.id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-1">{account.bank || 'Carteira'}</p>
                                    <p className="font-mono font-medium text-slate-700">
                                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(account.balance)}
                                    </p>
                                </div>
                            ))}
                            {accounts.length === 0 && (
                                <div className="col-span-full py-8 text-center text-slate-500 border-2 border-dashed border-gray-200 rounded-lg">
                                    Nenhuma conta cadastrada ainda.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transaction Categories Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Categorias Financeiras</h2>
                            <p className="text-sm text-slate-500">Categorias para classificar receitas e despesas</p>
                        </div>

                        <div className="flex gap-4 mb-6 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Categoria</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Ex: Dízimos, Conta de Luz..."
                                />
                            </div>
                            <div className="w-40">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select
                                    value={newCategoryType}
                                    onChange={(e) => setNewCategoryType(e.target.value as 'Income' | 'Expense')}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                >
                                    <option value="Income">Receita</option>
                                    <option value="Expense">Despesa</option>
                                </select>
                            </div>
                            <button
                                onClick={() => {
                                    if (newCategoryName) {
                                        setCategories([...categories, { id: Date.now().toString(), name: newCategoryName, type: newCategoryType }]);
                                        setNewCategoryName('');
                                    }
                                }}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} /> Adicionar
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-semibold text-green-600 mb-3 uppercase tracking-wider">Receitas</h3>
                                <div className="space-y-2">
                                    {categories.filter(c => c.type === 'Income').map(category => (
                                        <div key={category.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100 group">
                                            <span className="text-slate-700">{category.name}</span>
                                            <button
                                                onClick={() => setCategories(categories.filter(c => c.id !== category.id))}
                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-red-600 mb-3 uppercase tracking-wider">Despesas</h3>
                                <div className="space-y-2">
                                    {categories.filter(c => c.type === 'Expense').map(category => (
                                        <div key={category.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 group">
                                            <span className="text-slate-700">{category.name}</span>
                                            <button
                                                onClick={() => setCategories(categories.filter(c => c.id !== category.id))}
                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'teaching' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Estágios de Crescimento</h2>
                            <p className="text-sm text-slate-500">Defina os níveis da jornada cristã</p>
                        </div>
                        <div className="flex gap-4 mb-4">
                            <input
                                type="text"
                                value={newStageName}
                                onChange={(e) => setNewStageName(e.target.value)}
                                placeholder="Novo estágio (ex: Batismo)"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                                onClick={() => {
                                    if (newStageName) {
                                        addStage(newStageName);
                                        setNewStageName('');
                                    }
                                }}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} /> Adicionar
                            </button>
                        </div>
                        <div className="space-y-2">
                            {stages.map((stage) => (
                                <div key={stage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                                            {stage.order}
                                        </span>
                                        <span className="font-medium text-slate-700">{stage.name}</span>
                                    </div>
                                    <button
                                        onClick={() => deleteStage(stage.id)}
                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Categorias de Ensino</h2>
                            <p className="text-sm text-slate-500">Tipos de aulas e cursos oferecidos</p>
                        </div>
                        <div className="flex gap-4 mb-4">
                            <input
                                type="text"
                                value={newTeachingCategoryName}
                                onChange={(e) => setNewTeachingCategoryName(e.target.value)}
                                placeholder="Nova categoria (ex: Curso de Noivos)"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                                onClick={() => {
                                    if (newTeachingCategoryName) {
                                        addTeachingCategoryFunc(newTeachingCategoryName);
                                        setNewTeachingCategoryName('');
                                    }
                                }}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} /> Adicionar
                            </button>
                        </div>
                        <div className="space-y-2">
                            {teachingCategories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                                    <div className="flex items-center gap-3">
                                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                        <span className="font-medium text-slate-700">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={() => deleteTeachingCategoryFunc(cat.id)}
                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {(activeTab === 'roles' || activeTab === 'permissions') && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg flex-wrap">
                            <button
                                onClick={() => setSelectedRole('leader')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedRole === 'leader'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Líder
                            </button>
                            <button
                                onClick={() => setSelectedRole('member')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedRole === 'member'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Membro
                            </button>
                            <button
                                onClick={() => setSelectedRole('supervisor')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedRole === 'supervisor'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Supervisor
                            </button>

                            {customSystemRoles.map(role => (
                                <div key={role} className="relative group">
                                    <button
                                        onClick={() => setSelectedRole(role)}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all pr-8 ${selectedRole === role
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {formatRoleName(role)}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteSystemRole(role); }}
                                        className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 ${selectedRole === role ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        title="Remover perfil"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add New Profile Button/Form */}
                        {isAddingSystemRole ? (
                            <form onSubmit={handleAddSystemRole} className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newSystemRoleName}
                                    onChange={e => setNewSystemRoleName(e.target.value)}
                                    placeholder="Nome do perfil"
                                    className="w-32 px-2 py-1 text-sm bg-white border border-gray-200 rounded outline-none focus:border-orange-500"
                                />
                                <button type="submit" className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                                    <Check size={14} />
                                </button>
                                <button type="button" onClick={() => setIsAddingSystemRole(false)} className="p-1 bg-gray-200 text-slate-600 rounded hover:bg-gray-300">
                                    <Trash2 size={14} className="rotate-45" />
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsAddingSystemRole(true)}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200 border-dashed"
                            >
                                <Plus size={16} />
                                Novo Perfil
                            </button>
                        )}

                        <p className="w-full text-xs text-slate-500 mt-2 ml-1">
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

            )
            }

            {activeTab === 'links' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">Vínculos e Permissões</h2>
                        <p className="text-sm text-slate-500">Configure os dados que sua igreja compartilha com a igreja mãe.</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>Atenção:</strong> As opções abaixo determinam exatamente o que a liderança da igreja mãe pode visualizar sobre sua igreja.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(SHARED_PERMISSION_LABELS).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-200 transition-all">
                                <span className="text-slate-700 font-medium">{label}</span>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={!!sharedPermissions[key]}
                                        onChange={() => handleSharedPermissionToggle(key)}
                                    />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSave={handleSaveAccount}
                account={editingAccount}
            />
        </div >
    );
};

export default Settings;
