import { useState, useEffect } from 'react';
import { supabase, getCurrentUserChurchId } from '../lib/supabase';

export interface EventType {
    id: string;
    churchId: string;
    name: string;
    color: string;
    description: string | null;
    isDefault: boolean;
}

export function useEventTypes() {
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEventTypes = async () => {
        try {
            setLoading(true);
            setError(null);

            const churchId = await getCurrentUserChurchId();
            if (!churchId) {
                setEventTypes([]);
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('event_types')
                .select('*')
                .eq('church_id', churchId)
                .is('deleted_at', null)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            const mappedTypes: EventType[] = (data || []).map((dbType: any) => ({
                id: dbType.id,
                churchId: dbType.church_id,
                name: dbType.name,
                color: dbType.color || 'bg-gray-100 text-gray-700',
                description: dbType.description,
                isDefault: dbType.is_default
            }));

            setEventTypes(mappedTypes);
        } catch (err) {
            console.error('Error fetching event types:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch event types');
        } finally {
            setLoading(false);
        }
    };

    const createEventType = async (name: string, description?: string, color?: string) => {
        try {
            const churchId = await getCurrentUserChurchId();
            if (!churchId) {
                throw new Error('No church ID found. Please make sure you are logged in.');
            }

            const insertData = {
                church_id: churchId,
                name: name,
                description: description || null,
                color: color || 'bg-gray-100 text-gray-700',
                is_default: false
            };

            const { data, error: insertError } = await supabase
                .from('event_types')
                .insert(insertData as any)
                .select()
                .single();

            if (insertError) throw insertError;

            const newType: EventType = {
                id: data.id,
                churchId: data.church_id,
                name: data.name,
                color: data.color || 'bg-gray-100 text-gray-700',
                description: data.description,
                isDefault: data.is_default
            };

            setEventTypes(prev => [...prev, newType]);
            return newType;
        } catch (err) {
            console.error('Error creating event type:', err);
            throw err;
        }
    };

    const updateEventType = async (id: string, name: string, description?: string, color?: string) => {
        try {
            const updateData: any = { name };
            if (description !== undefined) updateData.description = description || null;
            if (color !== undefined) updateData.color = color || 'bg-gray-100 text-gray-700';

            const { data, error: updateError } = await supabase
                .from('event_types')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            const updatedType: EventType = {
                id: data.id,
                churchId: data.church_id,
                name: data.name,
                color: data.color || 'bg-gray-100 text-gray-700',
                description: data.description,
                isDefault: data.is_default
            };

            setEventTypes(prev => prev.map(t => t.id === id ? updatedType : t));
            return updatedType;
        } catch (err) {
            console.error('Error updating event type:', err);
            throw err;
        }
    };

    const deleteEventType = async (id: string) => {
        try {
            const typeToDelete = eventTypes.find(t => t.id === id);
            if (typeToDelete?.isDefault) {
                throw new Error('Não é possível excluir categorias de evento padrão');
            }

            const { error: deleteError } = await supabase
                .from('event_types')
                .update({ deleted_at: new Date().toISOString() } as any)
                .eq('id', id);

            if (deleteError) throw deleteError;

            setEventTypes(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Error deleting event type:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchEventTypes();
    }, []);

    return {
        eventTypes,
        loading,
        error,
        refetch: fetchEventTypes,
        createEventType,
        updateEventType,
        deleteEventType
    };
}
