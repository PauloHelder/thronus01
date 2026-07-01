import React, { useState, useMemo, useEffect } from 'react';
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
    ArrowRightLeft,
    ChevronLeft,
    ChevronRight,
    ListChecks
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useFinance, FinancialTransaction, FinancialRequest, FinancialRecurringBill, FinancialPayableInstallment } from '../hooks/useFinance';
import TransactionModal from '../components/modals/TransactionModal';
import PayableModal from '../components/modals/PayableModal';
import PayInstallmentModal from '../components/modals/PayInstallmentModal';
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
import { formatDateForDisplay, parseFlexibleDate } from '../utils/dateUtils';

// ==========================================
// BUDGET ROW COMPONENT
// ==========================================
interface BudgetRowProps {
    category: any;
    planned: number;
    executed: number;
    remaining: number;
    progress: number;
    formatCurrency: (val: number) => string;
}

const BudgetRow: React.FC<BudgetRowProps> = ({
    category,
    planned,
    executed,
    remaining,
    progress,
    formatCurrency
}) => {
    const progressColor = progress <= 75 ? 'bg-green-500' : progress <= 100 ? 'bg-orange-500' : 'bg-red-500';

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-gray-100" style={{ backgroundColor: category.color || '#CBD5E1' }}></span>
                    <span className="font-bold text-slate-800">{category.name}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-right font-semibold text-slate-700">
                {formatCurrency(planned)}
            </td>
            <td className="px-6 py-4 text-right font-semibold text-red-600">
                {formatCurrency(executed)}
            </td>
            <td className={`px-6 py-4 text-right font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(remaining)}
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${progressColor} ${progress > 100 ? 'animate-pulse' : ''}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">{progress.toFixed(1)}%</span>
                </div>
            </td>
        </tr>
    );
};

const Finance = () => {
    const { hasPermission, hasRole, user } = useAuth();

    // Permission check
    const canView = hasPermission('finances_view');
    const canAuthorize = hasPermission('finances_authorize') || hasRole('admin') || hasRole('superuser') || hasPermission('all');
    const canPay = hasPermission('finances_pay') || hasRole('admin') || hasRole('superuser') || hasPermission('all');

    // Hooks need to be called unconditionally, so we just condition the return render
    const {
        transactions,
        accounts,
        categories,
        requests,
        budgets,
        payables,
        installments,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteMultipleTransactions,
        bulkAddTransactions,
        transferFunds,
        addAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        addRequest,
        payRequest,
        updateRequest,
        deleteRequest,
        deleteMultipleRequests,
        saveBudget,
        addRecurringBill,
        payInstallment,
        deleteRecurringBill
    } = useFinance();

    // Debug log to help identify why the page might be blank for some users
    console.log('[Finance] State:', { userId: user?.id, churchId: user?.churchId, canView, loading });

    const { departments } = useDepartments();

    const [searchParams, setSearchParams] = useSearchParams();
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
    const [editingCategory, setEditingCategory] = useState<any | undefined>(undefined);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingTransaction, setViewingTransaction] = useState<FinancialTransaction | undefined>(undefined);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    
    // Payables state
    const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
    const [isPayInstallmentModalOpen, setIsPayInstallmentModalOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<FinancialPayableInstallment | null>(null);
    const [payableSubView, setPayableSubView] = useState<'installments' | 'recurring'>('installments');
    const [payableSearch, setPayableSearch] = useState('');
    const [payableStatusFilter, setPayableStatusFilter] = useState<'All' | 'pending' | 'paid'>('All');
    
    // Selection state
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
    const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string | string[]; name: string; type: 'transaction' | 'request' | 'bulk_transactions' | 'bulk_requests' | 'category' | 'recurring_bill' } | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Budget Month/Year State
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Budget Year/Period State for Tesouraria Orçamento
    const [budgetYearFilter, setBudgetYearFilter] = useState(new Date().getFullYear());
    const [budgetPeriodType, setBudgetPeriodType] = useState<'monthly' | 'quarterly' | 'semesterly' | 'yearly'>('yearly');
    const [budgetPeriodValue, setBudgetPeriodValue] = useState<number>(new Date().getMonth());

    const activeMonths = useMemo(() => {
        if (budgetPeriodType === 'yearly') {
            return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        }
        if (budgetPeriodType === 'monthly') {
            return [budgetPeriodValue];
        }
        if (budgetPeriodType === 'quarterly') {
            if (budgetPeriodValue === 1) return [0, 1, 2];
            if (budgetPeriodValue === 2) return [3, 4, 5];
            if (budgetPeriodValue === 3) return [6, 7, 8];
            return [9, 10, 11];
        }
        if (budgetPeriodType === 'semesterly') {
            if (budgetPeriodValue === 1) return [0, 1, 2, 3, 4, 5];
            return [6, 7, 8, 9, 10, 11];
        }
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    }, [budgetPeriodType, budgetPeriodValue]);

    const handlePrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
    };

    const getMonthName = (m: number) => {
        const months = [
            'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        return months[m];
    };

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
        return formatDateForDisplay(dateStr);
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

    const budgetTotals = useMemo(() => {
        const expenseCategories = categories.filter(c => c.type === 'expense');
        let totalPlanned = 0;
        let totalExecuted = 0;

        expenseCategories.forEach(cat => {
            const planned = installments
                .filter(inst => {
                    if (!inst.recurring_bill || inst.recurring_bill.category_id !== cat.id) return false;
                    const dateParts = inst.due_date.split('-');
                    if (dateParts.length < 2) return false;
                    const y = parseInt(dateParts[0], 10);
                    const m = parseInt(dateParts[1], 10) - 1;
                    return y === budgetYearFilter && activeMonths.includes(m);
                })
                .reduce((sum, inst) => sum + Number(inst.amount), 0);
            totalPlanned += planned;

            const executed = transactions
                .filter(t => {
                    if (t.type !== 'expense' || t.category_id !== cat.id || t.deleted_at) return false;
                    const parts = t.date.split('-');
                    if (parts.length < 2) return false;
                    const y = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10) - 1;
                    return y === budgetYearFilter && activeMonths.includes(m);
                })
                .reduce((sum, t) => sum + Number(t.amount), 0);
            
            totalExecuted += executed;
        });

        const remaining = totalPlanned - totalExecuted;
        const percent = totalPlanned > 0 ? (totalExecuted / totalPlanned) * 100 : 0;

        return {
            planned: totalPlanned,
            executed: totalExecuted,
            remaining,
            percent
        };
    }, [categories, installments, budgetYearFilter, activeMonths, transactions]);

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
        if (!canAuthorize) {
            toast.error('Você não tem permissão para autorizar requisições.');
            return;
        }
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
        if (!canPay) {
            toast.error('Você não tem permissão para efetuar pagamentos.');
            return;
        }
        setRequestToPay(request);
        setSelectedPayDate(parseFlexibleDate(new Date()));
        // Pre-select first account if available
        if (accounts.length > 0) {
            setSelectedPayAccountId(accounts[0].id);
        }
        setIsPayModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!canPay) {
            toast.error('Você não tem permissão para efetuar pagamentos.');
            return;
        }
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
        if (selectedRequest && selectedRequest.id) {
            success = await updateRequest(selectedRequest.id, data);
        } else {
            success = await addRequest(data);
        }

        if (success) {
            toast.success(selectedRequest?.id ? 'Requisição atualizada!' : 'Requisição enviada com sucesso!');
            setIsRequestModalOpen(false);
            setSelectedRequest(null);
        } else {
            toast.error('Erro ao salvar requisição.');
        }
        return success;
    };
    const handleGenerateRequestFromInstallment = (installment: FinancialPayableInstallment) => {
        setSelectedRequest({
            title: `Pgmto: ${installment.recurring_bill?.description || 'Contas a Pagar'} (Parc. ${installment.installment_number})`,
            amount: installment.amount,
            category_id: installment.recurring_bill?.category_id || '',
            department_id: '',
            description: `Solicitação de pagamento gerada a partir do Contas a Pagar "${installment.recurring_bill?.description || 'Contas a Pagar'}" (Parcela ${installment.installment_number} de ${installment.recurring_bill?.occurrences || 1}).`,
            payable_installment_id: installment.id
        } as any);
        setIsRequestModalOpen(true);
    };

    const handleSavePayable = async (billData: any, installmentsData: any[]) => {
        const success = await addRecurringBill(billData, installmentsData);
        if (success) {
            toast.success('Programação de pagamento cadastrada e parcelas geradas com sucesso!');
        } else {
            toast.error('Erro ao cadastrar contas a pagar.');
        }
        return success;
    };

    const handleConfirmInstallmentPayment = async (accountId: string, paymentDate: string) => {
        if (!selectedInstallment) return false;
        const success = await payInstallment(selectedInstallment.id, accountId, paymentDate);
        if (success) {
            toast.success('Pagamento da parcela efetuado e despesa registrada!');
            setIsPayInstallmentModalOpen(false);
            setSelectedInstallment(null);
        } else {
            toast.error('Erro ao processar pagamento da parcela.');
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
            } else if (itemToDelete.type === 'recurring_bill') {
                success = await deleteRecurringBill(itemToDelete.id as string);
                if (success) toast.success('Programação de pagamento apagada com sucesso!');
            } else if (itemToDelete.type === 'category') {
                success = await deleteCategory(itemToDelete.id as string);
                if (success) toast.success('Categoria excluída com sucesso!');
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
                        {currentView === 'requests' ? 'Requisições de Departamentos' : currentView === 'budget' ? 'Orçamento Mensal' : currentView === 'payables' ? 'Contas a Pagar' : currentView === 'categories' ? 'Configurações de Categorias' : 'Tesouraria'}
                    </h1>
                    <p className="text-slate-600 mt-1">
                        {currentView === 'requests'
                            ? 'Acompanhamento e aprovação de solicitações de budget'
                            : currentView === 'budget'
                            ? 'Planejamento e acompanhamento de metas financeiras por categoria de despesa'
                            : currentView === 'payables'
                            ? 'Gestão e agendamento de despesas recorrentes programadas'
                            : currentView === 'categories'
                            ? 'Gerenciamento de categorias de receitas e despesas da igreja'
                            : 'Gestão de tesouraria, dízimos, ofertas e despesas'}
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
                        onClick={() => setSearchParams({ view: 'categories' })}
                        className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors font-medium ${
                            currentView === 'categories'
                                ? 'bg-orange-50 border-orange-200 text-orange-600'
                                : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                        } shadow-sm`}
                    >
                        <Filter size={18} className={currentView === 'categories' ? 'text-orange-500' : 'text-slate-400'} />
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
                    ) : currentView === 'budget' ? (
                        null
                    ) : currentView === 'payables' ? (
                        <button
                            onClick={() => setIsPayableModalOpen(true)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            Programar Pagamento
                        </button>
                    ) : currentView === 'categories' ? (
                        <button
                            onClick={() => {
                                setEditingCategory(undefined);
                                setIsCategoryModalOpen(true);
                            }}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            Nova Categoria
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
            {currentView === 'categories' ? null : currentView === 'budget' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Programado</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Total Programado</p>
                        <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(budgetTotals.planned)}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                <TrendingDown size={24} />
                            </div>
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Despesas</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Total Executado</p>
                        <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(budgetTotals.executed)}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Activity size={24} />
                            </div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Saldo</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Saldo Restante</p>
                        <h3 className={`text-2xl font-bold ${budgetTotals.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(budgetTotals.remaining)}
                        </h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                <Wallet size={24} />
                            </div>
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Consumo</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">% Consumido</p>
                        <h3 className="text-2xl font-bold text-slate-800">{budgetTotals.percent.toFixed(1)}%</h3>
                    </div>
                </div>
            ) : (
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
            )}

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
                                                {formatDateForDisplay(request.created_at)}
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
                                                    {request.status === 'pending' && canAuthorize && (
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
                                                    {request.status === 'approved' && canPay && (
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
            ) : currentView === 'payables' ? (
                /* Accounts Payable View */
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                    <Clock size={24} />
                                </div>
                                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Pendentes</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">Total Pendente</p>
                            <h3 className="text-2xl font-bold text-slate-800">
                                {formatCurrency(
                                    installments
                                        .filter(i => i.status === 'pending')
                                        .reduce((acc, curr) => acc + Number(curr.amount), 0)
                                )}
                            </h3>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                    <AlertCircle size={24} />
                                </div>
                                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Hoje</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">Vence Hoje</p>
                            <h3 className="text-2xl font-bold text-red-600">
                                {formatCurrency(
                                    installments
                                        .filter(i => i.status === 'pending' && i.due_date === parseFlexibleDate(new Date()))
                                        .reduce((acc, curr) => acc + Number(curr.amount), 0)
                                )}
                            </h3>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                    <CheckCircle2 size={24} />
                                </div>
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Pagas</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">Total Pago</p>
                            <h3 className="text-2xl font-bold text-slate-800">
                                {formatCurrency(
                                    installments
                                        .filter(i => i.status === 'paid')
                                        .reduce((acc, curr) => acc + Number(curr.amount), 0)
                                )}
                            </h3>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <Wallet size={24} />
                                </div>
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">Total Programado</p>
                            <h3 className="text-2xl font-bold text-slate-800">
                                {formatCurrency(
                                    installments.reduce((acc, curr) => acc + Number(curr.amount), 0)
                                )}
                            </h3>
                        </div>
                    </div>

                    {/* View Switcher and Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50/50 space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setPayableSubView('installments')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                            payableSubView === 'installments'
                                                ? 'bg-white text-slate-800 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Fluxo de Parcelas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPayableSubView('recurring')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                            payableSubView === 'recurring'
                                                ? 'bg-white text-slate-800 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Contas Programadas
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                                    <div className="relative flex-1 md:w-64 min-w-[200px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar..."
                                            value={payableSearch}
                                            onChange={(e) => setPayableSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
                                        />
                                    </div>
                                    {payableSubView === 'installments' && (
                                        <select
                                            value={payableStatusFilter}
                                            onChange={(e) => setPayableStatusFilter(e.target.value as any)}
                                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                                        >
                                            <option value="All">Todos Status</option>
                                            <option value="pending">Pendentes</option>
                                            <option value="paid">Pagas</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* List rendering */}
                        {payableSubView === 'installments' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="px-6 py-4">Vencimento</th>
                                            <th className="px-6 py-4">Descrição</th>
                                            <th className="px-6 py-4">Categoria</th>
                                            <th className="px-6 py-4">Parcela</th>
                                            <th className="px-6 py-4 text-right">Valor</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {installments
                                            .filter(i => {
                                                const matchesSearch = (i.recurring_bill?.description || '').toLowerCase().includes(payableSearch.toLowerCase());
                                                const matchesStatus = payableStatusFilter === 'All' || i.status === payableStatusFilter;
                                                return matchesSearch && matchesStatus;
                                            })
                                            .length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                                                    Nenhuma parcela encontrada.
                                                </td>
                                            </tr>
                                        ) : (
                                            installments
                                                .filter(i => {
                                                    const matchesSearch = (i.recurring_bill?.description || '').toLowerCase().includes(payableSearch.toLowerCase());
                                                    const matchesStatus = payableStatusFilter === 'All' || i.status === payableStatusFilter;
                                                    return matchesSearch && matchesStatus;
                                                })
                                                .map((inst) => {
                                                    const isOverdue = inst.status === 'pending' && new Date(inst.due_date) < new Date(parseFlexibleDate(new Date()));
                                                    return (
                                                        <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Calendar size={14} className="text-slate-400" />
                                                                    <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                                                                        {formatDate(inst.due_date)}
                                                                    </span>
                                                                    {isOverdue && (
                                                                        <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Atrasada</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-slate-800">{inst.recurring_bill?.description || 'Sem Descrição'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium">
                                                                <span
                                                                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                                                    style={{
                                                                        backgroundColor: inst.recurring_bill?.category?.color ? inst.recurring_bill.category.color + '20' : '#F3F4F6',
                                                                        color: inst.recurring_bill?.category?.color || '#6B7280'
                                                                    }}
                                                                >
                                                                    {inst.recurring_bill?.category?.name || 'Despesa'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                                                {inst.installment_number} de {inst.recurring_bill?.occurrences || 1}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-extrabold text-slate-800">
                                                                {formatCurrency(inst.amount)}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                {(() => {
                                                                    const assocReq = requests.find(r => r.payable_installment_id === inst.id && !r.deleted_at);
                                                                    if (inst.status === 'paid') {
                                                                        return (
                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-green-50 text-green-700 border-green-200">
                                                                                <Check size={12} /> Pago
                                                                            </span>
                                                                        );
                                                                    }
                                                                    if (assocReq) {
                                                                        if (assocReq.status === 'pending') {
                                                                            return (
                                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-yellow-50 text-yellow-700 border-yellow-200">
                                                                                    <Clock size={12} /> Aguardando Aprovação
                                                                                </span>
                                                                            );
                                                                        }
                                                                        if (assocReq.status === 'approved') {
                                                                            return (
                                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200">
                                                                                    <Clock size={12} /> Aprovada (Aguardando Pgto)
                                                                                </span>
                                                                            );
                                                                        }
                                                                        if (assocReq.status === 'rejected') {
                                                                            return (
                                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-red-50 text-red-700 border-red-200">
                                                                                    <X size={12} /> Solicitação Recusada
                                                                                </span>
                                                                            );
                                                                        }
                                                                    }
                                                                    return (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-orange-50 text-orange-700 border-orange-200">
                                                                            <Clock size={12} /> Pendente
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                {(() => {
                                                                    const assocReq = requests.find(r => r.payable_installment_id === inst.id && !r.deleted_at);
                                                                    if (inst.status === 'paid') {
                                                                        return (
                                                                            <span className="text-xs text-slate-400 font-medium">Pago em {formatDate(inst.paid_at)}</span>
                                                                        );
                                                                    }
                                                                    if (assocReq) {
                                                                        if (assocReq.status === 'pending' || assocReq.status === 'approved') {
                                                                            return (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setSearchParams({ view: 'requests' })}
                                                                                    className="px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold transition-all border border-yellow-200 flex items-center gap-1 mx-auto"
                                                                                >
                                                                                    Ver Requisição
                                                                                </button>
                                                                            );
                                                                        }
                                                                        if (assocReq.status === 'rejected') {
                                                                            return (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleGenerateRequestFromInstallment(inst)}
                                                                                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto"
                                                                                >
                                                                                    <Check size={12} /> Solicitar Novamente
                                                                                </button>
                                                                            );
                                                                        }
                                                                    }
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleGenerateRequestFromInstallment(inst)}
                                                                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto"
                                                                        >
                                                                            <Check size={12} /> Solicitar Pagamento
                                                                        </button>
                                                                    );
                                                                })()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* Recurring configurations list */
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="px-6 py-4">Descrição</th>
                                            <th className="px-6 py-4">Categoria</th>
                                            <th className="px-6 py-4">Periodicidade</th>
                                            <th className="px-6 py-4">Início</th>
                                            <th className="px-6 py-4">Fim</th>
                                            <th className="px-6 py-4 text-center">Parcelas</th>
                                            <th className="px-6 py-4 text-right">Valor Parcela</th>
                                            <th className="px-6 py-4 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {payables.filter(p => p.description.toLowerCase().includes(payableSearch.toLowerCase())).length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-medium">
                                                    Nenhuma programação de conta recorrente encontrada.
                                                </td>
                                            </tr>
                                        ) : (
                                            payables
                                                .filter(p => p.description.toLowerCase().includes(payableSearch.toLowerCase()))
                                                .map((bill) => (
                                                    <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-slate-800">
                                                            {bill.description}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium">
                                                            <span
                                                                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                                                style={{
                                                                    backgroundColor: bill.category?.color ? bill.category.color + '20' : '#F3F4F6',
                                                                    color: bill.category?.color || '#6B7280'
                                                                }}
                                                            >
                                                                {bill.category?.name || 'Despesa'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-slate-600 capitalize">
                                                            {bill.periodicity}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600 font-semibold">
                                                            {formatDate(bill.start_date)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600 font-semibold">
                                                            {formatDate(bill.end_date)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                                                            {bill.occurrences}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-extrabold text-slate-800">
                                                            {formatCurrency(bill.amount)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setItemToDelete({ id: bill.id, name: bill.description, type: 'recurring_bill' });
                                                                    setIsDeleteModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"
                                                                title="Excluir Programação"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : currentView === 'budget' ? (
                /* Budget View */
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                    <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <ListChecks className="text-orange-500 animate-pulse-slow" />
                                Planejamento de Despesas
                            </h3>
                            
                            {/* Filters for Budget: Year and Period */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Ano */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Ano:</span>
                                    <select
                                        value={budgetYearFilter}
                                        onChange={(e) => setBudgetYearFilter(parseInt(e.target.value, 10))}
                                        className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                                    >
                                        {[budgetYearFilter - 2, budgetYearFilter - 1, budgetYearFilter, budgetYearFilter + 1, budgetYearFilter + 2].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Período */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Período:</span>
                                    <select
                                        value={budgetPeriodType}
                                        onChange={(e) => {
                                            const val = e.target.value as any;
                                            setBudgetPeriodType(val);
                                            // Set sensible default value for period value
                                            if (val === 'monthly') setBudgetPeriodValue(new Date().getMonth());
                                            else if (val === 'quarterly') setBudgetPeriodValue(Math.floor(new Date().getMonth() / 3) + 1);
                                            else if (val === 'semesterly') setBudgetPeriodValue(new Date().getMonth() < 6 ? 1 : 2);
                                        }}
                                        className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                                    >
                                        <option value="yearly">Anual</option>
                                        <option value="semesterly">Semestral</option>
                                        <option value="quarterly">Trimestral</option>
                                        <option value="monthly">Mensal</option>
                                    </select>
                                </div>

                                {/* Valor do Período (Mês, Trimestre, Semestre) */}
                                {budgetPeriodType !== 'yearly' && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Detalhe:</span>
                                        <select
                                            value={budgetPeriodValue}
                                            onChange={(e) => setBudgetPeriodValue(parseInt(e.target.value, 10))}
                                            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm capitalize"
                                        >
                                            {budgetPeriodType === 'monthly' && (
                                                Array.from({ length: 12 }, (_, i) => (
                                                    <option key={i} value={i}>{getMonthName(i)}</option>
                                                ))
                                            )}
                                            {budgetPeriodType === 'quarterly' && (
                                                <>
                                                    <option value={1}>1º Trimestre (Jan - Mar)</option>
                                                    <option value={2}>2º Trimestre (Abr - Jun)</option>
                                                    <option value={3}>3º Trimestre (Jul - Set)</option>
                                                    <option value={4}>4º Trimestre (Out - Dez)</option>
                                                </>
                                            )}
                                            {budgetPeriodType === 'semesterly' && (
                                                <>
                                                    <option value={1}>1º Semestre (Jan - Jun)</option>
                                                    <option value={2}>2º Semestre (Jul - Dez)</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-slate-500 uppercase">
                                    <th className="px-6 py-4">Categoria</th>
                                    <th className="px-6 py-4 w-48 text-right">Programado</th>
                                    <th className="px-6 py-4 w-48 text-right">Executado</th>
                                    <th className="px-6 py-4 w-48 text-right">Saldo Restante</th>
                                    <th className="px-6 py-4">Progresso de Consumo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {categories.filter(c => c.type === 'expense').length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            Nenhuma categoria de despesa cadastrada. Clique em "Categorias" acima para criar.
                                        </td>
                                    </tr>
                                ) : (
                                    categories
                                        .filter(c => c.type === 'expense')
                                        .map(cat => {
                                            const plannedVal = installments
                                                .filter(inst => {
                                                    if (!inst.recurring_bill || inst.recurring_bill.category_id !== cat.id) return false;
                                                    const dateParts = inst.due_date.split('-');
                                                    if (dateParts.length < 2) return false;
                                                    const y = parseInt(dateParts[0], 10);
                                                    const m = parseInt(dateParts[1], 10) - 1;
                                                    return y === budgetYearFilter && activeMonths.includes(m);
                                                })
                                                .reduce((sum, inst) => sum + Number(inst.amount), 0);

                                            // Calculate executed amount for this category in this month/year
                                            const executedVal = transactions
                                                .filter(t => {
                                                    if (t.type !== 'expense' || t.category_id !== cat.id || t.deleted_at) return false;
                                                    const parts = t.date.split('-');
                                                    if (parts.length < 2) return false;
                                                    const y = parseInt(parts[0], 10);
                                                    const m = parseInt(parts[1], 10) - 1;
                                                    return y === budgetYearFilter && activeMonths.includes(m);
                                                })
                                                .reduce((sum, t) => sum + Number(t.amount), 0);

                                            const remainingVal = plannedVal - executedVal;
                                            const progressPercent = plannedVal > 0 ? (executedVal / plannedVal) * 100 : 0;

                                            return (
                                                <BudgetRow
                                                    key={cat.id}
                                                    category={cat}
                                                    planned={plannedVal}
                                                    executed={executedVal}
                                                    remaining={remainingVal}
                                                    progress={progressPercent}
                                                    formatCurrency={formatCurrency}
                                                />
                                            );
                                        })
                                )}
                            </tbody>
                            {categories.filter(c => c.type === 'expense').length > 0 && (
                                <tfoot>
                                    <tr className="bg-gray-50 border-t border-gray-200 font-bold text-slate-800">
                                        <td className="px-6 py-4">Total</td>
                                        <td className="px-6 py-4 text-right text-lg">{formatCurrency(budgetTotals.planned)}</td>
                                        <td className="px-6 py-4 text-right text-lg text-red-600">{formatCurrency(budgetTotals.executed)}</td>
                                        <td className={`px-6 py-4 text-right text-lg ${budgetTotals.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(budgetTotals.remaining)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-gray-200 rounded-full h-3 max-w-[200px]">
                                                    <div
                                                        className={`h-3 rounded-full transition-all duration-500 ${
                                                            budgetTotals.percent <= 75 ? 'bg-green-500' : budgetTotals.percent <= 100 ? 'bg-orange-500' : 'bg-red-500 animate-pulse'
                                                        }`}
                                                        style={{ width: `${Math.min(budgetTotals.percent, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm">{budgetTotals.percent.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            ) : currentView === 'categories' ? (
                /* Categories settings view */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                    {/* Coluna 1: Receitas */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                Categorias de Receitas
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {categories.filter(c => c.type === 'income').length === 0 ? (
                                <p className="text-sm text-slate-500 py-4 text-center">Nenhuma categoria de receita cadastrada.</p>
                            ) : (
                                categories.filter(c => c.type === 'income').map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center py-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <span className="w-4 h-4 rounded-full border border-gray-200 shadow-inner" style={{ backgroundColor: cat.color || '#4b5563' }}></span>
                                            <span className="font-semibold text-slate-700">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingCategory(cat);
                                                    setIsCategoryModalOpen(true);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                                title="Editar Categoria"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setItemToDelete({ id: cat.id, name: cat.name, type: 'category' });
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Excluir Categoria"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Coluna 2: Despesas */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                Categorias de Despesas
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {categories.filter(c => c.type === 'expense').length === 0 ? (
                                <p className="text-sm text-slate-500 py-4 text-center">Nenhuma categoria de despesa cadastrada.</p>
                            ) : (
                                categories.filter(c => c.type === 'expense').map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center py-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <span className="w-4 h-4 rounded-full border border-gray-200 shadow-inner" style={{ backgroundColor: cat.color || '#4b5563' }}></span>
                                            <span className="font-semibold text-slate-700">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingCategory(cat);
                                                    setIsCategoryModalOpen(true);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                                title="Editar Categoria"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setItemToDelete({ id: cat.id, name: cat.name, type: 'category' });
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Excluir Categoria"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
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
                    itemToDelete?.type === 'category' ? 'categoria' :
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

            <PayableModal
                isOpen={isPayableModalOpen}
                onClose={() => setIsPayableModalOpen(false)}
                onSave={handleSavePayable}
                categories={categories}
            />

            <PayInstallmentModal
                isOpen={isPayInstallmentModalOpen}
                onClose={() => {
                    setIsPayInstallmentModalOpen(false);
                    setSelectedInstallment(null);
                }}
                onConfirm={handleConfirmInstallmentPayment}
                accounts={accounts}
                installment={selectedInstallment}
            />

            <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSave={addAccount}
            />

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(undefined);
                }}
                onSave={async (formData) => {
                    if (editingCategory) {
                        return await updateCategory(editingCategory.id, formData);
                    } else {
                        return await addCategory(formData);
                    }
                }}
                category={editingCategory}
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
