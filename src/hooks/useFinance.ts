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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ==========================================
    // FETCH DATA
    // ==========================================

    const fetchAccounts = useCallback(async () => {
        if (!user?.churchId) return;
        try {
            const { data, error } = await supabase
                .from('financial_accounts')
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
                .from('financial_categories')
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
                .from('financial_transactions')
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

    // ==========================================
    // CRUD: TRANSACTIONS
    // ==========================================

    const addTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'church_id'>) => {
        if (!user?.churchId) return false;
        try {
            const { error } = await supabase
                .from('financial_transactions')
                .insert({
                    ...transaction,
                    church_id: user.churchId,
                    created_by: user.id
                });

            if (error) throw error;
            await fetchTransactions(); // Refresh list
            // TODO: Update account balance logic could be here or via database trigger
            return true;
        } catch (err: any) {
            console.error('Error adding transaction:', err);
            setError(err.message);
            return false;
        }
    };

    const updateTransaction = async (id: string, updates: Partial<FinancialTransaction>) => {
        try {
            const { error } = await supabase
                .from('financial_transactions')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            await fetchTransactions();
            return true;
        } catch (err: any) {
            console.error('Error updating transaction:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            const { error } = await supabase
                .from('financial_transactions')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            setTransactions(prev => prev.filter(t => t.id !== id));
            return true;
        } catch (err: any) {
            console.error('Error deleting transaction:', err);
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
            const { error } = await supabase
                .from('financial_accounts')
                .insert({ ...account, church_id: user.churchId });

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
            const { error } = await supabase
                .from('financial_accounts')
                .update(updates)
                .eq('id', id);

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
            const { error } = await supabase
                .from('financial_accounts')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

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
            const { error } = await supabase
                .from('financial_categories')
                .insert({ ...category, church_id: user.churchId });

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
            const { error } = await supabase
                .from('financial_categories')
                .update(updates)
                .eq('id', id);

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
            const { error } = await supabase
                .from('financial_categories')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

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
                fetchTransactions()
            ]).finally(() => setLoading(false));
        }
    }, [user?.churchId, fetchAccounts, fetchCategories, fetchTransactions]);

    return {
        // Data
        accounts,
        categories,
        transactions,
        loading,
        error,

        // Actions - Transactions
        fetchTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,

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
