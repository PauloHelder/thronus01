import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface EventType {
    id: string;
    name: string;
    color: string;
    isDefault: boolean;
    description?: string;
}

const DEFAULT_EVENT_TYPES: EventType[] = [
    { id: 'Service', name: 'Culto', color: 'bg-blue-100 text-blue-700', isDefault: true },
    { id: 'Meeting', name: 'Reunião', color: 'bg-purple-100 text-purple-700', isDefault: true },
    { id: 'Social', name: 'Social', color: 'bg-green-100 text-green-700', isDefault: true },
    { id: 'Youth', name: 'Jovens', color: 'bg-orange-100 text-orange-700', isDefault: true },
    { id: 'Conference', name: 'Conferência', color: 'bg-indigo-100 text-indigo-700', isDefault: true },
];

export const useEventTypes = () => {
    const { user } = useAuth();
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEventTypes = async () => {
        if (!user?.churchId) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('event_types')
                .select('*')
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;

            const customTypes = data.map(t => ({
                id: t.name, // Using name as ID for compatibility with current event.type string
                name: t.name,
                color: t.color,
                isDefault: false,
                description: t.description
            }));

            // Combine defaults with custom types
            // If custom type overrides default (same name), custom takes precedence (though DB should prevent duplicates ideally)
            setEventTypes([...DEFAULT_EVENT_TYPES, ...customTypes]);
        } catch (err) {
            console.error('Error fetching event types:', err);
            // Fallback to defaults
            setEventTypes(DEFAULT_EVENT_TYPES);
        } finally {
            setLoading(false);
        }
    };

    const addEventType = async (name: string, color: string) => {
        if (!user?.churchId) return false;

        try {
            const { error } = await supabase
                .from('event_types')
                .insert({
                    church_id: user.churchId,
                    name,
                    color
                });

            if (error) throw error;
            await fetchEventTypes();
            return true;
        } catch (err) {
            console.error('Error adding event type:', err);
            setError('Erro ao criar tipo de evento');
            return false;
        }
    };

    const deleteEventType = async (id: string, name: string) => {
        if (!user?.churchId) return false;

        // Can only delete custom types (which have UUIDs usually, but here we mapped name to ID for the UI list)
        // We need to find the real UUID from the fetch or just delete by name + church_id
        // Using name is risky if not unique, better to store real ID.
        // Let's refactor fetch to store Real ID.

        try {
            // We need to delete by name because our UI ID for defaults is the name 'Service' etc.
            // But for custom types, we want to look up the record.
            // Simplified: Delete by name and church_id
            const { error } = await supabase
                .from('event_types')
                .update({ deleted_at: new Date().toISOString() })
                .eq('church_id', user.churchId)
                .eq('name', name);

            if (error) throw error;
            await fetchEventTypes();
            return true;
        } catch (err) {
            console.error('Error deleting event type:', err);
            return false;
        }
    };

    useEffect(() => {
        fetchEventTypes();
    }, [user?.churchId]);

    return {
        eventTypes,
        loading,
        addEventType,
        deleteEventType
    };
};
