import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Filter, Plus, TrendingUp, TrendingDown, DollarSign, Search, Calendar, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Transaction, TransactionCategory } from '../types';
import TransactionModal from '../components/modals/TransactionModal';
import { MOCK_MEMBERS } from '../mocks/members';

import { MOCK_CATEGORIES } from '../mocks/finance';

const INITIAL_TRANSACTIONS: Transaction[] = [
    { id: '1', type: 'Income', categoryId: '1', amount: 150000, date: '2024-01-28', source: 'Member', sourceId: '1', sourceName: 'Eleanor Pena', description: 'Dízimo mensal' },
    { id: '2', type: 'Income', categoryId: '2', amount: 45000, date: '2024-01-28', source: 'Service', sourceId: '1', sourceName: 'Culto de Domingo', description: 'Oferta do culto' },
    { id: '3', type: 'Expense', categoryId: '4', amount: 250000, date: '2024-01-25', source: 'Other', sourceName: 'Imobiliária Central', description: 'Aluguel do templo' },
    { id: '4', type: 'Expense', categoryId: '5', amount: 35000, date: '2024-01-20', source: 'Other', sourceName: 'ENDE', description: 'Conta de luz' },
    { id: '5', type: 'Income', categoryId: '3', amount: 500000, date: '2024-01-15', source: 'Member', sourceId: '2', sourceName: 'Jacob Jones', description: 'Doação para construção' },
    { id: '6', type: 'Income', categoryId: '1', amount: 120000, date: '2024-01-10', source: 'Member', sourceId: '3', sourceName: 'Kristin Watson', description: 'Dízimo mensal' },
    { id: '7', type: 'Expense', categoryId: '7', amount: 180000, date: '2024-01-05', source: 'Other', sourceName: 'Funcionários', description: 'Salários mensais' },
];

const Finances: React.FC = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const handleViewDetails = (transactionId: string) => {
        navigate(`/finances/${transactionId}`);
    };

    // Cálculos do Dashboard
    const totalIncome = transactions
        .filter(t => t.type === 'Income')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'Expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const balance = totalIncome - totalExpense;

    // Dados para o gráfico (simulado por mês ou dia)
    const chartData = [
        { name: 'Sem 1', income: 450000, expense: 200000 },
        { name: 'Sem 2', income: 320000, expense: 150000 },
        { name: 'Sem 3', income: 550000, expense: 280000 },
        { name: 'Sem 4', income: 480000, expense: 180000 },
    ];

    const handleSaveTransaction = (transactionData: Transaction | Omit<Transaction, 'id'>) => {
        if ('id' in transactionData && transactions.some(t => t.id === transactionData.id)) {
            setTransactions(prev => prev.map(t => t.id === transactionData.id ? transactionData as Transaction : t));
        } else {
            setTransactions(prev => [transactionData as Transaction, ...prev]);
        }
        setIsModalOpen(false);
        setSelectedTransaction(null);
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleDeleteTransaction = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };

    const getCategoryName = (id: string) => {
        return MOCK_CATEGORIES.find(c => c.id === id)?.name || 'Desconhecido';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const clearFilters = () => {
        setFilterType('All');
        setFilterCategory('All');
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
    };

    const hasActiveFilters = filterType !== 'All' || filterCategory !== 'All' || searchTerm !== '' || startDate !== '' || endDate !== '';

    const filteredTransactions = transactions.filter(t => {
        const matchesType = filterType === 'All' || t.type === filterType;
        const matchesCategory = filterCategory === 'All' || t.categoryId === filterCategory;
        const matchesSearch =
            t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.sourceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getCategoryName(t.categoryId).toLowerCase().includes(searchTerm.toLowerCase());

        // Filtro de data
        const transactionDate = new Date(t.date);
        const matchesStartDate = !startDate || transactionDate >= new Date(startDate);
        const matchesEndDate = !endDate || transactionDate <= new Date(endDate);

        return matchesType && matchesCategory && matchesSearch && matchesStartDate && matchesEndDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Finanças</h1>
                    <p className="text-slate-600 mt-1">Gestão financeira, dízimos, ofertas e despesas</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        onClick={() => { setSelectedTransaction(null); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow"
                    >
                        <Plus size={18} />
                        Nova Transação
                    </button>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="text-green-600 w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-[10px] md:text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12% este mês</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500">Receitas Totais</p>
                    <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalIncome)}</p>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <TrendingDown className="text-red-600 w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-[10px] md:text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">+5% este mês</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500">Despesas Totais</p>
                    <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalExpense)}</p>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-[10px] md:text-xs font-medium text-slate-500">Saldo Atual</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500">Saldo em Caixa</p>
                    <p className={`text-xl md:text-2xl font-bold mt-1 ${balance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
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
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
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

            {/* Transactions List */}
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
                                className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${showFilters || hasActiveFilters
                                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                                    : 'bg-gray-50 border-gray-200 text-slate-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Filter size={18} />
                                Filtros
                                {hasActiveFilters && (
                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Filtros Expandidos */}
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
                                        <option value="Income">Receitas</option>
                                        <option value="Expense">Despesas</option>
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
                                        {MOCK_CATEGORIES.map(cat => (
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
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                                        <div className="flex items-center gap-2 font-medium">
                                            <Calendar size={16} className="text-slate-400" />
                                            <span>{formatDate(tx.date)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">{tx.sourceName || tx.description}</div>
                                        {tx.description && tx.sourceName && (
                                            <div className="text-xs text-slate-500 mt-0.5">{tx.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {getCategoryName(tx.categoryId)}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${tx.type === 'Income' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleViewDetails(tx.id)}
                                            className="text-orange-600 hover:text-orange-800 text-sm font-medium mr-3"
                                        >
                                            Ver Detalhes
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditTransaction(tx); }}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(tx.id); }}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            <Calendar size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>Nenhuma transação encontrada.</p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Resumo dos Resultados Filtrados */}
                {filteredTransactions.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-sm">
                        <span className="text-slate-600">
                            Mostrando <span className="font-semibold text-slate-800">{filteredTransactions.length}</span> transação(ões)
                        </span>
                        <div className="flex gap-6">
                            <span className="text-green-600 font-medium">
                                Receitas: {formatCurrency(filteredTransactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0))}
                            </span>
                            <span className="text-red-600 font-medium">
                                Despesas: {formatCurrency(filteredTransactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0))}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTransaction}
                transaction={selectedTransaction}
                categories={MOCK_CATEGORIES}
                members={MOCK_MEMBERS}
            />
        </div>
    );
};

export default Finances;
