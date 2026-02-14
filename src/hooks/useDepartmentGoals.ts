import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface DepartmentGoal {
    id: string;
    church_id: string;
    department_id: string;
    title: string;
    description: string;
    target_value: number | null;
    current_value: number;
    deadline: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    priority: 'low' | 'medium' | 'high';
    created_at: string;
    updated_at: string;
}

export const useDepartmentGoals = (departmentId?: string) => {
    const { user } = useAuth();
    const [goals, setGoals] = useState<DepartmentGoal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGoals = useCallback(async () => {
        if (!user?.churchId) return;

        try {
            setLoading(true);
            let query = (supabase
                .from('department_goals' as any) as any)
                .select('*')
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (departmentId) {
                query = query.eq('department_id', departmentId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setGoals(data || []);
        } catch (err: any) {
            console.error('Error fetching goals:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.churchId, departmentId]);

    const addGoal = async (goal: Omit<DepartmentGoal, 'id' | 'church_id' | 'created_at' | 'updated_at'>) => {
        if (!user?.churchId) return false;
        try {
            const { error } = await (supabase
                .from('department_goals' as any) as any)
                .insert({
                    ...goal,
                    church_id: user.churchId
                });

            if (error) throw error;
            await fetchGoals();
            return true;
        } catch (err: any) {
            console.error('Error adding goal:', err);
            setError(err.message);
            return false;
        }
    };

    const updateGoal = async (id: string, updates: Partial<DepartmentGoal>) => {
        try {
            const { error } = await (supabase
                .from('department_goals' as any) as any)
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            await fetchGoals();
            return true;
        } catch (err: any) {
            console.error('Error updating goal:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteGoal = async (id: string) => {
        try {
            const { error } = await (supabase
                .from('department_goals' as any) as any)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            setGoals(prev => prev.filter(g => g.id !== id));
            return true;
        } catch (err: any) {
            console.error('Error deleting goal:', err);
            setError(err.message);
            return false;
        }
    };

    return {
        goals,
        loading,
        error,
        fetchGoals,
        addGoal,
        updateGoal,
        deleteGoal
    };
};
