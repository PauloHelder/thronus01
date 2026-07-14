import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Event } from '../types';
import EventModal from '../components/modals/EventModal';
import { useEvents } from '../hooks/useEvents';
import { useMembers } from '../hooks/useMembers';
import { useEventTypes } from '../hooks/useEventTypes';
import GenericDeleteModal from '../components/modals/GenericDeleteModal';

import { useAuth } from '../contexts/AuthContext';

const Events: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { events, addEvent, updateEvent, deleteEvent, loading: loadingEvents, error } = useEvents();
  const { members, loading: loadingMembers } = useMembers();
  const { eventTypes } = useEventTypes();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | undefined>(undefined);

  const handleAddEvent = () => {
    setSelectedEvent(undefined);
    setIsModalOpen(true);
  };

  const handleEditEvent = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setEventToDelete(event);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (eventToDelete) {
      await deleteEvent(eventToDelete.id);
    }
  };

  const handleSaveEvent = async (eventData: Event | Omit<Event, 'id'>, coverFile?: File) => {
    let success = false;

    // We check if we are editing an existing event (selectedEvent is defined)
    // or creating a new one. EventModal might send an ID even for new events, so we rely on selectedEvent state.
    if (selectedEvent && 'id' in eventData) {
      success = await updateEvent(eventData.id, eventData, coverFile);
    } else {
      success = await addEvent(eventData, coverFile);
    }

    if (success) {
      setIsModalOpen(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    const found = eventTypes.find(t => t.name === type);
    if (found) return found.color;

    switch (type) {
      case 'Service': return 'bg-blue-100 text-blue-700';
      case 'Meeting': return 'bg-purple-100 text-purple-700';
      case 'Social': return 'bg-green-100 text-green-700';
      case 'Youth': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEventTypeLabel = (type: string) => {
    // If it matches a known dynamic type, use its name (which is the type itself)
    // Or map the hardcoded ones to Portuguese
    switch (type) {
      case 'Service': return 'Culto';
      case 'Meeting': return 'Reunião';
      case 'Social': return 'Social';
      case 'Youth': return 'Jovens';
      default: return type;
    }
  };

  if (loadingEvents || loadingMembers) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 font-outfit">Agenda</h1>
          <p className="text-slate-600 mt-1">Agenda de eventos e atividades da igreja</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate('/calendar')}
            className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <Calendar size={18} /> Ver Calendário
          </button>
          {hasPermission('events_create') && (
            <button
              onClick={handleAddEvent}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={20} /> Novo Evento
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-xl border border-blue-200">
          <p className="text-blue-600 text-xs md:text-sm font-medium">Total de Eventos</p>
          <p className="text-xl md:text-3xl font-bold text-blue-700 mt-1">{events.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-xl border border-purple-200">
          <p className="text-purple-600 text-xs md:text-sm font-medium">Cultos</p>
          <p className="text-xl md:text-3xl font-bold text-purple-700 mt-1">
            {events.filter(e => e.type === 'Service').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-xl border border-green-200">
          <p className="text-green-600 text-xs md:text-sm font-medium">Reuniões</p>
          <p className="text-xl md:text-3xl font-bold text-green-700 mt-1">
            {events.filter(e => e.type === 'Meeting').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:p-6 rounded-xl border border-orange-200">
          <p className="text-orange-600 text-xs md:text-sm font-medium">Eventos Jovens</p>
          <p className="text-xl md:text-3xl font-bold text-orange-700 mt-1">
            {events.filter(e => e.type === 'Youth').length}
          </p>
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Próximos Eventos</h3>
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Nenhum evento agendado.</p>
            </div>
          ) : (
            events.slice(0, 5).map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800">{event.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-slate-600">
                      {new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {event.time}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-slate-500 mt-1">{event.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {hasPermission('events_edit') && (
                    <button
                      onClick={(e) => handleEditEvent(e, event)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                  {hasPermission('events_delete') && (
                    <button
                      onClick={(e) => handleDeleteEvent(e, event)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
        members={members}
      />

      <GenericDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={eventToDelete?.title}
        itemType="evento"
      />
    </div>
  );
};
export default Events;
