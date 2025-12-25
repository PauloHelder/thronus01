import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Building, Users, CreditCard, Activity, Search, Trash2, Edit, Shield, Plus, Book, Save, X } from 'lucide-react';
import EditChurchModal from '../../components/modals/EditChurchModal';
import PlanModal from '../../components/modals/PlanModal';
import { useDenominations } from '../../hooks/useDenominations';
import { toast } from 'sonner';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [churches, setChurches] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalChurches: 0,
        activeChurches: 0,
        totalUsers: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'churches' | 'plans' | 'denominations'>('churches');

    // Denominations State
    const { denominations, addDenomination, updateDenomination, deleteDenomination, loading: loadingDenominations } = useDenominations();
    const [isDenomModalOpen, setIsDenomModalOpen] = useState(false);
    const [denomFormData, setDenomFormData] = useState({
        id: '',
        name: '',
        acronym: '',
        doctrinal_current: '',
        max_leader: '',
        recognition_year: '' as any
    });

    // Edit Modal State
    const [selectedChurch, setSelectedChurch] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Plan Modal State
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch churches with subscriptions and plans
            const { data: churchesData, error: churchesError } = await supabase
                .from('churches')
                .select(`
                    *,
                    subscriptions (
                        id,
                        plan_id,
                        start_date,
                        end_date,
                        plans (
                            name
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (churchesError) throw churchesError;

            // Fetch Plans
            const { data: plansData, error: plansError } = await supabase
                .from('plans')
                .select('*')
                .order('price', { ascending: true });

            if (plansError) throw plansError;
            setPlans(plansData || []);

            // Fetch total users count
            const { count: usersCount, error: usersError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            if (usersError) {
                console.error('Error fetching users count:', usersError);
            }

            setChurches(churchesData || []);

            // Calculate stats
            // Active church = has at least one active subscription or status in settings is active
            const activeChurchesCount = (churchesData || []).filter((c: any) => {
                const sub = c.subscriptions?.[0];
                const isActiveSub = sub && new Date(sub.end_date) > new Date();
                return c.settings?.status === 'active' || isActiveSub;
            }).length;

            setStats({
                totalChurches: churchesData?.length || 0,
                activeChurches: activeChurchesCount,
                totalUsers: usersCount || 0
            });

        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChurch = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta igreja? Esta ação não pode ser desfeita.')) return;

        try {
            const { error } = await supabase.from('churches').delete().eq('id', id);
            if (error) throw error;
            setChurches(churches.filter(c => c.id !== id));
            toast.success('Igreja excluída com sucesso.');
        } catch (error) {
            console.error('Error deleting church:', error);
            toast.error('Erro ao excluir igreja.');
        }
    };

    const handleEditChurch = (church: any) => {
        setSelectedChurch(church);
        setIsEditModalOpen(true);
    };

    const handleUpdateChurch = () => {
        fetchData();
    };

    // Plan Actions
    const handleCreatePlan = () => {
        setSelectedPlan(null);
        setIsPlanModalOpen(true);
    };

    const handleEditPlan = (plan: any) => {
        setSelectedPlan(plan);
        setIsPlanModalOpen(true);
    };

    const handleDeletePlan = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;
        try {
            const { error } = await supabase.from('plans').delete().eq('id', id);
            if (error) throw error;
            setPlans(plans.filter(p => p.id !== id));
            toast.success('Plano excluído com sucesso.');
        } catch (error) {
            console.error('Error deleting plan:', error);
            toast.error('Erro ao excluir plano.');
        }
    };

    const handleUpdatePlan = () => {
        fetchData();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
    };

    const formatPeriod = (period: string) => {
        const map: Record<string, string> = {
            monthly: 'Mensal',
            quarterly: 'Trimestral',
            semiannual: 'Semestral',
            annual: 'Anual'
        };
        return map[period] || period;
    };

    const getStatusBadge = (church: any) => {
        const sub = church.subscriptions?.[0];
        const settingsStatus = church.settings?.status;

        if (settingsStatus === 'active') {
            return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Ativo</span>;
        }
        if (settingsStatus === 'inactive') {
            return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Inativo</span>;
        }
        if (settingsStatus === 'pending') {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pendente</span>;
        }

        // Fallback to subscription check
        if (sub && new Date(sub.end_date) > new Date()) {
            return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Ativo</span>;
        }

        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Sem Status</span>;
    };

    const filteredChurches = churches.filter(church =>
        church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        church.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Shield className="text-orange-600" size={32} />
                            Painel Super Admin
                        </h1>
                        <p className="text-slate-500 mt-1">Gerenciamento global do sistema Tronus</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                            SA
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700">{user?.fullName}</p>
                            <p className="text-xs text-slate-500">Super Usuário</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Building size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total de Igrejas</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.totalChurches}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Igrejas Ativas</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.activeChurches}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total de Usuários</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.totalUsers}</h3>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('churches')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'churches'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Igrejas Cadastradas
                    </button>
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'plans'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Gerenciar Planos
                    </button>
                    <button
                        onClick={() => setActiveTab('denominations')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'denominations'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Denominações
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'churches' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50">
                            <h2 className="font-semibold text-slate-700">Listagem de Igrejas</h2>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar igreja..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Igreja</th>
                                        <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase">Plano</th>
                                        <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase">Início</th>
                                        <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase">Fim</th>
                                        <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredChurches.map(church => {
                                        const sub = church.subscriptions?.[0];
                                        return (
                                            <tr key={church.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                                                            <Building size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-800">{church.name}</p>
                                                            <p className="text-xs text-slate-400 max-w-[150px] truncate" title={church.slug}>{church.slug}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-slate-600">
                                                        {sub?.plans?.name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-slate-600">
                                                    {sub?.start_date ? new Date(sub.start_date).toLocaleDateString('pt-BR') : '-'}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-slate-600">
                                                    {sub?.end_date ? new Date(sub.end_date).toLocaleDateString('pt-BR') : '-'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {getStatusBadge(church)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditChurch(church)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar Detalhes"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteChurch(church.id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Excluir Igreja"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredChurches.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                                Nenhuma igreja encontrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'plans' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Planos de Assinatura</h2>
                                <p className="text-sm text-slate-500">Gerencie os planos e recursos disponíveis</p>
                            </div>
                            <button
                                onClick={handleCreatePlan}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Criar Novo Plano
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {plans.map(plan => (
                                <div key={plan.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-6 border-b border-gray-100">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {plan.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-slate-900">{formatCurrency(plan.price)}</span>
                                            <span className="text-sm text-slate-500">/{formatPeriod(plan.billing_period)}</span>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50/50 space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Users size={16} className="text-slate-400" />
                                            <span>{plan.features?.maxMembers || 0} Membros</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Building size={16} className="text-slate-400" />
                                            <span>{plan.features?.maxGroups || 0} Células</span>
                                        </div>
                                        <div className="pt-4 flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditPlan(plan)}
                                                className="flex-1 px-3 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-50 hover:text-slate-800 transition-colors text-sm font-medium"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlan(plan.id)}
                                                className="px-3 py-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {plans.length === 0 && (
                                <div className="col-span-full py-12 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <CreditCard size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-800 mb-1">Nenhum plano cadastrado</h3>
                                    <p className="text-slate-500 mb-4">Comece criando o primeiro plano de assinatura.</p>
                                    <button
                                        onClick={handleCreatePlan}
                                        className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                                    >
                                        Criar Plano Agora
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'denominations' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Gerenciar Denominações</h2>
                                <p className="text-sm text-slate-500">Lista de denominações disponíveis para cadastro</p>
                            </div>
                            <button
                                onClick={() => {
                                    setDenomFormData({ id: '', name: '', acronym: '', doctrinal_current: '', max_leader: '', recognition_year: '' });
                                    setIsDenomModalOpen(true);
                                }}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Nova Denominação
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Nome / Sigla</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Líder / Corrente</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ano Rec.</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loadingDenominations ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                Carregando...
                                            </td>
                                        </tr>
                                    ) : denominations.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                Nenhuma denominação cadastrada.
                                            </td>
                                        </tr>
                                    ) : (
                                        denominations.map(den => (
                                            <tr key={den.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                                            <Book size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-800">{den.name}</p>
                                                            {den.acronym && <p className="text-xs text-slate-400">{den.acronym}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        {den.max_leader && <p className="text-sm text-slate-700">{den.max_leader}</p>}
                                                        {den.doctrinal_current && <p className="text-xs text-slate-500">{den.doctrinal_current}</p>}
                                                        {!den.max_leader && !den.doctrinal_current && <span className="text-slate-400">-</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {den.recognition_year || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setDenomFormData({
                                                                    id: den.id,
                                                                    name: den.name,
                                                                    acronym: den.acronym || '',
                                                                    doctrinal_current: den.doctrinal_current || '',
                                                                    max_leader: den.max_leader || '',
                                                                    recognition_year: den.recognition_year || ''
                                                                });
                                                                setIsDenomModalOpen(true);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Tem certeza que deseja excluir esta denominação?')) {
                                                                    deleteDenomination(den.id);
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Denomination Modal */}
            {isDenomModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                {denomFormData.id ? 'Editar Denominação' : 'Nova Denominação'}
                            </h3>
                            <button onClick={() => setIsDenomModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const payload = {
                                    name: denomFormData.name,
                                    acronym: denomFormData.acronym || null,
                                    doctrinal_current: denomFormData.doctrinal_current || null,
                                    max_leader: denomFormData.max_leader || null,
                                    recognition_year: denomFormData.recognition_year ? parseInt(denomFormData.recognition_year) : null
                                };

                                if (denomFormData.id) {
                                    await updateDenomination(denomFormData.id, payload);
                                } else {
                                    await addDenomination(payload);
                                }
                                setIsDenomModalOpen(false);
                            } catch (error) {
                                // Error handled in hook
                            }
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={denomFormData.name}
                                        onChange={e => setDenomFormData({ ...denomFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Sigla</label>
                                        <input
                                            type="text"
                                            value={denomFormData.acronym}
                                            onChange={e => setDenomFormData({ ...denomFormData, acronym: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Ano Reconhecimento</label>
                                        <input
                                            type="number"
                                            value={denomFormData.recognition_year}
                                            onChange={e => setDenomFormData({ ...denomFormData, recognition_year: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Líder Máximo</label>
                                    <input
                                        type="text"
                                        value={denomFormData.max_leader}
                                        onChange={e => setDenomFormData({ ...denomFormData, max_leader: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Corrente Doutrinária</label>
                                    <input
                                        type="text"
                                        value={denomFormData.doctrinal_current}
                                        onChange={e => setDenomFormData({ ...denomFormData, doctrinal_current: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsDenomModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <EditChurchModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                church={selectedChurch}
                onUpdate={handleUpdateChurch}
            />

            <PlanModal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                plan={selectedPlan}
                onUpdate={handleUpdatePlan}
            />
        </div>
    );
};

export default AdminDashboard;
