import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Users,
    Edit2,
    Trash2,
    User,
    Heart,
    BookOpen,
    TrendingUp,
    Activity,
    Loader2,
    Award,
    MessageCircle
} from 'lucide-react';
import MemberModal from '../components/modals/MemberModal';
import CommunicationModal from '../components/modals/CommunicationModal';
import GenericDeleteModal from '../components/modals/GenericDeleteModal';
import { Member } from '../types';
import { useMembers } from '../hooks/useMembers';
import { formatDateForInput } from '../utils/dateUtils';
import { useGroups } from '../hooks/useGroups';
import { useServices } from '../hooks/useServices';
import { useTeaching } from '../hooks/useTeaching';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// Estendendo a interface Member para incluir campos extras usados nesta página
interface ExtendedMember extends Member {
    role: string;
    groupName: string;
    attendance: number;
    lastAttendance: string | null;
}

const MemberDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { members, loading: membersLoading, updateMember, deleteMember, refetch } = useMembers();
    const { groups } = useGroups();
    const { services } = useServices();
    const { classes } = useTeaching();

    // Local state for fetched relationships
    const [memberDepartments, setMemberDepartments] = useState<string[]>([]);
    const [memberClasses, setMemberClasses] = useState<string[]>([]);
    const [memberGroups, setMemberGroups] = useState<string[]>([]);
    const [familyRelationships, setFamilyRelationships] = useState<any[]>([]);
    const [ordinationsHistory, setOrdinationsHistory] = useState<any[]>([]);

    const [member, setMember] = useState<ExtendedMember | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCommModalOpen, setIsCommModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'member' | 'relationship' } | null>(null);

    useEffect(() => {
        if (!membersLoading && id) {
            const foundMember = members.find(m => m.id === id);

            if (foundMember) {
                // Encontrar nome do grupo
                const foundGroup = groups.find(g => g.id === foundMember.groupId);

                // Fetch Departments and Calculate Group Attendance
                const fetchRelationships = async () => {
                    let lastDate: string | null = null;
                    let deptNames: string[] = [];
                    let grpNames: string[] = [];
                    let clsNames: string[] = [];
                    let calculatedAttendance = 0;
                    let relationships: any[] = [];
                    let ordHistory: any[] = [];

                    // Map opposite relationships helper
                    const getOppositeRelationship = (type: string, currentMemberGender?: string) => {
                        switch (type) {
                            case 'Pai':
                            case 'Mãe':
                                return 'Filho(a)';
                            case 'Filho(a)':
                                return currentMemberGender === 'Male' ? 'Pai' : (currentMemberGender === 'Female' ? 'Mãe' : 'Pai/Mãe');
                            case 'Avô/Avó':
                                return 'Neto(a)';
                            case 'Neto(a)':
                                return 'Avô/Avó';
                            case 'Tio(a)':
                                return 'Sobrinho(a)';
                            case 'Sobrinho(a)':
                                return 'Tio(a)';
                            case 'Cônjuge':
                            case 'Irmão/Irmã':
                            case 'Outro':
                            default:
                                return type;
                        }
                    };

                    try {
                        // 1. First Phase: Fetch all independent data sets in parallel
                        const [
                            deptMembershipResult,
                            deptLeadershipResult,
                            groupMembershipResult,
                            classesResult,
                            lastAttendanceResult,
                            relationshipsSourceResult,
                            relationshipsTargetResult,
                            ordinationsResult
                        ] = await Promise.all([
                            supabase
                                .from('department_members')
                                .select('department:departments(name)')
                                .eq('member_id', id),
                            supabase
                                .from('departments')
                                .select('name')
                                .or(`leader_id.eq.${id},co_leader_id.eq.${id}`),
                            supabase
                                .from('group_members')
                                .select('group_id, group:groups(name)')
                                .eq('member_id', id)
                                .is('left_at', null),
                            supabase
                                .from('teaching_class_students')
                                .select('class:teaching_classes(name)')
                                .eq('member_id', id),
                            supabase
                                .from('group_meeting_attendance')
                                .select('meeting:group_meetings(date)')
                                .eq('member_id', id)
                                .eq('present', true),
                            supabase
                                .from('member_relationships')
                                .select('id, relationship_type, related:members!related_member_id(id, name, avatar_url, member_code)')
                                .eq('member_id', id),
                            supabase
                                .from('member_relationships')
                                .select('id, relationship_type, related:members!member_id(id, name, avatar_url, member_code)')
                                .eq('related_member_id', id),
                            supabase
                                .from('ordination_members')
                                .select(`
                                    id,
                                    ordination:ordinations(
                                        id,
                                        date,
                                        category,
                                        celebrant,
                                        notes
                                    )
                                `)
                                .eq('member_id', id)
                                .order('ordination(date)', { ascending: false })
                        ]);

                        // Process Departments
                        if (deptMembershipResult.data) {
                            deptNames = deptMembershipResult.data.map((d: any) => d.department?.name).filter(Boolean);
                        }
                        if (deptLeadershipResult.data) {
                            const leaderDeptNames = deptLeadershipResult.data.map((d: any) => d.name).filter(Boolean);
                            deptNames = Array.from(new Set([...deptNames, ...leaderDeptNames]));
                        }

                        // Process Groups Information
                        if (groupMembershipResult.data) {
                            grpNames = groupMembershipResult.data.map((g: any) => g.group?.name).filter(Boolean);
                        }

                        // Process Classes
                        if (classesResult.data) {
                            clsNames = classesResult.data.map((c: any) => c.class?.name).filter(Boolean);
                        }

                        // Process Last Attendance
                        if (lastAttendanceResult.data && lastAttendanceResult.data.length > 0) {
                            const dates = lastAttendanceResult.data
                                .map((a: any) => a.meeting?.date)
                                .filter(Boolean)
                                .map(d => new Date(d).getTime());

                            if (dates.length > 0) {
                                const maxDate = new Date(Math.max(...dates));
                                lastDate = maxDate.toISOString();
                            }
                        }

                        // Process Family Relationships
                        const familyAsSource = relationshipsSourceResult.data || [];
                        const familyAsTarget = relationshipsTargetResult.data || [];
                        relationships = [
                            ...familyAsSource.map((r: any) => ({
                                id: r.id,
                                type: r.relationship_type,
                                relative: r.related,
                                direction: 'source'
                            })),
                            ...familyAsTarget.map((r: any) => ({
                                id: r.id,
                                type: getOppositeRelationship(r.relationship_type, foundMember.gender),
                                relative: r.related,
                                direction: 'target'
                            }))
                        ];

                        // Process Ordination History
                        if (ordinationsResult.data) {
                            ordHistory = ordinationsResult.data.map((o: any) => o.ordination).filter(Boolean);
                        }

                        // 2. Second Phase: Attendance Percentage (Depends on group list)
                        const activeGroupIds = groupMembershipResult.data?.map((g: any) => g.group_id).filter(Boolean) || [];
                        if (foundMember.groupId && !activeGroupIds.includes(foundMember.groupId)) {
                            activeGroupIds.push(foundMember.groupId);
                        }

                        if (activeGroupIds.length > 0) {
                            const sixMonthsAgo = new Date();
                            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                            const { data: groupMeetings } = await supabase
                                .from('group_meetings')
                                .select('id')
                                .in('group_id', activeGroupIds)
                                .gte('date', sixMonthsAgo.toISOString());

                            const totalMeetings = groupMeetings?.length || 0;

                            if (totalMeetings > 0) {
                                const meetingIds = groupMeetings!.map(m => m.id);

                                const { count } = await supabase
                                    .from('group_meeting_attendance')
                                    .select('*', { count: 'exact', head: true })
                                    .eq('member_id', id)
                                    .eq('present', true)
                                    .in('meeting_id', meetingIds);

                                const attendedCount = count || 0;
                                calculatedAttendance = Math.round((attendedCount / totalMeetings) * 100);
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching member relationships data:', error);
                    }

                    return { lastDate, deptNames, grpNames, clsNames, calculatedAttendance, relationships, ordHistory };
                };

                fetchRelationships().then(({ lastDate, deptNames, grpNames, clsNames, calculatedAttendance, relationships, ordHistory }) => {
                    setMemberDepartments(deptNames);
                    setMemberGroups(grpNames);
                    setMemberClasses(clsNames);
                    setFamilyRelationships(relationships);
                    setOrdinationsHistory(ordHistory);

                    setMember({
                        ...(foundMember as ExtendedMember),
                        role: foundMember.churchRole || 'Membro',
                        joinDate: foundMember.joinDate || new Date().toISOString(),
                        birthDate: foundMember.birthDate ? formatDateForInput(foundMember.birthDate) : new Date().toISOString().split('T')[0],
                        address: foundMember.address || 'Endereço não informado',
                        groupName: grpNames.length > 0 ? grpNames.join(', ') : 'Sem grupo',
                        attendance: calculatedAttendance,
                        lastAttendance: lastDate,
                        occupation: foundMember.occupation || 'Não informada',
                        notes: foundMember.notes || 'Sem observações',
                    });
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        }
    }, [members, membersLoading, id, groups, services, classes]);

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleSaveMember = async (updatedData: Member | Omit<Member, 'id'>) => {
        if (!member) return;

        try {
            await updateMember(member.id, updatedData);
            await refetch(); // Garante que temos os dados mais recentes do servidor
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Erro ao atualizar membro:', error);
            toast.error('Erro ao atualizar membro. Tente novamente.');
        }
    };

    const handleDelete = () => {
        if (!member) return;
        setItemToDelete({ id: member.id, name: member.name, type: 'member' });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteFamilyRelationship = (rel: any) => {
        setItemToDelete({ id: rel.id, name: rel.relative.name, type: 'relationship' });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'member') {
                await deleteMember(itemToDelete.id);
                setIsDeleteModalOpen(false);
                navigate('/members');
            } else if (itemToDelete.type === 'relationship') {
                const { error } = await supabase
                    .from('member_relationships')
                    .delete()
                    .eq('id', itemToDelete.id);

                if (error) throw error;
                setFamilyRelationships(prev => prev.filter(r => r.id !== itemToDelete.id));
                setIsDeleteModalOpen(false);
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir. Tente novamente.');
        }
        setItemToDelete(null);
    };




    const getMaritalStatusTranslation = (status?: string) => {
        switch (status) {
            case 'Single': return 'Solteiro(a)';
            case 'Married': return 'Casado(a)';
            case 'Divorced': return 'Divorciado(a)';
            case 'Widowed': return 'Viúvo(a)';
            default: return status || 'Não informado';
        }
    };

    if (loading || membersLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (!member) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-800">Membro não encontrado</h2>
                <button
                    onClick={() => navigate('/members')}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
                >
                    Voltar para Lista
                </button>
            </div>
        );
    }

    const stats = [
        {
            icon: Activity,
            label: 'Frequência',
            value: `${member.attendance}%`,
            color: 'bg-green-500'
        },
        {
            icon: Calendar,
            label: 'Última Presença',
            value: member.lastAttendance ? new Date(member.lastAttendance).toLocaleDateString('pt-BR') : 'N/A',
            color: 'bg-blue-500'
        },
        {
            icon: Users,
            label: 'Grupos',
            value: memberGroups.length > 0 ? memberGroups.length : 'Nenhum',
            color: 'bg-purple-500'
        },
        {
            icon: TrendingUp,
            label: 'Status',
            value: member.status === 'Active' ? 'Ativo' : (member.status === 'Inactive' ? 'Inativo' : 'Visitante'),
            color: 'bg-orange-500'
        }
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/members')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-800">Detalhes do Membro</h1>
                    <p className="text-slate-600">Informações completas sobre o membro</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleEdit}
                        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Edit2 size={20} />
                        Editar
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Trash2 size={20} />
                        Excluir
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Sidebar - Informações Principais */}
                <div className="space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="text-center">
                            <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-orange-100">
                                <img
                                    src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">{member.name}</h2>
                            {member.nickname && (
                                <p className="text-sm font-semibold text-slate-400 italic mb-1">
                                    "{member.nickname}"
                                </p>
                            )}
                            {member.memberCode && (
                                <p className="text-slate-500 font-medium mb-2 text-sm tracking-wide">
                                    {member.memberCode}
                                </p>
                            )}
                            <p className="text-orange-600 font-medium mb-4">{member.role}</p>
                            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${member.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                                }`}>
                                {member.status === 'Active' ? 'Ativo' : (member.status === 'Inactive' ? 'Inativo' : 'Visitante')}
                            </div>
                        </div>
                    </div>


                    {/* Contact Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Informações de Contacto</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="text-orange-500 flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-slate-600">Email</p>
                                    <p className="text-slate-800 font-medium break-all">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="text-orange-500 flex-shrink-0 mt-1" size={20} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-slate-600">Telefone</p>
                                            <p className="text-slate-800 font-medium">{member.phone || 'Não informado'}</p>
                                        </div>
                                        {member.phone && (
                                            <button 
                                                onClick={() => setIsCommModalOpen(true)}
                                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                                title="Enviar WhatsApp"
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="text-orange-500 flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-slate-600">Endereço</p>
                                    <p className="text-slate-800 font-medium">
                                        {[
                                            member.address,
                                            member.neighborhood,
                                            member.district,
                                            member.municipality && `${member.municipality} (${member.province || ''})`
                                        ].filter(Boolean).join(', ') || 'Não informado'}
                                    </p>
                                </div>
                            </div>
                            {member.emergencyContact && (
                                <div className="flex items-start gap-3 border-t border-gray-100 pt-3">
                                    <Activity className="text-red-500 flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <p className="text-sm text-slate-600">Contacto de Emergência</p>
                                        <p className="text-slate-800 font-medium">{member.emergencyContact}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Estatísticas Rápidas</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Membro desde</span>
                                <span className="font-bold text-slate-800">
                                    {member.joinDate ? new Date(member.joinDate).toLocaleDateString('pt-BR') : 'Não informado'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Batizado</span>
                                <span className="font-bold text-slate-800">
                                    {member.isBaptized ? 'Sim' : 'Não'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Frequência</span>
                                <span className="font-bold text-orange-600">{member.attendance}%</span>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {stats.map(({ icon: Icon, ...stat }, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                                        <Icon className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">{stat.label}</p>
                                        <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Personal Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <User className="text-orange-500" size={24} />
                            Informações Pessoais
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Data de Nascimento
                                </label>
                                <p className="text-slate-800 font-medium">
                                    {member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Idade
                                </label>
                                <p className="text-slate-800 font-medium">
                                    {member.birthDate ? `${new Date().getFullYear() - new Date(member.birthDate).getFullYear()} anos` : 'Não informado'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Estado Civil
                                </label>
                                <p className="text-slate-800 font-medium">{getMaritalStatusTranslation(member.maritalStatus)}</p>
                            </div>
                            {member.maritalStatus === 'Married' && member.marriageDate && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
                                        Data do Casamento
                                    </label>
                                    <p className="text-slate-800 font-medium">
                                        {new Date(member.marriageDate).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Profissão
                                </label>
                                <p className="text-slate-800 font-medium">{member.occupation || 'Não informado'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Escolaridade
                                </label>
                                <p className="text-slate-800 font-medium">
                                    {member.educationLevel === 'Sem' && 'Sem Instrução'}
                                    {member.educationLevel === 'Base' && 'Ensino Básico'}
                                    {member.educationLevel === 'Medio' && 'Ensino Médio'}
                                    {member.educationLevel === 'Universidade' && 'Universitário'}
                                    {member.educationLevel === 'Pós-universitário' && 'Pós-universitário'}
                                    {!member.educationLevel && 'Não informado'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Tipo Sanguíneo
                                </label>
                                <p className="text-slate-800 font-medium">{member.bloodType || 'Não informado'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Nº do Bilhete (BI)
                                </label>
                                <p className="text-slate-800 font-medium">{member.biNumber || 'Não informado'}</p>
                            </div>
                        </div>

                        {/* Pais e Cônjuge */}
                        <div className="border-t border-gray-100 mt-6 pt-6 grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Pai</label>
                                <p className="text-slate-800 font-medium">
                                    {member.fatherName || 'Não registado'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Mãe</label>
                                <p className="text-slate-800 font-medium">
                                    {member.motherName || 'Não registada'}
                                </p>
                            </div>
                            {member.maritalStatus === 'Married' && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Cônjuge</label>
                                    <p className="text-slate-800 font-medium">
                                        {member.spouseName || 'Não registado(a)'}
                                    </p>
                                </div>
                            )}
                            {(member.childrenData || []).length > 0 && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Filhos ({member.childrenData.length})</label>
                                    <ul className="list-disc list-inside text-slate-800 font-medium text-sm space-y-1">
                                        {member.childrenData.map((child: any, idx: number) => {
                                            const childMember = members.find(m => m.id === child.memberId);
                                            let ageStr = '';
                                            if (childMember?.birthDate) {
                                                const birth = new Date(childMember.birthDate);
                                                const today = new Date();
                                                let age = today.getFullYear() - birth.getFullYear();
                                                const m = today.getMonth() - birth.getMonth();
                                                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                                                    age--;
                                                }
                                                ageStr = ` (${age} anos)`;
                                            }
                                            return (
                                                <li key={idx}>
                                                    {child.name}{ageStr}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vida Eclesiástica Detalhada */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BookOpen className="text-orange-500" size={24} />
                            Histórico Eclesiástico
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Data de Admissão</label>
                                <p className="text-slate-800 font-medium">
                                    {member.joinDate ? new Date(member.joinDate).toLocaleDateString('pt-BR') : 'Não informado'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Batizado nas Águas</label>
                                <p className="text-slate-800 font-medium">
                                    {member.isBaptized ? 'Sim' : 'Não'}
                                </p>
                            </div>
                            {member.isBaptized && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Data do Batismo</label>
                                        <p className="text-slate-800 font-medium">
                                            {member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : 'Não informado'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Igreja/Local do Batismo</label>
                                        <p className="text-slate-800 font-medium">{member.baptismChurch || 'Não informado'}</p>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Data da Conversão</label>
                                <p className="text-slate-800 font-medium">
                                    {member.conversionDate ? new Date(member.conversionDate).toLocaleDateString('pt-BR') : 'Não informado'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Igreja da Conversão</label>
                                <p className="text-slate-800 font-medium">{member.conversionChurch || 'Não informado'}</p>
                            </div>
                        </div>

                        {/* Títulos e Funções Eclesiásticas */}
                        {((member.ecclesiasticalTitles || []).length > 0 || (member.ecclesiasticalFunctions || []).length > 0) && (
                            <div className="border-t border-gray-100 mt-6 pt-6 space-y-4">
                                {(member.ecclesiasticalTitles || []).length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Títulos Eclesiásticos</label>
                                        <div className="flex flex-wrap gap-2">
                                            {member.ecclesiasticalTitles.map((t: string) => (
                                                <span key={t} className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-xs font-semibold">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(member.ecclesiasticalFunctions || []).length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Funções / Ministérios</label>
                                        <div className="flex flex-wrap gap-2">
                                            {member.ecclesiasticalFunctions.map((f: string) => (
                                                <span key={f} className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-semibold">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Histórico de Transições */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Activity className="text-orange-500" size={24} />
                            Transições e Movimentações
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                            <div>
                                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Histórico de Entrada</h5>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-slate-500">Tipo de Entrada:</span> <span className="font-semibold text-slate-800">{member.entryReason || 'Conversão'}</span></p>
                                    <p><span className="text-slate-500">Data de Entrada:</span> <span className="font-semibold text-slate-800">{member.entryDate ? new Date(member.entryDate).toLocaleDateString('pt-BR') : (member.joinDate ? new Date(member.joinDate).toLocaleDateString('pt-BR') : 'Não informado')}</span></p>
                                    {member.entryOriginChurch && <p><span className="text-slate-500">Igreja de Origem:</span> <span className="font-semibold text-slate-800">{member.entryOriginChurch}</span></p>}
                                </div>
                            </div>
                            <div>
                                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Histórico de Saída</h5>
                                {member.exitReason ? (
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-slate-500">Motivo da Saída:</span> <span className="font-semibold text-red-600">{member.exitReason}</span></p>
                                        <p><span className="text-slate-500">Data de Saída:</span> <span className="font-semibold text-slate-800">{member.exitDate ? new Date(member.exitDate).toLocaleDateString('pt-BR') : 'Não informado'}</span></p>
                                        {member.exitDestinationChurch && <p><span className="text-slate-500">Igreja de Destino:</span> <span className="font-semibold text-slate-800">{member.exitDestinationChurch}</span></p>}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Nenhum desligamento ou saída registrado.</p>
                                )}
                            </div>
                        </div>

                        {/* Transition timeline */}
                        <div className="mt-6 space-y-4">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">Linha do Tempo de Transições</h5>
                            {(member.transitionHistory || []).length > 0 ? (
                                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 text-xs">
                                    {member.transitionHistory.map((t: any, idx: number) => (
                                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-all">
                                            <div>
                                                <span className="font-semibold text-slate-700 capitalize">{t.type}</span>
                                                <span className="text-slate-400 mx-2">•</span>
                                                <span className="text-slate-500">{t.reason}</span>
                                                {t.church && <span className="text-slate-400 block mt-0.5">{t.church}</span>}
                                            </div>
                                            <span className="text-slate-400 font-medium">{t.date}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-xs text-slate-400 italic">Nenhum histórico registrado na linha do tempo.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ministry Involvement */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Heart className="text-orange-500" size={24} />
                            Envolvimento Ministerial
                        </h3>
                        <div className="space-y-4">
                            {/* Grupos */}
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="text-orange-600" size={20} />
                                    <h4 className="font-semibold text-slate-800">Grupos / Células</h4>
                                </div>
                                {memberGroups.length > 0 ? (
                                    <ul className="list-disc list-inside text-slate-600">
                                        {memberGroups.map((group, i) => (
                                            <li key={i}>{group}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-500 italic">Nenhum grupo vinculado</p>
                                )}
                            </div>

                            {/* Departamentos */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <BookOpen className="text-blue-600" size={20} />
                                    <h4 className="font-semibold text-slate-800">Departamentos</h4>
                                </div>
                                {memberDepartments.length > 0 ? (
                                    <ul className="list-disc list-inside text-slate-600">
                                        {memberDepartments.map((dept, i) => (
                                            <li key={i}>{dept}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-500 italic">Nenhum departamento vinculado</p>
                                )}
                            </div>

                            {/* Turmas */}
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <BookOpen className="text-green-600" size={20} />
                                    <h4 className="font-semibold text-slate-800">Turmas de Ensino</h4>
                                </div>
                                {memberClasses.length > 0 ? (
                                    <ul className="list-disc list-inside text-slate-600">
                                        {memberClasses.map((cls, i) => (
                                            <li key={i}>{cls}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-500 italic">Nenhuma turma vinculada</p>
                                )}
                            </div>

                            {/* Função Geral */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <User className="text-gray-600" size={20} />
                                    <h4 className="font-semibold text-slate-800">Função Eclesiástica</h4>
                                </div>
                                <p className="text-slate-600">{member.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Vínculos Familiares */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-orange-500" size={24} />
                                Vínculos Familiares
                            </h3>
                        </div>
                        
                        {familyRelationships.length > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {familyRelationships.map((rel) => (
                                    <div key={rel.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                                        <div 
                                            className="flex items-center gap-3 cursor-pointer"
                                            onClick={() => navigate(`/members/${rel.relative.id}`)}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                                {rel.relative.avatar_url ? (
                                                    <img src={rel.relative.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                        <User size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm hover:text-orange-500 transition-colors">
                                                    {rel.relative.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {rel.type} {rel.relative.member_code ? `• ${rel.relative.member_code}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteFamilyRelationship(rel)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remover Vínculo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                                <Users className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="text-slate-500 text-sm">Nenhum vínculo familiar cadastrado</p>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Observações</h3>
                        <p className="text-slate-600 leading-relaxed">{member.notes}</p>
                    </div>

                    {/* Histórico de Consagrações */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Award className="text-orange-500" size={24} />
                            Histórico de Consagrações
                        </h3>
                        
                        {ordinationsHistory.length > 0 ? (
                            <div className="space-y-4">
                                {ordinationsHistory.map((ord, index) => (
                                    <div key={ord.id || index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                                            <Award className="text-orange-600" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-800">{ord.category}</h4>
                                                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-gray-100">
                                                    {new Date(ord.date).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">
                                                <span className="font-medium">Celebrante:</span> {ord.celebrant || 'Não informado'}
                                            </p>
                                            {ord.notes && (
                                                <p className="text-sm text-slate-500 mt-2 italic border-l-2 border-slate-200 pl-3">
                                                    "{ord.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                                <Award className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="text-slate-500 text-sm">Nenhuma consagração registrada no histórico</p>
                            </div>
                        )}
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Atividades Recentes</h3>
                        <div className="space-y-4">
                            {[
                                { date: '2024-11-24', event: 'Participou do culto dominical', type: 'attendance' },
                                { date: '2024-11-20', event: 'Reunião de célula', type: 'group' },
                                { date: '2024-11-17', event: 'Culto de oração', type: 'attendance' },
                                { date: '2024-11-10', event: 'Evento especial - Conferência', type: 'event' }
                            ].map((activity, index) => (
                                <div key={index} className="flex gap-4 items-start">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <p className="text-slate-800 font-medium">{activity.event}</p>
                                        <p className="text-sm text-slate-500">
                                            {new Date(activity.date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <MemberModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveMember}
                member={member}
            />



            <GenericDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName={itemToDelete?.name}
                itemType={itemToDelete?.type === 'member' ? 'membro' : 'vínculo familiar'}
            />

            {/* Communication Modal */}
            <CommunicationModal
                isOpen={isCommModalOpen}
                onClose={() => setIsCommModalOpen(false)}
                recipients={member ? [{ id: member.id, name: member.name, phone: member.phone || '' }] : []}
                contextType="discipleship"
                contextId={member?.id || ''}
                defaultMessage={`Paz do Senhor, amado(a) ${member.name}! Passando para desejar um dia abençoado e lembrar que você é muito importante para nós. 🙏✨`}
            />
        </div>
    );
};

export default MemberDetail;
