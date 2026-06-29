import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Calendar, Clock, DollarSign, ListChecks } from 'lucide-react';
import { FinancialCategory } from '../../hooks/useFinance';
import { formatAOA } from '../../utils/currency';

interface PayableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (bill: any, installments: any[]) => Promise<boolean>;
    categories: FinancialCategory[];
}

export const calculateOccurrences = (startDateStr: string, endDateStr: string, periodicity: string): number => {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr + 'T12:00:00');
    const end = new Date(endDateStr + 'T12:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (periodicity) {
        case 'diária':
            return diffDays + 1;
        case 'semanal':
            return Math.floor(diffDays / 7) + 1;
        case 'mensal': {
            const yearDiff = end.getFullYear() - start.getFullYear();
            const monthDiff = end.getMonth() - start.getMonth();
            return yearDiff * 12 + monthDiff + 1;
        }
        case 'trimestral': {
            const yearDiff = end.getFullYear() - start.getFullYear();
            const monthDiff = end.getMonth() - start.getMonth();
            const totalMonths = yearDiff * 12 + monthDiff;
            return Math.floor(totalMonths / 3) + 1;
        }
        case 'anual': {
            const yearDiff = end.getFullYear() - start.getFullYear();
            return yearDiff + 1;
        }
        default:
            return 0;
    }
};

export const generateInstallmentDates = (startDateStr: string, occurrences: number, periodicity: string): string[] => {
    const dates: string[] = [];
    const baseDate = new Date(startDateStr + 'T12:00:00');

    for (let i = 0; i < occurrences; i++) {
        const d = new Date(baseDate);
        if (periodicity === 'diária') {
            d.setDate(baseDate.getDate() + i);
        } else if (periodicity === 'semanal') {
            d.setDate(baseDate.getDate() + i * 7);
        } else if (periodicity === 'mensal') {
            d.setMonth(baseDate.getMonth() + i);
        } else if (periodicity === 'trimestral') {
            d.setMonth(baseDate.getMonth() + i * 3);
        } else if (periodicity === 'anual') {
            d.setFullYear(baseDate.getFullYear() + i);
        }

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
    }
    return dates;
};

