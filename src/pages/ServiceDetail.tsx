import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, MapPin, Users, Save, Heart, MessageSquare, ClipboardList, Info, Loader2, Banknote, Plus, Trash2, MessageCircle } from 'lucide-react';
import { Service, DepartmentSchedule, Member } from '../types';
import { useServices } from '../hooks/useServices';
import { supabase } from '../lib/supabase';
import CommunicationModal from '../components/modals/CommunicationModal';
import SmsHistoryTab from '../components/tabs/SmsHistoryTab';
import WhatsappHistoryTab from '../components/tabs/WhatsappHistoryTab';
import { useAuth } from '../contexts/AuthContext';
import { useWhatsapp } from '../hooks/useWhatsapp';
import { useFinance, FinancialTransaction } from '../hooks/useFinance';
import { formatAOA } from '../utils/currency';

const ServiceDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getService, updateStatistics } = useServices();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState({
        adults: { men: 0, women: 0 },
        children: { boys: 0, girls: 0 },
        visitors: { men: 0, women: 0 },
        newConverts: { men: 0, women: 0, children: 0 }
    });
    const [activeTab, setActiveTab] = useState<'stats' | 'team' | 'sms' | 'whatsapp' | 'offertory'>('stats');
    const { isConnected: whatsappConnected } = useWhatsapp();
    const [serviceTransactions, setServiceTransactions] = useState<FinancialTransaction[]>([]);
    const { fetchServiceTransactions, addTransaction, accounts, categories } = useFinance();
    const [relatedSchedules, setRelatedSchedules] = useState<DepartmentSchedule[]>([]);
    const [teamMembers, setTeamMembers] = useState<Member[]>([]);
    const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<{deptName: string, members: Member[]} | null>(null);
    const { hasPermission, hasRole } = useAuth();

    useEffect(() => {
        const fetchServiceData = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const serviceData = await getService(id);
                if (serviceData) {
                    setService(serviceData);
                    setStatistics(serviceData.statistics || {
                        adults: { men: 0, women: 0 },
                        children: { boys: 0, girls: 0 },
                        visitors: { men: 0, women: 0 },
                        newConverts: 0
                    });
                } else {
                    alert('Culto não encontrado');
                    navigate('/services');
                }
            } catch (error) {
                console.error('Error fetching service:', error);
                alert('Erro ao carregar culto');
                navigate('/services');
            } finally {
                setLoading(false);
            }
        };

        const fetchRelatedData = async () => {
            if (!id) return;
            try {
                // Fetch schedules linked to this service with department info and assignments
                const { data: schedulesData } = await supabase
                    .from('department_schedules' as any)
                    .select(`
                        *,
                        departments:departments(name),
                        assignments:department_schedule_assignments(
                            member:members(id, name, avatar_url, phone)
                        )
                    `)
                    .eq('service_id', id);

                if (schedulesData) {
                    const mappedSchedules = (schedulesData as any[]).map(s => ({
                        id: s.id,
                        departmentId: s.department_id,
                        departmentName: s.departments?.name || 'Departamento',
                        type: s.type,
                        serviceId: s.service_id,
                        date: s.date,
                        notes: s.notes,
                        assignedMembers: s.assignments?.map((a: any) => a.member?.id) || [],
                        members: s.assignments?.map((a: any) => ({
                            id: a.member?.id,
                            name: a.member?.name,
                            avatar: a.member?.avatar_url,
                            phone: a.member?.phone
                        })).filter((m: any) => m.id) || []
                    }));
                    setRelatedSchedules(mappedSchedules as any);

                    // Fetch all unique members for the SMS modal
                    const allMembers = mappedSchedules.flatMap(s => s.members);
                    const uniqueMembers = Array.from(new Map(allMembers.map(m => [m.id, m])).values());
                    setTeamMembers(uniqueMembers);
                }
            } catch (error) {
                console.error('Error fetching related data:', error);
            }
        };

        fetchServiceData();
        fetchRelatedData();
    }, [id]);

    useEffect(() => {
        const fetchTxs = async () => {
            if (id && activeTab === 'offertory') {
                const txs = await fetchServiceTransactions(id);
                setServiceTransactions(txs);
            }
        };
        fetchTxs();
    }, [id, activeTab, fetchServiceTransactions]);

    const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
    const [showDenominations, setShowDenominations] = useState(false);
    const [denominations, setDenominations] = useState<Record<string, number>>({
        '5000': 0,
        '2000': 0,
        '1000': 0,
        '500': 0,
        '200': 0,
        '100': 0,
        '50': 0,
        '20': 0,
        '10': 0,
        '5': 0
    });

    const totalFromDenominations = useMemo(() => {
        return Object.entries(denominations).reduce((acc, [val, qty]) => acc + (parseInt(val) * qty), 0);
    }, [denominations]);

    const handleDenominationChange = (val: string, qty: string) => {
        const numQty = parseInt(qty) || 0;
        setDenominations(prev => ({ ...prev, [val]: numQty }));
    };
    const [newTx, setNewTx] = useState({
        description: '',
        amount: '',
        type: 'income' as 'income' | 'expense',
        category_id: '',
        account_id: '',
        status: 'paid' as 'paid' | 'pending'
    });

    const handleAddTransaction = async () => {
        if (!id || !newTx.description || !newTx.amount || !newTx.account_id) {
            alert('Preencha os campos obrigatórios (Descrição, Valor e Conta)');
            return;
        }

        try {
            const success = await addTransaction({
                description: newTx.description,
                amount: Number(newTx.amount),
                type: newTx.type,
                date: service?.date || new Date().toISOString().split('T')[0],
                category_id: newTx.category_id || undefined,
                account_id: newTx.account_id,
                status: newTx.status,
                source_type: 'service',
                source_id: id
            });

            if (success) {
                const txs = await fetchServiceTransactions(id);
                setServiceTransactions(txs);
                setIsAddTxModalOpen(false);
                setNewTx({
                    description: '',
                    amount: '',
                    type: 'income',
                    category_id: '',
                    account_id: '',
                    status: 'paid'
                });
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('Erro ao adicionar transação');
        }
    };

    const totalNewConverts = (statistics.newConverts?.men || 0) +
        (statistics.newConverts?.women || 0) +
        (statistics.newConverts?.children || 0);

    const handleSaveStatistics = async () => {
        if (!id) return;

        try {
            await updateStatistics(id, statistics);
            setService(prev => prev ? { ...prev, statistics } : null);
            alert('Estatísticas salvas com sucesso!');
        } catch (error) {
            console.error('Error saving statistics:', error);
            alert('Erro ao salvar estatísticas');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Agendado': return 'bg-blue-100 text-blue-700';
            case 'Concluído': return 'bg-green-100 text-green-700';
            case 'Cancelado': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Agendado': return 'bg-blue-500/20 text-white border border-white/30';
            case 'Concluído': return 'bg-green-500/20 text-white border border-white/30';
            case 'Cancelado': return 'bg-red-500/20 text-white border border-white/30';
            default: return 'bg-gray-500/20 text-white border border-white/30';
        }
    };

    const totalAdults = statistics.adults.men + statistics.adults.women;
    const totalChildren = statistics.children.boys + statistics.children.girls;
    const totalVisitors = statistics.visitors.men + statistics.visitors.women;
    // Total geral NÃO inclui visitantes
    const totalAttendance = totalAdults + totalChildren;

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                    <p className="text-slate-600">Carregando culto...</p>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-slate-600 text-lg">Culto não encontrado</p>
                    <button
                        onClick={() => navigate('/services')}
                        className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Voltar para Cultos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
                <button
                    onClick={() => navigate('/services')}
                    className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar para Cultos</span>
                </button>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{service.typeName}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-white/90">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} />
                                <span>{formatDate(service.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={18} />
                                <span>{service.startTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={18} />
                                <span>{service.location}</span>
                            </div>
                        </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeColor(service.status)}`}>
                        {service.status}
                    </span>
                </div>
            </div>

            {/* Content Tabs Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 lg:px-6">
                <div className="flex overflow-x-auto no-scrollbar gap-8">
                    {[
                        { id: 'stats', label: 'Estatísticas', icon: <Save size={18} /> },
                        { id: 'team', label: 'Equipe Escalada', icon: <Users size={18} /> },
                        { id: 'offertory', label: 'Ofertório', icon: <Banknote size={18} /> },
                        ...(hasPermission('whatsapp_send') && whatsappConnected ? [{ id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} /> }] : []),
                        ...(hasRole('superuser') ? [{ id: 'sms', label: 'Comunicação SMS', icon: <MessageSquare size={18} /> }] : []),
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-all font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {activeTab === 'stats' && (
                    <>
                {/* Informações do Culto */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações do Culto</h2>
                    
                    {service.theme && (
                        <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                            <label className="block text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Tema da Ministração</label>
                            <p className="text-xl font-bold text-slate-800 italic">"{service.theme}"</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Local</label>
                            <div className="flex items-center gap-2 text-slate-800">
                                <MapPin size={16} />
                                <span>{service.location}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Pregador</label>
                            <div className="flex items-center gap-2 text-slate-800">
                                <User size={16} />
                                <span>{service.preacher || 'Não definido'}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Pregador Suplente</label>
                            <div className="flex items-center gap-2 text-slate-800">
                                <User size={16} className="text-slate-400" />
                                <span>{service.substitutePreacher || 'Não definido'}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Dirigente</label>
                            <div className="flex items-center gap-2 text-slate-800">
                                <User size={16} />
                                <span>{service.leader || 'Não definido'}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Dirigente Suplente</label>
                            <div className="flex items-center gap-2 text-slate-800">
                                <User size={16} className="text-slate-400" />
                                <span>{service.substituteLeader || 'Não definido'}</span>
                            </div>
                        </div>
                        {service.description && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Descrição</label>
                                <p className="text-slate-800">{service.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Estatísticas de Presença */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Users size={20} className="text-orange-500" />
                            <h2 className="text-lg font-semibold text-slate-800">Estatísticas de Presença</h2>
                        </div>
                        <button
                            onClick={handleSaveStatistics}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Save size={16} /> Salvar
                        </button>
                    </div>

                    {/* Resumo Total */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                            <p className="text-blue-600 text-sm font-medium mb-1">Total Geral</p>
                            <p className="text-3xl font-bold text-blue-700">{totalAttendance}</p>
                            <p className="text-xs text-blue-600 mt-1">Sem visitantes</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                            <p className="text-purple-600 text-sm font-medium mb-1">Adultos</p>
                            <p className="text-3xl font-bold text-purple-700">{totalAdults}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                            <p className="text-green-600 text-sm font-medium mb-1">Crianças</p>
                            <p className="text-3xl font-bold text-green-700">{totalChildren}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                            <p className="text-orange-600 text-sm font-medium mb-1">Visitantes</p>
                            <p className="text-3xl font-bold text-orange-700">{totalVisitors}</p>
                            <p className="text-xs text-orange-600 mt-1">Não conta no total</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                            <p className="text-red-600 text-sm font-medium mb-1">Novas Conversões</p>
                            <p className="text-3xl font-bold text-red-700">{totalNewConverts}</p>
                            <p className="text-xs text-red-600 mt-1">Impacto espiritual</p>
                        </div>
                    </div>

                    {/* Formulário de Estatísticas */}
                    <div className="space-y-6">
                        {/* Adultos */}
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                <Users size={18} />
                                Adultos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-1">Homens</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={statistics.adults.men}
                                        onChange={(e) => setStatistics({
                                            ...statistics,
                                            adults: { ...statistics.adults, men: parseInt(e.target.value) || 0 }
                                        })}
                                        className="w-full px-4 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-1">Mulheres</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={statistics.adults.women}
                                        onChange={(e) => setStatistics({
                                            ...statistics,
                                            adults: { ...statistics.adults, women: parseInt(e.target.value) || 0 }
                                        })}
                                        className="w-full px-4 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-1">Total</label>
                                    <input
                                        type="number"
                                        value={totalAdults}
                                        disabled
                                        className="w-full px-4 py-2 bg-purple-100 border border-purple-200 rounded-lg text-purple-800 font-semibold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Crianças */}
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                <Users size={18} />
                                Crianças
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-green-700 mb-1">Meninos</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={statistics.children.boys}
                                        onChange={(e) => setStatistics({
                                            ...statistics,
                                            children: { ...statistics.children, boys: parseInt(e.target.value) || 0 }
                                        })}
                                        className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-green-700 mb-1">Meninas</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={statistics.children.girls}
                                        onChange={(e) => setStatistics({
                                            ...statistics,
                                            children: { ...statistics.children, girls: parseInt(e.target.value) || 0 }
                                        })}
                                        className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-green-700 mb-1">Total</label>
                                    <input
                                        type="number"
                                        value={totalChildren}
                                        disabled
                                        className="w-full px-4 py-2 bg-green-100 border border-green-200 rounded-lg text-green-800 font-semibold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Visitantes */}
                         <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                                <Users size={18} />
                                Visitantes
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-orange-700 mb-1">Homens</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={statistics.visitors.men}
                                        onChange={(e) => setStatistics({
                                            ...statistics,
                                            visitors: { ...statistics.visitors, men: parseInt(e.target.value) || 0 }
                                        })}
                                        className="w-full px-4 py-2 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-orange-700 mb-1">Mulheres</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={statistics.visitors.women}
                                        onChange={(e) => setStatistics({
                                            ...statistics,
                                            visitors: { ...statistics.visitors, women: parseInt(e.target.value) || 0 }
                                        })}
                                        className="w-full px-4 py-2 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-orange-600 mt-2">
                                * Total de visitantes: {totalVisitors}
                            </p>
                        </div>

                        {/* Novos Convertidos */}
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                                <Heart size={18} />
                                Novos Convertidos (Conversões)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-1">Homens</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={statistics.newConverts?.men || 0}
                                        onChange={(e) => setStatistics({
                                            ...statistics,
                                            newConverts: {
                                                men: parseInt(e.target.value) || 0,
                                                women: statistics.newConverts?.women || 0,
                                                children: statistics.newConverts?.children || 0
                                            }
                                        })}
                                        className="w-full px-4 py-2 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-1">Mulheres</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={statistics.newConverts?.women || 0}
                                        onChange={(e) => setStatistics({
                                            ...statistics,
                                            newConverts: {
                                                men: statistics.newConverts?.men || 0,
                                                women: parseInt(e.target.value) || 0,
                                                children: statistics.newConverts?.children || 0
                                            }
                                        })}
                                        className="w-full px-4 py-2 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-1">Crianças</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={statistics.newConverts?.children || 0}
                                        onChange={(e) => setStatistics({
                                            ...statistics,
                                            newConverts: {
                                                men: statistics.newConverts?.men || 0,
                                                women: statistics.newConverts?.women || 0,
                                                children: parseInt(e.target.value) || 0
                                            }
                                        })}
                                        className="w-full px-4 py-2 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-red-600 italic">
                                    Registre aqui o impacto das almas ganhas neste culto.
                                </p>
                            </div>
                        </div>
                    </div>
                        </div>
                    </>
                )}

                {activeTab === 'team' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Escalas por Departamento</h2>
                                <p className="text-sm text-slate-500">Departamentos que criaram escala para este culto</p>
                            </div>
                            <div className="flex gap-2">
                                {hasPermission('whatsapp_send') && whatsappConnected && (
                                    <button
                                        onClick={() => setIsSmsModalOpen(true)}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                                    >
                                        <MessageCircle size={16} /> Enviar Mensagem
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsSmsModalOpen(true)}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                                >
                                    <MessageSquare size={16} /> Notificar Todos
                                </button>
                            </div>
                        </div>

                        {relatedSchedules.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {relatedSchedules.map((schedule: any) => (
                                    <div key={schedule.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-col justify-between">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">{schedule.departmentName}</h3>
                                                    <p className="text-xs text-slate-500">{schedule.members?.length || 0} pessoas escaladas</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {schedule.notes && (
                                            <p className="text-sm text-slate-600 mb-4 line-clamp-2 italic">
                                                "{schedule.notes}"
                                            </p>
                                        )}

                                        <button
                                            onClick={() => {
                                                setSelectedSchedule({
                                                    deptName: schedule.departmentName,
                                                    members: schedule.members
                                                });
                                                setIsTeamModalOpen(true);
                                            }}
                                            className="w-full py-2 bg-white border border-gray-200 hover:border-orange-500 hover:text-orange-600 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                                        >
                                            <Users size={16} /> Ver Equipe
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <Users size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Nenhuma escala registrada para este culto.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'offertory' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Banknote className="text-orange-500" />
                                Movimentações do Culto
                            </h2>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowDenominations(!showDenominations)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm border ${
                                        showDenominations 
                                        ? 'bg-slate-100 text-slate-700 border-slate-200' 
                                        : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <Banknote size={18} />
                                    {showDenominations ? 'Ocultar Moedas' : 'Contar Moedas/Cédulas'}
                                </button>
                                <button 
                                    onClick={() => setIsAddTxModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                                >
                                    <Plus size={18} />
                                    Lançar Oferta/Despesa
                                </button>
                            </div>
                        </div>

                        {showDenominations && (
                            <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-md animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Cédulas e Moedas (AOA)</h3>
                                        <p className="text-xs text-slate-500">Contagem física do ofertório</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs uppercase font-bold text-slate-400">Total Contado</p>
                                        <p className="text-xl font-black text-orange-600">{formatAOA(totalFromDenominations)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                    {[5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5].map((val) => (
                                        <div key={val} className="space-y-1.5">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                                {val >= 100 ? `Cédula ${val}` : `Moeda ${val}`}
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={denominations[val] || ''}
                                                    onChange={(e) => handleDenominationChange(val.toString(), e.target.value)}
                                                    placeholder="0"
                                                    className="w-full pl-3 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                                />
                                            </div>
                                            <p className="text-[10px] text-right text-slate-400 font-medium">
                                                = {formatAOA((denominations[val] || 0) * val)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                                    <button 
                                        onClick={() => setDenominations({
                                            '5000': 0, '2000': 0, '1000': 0, '500': 0, '200': 0,
                                            '100': 0, '50': 0, '20': 0, '10': 0, '5': 0
                                        })}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                                    >
                                        Limpar Tudo
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setNewTx(prev => ({ ...prev, amount: totalFromDenominations.toString(), description: 'Oferta do Culto (Contagem Física)' }));
                                            setIsAddTxModalOpen(true);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors"
                                    >
                                        <Plus size={14} /> Usar no Lançamento
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-sm text-slate-500 mb-1">Entradas</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatAOA(
                                        serviceTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0)
                                    )}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-sm text-slate-500 mb-1">Saídas</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatAOA(
                                        serviceTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0)
                                    )}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-sm text-slate-500 mb-1">Saldo do Culto</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {formatAOA(
                                        serviceTransactions.reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0)
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr className="text-xs font-bold text-slate-500 uppercase">
                                            <th className="px-6 py-4">Descrição</th>
                                            <th className="px-6 py-4">Categoria</th>
                                            <th className="px-6 py-4">Conta</th>
                                            <th className="px-6 py-4 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {serviceTransactions.length > 0 ? (
                                            serviceTransactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-slate-800">{tx.description}</p>
                                                        <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {tx.category?.name || 'Geral'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {tx.account?.name || '-'}
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.type === 'income' ? '+' : '-'} {formatAOA(tx.amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                    Nenhum lançamento financeiro para este culto.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sms' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <SmsHistoryTab contextType="service" contextId={id || ''} />
                    </div>
                )}

                {activeTab === 'whatsapp' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <WhatsappHistoryTab contextType="service" contextId={id || ''} />
                    </div>
                )}
            </div>

            {id && (
                <CommunicationModal
                    isOpen={isSmsModalOpen}
                    onClose={() => setIsSmsModalOpen(false)}
                    recipients={teamMembers.map(m => ({ 
                        id: m.id, 
                        name: m.name, 
                        phone: m.phone || '' 
                    }))}
                    contextType="service"
                    contextId={id}
                    onSuccess={() => {
                        if (hasPermission('whatsapp_send') && whatsappConnected) setActiveTab('whatsapp');
                        else setActiveTab('sms');
                    }}
                />
            )}
            {/* Modal de Equipe */}
            {isTeamModalOpen && selectedSchedule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-orange-500 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">{selectedSchedule.deptName}</h3>
                                <p className="text-orange-100 text-sm">Equipe Escalada</p>
                            </div>
                            <button 
                                onClick={() => setIsTeamModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <ArrowLeft size={20} className="rotate-90" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {selectedSchedule.members.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedSchedule.members.map((member) => (
                                        <div key={member.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <img
                                                src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover shadow-sm"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800">{member.name}</p>
                                                <p className="text-sm text-slate-500">{member.phone || 'Sem telemóvel'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <p>Nenhum membro escalado individualmente.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setIsTeamModalOpen(false)}
                                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Novo Lançamento */}
            {isAddTxModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="bg-orange-500 p-6 text-white">
                            <h3 className="text-xl font-bold">Lançar Oferta/Despesa</h3>
                            <p className="text-orange-100 text-sm">Este lançamento será vinculado a este culto</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <input 
                                    type="text"
                                    value={newTx.description}
                                    onChange={(e) => setNewTx({...newTx, description: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Ex: Oferta de Domingo / Pagamento Músico"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                                    <input 
                                        type="number"
                                        value={newTx.amount}
                                        onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="0,00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                    <select 
                                        value={newTx.type}
                                        onChange={(e) => setNewTx({...newTx, type: e.target.value as any})}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="income">Entrada (Oferta/Dízimo)</option>
                                        <option value="expense">Saída (Despesa)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Conta</label>
                                    <select 
                                        value={newTx.account_id}
                                        onChange={(e) => setNewTx({...newTx, account_id: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">Selecione uma conta</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                    <select 
                                        value={newTx.category_id}
                                        onChange={(e) => setNewTx({...newTx, category_id: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">Selecione uma categoria</option>
                                        {categories
                                            .filter(c => c.type === newTx.type)
                                            .map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setIsAddTxModalOpen(false)}
                                className="flex-1 py-2 text-slate-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddTransaction}
                                className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
                            >
                                Confirmar Lançamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceDetail;
