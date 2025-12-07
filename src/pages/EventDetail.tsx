import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, UserPlus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useMembers } from '../hooks/useMembers';
import { Member } from '../types';
import EventModal from '../components/modals/EventModal';

const EventDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { events, updateEvent, loading: loadingEvents } = useEvents();
    const { members, loading: loadingMembers } = useMembers();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const event = events.find(e => e.id === id);

    // Resolve attendees
    const attendees = event?.attendees?.map(attendeeId =>
        members.find(m => m.id === attendeeId)
    ).filter((m): m is Member => !!m) || [];

    const handleRemoveAttendee = async (attendeeId: string) => {
        if (!event) return;
        if (window.confirm('Tem certeza que deseja remover este participante?')) {
            const newAttendees = event.attendees?.filter(id => id !== attendeeId) || [];
            await updateEvent(event.id, { attendees: newAttendees });
        }
    };

    if (loadingEvents || loadingMembers) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="p-8 text-center text-slate-500">
                Evento não encontrado.
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            {/* Header */}
            {/* Cover Image */}
            <div className="bg-white border-b border-gray-200">
                {event.coverUrl && (
                    <div className="h-48 md:h-64 relative">
                        <img
                            src={event.coverUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                )}
            </div>

            <div className={`bg-white border-b border-gray-200 p-4 lg:p-6 ${!event.coverUrl ? 'pt-6' : ''}`}>
                <button
                    onClick={() => navigate('/events')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Voltar para Eventos</span>
                </button>

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">{event.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>{new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>{event.time}</span>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {event.type}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Pencil size={16} /> Editar Evento
                    </button>
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <p className="text-blue-600 text-sm font-medium">Total Participantes</p>
                        <p className="text-2xl font-bold text-blue-700">{attendees.length}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="text-purple-600" size={24} />
                        </div>
                        <p className="text-purple-600 text-sm font-medium">Membros da Igreja</p>
                        <p className="text-2xl font-bold text-purple-700">
                            {attendees.filter(m => m.status === 'Active').length}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                        <p className="text-yellow-600 text-sm font-medium">Visitantes</p>
                        <p className="text-2xl font-bold text-yellow-700">
                            {attendees.filter(m => m.status === 'Visitor').length}
                        </p>
                    </div>
                </div>

                {/* Event Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações do Evento</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Evento</label>
                            <p className="text-slate-800">{event.type}</p>
                        </div>
                        {event.description && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Descrição</label>
                                <p className="text-slate-800">{event.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attendees List */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Participantes ({attendees.length})</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase">
                                    <th className="px-4 py-3">Nome</th>
                                    <th className="px-4 py-3">Contato</th>
                                    <th className="px-4 py-3">Status na Igreja</th>
                                    <th className="px-4 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendees.map((attendee) => (
                                    <tr key={attendee.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={attendee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.name)}`}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full"
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-800">{attendee.name}</p>
                                                    <p className="text-xs text-slate-500">{attendee.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{attendee.phone}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${attendee.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                attendee.status === 'Visitor' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {attendee.status === 'Active' ? 'Membro' :
                                                    attendee.status === 'Visitor' ? 'Visitante' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleRemoveAttendee(attendee.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remover"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {attendees.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-slate-600">Nenhum participante neste evento</p>
                            <p className="text-sm text-slate-500 mt-1">Edite o evento para adicionar participantes</p>
                        </div>
                    )}
                </div>
            </div>

            <EventModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={async (data, coverFile) => {
                    await updateEvent(event.id, data, coverFile);
                    setIsEditModalOpen(false);
                }}
                event={event}
                members={members}
            />
        </div>
    );
};

export default EventDetail;
