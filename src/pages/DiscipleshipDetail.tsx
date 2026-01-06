import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Plus, UserPlus, Trash2, Pencil, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DiscipleshipMeeting } from '../types';
import { useDiscipleship } from '../hooks/useDiscipleship';
import { useMembers } from '../hooks/useMembers';
import AddDiscipleModal from '../components/modals/AddDiscipleModal';
import AddDiscipleshipMeetingModal from '../components/modals/AddDiscipleshipMeetingModal';
import { toast } from 'sonner';

const DiscipleshipDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        selectedLeader: leader,
        loading,
        error: hookError,
        fetchLeaderDetails,
        addDisciple,
        removeDisciple,
        addMeeting,
        updateMeeting,
        deleteMeeting
    } = useDiscipleship();
    const { members } = useMembers();

    const [isAddDiscipleModalOpen, setIsAddDiscipleModalOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<DiscipleshipMeeting | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (hookError) {
            toast.error(hookError);
            setLocalError(hookError);
        }
    }, [hookError]);

    useEffect(() => {
        if (id) {
            fetchLeaderDetails(id);
        }
    }, [id]);

    const handleAddDisciple = async (memberId: string) => {
        if (!leader) return;
        setLocalError(null);
        const success = await addDisciple(leader.id, memberId);
        if (success) {
            toast.success('Discípulo adicionado com sucesso!');
            setIsAddDiscipleModalOpen(false);
        }
    };

    const handleRemoveDisciple = async (discipleId: string) => {
        if (!leader) return;
        if (window.confirm('Tem certeza que deseja remover este discípulo?')) {
            setLocalError(null);
            const success = await removeDisciple(leader.id, discipleId);
            if (success) toast.success('Discípulo removido com sucesso!');
        }
    };

    const handleSaveMeeting = async (meetingData: Omit<DiscipleshipMeeting, 'id' | 'leaderId'> | DiscipleshipMeeting) => {
        if (!leader) return;
        setLocalError(null);

        let success = false;
        if ('id' in meetingData) {
            // Editar
            success = await updateMeeting({ ...meetingData, leaderId: leader.id } as DiscipleshipMeeting);
        } else {
            // Novo
            success = await addMeeting({ ...meetingData, leaderId: leader.id });
        }

        if (success) {
            toast.success('Encontro salvo com sucesso!');
            setEditingMeeting(null);
            setIsMeetingModalOpen(false);
        }
    };

    const handleEditMeeting = (meeting: DiscipleshipMeeting) => {
        setEditingMeeting(meeting);
        setIsMeetingModalOpen(true);
    };

    const handleDeleteMeeting = async (meetingId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este encontro?')) {
            const success = await deleteMeeting(meetingId);
            if (success) toast.success('Encontro excluído com sucesso!');
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        // Ajuste para fuso horário se necessário, ou assumir UTC
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getStatusBadge = (status: DiscipleshipMeeting['status']) => {
        switch (status) {
            case 'Scheduled':
                return { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Agendado' };
            case 'Completed':
                return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Concluído' };
            case 'Cancelled':
                return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelado' };
            default:
                return { color: 'bg-gray-100 text-gray-700', icon: Clock, label: status };
        }
    };

    if (loading || !leader) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    // Membros disponíveis (que não são discípulos deste líder e não são o próprio líder)
    const availableMembers = members.filter(
        member => member.id !== leader.member.id && !leader.disciples.some(d => d.id === member.id)
    );

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
                <button
                    onClick={() => navigate('/discipleship')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Voltar para Discipulado</span>
                    <span className="text-xs ml-4 text-gray-400 font-mono">v2.1</span>
                </button>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <img
                        src={leader.member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.member.name)}&background=random`}
                        alt={leader.member.name}
                        className="w-20 h-20 rounded-full border-4 border-orange-100 object-cover"
                    />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-800">{leader.member.name}</h1>
                        <p className="text-slate-600">{leader.member.email}</p>
                        <p className="text-sm text-slate-500 mt-1">Líder desde {formatDate(leader.startDate)}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {/* Error Alert */}
                {localError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <strong className="font-bold">Erro: </strong>
                        <span className="block sm:inline">{localError}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <p className="text-blue-600 text-sm font-medium mb-1">Discípulos</p>
                        <p className="text-3xl font-bold text-blue-700">{leader.disciples.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <p className="text-green-600 text-sm font-medium mb-1">Encontros Realizados</p>
                        <p className="text-3xl font-bold text-green-700">
                            {leader.meetings?.filter(m => m.status === 'Completed').length || 0}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <p className="text-purple-600 text-sm font-medium mb-1">Próximos Encontros</p>
                        <p className="text-3xl font-bold text-purple-700">
                            {leader.meetings?.filter(m => m.status === 'Scheduled').length || 0}
                        </p>
                    </div>
                </div>

                {/* Disciples List */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Discípulos</h2>
                        <button
                            onClick={() => setIsAddDiscipleModalOpen(true)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <UserPlus size={16} /> Adicionar Discípulo
                        </button>
                    </div>

                    {leader.disciples.length > 0 ? (
                        <div className="space-y-2">
                            {leader.disciples.map(disciple => (
                                <div key={disciple.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <img
                                        src={disciple.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(disciple.name)}&background=random`}
                                        alt=""
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{disciple.name}</p>
                                        <p className="text-sm text-slate-600">{disciple.email}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveDisciple(disciple.id)}
                                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Remover
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Users size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>Nenhum discípulo cadastrado ainda</p>
                        </div>
                    )}
                </div>

                {/* Meetings List */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Encontros de Discipulado</h2>
                        <button
                            onClick={() => {
                                setEditingMeeting(null);
                                setIsMeetingModalOpen(true);
                            }}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} /> Novo Encontro
                        </button>
                    </div>

                    {leader.meetings && leader.meetings.length > 0 ? (
                        <div className="space-y-3">
                            {leader.meetings
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map(meeting => {
                                    const statusInfo = getStatusBadge(meeting.status);
                                    const StatusIcon = statusInfo.icon;
                                    return (
                                        <div key={meeting.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-slate-600" />
                                                    <span className="font-medium text-slate-800">{formatDate(meeting.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                                                        <StatusIcon size={12} />
                                                        {statusInfo.label}
                                                    </span>
                                                    <button
                                                        onClick={() => handleEditMeeting(meeting)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMeeting(meeting.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            {meeting.notes && (
                                                <p className="text-sm text-slate-600 mb-2">{meeting.notes}</p>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Users size={14} />
                                                <span>
                                                    {meeting.attendees.length} de {leader.disciples.length} discípulos presentes
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Calendar size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>Nenhum encontro registrado ainda</p>
                        </div>
                    )}
                </div>
            </div>

            <AddDiscipleModal
                isOpen={isAddDiscipleModalOpen}
                onClose={() => setIsAddDiscipleModalOpen(false)}
                onSave={handleAddDisciple}
                availableMembers={availableMembers}
            />

            <AddDiscipleshipMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                onSave={handleSaveMeeting}
                meeting={editingMeeting}
                disciples={leader.disciples}
            />
        </div>
    );
};

export default DiscipleshipDetail;
