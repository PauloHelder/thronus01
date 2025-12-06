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
    Loader2
} from 'lucide-react';
import MemberModal from '../components/modals/MemberModal';
import { Member } from '../types';
import { useMembers } from '../hooks/useMembers';

import { formatDateForInput } from '../utils/dateUtils';

// Estendendo a interface Member para incluir campos extras usados nesta página
// Em uma implementação real completa, esses dados viriam de tabelas relacionadas
interface ExtendedMember extends Member {
    role: string;
    joinDate: string;
    birthDate: string;
    address: string;
    group: string;
    attendance: number;
    lastAttendance: string;
    baptized: boolean;
    occupation: string;
    notes: string;
}

const MemberDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { members, loading: membersLoading, updateMember, deleteMember, refetch } = useMembers();

    const [member, setMember] = useState<ExtendedMember | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!membersLoading && id) {
            const foundMember = members.find(m => m.id === id);

            if (foundMember) {
                // Transformar o membro do Supabase no formato estendido esperado pela UI
                // Preenchendo dados faltantes com valores padrão ou mocks por enquanto
                setMember({
                    ...foundMember,
                    role: foundMember.churchRole || 'Membro',
                    joinDate: new Date().toISOString(), // Data de cadastro não está no tipo Member, usando atual
                    birthDate: formatDateForInput(foundMember.birthDate) || new Date().toISOString().split('T')[0],
                    address: foundMember.address || 'Endereço não informado',
                    group: 'Sem grupo', // Viria de relacionamento com grupos
                    attendance: 0, // Viria de estatísticas
                    lastAttendance: new Date().toISOString(), // Viria de estatísticas
                    baptized: foundMember.isBaptized || false,
                    occupation: 'Não informada',
                    notes: 'Sem observações'
                });
            }
            setLoading(false);
        }
    }, [members, membersLoading, id]);

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
            alert('Erro ao atualizar membro. Tente novamente.');
        }
    };

    const handleDelete = async () => {
        if (!member) return;

        try {
            await deleteMember(member.id);
            setShowDeleteModal(false);
            navigate('/members');
        } catch (error) {
            console.error('Erro ao excluir membro:', error);
            alert('Erro ao excluir membro. Tente novamente.');
        }
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
            value: new Date(member.lastAttendance).toLocaleDateString('pt-BR'),
            color: 'bg-blue-500'
        },
        {
            icon: Users,
            label: 'Grupo',
            value: member.group,
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
                        onClick={() => setShowDeleteModal(true)}
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
                                <div>
                                    <p className="text-sm text-slate-600">Telefone</p>
                                    <p className="text-slate-800 font-medium">{member.phone || 'Não informado'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="text-orange-500 flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-slate-600">Endereço</p>
                                    <p className="text-slate-800 font-medium">{member.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Estatísticas Rápidas</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Membro desde</span>
                                <span className="font-bold text-slate-800">
                                    {new Date(member.joinDate).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Batizado</span>
                                <span className="font-bold text-slate-800">
                                    {member.baptized ? 'Sim' : 'Não'}
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
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                                        <stat.icon className="text-white" size={24} />
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
                                    {new Date(member.birthDate).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Idade
                                </label>
                                <p className="text-slate-800 font-medium">
                                    {new Date().getFullYear() - new Date(member.birthDate).getFullYear()} anos
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Estado Civil
                                </label>
                                <p className="text-slate-800 font-medium">{getMaritalStatusTranslation(member.maritalStatus)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Profissão
                                </label>
                                <p className="text-slate-800 font-medium">{member.occupation}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Data de Ingresso
                                </label>
                                <p className="text-slate-800 font-medium">
                                    {new Date(member.joinDate).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Batizado
                                </label>
                                <p className="text-slate-800 font-medium">
                                    {member.baptized ? 'Sim' : 'Não'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ministry Involvement */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Heart className="text-orange-500" size={24} />
                            Envolvimento Ministerial
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="text-orange-600" size={20} />
                                    <h4 className="font-semibold text-slate-800">Grupo Atual</h4>
                                </div>
                                <p className="text-slate-600">{member.group}</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <BookOpen className="text-blue-600" size={20} />
                                    <h4 className="font-semibold text-slate-800">Função</h4>
                                </div>
                                <p className="text-slate-600">{member.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Observações</h3>
                        <p className="text-slate-600 leading-relaxed">{member.notes}</p>
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Confirmar Exclusão</h3>
                        <p className="text-slate-600 mb-6">
                            Tem certeza que deseja excluir o membro <strong>{member.name}</strong>?
                            Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberDetail;