const PayableModal: React.FC<PayableModalProps> = ({
    isOpen,
    onClose,
    onSave,
    categories
}) => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category_id: '',
        start_date: '',
        end_date: '',
        periodicity: 'mensal'
    });

    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter categories to only show expenses
    const expenseCategories = useMemo(() => {
        return categories.filter(c => c.type === 'expense');
    }, [categories]);

    // Pre-select first category if available
    useEffect(() => {
        if (expenseCategories.length > 0 && !formData.category_id) {
            setFormData(prev => ({ ...prev, category_id: expenseCategories[0].id }));
        }
    }, [expenseCategories, formData.category_id]);

    // Calculate occurrences
    const occurrences = useMemo(() => {
        return calculateOccurrences(formData.start_date, formData.end_date, formData.periodicity);
    }, [formData.start_date, formData.end_date, formData.periodicity]);

    // Generate installment objects for preview
    const installmentsPreview = useMemo(() => {
        if (occurrences <= 0 || !formData.amount) return [];
        const amountVal = parseFloat(formData.amount) || 0;
        const dates = generateInstallmentDates(formData.start_date, occurrences, formData.periodicity);
        
        return dates.map((date, idx) => ({
            installment_number: idx + 1,
            amount: amountVal,
            due_date: date
        }));
    }, [occurrences, formData.start_date, formData.amount, formData.periodicity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!formData.description) throw new Error('A descrição é obrigatória.');
            if (!formData.amount || parseFloat(formData.amount) <= 0) throw new Error('Informe um valor válido.');
            if (!formData.category_id) throw new Error('Selecione uma categoria.');
            if (!formData.start_date || !formData.end_date) throw new Error('As datas de início e fim são obrigatórias.');
            if (new Date(formData.start_date) > new Date(formData.end_date)) throw new Error('A data de início não pode ser maior que a data de fim.');
            if (occurrences <= 0) throw new Error('Datas insuficientes para gerar ao menos uma ocorrência.');

            const billPayload = {
                description: formData.description,
                amount: parseFloat(formData.amount),
                category_id: formData.category_id,
                start_date: formData.start_date,
                end_date: formData.end_date,
                periodicity: formData.periodicity,
                occurrences
            };

            const success = await onSave(billPayload, installmentsPreview);
            if (success) {
                // Reset form
                setFormData({
                    description: '',
                    amount: '',
                    category_id: expenseCategories[0]?.id || '',
                    start_date: '',
                    end_date: '',
                    periodicity: 'mensal'
                });
                setShowPreview(false);
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const totalCalculatedAmount = (parseFloat(formData.amount) || 0) * occurrences;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transition-all transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-orange-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-md shadow-orange-100">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Agendar Conta a Pagar
                            </h2>
                            <p className="text-xs text-slate-500">Cadastre despesas recorrentes programadas</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                    {error && (
                        <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descrição / Fornecedor</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-medium"
                            placeholder="Ex: Aluguel do Templo, Provedor de Internet..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Categoria</label>
                            <select
                                required
                                value={formData.category_id}
                                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-medium bg-white"
                            >
                                <option value="" disabled>Selecione uma categoria</option>
                                {expenseCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Valor de cada parcela */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Valor da Parcela</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Kz</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-semibold text-slate-800"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Data Início */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data de Início</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    required
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        {/* Data Fim */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data de Fim</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    required
                                    value={formData.end_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Periodicidade */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Periodicidade</label>
                        <select
                            value={formData.periodicity}
                            onChange={e => setFormData({ ...formData, periodicity: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-medium bg-white"
                        >
                            <option value="diária">Diária</option>
                            <option value="semanal">Semanal</option>
                            <option value="mensal">Mensal</option>
                            <option value="trimestral">Trimestral</option>
                            <option value="anual">Anual</option>
                        </select>
                    </div>

                    {/* Resumo Automático */}
                    {occurrences > 0 && formData.amount && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-2 bg-white text-orange-600 rounded-xl shadow-sm mt-0.5">
                                <ListChecks size={18} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-bold text-orange-800">Resumo da Recorrência</h4>
                                <p className="text-xs text-orange-700 leading-relaxed font-medium">
                                    Serão geradas <span className="font-bold text-orange-900">{occurrences} parcelas</span> de <span className="font-bold text-orange-900">{formatAOA(parseFloat(formData.amount) || 0)}</span>.
                                </p>
                                <p className="text-xs text-orange-700 font-medium">
                                    Valor Total Programado: <span className="font-bold text-orange-950 text-sm">{formatAOA(totalCalculatedAmount)}</span>.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Pré-visualização de Parcelas */}
                    {installmentsPreview.length > 0 && (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors outline-none"
                            >
                                {showPreview ? 'Ocultar datas de vencimento' : 'Ver pré-visualização das parcelas'}
                            </button>

                            {showPreview && (
                                <div className="mt-3 bg-gray-50 border border-gray-150 rounded-xl max-h-44 overflow-y-auto divide-y divide-gray-100 p-2 text-xs animate-in fade-in duration-200">
                                    {installmentsPreview.map((item) => {
                                        // Formatar data para exibição (dd/mm/aaaa)
                                        const dateParts = item.due_date.split('-');
                                        const displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

                                        return (
                                            <div key={item.installment_number} className="flex justify-between items-center py-2 px-2 hover:bg-gray-100/50 rounded transition-colors">
                                                <span className="font-semibold text-slate-600">Parcela #{item.installment_number}</span>
                                                <div className="flex gap-4">
                                                    <span className="text-slate-500 font-medium">{displayDate}</span>
                                                    <span className="font-bold text-slate-800">{formatAOA(item.amount)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || occurrences <= 0}
                            className={`flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl shadow-md shadow-orange-100 transition-all transform active:scale-95 bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/20 ${
                                loading || occurrences <= 0 ? 'opacity-70 cursor-not-allowed shadow-none' : ''
                            }`}
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar Programação'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PayableModal;
