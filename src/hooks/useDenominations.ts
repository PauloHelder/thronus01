import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface Denomination {
    id: string;
    name: string;
    acronym?: string;
    doctrinal_current?: string;
    max_leader?: string;
    recognition_year?: number;
    created_at?: string;
}

export type DenominationInput = Omit<Denomination, 'id' | 'created_at'>;

export function useDenominations() {
    const [denominations, setDenominations] = useState<Denomination[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDenominations = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('denominations')
                .select('*')
                .order('name');

            if (error) throw error;

            setDenominations(data || []);
        } catch (error) {
            console.error('Erro ao buscar denominações:', error);
            // Show toast to help debug
            toast.error('Erro ao carregar denominações. Verifique o console.');
        } finally {
            setLoading(false);
        }
    };

    const addDenomination = async (data: DenominationInput) => {
        try {
            const { data: newDenom, error } = await (supabase as any)
                .from('denominations')
                .insert([data])
                .select()
                .single();

            if (error) throw error;

            setDenominations(prev => [...prev, newDenom].sort((a, b) => a.name.localeCompare(b.name)));
            toast.success('Denominação adicionada com sucesso!');
            return newDenom;
        } catch (error: any) {
            console.error('Erro ao adicionar denominação:', error);
            toast.error(error.message || 'Erro ao adicionar denominação');
            throw error;
        }
    };

    const updateDenomination = async (id: string, data: Partial<DenominationInput>) => {
        try {
            const { data: updatedDenom, error } = await (supabase as any)
                .from('denominations')
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setDenominations(prev => prev.map(d => d.id === id ? updatedDenom : d).sort((a, b) => a.name.localeCompare(b.name)));
            toast.success('Denominação atualizada com sucesso!');
            return updatedDenom;
        } catch (error: any) {
            console.error('Erro ao atualizar denominação:', error);
            toast.error(error.message || 'Erro ao atualizar denominação');
            throw error;
        }
    };

    const deleteDenomination = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('denominations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setDenominations(prev => prev.filter(d => d.id !== id));
            toast.success('Denominação removida com sucesso!');
        } catch (error: any) {
            console.error('Erro ao remover denominação:', error);
            toast.error(error.message || 'Erro ao remover denominação');
            throw error;
        }
    };

    useEffect(() => {
        fetchDenominations();
    }, []);

    return {
        denominations,
        loading,
        fetchDenominations,
        addDenomination,
        updateDenomination,
        deleteDenomination
    };
}
