import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plan } from '../types';
import { toast } from 'sonner';

export const usePlans = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('price', { ascending: true }); // Order by price typically

            if (error) throw error;

            setPlans(data || []);
        } catch (err: any) {
            console.error('Error fetching plans:', err);
            setError(err.message);
            // toast.error('Erro ao carregar planos'); // Optional: prevent toast spam on public pages
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    return {
        plans,
        loading,
        error,
        refetch: fetchPlans
    };
};
