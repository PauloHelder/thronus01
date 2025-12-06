import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Transaction {
    id: string;
    church_id: string;
    type: 'Income' | 'Expense';
    category_id?: string;
    amount: number;
    description?: string;
    date: string;
    payment_method?: string;
    reference?: string;
    member_id?: string;
    created_by?: string;
    created_at?: string;
}

export const useTransactions = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = async () => {
        if (!user?.churchId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('transactions')
                .select('*')
                .eq('church_id', user.churchId)
                .order('date', { ascending: false });

            if (fetchError) throw fetchError;

            setTransactions(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError('Erro ao carregar transações');
        } finally {
            setLoading(false);
        }
    };

    const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'church_id' | 'created_at'>) => {
        if (!user?.churchId) return false;

        try {
            const { data, error: insertError } = await supabase
                .from('transactions')
                .insert({
                    ...transactionData,
                    church_id: user.churchId,
                    created_by: user.id
                })
                .select()
                .single();

            if (insertError) throw insertError;

            setTransactions(prev => [data, ...prev]);
            return true;
        } catch (err) {
            console.error('Error adding transaction:', err);
            setError('Erro ao adicionar transação');
            return false;
        }
    };

    const updateTransaction = async (id: string, transactionData: Partial<Transaction>) => {
        try {
            const { data, error: updateError } = await supabase
                .from('transactions')
                .update(transactionData)
                .eq('id', id)
                .eq('church_id', user?.churchId)
                .select()
                .single();

            if (updateError) throw updateError;

            setTransactions(prev => prev.map(t => t.id === id ? data : t));
            return true;
        } catch (err) {
            console.error('Error updating transaction:', err);
            setError('Erro ao atualizar transação');
            return false;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)
                .eq('church_id', user?.churchId);

            if (deleteError) throw deleteError;

            setTransactions(prev => prev.filter(t => t.id !== id));
            return true;
        } catch (err) {
            console.error('Error deleting transaction:', err);
            setError('Erro ao excluir transação');
            return false;
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [user?.churchId]);

    return {
        transactions,
        loading,
        error,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refetch: fetchTransactions
    };
};
