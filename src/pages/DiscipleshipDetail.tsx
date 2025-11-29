import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Plus, UserPlus, Trash2, Pencil, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DiscipleshipLeader, DiscipleshipMeeting, Member } from '../types';
import { MOCK_MEMBERS } from '../mocks/members';
import AddDiscipleModal from '../components/modals/AddDiscipleModal';
import AddDiscipleshipMeetingModal from '../components/modals/AddDiscipleshipMeetingModal';

// Mock data
const MOCK_LEADER: DiscipleshipLeader = {
    id: '1',
    member: MOCK_MEMBERS[0],
    startDate: '2023-06-15',
    disciples: [MOCK_MEMBERS[1], MOCK_MEMBERS[2]],
    meetings: [
        {
            id: '1',
            leaderId: '1',
            date: '2024-01-25',
            attendees: ['2', '3'],
            status: 'Completed',
            notes: 'Estudo sobre oração'
        },
        {
            id: '2',
            leaderId: '1',
            date: '2024-01-18',
            attendees: ['2'],
            status: 'Completed',
            notes: 'Fundamentos da fé'
        },
        {
            id: '3',
            leaderId: '1',
            date: '2024-02-01',
            attendees: [],
            status: 'Scheduled',
            notes: 'Próximo encontro - Batismo'
        }
    ]
};

const DiscipleshipDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [leader, setLeader] = useState<DiscipleshipLeader>(MOCK_LEADER);
    const [isAddDiscipleModalOpen, setIsAddDiscipleModalOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<DiscipleshipMeeting | null>(null);

    const handleAddDisciple = (memberId: string) => {
        const member = MOCK_MEMBERS.find(m => m.id === memberId);
        if (!member) return;

        setLeader({
            ...leader,
            disciples: [...leader.disciples, member]
        });
    };

    const handleRemoveDisciple = (discipleId: string) => {
        if (window.confirm('Tem certeza que deseja remover este discípulo?')) {
            setLeader({
                ...leader,
                disciples: leader.disciples.filter(d => d.id !== discipleId)
            });
        }
    };

    const handleSaveMeeting = (meetingData: Omit<DiscipleshipMeeting, 'id' | 'leaderId'> | DiscipleshipMeeting) => {
        if ('id' in meetingData && leader.meetings?.some(m => m.id === meetingData.id)) {
            // Editar
            setLeader({
                ...leader,
                meetings: leader.meetings?.map(m =>
                    m.id === meetingData.id ? { ...meetingData, leaderId: leader.id } as DiscipleshipMeeting : m
                )
            });
        } else {
            // Novo
            const newMeeting: DiscipleshipMeeting = {
                ...meetingData,
                id: crypto.randomUUID(),
                leaderId: leader.id
            } as DiscipleshipMeeting;

            setLeader({
                ...leader,
                meetings: [newMeeting, ...(leader.meetings || [])]
            });
        }
        setEditingMeeting(null);
        setIsMeetingModalOpen(false);
    };

    const handleEditMeeting = (meeting: DiscipleshipMeeting) => {
        setEditingMeeting(meeting);
        setIsMeetingModalOpen(true);
    };

    const handleDeleteMeeting = (meetingId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este encontro?')) {
            setLeader({
                ...leader,
                meetings: leader.meetings?.filter(m => m.id !== meetingId)
            });
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
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
        }
    };

    // Membros disponíveis (que não são discípulos deste líder e não são o próprio líder)
    const availableMembers = MOCK_MEMBERS.filter(
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
                </button>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <img
                        src={leader.member.avatar}
                        alt={leader.member.name}
                        className="w-20 h-20 rounded-full border-4 border-orange-100"
                    />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-800">{leader.member.name}</h1>
                        <p className="text-slate-600">{leader.member.email}</p>
                        <p className="text-sm text-slate-500 mt-1">Líder desde {formatDate(leader.startDate)}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
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
                                    <img src={disciple.avatar} alt="" className="w-12 h-12 rounded-full" />
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
