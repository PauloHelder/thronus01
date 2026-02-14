import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, Flag, BarChart3, AlignLeft } from 'lucide-react';
import { DepartmentGoal } from '../../hooks/useDepartmentGoals';

interface DepartmentGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<boolean>;
    goal?: DepartmentGoal;
}

const DepartmentGoalModal: React.FC<DepartmentGoalModalProps> = ({
    isOpen,
    onClose,
    onSave,
    goal
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target_value: '',
        current_value: '0',
        deadline: '',
        status: 'in_progress' as const,
        priority: 'medium' as const
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (goal) {
                setFormData({
                    title: goal.title,
                    description: goal.description || '',
                    target_value: goal.target_value?.toString() || '',
                    current_value: goal.current_value.toString(),
                    deadline: goal.deadline || '',
                    status: goal.status,
                    priority: goal.priority
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    target_value: '',
                    current_value: '0',
                    deadline: '',
                    status: 'in_progress',
                    priority: 'medium'
                });
            }
        }
    }, [isOpen, goal]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const success = await onSave({
                ...formData,
                target_value: formData.target_value ? parseFloat(formData.target_value) : null,
                current_value: parseFloat(formData.current_value)
            });
            if (success) onClose();
        } catch (error) {
            console.error('Error saving goal:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <Target size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {goal ? 'Editar Objetivo' : 'Novo Objetivo'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Título do Objetivo</label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-800"
                            placeholder="Ex: Reforma da sala das crianças"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descrição</label>
                        <div className="relative">
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-800 h-24 resize-none"
                                placeholder="Descreva os detalhes deste objetivo..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Valor Alvo (Opcional)</label>
                            <input
                                type="number"
                                value={formData.target_value}
                                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-800"
                                placeholder="Ex: 50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Valor Atual</label>
                            <input
                                required
                                type="number"
                                value={formData.current_value}
                                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-800"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prazo</label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prioridade</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-800"
                            >
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-800"
                        >
                            <option value="pending">Pendente</option>
                            <option value="in_progress">Em Progresso</option>
                            <option value="completed">Concluído</option>
                            <option value="delayed">Atrasado</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 text-slate-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Salvando...' : (goal ? 'Salvar Alterações' : 'Criar Objetivo')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentGoalModal;
