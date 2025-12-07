import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';

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
            const mappedEvents: Event[] = (data || []).map(item => ({
                id: item.id,
                title: item.title,
                date: item.date,
                time: item.start_time || '',
                type: item.type as Event['type'],
                description: item.description || undefined,
                coverUrl: item.cover_url || undefined,
                attendees: item.event_attendees?.map((a: any) => a.member_id) || []
            }));

            setEvents(mappedEvents);
            setError(null);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Erro ao carregar eventos');
        } finally {
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
