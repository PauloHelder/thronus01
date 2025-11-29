import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, MapPin, Users, Save } from 'lucide-react';
import { Service } from '../types';

// Mock data - em produção viria do estado global ou API
const MOCK_SERVICE: Service = {
    id: '1',
    churchId: 'demo-user-1',
    name: 'Culto de Celebração',
    type: 'Culto de Domingo',
    status: 'Concluído',
    date: '2024-01-21',
    startTime: '10:00',
    preacher: 'Pastor João Silva',
    leader: 'Diácono Pedro Santos',
    location: 'Templo Principal',
    description: 'Culto de celebração com louvor e adoração',
    statistics: {
        adults: { men: 45, women: 52 },
        children: { boys: 15, girls: 18 },
        visitors: { men: 3, women: 5 }
    }
};

const ServiceDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState<Service>(MOCK_SERVICE);
    const [statistics, setStatistics] = useState(service.statistics || {
        adults: { men: 0, women: 0 },
        children: { boys: 0, girls: 0 },
        visitors: { men: 0, women: 0 }
    });

    const handleSaveStatistics = () => {
        setService({ ...service, statistics });
        alert('Estatísticas salvas com sucesso!');
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

    const totalAdults = statistics.adults.men + statistics.adults.women;
    const totalChildren = statistics.children.boys + statistics.children.girls;
    const totalVisitors = statistics.visitors.men + statistics.visitors.women;
    // Total geral NÃO inclui visitantes
    const totalAttendance = totalAdults + totalChildren;

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
                <button
                    onClick={() => navigate('/services')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Voltar para Cultos</span>
                </button>

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">{service.name}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span className="capitalize">{formatDate(service.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>{service.startTime}</span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                                {service.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {/* Informações do Culto */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações do Culto</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Culto</label>
                            <p className="text-slate-800">{service.type}</p>
                        </div>
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
                                <span>{service.preacher}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Dirigente</label>
                            <div className="flex items-center gap-2 text-slate-800">
                                <User size={16} />
                                <span>{service.leader}</span>
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
