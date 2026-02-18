import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Asset, AssetCategory, AssetMaintenance } from '../types/database.types';
import { toast } from 'sonner';

export const useAssets = () => {
    const { user } = useAuth();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCategories = useCallback(async () => {
        if (!user?.churchId) return;
        try {
            const { data, error } = await (supabase as any)
                .from('asset_categories')
                .select('*')
                .eq('church_id', user.churchId)
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching asset categories:', error);
        }
    }, [user?.churchId]);

    const fetchAssets = useCallback(async () => {
        if (!user?.churchId) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('assets')
                .select(`
                    *,
                    category:asset_categories(*),
                    department:departments(id, name),
                    member:members(id, name)
                `)
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAssets(data || []);
        } catch (error) {
            console.error('Error fetching assets:', error);
            toast.error('Erro ao carregar patrimônio');
        } finally {
            setLoading(false);
        }
    }, [user?.churchId]);

    useEffect(() => {
        fetchCategories();
        fetchAssets();
    }, [fetchCategories, fetchAssets]);

    const addAsset = async (assetData: Omit<Asset, 'id' | 'church_id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
        if (!user?.churchId) return false;
        try {
            const { error } = await (supabase as any)
                .from('assets')
                .insert([{ ...assetData, church_id: user.churchId }]);

            if (error) throw error;
            fetchAssets();
            toast.success('Ativo registrado com sucesso');
            return true;
        } catch (error) {
            console.error('Error adding asset:', error);
            toast.error('Erro ao registrar ativo');
            return false;
        }
    };

    const updateAsset = async (id: string, assetData: Partial<Asset>) => {
        try {
            const { error } = await (supabase as any)
                .from('assets')
                .update({ ...assetData, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            fetchAssets();
            toast.success('Ativo atualizado');
            return true;
        } catch (error) {
            console.error('Error updating asset:', error);
            toast.error('Erro ao atualizar ativo');
            return false;
        }
    };

    const deleteAsset = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('assets')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            fetchAssets();
            toast.success('Ativo removido');
            return true;
        } catch (error) {
            console.error('Error deleting asset:', error);
            toast.error('Erro ao remover ativo');
            return false;
        }
    };

    const addCategory = async (name: string, description?: string, usefulLifeYears: number = 5) => {
        if (!user?.churchId) return false;
        try {
            const { error } = await (supabase as any)
                .from('asset_categories')
                .insert([{ church_id: user.churchId, name, description, useful_life_years: usefulLifeYears }]);

            if (error) throw error;
            fetchCategories();
            toast.success('Categoria adicionada');
            return true;
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Erro ao adicionar categoria');
            return false;
        }
    };

    const addMaintenance = async (maintenanceData: Omit<AssetMaintenance, 'id' | 'created_at'>) => {
        try {
            const { error } = await (supabase as any)
                .from('asset_maintenance')
                .insert([maintenanceData]);

            if (error) throw error;
            toast.success('Manutenção registrada');
            return true;
        } catch (error) {
            console.error('Error adding maintenance:', error);
            toast.error('Erro ao registrar manutenção');
            return false;
        }
    };

    const fetchMaintenanceHistory = async (assetId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('asset_maintenance')
                .select('*')
                .eq('asset_id', assetId)
                .order('maintenance_date', { ascending: false });

            if (error) throw error;
            return data as AssetMaintenance[];
        } catch (error) {
            console.error('Error fetching maintenance history:', error);
            return [];
        }
    };

    const calculateDepreciation = (asset: Asset) => {
        if (!asset.purchase_date || !asset.purchase_price) return Number(asset.purchase_price || 0);

        const purchaseDate = new Date(asset.purchase_date);
        const now = new Date();

        // Useful life from asset or category or default 5
        const usefulLife = asset.useful_life_years || asset.category?.useful_life_years || 5;
        const salvageValue = Number(asset.salvage_value || 0);
        const cost = Number(asset.purchase_price);

        const totalMonths = usefulLife * 12;
        const monthsPassed = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());

        if (monthsPassed <= 0) return cost;
        if (monthsPassed >= totalMonths) return salvageValue;

        const monthlyDepreciation = (cost - salvageValue) / totalMonths;
        const currentValue = cost - (monthlyDepreciation * monthsPassed);

        return Math.max(currentValue, salvageValue);
    };

    return {
        assets,
        categories,
        loading,
        fetchAssets,
        addAsset,
        updateAsset,
        deleteAsset,
        addCategory,
        addMaintenance,
        fetchMaintenanceHistory,
        calculateDepreciation
    };
}
