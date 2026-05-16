import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { DepartmentMeeting } from '../../hooks/useDepartmentMeetings';
import { Member } from '../../types';
import { Save, CheckSquare, Clock, Calendar, Type, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';

interface DepartmentMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (meetingData: any, attendees: string[]) => void;
    meeting?: DepartmentMeeting | null;
    departmentMembers: Member[];
    initialAttendees?: string[];
}

const DepartmentMeetingModal: React.FC<DepartmentMeetingModalProps> = ({
    isOpen,
    onClose,
    onSave,
    meeting,
    departmentMembers,
    initialAttendees = []
}) => {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [topic, setTopic] = useState('');
    const [description, setDescription] = useState('');
    const [attendees, setAttendees] = useState<string[]>([]);

    useEffect(() => {
        if (meeting) {
            setDate(meeting.date);
            setStartTime(meeting.start_time || '');
            setEndTime(meeting.end_time || '');
            setTopic(meeting.topic || '');
            setDescription(meeting.description || '');
            setAttendees(initialAttendees);
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setStartTime('');
            setEndTime('');
            setTopic('');
            setDescription('');
            setAttendees([]);
        }
    }, [meeting, isOpen, initialAttendees]);

    const handleToggleAttendee = (memberId: string) => {
        setAttendees(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!date) {
            toast.warning('Por favor, selecione uma data para o encontro');
            return;
        }

        const meetingData = {
            ...(meeting?.id ? { id: meeting.id } : {}),
            date,
            start_time: startTime || null,
            end_time: endTime || null,
            topic,
            description
        };

        onSave(meetingData, attendees);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={meeting ? 'Editar Encontro' : 'Registrar Novo Encontro'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Calendar size={12} /> Data
                        </label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Clock size={12} /> Início
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Clock size={12} /> Fim
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Type size={12} /> Tema do Encontro
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="Ex: Reunião de Alinhamento Mensal"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <AlignLeft size={12} /> Descrição / Pauta
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none transition-all"
                        placeholder="Descreva os pontos principais a serem abordados..."
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <CheckSquare size={12} /> Presença de Membros
                        </label>
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {attendees.length} de {departmentMembers.length} presentes
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                        {departmentMembers.map(member => (
                            <label
                                key={member.id}
                                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${attendees.includes(member.id)
                                    ? 'bg-green-50 border-green-200 shadow-sm'
                                    : 'bg-white border-transparent hover:border-gray-200'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${attendees.includes(member.id)
                                    ? 'bg-green-500 border-green-500'
                                    : 'bg-white border-gray-300 shadow-inner'
                                    }`}>
                                    {attendees.includes(member.id) && <CheckSquare size={14} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={attendees.includes(member.id)}
                                    onChange={() => handleToggleAttendee(member.id)}
                                />
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm text-slate-800 font-bold block truncate">{member.name}</span>
                                    <span className="text-[10px] text-slate-500 truncate block capitalize">
                                        {member.churchRole || 'Membro'}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-600 hover:bg-gray-100 rounded-xl font-bold transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-200"
                    >
                        <Save size={18} />
                        {meeting ? 'Salvar Alterações' : 'Salvar Encontro'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DepartmentMeetingModal;
