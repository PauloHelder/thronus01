import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Member, DepartmentSchedule } from '../../types';
import { Save, Calendar, CheckSquare } from 'lucide-react';

// Mock de cultos e eventos (idealmente viriam de props ou contexto)
const MOCK_SERVICES = [
    { id: '1', name: 'Culto de Domingo - Manhã', date: '2024-02-04' },
    { id: '2', name: 'Culto de Domingo - Noite', date: '2024-02-04' },
    { id: '3', name: 'Culto de Quarta - Doutrina', date: '2024-02-07' },
];

const MOCK_EVENTS = [
    { id: '1', name: 'Retiro de Jovens', date: '2024-02-10' },
    { id: '2', name: 'Conferência Anual', date: '2024-02-15' },
    { id: '3', name: 'Evangelismo na Praça', date: '2024-02-17' },
];

interface CreateScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (schedule: Omit<DepartmentSchedule, 'id' | 'departmentId'>) => void;
    departmentMembers: Member[];
    leader?: Member;
    schedule?: DepartmentSchedule | null;
}

const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({
    isOpen,
    onClose,
    onSave,
    departmentMembers,
    leader,
    schedule
}) => {
    const [type, setType] = useState<'Service' | 'Event'>('Service');
    const [serviceId, setServiceId] = useState('');
    const [eventId, setEventId] = useState('');
    const [date, setDate] = useState('');
    const [assignedMembers, setAssignedMembers] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    // Todos os membros incluindo o líder
    const allMembers = leader && !departmentMembers.some(m => m.id === leader.id)
        ? [leader, ...departmentMembers]
        : departmentMembers;

    useEffect(() => {
        if (isOpen) {
            if (schedule) {
                setType(schedule.type);
                setServiceId(schedule.serviceId || '');
                setEventId(schedule.eventId || '');
                setDate(schedule.date);
                setAssignedMembers(schedule.assignedMembers);
                setNotes(schedule.notes || '');
            } else {
                setType('Service');
                setServiceId('');
                setEventId('');
                setDate('');
                setAssignedMembers([]);
                setNotes('');
            }
        }
    }, [isOpen, schedule]);

    useEffect(() => {
        // Atualizar data automaticamente quando selecionar culto ou evento
        if (type === 'Service' && serviceId) {
            const service = MOCK_SERVICES.find(s => s.id === serviceId);
            if (service) setDate(service.date);
        } else if (type === 'Event' && eventId) {
            const event = MOCK_EVENTS.find(e => e.id === eventId);
            if (event) setDate(event.date);
        }
    }, [type, serviceId, eventId]);

    const handleToggleMember = (memberId: string) => {
        setAssignedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (type === 'Service' && !serviceId) {
            alert('Por favor, selecione um culto.');
            return;
        }

        if (type === 'Event' && !eventId) {
            alert('Por favor, selecione um evento.');
            return;
        }

        if (!date) {
            alert('Por favor, selecione uma data.');
            return;
        }

        onSave({
            type,
            serviceId: type === 'Service' ? serviceId : undefined,
            eventId: type === 'Event' ? eventId : undefined,
            date,
            assignedMembers,
            notes
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={schedule ? 'Editar Escala' : 'Criar Nova Escala'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tipo de Escala */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => { setType('Service'); setServiceId(''); setEventId(''); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'Service'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Culto
                    </button>
                    <button
                        type="button"
                        onClick={() => { setType('Event'); setServiceId(''); setEventId(''); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'Event'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Evento
                    </button>
                </div>

                {/* Seleção de Culto ou Evento */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {type === 'Service' ? 'Selecionar Culto' : 'Selecionar Evento'}
                    </label>
                    {type === 'Service' ? (
                        <select
                            required
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Escolha um culto...</option>
                            {MOCK_SERVICES.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <select
                            required
                            value={eventId}
                            onChange={(e) => setEventId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Escolha um evento...</option>
                            {MOCK_EVENTS.map(event => (
                                <option key={event.id} value={event.id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Data (preenchida automaticamente) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Data
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Data preenchida automaticamente ao selecionar {type === 'Service' ? 'culto' : 'evento'}
                    </p>
                </div>

                {/* Membros Escalados */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Membros Escalados
                        </label>
                        <span className="text-xs text-slate-500">
                            {assignedMembers.length} de {allMembers.length} selecionados
                        </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-2">
                        {allMembers.length > 0 ? (
                            allMembers.map(member => (
                                <label
                                    key={member.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${assignedMembers.includes(member.id)
                                        ? 'bg-green-50 border border-green-200'
                                        : 'hover:bg-white border border-transparent'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${assignedMembers.includes(member.id)
                                        ? 'bg-green-500 border-green-500'
                                        : 'bg-white border-gray-300'
                                        }`}>
                                        {assignedMembers.includes(member.id) && <CheckSquare size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={assignedMembers.includes(member.id)}
                                        onChange={() => handleToggleMember(member.id)}
                                    />
                                    <img src={member.avatar} alt="" className="w-8 h-8 rounded-full" />
                                    <span className="text-sm text-slate-700 flex-1 font-medium">{member.name}</span>
                                    {member.id === leader?.id && (
                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                            Líder
                                        </span>
                                    )}
                                </label>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                Nenhum membro no departamento.
                            </div>
                        )}
                    </div>
                </div>

                {/* Observações */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Observações (opcional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Instruções especiais, horários..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} />
                        {schedule ? 'Salvar Alterações' : 'Criar Escala'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateScheduleModal;
