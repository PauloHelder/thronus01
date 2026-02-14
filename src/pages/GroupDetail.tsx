import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Clock, UserPlus, CheckSquare, Plus, Pencil, Trash2, MapPin, LayoutDashboard, Info, ClipboardCheck } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'geral' | 'membros' | 'encontros'>('geral');
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
            const newMeeting = await addMeeting({ ...meetingData, group_id: id }) as any;
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

            {/* Content Tabs Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 lg:px-6">
                <div className="flex overflow-x-auto no-scrollbar gap-8">
                    {[
                        { id: 'geral', label: 'Geral', icon: <LayoutDashboard size={18} /> },
                        { id: 'membros', label: 'Membros', icon: <Users size={18} /> },
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
                        {/* Estatísticas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                                <p className="text-blue-600 text-sm font-medium mb-1">Total de Membros</p>
                                <p className="text-3xl font-bold text-blue-700">{group.member_count}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
                                <p className="text-green-600 text-sm font-medium mb-1">Encontros Realizados</p>
                                <p className="text-3xl font-bold text-green-700">{meetings.length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                                <p className="text-purple-600 text-sm font-medium mb-1">Taxa de Presença</p>
                                <p className="text-3xl font-bold text-purple-700">{getAttendanceRate()}%</p>
                            </div>
                        </div>

                        {/* Líderes */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Info size={18} className="text-orange-500" />
                                Liderança do Grupo
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {group.leader ? (
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-shadow">
                                        <p className="text-xs font-semibold text-orange-600 uppercase mb-2">Líder</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold shadow-inner">
                                                {group.leader.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 truncate">{group.leader.name}</p>
                                                <p className="text-sm text-slate-600">Líder Principal</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 italic">
                                        Sem líder principal
                                    </div>
                                )}
                                {group.co_leader ? (
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                                        <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Co-líder</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold shadow-inner">
                                                {group.co_leader.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 truncate">{group.co_leader.name}</p>
                                                <p className="text-sm text-slate-600">Auxiliar</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 italic">
                                        Sem co-líder
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Localização e Horário */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <MapPin size={18} className="text-orange-500" />
                                Localização e Horário
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">Horário de Reunião</p>
                                            <p className="text-sm text-slate-600">{group.meeting_day} às {group.meeting_time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">Local</p>
                                            <p className="text-sm text-slate-600">{group.location || 'Sem local definido'}</p>
                                            {group.address && <p className="text-xs text-slate-500 mt-1">{group.address}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm mb-2 ${group.status === 'Ativo' ? 'bg-green-100 text-green-700 border border-green-200' :
                                        group.status === 'Cheio' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                            'bg-gray-100 text-gray-700 border border-gray-200'
                                        }`}>
                                        Status: {group.status}
                                    </span>
                                    <p className="text-xs text-slate-500 max-w-[200px]">
                                        O status determina se o grupo aparece na busca de novos membros.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'membros' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Membros do Grupo</h2>
                                <p className="text-sm text-slate-500">Gerencie os participantes ativos deste grupo</p>
                            </div>
                            <button
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                            >
                                <UserPlus size={16} /> Adicionar
                            </button>
                        </div>

                        {groupMembers.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {groupMembers.map(groupMember => (
                                    <div key={groupMember.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-gray-100">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-inner">
                                                {groupMember.member_name?.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 truncate">{groupMember.member_name}</p>
                                                <p className="text-xs text-slate-500 uppercase font-medium">{groupMember.member_phone || 'Sem telefone'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                                            <select
                                                value={groupMember.role}
                                                onChange={(e) => handleUpdateMemberRole(groupMember.id, e.target.value)}
                                                className="text-xs font-bold px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white shadow-sm"
                                            >
                                                <option value="Membro">Membro</option>
                                                <option value="Co-líder">Co-líder</option>
                                                <option value="Secretário">Secretário</option>
                                                <option value="Visitante">Visitante</option>
                                            </select>
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm ${getRoleBadgeColor(groupMember.role)}`}>
                                                {groupMember.role}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveMember(groupMember.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Remover"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <Users size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Nenhum membro faz parte deste grupo ainda.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'encontros' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Registro de Presença</h2>
                                <p className="text-sm text-slate-500">Histórico de encontros e frequência dos membros</p>
                            </div>
                            <button
                                onClick={handleNewMeeting}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                            >
                                <Plus size={16} /> Novo Encontro
                            </button>
                        </div>

                        {meetings && meetings.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {meetings
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map(meeting => (
                                        <div key={meeting.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-white rounded-xl border border-gray-200 text-orange-500 shadow-sm">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="block font-black text-slate-800">{formatDate(meeting.date)}</span>
                                                        {meeting.topic && (
                                                            <span className="text-sm font-medium text-slate-500 bg-orange-100 px-2 py-0.5 rounded-md">Tema: {meeting.topic}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Frequência</p>
                                                        <p className="text-lg font-black text-slate-800">
                                                            {meeting.attendance_count} <span className="text-xs text-slate-400 font-medium">/ {meeting.total_members}</span>
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1 border-l pl-3 ml-1 border-gray-200">
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
                                    ))}
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
