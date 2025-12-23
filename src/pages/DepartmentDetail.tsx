import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, UserPlus, Plus, Trash2, Pencil } from 'lucide-react';
import { Department, DepartmentSchedule } from '../types';
import { useDepartments } from '../hooks/useDepartments';
import { useMembers } from '../hooks/useMembers';
import { useServices } from '../hooks/useServices';
import { useEvents } from '../hooks/useEvents';
import { getIconEmoji } from '../data/departmentIcons';
import AddDepartmentMemberModal from '../components/modals/AddDepartmentMemberModal';
import CreateScheduleModal from '../components/modals/CreateScheduleModal';

import { useAuth } from '../contexts/AuthContext';

const DepartmentDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const {
        selectedDepartment: department,
        loading,
        fetchDepartmentDetails,
        addDepartmentMembers,
        removeDepartmentMember,
        addSchedule,
        updateSchedule,
        deleteSchedule
    } = useDepartments();
    const { members: allMembers } = useMembers();
    const { services } = useServices();
    const { events } = useEvents();

    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<DepartmentSchedule | null>(null);

    useEffect(() => {
        if (id) {
            fetchDepartmentDetails(id);
        }
    }, [id, fetchDepartmentDetails]);

    const handleAddMembers = async (memberIds: string[]) => {
        if (id) {
            await addDepartmentMembers(id, memberIds);
            setIsAddMemberModalOpen(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (id && window.confirm('Tem certeza que deseja remover este membro do departamento?')) {
            await removeDepartmentMember(id, memberId);
        }
    };

    const handleSaveSchedule = async (scheduleData: Omit<DepartmentSchedule, 'id' | 'departmentId'>) => {
        if (!id) return;

        if (editingSchedule) {
            // Edit
            await updateSchedule({
                ...scheduleData,
                id: editingSchedule.id,
                departmentId: id
            });
        } else {
            // Create
            await addSchedule({
                ...scheduleData,
                departmentId: id
            });
        }
        setEditingSchedule(null);
        setIsScheduleModalOpen(false);
    };

    const handleEditSchedule = (schedule: DepartmentSchedule) => {
        setEditingSchedule(schedule);
        setIsScheduleModalOpen(true);
    };

    const handleDeleteSchedule = async (scheduleId: string) => {
        if (id && window.confirm('Tem certeza que deseja excluir esta escala?')) {
            await deleteSchedule(id, scheduleId);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    if (loading || !department) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    // Membros disponíveis (que não estão no departamento e não são líder/co-líder)
    const availableMembers = allMembers.filter(
        member =>
            member.id !== department.leaderId &&
            member.id !== department.coLeaderId &&
            !department.members.some(m => m.id === member.id)
    );

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
                <button
                    onClick={() => navigate('/departments')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Voltar para Departamentos</span>
                </button>

                <div className="flex items-start gap-4">
                    <div className="text-5xl">{getIconEmoji(department.icon)}</div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-slate-800">{department.name}</h1>
                            {department.isDefault && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    Departamento Padrão
                                </span>
                            )}
                        </div>
                        {department.description && (
                            <p className="text-slate-600">{department.description}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <p className="text-blue-600 text-sm font-medium mb-1">Total de Membros</p>
                        <p className="text-3xl font-bold text-blue-700">{department.members.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <p className="text-purple-600 text-sm font-medium mb-1">Escalas Ativas</p>
                        <p className="text-3xl font-bold text-purple-700">{department.schedules?.length || 0}</p>
                    </div>
                </div>

                {/* Leaders */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Liderança</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {department.leader && (
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <p className="text-xs font-semibold text-orange-600 uppercase mb-2">Líder</p>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={department.leader.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(department.leader.name)}&background=random`}
                                        alt=""
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-800">{department.leader.name}</p>
                                        <p className="text-sm text-slate-600">{department.leader.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {department.coLeader && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Co-líder</p>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={department.coLeader.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(department.coLeader.name)}&background=random`}
                                        alt=""
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-800">{department.coLeader.name}</p>
                                        <p className="text-sm text-slate-600">{department.coLeader.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Members List */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Membros do Departamento</h2>
                        {hasPermission('departments_edit') && (
                            <button
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                            >
                                <UserPlus size={16} /> Adicionar Membros
                            </button>
                        )}
                    </div>

                    {department.members.length > 0 ? (
                        <div className="space-y-2">
                            {department.members.map(member => (
                                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <img
                                        src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                        alt=""
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{member.name}</p>
                                        <p className="text-sm text-slate-600">{member.email}</p>
                                    </div>
                                    {hasPermission('departments_edit') && (
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Users size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>Nenhum membro cadastrado ainda</p>
                        </div>
                    )}
                </div>

                {/* Schedules */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Escalas</h2>
                        {hasPermission('departments_edit') && (
                            <button
                                onClick={() => {
                                    setEditingSchedule(null);
                                    setIsScheduleModalOpen(true);
                                }}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                            >
                                <Plus size={16} /> Nova Escala
                            </button>
                        )}
                    </div>

                    {department.schedules && department.schedules.length > 0 ? (
                        <div className="space-y-3">
                            {department.schedules
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((schedule) => (
                                    <div key={schedule.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-slate-600" />
                                                <span className="font-medium text-slate-800">{formatDate(schedule.date)}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${schedule.type === 'Service'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {schedule.type === 'Service' ? 'Culto' : 'Evento'}
                                                </span>
                                            </div>
                                            {hasPermission('departments_edit') && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditSchedule(schedule)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSchedule(schedule.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {schedule.notes && (
                                            <p className="text-sm text-slate-600 mb-2">{schedule.notes}</p>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Users size={14} />
                                            <span>{schedule.assignedMembers.length} membros escalados</span>
                                        </div>
                                        {schedule.assignedMembers.length > 0 && (
                                            <div className="flex -space-x-2 mt-2">
                                                {schedule.assignedMembers.slice(0, 5).map((memberId) => {
                                                    const member = [...department.members, department.leader, department.coLeader]
                                                        .filter(Boolean)
                                                        .find(m => m?.id === memberId);
                                                    return member ? (
                                                        <img
                                                            key={memberId}
                                                            src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                                            alt={member.name}
                                                            title={member.name}
                                                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                                        />
                                                    ) : null;
                                                })}
                                                {schedule.assignedMembers.length > 5 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                                                        +{schedule.assignedMembers.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Calendar size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>Nenhuma escala criada ainda</p>
                        </div>
                    )}
                </div>
            </div>

            <AddDepartmentMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                onSave={handleAddMembers}
                availableMembers={availableMembers}
            />

            <CreateScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSave={handleSaveSchedule}
                departmentMembers={department.members}
                leader={department.leader}
                schedule={editingSchedule}
                services={services}
                events={events}
            />
        </div>
    );
};

export default DepartmentDetail;
