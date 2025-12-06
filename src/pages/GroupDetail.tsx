import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Clock, UserPlus, CheckSquare, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useGroups, Group, GroupMember } from '../hooks/useGroups';
import { useGroupMeetings, GroupMeeting } from '../hooks/useGroupMeetings';
import { useMembers } from '../hooks/useMembers';
import AddGroupMemberModal from '../components/modals/AddGroupMemberModal';
import GroupMeetingModal from '../components/modals/GroupMeetingModal';

const GroupDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Hooks
    const {
        getGroupById,
        getGroupMembers,
        addMemberToGroup,
        removeMemberFromGroup,
        updateMemberRole
    } = useGroups();

    const {
        fetchMeetings,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        recordAttendance,
        getAttendance
    } = useGroupMeetings();

    const { members: allMembers } = useMembers();

    // State
    const [group, setGroup] = useState<Group | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [meetings, setMeetings] = useState<GroupMeeting[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<GroupMeeting | null>(null);
    const [meetingAttendees, setMeetingAttendees] = useState<string[]>([]);

    // Load Data
    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [groupData, membersData, meetingsData] = await Promise.all([
                getGroupById(id),
                getGroupMembers(id),
                fetchMeetings(id)
            ]);

            setGroup(groupData);
            setGroupMembers(membersData);
            setMeetings(meetingsData);
        } catch (error) {
            console.error('Error loading group details:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handlers
    const handleAddMember = async (memberId: string) => {
        if (!id) return;
        const success = await addMemberToGroup(id, memberId);
        if (success) {
            const membersData = await getGroupMembers(id);
            setGroupMembers(membersData);
            // Update group member count locally or refetch group
            if (group) setGroup({ ...group, member_count: (group.member_count || 0) + 1 });
        }
    };

    const handleRemoveMember = async (groupMemberId: string) => {
        if (window.confirm('Tem certeza que deseja remover este membro do grupo?')) {
            const success = await removeMemberFromGroup(groupMemberId);
            if (success) {
                setGroupMembers(prev => prev.filter(m => m.id !== groupMemberId));
                if (group) setGroup({ ...group, member_count: Math.max((group.member_count || 0) - 1, 0) });
            }
        }
    };

    const handleUpdateMemberRole = async (groupMemberId: string, newRole: string) => {
        const success = await updateMemberRole(groupMemberId, newRole);
        if (success) {
            setGroupMembers(prev => prev.map(m => m.id === groupMemberId ? { ...m, role: newRole } : m));
        }
    };

    const handleEditMeeting = async (meeting: GroupMeeting) => {
        setEditingMeeting(meeting);
        // Fetch attendance for this meeting
        const attendance = await getAttendance(meeting.id);
        setMeetingAttendees(attendance.filter(a => a.status === 'Presente').map(a => a.member_id));
        setIsMeetingModalOpen(true);
    };

    const handleNewMeeting = () => {
        setEditingMeeting(null);
        setMeetingAttendees([]);
        setIsMeetingModalOpen(true);
    };

    const handleSaveMeeting = async (meetingData: any, attendees: string[]) => {
        if (!id) return;

        let meetingId = meetingData.id;
        let success = false;

        if (meetingId) {
            // Update existing
            success = await updateMeeting(meetingId, meetingData);
        } else {
            // Create new
            const newMeeting = await addMeeting({ ...meetingData, group_id: id });
            if (newMeeting) {
                meetingId = newMeeting.id;
                success = true;
            }
        }

        if (success && meetingId) {
            // Record attendance
            // We need to map attendees list to records. 
            // For those in list -> Presente. For others in group -> Ausente.
            const attendanceRecords = groupMembers.map(gm => ({
                member_id: gm.member_id,
                status: attendees.includes(gm.member_id) ? 'Presente' : 'Ausente' as 'Presente' | 'Ausente' | 'Justificado'
            }));

            await recordAttendance(meetingId, attendanceRecords);

            // Refresh meetings
            const meetingsData = await fetchMeetings(id);
            setMeetings(meetingsData);
        }

        setIsMeetingModalOpen(false);
    };

    const handleDeleteMeeting = async (meetingId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este encontro?')) {
            const success = await deleteMeeting(meetingId);
            if (success) {
                setMeetings(prev => prev.filter(m => m.id !== meetingId));
            }
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    };

    const getAttendanceRate = () => {
        if (!meetings || meetings.length === 0) return 0;
        // Calculate based on meetings data which has attendance_count and total_members
        let totalPossible = 0;
        let totalPresent = 0;

        meetings.forEach(m => {
            totalPresent += m.attendance_count || 0;
            totalPossible += m.total_members || 0;
        });

        return totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <p className="text-xl font-bold mb-2">Grupo não encontrado</p>
                <button onClick={() => navigate('/groups')} className="text-orange-500 hover:underline">
                    Voltar para lista
                </button>
            </div>
        );
    }

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
                                <span>{group.meeting_day} {group.meeting_time}</span>
                            </div>
                            {group.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    <span>{group.location}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>{group.member_count} membros</span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${group.status === 'Ativo' ? 'bg-green-100 text-green-700' :
                                group.status === 'Cheio' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {group.status}
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
                        <p className="text-3xl font-bold text-blue-700">{group.member_count}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <p className="text-green-600 text-sm font-medium mb-1">Encontros Realizados</p>
                        <p className="text-3xl font-bold text-green-700">{meetings.length}</p>
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
                        {group.leader && (
                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold">
                                    {group.leader.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800">{group.leader.name}</p>
                                    <p className="text-sm text-slate-600">Líder</p>
                                </div>
                            </div>
                        )}
                        {group.co_leader && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                    {group.co_leader.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800">{group.co_leader.name}</p>
                                    <p className="text-sm text-slate-600">Co-líder</p>
                                </div>
                            </div>
                        )}
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
                        {groupMembers.map(groupMember => (
                            <div key={groupMember.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                    {groupMember.member_name?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800">{groupMember.member_name}</p>
                                    <p className="text-sm text-slate-600">{groupMember.member_phone}</p>
                                </div>
                                <select
                                    value={groupMember.role}
                                    onChange={(e) => handleUpdateMemberRole(groupMember.id, e.target.value)}
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
                                    onClick={() => handleRemoveMember(groupMember.id)}
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
                            onClick={handleNewMeeting}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} /> Novo Encontro
                        </button>
                    </div>

                    {/* Lista de Encontros */}
                    <div className="space-y-3">
                        {meetings && meetings.length > 0 ? (
                            meetings.map(meeting => (
                                <div key={meeting.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-slate-600" />
                                            <span className="font-medium text-slate-800">{formatDate(meeting.date)}</span>
                                            {meeting.topic && (
                                                <span className="text-sm text-slate-500">- {meeting.topic}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-600">
                                                {meeting.attendance_count} de {meeting.total_members} presentes
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
                allMembers={allMembers}
                existingMemberIds={groupMembers.map(m => m.member_id)}
            />

            <GroupMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                onSave={handleSaveMeeting}
                meeting={editingMeeting}
                groupMembers={groupMembers}
                initialAttendees={meetingAttendees}
            />
        </div>
    );
};

export default GroupDetail;
