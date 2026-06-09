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
    notes?: string;
    created_at: string;
    approval_date?: string;
    payment_date?: string;
    // Joined fields
    department?: { name: string };
    category?: { name: string; color: string };
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

export const useFinance = () => {
    const { user } = useAuth();

    // State
    const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [requests, setRequests] = useState<FinancialRequest[]>([]);
    const [budgets, setBudgets] = useState<FinancialBudget[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                    .order('date', { ascending: false });

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
                .order('date', { ascending: false });

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
                .order('date', { ascending: false });

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
                .order('date', { ascending: false });

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
        const sortedAsc = [...txsWithBalance].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        sortedAsc.forEach(tx => {
            const currentAccBalance = accMap.get(tx.account_id || '') || 0;
            const newBalance = tx.type === 'income' 
                ? currentAccBalance + Number(tx.amount)
                : currentAccBalance - Number(tx.amount);
            
            tx.running_balance = newBalance;
            accMap.set(tx.account_id || '', newBalance);
        });

        return txsWithBalance;
    }, [transactions, accounts]);

    const fetchRequests = useCallback(async (departmentId?: string) => {
        if (!user?.churchId) return;
        try {
            setLoading(true);
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

                if (departmentId) {
                    q = q.eq('department_id', departmentId);
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
    }, [user?.churchId]);

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
            const { error } = await (supabase
                .from('financial_requests' as any)
                .update({ deleted_at: new Date().toISOString() })
                .in('id', ids) as any);

            if (error) throw error;
            setRequests(prev => prev.filter(r => !ids.includes(r.id)));
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

    const addRequest = async (request: Omit<FinancialRequest, 'id' | 'church_id' | 'created_at' | 'status'>) => {
        if (!user?.churchId) return false;
        try {
            const { error } = await (supabase
                .from('financial_requests' as any)
                .insert({
                    ...request,
                    church_id: user.churchId,
                    requested_by: user.id,
                    status: 'pending'
                }) as any);

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
            const { error } = await (supabase
                .from('financial_requests' as any)
                .update(updates)
                .eq('id', id) as any);

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

            await Promise.all([fetchRequests(), fetchTransactions(), fetchAccounts()]);
            return true;
        } catch (err: any) {
            console.error('Error paying request:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteRequest = async (id: string) => {
        try {
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
        
        const load = async () => {
            if (user?.churchId) {
                try {
                    await Promise.all([
                        fetchAccounts(),
                        fetchCategories(),
                        fetchTransactions(),
                        fetchRequests(),
                        fetchBudgets()
                    ]);
                } catch (err) {
                    console.error('Error in initial load:', err);
                } finally {
                    if (mounted) setLoading(false);
                }
            } else if (user === null || (user && !user.churchId)) {
                // No user session or no church selected
                if (mounted) setLoading(false);
            }
        };

        load();
        
        // Fail-safe: stop loading after 5 seconds no matter what
        const timeout = setTimeout(() => {
            if (mounted) setLoading(false);
        }, 5000);

        return () => {
            mounted = false;
            clearTimeout(timeout);
        };
    }, [user, user?.churchId, fetchAccounts, fetchCategories, fetchTransactions, fetchRequests]);

    return {
        // Data
        accounts,
        categories,
        transactions: transactionsWithBalance,
        requests,
        budgets,
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
        saveBudget
    };
};
