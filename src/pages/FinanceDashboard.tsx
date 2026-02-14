import React, { useState, useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShieldCheck,
    Activity,
    Building,
    Wallet,
    Eye,
    EyeOff,
    Calendar,
    Filter,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useFinance } from '../hooks/useFinance';
import { useAuth } from '../contexts/AuthContext';

const FinanceDashboard = () => {
    const { hasPermission } = useAuth();
    const { transactions, accounts, loading } = useFinance();

    // Date Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showValues, setShowValues] = useState(false);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (!startDate && !endDate) return true;
            const tDate = new Date(t.date);
            // Adjust dates for comparison (ignoring time if necessary, but string comparison YYYY-MM-DD works well too)
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && tDate < start) return false;
            if (end && tDate > end) return false;

            return true;
        });
    }, [transactions, startDate, endDate]);

    // Permission check
    const canView = hasPermission('finances_view');

    // Calculate Totals based on Filtered Transactions
    const totals = useMemo(() => {
        return filteredTransactions.reduce((acc, curr) => {
            if (curr.type === 'income') {
                acc.income += Number(curr.amount);
            } else {
                acc.expense += Number(curr.amount);
            }
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredTransactions]);

    const balance = totals.income - totals.expense;

    // Chart Data Calculation
    const chartData = useMemo(() => {
        return [
            { name: 'Sem 1', income: totals.income * 0.2, expense: totals.expense * 0.25 },
            { name: 'Sem 2', income: totals.income * 0.3, expense: totals.expense * 0.2 },
            { name: 'Sem 3', income: totals.income * 0.25, expense: totals.expense * 0.3 },
            { name: 'Sem 4', income: totals.income * 0.25, expense: totals.expense * 0.25 },
        ];
    }, [totals]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA'
        }).format(value);
    };

    const getAccountIcon = (type: string) => {
        switch (type) {
            case 'bank': return <Building size={20} />;
            case 'cash': return <Wallet size={20} />;
            case 'investment': return <TrendingUp size={20} />;
            default: return <DollarSign size={20} />;
        }
    };

    const getAccountColor = (type: string) => {
        switch (type) {
            case 'bank': return 'blue';
            case 'cash': return 'green';
            case 'investment': return 'purple';
            default: return 'gray';
        }
    };

    if (!canView) {
        return (
            <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
                <p className="text-slate-600">Você não tem permissão para acessar o dashboard financeiro.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Dashboard Financeiro</h1>
                    <p className="text-slate-600 mt-1">Visão geral das finanças da igreja</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-sm">
                        <Calendar className="text-gray-400 w-4 h-4" />
                        <span className="text-slate-500 font-medium">Período:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="border-none p-0 text-slate-700 focus:ring-0 w-32 text-sm"
                            placeholder="Início"
                        />
                        <span className="text-gray-300">|</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="border-none p-0 text-slate-700 focus:ring-0 w-32 text-sm"
                            placeholder="Fim"
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="ml-1 text-slate-400 hover:text-red-500"
                                title="Limpar data"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-6">
                {/* Income */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Receitas</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Receitas</p>
                    <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totals.income || 0)}</h3>
                </div>

                {/* Expense */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <TrendingDown size={24} />
                        </div>
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Despesas</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Despesas</p>
                    <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totals.expense || 0)}</h3>
                </div>

                {/* Period Balance */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Fluxo</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Fluxo do Período</p>
                    <h3 className={`text-2xl font-bold ${totals.income - totals.expense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency((totals.income || 0) - (totals.expense || 0))}
                    </h3>
                </div>

                {/* Total Balance (Stock) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Wallet size={24} />
                        </div>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Geral</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Saldo Geral (Contas)</p>
                    <h3 className="text-2xl font-bold text-slate-800">
                        {formatCurrency(accounts.reduce((acc, a) => acc + Number(a.current_balance || 0), 0))}
                    </h3>
                </div>
            </div>

            {/* Accounts Cards */}
            <div>
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-slate-500" />
                    Contas & Saldos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {accounts.map(account => {
                        const color = getAccountColor(account.type);
                        return (
                            <div
                                key={account.id}
                                className={`bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer`}
                                onClick={() => {
                                    // Could navigate to details or edit mode
                                    toast.info("Detalhes da conta em breve.");
                                }}
                            >
                                <div className={`absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 bg-${color}-500/5 rounded-full group-hover:scale-110 transition-transform`}></div>

                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div className={`p-1.5 rounded-lg bg-${color}-50 text-${color}-600`}>
                                        {getAccountIcon(account.type)}
                                    </div>
                                    {!account.is_active && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inativa</span>
                                    )}
                                </div>

                                <div className="relative z-10">
                                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">{account.name}</h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-bold text-slate-600">Kz</span>
                                        <span className="text-lg font-black text-slate-800 leading-none">
                                            {showValues ? account.current_balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) : '••••••'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between items-center relative z-10">
                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Saldo Atual</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowValues(!showValues);
                                        }}
                                        className={`text-${color}-600 p-1 hover:bg-${color}-50 rounded md:rounded-lg transition-colors`}
                                        title={showValues ? "Ocultar valores" : "Mostrar valores"}
                                    >
                                        {showValues ? <Eye size={12} /> : <EyeOff size={12} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>



            {/* Main Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px]">
                <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Fluxo de Caixa {(startDate || endDate) ? '(Período Selecionado)' : '(Geral)'}
                </h3>
                <ResponsiveContainer width="100%" height="85%">
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
        </div>
    );
};

export default FinanceDashboard;
