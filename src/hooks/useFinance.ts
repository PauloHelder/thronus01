import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
    created_by?: string;
    created_at?: string;
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
            let query = supabase
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
                if (filters.startDate) query = query.gte('date', filters.startDate);
                if (filters.endDate) query = query.lte('date', filters.endDate);
                if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type);
                if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
                if (filters.accountId) query = query.eq('account_id', filters.accountId);
                if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTransactions(data || []);
        } catch (err: any) {
            console.error('Error fetching transactions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.churchId]);

    const fetchRequests = useCallback(async (departmentId?: string) => {
        if (!user?.churchId) return;
        try {
            setLoading(true);
            let query = supabase
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
                query = query.eq('department_id', departmentId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRequests(data || []);
        } catch (err: any) {
            console.error('Error fetching requests:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.churchId]);

    // ==========================================
    // CRUD: TRANSACTIONS
    // ==========================================

    const addTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'church_id' | 'created_at'>) => {
        if (!user?.churchId) return false;
        try {
            const { error } = await (supabase
                .from('financial_transactions' as any)
                .insert({
                    ...transaction,
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

    const updateTransaction = async (id: string, updates: Partial<FinancialTransaction>) => {
        try {
            const { error } = await (supabase
                .from('financial_transactions' as any)
                .update(updates)
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

            const dateToUse = paymentDate || new Date().toISOString().split('T')[0];

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
        if (user?.churchId) {
            Promise.all([
                fetchAccounts(),
                fetchCategories(),
                fetchTransactions(),
                fetchRequests()
            ]).finally(() => setLoading(false));
        }
    }, [user?.churchId, fetchAccounts, fetchCategories, fetchTransactions, fetchRequests]);

    return {
        // Data
        accounts,
        categories,
        transactions,
        requests,
        loading,
        error,

        // Actions - Transactions
        fetchTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,

        // Actions - Requests
        fetchRequests,
        addRequest,
        payRequest,
        updateRequest,
        deleteRequest,

        // Actions - Accounts
        addAccount,
        updateAccount,
        deleteAccount,

        // Actions - Categories
        addCategory,
        updateCategory,
        deleteCategory
    };
};
