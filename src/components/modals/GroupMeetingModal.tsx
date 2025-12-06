import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { GroupMeeting } from '../../hooks/useGroupMeetings';
import { GroupMember } from '../../hooks/useGroups';
import { Save, CheckSquare } from 'lucide-react';

interface GroupMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (meetingData: any, attendees: string[]) => void;
    meeting?: GroupMeeting | null;
    groupMembers: GroupMember[];
    initialAttendees?: string[];
}

const GroupMeetingModal: React.FC<GroupMeetingModalProps> = ({
    isOpen,
    onClose,
    onSave,
    meeting,
    groupMembers,
    initialAttendees = []
}) => {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [topic, setTopic] = useState('');
    const [notes, setNotes] = useState('');
    const [attendees, setAttendees] = useState<string[]>([]);

    useEffect(() => {
        if (meeting) {
            setDate(meeting.date);
            setStartTime(meeting.start_time || '');
            setEndTime(meeting.end_time || '');
            setTopic(meeting.topic || '');
            setNotes(meeting.notes || '');
            setAttendees(initialAttendees);
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setStartTime('');
            setEndTime('');
            setTopic('');
            setNotes('');
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
            alert('Por favor, selecione uma data para o encontro');
            return;
        }

        const meetingData = {
            ...(meeting?.id ? { id: meeting.id } : {}),
            date,
            start_time: startTime || null,
            end_time: endTime || null,
            topic,
            notes
        };

        onSave(meetingData, attendees);
        onClose();
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'Líder': return 'bg-purple-100 text-purple-700';
            case 'Co-líder': return 'bg-blue-100 text-blue-700';
            case 'Secretário': return 'bg-green-100 text-green-700';
            case 'Visitante': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={meeting ? 'Editar Encontro' : 'Registrar Novo Encontro'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data do Encontro</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Horário (Início)</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tema / Tópico</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        placeholder="Ex: Estudo sobre Fé"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">Membros Presentes</label>
                        <span className="text-xs text-slate-500">
                            {attendees.length} de {groupMembers.length} selecionados
                        </span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                        {groupMembers.map(groupMember => (
                            <label
                                key={groupMember.member_id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${attendees.includes(groupMember.member_id)
                                    ? 'bg-green-50 border border-green-200'
                                    : 'hover:bg-white border border-transparent'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${attendees.includes(groupMember.member_id)
                                    ? 'bg-green-500 border-green-500'
                                    : 'bg-white border-gray-300'
                                    }`}>
                                    {attendees.includes(groupMember.member_id) && <CheckSquare size={14} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={attendees.includes(groupMember.member_id)}
                                    onChange={() => handleToggleAttendee(groupMember.member_id)}
                                />
                                <div className="flex-1">
                                    <span className="text-sm text-slate-700 font-medium block">{groupMember.member_name}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs ${getRoleBadgeColor(groupMember.role)}`}>
                                    {groupMember.role}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observações (opcional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Observações adicionais..."
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
                        {meeting ? 'Salvar Alterações' : 'Salvar Encontro'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default GroupMeetingModal;
