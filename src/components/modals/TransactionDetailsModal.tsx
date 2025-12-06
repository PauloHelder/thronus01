import React from 'react';
import { X, Calendar, Hash, FileText, Printer, Building2, CheckCircle2 } from 'lucide-react';
import { FinancialTransaction } from '../../hooks/useFinance';

interface TransactionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction?: FinancialTransaction;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
    isOpen,
    onClose,
    transaction
}) => {
    if (!isOpen || !transaction) return null;

    const isIncome = transaction.type === 'income';
    const themeColor = isIncome ? 'text-green-600' : 'text-red-600';
    const borderColor = isIncome ? 'border-green-200' : 'border-red-200';

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA'
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm print:p-0 print:bg-white">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 print:shadow-none print:w-full print:max-w-none">

                {/* Print-only close button hide */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors print:hidden"
                >
                    <X size={20} />
                </button>

                <div className="p-8 md:p-10 print:p-0">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">Thronus Church</h1>
                                <p className="text-sm text-slate-500">Gestão Financeira</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold text-gray-200 tracking-widest uppercase">RECIBO</h2>
                            <p className="text-sm text-slate-500 mt-1">#{transaction.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Data de Emissão</p>
                            <p className="font-medium text-slate-700">{formatDate(transaction.date)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Categoria</p>
                            <p className="font-medium text-slate-700">{transaction.category?.name || 'Geral'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Método</p>
                            <p className="font-medium text-slate-700 capitalize">{transaction.account?.type === 'bank' ? 'Bancário' : 'Dinheiro'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status</p>
                            <div className="flex items-center gap-1.5 text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full w-fit text-sm">
                                <CheckCircle2 size={14} />
                                <span>Pago</span>
                            </div>
                        </div>
                    </div>

                    {/* From / To Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 p-6 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Origem / Detalhes</p>
                            <h3 className="font-bold text-slate-800 text-lg mb-1">{transaction.description || 'Transação sem descrição'}</h3>
                            {transaction.document_number && (
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                    <Hash size={12} /> Doc: {transaction.document_number}
                                </p>
                            )}
                        </div>
                        <div className="md:text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Conta Destino</p>
                            <h3 className="font-bold text-slate-800 text-lg mb-1">{transaction.account?.name}</h3>
                            <p className="text-sm text-slate-500 capitalize">
                                {transaction.account?.type === 'bank' ? 'Conta Bancária' : 'Caixa Físico'}
                            </p>
                        </div>
                    </div>

                    {/* Amount Section */}
                    <div className="flex justify-end mb-8">
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-500 mb-1">Valor Total</p>
                            <div className={`text-4xl font-bold ${themeColor}`}>
                                {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {transaction.notes && (
                        <div className="mb-8 border-t border-gray-200 pt-6">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                <FileText size={14} /> Observações
                            </p>
                            <p className="text-slate-600 italic bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm">
                                "{transaction.notes}"
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                        <p className="text-xs text-slate-400 text-center md:text-left">
                            Este é um comprovante digital gerado pelo sistema Thronus.
                            <br />ID Único: {transaction.id}
                        </p>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={handlePrint}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-slate-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Printer size={18} />
                                Imprimir
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 md:flex-none px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .fixed, .fixed * {
                        visibility: visible;
                    }
                    .fixed {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background: white;
                        padding: 0;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:p-0 {
                        padding: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default TransactionDetailsModal;
