import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Event {
    id: string;
    church_id: string;
    title: string;
    description?: string;
    date: string;
    time: string;
    location?: string;
    type: string;
    organizer?: string;
    max_participants?: number;
    registered_count?: number;
    status: string;
    image?: string;
    created_at?: string;
}

export const useEvents = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = async () => {
        if (!user?.churchId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('events')
                .select('*')
                .eq('church_id', user.churchId)
                .order('date', { ascending: true });

            if (fetchError) throw fetchError;

            setEvents(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Erro ao carregar eventos');
        } finally {
            setLoading(false);
        }
    };

    const addEvent = async (eventData: Omit<Event, 'id' | 'church_id' | 'created_at'>) => {
        if (!user?.churchId) return false;

        try {
            const { data, error: insertError } = await supabase
                .from('events')
                .insert({
                    ...eventData,
                    church_id: user.churchId
                })
                .select()
                .single();

            if (insertError) throw insertError;

            setEvents(prev => [...prev, data]);
            return true;
        } catch (err) {
            console.error('Error adding event:', err);
            setError('Erro ao adicionar evento');
            return false;
        }
    };

    const updateEvent = async (id: string, eventData: Partial<Event>) => {
        try {
            const { data, error: updateError } = await supabase
                .from('events')
                .update(eventData)
                .eq('id', id)
                .eq('church_id', user?.churchId)
                .select()
                .single();

            if (updateError) throw updateError;

            setEvents(prev => prev.map(e => e.id === id ? data : e));
            return true;
        } catch (err) {
            console.error('Error updating event:', err);
            setError('Erro ao atualizar evento');
            return false;
        }
    };

    const deleteEvent = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('events')
                .delete()
                .eq('id', id)
                .eq('church_id', user?.churchId);

            if (deleteError) throw deleteError;

            setEvents(prev => prev.filter(e => e.id !== id));
            return true;
        } catch (err) {
            console.error('Error deleting event:', err);
            setError('Erro ao excluir evento');
            return false;
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [user?.churchId]);

    return {
        events,
        loading,
        error,
        addEvent,
        updateEvent,
        deleteEvent,
        refetch: fetchEvents
    };
};
