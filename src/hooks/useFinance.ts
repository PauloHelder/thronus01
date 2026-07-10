import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { parseFlexibleDate } from '../utils/dateUtils';

// ==========================================
// INTERFACES
// ==========================================

export interface FinancialAccount {
    id: string;
    church_id: string;
    name: string;
    type: 'bank' | 'cash' | 'investment';
    initial_balance: number;
    current_balance: number;
    is_active: boolean;
}

export interface FinancialCategory {
    id: string;
    church_id: string;
    name: string;
    type: 'income' | 'expense';
    color?: string;
    is_system: boolean;
}

export interface FinancialBudget {
    id: string;
    church_id: string;
    category_id: string;
    year: number;
    month: number;
    amount: number;
    created_at?: string;
    updated_at?: string;
}

export interface FinancialTransaction {
    id: string;
    church_id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    category_id?: string;
    account_id?: string;
    status: 'paid' | 'pending';
    payment_method?: string;
    document_number?: string;
    notes?: string;
    source_type?: string;
    source_id?: string;
    other_source_name?: string;
    created_by?: string;
    created_at?: string;
    running_balance?: number;
    // Joined fields for UI
    category?: { name: string; color: string };
    account?: { name: string };
}

export interface FinancialRequest {
    id: string;
    church_id: string;
    department_id: string;
    title: string;
    description?: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    requested_by: string;
    approved_by?: string;
    category_id?: string;
    payable_installment_id?: string;
    notes?: string;
    created_at: string;
    approval_date?: string;
    payment_date?: string;
    // Joined fields
    department?: { name: string };
    category?: { name: string; color: string };
}

export interface FinancialRecurringBill {
    id: string;
    church_id: string;
    description: string;
    amount: number;
    category_id?: string;
    start_date: string;
    end_date: string;
    periodicity: string;
    occurrences: number;
    created_at?: string;
    updated_at?: string;
    // Joined fields
    category?: { name: string; color: string };
}

export interface FinancialPayableInstallment {
    id: string;
    church_id: string;
    recurring_bill_id: string;
    installment_number: number;
    amount: number;
    due_date: string;
    status: 'pending' | 'paid';
    paid_at?: string;
    account_id?: string;
    transaction_id?: string;
    created_at?: string;
    updated_at?: string;
    // Joined fields
    recurring_bill?: FinancialRecurringBill;
    account?: { name: string };
    transaction?: { description: string };
}

export interface TransactionFilter {
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense' | 'all';
    accountId?: string;
    categoryId?: string;
    status?: 'paid' | 'pending' | 'all';
}

// ==========================================
// HOOK
// ==========================================

// Global cache outside the hook function for pub-sub pattern
let cachedAccounts: FinancialAccount[] = (() => {
    try {
        const val = localStorage.getItem('thronus_cache_fin_accounts');
        return val ? JSON.parse(val) : [];
    } catch {
        return [];
    }
})();
let cachedCategories: FinancialCategory[] = (() => {
    try {
        const val = localStorage.getItem('thronus_cache_fin_categories');
        return val ? JSON.parse(val) : [];
    } catch {
        return [];
    }
})();
let cachedTransactions: FinancialTransaction[] = (() => {
    try {
        const val = localStorage.getItem('thronus_cache_fin_transactions');
        return val ? JSON.parse(val) : [];
    } catch {
        return [];
    }
})();
let cachedRequests: FinancialRequest[] = (() => {
    try {
        const val = localStorage.getItem('thronus_cache_fin_requests');
        return val ? JSON.parse(val) : [];
    } catch {
        return [];
    }
})();
let cachedBudgets: FinancialBudget[] = (() => {
    try {
        const val = localStorage.getItem('thronus_cache_fin_budgets');
        return val ? JSON.parse(val) : [];
    } catch {
        return [];
    }
})();
let cachedPayables: FinancialRecurringBill[] = (() => {
    try {
        const val = localStorage.getItem('thronus_cache_fin_payables');
        return val ? JSON.parse(val) : [];
    } catch {
        return [];
    }
})();
let cachedInstallments: FinancialPayableInstallment[] = (() => {
    try {
        const val = localStorage.getItem('thronus_cache_fin_installments');
        return val ? JSON.parse(val) : [];
    } catch {
        return [];
    }
})();

