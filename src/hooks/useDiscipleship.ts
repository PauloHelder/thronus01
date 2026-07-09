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

// Global cache outside the hook function for pub-sub pattern
let cachedLeaders: any[] = [];
let cacheChurchId: string | null = null;
let activeFetchPromise: Promise<any[]> | null = null;
const listeners = new Set<(leaders: any[]) => void>();

const updateCache = (newLeaders: any[]) => {
    cachedLeaders = newLeaders;
    listeners.forEach(listener => listener(newLeaders));
};

export const useDiscipleship = () => {
    const { user } = useAuth();
    const [leaders, setLocalLeaders] = useState<any[]>(cachedLeaders); // Using any for list view structure
    const [selectedLeader, setSelectedLeader] = useState<DiscipleshipLeader | null>(null);
    const [loading, setLoading] = useState(cachedLeaders.length === 0);
    const [error, setError] = useState<string | null>(null);

    // Register listener for cache updates
    useEffect(() => {
        const handler = (updatedLeaders: any[]) => {
            setLocalLeaders(updatedLeaders);
        };
        listeners.add(handler);
        return () => {
            listeners.delete(handler);
        };
    }, []);

    const fetchLeaders = useCallback(async () => {
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
            setLoading(true);
            activeFetchPromise = (async () => {
                // 1. Fetch Leaders (using outer join, handles soft/hard deleted members safely)
                const { data: leadersData, error: leadersError } = await supabase
                    .from('discipleship_leaders' as any)
                    .select(`
                        id,
                        member_id,
                        start_date,
                        member:members(id, name, email, avatar_url, phone)
                    `)
                    .eq('church_id', user.churchId);

                if (leadersError) throw leadersError;

                // 2. Fetch Relationships (Disciples) for these leaders
                const leaderIds = (leadersData || []).map((l: any) => l.id);

                // If no leaders, return empty
                if (leaderIds.length === 0) {
                    return [];
                }

                const { data: relationshipsData, error: relError } = await supabase
                    .from('discipleship_relationships' as any)
                    .select(`
                        id,
                        leader_id,
                        start_date,
                        disciple:members(id, name, email, avatar_url, phone)
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
                const formattedLeaders = (leadersData || [])
                    .filter((l: any) => l.member) // Safety filter: skip orphaned leaders
                    .map((leader: any) => {
                        const leaderDisciples = (relationshipsData || [])
                            .filter((r: any) => r.leader_id === leader.id && r.disciple) // Safety filter: skip orphaned disciples
                            .map((r: any) => ({
                                id: r.disciple.id,
                                name: r.disciple.name,
                                email: r.disciple.email,
                                phone: r.disciple.phone,
                                avatar_url: r.disciple.avatar_url,
                                relationship_id: r.id,
                                start_date: r.start_date
                            }));

                        const meetingsCount = (meetingsData || []).filter((m: any) => m.leader_id === leader.id).length;

                        return {
                            id: leader.id,
                            member_id: leader.member_id,
                            start_date: leader.start_date,
                            member: leader.member,
                            disciples: leaderDisciples,
                            meetings_count: meetingsCount
                        };
                    });

                return formattedLeaders;
            })();

            const result = await activeFetchPromise;
            updateCache(result);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching discipleship data:', err);
            setError('Erro ao carregar dados de discipulado');
        } finally {
            activeFetchPromise = null;
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
                    member:members(*)
                `)
                .eq('id', leaderId)
                .single();

            if (leaderError) throw leaderError;

            // 2. Fetch Disciples
            const { data: relationshipsData, error: relError } = await supabase
                .from('discipleship_relationships' as any)
                .select(`
                    id,
                    disciple:members(*)
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
            const meetingIds = (meetingsData || []).map((m: any) => m.id);
            let attendanceMap: Record<string, string[]> = {};

            if (meetingIds.length > 0) {
                const { data: attendanceData, error: attError } = await supabase
                    .from('discipleship_meeting_attendance' as any)
                    .select('meeting_id, disciple_id')
                    .in('meeting_id', meetingIds)
                    .eq('present', true);

                if (attError) throw attError;

                (attendanceData || []).forEach((a: any) => {
                    if (!attendanceMap[a.meeting_id]) attendanceMap[a.meeting_id] = [];
                    attendanceMap[a.meeting_id].push(a.disciple_id);
                });
            }

            // Assemble with safety fallback
            const fallbackMember: Member = {
                id: '',
                name: 'Membro Excluído',
                email: '',
                phone: '',
                status: 'Inactive',
                avatar: '',
                gender: 'Male',
                maritalStatus: 'Other',
                birthDate: '',
                churchRole: 'Membro',
                isBaptized: false,
                baptismDate: '',
                address: '',
                neighborhood: '',
                district: '',
                province: '',
                country: '',
                municipality: '',
                groupId: ''
            };

            const leader: DiscipleshipLeader = {
                id: leaderData.id,
                startDate: leaderData.start_date,
                member: leaderData.member ? transformMember(leaderData.member) : fallbackMember,
                disciples: (relationshipsData || [])
                    .filter((r: any) => r.disciple)
                    .map((r: any) => transformMember(r.disciple)),
                meetings: (meetingsData || []).map((m: any) => ({
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
            const { data: meetingId, error: rpcError } = await supabase
                .rpc('manage_discipleship_meeting_v2', {
                    p_meeting_id: null, // Insert mode
                    p_leader_id: meeting.leaderId,
                    p_date: meeting.date,
                    p_status: meeting.status,
                    p_notes: meeting.notes || '',
                    p_attendees: meeting.attendees || []
                });

            if (rpcError) throw rpcError;

            if (selectedLeader) await fetchLeaderDetails(selectedLeader.id);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const updateMeeting = async (meeting: DiscipleshipMeeting) => {
        try {
            const { error: rpcError } = await supabase
                .rpc('manage_discipleship_meeting_v2', {
                    p_meeting_id: meeting.id, // Update mode
                    p_leader_id: meeting.leaderId,
                    p_date: meeting.date,
                    p_status: meeting.status,
                    p_notes: meeting.notes || '',
                    p_attendees: meeting.attendees || []
                });

            if (rpcError) throw rpcError;

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

    const deleteLeader = async (leaderId: string) => {
        try {
            const { error } = await supabase
                .from('discipleship_leaders' as any)
                .delete()
                .eq('id', leaderId);

            if (error) throw error;
            await fetchLeaders();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        if (user?.churchId) {
            if (cacheChurchId !== user.churchId) {
                updateCache([]);
                cacheChurchId = user.churchId;
                fetchLeaders();
            } else if (cachedLeaders.length === 0 && !activeFetchPromise) {
                fetchLeaders();
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [user?.churchId, fetchLeaders]);

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
        deleteMeeting,
        deleteLeader
    };
};
