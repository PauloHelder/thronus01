import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, UserPlus, Plus, Trash2, Pencil } from 'lucide-react';
import { Department, DepartmentSchedule, Member } from '../types';
import { MOCK_MEMBERS } from '../mocks/members';
import { getIconEmoji } from '../data/departmentIcons';
import AddDepartmentMemberModal from '../components/modals/AddDepartmentMemberModal';
import CreateScheduleModal from '../components/modals/CreateScheduleModal';

// Mock department
const MOCK_DEPARTMENT: Department = {
    id: '1',
    name: 'Louvor',
    icon: 'Music',
    description: 'Ministério de música e louvor nos cultos e eventos.',
    leaderId: '1',
    coLeaderId: '2',
    leader: MOCK_MEMBERS[0],
    coLeader: MOCK_MEMBERS[1],
    members: [MOCK_MEMBERS[2], MOCK_MEMBERS[3]],
    schedules: [
        {
            id: '1',
            departmentId: '1',
            type: 'Service',
            serviceId: '1',
            date: '2024-02-04',
            assignedMembers: ['1', '2', '3'],
            notes: 'Culto de Domingo - Manhã'
        },
        {
            id: '2',
            departmentId: '1',
            type: 'Event',
            eventId: '1',
            date: '2024-02-10',
            assignedMembers: ['1', '3'],
            notes: 'Retiro de Jovens'
        }
    ],
    isDefault: true
};

const DepartmentDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [department, setDepartment] = useState<Department>(MOCK_DEPARTMENT);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const handleAddMembers = (memberIds: string[]) => {
        const newMembers = MOCK_MEMBERS.filter(m => memberIds.includes(m.id));
        setDepartment({
            ...department,
            members: [...department.members, ...newMembers]
        });
    };

    const handleRemoveMember = (memberId: string) => {
        if (window.confirm('Tem certeza que deseja remover este membro do departamento?')) {
            setDepartment({
                ...department,
                members: department.members.filter(m => m.id !== memberId)
            });
        }
    };

    const handleCreateSchedule = (scheduleData: Omit<DepartmentSchedule, 'id' | 'departmentId'>) => {
        const newSchedule: DepartmentSchedule = {
            ...scheduleData,
            id: crypto.randomUUID(),
            departmentId: department.id
        };

        setDepartment({
            ...department,
            schedules: [newSchedule, ...(department.schedules || [])]
        });
    };

    const handleDeleteSchedule = (scheduleId: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta escala?')) {
            setDepartment({
                ...department,
                schedules: department.schedules?.filter(s => s.id !== scheduleId)
            });
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    // Membros disponíveis (que não estão no departamento e não são líder/co-líder)
    const availableMembers = MOCK_MEMBERS.filter(
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
                                    <img src={department.leader.avatar} alt="" className="w-12 h-12 rounded-full" />
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
                                    <img src={department.coLeader.avatar} alt="" className="w-12 h-12 rounded-full" />
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
                        <button
                            onClick={() => setIsAddMemberModalOpen(true)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <UserPlus size={16} /> Adicionar Membros
                        </button>
                    </div>

                    {department.members.length > 0 ? (
                        <div className="space-y-2">
                            {department.members.map(member => (
                                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <img src={member.avatar} alt="" className="w-12 h-12 rounded-full" />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{member.name}</p>
                                        <p className="text-sm text-slate-600">{member.email}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveMember(member.id)}
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
                            <p>Nenhum membro cadastrado ainda</p>
                        </div>
                    )}
                </div>

                {/* Schedules */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Escalas</h2>
                        <button
                            onClick={() => setIsScheduleModalOpen(true)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} /> Nova Escala
                        </button>
                    </div>

                    {department.schedules && department.schedules.length > 0 ? (
                        <div className="space-y-3">
                            {department.schedules
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map(schedule => (
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
                                            <button
                                                onClick={() => handleDeleteSchedule(schedule.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={14} />
                                            </button>
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
                                                {schedule.assignedMembers.slice(0, 5).map(memberId => {
                                                    const member = [...department.members, department.leader, department.coLeader]
                                                        .filter(Boolean)
                                                        .find(m => m?.id === memberId);
                                                    return member ? (
                                                        <img
                                                            key={memberId}
                                                            src={member.avatar}
                                                            alt={member.name}
                                                            title={member.name}
                                                            className="w-8 h-8 rounded-full border-2 border-white"
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
                onSave={handleCreateSchedule}
                departmentMembers={department.members}
                leader={department.leader}
            />
        </div>
    );
};

export default DepartmentDetail;
