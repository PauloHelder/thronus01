import React, { useState } from 'react';
import { X, Tag, Info } from 'lucide-react';

interface AssetCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description?: string, usefulLife?: number) => Promise<boolean>;
}

const AssetCategoryModal: React.FC<AssetCategoryModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [usefulLife, setUsefulLife] = useState(5);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        const success = await onSave(name, description, usefulLife);
        setLoading(false);

        if (success) {
            setName('');
            setDescription('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Tag size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Nova Categoria</h2>
                            <p className="text-blue-100 text-xs tracking-wide">Organize seu patrimônio</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 text-center">Nome da Categoria</label>
                        <input
                            autoFocus
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-center text-lg"
                            placeholder="Ex: Eletrônicos, Mobiliário..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Descrição (Opcional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium h-24 resize-none"
                            placeholder="Descreva o que esta categoria abrange..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Vida Útil Padrão (Anos)</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={usefulLife}
                            onChange={(e) => setUsefulLife(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 italic">Usado para cálculo automático de depreciação.</p>
                    </div>

                    <div className="pt-2">
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Adicionando...' : 'Adicionar Categoria'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full mt-3 py-2 text-slate-400 font-bold hover:text-slate-600 transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssetCategoryModal;
