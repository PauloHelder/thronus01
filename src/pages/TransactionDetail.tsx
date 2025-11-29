import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Calendar, DollarSign, FileText, Hash, User, Building, CheckCircle } from 'lucide-react';
import { Transaction } from '../types';
import { MOCK_CATEGORIES } from '../mocks/finance';
import { MOCK_MEMBERS } from '../mocks/members';

// Mock transaction (idealmente viria de um contexto ou API)
const MOCK_TRANSACTION: Transaction = {
    id: '1',
    type: 'Expense',
    categoryId: '4',
    amount: 250000,
    date: '2024-01-25',
    source: 'Other',
    sourceName: 'Imobiliária Central',
    receiptNumber: 'REC-2024-001',
    referenceNumber: 'REF-ALG-001',
    description: 'Aluguel do templo - Janeiro 2024'
};

const TransactionDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const printRef = useRef<HTMLDivElement>(null);

    // Simular busca da transação
    const transaction = MOCK_TRANSACTION;

    const getCategoryName = (categoryId: string) => {
        return MOCK_CATEGORIES.find(c => c.id === categoryId)?.name || 'Desconhecido';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        // Implementação futura com biblioteca como jsPDF ou html2pdf
        alert('Funcionalidade de download PDF será implementada em breve!');
        // Exemplo de implementação:
        // import html2pdf from 'html2pdf.js';
        // const element = printRef.current;
        // html2pdf().from(element).save(`recibo-${transaction.id}.pdf`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - Não imprime */}
            <div className="bg-white border-b border-gray-200 p-4 lg:p-6 print:hidden">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/finances')}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Voltar para Finanças</span>
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                {transaction.type === 'Income' ? 'Recibo de Receita' : 'Comprovante de Despesa'}
                            </h1>
                            <p className="text-slate-600 mt-1">#{transaction.id}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                                <Printer size={18} />
                                Imprimir
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow"
                            >
                                <Download size={18} />
                                Baixar PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice Content */}
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <div ref={printRef} className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 lg:p-12 print:shadow-none print:border-0">
                    {/* Header do Invoice */}
                    <div className="flex justify-between items-start mb-8 pb-8 border-b-2 border-gray-200">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">T</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Thronus</h2>
                                    <p className="text-sm text-slate-500">Gestão de Igrejas</p>
                                </div>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                                <p>Igreja Exemplo</p>
                                <p>Rua da Igreja, 123</p>
                                <p>Luanda, Angola</p>
                                <p>contato@igreja.ao</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className={`inline-block px-4 py-2 rounded-lg mb-4 ${transaction.type === 'Income'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                <span className="font-bold text-lg">
                                    {transaction.type === 'Income' ? 'RECEITA' : 'DESPESA'}
                                </span>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                                <p className="font-semibold">Data de Emissão</p>
                                <p>{formatDate(transaction.date)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Informações da Transação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                    {transaction.type === 'Income' ? 'Recebido de' : 'Pago para'}
                                </p>
                                <div className="flex items-start gap-2">
                                    {transaction.source === 'Member' ? (
                                        <User size={18} className="text-slate-400 mt-0.5" />
                                    ) : transaction.source === 'Service' ? (
                                        <Building size={18} className="text-slate-400 mt-0.5" />
                                    ) : (
                                        <FileText size={18} className="text-slate-400 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="font-semibold text-slate-800">{transaction.sourceName}</p>
                                        <p className="text-sm text-slate-500">
                                            {transaction.source === 'Member' ? 'Membro' :
                                                transaction.source === 'Service' ? 'Culto' : 'Outro'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</p>
                                <p className="font-medium text-slate-800">{getCategoryName(transaction.categoryId)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {transaction.receiptNumber && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Nº Recibo</p>
                                    <div className="flex items-center gap-2">
                                        <Hash size={16} className="text-slate-400" />
                                        <p className="font-medium text-slate-800">{transaction.receiptNumber}</p>
                                    </div>
                                </div>
                            )}

                            {transaction.referenceNumber && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Nº Referência</p>
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-slate-400" />
                                        <p className="font-medium text-slate-800">{transaction.referenceNumber}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Descrição */}
                    {transaction.description && (
                        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Descrição</p>
                            <p className="text-slate-700">{transaction.description}</p>
                        </div>
                    )}

                    {/* Tabela de Valores */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                                    <th className="text-right py-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-4 text-slate-700">{getCategoryName(transaction.categoryId)}</td>
                                    <td className="py-4 text-right font-medium text-slate-800">{formatCurrency(transaction.amount)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-200">
                                    <td className="py-4 text-lg font-bold text-slate-800">TOTAL</td>
                                    <td className={`py-4 text-right text-2xl font-bold ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {formatCurrency(transaction.amount)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Status e Observações */}
                    <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg mb-8">
                        <CheckCircle className="text-green-600" size={20} />
                        <div>
                            <p className="font-semibold text-green-800">Transação Confirmada</p>
                            <p className="text-sm text-green-600">Registrada em {formatDate(transaction.date)}</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-8 border-t border-gray-200 text-center text-sm text-slate-500">
                        <p>Este documento foi gerado eletronicamente pelo sistema Thronus</p>
                        <p className="mt-1">Para mais informações, entre em contato com a administração da igreja</p>
                    </div>
                </div>

                {/* Informações Adicionais - Não imprime */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg print:hidden">
                    <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> Este comprovante pode ser impresso ou salvo em PDF para seus registros.
                        Para gerar o PDF, clique no botão "Baixar PDF" acima.
                    </p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:border-0 {
                        border: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default TransactionDetail;
