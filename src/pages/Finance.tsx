import React, { useState, useMemo } from 'react';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Activity,
    Wallet,
    DollarSign,
    Filter,
    Calendar,
    Search,
    Download,
    X,
    Eye,
    Trash2,
    Pencil,
    ShieldCheck,
    Check,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Building2,
    ClipboardList,
    FileSpreadsheet,
    ArrowRightLeft
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useFinance, FinancialTransaction, FinancialRequest } from '../hooks/useFinance';
import TransactionModal from '../components/modals/TransactionModal';
import AccountModal from '../components/modals/AccountModal';
import CategoryModal from '../components/modals/CategoryModal';
import TransactionDetailsModal from '../components/modals/TransactionDetailsModal';
import { useAuth } from '../contexts/AuthContext';
import { useDepartments } from '../hooks/useDepartments';
import FinanceRequestModal from '../components/modals/FinanceRequestModal';
import ImportFinanceModal from '../components/modals/ImportFinanceModal';
import TransferModal from '../components/modals/TransferModal';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { formatAOA } from '../utils/currency';
import { toast } from 'sonner';
import GenericDeleteModal from '../components/modals/GenericDeleteModal';

const Finance = () => {
    const { hasPermission, user } = useAuth();

    // Permission check
    const canView = hasPermission('finances_view');

    // Hooks need to be called unconditionally, so we just condition the return render
    const {
        transactions,
        accounts,
        categories,
        requests,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteMultipleTransactions,
        bulkAddTransactions,
        transferFunds,
        addAccount,
        addCategory,
        addRequest,
        payRequest,
        updateRequest,
        deleteRequest,
        deleteMultipleRequests
    } = useFinance();

    // Debug log to help identify why the page might be blank for some users
    console.log('[Finance] State:', { userId: user?.id, churchId: user?.churchId, canView, loading });

    const { departments } = useDepartments();

    const [searchParams] = useSearchParams();
    const currentView = searchParams.get('view') || 'transactions';

    // Filters State for Transactions
    const [filterType, setFilterType] = useState<'All' | 'income' | 'expense'>('All');
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterAccount, setFilterAccount] = useState<string>('All');
    const [showFilters, setShowFilters] = useState(false);

    // Filters State for Requests
    const [requestSearch, setRequestSearch] = useState('');
    const [requestStatusFilter, setRequestStatusFilter] = useState<'All' | 'pending' | 'approved' | 'rejected' | 'paid'>('All');
    const [requestDeptFilter, setRequestDeptFilter] = useState<string>('All');

    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [requestToPay, setRequestToPay] = useState<FinancialRequest | null>(null);
    const [selectedPayAccountId, setSelectedPayAccountId] = useState('');
    const [selectedPayDate, setSelectedPayDate] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<FinancialRequest | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | undefined>(undefined);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingTransaction, setViewingTransaction] = useState<FinancialTransaction | undefined>(undefined);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    
    // Selection state
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
    const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string | string[]; name: string; type: 'transaction' | 'request' | 'bulk_transactions' | 'bulk_requests' } | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Reset to page 1 when filters or view change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filterType, filterCategory, filterAccount, searchTerm, startDate, endDate, requestStatusFilter, requestDeptFilter, requestSearch, currentView]);

    const handleViewTransaction = (transaction: FinancialTransaction) => {
        setViewingTransaction(transaction);
        setIsDetailsModalOpen(true);
    };

    // Filter Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesType = filterType === 'All' || t.type === filterType;
            const matchesCategory = filterCategory === 'All' || t.category_id === filterCategory;
            const matchesAccount = filterAccount === 'All' || t.account_id === filterAccount;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (t.description?.toLowerCase() || '').includes(searchLower) ||
                (t.category?.name?.toLowerCase() || '').includes(searchLower);

            const transactionDate = new Date(t.date);
            const matchesStartDate = !startDate || transactionDate >= new Date(startDate);
            const matchesEndDate = !endDate || transactionDate <= new Date(endDate);

            return matchesType && matchesCategory && matchesAccount && matchesSearch && matchesStartDate && matchesEndDate;
        });
    }, [transactions, filterType, filterCategory, filterAccount, searchTerm, startDate, endDate]);

    // Paginated Transactions
    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(start, start + itemsPerPage);
    }, [filteredTransactions, currentPage, itemsPerPage]);

    const totalTransactionPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Filter Requests
    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            const matchesStatus = requestStatusFilter === 'All' || r.status === requestStatusFilter;
            const matchesDept = requestDeptFilter === 'All' || r.department_id === requestDeptFilter;
            const searchLower = requestSearch.toLowerCase();
            const matchesSearch =
                (r.title?.toLowerCase() || '').includes(searchLower) ||
                (r.description?.toLowerCase() || '').includes(searchLower) ||
                (r.department?.name?.toLowerCase() || '').includes(searchLower);

            return matchesStatus && matchesDept && matchesSearch;
        });
    }, [requests, requestStatusFilter, requestDeptFilter, requestSearch]);

    // Paginated Requests
    const paginatedRequests = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRequests.slice(start, start + itemsPerPage);
    }, [filteredRequests, currentPage, itemsPerPage]);

    const totalRequestPages = Math.ceil(filteredRequests.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatCurrency = (value: number) => formatAOA(value);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        // Append time to prevent UTC shift when parsing YYYY-MM-DD
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Summary Calculations
    const totals = useMemo(() => {
        return filteredTransactions.reduce((acc, curr) => {
            if (curr.type === 'income') acc.income += Number(curr.amount);
            else acc.expense += Number(curr.amount);
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredTransactions]);

    const balance = totals.income - totals.expense;
    const totalAccountBalance = accounts.reduce((acc, curr) => acc + Number(curr.current_balance || 0), 0);

    const handleOpenTransactionModal = (transaction?: FinancialTransaction) => {
        setSelectedTransaction(transaction);
        setIsTransactionModalOpen(true);
    };

    const handleOpenRequestModal = (request?: FinancialRequest) => {
        setSelectedRequest(request || null);
        setIsRequestModalOpen(true);
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
        setFilterAccount('All');
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
    };

    const handleExport = (format: 'pdf' | 'excel') => {
        const summary = {
            totalIncome: filteredTransactions
                .filter(t => t.type === 'income')
                .reduce((acc, t) => acc + Number(t.amount), 0),
            totalExpense: filteredTransactions
                .filter(t => t.type === 'expense')
                .reduce((acc, t) => acc + Number(t.amount), 0),
            balance: 0
        };
        summary.balance = summary.totalIncome - summary.totalExpense;

        const exportParams = {
            transactions: filteredTransactions,
            categories,
            churchName: user?.churchName || 'Minha Igreja',
            summary,
            filters: {
                type: filterType,
                category: filterCategory === 'All' ? 'Todas' : (categories.find(c => c.id === filterCategory)?.name || 'Desconhecido'),
                account: filterAccount === 'All' ? 'Todas' : (accounts.find(a => a.id === filterAccount)?.name || 'Desconhecida'),
                startDate,
                endDate
            }
        };

        try {
            if (format === 'pdf') {
                exportToPDF(exportParams);
            } else {
                exportToExcel(exportParams);
            }
            toast.success(`Exportação ${format.toUpperCase()} iniciada!`);
            setIsExportMenuOpen(false);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Erro ao exportar arquivo.');
        }
    };

    const handleUpdateStatus = async (requestId: string, newStatus: 'approved' | 'rejected' | 'paid') => {
        const updateData: any = { status: newStatus };
        if (newStatus === 'approved') {
            updateData.approval_date = new Date().toISOString();
        }

        const success = await updateRequest(requestId, updateData);
        if (success) {
            toast.success(`Status atualizado para ${newStatus}`);
        } else {
            toast.error('Erro ao atualizar status.');
        }
    };

    const handlePayRequestClick = (request: FinancialRequest) => {
        setRequestToPay(request);
        setSelectedPayDate(new Date().toISOString().split('T')[0]);
        // Pre-select first account if available
        if (accounts.length > 0) {
            setSelectedPayAccountId(accounts[0].id);
        }
        setIsPayModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!requestToPay || !selectedPayAccountId || !selectedPayDate) return;

        const success = await payRequest(requestToPay.id, selectedPayAccountId, selectedPayDate);
        if (success) {
            toast.success('Pagamento efetuado e despesa registrada!');
            setIsPayModalOpen(false);
            setRequestToPay(null);
        } else {
            toast.error('Erro ao processar pagamento.');
        }
    };

    const handleSaveRequest = async (data: any) => {
        let success;
        if (selectedRequest) {
            success = await updateRequest(selectedRequest.id, data);
        } else {
            success = await addRequest(data);
        }

        if (success) {
            toast.success(selectedRequest ? 'Requisição atualizada!' : 'Requisição enviada com sucesso!');
            setIsRequestModalOpen(false);
            setSelectedRequest(null);
        } else {
            toast.error('Erro ao salvar requisição.');
        }
        return success;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="text-green-500 w-4 h-4" />;
            case 'rejected': return <XCircle className="text-red-500 w-4 h-4" />;
            case 'paid': return <Check className="text-blue-500 w-4 h-4" />;
            default: return <Clock className="text-orange-500 w-4 h-4" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Aprovada';
            case 'rejected': return 'Rejeitada';
            case 'paid': return 'Paga';
            default: return 'Pendente';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            case 'paid': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-orange-50 text-orange-700 border-orange-200';
        }
    };

    // Bulk Delete Handlers
    const handleBulkDeleteTransactions = () => {
        if (!selectedTransactions.length) return;
        setItemToDelete({
            id: selectedTransactions,
            name: `${selectedTransactions.length} transações`,
            type: 'bulk_transactions'
        });
        setIsDeleteModalOpen(true);
    };

    const handleBulkDeleteRequests = () => {
        if (!selectedRequests.length) return;
        setItemToDelete({
            id: selectedRequests,
            name: `${selectedRequests.length} requisições`,
            type: 'bulk_requests'
        });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            let success = false;
            if (itemToDelete.type === 'bulk_transactions') {
                success = await deleteMultipleTransactions(itemToDelete.id as string[]);
                if (success) {
                    toast.success('Transações apagadas com sucesso!');
                    setSelectedTransactions([]);
                }
            } else if (itemToDelete.type === 'bulk_requests') {
                success = await deleteMultipleRequests(itemToDelete.id as string[]);
                if (success) {
                    toast.success('Requisições apagadas com sucesso!');
                    setSelectedRequests([]);
                }
            } else if (itemToDelete.type === 'transaction') {
                success = await deleteTransaction(itemToDelete.id as string);
                if (success) toast.success('Transação apagada com sucesso!');
            } else if (itemToDelete.type === 'request') {
                success = await deleteRequest(itemToDelete.id as string);
                if (success) toast.success('Requisição apagada com sucesso!');
            }

            if (!success && itemToDelete.type !== 'bulk_transactions' && itemToDelete.type !== 'bulk_requests') {
                toast.error('Erro ao excluir item.');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Erro ao processar exclusão.');
        }

        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const toggleTransactionSelection = (id: string) => {
        setSelectedTransactions(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleRequestSelection = (id: string) => {
        setSelectedRequests(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleAllTransactions = () => {
        if (selectedTransactions.length === filteredTransactions.length) {
            setSelectedTransactions([]);
        } else {
            setSelectedTransactions(filteredTransactions.map(t => t.id));
        }
    };

    const toggleAllRequests = () => {
        if (selectedRequests.length === filteredRequests.length) {
            setSelectedRequests([]);
        } else {
            setSelectedRequests(filteredRequests.map(r => r.id));
        }
    };

    const hasActiveFilters = filterType !== 'All' || filterCategory !== 'All' || filterAccount !== 'All' || searchTerm !== '' || startDate !== '' || endDate !== '';

    // If no permission, return Access Denied immediately
    if (!canView) {
        return (
            <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
                <p className="text-slate-600">Você não tem permissão para acessar o módulo financeiro.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-slate-500 font-medium animate-pulse">Carregando dados financeiros...</p>
            </div>
        );
    }

    // Helpers moved to Dashboard

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
            {/* Header ... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* ... */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        {currentView === 'requests' ? 'Requisições de Departamentos' : 'Finanças'}
                    </h1>
                    <p className="text-slate-600 mt-1">
                        {currentView === 'requests'
                            ? 'Acompanhamento e aprovação de solicitações de budget'
                            : 'Gestão financeira, dízimos, ofertas e despesas'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAccountModalOpen(true)}
                        className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium shadow-sm"
                    >
                        <Building2 size={18} className="text-slate-400" />
                        Contas
                    </button>
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium shadow-sm"
                    >
                        <Filter size={18} className="text-slate-400" />
                        Categorias
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium shadow-sm"
                        >
                            <Download size={18} />
                            Exportar
                        </button>

                        {isExportMenuOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors"
                                >
                                    <div className="p-1.5 bg-red-50 text-red-600 rounded">
                                        <Download size={14} />
                                    </div>
                                    Extrato em PDF
                                </button>
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors"
                                >
                                    <div className="p-1.5 bg-green-50 text-green-600 rounded">
                                        <Download size={14} />
                                    </div>
                                    Planilha Excel
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium shadow-sm"
                    >
                        <FileSpreadsheet size={18} className="text-slate-400" />
                        Importar
                    </button>
                    {currentView === 'transactions' && (
                        <button
                            onClick={() => setIsTransferModalOpen(true)}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <ArrowRightLeft size={18} />
                            Transferir
                        </button>
                    )}
                    {currentView === 'requests' ? (
                        <button
                            onClick={() => handleOpenRequestModal()}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            Nova Requisição
                        </button>
                    ) : (
                        <button
                            onClick={() => handleOpenTransactionModal()}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            Nova Transação
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Receitas</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Receitas</p>
                    <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totals.income)}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <TrendingDown size={24} />
                        </div>
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Despesas</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Despesas</p>
                    <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totals.expense)}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Balanço</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Balanço do Período</p>
                    <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(balance)}
                    </h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <Wallet size={24} />
                        </div>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Patrimônio</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Saldo Total em Contas</p>
                    <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalAccountBalance)}</h3>
                </div>
            </div>

            {currentView === 'requests' ? (
                /* Consolidated Requests View */
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50/50 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <ClipboardList className="text-orange-500" />
                                Requisições de Budget
                            </h3>
                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                {selectedRequests.length > 0 && (
                                    <button
                                        onClick={handleBulkDeleteRequests}
                                        className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-200 transition-all animate-in fade-in zoom-in duration-200"
                                    >
                                        <Trash2 size={16} />
                                        Apagar {selectedRequests.length}
                                    </button>
                                )}
                                <div className="relative flex-1 md:w-64 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar requisições..."
                                        value={requestSearch}
                                        onChange={(e) => setRequestSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    />
                                </div>
                                <select
                                    value={requestStatusFilter}
                                    onChange={(e) => setRequestStatusFilter(e.target.value as any)}
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                >
                                    <option value="All">Todos Status</option>
                                    <option value="pending">Pendentes</option>
                                    <option value="approved">Aprovadas</option>
                                    <option value="rejected">Rejeitadas</option>
                                    <option value="paid">Pagas</option>
                                </select>
                                <select
                                    value={requestDeptFilter}
                                    onChange={(e) => setRequestDeptFilter(e.target.value)}
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none min-w-[150px]"
                                >
                                    <option value="All">Todos Departamentos</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-slate-500 uppercase">
                                    <th className="px-6 py-4 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                                            checked={filteredRequests.length > 0 && selectedRequests.length === filteredRequests.length}
                                            onChange={toggleAllRequests}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Departamento</th>
                                    <th className="px-6 py-4">Título / Descrição</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            Nenhuma requisição encontrada com os filtros selecionados.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRequests.map((request) => (
                                        <tr key={request.id} className={`hover:bg-gray-50 transition-colors ${selectedRequests.includes(request.id) ? 'bg-orange-50/50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                                                    checked={selectedRequests.includes(request.id)}
                                                    onChange={() => toggleRequestSelection(request.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600" onClick={() => toggleRequestSelection(request.id)}>
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-medium text-slate-800">
                                                    <Building2 size={16} className="text-slate-400" />
                                                    {request.department?.name || 'Geral'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{request.title}</div>
                                                <div className="text-xs text-slate-500 line-clamp-1">{request.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-800 text-lg">
                                                {formatCurrency(request.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusClass(request.status)}`}>
                                                    {getStatusIcon(request.status)}
                                                    {getStatusLabel(request.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(request.id, 'approved')}
                                                                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                                                                title="Aprovar"
                                                            >
                                                                <CheckCircle2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(request.id, 'rejected')}
                                                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                                                title="Negar"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {request.status === 'approved' && (
                                                        <button
                                                            onClick={() => handlePayRequestClick(request)}
                                                            className="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                                        >
                                                            <CheckCircle2 size={12} /> Efetuar Pagamento
                                                        </button>
                                                    )}
                                                    {request.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleOpenRequestModal(request)}
                                                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-100"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setItemToDelete({ id: request.id, name: request.title, type: 'request' });
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Requests Pagination Footer */}
                    {filteredRequests.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
                            <span className="text-slate-600 order-2 sm:order-1">
                                Mostrando <span className="font-semibold text-slate-800">{paginatedRequests.length}</span> de <span className="font-semibold text-slate-800">{filteredRequests.length}</span> requisições
                            </span>
                            
                            {totalRequestPages > 1 && (
                                <div className="flex items-center gap-1 order-1 sm:order-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-slate-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                    >
                                        Anterior
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalRequestPages)].map((_, i) => {
                                            const page = i + 1;
                                            if (
                                                page === 1 || 
                                                page === totalRequestPages || 
                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all ${
                                                            currentPage === page 
                                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-200' 
                                                                : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                return <span key={page} className="px-1 text-slate-400">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalRequestPages}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-slate-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* Transactions View */
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800">Transações</h3>
                            <div className="flex gap-2 w-full md:w-auto">
                                {selectedTransactions.length > 0 && (
                                    <button
                                        onClick={handleBulkDeleteTransactions}
                                        className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-200 transition-all animate-in fade-in zoom-in duration-200"
                                    >
                                        <Trash2 size={16} />
                                        Apagar {selectedTransactions.length}
                                    </button>
                                )}
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
                                    {hasActiveFilters && (
                                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Filters Area */}
                        {showFilters && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Conta Bancária</label>
                                        <select
                                            value={filterAccount}
                                            onChange={(e) => setFilterAccount(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        >
                                            <option value="All">Todas as Contas</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>

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
                                    <th className="px-6 py-4 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                                            checked={filteredTransactions.length > 0 && selectedTransactions.length === filteredTransactions.length}
                                            onChange={toggleAllTransactions}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Descrição</th>
                                    <th className="px-6 py-4">Conta</th>
                                    <th className="px-6 py-4">Categoria</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                    <th className="px-6 py-4 text-right">Saldo</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Calendar size={48} className="mb-2 text-gray-300" />
                                                <p>Nenhuma transação encontrada.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTransactions.map((tx) => (
                                        <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${selectedTransactions.includes(tx.id) ? 'bg-orange-50/50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                                                    checked={selectedTransactions.includes(tx.id)}
                                                    onChange={() => toggleTransactionSelection(tx.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 whitespace-nowrap" onClick={() => toggleTransactionSelection(tx.id)}>
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
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {tx.account?.name || '-'}
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
                                            <td className="px-6 py-4 text-right font-medium text-slate-600">
                                                {tx.running_balance !== undefined ? formatCurrency(tx.running_balance) : '-'}
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
                                                            setItemToDelete({ id: tx.id, name: tx.description, type: 'transaction' });
                                                            setIsDeleteModalOpen(true);
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

                    {/* Transactions Pagination Footer */}
                    {filteredTransactions.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
                            <span className="text-slate-600 order-2 sm:order-1">
                                Mostrando <span className="font-semibold text-slate-800">{paginatedTransactions.length}</span> de <span className="font-semibold text-slate-800">{filteredTransactions.length}</span> transações
                            </span>

                            {totalTransactionPages > 1 && (
                                <div className="flex items-center gap-1 order-1 sm:order-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-slate-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                    >
                                        Anterior
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalTransactionPages)].map((_, i) => {
                                            const page = i + 1;
                                            if (
                                                page === 1 || 
                                                page === totalTransactionPages || 
                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all ${
                                                            currentPage === page 
                                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-200' 
                                                                : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                return <span key={page} className="px-1 text-slate-400">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalTransactionPages}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-slate-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <GenericDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName={typeof itemToDelete?.name === 'string' ? itemToDelete.name : ''}
                itemType={
                    itemToDelete?.type === 'transaction' ? 'transação' :
                    itemToDelete?.type === 'request' ? 'requisição' :
                    itemToDelete?.type === 'bulk_transactions' ? 'transações selecionadas' :
                    'requisições selecionadas'
                }
            />

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

            <FinanceRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => {
                    setIsRequestModalOpen(false);
                    setSelectedRequest(null);
                }}
                onSave={handleSaveRequest}
                categories={categories}
                departments={departments}
                request={selectedRequest}
            />

            <ImportFinanceModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                accounts={accounts}
                categories={categories}
                onImportBulk={bulkAddTransactions}
            />

            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                accounts={accounts}
                onTransfer={transferFunds}
            />

            {/* Payment Confirmation Modal */}
            {isPayModalOpen && requestToPay && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">Confirmar Pagamento</h3>
                            <button onClick={() => setIsPayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <p className="text-sm text-orange-800 font-medium">Você está registrando o pagamento de:</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">{requestToPay.title}</p>
                                <p className="text-2xl font-black text-orange-600 mt-2">{formatCurrency(requestToPay.amount)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 label text-left">Data do Pagamento</label>
                                <input
                                    type="date"
                                    value={selectedPayDate}
                                    onChange={(e) => setSelectedPayDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 label text-left">Selecionar Conta de Origem</label>
                                <select
                                    value={selectedPayAccountId}
                                    onChange={(e) => setSelectedPayAccountId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-slate-800"
                                >
                                    <option value="">Selecione uma conta...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} - ({formatCurrency(acc.current_balance)})</option>
                                    ))}
                                </select>
                            </div>

                            <p className="text-xs text-gray-500 text-center italic">
                                Ao confirmar, uma transação de despesa será criada automaticamente no histórico financeiro.
                            </p>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setIsPayModalOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-slate-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                disabled={!selectedPayAccountId}
                                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar e Pagar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
