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
import FinanceRequestModal from '../components/modals/FinanceRequestModal';
import { useFinance } from '../hooks/useFinance';
import { ClipboardList, AlertCircle, CheckCircle2, Clock, XCircle, DollarSign, Target, Info, LayoutDashboard, Flag, Filter, Search, BarChart3 } from 'lucide-react';
import { useDepartmentGoals, DepartmentGoal } from '../hooks/useDepartmentGoals';
import DepartmentGoalModal from '../components/modals/DepartmentGoalModal';

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
    const {
        requests,
        categories,
        fetchRequests,
        addRequest,
        loading: financeLoading
    } = useFinance();

    const {
        goals,
        loading: goalsLoading,
        fetchGoals,
        addGoal,
        updateGoal,
        deleteGoal
    } = useDepartmentGoals(id);

    const [activeTab, setActiveTab] = useState<'geral' | 'membros' | 'objectivos' | 'escala' | 'requisicoes'>('geral');
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<DepartmentGoal | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<DepartmentSchedule | null>(null);

    // Filters for Goals
    const [goalStatusFilter, setGoalStatusFilter] = useState<'All' | 'pending' | 'in_progress' | 'completed' | 'delayed'>('All');
    const [goalPriorityFilter, setGoalPriorityFilter] = useState<'All' | 'low' | 'medium' | 'high'>('All');
    const [goalSearch, setGoalSearch] = useState('');

    useEffect(() => {
        if (id) {
            fetchDepartmentDetails(id);
            fetchRequests(id);
            fetchGoals();
        }
    }, [id, fetchDepartmentDetails, fetchRequests, fetchGoals]);

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

    const handleSaveRequest = async (requestData: any) => {
        return await addRequest(requestData);
    };

    const handleSaveGoal = async (goalData: any) => {
        if (selectedGoal) {
            await updateGoal(selectedGoal.id, goalData);
        } else {
            await addGoal({ ...goalData, department_id: id! });
        }
        setIsGoalModalOpen(false);
        setSelectedGoal(null);
        return true;
    };

    const handleDeleteGoal = async (goalId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este objetivo?')) {
            await deleteGoal(goalId);
        }
    };

    const filteredGoals = goals.filter(g => {
        const matchesStatus = goalStatusFilter === 'All' || g.status === goalStatusFilter;
        const matchesPriority = goalPriorityFilter === 'All' || g.priority === goalPriorityFilter;
        const matchesSearch = g.title.toLowerCase().includes(goalSearch.toLowerCase()) ||
            (g.description?.toLowerCase().includes(goalSearch.toLowerCase()) || false);
        return matchesStatus && matchesPriority && matchesSearch;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="text-green-500 w-4 h-4" />;
            case 'rejected': return <XCircle className="text-red-500 w-4 h-4" />;
            case 'paid': return <DollarSign className="text-blue-500 w-4 h-4" />;
            default: return <Clock className="text-orange-500 w-4 h-4" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Aprovada';
            case 'rejected': return 'Rejeitada';
            case 'paid': return 'Paga';
            default: return 'Pendente';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            case 'paid': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-orange-50 text-orange-700 border-orange-200';
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
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

            {/* Content Tabs Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 lg:px-6">
                <div className="flex overflow-x-auto no-scrollbar gap-8">
                    {[
                        { id: 'geral', label: 'Geral', icon: <LayoutDashboard size={18} /> },
                        { id: 'membros', label: 'Membros', icon: <Users size={18} /> },
                        { id: 'objectivos', label: 'Objectivos', icon: <Target size={18} /> },
                        { id: 'escala', label: 'Escala', icon: <Calendar size={18} /> },
                        { id: 'requisicoes', label: 'Requisições', icon: <ClipboardList size={18} /> },
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
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                                <p className="text-blue-600 text-sm font-medium mb-1">Total de Membros</p>
                                <p className="text-3xl font-bold text-blue-700">{department.members.length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                                <p className="text-purple-600 text-sm font-medium mb-1">Escalas Ativas</p>
                                <p className="text-3xl font-bold text-purple-700">{department.schedules?.length || 0}</p>
                            </div>
                        </div>

                        {/* Leaders */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Info size={18} className="text-orange-500" />
                                Liderança do Departamento
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {department.leader ? (
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                                        <p className="text-xs font-semibold text-orange-600 uppercase mb-2">Líder</p>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={department.leader.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(department.leader.name)}&background=random`}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover shadow-sm"
                                            />
                                            <div>
                                                <p className="font-bold text-slate-800">{department.leader.name}</p>
                                                <p className="text-sm text-slate-600">{department.leader.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 italic">
                                        Sem líder definido
                                    </div>
                                )}
                                {department.coLeader ? (
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Co-líder</p>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={department.coLeader.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(department.coLeader.name)}&background=random`}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover shadow-sm"
                                            />
                                            <div>
                                                <p className="font-bold text-slate-800">{department.coLeader.name}</p>
                                                <p className="text-sm text-slate-600">{department.coLeader.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 italic">
                                        Sem co-líder definido
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'membros' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Equipe do Departamento</h2>
                                <p className="text-sm text-slate-500">Gerencie os membros que fazem parte deste ministério</p>
                            </div>
                            {hasPermission('departments_edit') && (
                                <button
                                    onClick={() => setIsAddMemberModalOpen(true)}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                                >
                                    <UserPlus size={16} /> Adicionar
                                </button>
                            )}
                        </div>

                        {department.members.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {department.members.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                                        <img
                                            src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover shadow-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{member.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{member.email || 'Sem email'}</p>
                                        </div>
                                        {hasPermission('departments_edit') && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Remover"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <Users size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Nenhum membro faz parte deste departamento ainda.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'objectivos' && (
                    <div className="space-y-6">
                        {/* Header & Filters */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <Target size={24} className="text-orange-500" />
                                        Objetivos Estratégicos
                                    </h2>
                                    <p className="text-sm text-slate-500">Acompanhe o progresso das metas do departamento</p>
                                </div>
                                <button
                                    onClick={() => { setSelectedGoal(null); setIsGoalModalOpen(true); }}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                                >
                                    <Plus size={18} /> Novo Objetivo
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar objetivos..."
                                        value={goalSearch}
                                        onChange={(e) => setGoalSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                <select
                                    value={goalStatusFilter}
                                    onChange={(e) => setGoalStatusFilter(e.target.value as any)}
                                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                >
                                    <option value="All">Todos Status</option>
                                    <option value="pending">Pendente</option>
                                    <option value="in_progress">Em Progresso</option>
                                    <option value="completed">Concluído</option>
                                    <option value="delayed">Atrasado</option>
                                </select>
                                <select
                                    value={goalPriorityFilter}
                                    onChange={(e) => setGoalPriorityFilter(e.target.value as any)}
                                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                >
                                    <option value="All">Todas Prioridades</option>
                                    <option value="low">Prioridade Baixa</option>
                                    <option value="medium">Prioridade Média</option>
                                    <option value="high">Prioridade Alta</option>
                                </select>
                            </div>
                        </div>

                        {/* Goals Table */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Objetivo</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Progresso</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridade</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredGoals.length > 0 ? (
                                            filteredGoals.map((goal) => {
                                                const progress = goal.target_value ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;

                                                return (
                                                    <tr key={goal.id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 text-sm">{goal.title}</span>
                                                                <span className="text-xs text-slate-500 line-clamp-1 italic">{goal.description || 'Sem descrição'}</span>
                                                                {goal.deadline && (
                                                                    <span className="text-[10px] text-orange-500 font-bold mt-1 flex items-center gap-1 uppercase tracking-tighter">
                                                                        <Calendar size={10} /> Prazo: {new Date(goal.deadline + 'T00:00:00').toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {goal.target_value ? (
                                                                <div className="w-32">
                                                                    <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
                                                                        <span className="text-slate-400">{goal.current_value}/{goal.target_value}</span>
                                                                        <span className="text-orange-600">{progress}%</span>
                                                                    </div>
                                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : 'bg-orange-500'
                                                                                }`}
                                                                            style={{ width: `${progress}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] font-medium text-slate-400 italic">Qualitativo</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${goal.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                    goal.priority === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                        'bg-blue-50 text-blue-600 border-blue-100'
                                                                }`}>
                                                                <Flag size={10} />
                                                                {goal.priority === 'high' ? 'Alta' : goal.priority === 'medium' ? 'Média' : 'Baixa'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${goal.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    goal.status === 'delayed' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                        goal.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                            'bg-gray-50 text-gray-700 border-gray-200'
                                                                }`}>
                                                                {goal.status === 'completed' ? 'Concluído' :
                                                                    goal.status === 'delayed' ? 'Atrasado' :
                                                                        goal.status === 'in_progress' ? 'Em Progresso' : 'Pendente'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => { setSelectedGoal(goal); setIsGoalModalOpen(true); }}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteGoal(goal.id)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center">
                                                    <Target size={48} className="mx-auto mb-4 text-gray-200" />
                                                    <h3 className="text-sm font-bold text-slate-700">Nenhum objetivo encontrado</h3>
                                                    <p className="text-slate-400 text-[10px] mt-1 italic">Tente mudar os filtros ou adicione um novo objetivo.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'escala' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Escalas de Atividade</h2>
                                <p className="text-sm text-slate-500">Agendamentos e membros escalados para cultos e eventos</p>
                            </div>
                            {hasPermission('departments_edit') && (
                                <button
                                    onClick={() => {
                                        setEditingSchedule(null);
                                        setIsScheduleModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                                >
                                    <Plus size={16} /> Nova Escala
                                </button>
                            )}
                        </div>

                        {department.schedules && department.schedules.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {department.schedules
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((schedule) => (
                                        <div key={schedule.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg border border-gray-100 text-orange-500 shadow-sm">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-slate-800">{formatDate(schedule.date)}</span>
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${schedule.type === 'Service'
                                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                                                            }`}>
                                                            {schedule.type === 'Service' ? 'Culto' : 'Evento'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {hasPermission('departments_edit') && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditSchedule(schedule)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSchedule(schedule.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {schedule.notes && (
                                                <p className="text-sm text-slate-600 mb-4 bg-white p-3 rounded-lg border border-gray-100 italic">
                                                    {schedule.notes}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-gray-100">
                                                    <Users size={14} />
                                                    {schedule.assignedMembers.length} escalados
                                                </div>
                                                <div className="flex -space-x-2">
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
                                                                className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-gray-100"
                                                            />
                                                        ) : null;
                                                    })}
                                                    {schedule.assignedMembers.length > 5 && (
                                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                                            +{schedule.assignedMembers.length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Nenhuma atividade escalada para este departamento.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'requisicoes' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Fluxo Financeiro</h2>
                                <p className="text-xs text-slate-500">Solicitações de budget e aprovações</p>
                            </div>
                            <button
                                onClick={() => setIsRequestModalOpen(true)}
                                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-orange-200/50"
                            >
                                <Plus size={16} /> Nova Solicitação
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Solicitação</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {requests.length > 0 ? (
                                        requests.map((request) => (
                                            <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-sm uppercase tracking-tight">{request.title}</span>
                                                        <span className="text-[10px] text-slate-500 line-clamp-1 italic">{request.description || 'Sem descrição'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-black text-slate-900 text-sm">{formatCurrency(request.amount)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] text-slate-400 font-bold bg-gray-50 px-2 py-1 rounded">
                                                        {new Date(request.created_at).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusClass(request.status)}`}>
                                                        {getStatusIcon(request.status)}
                                                        {getStatusLabel(request.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center">
                                                <ClipboardList size={48} className="mx-auto mb-4 text-gray-200 opacity-20" />
                                                <h3 className="text-sm font-bold text-slate-700">Sem requisições</h3>
                                                <p className="text-slate-400 text-[10px] mt-1 italic">Nenhuma solicitação de budget para este departamento.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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

            {id && (
                <FinanceRequestModal
                    isOpen={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                    onSave={handleSaveRequest}
                    categories={categories}
                    departmentId={id}
                />
            )}

            <DepartmentGoalModal
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                onSave={handleSaveGoal}
                goal={selectedGoal || undefined}
            />
        </div>
    );
};

export default DepartmentDetail;
