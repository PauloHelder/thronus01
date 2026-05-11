import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Check, AlertTriangle, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { FinancialAccount, FinancialCategory, FinancialTransaction } from '../../hooks/useFinance';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface ImportFinanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: FinancialAccount[];
    categories: FinancialCategory[];
    onImport: (transactions: any) => Promise<boolean>;
}

const ImportFinanceModal: React.FC<ImportFinanceModalProps> = ({
    isOpen,
    onClose,
    accounts,
    categories,
    onImport
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [members, setMembers] = useState<{ id: string, name: string, member_code: string | null }[]>([]);
    const [loading, setLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchMembers = async () => {
            const { data } = await supabase.from('members').select('id, name, member_code');
            if (data) setMembers(data);
        };
        fetchMembers();
    }, []);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv')) {
                setFile(selectedFile);
                parseFile(selectedFile);
            } else {
                toast.error('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV.');
            }
        }
    };

    const parseFile = (file: File) => {
        setIsParsing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                // Map and validate
                const mappedData = json.map((row: any) => {
                    const typeStr = (row['tipo'] || row['Tipo'] || '').toString().toLowerCase();
                    const type = (typeStr.includes('entrada') || typeStr.includes('receita') || typeStr.includes('estrada')) 
                        ? 'income' 
                        : 'expense';

                    const categoryName = row['Categoria'] || row['categoria'];
                    const category = categories.find(c => 
                        c.name.toLowerCase() === (categoryName || '').toString().toLowerCase() && 
                        c.type === type
                    );

                    const memberCode = (row['Codigo'] || row['codigo'] || row['Código'] || '').toString();
                    const member = members.find(m => m.member_code?.toString() === memberCode);

                    return {
                        date: row['Data'] || row['data'] || new Date().toISOString(),
                        description: row['Descricao'] || row['Descrição'] || row['descricao'] || 'Importado',
                        amount: Math.abs(parseFloat(row['Valor'] || row['valor'] || 0)),
                        type: type,
                        category_id: category?.id,
                        category_name: categoryName,
                        document_number: row['Referencia'] || row['referencia'] || row['Referência'],
                        member_code: memberCode,
                        member_id: member?.id,
                        status: 'paid',
                        isValid: !!(row['Data'] || row['data']) && !!(row['Valor'] || row['valor'])
                    };
                });

                setPreviewData(mappedData);
            } catch (error) {
                console.error('Error parsing excel:', error);
                toast.error('Erro ao ler o arquivo. Verifique se o formato está correto.');
            } finally {
                setIsParsing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const templateData = [
            {
                'Data': new Date().toISOString().split('T')[0],
                'Referencia': 'REF001',
                'Descricao': 'Exemplo de Receita',
                'Categoria': 'Dízimo',
                'Codigo': 'M001',
                'tipo': 'Entrada',
                'Valor': 1500.00
            },
            {
                'Data': new Date().toISOString().split('T')[0],
                'Referencia': 'REF002',
                'Descricao': 'Exemplo de Despesa',
                'Categoria': 'Energia Elétrica',
                'Codigo': '',
                'tipo': 'Saida',
                'Valor': 250.00
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Modelo_Importacao');

        ws['!cols'] = [
            { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
        ];

        XLSX.writeFile(wb, 'modelo_importacao_financeira.xlsx');
        toast.success('Modelo baixado com sucesso!');
    };

    const handleImport = async () => {
        if (!selectedAccountId) {
            toast.error('Selecione uma conta para importação.');
            return;
        }

        if (previewData.length === 0) {
            toast.error('Nenhum dado para importar.');
            return;
        }

        const validTransactions = previewData.filter(tx => tx.isValid);
        if (validTransactions.length === 0) {
            toast.error('Nenhuma transação válida encontrada.');
            return;
        }

        setLoading(true);
        try {
            const transactionsToSave = validTransactions.map(tx => ({
                description: tx.description,
                amount: tx.amount,
                type: tx.type,
                date: tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : tx.date,
                category_id: tx.category_id,
                account_id: selectedAccountId,
                member_id: tx.member_id,
                status: 'paid',
                document_number: tx.document_number?.toString(),
                notes: tx.member_code ? `Código Membro: ${tx.member_code}` : ''
            }));

            let successCount = 0;
            for (const tx of transactionsToSave) {
                const success = await onImport(tx);
                if (success) successCount++;
            }

            if (successCount > 0) {
                toast.success(`${successCount} transações importadas com sucesso!`);
                if (typeof onClose === 'function') onClose();
            } else {
                toast.error('Erro ao importar transações.');
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Ocorreu um erro durante a importação.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA'
        }).format(value);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Importar Transações</h2>
                            <p className="text-sm text-slate-500">Importe dados financeiros via Excel ou CSV</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => typeof onClose === 'function' && onClose()}
                        className="p-2 hover:bg-gray-100 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Step 1: File Selection & Account */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">1. Selecione a Conta de Destino</label>
                            <select
                                value={selectedAccountId}
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-700"
                            >
                                <option value="">Selecione uma conta...</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.current_balance)})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">2. Carregue o Arquivo</label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                                    file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                }`}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    accept=".xlsx,.xls,.csv"
                                />
                                {isParsing ? (
                                    <Loader2 className="animate-spin text-orange-500" size={24} />
                                ) : file ? (
                                    <>
                                        <Check className="text-green-600" size={24} />
                                        <span className="text-sm font-medium text-green-700 truncate max-w-full">{file.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="text-gray-400" size={24} />
                                        <span className="text-sm text-slate-500 font-medium">Clique para selecionar o arquivo</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Format Info */}
                    {!file && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="text-blue-500 shrink-0" size={20} />
                            <div className="text-sm text-blue-700 flex-1">
                                <p className="font-semibold mb-1">Colunas Esperadas:</p>
                                <p className="mb-2">Data, Referencia, Descricao, Categoria, Codigo (opcional), tipo (Entrada/Saida), Valor</p>
                                <button 
                                    onClick={downloadTemplate}
                                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 mt-1 transition-colors underline decoration-2 underline-offset-4"
                                >
                                    <Download size={14} />
                                    Baixar Planilha Modelo (.xlsx)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preview Table */}
                    {previewData.length > 0 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                Prévia dos Dados ({previewData.length} linhas)
                                {previewData.some(tx => !tx.category_id) && (
                                    <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                        <AlertTriangle size={10} /> Algumas categorias não mapeadas
                                    </span>
                                )}
                            </h3>
                            <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 text-slate-500 uppercase font-semibold border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3">Data</th>
                                            <th className="px-4 py-3">Descrição</th>
                                            <th className="px-4 py-3">Categoria</th>
                                            <th className="px-4 py-3">Tipo</th>
                                            <th className="px-4 py-3 text-right">Valor</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {previewData.map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-slate-600">
                                                    {tx.date instanceof Date ? tx.date.toLocaleDateString('pt-BR') : tx.date}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-800">{tx.description}</div>
                                                    {tx.document_number && <div className="text-[10px] text-slate-400">Ref: {tx.document_number}</div>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {tx.category_id ? (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                                                            {categories.find(c => c.id === tx.category_id)?.name}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium flex items-center gap-1 w-fit">
                                                            {tx.category_name || 'Sem Categoria'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                                                        tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                                    }`}>
                                                        {tx.type === 'income' ? 'Entrada' : 'Saída'}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${
                                                    tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {tx.isValid ? (
                                                        <Check className="text-green-500 mx-auto" size={16} />
                                                    ) : (
                                                        <AlertTriangle className="text-red-500 mx-auto" size={16} title="Dados incompletos" />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <button
                        onClick={() => typeof onClose === 'function' && onClose()}
                        className="px-6 py-2.5 text-slate-600 hover:text-slate-800 font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={loading || previewData.length === 0 || !selectedAccountId}
                        className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Importando...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                Confirmar Importação
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportFinanceModal;
