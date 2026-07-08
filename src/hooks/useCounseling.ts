import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface CounselingRecord {
    id: string;
    church_id: string;
    pastor_id?: string;
    member_id?: string;
    counseling_date: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    subject?: string;
    description?: string;
    created_at?: string;
    pastor?: { name: string; avatar_url?: string };
    member?: { name: string; avatar_url?: string };
}

export const useCounseling = () => {
    const { user } = useAuth();
    const [counselings, setCounselings] = useState<CounselingRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCounselings = useCallback(async () => {
        if (!user?.churchId) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('pastoral_counselings')
                .select(`
                    *,
                    pastor:members!pastor_id(name, avatar_url),
                    member:members!member_id(name, avatar_url)
                `)
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('counseling_date', { ascending: false });

            if (error) throw error;
            setCounselings(data || []);
        } catch (err: any) {
            console.error('Error fetching counselings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.churchId]);

    const addCounseling = async (record: Omit<CounselingRecord, 'id' | 'church_id'>) => {
        if (!user?.churchId) return null;
        try {
            const { data, error } = await (supabase as any)
                .from('pastoral_counselings')
                .insert({
                    ...record,
                    church_id: user.churchId
                })
                .select()
                .single();

            if (error) throw error;
            await fetchCounselings();
            return data;
        } catch (err: any) {
            console.error('Error adding counseling:', err);
            setError(err.message);
            return null;
        }
    };

    const updateCounseling = async (id: string, record: Partial<Omit<CounselingRecord, 'id' | 'church_id'>>) => {
        try {
            const { data, error } = await (supabase as any)
                .from('pastoral_counselings')
                .update(record)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await fetchCounselings();
            return data;
        } catch (err: any) {
            console.error('Error updating counseling:', err);
            setError(err.message);
            return null;
        }
    };

    const deleteCounseling = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('pastoral_counselings')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            setCounselings(prev => prev.filter(c => c.id !== id));
            return true;
        } catch (err: any) {
            console.error('Error deleting counseling:', err);
            setError(err.message);
            return false;
        }
    };

    return {
        counselings,
        loading,
        error,
        fetchCounselings,
        addCounseling,
        updateCounseling,
        deleteCounseling
    };
};
