import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Clock, User, MapPin, Pencil, Trash2, Filter, Eye } from 'lucide-react';
import { Service } from '../types';
import ServiceModal from '../components/modals/ServiceModal';

const INITIAL_SERVICES: Service[] = [
    {
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
    },
    {
        id: '2',
        churchId: 'demo-user-1',
        name: 'Reunião de Oração',
        type: 'Reunião de Oração',
        status: 'Agendado',
        date: '2024-01-24',
        startTime: '19:30',
        preacher: 'Pastor Marcos Lima',
        leader: 'Irmã Maria Costa',
        location: 'Sala de Oração',
        description: 'Reunião semanal de oração e intercessão'
    },
    {
        id: '3',
        churchId: 'demo-user-1',
        name: 'Culto de Jovens',
        type: 'Culto Jovem',
        status: 'Concluído',
        date: '2024-01-20',
        startTime: '19:00',
        preacher: 'Pastor André Oliveira',
        leader: 'Líder João Pedro',
        location: 'Auditório',
        description: 'Culto especial para jovens',
        statistics: {
            adults: { men: 30, women: 35 },
            children: { boys: 5, girls: 8 },
            visitors: { men: 2, women: 3 }
        }
    }
];

const Services: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleAddService = () => {
        setSelectedService(undefined);
        setIsModalOpen(true);
    };

    const handleEditService = (service: Service, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleDeleteService = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir este culto?')) {
            setServices(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleSaveService = (serviceData: Service | Omit<Service, 'id'>) => {
        if ('id' in serviceData) {
            setServices(prev => prev.map(s => s.id === serviceData.id ? serviceData as Service : s));
        } else {
            setServices(prev => [...prev, serviceData as Service]);
        }
        setIsModalOpen(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Agendado': return 'bg-blue-100 text-blue-700';
            case 'Concluído': return 'bg-green-100 text-green-700';
            case 'Cancelado': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredServices = services.filter(service => {
        if (filterType !== 'all' && service.type !== filterType) return false;
        if (filterStatus !== 'all' && service.status !== filterStatus) return false;
        if (startDate && service.date < startDate) return false;
        if (endDate && service.date > endDate) return false;
        return true;
    });

    // Calcular estatísticas - SEM incluir visitantes no total
    const totalServices = filteredServices.length;
    const completedServices = filteredServices.filter(s => s.status === 'Concluído').length;
    const scheduledServices = filteredServices.filter(s => s.status === 'Agendado').length;
    const totalAttendance = filteredServices.reduce((acc, s) => {
        if (s.statistics) {
            const adults = s.statistics.adults.men + s.statistics.adults.women;
            const children = s.statistics.children.boys + s.statistics.children.girls;
            // NÃO incluir visitantes no total
            return acc + adults + children;
        }
        return acc;
    }, 0);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    };

    // Calcular presença total de um culto específico (sem visitantes)
    const getServiceAttendance = (service: Service) => {
        if (!service.statistics) return 0;
        const adults = service.statistics.adults.men + service.statistics.adults.women;
        const children = service.statistics.children.boys + service.statistics.children.girls;
        return adults + children;
    };

    // Calcular visitantes de um culto
    const getServiceVisitors = (service: Service) => {
        if (!service.statistics) return 0;
        return service.statistics.visitors.men + service.statistics.visitors.women;
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto lg:overflow-hidden">
            {/* Header com Estatísticas */}
            <div className="p-4 lg:p-6 bg-white border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Cultos</h1>
                        <p className="text-slate-600 text-sm">Gerencie os cultos e eventos da igreja</p>
                    </div>
                    <button
                        onClick={handleAddService}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors w-fit"
                    >
                        <Plus size={16} /> Adicionar Culto
                    </button>
                </div>

                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium">Total de Cultos</p>
                                <p className="text-2xl font-bold text-blue-700">{totalServices}</p>
                            </div>
                            <Calendar className="text-blue-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-medium">Concluídos</p>
                                <p className="text-2xl font-bold text-green-700">{completedServices}</p>
                            </div>
                            <Calendar className="text-green-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-600 text-sm font-medium">Agendados</p>
                                <p className="text-2xl font-bold text-orange-700">{scheduledServices}</p>
                            </div>
                            <Clock className="text-orange-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-medium">Total Presença</p>
                                <p className="text-2xl font-bold text-purple-700">{totalAttendance}</p>
                                <p className="text-xs text-purple-600 mt-1">Sem visitantes</p>
                            </div>
                            <User className="text-purple-500" size={32} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="p-4 lg:p-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={18} className="text-slate-600" />
                    <h3 className="font-semibold text-slate-800">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Culto</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="all">Todos</option>
                            <option value="Culto de Domingo">Culto de Domingo</option>
                            <option value="Culto de Meio da Semana">Culto de Meio da Semana</option>
                            <option value="Culto Jovem">Culto Jovem</option>
                            <option value="Reunião de Oração">Reunião de Oração</option>
                            <option value="Estudo Bíblico">Estudo Bíblico</option>
                            <option value="Culto Especial">Culto Especial</option>
                            <option value="Conferência">Conferência</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="all">Todos</option>
                            <option value="Agendado">Agendado</option>
                            <option value="Concluído">Concluído</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Tabela de Cultos */}
            <div className="flex-1 p-4 lg:p-6 lg:overflow-y-auto bg-gray-50">
                {/* Mobile/Tablet Cards View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                    {filteredServices.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            onClick={() => navigate(`/services/${service.id}`)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-slate-800">{service.name}</h3>
                                    <p className="text-xs text-slate-500">{service.type}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                                    {service.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Calendar size={14} />
                                    <span>{formatDate(service.date)} • {service.startTime}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <User size={14} />
                                    <span>{service.preacher}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin size={14} />
                                    <span>{service.location}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500">Presença</p>
                                        <p className="font-bold text-slate-800">{getServiceAttendance(service)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500">Visitantes</p>
                                        <p className="font-bold text-blue-600">{getServiceVisitors(service)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => handleEditService(service, e)}
                                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteService(service.id, e)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase">
                                    <th className="px-6 py-4">Nome do Culto</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Data/Hora</th>
                                    <th className="px-6 py-4">Pregador</th>
                                    <th className="px-6 py-4">Local</th>
                                    <th className="px-6 py-4 text-center">Presença</th>
                                    <th className="px-6 py-4 text-center">Visitantes</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredServices.map((service) => (
                                    <tr
                                        key={service.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/services/${service.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-800">{service.name}</p>
                                                <p className="text-xs text-slate-500">{service.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">{service.type}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-sm text-slate-700">
                                                    <Calendar size={14} />
                                                    <span>{formatDate(service.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Clock size={12} />
                                                    <span>{service.startTime}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                                <User size={14} />
                                                <span>{service.preacher}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPin size={14} />
                                                <span>{service.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-slate-800">
                                                {getServiceAttendance(service)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-medium text-blue-600">
                                                {getServiceVisitors(service)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                                                {service.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/services/${service.id}`);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleEditService(service, e)}
                                                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteService(service.id, e)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredServices.length === 0 && (
                    <div className="text-center py-12">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-slate-600">Nenhum culto encontrado</p>
                        <p className="text-sm text-slate-500">Adicione um novo culto para começar</p>
                    </div>
                )}
            </div>

            <ServiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveService}
                service={selectedService}
                churchId="demo-user-1"
            />
        </div>
    );
};

export default Services;
