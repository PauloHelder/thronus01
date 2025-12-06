import React, { useState, useMemo } from 'react';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Filter,
    Calendar,
    Search,
    Download,
    X,
    Eye,
    Trash2,
    Pencil
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useFinance, FinancialTransaction } from '../hooks/useFinance';
import TransactionModal from '../components/modals/TransactionModal';
import AccountModal from '../components/modals/AccountModal';
import CategoryModal from '../components/modals/CategoryModal';
import TransactionDetailsModal from '../components/modals/TransactionDetailsModal';

const Finance = () => {
    const {
        transactions,
        accounts,
        categories,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        addCategory
    } = useFinance();

    // Filters State
    const [filterType, setFilterType] = useState<'All' | 'income' | 'expense'>('All');
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal States
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | undefined>(undefined);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingTransaction, setViewingTransaction] = useState<FinancialTransaction | undefined>(undefined);

    const handleViewTransaction = (transaction: FinancialTransaction) => {
        setViewingTransaction(transaction);
        setIsDetailsModalOpen(true);
    };

    // Calculate Totals
    const totals = useMemo(() => {
        return transactions.reduce((acc, curr) => {
            if (curr.type === 'income') {
                acc.income += Number(curr.amount);
            } else {
                acc.expense += Number(curr.amount);
            }
            return acc;
        }, { income: 0, expense: 0 });
    }, [transactions]);

    const balance = totals.income - totals.expense;

    // Chart Data Calculation (Last 30 days grouped by week)
    const chartData = useMemo(() => {
        // Mock data structure for now, ideally would aggregate real data
        // In a real implementation, we would group transactions by date/week
        return [
            { name: 'Sem 1', income: totals.income * 0.2, expense: totals.expense * 0.25 },
            { name: 'Sem 2', income: totals.income * 0.3, expense: totals.expense * 0.2 },
            { name: 'Sem 3', income: totals.income * 0.25, expense: totals.expense * 0.3 },
            { name: 'Sem 4', income: totals.income * 0.25, expense: totals.expense * 0.25 },
        ];
    }, [totals]);

    // Filter Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesType = filterType === 'All' || t.type === filterType;
            const matchesCategory = filterCategory === 'All' || t.category_id === filterCategory;
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category?.name.toLowerCase().includes(searchTerm.toLowerCase());

            const transactionDate = new Date(t.date);
            const matchesStartDate = !startDate || transactionDate >= new Date(startDate);
            const matchesEndDate = !endDate || transactionDate <= new Date(endDate);

            return matchesType && matchesCategory && matchesSearch && matchesStartDate && matchesEndDate;
        });
    }, [transactions, filterType, filterCategory, searchTerm, startDate, endDate]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA'
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleOpenTransactionModal = (transaction?: FinancialTransaction) => {
        setSelectedTransaction(transaction);
        setIsTransactionModalOpen(true);
    };

    const handleSaveTransaction = async (data: any) => {
        if (selectedTransaction) {
            return await updateTransaction(selectedTransaction.id, data);
        } else {
            return await addTransaction(data);
        }
    };

    const clearFilters = () => {
        setFilterType('All');
        setFilterCategory('All');
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
    };

    const hasActiveFilters = filterType !== 'All' || filterCategory !== 'All' || searchTerm !== '' || startDate !== '' || endDate !== '';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Finanças</h1>
                    <p className="text-slate-600 mt-1">Gestão financeira, dízimos, ofertas e despesas</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium">
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        onClick={() => handleOpenTransactionModal()}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nova Transação
                    </button>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                {/* Receitas */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12% este mês</span>
                    </div>
                    <p className="text-sm text-slate-500">Receitas Totais</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totals.income)}</p>
                </div>

                {/* Despesas */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <TrendingDown className="text-red-600" size={24} />
                        </div>
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">+5% este mês</span>
                    </div>
                    <p className="text-sm text-slate-500">Despesas Totais</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totals.expense)}</p>
                </div>

                {/* Saldo */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="text-blue-600" size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-500">Saldo Atual</span>
                    </div>
                    <p className="text-sm text-slate-500">Saldo em Caixa</p>
                    <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Fluxo de Caixa (Últimos 30 dias)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <CartesianGrid vertical={false} stroke="#f1f5f9" />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="income" name="Receitas" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                        <Area type="monotone" dataKey="expense" name="Despesas" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Transactions Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800">Transações</h3>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors font-medium ${showFilters || hasActiveFilters
                                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                                    : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Filter size={18} />
                                Filtros
                            </button>
                        </div>
                    </div>

                    {/* Filters Area */}
                    {showFilters && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value as any)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    >
                                        <option value="All">Todas</option>
                                        <option value="income">Receitas</option>
                                        <option value="expense">Despesas</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    >
                                        <option value="All">Todas</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Data Inicial</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Data Final</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={clearFilters}
                                        className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors"
                                    >
                                        <X size={14} />
                                        Limpar Filtros
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-slate-500 uppercase">
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Descrição / Origem</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Calendar size={48} className="mb-2 text-gray-300" />
                                            <p>Nenhuma transação encontrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Calendar size={16} className="text-slate-400" />
                                                <span>{formatDate(tx.date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{tx.description}</div>
                                            {tx.notes && (
                                                <div className="text-xs text-slate-500 mt-0.5">{tx.notes}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className="px-2.5 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: tx.category?.color ? tx.category.color + '20' : '#F3F4F6',
                                                    color: tx.category?.color || '#6B7280'
                                                }}
                                            >
                                                {tx.category?.name || 'Geral'}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewTransaction(tx)}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded"
                                                    title="Visualizar Detalhes"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenTransactionModal(tx)}
                                                    className="text-slate-400 hover:text-orange-600 transition-colors p-1 hover:bg-orange-50 rounded"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
                                                            deleteTransaction(tx.id);
                                                        }
                                                    }}
                                                    className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Summary */}
                {filteredTransactions.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-sm">
                        <span className="text-slate-600">
                            Mostrando <span className="font-semibold text-slate-800">{filteredTransactions.length}</span> transação(ões)
                        </span>
                    </div>
                )}
            </div>

            {/* Modals */}
            <TransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                onSave={handleSaveTransaction}
                transaction={selectedTransaction}
                accounts={accounts}
                categories={categories}
            />

            <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSave={addAccount}
            />

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSave={addCategory}
            />

            <TransactionDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                transaction={viewingTransaction}
            />
        </div>
    );
};

export default Finance;
