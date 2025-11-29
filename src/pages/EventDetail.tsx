import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, UserPlus, Pencil, Trash2, CheckCircle } from 'lucide-react';

interface Attendee {
    id: string;
    name: string;
    email: string;
    phone: string;
    registrationDate: string;
    status: 'Confirmado' | 'Pendente' | 'Cancelado';
}

const MOCK_ATTENDEES: Attendee[] = [
    { id: '1', name: 'João Silva', email: 'joao@email.com', phone: '+244 900 000 001', registrationDate: '2024-01-15', status: 'Confirmado' },
    { id: '2', name: 'Maria Santos', email: 'maria@email.com', phone: '+244 900 000 002', registrationDate: '2024-01-16', status: 'Confirmado' },
    { id: '3', name: 'Pedro Costa', email: 'pedro@email.com', phone: '+244 900 000 003', registrationDate: '2024-01-17', status: 'Pendente' },
    { id: '4', name: 'Ana Oliveira', email: 'ana@email.com', phone: '+244 900 000 004', registrationDate: '2024-01-18', status: 'Confirmado' },
];

const EventDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [attendees, setAttendees] = useState<Attendee[]>(MOCK_ATTENDEES);

    // Mock data - em produção viria do backend
    const eventData = {
        id: id || '1',
        title: 'Conferência de Jovens 2024',
        date: '2024-02-15',
        time: '19:00',
        type: 'Conferência',
        location: 'Auditório Principal',
        description: 'Grande conferência anual para jovens com pregadores convidados e louvor especial',
        organizer: 'Pastor André Oliveira',
        capacity: 200,
        registered: attendees.length,
        status: 'Agendado'
    };

    const handleRemoveAttendee = (attendeeId: string) => {
        if (window.confirm('Tem certeza que deseja remover este participante?')) {
            setAttendees(prev => prev.filter(a => a.id !== attendeeId));
        }
    };

    const handleToggleStatus = (attendeeId: string) => {
        setAttendees(prev => prev.map(a =>
            a.id === attendeeId
                ? { ...a, status: a.status === 'Confirmado' ? 'Pendente' : 'Confirmado' as 'Confirmado' | 'Pendente' }
                : a
        ));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Confirmado': return 'bg-green-100 text-green-700';
            case 'Pendente': return 'bg-yellow-100 text-yellow-700';
            case 'Cancelado': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const confirmedCount = attendees.filter(a => a.status === 'Confirmado').length;
    const pendingCount = attendees.filter(a => a.status === 'Pendente').length;

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
                <button
                    onClick={() => navigate('/events')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Voltar para Eventos</span>
                </button>

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">{eventData.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>{new Date(eventData.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>{eventData.time}</span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${eventData.status === 'Agendado' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {eventData.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <p className="text-blue-600 text-sm font-medium">Total Inscritos</p>
                        <p className="text-2xl font-bold text-blue-700">{eventData.registered}/{eventData.capacity}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <p className="text-green-600 text-sm font-medium">Confirmados</p>
                        <p className="text-2xl font-bold text-green-700">{confirmedCount}</p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                        <p className="text-yellow-600 text-sm font-medium">Pendentes</p>
                        <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="text-purple-600" size={24} />
                        </div>
                        <p className="text-purple-600 text-sm font-medium">Vagas Restantes</p>
                        <p className="text-2xl font-bold text-purple-700">{eventData.capacity - eventData.registered}</p>
                    </div>
                </div>

                {/* Event Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações do Evento</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Evento</label>
                            <p className="text-slate-800">{eventData.type}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Local</label>
                            <div className="flex items-center gap-2 text-slate-800">
                                <MapPin size={16} />
                                <span>{eventData.location}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Organizador</label>
                            <p className="text-slate-800">{eventData.organizer}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Capacidade</label>
                            <p className="text-slate-800">{eventData.capacity} pessoas</p>
                        </div>
                        {eventData.description && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Descrição</label>
                                <p className="text-slate-800">{eventData.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attendees List */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Participantes Inscritos</h2>
                        <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                            <UserPlus size={16} />
                            Adicionar Participante
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase">
                                    <th className="px-4 py-3">Nome</th>
                                    <th className="px-4 py-3">Contato</th>
                                    <th className="px-4 py-3">Data de Inscrição</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendees.map((attendee) => (
                                    <tr key={attendee.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-slate-800">{attendee.name}</p>
                                                <p className="text-xs text-slate-500">{attendee.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{attendee.phone}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {new Date(attendee.registrationDate).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(attendee.id)}
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendee.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                                            >
                                                {attendee.status}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveAttendee(attendee.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remover"
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

                    {attendees.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-slate-600">Nenhum participante inscrito</p>
                            <p className="text-sm text-slate-500 mt-1">Adicione participantes para começar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
