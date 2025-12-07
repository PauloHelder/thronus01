import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DiscipleshipLeader, DiscipleshipMeeting, Member } from '../types';

// Helper to transform DB member to App member
const transformMember = (data: any): Member => ({
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    status: data.status,
    avatar: data.avatar_url,
    gender: data.gender,
    maritalStatus: data.marital_status,
    birthDate: data.birth_date,
    churchRole: data.church_role,
    isBaptized: data.is_baptized,
    baptismDate: data.baptism_date,
    address: data.address,
    neighborhood: data.neighborhood,
    district: data.district,
    province: data.province,
    country: data.country,
    municipality: data.municipality,
    groupId: data.group_id
});

export const useDiscipleship = () => {
    const { user } = useAuth();
    const [leaders, setLeaders] = useState<any[]>([]); // Using any for list view structure
    const [selectedLeader, setSelectedLeader] = useState<DiscipleshipLeader | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaders = useCallback(async () => {
        if (!user?.churchId) return;
        try {
            setLoading(true);

            // 1. Fetch Leaders
            const { data: leadersData, error: leadersError } = await supabase
                .from('discipleship_leaders' as any)
                .select(`
                    id,
                    member_id,
                    start_date,
                    member:members!inner(id, name, email, avatar_url)
                `)
                .eq('church_id', user.churchId);

            if (leadersError) throw leadersError;

            // 2. Fetch Relationships (Disciples) for these leaders
            const leaderIds = leadersData.map((l: any) => l.id);

            // If no leaders, return empty
            if (leaderIds.length === 0) {
                setLeaders([]);
                return;
            }

            const { data: relationshipsData, error: relError } = await supabase
                .from('discipleship_relationships' as any)
                .select(`
                    id,
                    leader_id,
                    start_date,
                    disciple:members!inner(id, name, email, avatar_url)
                `)
                .in('leader_id', leaderIds)
                .is('end_date', null); // Only active relationships

            if (relError) throw relError;

            // 3. Fetch Meetings Count
            const { data: meetingsData, error: meetingsError } = await supabase
                .from('discipleship_meetings' as any)
                .select('id, leader_id')
                .in('leader_id', leaderIds);

            if (meetingsError) throw meetingsError;

            // 4. Assemble Data for List View
            const formattedLeaders = leadersData.map((leader: any) => {
                const leaderDisciples = relationshipsData
                    .filter((r: any) => r.leader_id === leader.id)
                    .map((r: any) => ({
                        id: r.disciple.id,
                        name: r.disciple.name,
                        email: r.disciple.email,
                        avatar_url: r.disciple.avatar_url,
                        relationship_id: r.id,
                        start_date: r.start_date
                    }));

                const meetingsCount = meetingsData.filter((m: any) => m.leader_id === leader.id).length;

                return {
                    id: leader.id,
                    member_id: leader.member_id,
                    start_date: leader.start_date,
                    member: leader.member,
                    disciples: leaderDisciples,
                    meetings_count: meetingsCount
                };
            });

            setLeaders(formattedLeaders);

        } catch (err: any) {
            console.error('Error fetching discipleship data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.churchId]);

    const fetchLeaderDetails = async (leaderId: string) => {
        setLoading(true);
        try {
            // 1. Fetch Leader Info
            const { data: leaderData, error: leaderError } = await supabase
                .from('discipleship_leaders' as any)
                .select(`
                    id,
                    member_id,
                    start_date,
                    member:members!inner(*)
                `)
                .eq('id', leaderId)
                .single();

            if (leaderError) throw leaderError;

            // 2. Fetch Disciples
            const { data: relationshipsData, error: relError } = await supabase
                .from('discipleship_relationships' as any)
                .select(`
                    id,
                    disciple:members!inner(*)
                `)
                .eq('leader_id', leaderId)
                .is('end_date', null);

            if (relError) throw relError;

            // 3. Fetch Meetings
            const { data: meetingsData, error: meetingsError } = await supabase
                .from('discipleship_meetings' as any)
                .select('*')
                .eq('leader_id', leaderId)
                .order('date', { ascending: false });

            if (meetingsError) throw meetingsError;

            // 4. Fetch Attendance for meetings
            const meetingIds = meetingsData.map((m: any) => m.id);
            let attendanceMap: Record<string, string[]> = {};

            if (meetingIds.length > 0) {
                const { data: attendanceData, error: attError } = await supabase
                    .from('discipleship_meeting_attendance' as any)
                    .select('meeting_id, disciple_id')
                    .in('meeting_id', meetingIds)
                    .eq('present', true);

                if (attError) throw attError;

                attendanceData.forEach((a: any) => {
                    if (!attendanceMap[a.meeting_id]) attendanceMap[a.meeting_id] = [];
                    attendanceMap[a.meeting_id].push(a.disciple_id);
                });
            }

            // Assemble
            const leader: DiscipleshipLeader = {
                id: leaderData.id,
                startDate: leaderData.start_date,
                member: transformMember(leaderData.member),
                disciples: relationshipsData.map((r: any) => transformMember(r.disciple)),
                meetings: meetingsData.map((m: any) => ({
                    id: m.id,
                    leaderId: m.leader_id,
                    date: m.date,
                    status: m.status,
                    notes: m.notes,
                    attendees: attendanceMap[m.id] || []
                }))
            };

            setSelectedLeader(leader);

        } catch (err: any) {
            console.error('Error fetching leader details:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addLeader = async (memberId: string, startDate: string) => {
        if (!user?.churchId) return false;
        try {
            const { error } = await supabase
                .from('discipleship_leaders' as any)
                .insert({
                    church_id: user.churchId,
                    member_id: memberId,
                    start_date: startDate
                });

            if (error) throw error;
            await fetchLeaders();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const addDisciple = async (leaderId: string, discipleId: string, startDate: string = new Date().toISOString()) => {
        try {
            const { error } = await supabase
                .from('discipleship_relationships' as any)
                .insert({
                    leader_id: leaderId,
                    disciple_id: discipleId,
                    start_date: startDate
                });

            if (error) throw error;

            // Refresh whatever view is active
            if (selectedLeader?.id === leaderId) {
                await fetchLeaderDetails(leaderId);
            } else {
                await fetchLeaders();
            }
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const removeDisciple = async (leaderId: string, discipleId: string) => {
        try {
            // Find relationship ID first (since we might only have discipleId)
            const { data: relData, error: findError } = await supabase
                .from('discipleship_relationships' as any)
                .select('id')
                .eq('leader_id', leaderId)
                .eq('disciple_id', discipleId)
                .is('end_date', null)
                .single();

            if (findError) throw findError;

            // Soft delete by setting end_date
            const { error } = await supabase
                .from('discipleship_relationships' as any)
                .update({ end_date: new Date().toISOString() })
                .eq('id', relData.id);

            if (error) throw error;

            if (selectedLeader?.id === leaderId) {
                await fetchLeaderDetails(leaderId);
            } else {
                await fetchLeaders();
            }
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const addMeeting = async (meeting: Omit<DiscipleshipMeeting, 'id'>) => {
        try {
            // Atomic Server-Side Creation via RPC v2
            // This avoids RLS visibility gaps and Foreign Key race conditions
            console.log('Using RPC v2 for atomic meeting creation');

            const { data: meetingId, error: rpcError } = await supabase
                .rpc('create_discipleship_meeting_v2', {
                    p_leader_id: meeting.leaderId,
                    p_date: meeting.date,
                    p_status: meeting.status,
                    p_notes: meeting.notes || '',
                    p_attendees: meeting.attendees || []
                });

            if (rpcError) {
                console.error('RPC Error creating meeting:', rpcError);
                throw rpcError;
            }

            console.log('Meeting created successfully via RPC with ID:', meetingId);

            if (selectedLeader) await fetchLeaderDetails(selectedLeader.id);
            return true;

            if (selectedLeader) await fetchLeaderDetails(selectedLeader.id);
            return true;
        } catch (err: any) {
            setError(err.message);
            console.error('Add meeting flow failed:', err);
            return false;
        }
    };

    const updateMeeting = async (meeting: DiscipleshipMeeting) => {
        try {
            // 1. Update Meeting Details
            const { error: updateError } = await supabase
                .from('discipleship_meetings' as any)
                .update({
                    date: meeting.date,
                    status: meeting.status,
                    notes: meeting.notes
                })
                .eq('id', meeting.id);

            if (updateError) throw updateError;

            // 2. Update Attendance (Delete all and re-insert is easiest for now)
            // Ideally we should diff, but for small lists this is fine
            const { error: deleteError } = await supabase
                .from('discipleship_meeting_attendance' as any)
                .delete()
                .eq('meeting_id', meeting.id);

            if (deleteError) throw deleteError;

            if (meeting.attendees && meeting.attendees.length > 0) {
                const attendanceRows = meeting.attendees.map(discipleId => ({
                    meeting_id: meeting.id,
                    disciple_id: discipleId,
                    present: true
                }));

                const { error: insertError } = await supabase
                    .from('discipleship_meeting_attendance' as any)
                    .insert(attendanceRows);

                if (insertError) throw insertError;
            }

            if (selectedLeader) await fetchLeaderDetails(selectedLeader.id);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteMeeting = async (meetingId: string) => {
        try {
            const { error } = await supabase
                .from('discipleship_meetings' as any)
                .delete()
                .eq('id', meetingId);

            if (error) throw error;

            if (selectedLeader) await fetchLeaderDetails(selectedLeader.id);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchLeaders();
    }, [fetchLeaders]);

    return {
        leaders,
        selectedLeader,
        loading,
        error,
        fetchLeaders,
        fetchLeaderDetails,
        addLeader,
        addDisciple,
        removeDisciple,
        addMeeting,
        updateMeeting,
        deleteMeeting
    };
};
