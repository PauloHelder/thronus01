import React, { useState } from 'react';
import { X, Wrench, Calendar, DollarSign, User, Info, CheckCircle2 } from 'lucide-react';

interface MaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<boolean>;
    assetName: string;
    assetId: string;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ isOpen, onClose, onSave, assetName, assetId }) => {
    const [formData, setFormData] = useState({
        asset_id: assetId,
        maintenance_date: new Date().toISOString().split('T')[0],
        description: '',
        cost: 0,
        performed_by: '',
        next_maintenance: ''
    });

    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description.trim()) return;

        setLoading(true);
        const success = await onSave({ ...formData, asset_id: assetId });
        setLoading(false);

        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-700">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Wrench size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Registrar Manutenção</h2>
                            <p className="text-emerald-100 text-xs tracking-wide">{assetName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3 mb-2">
                        <Info className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                            Histórico de manutenções ajuda a calcular a vida útil do ativo e planejar substituições.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Data da Manutenção</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    required
                                    type="date"
                                    value={formData.maintenance_date}
                                    onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Custo (AOA)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Descrição do Serviço</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium h-24 resize-none"
                            placeholder="Descreva o que foi feito (Ex: Troca de lâmpada, limpeza de filtros...)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Técnico / Empresa Responsável</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={formData.performed_by}
                                onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                                placeholder="Nome do técnico ou assistência"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 text-slate-500">Próxima Manutenção Recomendada (Opcional)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="date"
                                value={formData.next_maintenance}
                                onChange={(e) => setFormData({ ...formData, next_maintenance: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-600 font-bold hover:bg-gray-200 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-10 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg shadow-emerald-200 transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        <CheckCircle2 size={18} />
                        {loading ? 'Salvando...' : 'Confirmar Registro'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceModal;
