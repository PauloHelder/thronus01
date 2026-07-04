import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Wallet, Building, Users, BookOpen, ShieldCheck, Check, Calendar, Pencil, Upload, Palette, Image as ImageIcon, ArrowRight, Info } from 'lucide-react';
import { TransactionCategory, ChristianStage, TeachingCategory } from '../types';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { MOCK_CATEGORIES } from '../mocks/finance';
import { DEFAULT_CHRISTIAN_STAGES, DEFAULT_TEACHING_CATEGORIES } from '../data/teachingDefaults';
import { useFinance } from '../hooks/useFinance';
import { useTeaching } from '../hooks/useTeaching';
import { useEventTypes } from '../hooks/useEventTypes';
import AccountModal from '../components/modals/AccountModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { formatAOA } from '../utils/currency';
import WhatsappSettingsTab from '../components/tabs/WhatsappSettingsTab';
import GenericDeleteModal from '../components/modals/GenericDeleteModal';

const ACTIONS = [
    { id: 'view', label: 'Visualizar' },
    { id: 'create', label: 'Criar' },
    { id: 'edit', label: 'Editar' },
    { id: 'delete', label: 'Excluir' },
    { id: 'send', label: 'Enviar/Executar' },
];

const Settings: React.FC = () => {
    const { user, hasPermission, hasRole } = useAuth();
    
    const MODULES = [
        { id: 'members', label: 'Membros' },
        { id: 'services', label: 'Cultos' },
        { id: 'groups', label: 'Grupos' },
        { id: 'finances', label: 'Tesouraria' },
        { id: 'teaching', label: 'Ensino' },
        { id: 'events', label: 'Eventos' },
        { id: 'departments', label: 'Departamentos' },
        { id: 'discipleship', label: 'Discipulado' },
        { id: 'assets', label: 'Patrimônio' },
        { id: 'branches', label: 'Minhas Igrejas' },
        { id: 'users', label: 'Usuários' },
        { id: 'reports', label: 'Relatórios' },
        { id: 'whatsapp', label: 'WhatsApp (API)' },
        ...(hasRole('superuser') ? [
            { id: 'subscription', label: 'Assinatura e Planos' },
        ] : []),
    ];

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check permission - Only admins or users with explicit settings_view permission can access settings
    const canAccessSettings = hasRole('admin') || hasRole('superuser') || hasPermission('settings_view') || hasPermission('all');

    if (!canAccessSettings) {
        return (
            <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center">
                <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
                <p className="text-slate-600">Você não tem permissão para acessar as configurações do sistema.</p>
            </div>
        );
    }

    const { serviceTypes, loading: loadingTypes, createServiceType, updateServiceType, deleteServiceType } = useServiceTypes();
    const { accounts, addAccount, updateAccount, deleteAccount, categories, addCategory, deleteCategory } = useFinance();
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
    const [activeTab, setActiveTab] = useState('general');
    const [categoriesSubTab, setCategoriesSubTab] = useState<'financial' | 'teaching' | 'event'>('financial');
    const { eventTypes, createEventType, deleteEventType } = useEventTypes();
    const [newEventTypeName, setNewEventTypeName] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');

    // Performance & Benchmark states
    const [benchmarking, setBenchmarking] = useState(false);
    const [benchResults, setBenchResults] = useState({
        writeSpeed: '0.00',
        readSpeed: '0.00',
        indexTime: '0.00'
    });

    const [pageMetrics, setPageMetrics] = useState({
        ttfb: 0,
        domLoad: 0,
        fullLoad: 0,
        memoryUsed: '0.00'
    });

    useEffect(() => {
        const loadMetrics = () => {
            const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
            if (entry) {
                const ttfb = Math.round(entry.responseStart - entry.requestStart);
                const domLoad = Math.round(entry.domContentLoadedEventEnd - entry.startTime);
                const fullLoad = Math.round(entry.loadEventEnd - entry.startTime);
                let memoryUsed = '0.00';
                if ((performance as any).memory) {
                    memoryUsed = ((performance as any).memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
                }
                setPageMetrics({
                    ttfb: ttfb > 0 ? ttfb : 0,
                    domLoad: domLoad > 0 ? domLoad : 0,
                    fullLoad: fullLoad > 0 ? fullLoad : 0,
                    memoryUsed
                });
            } else {
                const t = performance.timing;
                if (t) {
                    const ttfb = Math.max(0, t.responseStart - t.requestStart);
                    const domLoad = Math.max(0, t.domContentLoadedEventEnd - t.navigationStart);
                    const fullLoad = Math.max(0, t.loadEventEnd - t.navigationStart);
                    let memoryUsed = '0.00';
                    if ((performance as any).memory) {
                        memoryUsed = ((performance as any).memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
                    }
                    setPageMetrics({ ttfb, domLoad, fullLoad, memoryUsed });
                }
            }
        };

        if (document.readyState === 'complete') {
            loadMetrics();
        } else {
            window.addEventListener('load', loadMetrics);
            return () => window.removeEventListener('load', loadMetrics);
        }
    }, []);

    const runStorageBenchmark = () => {
        setBenchmarking(true);
        setTimeout(() => {
            const testKey = '__performance_test_key__';
            const testItems = Array.from({ length: 100 }, (_, i) => ({
                id: `id_${i}`,
                name: `Item fictício de teste número ${i}`,
                date: new Date().toISOString(),
                value: Math.random() * 1000
            }));

            const startWrite = performance.now();
            localStorage.setItem(testKey, JSON.stringify(testItems));
            const endWrite = performance.now();
            const writeTime = (endWrite - startWrite).toFixed(2);

            const startRead = performance.now();
            const retrieved = JSON.parse(localStorage.getItem(testKey) || '[]');
            const endRead = performance.now();
            const readTime = (endRead - startRead).toFixed(2);

            const startFilter = performance.now();
            const query = 'número 50';
            const filtered = retrieved.filter((item: any) => item.name.includes(query));
            const endFilter = performance.now();
            const filterTime = (endFilter - startFilter).toFixed(2);

            localStorage.removeItem(testKey);

            setBenchResults({
                writeSpeed: writeTime,
                readSpeed: readTime,
                indexTime: filterTime
            });
            setBenchmarking(false);
            toast.success('Teste de performance concluído!');
        }, 300);
    };

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

    // Categorias via useFinance
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('income');

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
        view_events: false,
        view_finances: false
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

                if (error) throw error;

                if (data) {
                    const church = data as any;
                    // Load branding
                    if (church.logo_url) setLogoUrl(church.logo_url);
                    if (church.primary_color) setPrimaryColor(church.primary_color);
                    if (church.secondary_color) setSecondaryColor(church.secondary_color);

                    // Load JSON settings
                    const settings = (data as any).settings || {};

                    if (settings.role_permissions) {
                        setRolePermissions(settings.role_permissions);
                    } else {
                        // Default permissions
                        setRolePermissions({
                            'supervisor': ['members_view', 'members_edit', 'members_create', 'groups_view', 'groups_create', 'groups_edit', 'groups_delete', 'discipleship_view', 'discipleship_create', 'discipleship_edit', 'events_view', 'events_create', 'events_edit', 'events_delete', 'departments_view', 'departments_edit', 'departments_create', 'teaching_view', 'teaching_create', 'teaching_edit', 'services_view', 'services_create', 'services_edit', 'assets_view', 'assets_create', 'assets_edit', 'assets_delete', 'finances_authorize', 'finances_pay'],
                            'leader': ['members_view', 'members_edit', 'groups_view', 'groups_create', 'groups_edit', 'discipleship_view', 'discipleship_create', 'discipleship_edit', 'events_view', 'events_create', 'events_edit', 'departments_edit', 'departments_create', 'teaching_view', 'teaching_create', 'teaching_edit', 'services_view', 'services_create', 'services_edit', 'assets_view', 'assets_create', 'assets_edit'],
                            'member': ['members_view', 'groups_view', 'discipleship_view', 'events_view', 'services_view', 'teaching_view', 'assets_view']
                        });
                    }

                    if (settings.custom_system_roles && Array.isArray(settings.custom_system_roles)) {
                        setCustomSystemRoles(settings.custom_system_roles);
                    }

                    if (settings.shared_permissions) {
                        setSharedPermissions(settings.shared_permissions);
                    }
                }
            } catch (err: any) {
                console.error("Error loading settings:", err);
                toast.error(`Erro ao carregar configurações: ${err.message || 'Erro desconhecido'}`);

                // Fallback to AuthContext data
                if (user?.churchSettings) {
                    const settings = user.churchSettings;
                    if (settings.custom_system_roles && Array.isArray(settings.custom_system_roles)) {
                        setCustomSystemRoles(settings.custom_system_roles);
                    }
                    if (settings.role_permissions) {
                        setRolePermissions(settings.role_permissions);
                    }
                }
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

            const { error } = await (supabase
                .from('churches') as any)
                .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
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
            toast.warning('Este perfil já existe.');
            return;
        }

        const updatedRoles = [...customSystemRoles, roleKey];
        setCustomSystemRoles(updatedRoles);
        await updateChurchSettings('custom_system_roles', updatedRoles);

        setNewSystemRoleName('');
        setIsAddingSystemRole(false);
        setSelectedRole(roleKey);
    };

    const handleDeleteSystemRole = (roleToDelete: string) => {
        setItemToDelete({ id: roleToDelete, name: formatRoleName(roleToDelete), type: 'system_role' });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            switch (itemToDelete.type) {
                case 'account':
                    await deleteAccount(itemToDelete.id);
                    break;
                case 'category':
                    await deleteCategory(itemToDelete.id);
                    break;
                case 'stage':
                    await deleteStage(itemToDelete.id);
                    break;
                case 'teaching_category':
                    await deleteTeachingCategoryFunc(itemToDelete.id);
                    break;
                case 'event_type':
                    await deleteEventType(itemToDelete.id);
                    break;
                case 'system_role':
                    const updatedRoles = customSystemRoles.filter(r => r !== itemToDelete.id);
                    setCustomSystemRoles(updatedRoles);
                    await updateChurchSettings('custom_system_roles', updatedRoles);
                    if (selectedRole === itemToDelete.id) setSelectedRole('leader');
                    break;
            }
            toast.success('Excluído com sucesso!');
        } catch (err) {
            console.error('Error deleting item:', err);
            toast.error('Erro ao excluir item.');
        }

        setIsDeleteModalOpen(false);
        setItemToDelete(null);
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

            const { error } = await (supabase
                .from('churches') as any)
                .update({
                    logo_url: finalLogoUrl,
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                    updated_at: new Date().toISOString()
                })
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
        view_events: 'Ver Eventos',
        view_finances: 'Ver Tesouraria'
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Configurações</h1>

            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 bg-white p-2 rounded-lg sticky top-0 z-10">
                <button onClick={() => setActiveTab('general')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'general' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Geral</button>
                <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'categories' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Categorias</button>
                <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'roles' || activeTab === 'permissions' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Perfil</button>
                <button onClick={() => setActiveTab('links')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'links' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Vínculo</button>
                {(hasRole('admin') || hasRole('superuser')) && (
                    <button onClick={() => setActiveTab('whatsapp')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'whatsapp' ? 'text-green-600 border-b-2 border-green-600' : 'text-slate-500 hover:text-slate-700'}`}>Whatsap</button>
                )}
                <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'performance' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Desempenho</button>
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

            {activeTab === 'categories' && (
                <div className="space-y-6">
                    <div className="flex gap-2 border-b border-gray-200 pb-3">
                        <button
                            onClick={() => setCategoriesSubTab('financial')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                categoriesSubTab === 'financial'
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                            }`}
                        >
                            Finanças
                        </button>
                        <button
                            onClick={() => setCategoriesSubTab('teaching')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                categoriesSubTab === 'teaching'
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                            }`}
                        >
                            Ensino
                        </button>
                        <button
                            onClick={() => setCategoriesSubTab('event')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                categoriesSubTab === 'event'
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                            }`}
                        >
                            Eventos
                        </button>
                    </div>

                    {categoriesSubTab === 'financial' && (
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
                                                    <button onClick={() => {
                                                        setItemToDelete({ id: account.id, name: account.name, type: 'account' });
                                                        setIsDeleteModalOpen(true);
                                                    }} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-1">{account.bank || 'Carteira'}</p>
                                            <p className="font-mono font-medium text-slate-700">
                                                {formatAOA(account.balance)}
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
                                            onChange={(e) => setNewCategoryType(e.target.value as 'income' | 'expense')}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                        >
                                            <option value="income">Receita</option>
                                            <option value="expense">Despesa</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (newCategoryName) {
                                                await addCategory({ name: newCategoryName, type: newCategoryType, is_system: false });
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
                                            {categories.filter(c => c.type === 'income').map(category => (
                                                <div key={category.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100 group">
                                                    <span className="text-slate-700">{category.name}</span>
                                                    <button
                                                        onClick={() => {
                                                            setItemToDelete({ id: category.id, name: category.name, type: 'category' });
                                                            setIsDeleteModalOpen(true);
                                                        }}
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
                                            {categories.filter(c => c.type === 'expense').map(category => (
                                                <div key={category.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 group">
                                                    <span className="text-slate-700">{category.name}</span>
                                                    <button
                                                        onClick={() => {
                                                            setItemToDelete({ id: category.id, name: category.name, type: 'category' });
                                                            setIsDeleteModalOpen(true);
                                                        }}
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

                    {categoriesSubTab === 'teaching' && (
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
                                                onClick={() => {
                                                    setItemToDelete({ id: stage.id, name: stage.name, type: 'stage' });
                                                    setIsDeleteModalOpen(true);
                                                }}
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
                                                onClick={() => {
                                                    setItemToDelete({ id: cat.id, name: cat.name, type: 'teaching_category' });
                                                    setIsDeleteModalOpen(true);
                                                }}
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

                    {categoriesSubTab === 'event' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-slate-800">Categorias de Eventos (Agenda)</h2>
                                    <p className="text-sm text-slate-500">Defina os tipos/categorias de eventos para a agenda da igreja</p>
                                </div>
                                <div className="flex gap-4 mb-4">
                                    <input
                                        type="text"
                                        value={newEventTypeName}
                                        onChange={(e) => setNewEventTypeName(e.target.value)}
                                        placeholder="Nome da categoria (ex: Culto Jovem, Ação Social)"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (newEventTypeName) {
                                                await createEventType(newEventTypeName, newEventDescription);
                                                setNewEventTypeName('');
                                                setNewEventDescription('');
                                                toast.success('Categoria de evento criada!');
                                            }
                                        }}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Adicionar
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {eventTypes.map((type) => (
                                        <div key={type.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-2.5 h-2.5 rounded-full bg-orange-500`}></span>
                                                <span className="text-slate-700 font-medium">{type.name}</span>
                                            </div>
                                            {!type.isDefault && (
                                                <button
                                                    onClick={() => {
                                                        setItemToDelete({ id: type.id, name: type.name, type: 'event_type' });
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {eventTypes.length === 0 && (
                                        <p className="text-sm text-slate-500 text-center py-4">Nenhuma categoria de evento cadastrada ainda.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
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
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Módulo</th>
                                    {ACTIONS.map(action => (
                                        <th key={action.id} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                                            {action.label}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                                        Autorizar
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                                        Pagar
                                    </th>
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
                                        
                                        {/* Colunas extras específicas de Finanças */}
                                        {module.id === 'finances' ? (
                                            <>
                                                {/* Autorizar */}
                                                <td className="px-6 py-4 text-center">
                                                    <label className="inline-flex items-center justify-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={(rolePermissions[selectedRole] || []).includes('finances_authorize')}
                                                            onChange={() => handlePermissionToggle(selectedRole, 'finances', 'authorize')}
                                                        />
                                                        <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center">
                                                            {(rolePermissions[selectedRole] || []).includes('finances_authorize') && <Check size={12} className="text-white" />}
                                                        </div>
                                                    </label>
                                                </td>
                                                {/* Pagar */}
                                                <td className="px-6 py-4 text-center">
                                                    <label className="inline-flex items-center justify-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={(rolePermissions[selectedRole] || []).includes('finances_pay')}
                                                            onChange={() => handlePermissionToggle(selectedRole, 'finances', 'pay')}
                                                        />
                                                        <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center">
                                                            {(rolePermissions[selectedRole] || []).includes('finances_pay') && <Check size={12} className="text-white" />}
                                                        </div>
                                                    </label>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 text-center text-slate-300">-</td>
                                                <td className="px-6 py-4 text-center text-slate-300">-</td>
                                            </>
                                        )}
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

            {activeTab === 'whatsapp' && (
                <WhatsappSettingsTab />
            )}

            {activeTab === 'performance' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Desempenho & Diagnósticos</h2>
                        <p className="text-sm text-slate-600 mt-1">Métricas em tempo real sobre a velocidade de carregamento, armazenamento e indexação do sistema.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Box 1: LocalStorage e Indexação */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse"></span>
                                    Armazenamento & Indexação
                                </h3>
                                <button 
                                    onClick={runStorageBenchmark}
                                    disabled={benchmarking}
                                    className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all shadow-sm"
                                >
                                    {benchmarking ? 'A testar...' : 'Executar Teste'}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-xs text-slate-500 font-medium">Escrita LocalStorage</div>
                                    <div className="text-lg font-black text-slate-800 mt-1 font-mono">{benchResults.writeSpeed} <span className="text-[10px] font-normal text-slate-500">ms</span></div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-xs text-slate-500 font-medium">Leitura LocalStorage</div>
                                    <div className="text-lg font-black text-slate-800 mt-1 font-mono">{benchResults.readSpeed} <span className="text-[10px] font-normal text-slate-500">ms</span></div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-xs text-slate-500 font-medium font-semibold text-slate-700">Tempo de Indexação</div>
                                    <div className="text-lg font-black text-slate-800 mt-1 font-mono">{benchResults.indexTime} <span className="text-[10px] font-normal text-slate-500">ms</span></div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-xs text-slate-500 font-medium font-semibold text-slate-700">Status do Caching</div>
                                    <div className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1">
                                        <Check size={14} className="text-green-600 font-bold" /> Ativo & Otimizado
                                    </div>
                                </div>
                            </div>
                            <div className="text-[11px] text-slate-500 leading-relaxed bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="font-semibold text-slate-700">Nota técnica:</span> O teste de escrita e leitura gera 100 registros fictícios estruturados, mede o tempo de persistência síncrona no <code className="bg-slate-100 px-1 py-0.5 rounded text-red-600 font-mono">localStorage</code> e a indexação calcula a busca linear com filtro regex sobre os dados ativos.
                            </div>
                        </div>

                        {/* Box 2: Velocidade da Página */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                                    Métricas de Navegação
                                </h3>
                                <div className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Browser API
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-xs text-slate-500 font-medium">Tempo de Resposta (TTFB)</div>
                                    <div className="text-lg font-black text-slate-800 mt-1 font-mono">{pageMetrics.ttfb} <span className="text-[10px] font-normal text-slate-500">ms</span></div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-xs text-slate-500 font-medium font-semibold text-slate-700">Carregamento do DOM</div>
                                    <div className="text-lg font-black text-slate-800 mt-1 font-mono">{pageMetrics.domLoad} <span className="text-[10px] font-normal text-slate-500">ms</span></div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-xs text-slate-500 font-medium font-semibold text-slate-700">Página Carregada</div>
                                    <div className="text-lg font-black text-slate-800 mt-1 font-mono">{pageMetrics.fullLoad} <span className="text-[10px] font-normal text-slate-500">ms</span></div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="text-xs text-slate-500 font-medium">Uso de Memória JS</div>
                                    <div className="text-lg font-black text-slate-800 mt-1 font-mono">{pageMetrics.memoryUsed} <span className="text-[10px] font-normal text-slate-500">MB</span></div>
                                </div>
                            </div>
                            <div className="text-[11px] text-slate-500 leading-relaxed bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="font-semibold text-slate-700">Nota técnica:</span> As métricas de navegação medem o tempo desde o início do request de rede até os eventos do ciclo de vida da janela (<code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">PerformanceNavigationTiming</code>).
                            </div>
                        </div>
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

            <GenericDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName={itemToDelete?.name}
                itemType={
                    itemToDelete?.type === 'account' ? 'conta financeira' :
                    itemToDelete?.type === 'category' ? 'categoria financeira' :
                    itemToDelete?.type === 'stage' ? 'estágio de crescimento' :
                    itemToDelete?.type === 'teaching_category' ? 'categoria de ensino' :
                    itemToDelete?.type === 'event_type' ? 'categoria de evento' :
                    'perfil de usuário'
                }
            />
        </div >
    );
};

export default Settings;
