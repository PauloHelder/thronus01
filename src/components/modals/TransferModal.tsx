import React, { useState } from 'react';
import { X, Save, Calendar, ArrowRightLeft, CreditCard } from 'lucide-react';
import { FinancialAccount } from '../../hooks/useFinance';
import { toast } from 'sonner';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransfer: (data: {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        date: string;
        description: string;
    }) => Promise<boolean>;
    accounts: FinancialAccount[];
}

const TransferModal: React.FC<TransferModalProps> = ({
    isOpen,
    onClose,
    onTransfer,
    accounts
}) => {
    const [formData, setFormData] = useState({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: 'Transferência entre contas',
    });

    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fromAccountId || !formData.toAccountId) {
            toast.error('Selecione as contas de origem e destino.');
            return;
        }

        if (formData.fromAccountId === formData.toAccountId) {
            toast.error('A conta de origem e destino não podem ser as mesmas.');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Informe um valor válido maior que zero.');
            return;
        }

        setLoading(true);
        try {
            const success = await onTransfer({
                ...formData,
                amount
            });

            if (success) {
                toast.success('Transferência realizada com sucesso!');
                onClose();
                // Reset form
                setFormData({
                    fromAccountId: '',
                    toAccountId: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    description: 'Transferência entre contas',
                });
            } else {
                toast.error('Erro ao realizar transferência.');
            }
        } catch (error) {
            console.error('Transfer error:', error);
            toast.error('Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <ArrowRightLeft size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-slate-800">Nova Transferência</h3>
                            <p className="text-sm text-slate-500">Mova fundos entre suas contas</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 label text-left">Conta de Origem (Sai)</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500">
                                        <CreditCard size={18} />
                                    </div>
                                    <select
                                        required
                                        value={formData.fromAccountId}
                                        onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-slate-800 appearance-none"
                                    >
                                        <option value="">Selecione...</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} (AOA {acc.current_balance.toLocaleString()})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 label text-left">Conta de Destino (Entra)</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500">
                                        <CreditCard size={18} />
                                    </div>
                                    <select
                                        required
                                        value={formData.toAccountId}
                                        onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-slate-800 appearance-none"
                                    >
                                        <option value="">Selecione...</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} (AOA {acc.current_balance.toLocaleString()})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 label text-left">Valor da Transferência</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">AOA</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0,00"
                                    className="w-full pl-16 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 font-bold text-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 label text-left">Data</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Calendar size={18} />
                                </div>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 label text-left">Descrição / Motivo</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 text-slate-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={20} />
                            )}
                            Confirmar Transferência
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransferModal;
