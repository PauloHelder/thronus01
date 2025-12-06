import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, MapPin, Users, Save } from 'lucide-react';
import { Service } from '../types';
import { useServices } from '../hooks/useServices';

const ServiceDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getService, updateStatistics } = useServices();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState({
        adults: { men: 0, women: 0 },
        children: { boys: 0, girls: 0 },
        visitors: { men: 0, women: 0 }
    });

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
                        visitors: { men: 0, women: 0 }
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

        fetchServiceData();
    }, [id]);

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

            <div className="p-4 lg:p-6 space-y-6">
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetail;
