import React, { useState, useEffect } from 'react';
import { X, Save, Tag } from 'lucide-react';
import { FinancialCategory } from '../../hooks/useFinance';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: any) => Promise<boolean>;
    category?: FinancialCategory;
}

const COLORS = [
    { name: 'Verde', value: '#16a34a' },
    { name: 'Vermelho', value: '#dc2626' },
    { name: 'Azul', value: '#2563eb' },
    { name: 'Amarelo', value: '#ca8a04' },
    { name: 'Roxo', value: '#9333ea' },
    { name: 'Rosa', value: '#db2777' },
    { name: 'Cinza', value: '#4b5563' },
    { name: 'Laranja', value: '#ea580c' },
];

const CategoryModal: React.FC<CategoryModalProps> = ({
    isOpen,
    onClose,
    onSave,
    category
}) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'income' as 'income' | 'expense',
        color: '#4b5563'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                type: category.type,
                color: category.color || '#4b5563'
            });
        } else {
            setFormData({
                name: '',
                type: 'income',
                color: '#4b5563'
            });
        }
    }, [category, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!formData.name) {
                throw new Error('O nome da categoria é obrigatório.');
            }

            const success = await onSave(formData);

            if (success) {
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {category ? 'Editar Categoria' : 'Nova Categoria'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome da Categoria</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                                placeholder="Ex: Transporte, Alimentação..."
                            />
                        </div>
                    </div>

                    {/* Tipo */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="income"
                                    checked={formData.type === 'income'}
                                    onChange={() => setFormData({ ...formData, type: 'income' })}
                                    className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                                />
                                Receita
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="expense"
                                    checked={formData.type === 'expense'}
                                    onChange={() => setFormData({ ...formData, type: 'expense' })}
                                    className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                                />
                                Despesa
                            </label>
                        </div>
                    </div>

                    {/* Cor */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Cor da Etiqueta</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: color.value })}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color.value
                                            ? 'border-gray-900 scale-110'
                                            : 'border-transparent hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar Categoria'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;