let cacheChurchId: string | null = (() => {
    try {
        return localStorage.getItem('thronus_cache_church_id_finance');
    } catch {
        return null;
    }
})();
let lastFetchTime = 0;
let activeFetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notifyListeners = () => {
    listeners.forEach(listener => listener());
};

const persistCache = () => {
    try {
        localStorage.setItem('thronus_cache_fin_accounts', JSON.stringify(cachedAccounts));
        localStorage.setItem('thronus_cache_fin_categories', JSON.stringify(cachedCategories));
        localStorage.setItem('thronus_cache_fin_transactions', JSON.stringify(cachedTransactions));
        localStorage.setItem('thronus_cache_fin_requests', JSON.stringify(cachedRequests));
        localStorage.setItem('thronus_cache_fin_budgets', JSON.stringify(cachedBudgets));
        localStorage.setItem('thronus_cache_fin_payables', JSON.stringify(cachedPayables));
        localStorage.setItem('thronus_cache_fin_installments', JSON.stringify(cachedInstallments));
        if (cacheChurchId) {
            localStorage.setItem('thronus_cache_church_id_finance', cacheChurchId);
        }
    } catch (e) {
        console.warn('Failed to save finance cache:', e);
    }
};

export const useFinance = () => {
    const { user } = useAuth();

    // Local state variables backed by the global cache
    const [accounts, setAccountsState] = useState<FinancialAccount[]>(cachedAccounts);
    const [categories, setCategoriesState] = useState<FinancialCategory[]>(cachedCategories);
    const [transactions, setTransactionsState] = useState<FinancialTransaction[]>(cachedTransactions);
    const [requests, setRequestsState] = useState<FinancialRequest[]>(cachedRequests);
    const [budgets, setBudgetsState] = useState<FinancialBudget[]>(cachedBudgets);
    const [payables, setPayablesState] = useState<FinancialRecurringBill[]>(cachedPayables);
    const [installments, setInstallmentsState] = useState<FinancialPayableInstallment[]>(cachedInstallments);
    const [currentDepartmentId, setCurrentDepartmentId] = useState<string | null>(null);

    const [loading, setLoading] = useState(cachedAccounts.length === 0);
    const [error, setError] = useState<string | null>(null);

    // Sync local states to cache updates
    useEffect(() => {
        const handler = () => {
            setAccountsState(cachedAccounts);
            setCategoriesState(cachedCategories);
            setTransactionsState(cachedTransactions);
            setRequestsState(cachedRequests);
            setBudgetsState(cachedBudgets);
            setPayablesState(cachedPayables);
            setInstallmentsState(cachedInstallments);
        };
        listeners.add(handler);
        return () => {
            listeners.delete(handler);
        };
    }, []);

    // Setters that update global cache and notify listeners
    const setAccounts = (data: FinancialAccount[]) => {
        cachedAccounts = data;
        persistCache();
        notifyListeners();
    };
    const setCategories = (data: FinancialCategory[]) => {
        cachedCategories = data;
        persistCache();
        notifyListeners();
    };
    const setTransactions = (data: FinancialTransaction[]) => {
        cachedTransactions = data;
        persistCache();
        notifyListeners();
    };
    const setRequests = (data: FinancialRequest[]) => {
        cachedRequests = data;
        persistCache();
        notifyListeners();
    };
    const setBudgets = (data: FinancialBudget[]) => {
        cachedBudgets = data;
        persistCache();
        notifyListeners();
    };
    const setPayables = (data: FinancialRecurringBill[]) => {
        cachedPayables = data;
        persistCache();
        notifyListeners();
    };
    const setInstallments = (data: FinancialPayableInstallment[]) => {
        cachedInstallments = data;
        persistCache();
        notifyListeners();
    };

    // ==========================================
    // FETCH DATA
    // ==========================================

    const fetchAccounts = useCallback(async () => {
        if (!user?.churchId) return;
        try {
            const { data, error } = await supabase
                .from('financial_accounts' as any)
                .select('*')
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;
            setAccounts(data || []);
        } catch (err: any) {
            console.error('Error fetching accounts:', err);
            setError(err.message);
        }
    }, [user?.churchId]);

    const fetchCategories = useCallback(async () => {
        if (!user?.churchId) return;
        try {
            const { data, error } = await supabase
                .from('financial_categories' as any)
                .select('*')
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (err: any) {
            console.error('Error fetching categories:', err);
            setError(err.message);
        }
    }, [user?.churchId]);

    const fetchTransactions = useCallback(async (filters?: TransactionFilter) => {
        if (!user?.churchId) return;
        try {
            setLoading(true);
            const buildQuery = () => {
                let q = supabase
                    .from('financial_transactions' as any)
                    .select(`
                        *,
                        category:financial_categories(name, color),
                        account:financial_accounts(name)
                    `)
                    .eq('church_id', user.churchId)
                    .is('deleted_at', null)
                    .order('date', { ascending: true })
                    .order('created_at', { ascending: true });

                // Apply filters
                if (filters) {
                    if (filters.startDate) q = q.gte('date', filters.startDate);
                    if (filters.endDate) q = q.lte('date', filters.endDate);
                    if (filters.type && filters.type !== 'all') q = q.eq('type', filters.type);
                    if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
                    if (filters.accountId) q = q.eq('account_id', filters.accountId);
                    if (filters.categoryId) q = q.eq('category_id', filters.categoryId);
                }
                return q;
            };

            let allData: any[] = [];
            let from = 0;
            const step = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await buildQuery().range(from, from + step - 1);
                if (error) throw error;

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    if (data.length < step) {
                        hasMore = false;
                    } else {
                        from += step;
                    }
                } else {
                    hasMore = false;
                }
            }

            setTransactions(allData);
        } catch (err: any) {
            console.error('Error fetching transactions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.churchId]);

    const fetchMemberTransactions = useCallback(async (memberId: string) => {
        if (!user?.churchId) return [];
        try {
            const { data, error } = await supabase
                .from('financial_transactions' as any)
                .select(`
                    *,
                    category:financial_categories(name, color),
                    account:financial_accounts(name)
                `)
                .eq('church_id', user.churchId)
                .eq('source_id', memberId)
                .eq('source_type', 'member')
                .is('deleted_at', null)
                .order('date', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err: any) {
            console.error('Error fetching member transactions:', err);
            return [];
        }
    }, [user?.churchId]);

    const fetchServiceTransactions = useCallback(async (serviceId: string) => {
        if (!user?.churchId) return [];
        try {
            const { data, error } = await supabase
                .from('financial_transactions' as any)
                .select(`
                    *,
                    category:financial_categories(name, color),
                    account:financial_accounts(name)
                `)
                .eq('church_id', user.churchId)
                .eq('source_id', serviceId)
                .eq('source_type', 'service')
                .is('deleted_at', null)
                .order('date', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err: any) {
            console.error('Error fetching service transactions:', err);
            return [];
        }
    }, [user?.churchId]);

    const fetchGroupTransactions = useCallback(async (groupId: string) => {
        if (!user?.churchId) return [];
        try {
            const { data, error } = await supabase
                .from('financial_transactions' as any)
                .select(`
                    *,
                    category:financial_categories(name, color),
                    account:financial_accounts(name)
                `)
                .eq('church_id', user.churchId)
                .eq('source_id', groupId)
                .eq('source_type', 'group')
                .is('deleted_at', null)
                .order('date', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err: any) {
            console.error('Error fetching group transactions:', err);
            return [];
        }
    }, [user?.churchId]);

    const transactionsWithBalance = useMemo(() => {
        if (transactions.length === 0 || accounts.length === 0) return transactions;

        const txsWithBalance = [...transactions];
        const accMap = new Map<string, number>();
        accounts.forEach(acc => accMap.set(acc.id, Number(acc.initial_balance) || 0));

        // Sort ASC for calculation (oldest first)
        const sortedAsc = [...txsWithBalance].sort((a, b) => {
            const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        });

        sortedAsc.forEach(tx => {
            const currentAccBalance = accMap.get(tx.account_id || '') || 0;
            const newBalance = tx.type === 'income' 
                ? currentAccBalance + Number(tx.amount)
                : currentAccBalance - Number(tx.amount);
            
            tx.running_balance = newBalance;
            accMap.set(tx.account_id || '', newBalance);
        });

        return sortedAsc;
    }, [transactions, accounts]);

    const fetchRequests = useCallback(async (departmentId?: string | null) => {
        if (!user?.churchId) return;
        try {
            setLoading(true);

            let deptIdToUse: string | undefined = undefined;
            if (departmentId !== undefined) {
                if (departmentId !== null) {
                    deptIdToUse = departmentId;
                    setCurrentDepartmentId(departmentId);
                } else {
                    setCurrentDepartmentId(null);
                }
            } else if (currentDepartmentId) {
                deptIdToUse = currentDepartmentId;
            }

            const buildQuery = () => {
                let q = supabase
                    .from('financial_requests' as any)
                    .select(`
                        *,
                        department:departments(name),
                        category:financial_categories(name, color)
                    `)
                    .eq('church_id', user.churchId)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false });

                if (deptIdToUse) {
                    q = q.eq('department_id', deptIdToUse);
                }
                return q;
            };

            let allData: any[] = [];
            let from = 0;
            const step = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await buildQuery().range(from, from + step - 1);
                if (error) throw error;

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    if (data.length < step) {
                        hasMore = false;
                    } else {
                        from += step;
                    }
                } else {
                    hasMore = false;
                }
            }

            setRequests(allData);
        } catch (err: any) {
            console.error('Error fetching requests:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.churchId, currentDepartmentId]);

    const fetchBudgets = useCallback(async () => {
        if (!user?.churchId) return;
        try {
            const { data, error } = await supabase
                .from('financial_budgets' as any)
                .select('*')
                .eq('church_id', user.churchId);

            if (error) throw error;
            setBudgets(data || []);
        } catch (err: any) {
            console.error('Error fetching budgets:', err);
            setError(err.message);
        }
    }, [user?.churchId]);

    const saveBudget = async (categoryId: string, year: number, month: number, amount: number) => {
        if (!user?.churchId) return false;
        try {
            const { error } = await supabase
                .from('financial_budgets' as any)
                .upsert({
                    church_id: user.churchId,
                    category_id: categoryId,
                    year,
                    month,
                    amount
                }, {
                    onConflict: 'church_id,category_id,year,month'
                });

            if (error) throw error;
            await fetchBudgets();
            return true;
        } catch (err: any) {
            console.error('Error saving budget:', err);
            setError(err.message);
            return false;
        }
    };

    const fetchPayables = useCallback(async () => {
        if (!user?.churchId) return;
        try {
            const { data, error } = await (supabase as any)
                .from('financial_recurring_bills')
                .select(`
                    *,
                    category:financial_categories(name, color)
                `)
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayables(data || []);
        } catch (err: any) {
            console.error('Error fetching recurring bills:', err);
            setError(err.message);
        }
    }, [user?.churchId]);

    const fetchInstallments = useCallback(async () => {
        if (!user?.churchId) return;
        try {
            const { data, error } = await (supabase as any)
                .from('financial_payable_installments')
                .select(`
                    *,
                    recurring_bill:financial_recurring_bills(
                        id,
                        description,
                        category_id,
                        category:financial_categories(name, color)
                    ),
                    account:financial_accounts(name)
                `)
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('due_date', { ascending: true });

            if (error) throw error;
            setInstallments(data || []);
        } catch (err: any) {
            console.error('Error fetching installments:', err);
            setError(err.message);
        }
    }, [user?.churchId]);

    const addRecurringBill = async (
        bill: Omit<FinancialRecurringBill, 'id' | 'church_id' | 'created_at'>,
        installmentsList: Array<Omit<FinancialPayableInstallment, 'id' | 'church_id' | 'recurring_bill_id' | 'created_at' | 'status'>>
    ) => {
        if (!user?.churchId) return false;
        try {
            // 1. Inserir a conta recorrente
            const { data: newBill, error: billError } = await (supabase as any)
                .from('financial_recurring_bills')
                .insert({
                    ...bill,
                    church_id: user.churchId
                })
                .select()
                .single();

            if (billError) throw billError;
            if (!newBill) throw new Error('Falha ao criar conta recorrente');

            // 2. Inserir todas as parcelas
            const installmentsPayload = installmentsList.map(inst => ({
                ...inst,
                recurring_bill_id: newBill.id,
                church_id: user.churchId,
                status: 'pending'
            }));

            const { error: instError } = await (supabase as any)
                .from('financial_payable_installments')
                .insert(installmentsPayload);

            if (instError) throw instError;

            await Promise.all([fetchPayables(), fetchInstallments()]);
            return true;
        } catch (err: any) {
            console.error('Error adding recurring bill:', err);
            setError(err.message);
            return false;
        }
    };

    const payInstallment = async (installmentId: string, accountId: string, paymentDate?: string) => {
        if (!user?.churchId) return false;
        try {
            // 1. Buscar detalhes da parcela
            const { data: installment, error: instError } = await (supabase as any)
                .from('financial_payable_installments')
                .select(`
                    *,
                    recurring_bill:financial_recurring_bills(*)
                `)
                .eq('id', installmentId)
                .single();

            if (instError) throw instError;
            if (!installment) throw new Error('Parcela não encontrada');

            const dateToUse = paymentDate || parseFlexibleDate(new Date());

            // 2. Criar a transação financeira (despesa)
            const { data: tx, error: txError } = await (supabase as any)
                .from('financial_transactions')
                .insert({
                    church_id: user.churchId,
                    description: `Pgmto: ${installment.recurring_bill?.description || 'Conta a Pagar'} (Parc. ${installment.installment_number})`,
                    amount: installment.amount,
                    type: 'expense',
                    date: dateToUse,
                    category_id: installment.recurring_bill?.category_id,
                    account_id: accountId,
                    status: 'paid',
                    created_by: user.id,
                    notes: `Pagamento automático da parcela #${installment.installment_number} de ${installment.recurring_bill?.description || ''}`
                })
                .select()
                .single();

            if (txError) throw txError;

            // 3. Atualizar a parcela com o status pago e id da transação
            const { error: updError } = await (supabase as any)
                .from('financial_payable_installments')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    account_id: accountId,
                    transaction_id: tx.id
                })
                .eq('id', installmentId);

            if (updError) throw updError;

            await Promise.all([
                fetchInstallments(),
                fetchTransactions(),
                fetchAccounts()
            ]);
            return true;
        } catch (err: any) {
            console.error('Error paying installment:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteRecurringBill = async (billId: string) => {
        try {
            const nowStr = new Date().toISOString();
            
            // 1. Soft delete installments first
            const { error: instError } = await (supabase as any)
                .from('financial_payable_installments')
                .update({ deleted_at: nowStr })
                .eq('recurring_bill_id', billId);

            if (instError) throw instError;

            // 2. Soft delete recurring bill
            const { error: billError } = await (supabase as any)
                .from('financial_recurring_bills')
                .update({ deleted_at: nowStr })
                .eq('id', billId);

            if (billError) throw billError;

            await Promise.all([fetchPayables(), fetchInstallments()]);
            return true;
        } catch (err: any) {
            console.error('Error deleting recurring bill:', err);
            setError(err.message);
            return false;
        }
    };

    // ==========================================
    // CRUD: TRANSACTIONS
    // ==========================================

    const addTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'church_id' | 'created_at'>) => {
        if (!user?.churchId) return false;
        try {
            // Remove joined fields to avoid Supabase 400 errors
            const { category, account, running_balance, ...cleanTransaction } = transaction as any;

            const { error } = await (supabase
                .from('financial_transactions' as any)
                .insert({
                    ...cleanTransaction,
                    church_id: user.churchId,
                    created_by: user.id
                }) as any);

            if (error) throw error;
            await Promise.all([fetchTransactions(), fetchAccounts()]); // Refresh lists
            return true;
        } catch (err: any) {
            console.error('Error adding transaction:', err);
            setError(err.message);
            return false;
        }
    };

    const bulkAddTransactions = async (transactions: any[]) => {
        if (!user?.churchId) return false;
        try {
            const payloads = transactions.map(tx => {
                const { category, account, running_balance, ...clean } = tx;
                return {
                    ...clean,
                    church_id: user.churchId,
                    created_by: user.id
                };
            });

            const { error } = await (supabase
                .from('financial_transactions' as any)
                .insert(payloads) as any);

            if (error) throw error;
            await Promise.all([fetchTransactions(), fetchAccounts()]);
            return true;
        } catch (err: any) {
            console.error('Error bulk adding transactions:', err);
            setError(err.message);
            return false;
        }
    };

    const transferFunds = async (data: {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        date: string;
        description: string;
    }) => {
        if (!user?.churchId) return false;
        try {
            // Find or create a 'Transferência' category
            let transferCategory = categories.find(c => c.name.toLowerCase() === 'transferência');
            
            if (!transferCategory) {
                const { data: newCat, error: catError } = await supabase
                    .from('financial_categories')
                    .insert({
                        name: 'Transferência',
                        type: 'expense',
                        color: '#6366F1',
                        church_id: user.churchId
                    })
                    .select()
                    .single();
                
                if (catError) throw catError;
                transferCategory = newCat;
            }

            const transferGroupId = `TRF-${Date.now()}`;

            const transactions = [
                {
                    description: `${data.description} (Origem)`,
                    amount: data.amount,
                    type: 'expense',
                    date: data.date,
                    category_id: transferCategory?.id,
                    account_id: data.fromAccountId,
                    church_id: user.churchId,
                    created_by: user.id,
                    status: 'paid',
                    notes: `Transferência para outra conta. Grupo: ${transferGroupId}`
                },
                {
                    description: `${data.description} (Destino)`,
                    amount: data.amount,
                    type: 'income',
                    date: data.date,
                    category_id: transferCategory?.id,
                    account_id: data.toAccountId,
                    church_id: user.churchId,
                    created_by: user.id,
                    status: 'paid',
                    notes: `Recebido via transferência. Grupo: ${transferGroupId}`
                }
            ];

            const { error } = await (supabase
                .from('financial_transactions' as any)
                .insert(transactions) as any);

            if (error) throw error;
            await Promise.all([fetchTransactions(), fetchAccounts()]);
            return true;
        } catch (err: any) {
            console.error('Error transferring funds:', err);
            setError(err.message);
            return false;
        }
    };

    const updateTransaction = async (id: string, updates: Partial<FinancialTransaction>) => {
        try {
            // Remove joined fields to avoid Supabase 400 errors
            const { category, account, running_balance, ...cleanUpdates } = updates as any;

            const { error } = await (supabase
                .from('financial_transactions' as any)
                .update(cleanUpdates)
                .eq('id', id) as any);

            if (error) throw error;
            await Promise.all([fetchTransactions(), fetchAccounts()]);
            return true;
        } catch (err: any) {
            console.error('Error updating transaction:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            const { error } = await (supabase
                .from('financial_transactions' as any)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id) as any);

            if (error) throw error;
            setTransactions(prev => prev.filter(t => t.id !== id));
            await fetchAccounts();
            return true;
        } catch (err: any) {
            console.error('Error deleting transaction:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteMultipleTransactions = async (ids: string[]) => {
        try {
            const { error } = await (supabase
                .from('financial_transactions' as any)
                .update({ deleted_at: new Date().toISOString() })
                .in('id', ids) as any);

            if (error) throw error;
            setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
            await fetchAccounts();
            return true;
        } catch (err: any) {
            console.error('Error deleting multiple transactions:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteMultipleRequests = async (ids: string[]) => {
        try {
            const paidIds = requests
                .filter(r => ids.includes(r.id) && r.status === 'paid')
                .map(r => r.id);
            const idsToDelete = ids.filter(id => !paidIds.includes(id));
            
            if (idsToDelete.length === 0) {
                throw new Error('Nenhuma das requisições selecionadas pode ser excluída (estão pagas).');
            }

            const { error } = await (supabase
                .from('financial_requests' as any)
                .update({ deleted_at: new Date().toISOString() })
                .in('id', idsToDelete) as any);

            if (error) throw error;
            setRequests(prev => prev.filter(r => !idsToDelete.includes(r.id)));
            return true;
        } catch (err: any) {
            console.error('Error deleting multiple requests:', err);
            setError(err.message);
            return false;
        }
    };

    // ==========================================
    // CRUD: REQUESTS
    // ==========================================

    const addRequest = async (request: Omit<FinancialRequest, 'id' | 'church_id' | 'created_at' | 'status' | 'requested_by'>) => {
        if (!user?.churchId) return false;
        try {
            const cleanRequest = {
                ...request,
                payable_installment_id: request.payable_installment_id || null,
                category_id: request.category_id || null
            };

            const { error } = await (supabase as any)
                .from('financial_requests')
                .insert({
                    ...cleanRequest,
                    church_id: user.churchId,
                    requested_by: user.id,
                    status: 'pending'
                });

            if (error) throw error;
            await fetchRequests(request.department_id);
            return true;
        } catch (err: any) {
            console.error('Error adding request:', err);
            setError(err.message);
            return false;
        }
    };

    const updateRequest = async (id: string, updates: Partial<FinancialRequest>) => {
        try {
            const req = requests.find(r => r.id === id);
            if (req && req.status === 'paid') {
                throw new Error('Não é permitido alterar uma requisição já paga.');
            }

            const cleanUpdates = { ...updates };
            if ('payable_installment_id' in cleanUpdates && !cleanUpdates.payable_installment_id) {
                cleanUpdates.payable_installment_id = null;
            }
            if ('category_id' in cleanUpdates && !cleanUpdates.category_id) {
                cleanUpdates.category_id = null;
            }

            const { error } = await (supabase as any)
                .from('financial_requests')
                .update(cleanUpdates)
                .eq('id', id);

            if (error) throw error;
            await fetchRequests();
            return true;
        } catch (err: any) {
            console.error('Error updating request:', err);
            setError(err.message);
            return false;
        }
    };

    const payRequest = async (requestId: string, accountId: string, paymentDate?: string) => {
        if (!user?.churchId) return false;
        try {
            // 1. Buscar detalhes da requisição
            const { data: request, error: reqError } = await (supabase
                .from('financial_requests' as any)
                .select('*')
                .eq('id', requestId)
                .single() as any);

            if (reqError) throw reqError;
            if (!request) throw new Error('Requisição não encontrada');

            const dateToUse = paymentDate || parseFlexibleDate(new Date());

            // 2. Criar a transação financeira (despesa)
            const { error: txError } = await (supabase
                .from('financial_transactions' as any)
                .insert({
                    church_id: user.churchId,
                    description: `Pgmto: ${request.title}`,
                    amount: request.amount,
                    type: 'expense',
                    date: dateToUse,
                    category_id: request.category_id,
                    account_id: accountId,
                    status: 'paid',
                    created_by: user.id,
                    notes: `Pagamento automático da requisição #${request.id.slice(0, 8)}`
                }) as any);

            if (txError) throw txError;

            // 3. Atualizar status da requisição
            const { error: updError } = await (supabase
                .from('financial_requests' as any)
                .update({
                    status: 'paid',
                    payment_date: dateToUse
                })
                .eq('id', requestId) as any);

            if (updError) throw updError;

            // 4. Se a requisição foi gerada por uma parcela de Contas a Pagar, dar baixa na parcela
            if (request.payable_installment_id) {
                const { error: instError } = await (supabase
                    .from('financial_payable_installments' as any)
                    .update({
                        status: 'paid',
                        paid_at: dateToUse,
                        account_id: accountId
                    })
                    .eq('id', request.payable_installment_id) as any);
                
                if (instError) console.error('Erro ao atualizar status da parcela:', instError);
            }

            await Promise.all([fetchRequests(), fetchTransactions(), fetchAccounts(), fetchInstallments()]);
            return true;
        } catch (err: any) {
            console.error('Error paying request:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteRequest = async (id: string) => {
        try {
            const req = requests.find(r => r.id === id);
            if (req && req.status === 'paid') {
                throw new Error('Não é permitido excluir uma requisição já paga.');
            }
            const { error } = await (supabase
                .from('financial_requests' as any)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id) as any);

            if (error) throw error;
            setRequests(prev => prev.filter(r => r.id !== id));
            return true;
        } catch (err: any) {
            console.error('Error deleting request:', err);
            setError(err.message);
            return false;
        }
    };

    // ==========================================
    // CRUD: ACCOUNTS
    // ==========================================

    const addAccount = async (account: Omit<FinancialAccount, 'id' | 'church_id'>) => {
        if (!user?.churchId) return false;
        try {
            const { error } = await (supabase
                .from('financial_accounts' as any)
                .insert({ ...account, church_id: user.churchId }) as any);

            if (error) throw error;
            await fetchAccounts();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const updateAccount = async (id: string, updates: Partial<FinancialAccount>) => {
        try {
            const { error } = await (supabase
                .from('financial_accounts' as any)
                .update(updates)
                .eq('id', id) as any);

            if (error) throw error;
            await fetchAccounts();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteAccount = async (id: string) => {
        try {
            const { error } = await (supabase
                .from('financial_accounts' as any)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id) as any);

            if (error) throw error;
            setAccounts(prev => prev.filter(a => a.id !== id));
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    // ==========================================
    // CRUD: CATEGORIES
    // ==========================================

    const addCategory = async (category: Omit<FinancialCategory, 'id' | 'church_id'>) => {
        if (!user?.churchId) return false;
        try {
            const { error } = await (supabase
                .from('financial_categories' as any)
                .insert({ ...category, church_id: user.churchId }) as any);

            if (error) throw error;
            await fetchCategories();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const updateCategory = async (id: string, updates: Partial<FinancialCategory>) => {
        try {
            const { error } = await (supabase
                .from('financial_categories' as any)
                .update(updates)
                .eq('id', id) as any);

            if (error) throw error;
            await fetchCategories();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            const { error } = await (supabase
                .from('financial_categories' as any)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id) as any);

            if (error) throw error;
            setCategories(prev => prev.filter(c => c.id !== id));
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        let mounted = true;
        
        const load = async (forceSilent = false) => {
            if (user?.churchId) {
                const now = Date.now();
                if (cacheChurchId !== user.churchId) {
                    // Church changed: reset cache
                    cacheChurchId = user.churchId;
                    try {
                        localStorage.removeItem('thronus_cache_fin_accounts');
                        localStorage.removeItem('thronus_cache_fin_categories');
                        localStorage.removeItem('thronus_cache_fin_transactions');
                        localStorage.removeItem('thronus_cache_fin_requests');
                        localStorage.removeItem('thronus_cache_fin_budgets');
                        localStorage.removeItem('thronus_cache_fin_payables');
                        localStorage.removeItem('thronus_cache_fin_installments');
                        localStorage.removeItem('thronus_cache_church_id_finance');
                    } catch {}
                    cachedAccounts = [];
                    cachedCategories = [];
                    cachedTransactions = [];
                    cachedRequests = [];
                    cachedBudgets = [];
                    cachedPayables = [];
                    cachedInstallments = [];
                    lastFetchTime = 0;
                    activeFetchPromise = null;
                }

                if (cachedAccounts.length === 0 && !forceSilent) {
                    if (mounted) setLoading(true);
                }

                if (activeFetchPromise) {
                    try {
                        await activeFetchPromise;
                    } catch {}
                    if (mounted) setLoading(false);
                    return;
                }

                try {
                    activeFetchPromise = (async () => {
                        await Promise.all([
                            fetchAccounts(),
                            fetchCategories(),
                            fetchTransactions(),
                            fetchRequests(),
                            fetchBudgets(),
                            fetchPayables(),
                            fetchInstallments()
                        ]);
                    })();
                    await activeFetchPromise;
                    lastFetchTime = Date.now();
                    persistCache();
                } catch (err) {
                    console.error('Error in initial load:', err);
                } finally {
                    activeFetchPromise = null;
                    if (mounted) setLoading(false);
                }
            } else if (user === null || (user && !user.churchId)) {
                // No user session or no church selected
                if (mounted) setLoading(false);
            }
        };

        if (user?.churchId) {
            const now = Date.now();
            if (cachedAccounts.length === 0) {
                load();
            } else if (now - lastFetchTime > 180000) {
                load(true); // silent background fetch
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
        
        // Fail-safe: stop loading after 5 seconds no matter what
        const timeout = setTimeout(() => {
            if (mounted) setLoading(false);
        }, 5000);

        return () => {
            mounted = false;
            clearTimeout(timeout);
        };
    }, [user?.churchId, fetchAccounts, fetchCategories, fetchTransactions, fetchRequests, fetchBudgets, fetchPayables, fetchInstallments]);

    return {
        // Data
        accounts,
        categories,
        transactions: transactionsWithBalance,
        requests,
        budgets,
        payables,
        installments,
        loading,
        error,

        // Actions - Transactions
        fetchTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteMultipleTransactions,
        bulkAddTransactions,
        transferFunds,

        // Actions - Requests
        fetchRequests,
        addRequest,
        payRequest,
        updateRequest,
        deleteRequest,
        deleteMultipleRequests,

        // Actions - Accounts
        addAccount,
        updateAccount,
        deleteAccount,

        // Actions - Categories
        addCategory,
        updateCategory,
        deleteCategory,
        fetchMemberTransactions,
        fetchServiceTransactions,
        fetchGroupTransactions,

        // Actions - Budgets
        fetchBudgets,
        saveBudget,

        // Actions - Payables
        fetchPayables,
        fetchInstallments,
        addRecurringBill,
        payInstallment,
        deleteRecurringBill
    };
};
