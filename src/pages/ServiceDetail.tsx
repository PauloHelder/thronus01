import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, MapPin, Users, Save, Heart, MessageSquare, ClipboardList, Info, Loader2 } from 'lucide-react';
import { Service, DepartmentSchedule, Member } from '../types';
import { useServices } from '../hooks/useServices';
import { supabase } from '../lib/supabase';
import CommunicationModal from '../components/modals/CommunicationModal';
import SmsHistoryTab from '../components/tabs/SmsHistoryTab';
import { useAuth } from '../contexts/AuthContext';

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
    const [activeTab, setActiveTab] = useState<'stats' | 'team' | 'sms'>('stats');
    const [relatedSchedules, setRelatedSchedules] = useState<DepartmentSchedule[]>([]);
    const [teamMembers, setTeamMembers] = useState<Member[]>([]);
    const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
    const { hasPermission } = useAuth();

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
                // Fetch schedules linked to this service
                const { data: schedulesData } = await supabase
                    .from('department_schedules')
                    .select('*')
                    .eq('service_id', id);

                if (schedulesData) {
                    setRelatedSchedules(schedulesData as DepartmentSchedule[]);

                    // Fetch members assigned to these schedules
                    const memberIds = Array.from(new Set(schedulesData.flatMap(s => s.assigned_members || [])));
                    if (memberIds.length > 0) {
                        const { data: membersData } = await supabase
                            .from('members')
                            .select('*')
                            .in('id', memberIds);
                        if (membersData) {
                            setTeamMembers(membersData as any[]);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching related data:', error);
            }
        };

        fetchServiceData();
        fetchRelatedData();
    }, [id]);

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
                        { id: 'sms', label: 'Comunicação SMS', icon: <MessageSquare size={18} /> },
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
                            <label className="block text-sm font-medium text-slate-600 mb-1">Dirigente</label>
                            <div className="flex items-center gap-2 text-slate-800">
                                <User size={16} />
                                <span>{service.leader || 'Não definido'}</span>
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
                                <h2 className="text-lg font-semibold text-slate-800">Equipe Escalada</h2>
                                <p className="text-sm text-slate-500">Membros atribuídos a este culto através dos departamentos</p>
                            </div>
                            <button
                                onClick={() => setIsSmsModalOpen(true)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                            >
                                <MessageSquare size={16} /> Notificar Equipe
                            </button>
                        </div>

                        {teamMembers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {teamMembers.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <img
                                            src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover shadow-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{member.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{member.phone || 'Sem telemóvel'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <Users size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Nenhuma equipe escalada para este culto ainda.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'sms' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <SmsHistoryTab contextType="service" contextId={id || ''} />
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
                    onSuccess={() => setActiveTab('sms')}
                />
            )}
        </div>
    );
};

export default ServiceDetail;
