import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Transaction, TransactionCategory, Member, Service } from '../../types';
import { Save, DollarSign, Calendar, FileText, Hash, User, Church } from 'lucide-react';

// Mock services for dropdown (idealmente viria de props ou contexto)
const MOCK_SERVICES_DROPDOWN = [
    { id: '1', name: 'Culto de Domingo - 28/01', date: '2024-01-28' },
    { id: '2', name: 'Culto de Jovens - 27/01', date: '2024-01-27' },
    { id: '3', name: 'Culto de Doutrina - 24/01', date: '2024-01-24' },
];

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
    transaction?: Transaction | null;
    categories: TransactionCategory[];
    members: Member[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    transaction,
    categories,
    members
}) => {
    const [type, setType] = useState<'Income' | 'Expense'>('Income');
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [source, setSource] = useState<'Service' | 'Member' | 'Other'>('Service');
    const [sourceId, setSourceId] = useState('');
    const [sourceName, setSourceName] = useState(''); // Para "Other" ou display
    const [receiptNumber, setReceiptNumber] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setCategoryId(transaction.categoryId);
            setAmount(transaction.amount.toString());
            setDate(transaction.date);
            setSource(transaction.source);
            setSourceId(transaction.sourceId || '');
            setSourceName(transaction.sourceName || '');
            setReceiptNumber(transaction.receiptNumber || '');
            setReferenceNumber(transaction.referenceNumber || '');
            setDescription(transaction.description || '');
        } else {
            // Reset form
            setType('Income');
            setCategoryId('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setSource('Service');
            setSourceId('');
            setSourceName('');
            setReceiptNumber('');
            setReferenceNumber('');
            setDescription('');
        }
    }, [transaction, isOpen]);

    // Filtrar categorias pelo tipo selecionado
    const filteredCategories = categories.filter(c => c.type === type);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!categoryId || !amount || !date) {
            alert('Por favor, preencha os campos obrigatórios.');
            return;
        }

        // Determinar sourceName baseado na seleção
        let finalSourceName = sourceName;
        if (source === 'Member') {
            const member = members.find(m => m.id === sourceId);
            finalSourceName = member ? member.name : '';
        } else if (source === 'Service') {
            const service = MOCK_SERVICES_DROPDOWN.find(s => s.id === sourceId);
            finalSourceName = service ? service.name : '';
        }

        onSave({
            id: transaction?.id || crypto.randomUUID(),
            type,
            categoryId,
            amount: parseFloat(amount),
            date,
            source,
            sourceId,
            sourceName: finalSourceName,
            receiptNumber,
            referenceNumber,
            description
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={transaction ? 'Editar Transação' : 'Nova Transação'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tipo de Transação */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => { setType('Income'); setCategoryId(''); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'Income'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Receita
                    </button>
                    <button
                        type="button"
                        onClick={() => { setType('Expense'); setCategoryId(''); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'Expense'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Despesa
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Categoria */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                        <select
                            required
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Selecione...</option>
                            {filteredCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Valor */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="0,00"
                            />
                        </div>
                    </div>
                </div>

                {/* Data */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Origem / Fonte */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Origem / Destino</label>
                    <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="source"
                                value="Service"
                                checked={source === 'Service'}
                                onChange={() => { setSource('Service'); setSourceId(''); setSourceName(''); }}
                                className="text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-sm text-slate-700">Culto</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="source"
                                value="Member"
                                checked={source === 'Member'}
                                onChange={() => { setSource('Member'); setSourceId(''); setSourceName(''); }}
                                className="text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-sm text-slate-700">Membro</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="source"
                                value="Other"
                                checked={source === 'Other'}
                                onChange={() => { setSource('Other'); setSourceId(''); setSourceName(''); }}
                                className="text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-sm text-slate-700">Outro</span>
                        </label>
                    </div>

                    {/* Inputs condicionais baseados na origem */}
                    {source === 'Service' && (
                        <select
                            value={sourceId}
                            onChange={(e) => setSourceId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Selecione o Culto...</option>
                            {MOCK_SERVICES_DROPDOWN.map(service => (
                                <option key={service.id} value={service.id}>{service.name}</option>
                            ))}
                        </select>
                    )}

                    {source === 'Member' && (
                        <select
                            value={sourceId}
                            onChange={(e) => setSourceId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Selecione o Membro...</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    )}

                    {source === 'Other' && (
                        <input
                            type="text"
                            value={sourceName}
                            onChange={(e) => setSourceName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Especifique (ex: Doação Anônima, Venda de Livros...)"
                        />
                    )}
                </div>

                {/* Campos Opcionais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nº Recibo (Opcional)</label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={receiptNumber}
                                onChange={(e) => setReceiptNumber(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nº Referência (Opcional)</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Detalhes adicionais..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} />
                        Salvar Transação
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TransactionModal;
