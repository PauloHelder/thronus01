import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Hash, FileText } from 'lucide-react';
import { FinancialTransaction, FinancialAccount, FinancialCategory } from '../../hooks/useFinance';
import { supabase } from '../../lib/supabase';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: any) => Promise<boolean>;
    transaction?: FinancialTransaction;
    accounts: FinancialAccount[];
    categories: FinancialCategory[];
    type?: 'income' | 'expense';
}

const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    transaction,
    accounts,
    categories,
    type: initialType = 'income'
}) => {
    const [activeTab, setActiveTab] = useState<'income' | 'expense'>(initialType);

    // Data Sources
    const [members, setMembers] = useState<{ id: string, name: string }[]>([]);
    const [services, setServices] = useState<{ id: string, name: string, date: string }[]>([]);

    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category_id: '',
        account_id: '',
        source_type: 'service', // service, member, other
        source_id: '',
        other_source_name: '', // New field for "Other"
        document_number: '',
        reference_number: '',
        description: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                // Fetch Members
                const { data: membersData } = await supabase
                    .from('members')
                    .select('id, full_name')
                    .order('full_name');
                if (membersData) setMembers(membersData.map(m => ({ id: m.id, name: m.full_name })));

                // Fetch Services (Last 10)
                // Join with service_types to get the name
                const { data: servicesData } = await supabase
                    .from('services')
                    .select(`
                        id, 
                        date, 
                        service_types (
                            name
                        )
                    `)
                    .order('date', { ascending: false })
                    .limit(10);

                if (servicesData) {
                    setServices(servicesData.map((s: any) => ({
                        id: s.id,
                        name: `${s.service_types?.name || 'Culto'} - ${new Date(s.date).toLocaleDateString('pt-BR')}`,
                        date: s.date
                    })));
                }
            };
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (transaction) {
            setActiveTab(transaction.type);
            setFormData({
                amount: transaction.amount.toString(),
                date: transaction.date,
                category_id: transaction.category_id || '',
                account_id: transaction.account_id || '',
                source_type: 'other', // TODO: Infer logic
                source_id: '',
                other_source_name: '',
                document_number: transaction.document_number || '',
                reference_number: '',
                description: transaction.description || '',
            });
        } else {
            setActiveTab(initialType);
            setFormData({
                amount: '',
                date: new Date().toISOString().split('T')[0],
                category_id: '',
                account_id: (accounts && accounts.length > 0) ? accounts[0].id : '',
                source_type: 'service',
                source_id: '',
                other_source_name: '',
                document_number: '',
                reference_number: '',
                description: '',
            });
        }
    }, [transaction, isOpen, accounts, initialType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!formData.amount) throw new Error('O valor é obrigatório.');
            if (!formData.category_id) throw new Error('A categoria é obrigatória.');

            // Ensure account_id is set
            let finalAccountId = formData.account_id;
            if (!finalAccountId && accounts.length > 0) {
                finalAccountId = accounts[0].id;
            }
            if (!finalAccountId) throw new Error('É necessário ter uma conta cadastrada.');

            // Construct Description
            let finalDescription = formData.description;
            if (!finalDescription) {
                const categoryName = categories.find(c => c.id === formData.category_id)?.name || 'Transação';

                if (formData.source_type === 'member' && formData.source_id) {
                    const memberName = members.find(m => m.id === formData.source_id)?.name;
                    finalDescription = `${categoryName} - ${memberName}`;
                } else if (formData.source_type === 'service' && formData.source_id) {
                    const serviceName = services.find(s => s.id === formData.source_id)?.name;
                    finalDescription = `${categoryName} - ${serviceName}`;
                } else if (formData.source_type === 'other' && formData.other_source_name) {
                    finalDescription = `${categoryName} - ${formData.other_source_name}`;
                } else {
                    finalDescription = categoryName;
                }
            }

            // Construct Notes
            let finalNotes = '';
            if (formData.reference_number) {
                finalNotes = `Ref: ${formData.reference_number}`;
            }

            const success = await onSave({
                amount: parseFloat(formData.amount),
                date: formData.date,
                category_id: formData.category_id,
                account_id: finalAccountId,
                type: activeTab,
                description: finalDescription,
                document_number: formData.document_number,
                notes: finalNotes,
                status: 'paid'
            });

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

    const filteredCategories = categories.filter(c => c.type === activeTab);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <h2 className="text-xl font-bold text-gray-800">Nova Transação</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 pt-2">
                    {/* Tabs */}
                    <div className="bg-gray-100 p-1 rounded-lg flex mb-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('income')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'income'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Receita
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('expense')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'expense'
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Despesa
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Categoria e Valor */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Categoria</label>
                                <select
                                    value={formData.category_id}
                                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-700"
                                >
                                    <option value="">Selecione...</option>
                                    {filteredCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Valor</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Data */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Data</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                                />
                            </div>
                        </div>

                        {/* Conta */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Conta / Caixa</label>
                            <select
                                value={formData.account_id}
                                onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-700"
                            >
                                <option value="">Selecione a conta...</option>
                                {accounts?.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Origem / Destino */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Origem / Destino</label>
                            <div className="flex gap-6 mb-3">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="source_type"
                                        value="service"
                                        checked={formData.source_type === 'service'}
                                        onChange={() => setFormData({ ...formData, source_type: 'service' })}
                                        className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                                    />
                                    Culto
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="source_type"
                                        value="member"
                                        checked={formData.source_type === 'member'}
                                        onChange={() => setFormData({ ...formData, source_type: 'member' })}
                                        className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                                    />
                                    Membro
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="source_type"
                                        value="other"
                                        checked={formData.source_type === 'other'}
                                        onChange={() => setFormData({ ...formData, source_type: 'other' })}
                                        className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                                    />
                                    Outro
                                </label>
                            </div>

                            {/* Conditional Inputs */}
                            {formData.source_type === 'service' && (
                                <select
                                    value={formData.source_id}
                                    onChange={e => setFormData({ ...formData, source_id: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-700"
                                >
                                    <option value="">Selecione o Culto...</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            )}

                            {formData.source_type === 'member' && (
                                <select
                                    value={formData.source_id}
                                    onChange={e => setFormData({ ...formData, source_id: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-700"
                                >
                                    <option value="">Selecione o Membro...</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            )}

                            {formData.source_type === 'other' && (
                                <input
                                    type="text"
                                    value={formData.other_source_name}
                                    onChange={e => setFormData({ ...formData, other_source_name: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                                    placeholder="Especifique (ex: Venda de Bolo, Doação Externa...)"
                                />
                            )}
                        </div>

                        {/* Recibo e Referência */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nº Recibo (Opcional)</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={formData.document_number}
                                        onChange={e => setFormData({ ...formData, document_number: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                                        placeholder="#"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nº Referência (Opcional)</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={formData.reference_number}
                                        onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Descrição (Opcional)</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 resize-none"
                                placeholder="Detalhes adicionais..."
                            />
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-6 mt-2">
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
                                {loading ? 'Salvando...' : 'Salvar Transação'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TransactionModal;
