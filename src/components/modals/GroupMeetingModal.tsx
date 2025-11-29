import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { GroupMeeting, GroupMember } from '../../types';
import { Save, CheckSquare } from 'lucide-react';

interface GroupMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (meeting: Omit<GroupMeeting, 'id'> | GroupMeeting) => void;
    meeting?: GroupMeeting | null;
    groupMembers: GroupMember[];
}

const GroupMeetingModal: React.FC<GroupMeetingModalProps> = ({
    isOpen,
    onClose,
    onSave,
    meeting,
    groupMembers
}) => {
    const [date, setDate] = useState('');
    const [attendees, setAttendees] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (meeting) {
            setDate(meeting.date);
            setAttendees(meeting.attendees);
            setNotes(meeting.notes || '');
        } else {
            setDate(new Date().toISOString().split('T')[0]); // Default to today
            setAttendees([]);
            setNotes('');
        }
    }, [meeting, isOpen]);

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

        onSave({
            id: meeting?.id || crypto.randomUUID(),
            groupId: meeting?.groupId || '', // This will be handled by the parent or ignored if new
            date,
            attendees,
            notes
        });
        onClose();
    };

    const getRoleBadgeColor = (role: GroupMember['role']) => {
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
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">Membros Presentes</label>
                        <span className="text-xs text-slate-500">
                            {attendees.length} de {groupMembers.length} selecionados
                        </span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                        {groupMembers.map(groupMember => (
                            <label
                                key={groupMember.member.id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${attendees.includes(groupMember.member.id)
                                        ? 'bg-green-50 border border-green-200'
                                        : 'hover:bg-white border border-transparent'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${attendees.includes(groupMember.member.id)
                                        ? 'bg-green-500 border-green-500'
                                        : 'bg-white border-gray-300'
                                    }`}>
                                    {attendees.includes(groupMember.member.id) && <CheckSquare size={14} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={attendees.includes(groupMember.member.id)}
                                    onChange={() => handleToggleAttendee(groupMember.member.id)}
                                />
                                <img src={groupMember.member.avatar} alt="" className="w-8 h-8 rounded-full" />
                                <span className="text-sm text-slate-700 flex-1 font-medium">{groupMember.member.name}</span>
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
                        placeholder="Tema do encontro, observações, pedidos de oração..."
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
