import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Department, Member } from '../../types';
import { DEPARTMENT_ICONS } from '../../data/departmentIcons';
import { Save } from 'lucide-react';

interface DepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (department: Omit<Department, 'id'> | Department) => void;
    department?: Department | null;
    members: Member[];
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
    isOpen,
    onClose,
    onSave,
    department,
    members
}) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Users');
    const [description, setDescription] = useState('');
    const [leaderId, setLeaderId] = useState('');
    const [coLeaderId, setCoLeaderId] = useState('');

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            alert('Por favor, insira um nome para o departamento.');
            return;
        }

        if (!leaderId) {
            alert('Por favor, selecione um líder.');
            return;
        }

        const leader = members.find(m => m.id === leaderId);
        const coLeader = coLeaderId ? members.find(m => m.id === coLeaderId) : undefined;

        onSave({
            id: department?.id || crypto.randomUUID(),
            name,
            icon,
            description,
            leaderId,
            coLeaderId: coLeaderId || undefined,
            leader,
            coLeader,
            members: department?.members || [],
            schedules: department?.schedules || []
        });
        onClose();
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
                        Selecionar Ícone
                    </label>
                    <div className="grid grid-cols-5 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                        {DEPARTMENT_ICONS.map(iconOption => (
                            <button
                                key={iconOption.name}
                                type="button"
                                onClick={() => setIcon(iconOption.name)}
                                className={`p-3 rounded-lg text-2xl transition-all ${icon === iconOption.name
                                        ? 'bg-orange-500 ring-2 ring-orange-600 scale-110'
                                        : 'bg-white hover:bg-gray-100 border border-gray-200'
                                    }`}
                                title={iconOption.label}
                            >
                                {iconOption.emoji}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Ícone selecionado: {DEPARTMENT_ICONS.find(i => i.name === icon)?.label}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Líder <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={leaderId}
                            onChange={(e) => setLeaderId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Selecione um líder...</option>
                            {members.map(member => (
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
                            onChange={(e) => setCoLeaderId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Selecione um co-líder...</option>
                            {members
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
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} />
                        {department ? 'Salvar Alterações' : 'Criar Departamento'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DepartmentModal;
