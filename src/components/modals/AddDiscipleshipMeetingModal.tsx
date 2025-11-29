import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Member, DiscipleshipMeeting } from '../../types';
import { Save, Calendar, CheckSquare } from 'lucide-react';

interface AddDiscipleshipMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (meeting: Omit<DiscipleshipMeeting, 'id' | 'leaderId'> | DiscipleshipMeeting) => void;
    meeting?: DiscipleshipMeeting | null;
    disciples: Member[];
}

const AddDiscipleshipMeetingModal: React.FC<AddDiscipleshipMeetingModalProps> = ({
    isOpen,
    onClose,
    onSave,
    meeting,
    disciples
}) => {
    const [date, setDate] = useState('');
    const [status, setStatus] = useState<'Scheduled' | 'Completed' | 'Cancelled'>('Scheduled');
    const [attendees, setAttendees] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (meeting) {
            setDate(meeting.date);
            setStatus(meeting.status);
            setAttendees(meeting.attendees);
            setNotes(meeting.notes || '');
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setStatus('Scheduled');
            setAttendees([]);
            setNotes('');
        }
    }, [meeting, isOpen]);

    const handleToggleAttendee = (discipleId: string) => {
        setAttendees(prev =>
            prev.includes(discipleId)
                ? prev.filter(id => id !== discipleId)
                : [...prev, discipleId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!date) {
            alert('Por favor, selecione uma data.');
            return;
        }

        onSave({
            id: meeting?.id || crypto.randomUUID(),
            leaderId: meeting?.leaderId || '',
            date,
            status,
            attendees,
            notes
        });
        onClose();
    };

    const getStatusColor = (s: typeof status) => {
        switch (s) {
            case 'Scheduled': return 'bg-blue-100 text-blue-700';
            case 'Completed': return 'bg-green-100 text-green-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
        }
    };

    const getStatusLabel = (s: typeof status) => {
        switch (s) {
            case 'Scheduled': return 'Agendado';
            case 'Completed': return 'Concluído';
            case 'Cancelled': return 'Cancelado';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={meeting ? 'Editar Encontro' : 'Novo Encontro de Discipulado'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Data do Encontro
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as typeof status)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="Scheduled">Agendado</option>
                            <option value="Completed">Concluído</option>
                            <option value="Cancelled">Cancelado</option>
                        </select>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Discípulos Presentes
                        </label>
                        <span className="text-xs text-slate-500">
                            {attendees.length} de {disciples.length} selecionados
                        </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-2">
                        {disciples.length > 0 ? (
                            disciples.map(disciple => (
                                <label
                                    key={disciple.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${attendees.includes(disciple.id)
                                            ? 'bg-green-50 border border-green-200'
                                            : 'hover:bg-white border border-transparent'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${attendees.includes(disciple.id)
                                            ? 'bg-green-500 border-green-500'
                                            : 'bg-white border-gray-300'
                                        }`}>
                                        {attendees.includes(disciple.id) && <CheckSquare size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={attendees.includes(disciple.id)}
                                        onChange={() => handleToggleAttendee(disciple.id)}
                                    />
                                    <img src={disciple.avatar} alt="" className="w-8 h-8 rounded-full" />
                                    <span className="text-sm text-slate-700 flex-1 font-medium">{disciple.name}</span>
                                </label>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                Nenhum discípulo cadastrado ainda.
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Observações (opcional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Tema do encontro, tópicos discutidos..."
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
                        {meeting ? 'Salvar Alterações' : 'Criar Encontro'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddDiscipleshipMeetingModal;
