import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { supabase } from '../../lib/supabase';
import { Department } from '../../types';
import { DEPARTMENT_ICONS } from '../../data/departmentIcons';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface DepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (department: Omit<Department, 'id'> | Department) => void;
    department?: Department | null;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
    isOpen,
    onClose,
    onSave,
    department
}) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Users');
    const [description, setDescription] = useState('');
    const [leaderId, setLeaderId] = useState('');
    const [coLeaderId, setCoLeaderId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [membersList, setMembersList] = useState<{ id: string; name: string; avatar_url?: string; phone?: string }[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        if (department) {
            setName(department.name);
            setIcon(department.icon);
            setDescription(department.description || '');
            setLeaderId(department.leaderId || '');
            setCoLeaderId(department.coLeaderId || '');
        } else {
            setName('');
            setIcon('Users');
            setDescription('');
            setLeaderId('');
            setCoLeaderId('');
        }
    }, [department, isOpen]);

    useEffect(() => {
        if (isOpen) {
            const fetchMembers = async () => {
                setLoadingMembers(true);
                try {
                    const { data, error } = await supabase
                        .from('members' as any)
                        .select('id, name, avatar_url, phone')
                        .is('deleted_at', null)
                        .order('name');
                    if (error) throw error;
                    setMembersList(data || []);
                } catch (err) {
                    console.error('Error fetching members in DepartmentModal:', err);
                } finally {
                    setLoadingMembers(false);
                }
            };
            fetchMembers();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.warning('Por favor, insira um nome para o departamento.');
            return;
        }

        if (!leaderId) {
            toast.warning('Por favor, selecione um líder.');
            return;
        }

        setIsSubmitting(true);
        try {
            const leader = membersList.find(m => m.id === leaderId);
            const coLeader = coLeaderId ? membersList.find(m => m.id === coLeaderId) : undefined;

            const departmentData: any = {
                name,
                icon,
                description,
                leaderId,
                coLeaderId: coLeaderId || undefined,
                leader: leader ? { ...leader, avatar: leader.avatar_url } : undefined,
                coLeader: coLeader ? { ...coLeader, avatar: coLeader.avatar_url } : undefined,
                members: department?.members || [],
                schedules: department?.schedules || []
            };

            if (department?.id) {
                departmentData.id = department.id;
            }

            await onSave(departmentData);
            onClose();
        } catch (err) {
            console.error("Error saving department:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={department ? 'Editar Departamento' : 'Novo Departamento'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nome do Departamento
                    </label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        placeholder="Ex: Louvor, Secretaria, Mídia..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Ícone do Departamento
                    </label>
                    <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-36 overflow-y-auto">
                        {Object.entries(DEPARTMENT_ICONS).map(([key, emoji]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setIcon(key)}
                                className={`p-2 text-2xl rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center ${icon === key ? 'bg-orange-100 ring-2 ring-orange-500' : ''
                                    }`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Líder do Departamento
                        </label>
                        <select
                            required
                            value={leaderId}
                            disabled={loadingMembers}
                            onChange={(e) => setLeaderId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-60"
                        >
                            <option value="">{loadingMembers ? 'Carregando membros...' : 'Selecione um líder...'}</option>
                            {membersList.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Co-líder (Opcional)
                        </label>
                        <select
                            value={coLeaderId}
                            disabled={loadingMembers}
                            onChange={(e) => setCoLeaderId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-60"
                        >
                            <option value="">{loadingMembers ? 'Carregando membros...' : 'Selecione um co-líder...'}</option>
                            {membersList
                                .filter(m => m.id !== leaderId)
                                .map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Descrição (Opcional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Descreva as responsabilidades e atividades do departamento..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {isSubmitting ? 'Salvando...' : (department ? 'Salvar Alterações' : 'Criar Departamento')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DepartmentModal;
