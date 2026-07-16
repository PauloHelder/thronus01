import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface DBCountry {
    id: string;
    name: string;
    created_at?: string;
}

export interface DBProvince {
    id: string;
    name: string;
    country_id: string;
    created_at?: string;
}

export interface DBMunicipality {
    id: string;
    name: string;
    province_id: string;
    created_at?: string;
}

export function useLocations() {
    const [countries, setCountries] = useState<DBCountry[]>([]);
    const [provinces, setProvinces] = useState<DBProvince[]>([]);
    const [municipalities, setMunicipalities] = useState<DBMunicipality[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        try {
            const [countriesRes, provincesRes, municipalitiesRes] = await Promise.all([
                supabase.from('countries').select('*').order('name'),
                supabase.from('provinces').select('*').order('name'),
                supabase.from('municipalities').select('*').order('name')
            ]);

            if (countriesRes.error) throw countriesRes.error;
            if (provincesRes.error) throw provincesRes.error;
            if (municipalitiesRes.error) throw municipalitiesRes.error;

            setCountries(countriesRes.data || []);
            setProvinces(provincesRes.data || []);
            setMunicipalities(municipalitiesRes.data || []);
        } catch (err: any) {
            console.error('Error fetching locations:', err);
            // Don't show toast error here to avoid spamming the user if tables aren't created yet
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    // Country CRUD
    const addCountry = async (id: string, name: string) => {
        try {
            const { error } = await supabase
                .from('countries')
                .insert({ id: id.toUpperCase().trim(), name: name.trim() });
            if (error) throw error;
            toast.success('País adicionado com sucesso!');
            await fetchLocations();
        } catch (err: any) {
            console.error('Error adding country:', err);
            toast.error(`Erro ao adicionar país: ${err.message}`);
            throw err;
        }
    };

    const updateCountry = async (id: string, name: string) => {
        try {
            const { error } = await supabase
                .from('countries')
                .update({ name: name.trim() })
                .eq('id', id);
            if (error) throw error;
            toast.success('País atualizado com sucesso!');
            await fetchLocations();
        } catch (err: any) {
            console.error('Error updating country:', err);
            toast.error(`Erro ao atualizar país: ${err.message}`);
            throw err;
        }
    };

    const deleteCountry = async (id: string) => {
        try {
            const { error } = await supabase
                .from('countries')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success('País excluído com sucesso!');
            await fetchLocations();
        } catch (err: any) {
            console.error('Error deleting country:', err);
            toast.error(`Erro ao excluir país: ${err.message}`);
            throw err;
        }
    };

    // Province CRUD
    const addProvince = async (name: string, countryId: string) => {
        try {
            const slug = name.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            const id = `${countryId.toLowerCase()}-${slug}`;

            const { error } = await supabase
                .from('provinces')
                .insert({ id, name: name.trim(), country_id: countryId });
            if (error) throw error;
            toast.success('Província adicionada com sucesso!');
            await fetchLocations();
        } catch (err: any) {
            console.error('Error adding province:', err);
            toast.error(`Erro ao adicionar província: ${err.message}`);
            throw err;
        }
    };

    const updateProvince = async (id: string, name: string, countryId: string) => {
        try {
            const { error } = await supabase
                .from('provinces')
                .update({ name: name.trim(), country_id: countryId })
                .eq('id', id);
            if (error) throw error;
            toast.success('Província atualizada com sucesso!');
            await fetchLocations();
        } catch (err: any) {
            console.error('Error updating province:', err);
            toast.error(`Erro ao atualizar província: ${err.message}`);
            throw err;
        }
    };

    const deleteProvince = async (id: string) => {
        try {
            const { error } = await supabase
                .from('provinces')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success('Província excluída com sucesso!');
            await fetchLocations();
        } catch (err: any) {
            console.error('Error deleting province:', err);
            toast.error(`Erro ao excluir província: ${err.message}`);
            throw err;
        }
    };

    // Municipality CRUD
    const addMunicipality = async (name: string, provinceId: string) => {
        try {
            const slug = name.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            const id = `${provinceId}-${slug}`;

            const { error } = await supabase
                .from('municipalities')
                .insert({ id, name: name.trim(), province_id: provinceId });
            if (error) throw error;
            toast.success('Município adicionado com sucesso!');
            await fetchLocations();
        } catch (err: any) {
            console.error('Error adding municipality:', err);
            toast.error(`Erro ao adicionar município: ${err.message}`);
            throw err;
        }
    };

    const updateMunicipality = async (id: string, name: string, provinceId: string) => {
        try {
            const { error } = await supabase
                .from('municipalities')
                .update({ name: name.trim(), province_id: provinceId })
                .eq('id', id);
            if (error) throw error;
            toast.success('Município atualizado com sucesso!');
            await fetchLocations();
        } catch (err: any) {
            console.error('Error updating municipality:', err);
            toast.error(`Erro ao atualizar município: ${err.message}`);
            throw err;
        }
    };

    const deleteMunicipality = async (id: string) => {
        try {
            const { error } = await supabase
                .from('municipalities')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success('Município excluído com sucesso!');
            await fetchLocations();
        } catch (err: any) {
            console.error('Error deleting municipality:', err);
            toast.error(`Erro ao excluir município: ${err.message}`);
            throw err;
        }
    };

    return {
        countries,
        provinces,
        municipalities,
        loading,
        refetch: fetchLocations,
        addCountry,
        updateCountry,
        deleteCountry,
        addProvince,
        updateProvince,
        deleteProvince,
        addMunicipality,
        updateMunicipality,
        deleteMunicipality
    };
}
