import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { useEventTypes } from '../hooks/useEventTypes';

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const { events, loading } = useEvents();
  const { eventTypes } = useEventTypes();
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/events')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Voltar para Agenda"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-outfit">Calendário de Atividades</h1>
            <p className="text-slate-600 mt-1">Visualize todos os eventos e programações mensais</p>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} className="text-center font-bold text-sm text-slate-500 py-2">
              {day}
            </div>
          ))}

          {/* Empty cells */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-gray-50/50 border border-gray-100 rounded-lg" />
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
                className={`aspect-square border rounded-lg p-2 flex flex-col justify-between transition-colors cursor-pointer min-h-[110px] ${
                  isToday 
                    ? 'bg-orange-50/50 border-orange-300 ring-1 ring-orange-300' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => {
                  // Navigate or action on day click
                }}
              >
                <div className={`text-sm font-semibold ${isToday ? 'text-orange-600' : 'text-slate-500'}`}>
                  {day}
                </div>
                <div className="space-y-1 overflow-y-auto flex-1 mt-1 max-h-[80px] scrollbar-thin">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate ${getEventTypeColor(event.type)} cursor-pointer transition-all hover:brightness-95`}
                      title={event.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event.id}`);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-slate-400 font-semibold px-1">
                      +{dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
