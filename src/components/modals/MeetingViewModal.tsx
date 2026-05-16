import React from 'react';
import Modal from '../Modal';
import { Calendar, Clock, Type, AlignLeft, Users, Pencil, Trash2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { formatDateForDisplay } from '../../utils/dateUtils';

interface Attendee {
    member_id: string;
    member_name: string;
    status: 'Presente' | 'Ausente' | 'Justificado';
    role?: string;
}

interface MeetingViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: {
        date: string;
        start_time?: string;
        end_time?: string;
        topic?: string;
        notes?: string;
        description?: string;
        attendance_count?: number;
        total_members?: number;
    } | null;
    attendees: Attendee[];
    onEdit?: () => void;
    onDelete?: () => void;
    title?: string;
}

const MeetingViewModal: React.FC<MeetingViewModalProps> = ({
    isOpen,
    onClose,
    meeting,
    attendees,
    onEdit,
    onDelete,
    title = 'Detalhes do Encontro'
}) => {
    if (!meeting) return null;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Presente': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'Ausente': return <XCircle size={16} className="text-red-500" />;
            case 'Justificado': return <HelpCircle size={16} className="text-orange-500" />;
            default: return null;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Presente': return 'bg-green-50 text-green-700 border-green-100';
            case 'Ausente': return 'bg-red-50 text-red-700 border-red-100';
            case 'Justificado': return 'bg-orange-50 text-orange-700 border-orange-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
        >
            <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3 text-slate-500 mb-1">
                            <Calendar size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Data</span>
                        </div>
                        <p className="text-lg font-black text-slate-800">{formatDateForDisplay(meeting.date)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3 text-slate-500 mb-1">
                            <Clock size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Horário</span>
                        </div>
                        <p className="text-lg font-black text-slate-800">
                            {meeting.start_time || '--:--'} {meeting.end_time ? `até ${meeting.end_time}` : ''}
                        </p>
                    </div>
                </div>

                {/* Topic & Description */}
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                            <Type size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Tema do Encontro</span>
                        </div>
                        <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                            <p className="font-bold text-slate-800">{meeting.topic || 'Sem tema definido'}</p>
                        </div>
                    </div>

                    {(meeting.notes || meeting.description) && (
                        <div>
                            <div className="flex items-center gap-3 text-slate-500 mb-2">
                                <AlignLeft size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider">Observações / Pauta</span>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-gray-100 italic text-slate-600 leading-relaxed">
                                {meeting.notes || meeting.description}
                            </div>
                        </div>
                    )}
                </div>

                {/* Attendance Summary */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Users size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Chamada / Presença</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                {meeting.attendance_count || 0} Presentes
                            </span>
                            <span className="text-xs font-bold text-slate-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                Total: {meeting.total_members || 0}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-100 rounded-2xl p-2 bg-gray-50/50">
                        {attendees.length > 0 ? (
                            attendees.map(attendee => (
                                <div
                                    key={attendee.member_id}
                                    className={`flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm transition-all`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shadow-inner">
                                            {attendee.member_name?.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-sm text-slate-800 font-bold block truncate">{attendee.member_name}</span>
                                            {attendee.role && (
                                                <span className="text-[10px] text-slate-500 block">{attendee.role}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tight ${getStatusClass(attendee.status)}`}>
                                        {getStatusIcon(attendee.status)}
                                        {attendee.status}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-8 text-center text-slate-400 italic text-sm">
                                Nenhuma informação de presença disponível.
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                    <div className="flex-1 flex gap-2">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-200"
                            >
                                <Pencil size={18} />
                                Editar Registro
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="flex items-center justify-center px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition-all border border-red-100"
                                title="Excluir"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold transition-all shadow-lg shadow-slate-200"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MeetingViewModal;
