import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface DepartmentMeeting {
    id: string;
    department_id: string;
    date: string;
    start_time?: string;
    end_time?: string;
    topic?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    // Computed fields
    attendance_count?: number;
    total_members?: number;
}

export interface DepartmentMeetingAttendance {
    id: string;
    meeting_id: string;
    member_id: string;
    status: 'Presente' | 'Ausente' | 'Justificado';
    notes?: string;
    created_at?: string;
    // Joined data
    member_name?: string;
}

export const useDepartmentMeetings = (departmentId?: string) => {
    const [meetings, setMeetings] = useState<DepartmentMeeting[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMeetings = useCallback(async (id?: string) => {
        const targetId = id || departmentId;
        if (!targetId) return;

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('department_meetings')
                .select('*')
                .eq('department_id', targetId)
                .order('date', { ascending: false });

            if (fetchError) throw fetchError;

            // Get attendance count for each meeting
            const meetingsWithCount = await Promise.all(
                (data || []).map(async (meeting) => {
                    const { count: attendanceCount } = await supabase
                        .from('department_meeting_attendance')
                        .select('*', { count: 'exact', head: true })
                        .eq('meeting_id', meeting.id)
                        .eq('status', 'Presente');

                    const { count: totalMembers } = await supabase
                        .from('department_meeting_attendance')
                        .select('*', { count: 'exact', head: true })
                        .eq('meeting_id', meeting.id);

                    return {
                        ...meeting,
                        attendance_count: attendanceCount || 0,
                        total_members: totalMembers || 0
                    };
                })
            );

            setMeetings(meetingsWithCount);
            setError(null);
        } catch (err) {
            console.error('Error fetching department meetings:', err);
            setError('Erro ao carregar reuniões');
        } finally {
            setLoading(false);
        }
    }, [departmentId]);

    const addMeeting = async (meetingData: Omit<DepartmentMeeting, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            setLoading(true);
            const { data, error: insertError } = await supabase
                .from('department_meetings')
                .insert(meetingData)
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchMeetings();
            setError(null);
            return data;
        } catch (err) {
            console.error('Error adding department meeting:', err);
            setError('Erro ao adicionar reunião');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateMeeting = async (meetingId: string, meetingData: Partial<DepartmentMeeting>) => {
        try {
            setLoading(true);
            const { error: updateError } = await supabase
                .from('department_meetings')
                .update({
                    ...meetingData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', meetingId);

            if (updateError) throw updateError;

            await fetchMeetings();
            setError(null);
            return true;
        } catch (err) {
            console.error('Error updating department meeting:', err);
            setError('Erro ao atualizar reunião');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteMeeting = async (meetingId: string) => {
        try {
            setLoading(true);
            const { error: deleteError } = await supabase
                .from('department_meetings')
                .delete()
                .eq('id', meetingId);

            if (deleteError) throw deleteError;

            await fetchMeetings();
            setError(null);
            return true;
        } catch (err) {
            console.error('Error deleting department meeting:', err);
            setError('Erro ao excluir reunião');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const getAttendance = async (meetingId: string): Promise<DepartmentMeetingAttendance[]> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('department_meeting_attendance')
                .select(`
                    *,
                    member:members(name)
                `)
                .eq('meeting_id', meetingId)
                .order('status', { ascending: true });

            if (fetchError) throw fetchError;

            return (data || []).map(att => ({
                ...att,
                member_name: att.member?.name
            }));
        } catch (err) {
            console.error('Error fetching attendance:', err);
            return [];
        }
    };

    const recordAttendance = async (
        meetingId: string,
        attendanceRecords: Array<{ member_id: string; status: 'Presente' | 'Ausente' | 'Justificado'; notes?: string }>
    ) => {
        try {
            setLoading(true);

            // Delete existing attendance for this meeting
            await supabase
                .from('department_meeting_attendance')
                .delete()
                .eq('meeting_id', meetingId);

            // Insert new attendance records
            const { error: insertError } = await supabase
                .from('department_meeting_attendance')
                .insert(
                    attendanceRecords.map(record => ({
                        meeting_id: meetingId,
                        ...record
                    }))
                );

            if (insertError) throw insertError;

            await fetchMeetings();
            setError(null);
            return true;
        } catch (err) {
            console.error('Error recording attendance:', err);
            setError('Erro ao registrar presença');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        meetings,
        loading,
        error,
        fetchMeetings,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        getAttendance,
        recordAttendance
    };
};
