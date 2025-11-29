import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Clock, UserPlus, CheckSquare, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { Group, Member, GroupMeeting, GroupMember } from '../types';
import { MOCK_MEMBERS } from '../mocks/members';
import AddGroupMemberModal from '../components/modals/AddGroupMemberModal';
import GroupMeetingModal from '../components/modals/GroupMeetingModal';

// Mock data for initial group state (simulating a fetch)
const MOCK_GROUP: Group = {
    id: '1',
    name: 'Grupo de Homens',
    leaders: [MOCK_MEMBERS[0]],
    members: [
        { member: MOCK_MEMBERS[1], role: 'Membro' },
        { member: MOCK_MEMBERS[2], role: 'Secretário' }
    ],
    memberCount: 2,
    meetingTime: 'Quartas-feiras às 19:30',
    meetingPlace: 'Sala 3',
    address: 'Rua da Igreja, 123',
    status: 'Active',
    meetings: [
        {
            id: '1',
            groupId: '1',
            date: '2024-01-17',
            attendees: ['2', '3'],
            notes: 'Estudo sobre liderança'
        },
        {
            id: '2',
            groupId: '1',
            date: '2024-01-10',
            attendees: ['2'],
            notes: 'Reunião de oração'
        }
    ]
};

const GroupDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState<Group>(MOCK_GROUP);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<GroupMeeting | null>(null);

    const handleAddMember = (memberId: string) => {
        const member = MOCK_MEMBERS.find(m => m.id === memberId);
        if (member) {
            const newMember: GroupMember = { member: member, role: 'Membro' };
            setGroup({
                ...group,
                members: [...group.members, newMember],
                memberCount: group.memberCount + 1
            });
        }
    };

    const handleRemoveMember = (memberId: string) => {
        if (window.confirm('Tem certeza que deseja remover este membro do grupo?')) {
            setGroup({
                ...group,
                members: group.members.filter(m => m.member.id !== memberId),
                memberCount: group.memberCount - 1
            });
        }
    };

    const handleUpdateMemberRole = (memberId: string, newRole: GroupMember['role']) => {
        setGroup({
            ...group,
            members: group.members.map(m =>
                m.member.id === memberId ? { ...m, role: newRole } : m
            )
        });
    };

    const handleSaveMeeting = (meetingData: Omit<GroupMeeting, 'id'> | GroupMeeting) => {
        if ('id' in meetingData && group.meetings?.some(m => m.id === meetingData.id)) {
            // Editar encontro existente
            setGroup({
                ...group,
                meetings: group.meetings?.map(m =>
                    m.id === meetingData.id
                        ? { ...m, ...meetingData } as GroupMeeting
                        : m
                )
            });
        } else {
            // Novo encontro
            const newMeeting: GroupMeeting = {
                ...meetingData,
                id: crypto.randomUUID(),
                groupId: group.id
            } as GroupMeeting;

            setGroup({
                ...group,
                meetings: [newMeeting, ...(group.meetings || [])]
            });
        }
        setEditingMeeting(null);
        setIsMeetingModalOpen(false);
    };

    const handleEditMeeting = (meeting: GroupMeeting) => {
        setEditingMeeting(meeting);
        setIsMeetingModalOpen(true);
    };

    const handleDeleteMeeting = (meetingId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este encontro?')) {
            setGroup({
                ...group,
                meetings: group.meetings?.filter(m => m.id !== meetingId)
            });
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    };

    const getAttendanceRate = () => {
        if (!group.meetings || group.meetings.length === 0) return 0;
        const totalPossible = group.meetings.length * group.members.length;
        const totalPresent = group.meetings.reduce((acc, m) => acc + m.attendees.length, 0);
        return totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
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
        <div className="h-full overflow-y-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
                <button
                    onClick={() => navigate('/groups')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Voltar para Grupos</span>
                </button>

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">{group.name}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>{group.meetingTime}</span>
                            </div>
                            {group.meetingPlace && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    <span>{group.meetingPlace}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>{group.memberCount} membros</span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${group.status === 'Active' ? 'bg-green-100 text-green-700' :
                                group.status === 'Full' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {group.status === 'Active' ? 'Ativo' : group.status === 'Full' ? 'Cheio' : 'Inativo'}
                            </span>
                        </div>
                        {group.address && (
                            <p className="text-sm text-slate-500 mt-2 ml-6">{group.address}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <p className="text-blue-600 text-sm font-medium mb-1">Total de Membros</p>
                        <p className="text-3xl font-bold text-blue-700">{group.memberCount}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <p className="text-green-600 text-sm font-medium mb-1">Encontros Realizados</p>
                        <p className="text-3xl font-bold text-green-700">{group.meetings?.length || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <p className="text-purple-600 text-sm font-medium mb-1">Taxa de Presença</p>
                        <p className="text-3xl font-bold text-purple-700">{getAttendanceRate()}%</p>
                    </div>
                </div>

                {/* Líderes */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Líderes</h2>
                    <div className="space-y-3">
                        {group.leaders.map(leader => (
                            <div key={leader.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <img src={leader.avatar} alt="" className="w-10 h-10 rounded-full" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800">{leader.name}</p>
                                    <p className="text-sm text-slate-600">{leader.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Membros */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Membros do Grupo</h2>
                        <button
                            onClick={() => setIsAddMemberModalOpen(true)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <UserPlus size={16} /> Adicionar Membros
                        </button>
                    </div>

                    <div className="space-y-2">
                        {group.members.map(groupMember => (
                            <div key={groupMember.member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <img src={groupMember.member.avatar} alt="" className="w-10 h-10 rounded-full" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800">{groupMember.member.name}</p>
                                    <p className="text-sm text-slate-600">{groupMember.member.phone}</p>
                                </div>
                                <select
                                    value={groupMember.role}
                                    onChange={(e) => handleUpdateMemberRole(groupMember.member.id, e.target.value as GroupMember['role'])}
                                    className="text-sm px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                >
                                    <option value="Membro">Membro</option>
                                    <option value="Co-líder">Co-líder</option>
                                    <option value="Secretário">Secretário</option>
                                    <option value="Visitante">Visitante</option>
                                </select>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(groupMember.role)}`}>
                                    {groupMember.role}
                                </span>
                                <button
                                    onClick={() => handleRemoveMember(groupMember.member.id)}
                                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    Remover
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Registro de Presença */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Registro de Presença</h2>
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

                    {/* Lista de Encontros */}
                    <div className="space-y-3">
                        {group.meetings && group.meetings.length > 0 ? (
                            group.meetings.map(meeting => (
                                <div key={meeting.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-slate-600" />
                                            <span className="font-medium text-slate-800">{formatDate(meeting.date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-600">
                                                {meeting.attendees.length} de {group.memberCount} presentes
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
                                    <div className="flex flex-wrap gap-2">
                                        {meeting.attendees.map(attendeeId => {
                                            const groupMember = group.members.find(m => m.member.id === attendeeId);
                                            return groupMember ? (
                                                <div key={attendeeId} className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                                    <CheckSquare size={12} />
                                                    <span>{groupMember.member.name}</span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Calendar size={48} className="mx-auto mb-2 text-gray-400" />
                                <p>Nenhum encontro registrado ainda</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddGroupMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                onAddMember={handleAddMember}
                allMembers={MOCK_MEMBERS}
                currentGroupId={group.id}
            />

            <GroupMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                onSave={handleSaveMeeting}
                meeting={editingMeeting}
                groupMembers={group.members}
            />
        </div>
    );
};

export default GroupDetail;
