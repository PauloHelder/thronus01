import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface GroupMeeting {
    id: string;
    group_id: string;
    date: string;
    start_time?: string;
    end_time?: string;
    topic?: string;
    notes?: string;
    location?: string;
    created_at?: string;
    updated_at?: string;
    // Computed fields
    attendance_count?: number;
    total_members?: number;
}

export interface MeetingAttendance {
    id: string;
    meeting_id: string;
    member_id: string;
    status: 'Presente' | 'Ausente' | 'Justificado';
    notes?: string;
    created_at?: string;
    // Joined data
    member_name?: string;
}

export const useGroupMeetings = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // =====================================================
    // FETCH MEETINGS FOR A GROUP
    // =====================================================
    const fetchMeetings = async (groupId: string): Promise<GroupMeeting[]> => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('group_meetings')
                .select('*')
                .eq('group_id', groupId)
                .order('date', { ascending: false });

            if (fetchError) throw fetchError;

            // Get attendance count for each meeting
            const meetingsWithCount = await Promise.all(
                (data || []).map(async (meeting) => {
                    const { count: attendanceCount } = await supabase
                        .from('group_meeting_attendance')
                        .select('*', { count: 'exact', head: true })
                        .eq('meeting_id', meeting.id)
                        .eq('status', 'Presente');

                    const { count: totalMembers } = await supabase
                        .from('group_meeting_attendance')
                        .select('*', { count: 'exact', head: true })
                        .eq('meeting_id', meeting.id);

                    return {
                        ...meeting,
                        attendance_count: attendanceCount || 0,
                        total_members: totalMembers || 0
                    };
                })
            );

            setError(null);
            return meetingsWithCount;
        } catch (err) {
            console.error('Error fetching meetings:', err);
            setError('Erro ao carregar reuniões');
            return [];
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // GET MEETING BY ID
    // =====================================================
    const getMeetingById = async (meetingId: string): Promise<GroupMeeting | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('group_meetings')
                .select('*')
                .eq('id', meetingId)
                .single();

            if (fetchError) throw fetchError;

            const { count: attendanceCount } = await supabase
                .from('group_meeting_attendance')
                .select('*', { count: 'exact', head: true })
                .eq('meeting_id', meetingId)
                .eq('status', 'Presente');

            const { count: totalMembers } = await supabase
                .from('group_meeting_attendance')
                .select('*', { count: 'exact', head: true })
                .eq('meeting_id', meetingId);

            return {
                ...data,
                attendance_count: attendanceCount || 0,
                total_members: totalMembers || 0
            };
        } catch (err) {
            console.error('Error fetching meeting:', err);
            return null;
        }
    };

    // =====================================================
    // CREATE MEETING
    // =====================================================
    const addMeeting = async (meetingData: Omit<GroupMeeting, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            setLoading(true);
            const { data, error: insertError } = await supabase
                .from('group_meetings')
                .insert(meetingData)
                .select()
                .single();

            if (insertError) throw insertError;

            setError(null);
            return data;
        } catch (err) {
            console.error('Error adding meeting:', err);
            setError('Erro ao adicionar reunião');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // UPDATE MEETING
    // =====================================================
    const updateMeeting = async (meetingId: string, meetingData: Partial<GroupMeeting>) => {
        try {
            setLoading(true);
            const { error: updateError } = await supabase
                .from('group_meetings')
                .update({
                    ...meetingData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', meetingId);

            if (updateError) throw updateError;

            setError(null);
            return true;
        } catch (err) {
            console.error('Error updating meeting:', err);
            setError('Erro ao atualizar reunião');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // DELETE MEETING
    // =====================================================
    const deleteMeeting = async (meetingId: string) => {
        try {
            setLoading(true);
            const { error: deleteError } = await supabase
                .from('group_meetings')
                .delete()
                .eq('id', meetingId);

            if (deleteError) throw deleteError;

            setError(null);
            return true;
        } catch (err) {
            console.error('Error deleting meeting:', err);
            setError('Erro ao excluir reunião');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // GET ATTENDANCE FOR A MEETING
    // =====================================================
    const getAttendance = async (meetingId: string): Promise<MeetingAttendance[]> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('group_meeting_attendance')
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

    // =====================================================
    // RECORD ATTENDANCE (bulk)
    // =====================================================
    const recordAttendance = async (
        meetingId: string,
        attendanceRecords: Array<{ member_id: string; status: 'Presente' | 'Ausente' | 'Justificado'; notes?: string }>
    ) => {
        try {
            setLoading(true);

            // Delete existing attendance for this meeting
            await supabase
                .from('group_meeting_attendance')
                .delete()
                .eq('meeting_id', meetingId);

            // Insert new attendance records
            const { error: insertError } = await supabase
                .from('group_meeting_attendance')
                .insert(
                    attendanceRecords.map(record => ({
                        meeting_id: meetingId,
                        ...record
                    }))
                );

            if (insertError) throw insertError;

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

    // =====================================================
    // UPDATE SINGLE ATTENDANCE
    // =====================================================
    const updateAttendance = async (
        attendanceId: string,
        status: 'Presente' | 'Ausente' | 'Justificado',
        notes?: string
    ) => {
        try {
            const { error: updateError } = await supabase
                .from('group_meeting_attendance')
                .update({ status, notes })
                .eq('id', attendanceId);

            if (updateError) throw updateError;
            return true;
        } catch (err) {
            console.error('Error updating attendance:', err);
            setError('Erro ao atualizar presença');
            return false;
        }
    };

    // =====================================================
    // GET ATTENDANCE STATISTICS
    // =====================================================
    const getAttendanceStats = async (groupId: string, startDate?: string, endDate?: string) => {
        try {
            let query = supabase
                .from('group_meetings')
                .select(`
                    id,
                    date,
                    group_meeting_attendance(status)
                `)
                .eq('group_id', groupId);

            if (startDate) query = query.gte('date', startDate);
            if (endDate) query = query.lte('date', endDate);

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Calculate statistics
            const totalMeetings = data?.length || 0;
            let totalPresent = 0;
            let totalAbsent = 0;
            let totalJustified = 0;

            data?.forEach(meeting => {
                meeting.group_meeting_attendance?.forEach((att: any) => {
                    if (att.status === 'Presente') totalPresent++;
                    else if (att.status === 'Ausente') totalAbsent++;
                    else if (att.status === 'Justificado') totalJustified++;
                });
            });

            const totalRecords = totalPresent + totalAbsent + totalJustified;
            const attendanceRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

            return {
                totalMeetings,
                totalPresent,
                totalAbsent,
                totalJustified,
                attendanceRate: Math.round(attendanceRate * 10) / 10
            };
        } catch (err) {
            console.error('Error fetching attendance stats:', err);
            return null;
        }
    };

    return {
        loading,
        error,
        fetchMeetings,
        getMeetingById,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        getAttendance,
        recordAttendance,
        updateAttendance,
        getAttendanceStats
    };
};
