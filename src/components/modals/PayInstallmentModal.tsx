import React, { useState, useEffect } from 'react';
import { X, Check, Wallet, Calendar } from 'lucide-react';
import { FinancialAccount, FinancialPayableInstallment } from '../../hooks/useFinance';
import { formatAOA } from '../../utils/currency';
import { parseFlexibleDate } from '../../utils/dateUtils';

interface PayInstallmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (accountId: string, paymentDate: string) => Promise<boolean>;
    accounts: FinancialAccount[];
    installment: FinancialPayableInstallment | null;
}

const PayInstallmentModal: React.FC<PayInstallmentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    accounts,
    installment
}) => {
    const [accountId, setAccountId] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill values when modal opens
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setPaymentDate(parseFlexibleDate(new Date()));
            if (accounts.length > 0) {
                setAccountId(accounts[0].id);
            } else {
                setAccountId('');
            }
        }
    }, [isOpen, accounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountId) {
            setError('Selecione uma conta bancária/caixa para efetuar o pagamento.');
            return;
        }
        if (!paymentDate) {
            setError('Selecione a data de pagamento.');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const success = await onConfirm(accountId, paymentDate);
            if (success) {
                onClose();
            } else {
                setError('Erro ao processar o pagamento.');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao processar o pagamento.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !installment) return null;

    // Format display date (dd/mm/aaaa)
    const dateParts = installment.due_date.split('-');
    const displayDueDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all transform animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-blue-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500 text-white shadow-md shadow-blue-100">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Baixar Parcela
                            </h2>
                            <p className="text-xs text-slate-500">Registrar pagamento e gerar despesa</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Resumo da Parcela */}
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5">
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Resumo do Pagamento</div>
                        <div className="font-bold text-slate-800 text-base leading-tight">
                            {installment.recurring_bill?.description || 'Conta a Pagar'}
                        </div>
                        <div className="flex justify-between items-center text-sm pt-1">
                            <span className="text-slate-500 font-semibold">Parcela #{installment.installment_number}</span>
                            <span className="text-slate-500 font-medium">Vencimento: {displayDueDate}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200/60 mt-1">
                            <span className="text-slate-600 font-bold">Valor da Parcela:</span>
                            <span className="font-extrabold text-blue-600 text-lg">{formatAOA(installment.amount)}</span>
                        </div>
                    </div>

                    {/* Conta Financeira */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Conta de Pagamento</label>
                        <select
                            required
                            value={accountId}
                            onChange={e => setAccountId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium bg-white"
                        >
                            <option value="" disabled>Selecione uma conta</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} (Saldo: {formatAOA(acc.current_balance)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Data do Pagamento */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data do Pagamento</label>
                        <div className="relative">
                            <input
                                type="date"
                                required
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

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
                            disabled={loading || accounts.length === 0}
                            className={`flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl shadow-md shadow-blue-100 transition-all transform active:scale-95 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 ${
                                loading || accounts.length === 0 ? 'opacity-70 cursor-not-allowed shadow-none' : ''
                            }`}
                        >
                            <Check size={18} />
                            {loading ? 'Processando...' : 'Confirmar Pagamento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PayInstallmentModal;
