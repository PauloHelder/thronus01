import React, { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Filter,
    Package,
    MapPin,
    Tag,
    History,
    Calendar,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Wrench,
    Trash2,
    Pencil,
    LayoutGrid,
    List,
    ExternalLink,
    BarChart3,
    FileText,
    TrendingDown,
    PieChart,
    ArrowDownRight,
    Activity,
    User,
    ChevronLeft,
    Clock,
    Download
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAssets } from '../hooks/useAssets';
import { useDepartments } from '../hooks/useDepartments';
import { useMembers } from '../hooks/useMembers';
import { Asset, AssetCategory } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';

import AssetModal from '../components/modals/AssetModal';
import AssetCategoryModal from '../components/modals/AssetCategoryModal';
import MaintenanceModal from '../components/modals/MaintenanceModal';
import DepreciationReport from '../components/DepreciationReport';
import { exportAssetsToPDF, exportAssetsToExcel } from '../utils/assetExportUtils';

const Assets = () => {
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const {
        assets,
        categories,
        loading,
        addAsset,
        updateAsset,
        deleteAsset,
        addCategory,
        addMaintenance,
        calculateDepreciation
    } = useAssets();

    const { departments } = useDepartments();
    const { members } = useMembers();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [conditionFilter, setConditionFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [assetForMaintenance, setAssetForMaintenance] = useState<Asset | null>(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as 'inventory' | 'reports' | 'categories' | 'maintenance') || 'inventory';

    const setActiveTab = (tab: 'inventory' | 'reports' | 'categories' | 'maintenance') => {
        if (tab === 'inventory') {
            searchParams.delete('tab');
        } else {
            searchParams.set('tab', tab);
        }
        setSearchParams(searchParams);
    };

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = categoryFilter === 'all' || asset.category_id === categoryFilter;
            const matchesCondition = conditionFilter === 'all' || asset.condition === conditionFilter;
            const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;

            return matchesSearch && matchesCategory && matchesCondition && matchesStatus;
        });
    }, [assets, searchTerm, categoryFilter, conditionFilter, statusFilter]);

    const stats = useMemo(() => {
        const totalValue = assets.reduce((sum, asset) => sum + Number(asset.purchase_price || 0), 0);
        const currentValue = assets.reduce((sum, asset) => sum + calculateDepreciation(asset), 0);
        const maintenanceCount = assets.filter(a => a.status === 'under_maintenance').length;
        const brokenCount = assets.filter(a => a.condition === 'broken').length;

        return {
            totalValue,
            currentValue,
            count: assets.length,
            maintenanceCount,
            brokenCount
        };
    }, [assets, calculateDepreciation]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA'
        }).format(value || 0);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '---';
        try {
            return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
        } catch {
            return '---';
        }
    };

    const handleSaveAsset = async (data: any) => {
        let success;
        if (selectedAsset) {
            success = await updateAsset(selectedAsset.id, data);
        } else {
            success = await addAsset(data);
        }
        return success;
    };

    const handleSaveCategory = async (name: string, description?: string, usefulLife?: number) => {
        return await addCategory(name, description, usefulLife);
    };

    const handleSaveMaintenance = async (data: any) => {
        const success = await addMaintenance(data);
        if (success && assetForMaintenance) {
            // Optionally update asset status if it was under maintenance
            if (assetForMaintenance.status === 'under_maintenance') {
                await updateAsset(assetForMaintenance.id, { status: 'available' });
            }
        }
        return success;
    };

    const handleExport = (type: 'pdf' | 'excel') => {
        const exportData = {
            assets: filteredAssets,
            categories,
            churchName: user?.churchName || 'Minha Igreja',
            filters: {
                category: categoryFilter === 'all' ? 'Todas' : (categories.find(c => c.id === categoryFilter)?.name || '---'),
                condition: conditionFilter === 'all' ? 'Todos' : conditionFilter,
                status: statusFilter === 'all' ? 'Todos' : statusFilter,
                searchTerm
            }
        };

        if (type === 'pdf') {
            exportAssetsToPDF(exportData);
        } else {
            exportAssetsToExcel(exportData);
        }
        setIsExportMenuOpen(false);
    };

    const getConditionBadge = (condition: string) => {
        const colors: Record<string, string> = {
            new: 'bg-blue-50 text-blue-700 border-blue-100',
            good: 'bg-green-50 text-green-700 border-green-100',
            fair: 'bg-orange-50 text-orange-700 border-orange-100',
            poor: 'bg-red-50 text-red-700 border-red-100',
            broken: 'bg-gray-900 text-white border-gray-800'
        };
        const labels: Record<string, string> = {
            new: 'Novo',
            good: 'Bom',
            fair: 'Regular',
            poor: 'Ruim',
            broken: 'Quebrado'
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[condition]}`}>
                {labels[condition]}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const icons: Record<string, any> = {
            available: <CheckCircle2 size={12} />,
            in_use: <User size={12} />,
            under_maintenance: <Wrench size={12} />,
            disposed: <Trash2 size={12} />
        };
        const colors: Record<string, string> = {
            available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            in_use: 'bg-blue-50 text-blue-700 border-blue-200',
            under_maintenance: 'bg-orange-50 text-orange-700 border-orange-200',
            disposed: 'bg-slate-50 text-slate-700 border-slate-200'
        };
        const labels: Record<string, string> = {
            available: 'Disponível',
            in_use: 'Em Uso',
            under_maintenance: 'Manutenção',
            disposed: 'Descartado'
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colors[status]}`}>
                {icons[status]}
                {labels[status]}
            </span>
        );
    };

    if (!hasPermission('assets_view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white m-8 rounded-3xl border border-gray-200">
                <div className="p-4 bg-red-50 text-red-500 rounded-full mb-6">
                    <ShieldAlert size={48} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
                <p className="text-slate-600 max-w-md mb-8">
                    Você não tem permissão para visualizar o Patrimônio da igreja.
                    Entre em contato com o administrador se considerar que isso é um erro.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center gap-2"
                >
                    <ChevronLeft size={20} />
                    Voltar ao Início
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-3 bg-white hover:bg-gray-100 text-slate-600 rounded-2xl border border-gray-200 shadow-sm transition-all active:scale-95 group"
                        title="Voltar ao Painel Principal"
                    >
                        <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Package className="text-orange-500" size={32} />
                            Patrimônio & Ativos
                        </h1>
                        <p className="text-slate-600 mt-1">Gestão completa de bens da igreja</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {hasPermission('assets_create') && (
                        <>
                            <button
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="flex-1 md:flex-none px-5 py-2.5 bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <Tag size={20} className="text-blue-500" /> Categorias
                            </button>
                            <button
                                onClick={() => { setSelectedAsset(null); setIsAssetModalOpen(true); }}
                                className="flex-1 md:flex-none px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-200"
                            >
                                <Plus size={20} /> Novo Ativo
                            </button>
                        </>
                    )}
                </div>
            </div>

            {activeTab === 'inventory' ? (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <DollarSign size={24} />
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Investimento</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalValue)}</h3>
                            <p className="text-sm text-slate-500 mt-1">Valor de aquisição</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign size={80} className="-mr-4 -mt-4 text-emerald-100" />
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Activity size={24} />
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Valor Atual</span>
                            </div>
                            <h3 className="text-2xl font-black text-emerald-700">{formatCurrency(stats.currentValue)}</h3>
                            <p className="text-sm text-slate-500 mt-1">Líquido depreciado</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                    <Package size={24} />
                                </div>
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Itens</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">{stats.count} Ativos</h3>
                            <p className="text-sm text-slate-500 mt-1">Bens registrados</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                    <Wrench size={24} />
                                </div>
                                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Em Reparo</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">{stats.maintenanceCount} Ativos</h3>
                            <p className="text-sm text-slate-500 mt-1">Em manutenção</p>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Pesquisar por nome, descrição, serial..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="all">Todas Categorias</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>

                            <select
                                value={conditionFilter}
                                onChange={(e) => setConditionFilter(e.target.value)}
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="all">Todas Condições</option>
                                <option value="new">Novos</option>
                                <option value="good">Bons</option>
                                <option value="fair">Regulares</option>
                                <option value="poor">Ruins</option>
                                <option value="broken">Quebrados</option>
                            </select>

                            <div className="h-10 w-px bg-gray-200 mx-1 hidden lg:block"></div>

                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    <LayoutGrid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    <List size={20} />
                                </button>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                    className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-all font-bold shadow-sm h-[42px]"
                                >
                                    <Download size={18} />
                                    Exportar
                                </button>

                                {isExportMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={() => handleExport('pdf')}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors"
                                        >
                                            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                                                <FileText size={14} />
                                            </div>
                                            Lista em PDF
                                        </button>
                                        <button
                                            onClick={() => handleExport('excel')}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors"
                                        >
                                            <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                                                <Download size={14} />
                                            </div>
                                            Planilha Excel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Assets Content */}
                    {filteredAssets.length === 0 ? (
                        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                <Package size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Nenhum ativo encontrado</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2 italic">Ajuste seus filtros ou adicione novos bens ao patrimônio da igreja.</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredAssets.map(asset => (
                                <div key={asset.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                                    {/* Asset Image/Thumb */}
                                    <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                        {asset.image_url ? (
                                            <img src={asset.image_url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Package size={64} />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            {getConditionBadge(asset.condition)}
                                        </div>
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex gap-2">
                                                {hasPermission('assets_edit') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAsset(asset);
                                                            setIsAssetModalOpen(true);
                                                        }}
                                                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-600 hover:text-orange-600 shadow-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                )}
                                                {hasPermission('assets_delete') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Excluir este ativo permanentemente?')) deleteAsset(asset.id);
                                                        }}
                                                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-600 hover:text-red-600 shadow-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-xs font-black text-orange-500 uppercase tracking-widest">{asset.category?.name || 'Geral'}</p>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-slate-800">{formatCurrency(calculateDepreciation(asset))}</p>
                                                <p className="text-[10px] text-slate-400 line-through">{formatCurrency(asset.purchase_price)}</p>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2 truncate">{asset.name}</h3>

                                        <div className="space-y-3 mb-6 flex-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPin size={16} className="text-slate-400" />
                                                <span>{asset.location || asset.department?.name || 'Não definido'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Tag size={16} className="text-slate-400" />
                                                <span>SN: {asset.serial_number || '---'}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                            {getStatusBadge(asset.status)}
                                            <button
                                                onClick={() => {
                                                    setAssetForMaintenance(asset);
                                                    setIsMaintenanceModalOpen(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                                                title="Manutenção"
                                            >
                                                <Wrench size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Informações</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Localização</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Valor</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredAssets.map(asset => (
                                        <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                                        {asset.image_url ? (
                                                            <img src={asset.image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : <Package size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{asset.name}</p>
                                                        <p className="text-xs text-slate-400">{asset.category?.name || 'Geral'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-600">{asset.location || 'Não definido'}</span>
                                                    {asset.department && <span className="text-[10px] text-slate-400 uppercase font-bold">{asset.department.name}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{getConditionBadge(asset.condition)}</td>
                                            <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="font-black text-slate-800">{formatCurrency(calculateDepreciation(asset))}</p>
                                                <p className="text-[10px] text-slate-400">Orig: {formatCurrency(asset.purchase_price)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {hasPermission('assets_edit') && (
                                                        <button
                                                            onClick={() => {
                                                                setAssetForMaintenance(asset);
                                                                setIsMaintenanceModalOpen(true);
                                                            }}
                                                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                                                            title="Registrar Manutenção"
                                                        >
                                                            <Wrench size={18} />
                                                        </button>
                                                    )}
                                                    {hasPermission('assets_edit') && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAsset(asset);
                                                                setIsAssetModalOpen(true);
                                                            }}
                                                            className="p-2 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors border border-transparent hover:border-orange-100"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                    )}
                                                    {hasPermission('assets_delete') && (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Tem certeza que deseja excluir este bem permanentemente?')) {
                                                                    deleteAsset(asset.id);
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </>
            ) : activeTab === 'categories' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {categories.map(cat => {
                        const catAssets = assets.filter(a => a.category_id === cat.id);
                        const totalValue = catAssets.reduce((sum, a) => sum + Number(a.purchase_price || 0), 0);
                        return (
                            <div key={cat.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Tag size={24} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ativos</p>
                                        <p className="text-xl font-black text-slate-800">{catAssets.length}</p>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{cat.name}</h3>
                                {cat.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{cat.description}</p>}
                                <div className="space-y-3 pt-4 border-t border-gray-50">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Vida Útil Padrão:</span>
                                        <span className="text-slate-800 font-bold">{cat.useful_life_years} anos</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Investimento:</span>
                                        <span className="text-slate-800 font-bold">{formatCurrency(totalValue)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-slate-400 hover:text-blue-600 group h-full min-h-[200px]"
                    >
                        <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-blue-100 transition-colors mb-3">
                            <Plus size={32} />
                        </div>
                        <span className="font-black">Nova Categoria</span>
                    </button>
                </div>
            ) : activeTab === 'maintenance' ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Wrench className="text-amber-500" size={20} />
                                Ativos em Manutenção
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {assets.filter(a => a.status === 'under_maintenance').length === 0 ? (
                                <div className="p-12 text-center text-slate-400 italic">
                                    Nenhum ativo em manutenção no momento.
                                </div>
                            ) : (
                                assets.filter(a => a.status === 'under_maintenance').map(asset => (
                                    <div key={asset.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{asset.name}</h4>
                                                <p className="text-xs text-slate-500">{asset.category?.name} • {asset.location}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setAssetForMaintenance(asset); setIsMaintenanceModalOpen(true); }}
                                            className="px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl font-bold text-sm transition-all"
                                        >
                                            Registrar Saída
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Clock className="text-blue-500" size={20} />
                                Próximas Manutenções Programadas
                            </h3>
                        </div>
                        <div className="p-12 text-center text-slate-400 italic">
                            Funcionalidade de calendário de manutenção em desenvolvimento.
                        </div>
                    </div>
                </div>
            ) : (
                <DepreciationReport
                    assets={assets}
                    categories={categories}
                    calculateDepreciation={calculateDepreciation}
                    formatCurrency={formatCurrency}
                    churchName={user?.churchName || 'Minha Igreja'}
                />
            )}

            {/* Modals */}
            <AssetModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                onSave={handleSaveAsset}
                asset={selectedAsset}
                categories={categories}
                departments={departments}
                members={members}
            />

            <AssetCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSave={handleSaveCategory}
            />

            {assetForMaintenance && (
                <MaintenanceModal
                    isOpen={isMaintenanceModalOpen}
                    onClose={() => setIsMaintenanceModalOpen(false)}
                    onSave={handleSaveMaintenance}
                    assetName={assetForMaintenance.name}
                    assetId={assetForMaintenance.id}
                />
            )}
        </div>
    );
};

export default Assets;
