import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';

// Global cache outside the hook function for pub-sub pattern
let cachedEvents: Event[] = (() => {
    try {
        const val = localStorage.getItem('thronus_cache_events');
        return val ? JSON.parse(val) : [];
    } catch {
        return [];
    }
})();
let cacheChurchId: string | null = (() => {
    try {
        return localStorage.getItem('thronus_cache_church_id_events');
    } catch {
        return null;
    }
})();
let lastFetchTime = 0;
let activeFetchPromise: Promise<Event[]> | null = null;
const listeners = new Set<(events: Event[]) => void>();

const updateCache = (newEvents: Event[]) => {
    cachedEvents = newEvents;
    try {
        localStorage.setItem('thronus_cache_events', JSON.stringify(newEvents));
        if (cacheChurchId) {
            localStorage.setItem('thronus_cache_church_id_events', cacheChurchId);
        }
    } catch (e) {
        console.warn('Failed to save events cache:', e);
    }
    listeners.forEach(listener => listener(newEvents));
};

export const useEvents = () => {
    const { user } = useAuth();
    const [events, setLocalEvents] = useState<Event[]>(cachedEvents);
    const [loading, setLoading] = useState(cachedEvents.length === 0);
    const [error, setError] = useState<string | null>(null);

    // Register listener for cache updates
    useEffect(() => {
        const handler = (updatedEvents: Event[]) => {
            setLocalEvents(updatedEvents);
        };
        listeners.add(handler);
        return () => {
            listeners.delete(handler);
        };
    }, []);

    const fetchEvents = async (forceSilent = false) => {
        if (!user?.churchId) {
            setLoading(false);
            return;
        }

        if (activeFetchPromise) {
            try {
                await activeFetchPromise;
            } catch {}
            return;
        }

        try {
            if (cachedEvents.length === 0 && !forceSilent) {
                setLoading(true);
            }
            activeFetchPromise = (async () => {
                const { data, error: fetchError } = await supabase
                    .from('events')
                    .select(`
                        *,
                        event_attendees (
                            member_id
                        )
                    `)
                    .eq('church_id', user.churchId)
                    .is('deleted_at', null)
                    .order('date', { ascending: true });

                if (fetchError) throw fetchError;

                // Map DB event to UI Event
                return (data || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    date: item.date,
                    time: item.start_time || '',
                    type: item.type as Event['type'],
                    description: item.description || undefined,
                    coverUrl: item.cover_url || undefined,
                    attendees: item.event_attendees?.map((a: any) => a.member_id) || []
                }));
            })();

            const result = await activeFetchPromise;
            lastFetchTime = Date.now();
            updateCache(result);
            setError(null);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Erro ao carregar eventos');
        } finally {
            activeFetchPromise = null;
            setLoading(false);
        }
    };

    const uploadCoverImage = async (file: File): Promise<string | null> => {
        if (!user?.churchId) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${user.churchId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('event-covers')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('event-covers')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    const addEvent = async (eventData: Omit<Event, 'id'>, coverFile?: File) => {
        if (!user?.churchId) return false;

        try {
            let finalCoverUrl = eventData.coverUrl;

            // Upload image if provided
            if (coverFile) {
                const uploadedUrl = await uploadCoverImage(coverFile);
                if (uploadedUrl) {
                    finalCoverUrl = uploadedUrl;
                }
            }

            // 1. Create Event
            const { data: newEvent, error: insertError } = await supabase
                .from('events')
                .insert({
                    church_id: user.churchId,
                    title: eventData.title,
                    description: eventData.description,
                    type: eventData.type,
                    date: eventData.date,
                    start_time: eventData.time,
                    cover_url: finalCoverUrl,
                } as any)
                .select()
                .single();

            if (insertError) throw insertError;
            if (!newEvent) throw new Error('Failed to create event: No data returned');

            // 2. Add Attendees if any
            if (eventData.attendees && eventData.attendees.length > 0) {
                const attendeesToInsert = eventData.attendees.map(memberId => ({
                    event_id: newEvent.id,
                    member_id: memberId
                }));

                const { error: attendeesError } = await supabase
                    .from('event_attendees')
                    .insert(attendeesToInsert as any);

                if (attendeesError) console.error('Error adding attendees:', attendeesError);
            }

            // Refresh list
            await fetchEvents();
            return true;
        } catch (err) {
            console.error('Error adding event:', err);
            setError(err instanceof Error ? err.message : 'Erro ao adicionar evento');
            return false;
        }
    };

    const updateEvent = async (id: string, eventData: Omit<Event, 'id'> | Partial<Event>, coverFile?: File) => {
        if (!user?.churchId) return false;

        try {
            let finalCoverUrl = eventData.coverUrl;

            // Upload image if provided
            if (coverFile) {
                const uploadedUrl = await uploadCoverImage(coverFile);
                if (uploadedUrl) {
                    finalCoverUrl = uploadedUrl;
                }
            }

            // 1. Update Event Details
            const updatePayload: any = {};
            if (eventData.title !== undefined) updatePayload.title = eventData.title;
            if (eventData.description !== undefined) updatePayload.description = eventData.description;
            if (eventData.type !== undefined) updatePayload.type = eventData.type;
            if (eventData.date !== undefined) updatePayload.date = eventData.date;
            if (eventData.time !== undefined) updatePayload.start_time = eventData.time;
            if (finalCoverUrl !== undefined) updatePayload.cover_url = finalCoverUrl;

            const { error: updateError } = await supabase
                .from('events')
                .update(updatePayload as any)
                .eq('id', id)
                .eq('church_id', user.churchId);

            if (updateError) throw updateError;

            // 2. Update Attendees (if provided)
            if (eventData.attendees !== undefined) {
                // First delete existing
                const { error: deleteError } = await supabase
                    .from('event_attendees')
                    .delete()
                    .eq('event_id', id);

                if (deleteError) throw deleteError;

                // Then insert new ones
                if (eventData.attendees.length > 0) {
                    const attendeesToInsert = eventData.attendees.map(memberId => ({
                        event_id: id,
                        member_id: memberId
                    }));

                    const { error: insertAttendeesError } = await supabase
                        .from('event_attendees')
                        .insert(attendeesToInsert as any);

                    if (insertAttendeesError) throw insertAttendeesError;
                }
            }

            await fetchEvents();
            return true;
        } catch (err) {
            console.error('Error updating event:', err);
            setError(err instanceof Error ? err.message : 'Erro ao atualizar evento');
            return false;
        }
    };

    const deleteEvent = async (id: string) => {
        if (!user?.churchId) return false;

        try {
            // Soft delete
            const { error: deleteError } = await supabase
                .from('events')
                .update({ deleted_at: new Date().toISOString() } as any)
                .eq('id', id)
                .eq('church_id', user.churchId);

            if (deleteError) throw deleteError;

            updateCache(cachedEvents.filter(e => e.id !== id));
            return true;
        } catch (err) {
            console.error('Error deleting event:', err);
            setError('Erro ao excluir evento');
            return false;
        }
    };

    useEffect(() => {
        if (user?.churchId) {
            const now = Date.now();
            if (cacheChurchId !== user.churchId) {
                cacheChurchId = user.churchId;
                try {
                    localStorage.removeItem('thronus_cache_events');
                    localStorage.removeItem('thronus_cache_church_id_events');
                } catch {}
                updateCache([]);
                lastFetchTime = 0;
                fetchEvents();
            } else if (cachedEvents.length === 0) {
                fetchEvents();
            } else if (now - lastFetchTime > 180000 && !activeFetchPromise) { // 3 minutes TTL
                fetchEvents(true); // background fetch
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
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
