import { useState, useEffect } from 'react';
import { supabase, getCurrentUserChurchId } from '../lib/supabase';

export interface ServiceType {
    id: string;
    churchId: string;
    name: string;
    defaultStartTime: string | null;
    isDefault: boolean;
    displayOrder: number;
}

export function useServiceTypes() {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch service types from Supabase
    const fetchServiceTypes = async () => {
        try {
            setLoading(true);
            setError(null);

            const churchId = await getCurrentUserChurchId();
            if (!churchId) {
                setServiceTypes([]);
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('service_types')
                .select('*')
                .eq('church_id', churchId)
                .is('deleted_at', null)
                .order('display_order', { ascending: true });

            if (fetchError) throw fetchError;

            const mappedTypes: ServiceType[] = (data || []).map((dbType: any) => ({
                id: dbType.id,
                churchId: dbType.church_id,
                name: dbType.name,
                defaultStartTime: dbType.default_start_time,
                isDefault: dbType.is_default,
                displayOrder: dbType.display_order
            }));

            setServiceTypes(mappedTypes);
        } catch (err) {
            console.error('Error fetching service types:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch service types');
        } finally {
            setLoading(false);
        }
    };

    // Create a new service type
    const createServiceType = async (name: string, defaultStartTime?: string) => {
        try {
            const churchId = await getCurrentUserChurchId();
            if (!churchId) {
                throw new Error('No church ID found. Please make sure you are logged in.');
            }

            // Get the next display order
            const maxOrder = serviceTypes.length > 0
                ? Math.max(...serviceTypes.map(t => t.displayOrder))
                : 0;

            const insertData = {
                church_id: churchId,
                name: name,
                default_start_time: defaultStartTime || null,
                is_default: false,
                display_order: maxOrder + 1
            };

            console.log('Creating service type with data:', insertData);

            const { data, error: insertError } = await supabase
                .from('service_types')
                .insert(insertData as any)
                .select()
                .single();

            if (insertError) {
                console.error('Supabase insert error:', insertError);
                throw insertError;
            }

            if (!data) {
                throw new Error('No data returned from insert');
            }

            const newType: ServiceType = {
                id: data.id,
                churchId: data.church_id,
                name: data.name,
                defaultStartTime: data.default_start_time,
                isDefault: data.is_default,
                displayOrder: data.display_order
            };

            setServiceTypes(prev => [...prev, newType]);
            return newType;
        } catch (err) {
            console.error('Error creating service type:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            throw new Error(`Erro ao criar tipo de culto: ${errorMessage}`);
        }
    };

    // Update a service type
    const updateServiceType = async (id: string, name: string, defaultStartTime?: string) => {
        try {
            const updateData: any = { name };
            if (defaultStartTime !== undefined) {
                updateData.default_start_time = defaultStartTime || null;
            }

            const { data, error: updateError } = await supabase
                .from('service_types')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            const updatedType: ServiceType = {
                id: data.id,
                churchId: data.church_id,
                name: data.name,
                defaultStartTime: data.default_start_time,
                isDefault: data.is_default,
                displayOrder: data.display_order
            };

            setServiceTypes(prev => prev.map(t => t.id === id ? updatedType : t));
            return updatedType;
        } catch (err) {
            console.error('Error updating service type:', err);
            throw err;
        }
    };

    // Delete a service type (only non-default ones)
    const deleteServiceType = async (id: string) => {
        try {
            // Check if it's a default type
            const typeToDelete = serviceTypes.find(t => t.id === id);
            if (typeToDelete?.isDefault) {
                throw new Error('Não é possível excluir tipos de culto padrão');
            }

            const { error: deleteError } = await supabase
                .from('service_types')
                .update({ deleted_at: new Date().toISOString() } as any)
                .eq('id', id);

            if (deleteError) throw deleteError;

            setServiceTypes(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Error deleting service type:', err);
            throw err;
        }
    };

    // Reorder service types
    const reorderServiceTypes = async (reorderedTypes: ServiceType[]) => {
        try {
            // Update display_order for all types
            const updates = reorderedTypes.map((type, index) => ({
                id: type.id,
                display_order: index + 1
            }));

            for (const update of updates) {
                await supabase
                    .from('service_types')
                    .update({ display_order: update.display_order } as any)
                    .eq('id', update.id);
            }

            setServiceTypes(reorderedTypes);
        } catch (err) {
            console.error('Error reordering service types:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchServiceTypes();
    }, []);

    return {
        serviceTypes,
        loading,
        error,
        fetchServiceTypes,
        createServiceType,
        updateServiceType,
        deleteServiceType,
        reorderServiceTypes
    };
}
