import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Plus, UserPlus, Trash2, Pencil, CheckCircle, XCircle, Clock, LayoutDashboard, Info, ClipboardCheck } from 'lucide-react';
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

    const [activeTab, setActiveTab] = useState<'geral' | 'discipulos' | 'encontros'>('geral');
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
            {/* Content Tabs Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 lg:px-6">
                <div className="flex overflow-x-auto no-scrollbar gap-8">
                    {[
                        { id: 'geral', label: 'Geral', icon: <LayoutDashboard size={18} /> },
                        { id: 'discipulos', label: 'Discípulos', icon: <Users size={18} /> },
                        { id: 'encontros', label: 'Encontros', icon: <ClipboardCheck size={18} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-all font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {activeTab === 'geral' && (
                    <>
                        {/* Error Alert */}
                        {localError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                                <strong className="font-bold">Erro: </strong>
                                <span className="block sm:inline">{localError}</span>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                                <p className="text-blue-600 text-sm font-medium mb-1">Discípulos</p>
                                <p className="text-3xl font-bold text-blue-700">{leader.disciples.length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
                                <p className="text-green-600 text-sm font-medium mb-1">Encontros Realizados</p>
                                <p className="text-3xl font-bold text-green-700">
                                    {leader.meetings?.filter(m => m.status === 'Completed').length || 0}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                                <p className="text-purple-600 text-sm font-medium mb-1">Próximos Encontros</p>
                                <p className="text-3xl font-bold text-purple-700">
                                    {leader.meetings?.filter(m => m.status === 'Scheduled').length || 0}
                                </p>
                            </div>
                        </div>

                        {/* Leader Info */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Info size={18} className="text-orange-500" />
                                Informações do Discipulador
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">Líder desde</p>
                                            <p className="text-sm text-slate-600">{formatDate(leader.startDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">Email de Contato</p>
                                            <p className="text-sm text-slate-600">{leader.member.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-white p-1 border border-gray-200 shadow-sm mb-3">
                                        <img
                                            src={leader.member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.member.name)}&background=random`}
                                            alt=""
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                    <p className="font-bold text-slate-800 uppercase tracking-tight">{leader.member.name}</p>
                                    <p className="text-[10px] font-black text-orange-600 uppercase mt-1">Discipulador(a)</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'discipulos' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Lista de Discípulos</h2>
                                <p className="text-sm text-slate-500">Pessoas sob cuidado deste discipulador</p>
                            </div>
                            <button
                                onClick={() => setIsAddDiscipleModalOpen(true)}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                            >
                                <UserPlus size={16} /> Adicionar Discípulo
                            </button>
                        </div>

                        {leader.disciples.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {leader.disciples.map(disciple => (
                                    <div key={disciple.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-gray-100">
                                        <img
                                            src={disciple.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(disciple.name)}&background=random`}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover shadow-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{disciple.name}</p>
                                            <p className="text-[10px] text-slate-500 truncate uppercase font-semibold">{disciple.email || 'Sem email'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveDisciple(disciple.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <Users size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Este líder ainda não possui discípulos cadastrados.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'encontros' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Encontros de Discipulado</h2>
                                <p className="text-sm text-slate-500">Histórico de acompanhamento e reuniões</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingMeeting(null);
                                    setIsMeetingModalOpen(true);
                                }}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                            >
                                <Plus size={16} /> Novo Encontro
                            </button>
                        </div>

                        {leader.meetings && leader.meetings.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {leader.meetings
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map(meeting => {
                                        const statusInfo = getStatusBadge(meeting.status);
                                        const StatusIcon = statusInfo.icon;
                                        return (
                                            <div key={meeting.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 bg-white rounded-xl border border-gray-200 text-orange-500 shadow-sm">
                                                            <Calendar size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="block font-black text-slate-800">{formatDate(meeting.date)}</span>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${statusInfo.color}`}>
                                                                <StatusIcon size={10} />
                                                                {statusInfo.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right mr-2">
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Presença</p>
                                                            <p className="text-lg font-black text-slate-800">
                                                                {meeting.attendees.length} <span className="text-xs text-slate-400 font-medium">/ {leader.disciples.length}</span>
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1 border-l pl-3 border-gray-200">
                                                            <button
                                                                onClick={() => handleEditMeeting(meeting)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMeeting(meeting.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {meeting.notes && (
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100 text-sm text-slate-600 italic leading-relaxed">
                                                        "{meeting.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Nenhum encontro registrado ainda.</p>
                            </div>
                        )}
                    </div>
                )}
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
