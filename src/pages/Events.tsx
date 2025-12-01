import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit3, Trash2 } from 'lucide-react';
import { Event } from '../types';
import EventModal from '../components/modals/EventModal';
import { MOCK_MEMBERS } from '../mocks/members';

const INITIAL_EVENTS: Event[] = [
  { id: '1', title: 'Culto de Celebração', date: '2024-01-21', time: '10:00', type: 'Service', description: 'Culto especial de celebração' },
  { id: '2', title: 'Reunião de Jovens', date: '2024-01-22', time: '19:00', type: 'Youth', description: 'Encontro semanal de jovens' },
  { id: '3', title: 'Conferência Anual', date: '2024-01-28', time: '09:00', type: 'Meeting', description: 'Conferência anual da igreja' },
];

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleAddEvent = () => {
    setSelectedEvent(undefined);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleSaveEvent = (eventData: Event | Omit<Event, 'id'>) => {
    if ('id' in eventData) {
      setEvents(prev => prev.map(e => e.id === eventData.id ? eventData as Event : e));
    } else {
      setEvents(prev => [...prev, eventData as Event]);
    }
    setIsModalOpen(false);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Service': return 'bg-blue-100 text-blue-700';
      case 'Meeting': return 'bg-purple-100 text-purple-700';
      case 'Social': return 'bg-green-100 text-green-700';
      case 'Youth': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'Service': return 'Culto';
      case 'Meeting': return 'Reunião';
      case 'Social': return 'Social';
      case 'Youth': return 'Jovens';
      default: return type;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Eventos</h1>
          <p className="text-slate-600 mt-1">Calendário de eventos e atividades da igreja</p>
        </div>
        <button
          onClick={handleAddEvent}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors w-fit"
        >
          <Plus size={20} /> Novo Evento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <p className="text-blue-600 text-sm font-medium">Total de Eventos</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{events.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <p className="text-purple-600 text-sm font-medium">Cultos</p>
          <p className="text-3xl font-bold text-purple-700 mt-1">
            {events.filter(e => e.type === 'Service').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <p className="text-green-600 text-sm font-medium">Reuniões</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {events.filter(e => e.type === 'Meeting').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <p className="text-orange-600 text-sm font-medium">Eventos Jovens</p>
          <p className="text-3xl font-bold text-orange-700 mt-1">
            {events.filter(e => e.type === 'Youth').length}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-sm text-slate-600 py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Calendar Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDate(day);
            const isToday = day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`aspect-square border rounded-lg p-2 ${isToday ? 'bg-orange-50 border-orange-300' : 'border-gray-200 hover:bg-gray-50'
                  } transition-colors cursor-pointer`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-orange-600' : 'text-slate-700'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="text-xs px-1 py-0.5 rounded truncate bg-blue-100 text-blue-700"
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-slate-500">
                      +{dayEvents.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Próximos Eventos</h3>
        <div className="space-y-3">
          {events.slice(0, 5).map(event => (
            <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                <button
                  onClick={() => handleEditEvent(event)}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
        members={MOCK_MEMBERS}
      />
    </div>
  );
};

export default Events;
