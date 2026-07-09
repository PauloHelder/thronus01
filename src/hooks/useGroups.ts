import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Group {
    id: string;
    church_id: string;
    name: string;
    description?: string;
    type: string;
    leader_id?: string;
    co_leader_id?: string;
    meeting_day?: string;
    meeting_time?: string;
    location?: string;
    address?: string;
    neighborhood?: string;
    district?: string;
    province?: string;
    country?: string;
    municipality?: string;
    status: string;
    max_members?: number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
    // Computed fields
    member_count?: number;
    leader_name?: string;
    co_leader_name?: string;
}

export interface GroupMember {
    id: string;
    group_id: string;
    member_id: string;
    role: string;
    joined_at: string;
    left_at?: string;
    // Joined data
    member_name?: string;
    member_email?: string;
    member_phone?: string;
}

// Global cache outside the hook function for pub-sub pattern
let cachedGroups: Group[] = [];
let cacheChurchId: string | null = null;
let activeFetchPromise: Promise<Group[]> | null = null;
const listeners = new Set<(groups: Group[]) => void>();

const updateCache = (newGroups: Group[]) => {
    cachedGroups = newGroups;
    listeners.forEach(listener => listener(newGroups));
};

export const useGroups = () => {
    const { user } = useAuth();
    const [groups, setLocalGroups] = useState<Group[]>(cachedGroups);
    const [loading, setLoading] = useState(cachedGroups.length === 0);
    const [error, setError] = useState<string | null>(null);

    // Register listener for cache updates
    useEffect(() => {
        const handler = (updatedGroups: Group[]) => {
            setLocalGroups(updatedGroups);
        };
        listeners.add(handler);
        return () => {
            listeners.delete(handler);
        };
    }, []);

    // =====================================================
    // FETCH ALL GROUPS
    // =====================================================
    const fetchGroups = async () => {
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
                const { data, error: fetchError } = await supabase
                    .from('groups')
                    .select(`
                        *,
                        leader:members!leader_id(name, phone),
                        co_leader:members!co_leader_id(name, phone),
                        group_members(id)
                    `)
                    .eq('church_id', user.churchId)
                    .is('deleted_at', null)
                    .is('group_members.left_at', null)
                    .order('name', { ascending: true });

                if (fetchError) throw fetchError;

                return (data || []).map(group => ({
                    ...group,
                    member_count: (group.group_members as any[])?.length || 0,
                    leader_name: group.leader?.name,
                    co_leader_name: group.co_leader?.name
                }));
            })();

            const result = await activeFetchPromise;
            updateCache(result);
            setError(null);
        } catch (err) {
            console.error('Error fetching groups:', err);
            setError('Erro ao carregar grupos');
        } finally {
            activeFetchPromise = null;
            setLoading(false);
        }
    };

    // =====================================================
    // GET GROUP BY ID (with details)
    // =====================================================
    const getGroupById = async (id: string): Promise<Group | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('groups')
                .select(`
                    *,
                    leader:members!leader_id(name, email, phone),
                    co_leader:members!co_leader_id(name, email, phone),
                    group_members(id)
                `)
                .eq('id', id)
                .is('deleted_at', null)
                .is('group_members.left_at', null)
                .single();

            if (fetchError) throw fetchError;

            return {
                ...data,
                member_count: (data.group_members as any[])?.length || 0,
                leader_name: data.leader?.name,
                co_leader_name: data.co_leader?.name
            };
        } catch (err) {
            console.error('Error fetching group by ID:', err);
            return null;
        }
    };

    // =====================================================
    // CREATE GROUP
    // =====================================================
    const addGroup = async (groupData: Omit<Group, 'id' | 'church_id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
        if (!user?.churchId) {
            console.error('Erro: Usuário sem churchId');
            return false;
        }

        try {
            const sanitizedData = {
                ...groupData,
                leader_id: groupData.leader_id || null,
                co_leader_id: groupData.co_leader_id || null,
                church_id: user.churchId
            };

            const { data, error: insertError } = await supabase
                .from('groups')
                .insert(sanitizedData)
                .select()
                .single();

            if (insertError) throw insertError;

            if (data) {
                const membersToAdd: { group_id: string; member_id: string; role: string }[] = [];

                if (sanitizedData.leader_id) {
                    membersToAdd.push({
                        group_id: data.id,
                        member_id: sanitizedData.leader_id,
                        role: 'Líder'
                    });
                }

                if (sanitizedData.co_leader_id) {
                    membersToAdd.push({
                        group_id: data.id,
                        member_id: sanitizedData.co_leader_id,
                        role: 'Co-líder'
                    });
                }

                if (membersToAdd.length > 0) {
                    const { error: membersError } = await supabase
                        .from('group_members')
                        .insert(membersToAdd);

                    if (membersError) {
                        console.error('Erro ao adicionar líder/co-líder como membros:', membersError);
                    }
                }
            }

            await fetchGroups(); // Refresh cache
            return true;
        } catch (err) {
            console.error('Erro ao adicionar grupo:', err);
            setError('Erro ao adicionar grupo: ' + (err as any).message);
            return false;
        }
    };

    // =====================================================
    // UPDATE GROUP
    // =====================================================
    const updateGroup = async (id: string, groupData: Partial<Group>) => {
        try {
            const { error: updateError } = await supabase
                .from('groups')
                .update({
                    ...groupData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('church_id', user?.churchId);

            if (updateError) throw updateError;

            await fetchGroups(); // Refresh cache
            return true;
        } catch (err) {
            console.error('Error updating group:', err);
            setError('Erro ao atualizar grupo');
            return false;
        }
    };

    // =====================================================
    // DELETE GROUP (soft delete)
    // =====================================================
    const deleteGroup = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('groups')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('church_id', user?.churchId);

            if (deleteError) throw deleteError;

            updateCache(cachedGroups.filter(g => g.id !== id));
            return true;
        } catch (err) {
            console.error('Error deleting group:', err);
            setError('Erro ao excluir grupo');
            return false;
        }
    };

    // =====================================================
    // GET GROUP MEMBERS
    // =====================================================
    const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('group_members')
                .select(`
                    *,
                    member:members(name, email, phone)
                `)
                .eq('group_id', groupId)
                .is('left_at', null)
                .order('role', { ascending: true });

            if (fetchError) throw fetchError;

            return (data || []).map(gm => ({
                ...gm,
                member_name: gm.member?.name,
                member_email: gm.member?.email,
                member_phone: gm.member?.phone
            }));
        } catch (err) {
            console.error('Error fetching group members:', err);
            return [];
        }
    };

    // =====================================================
    // ADD MEMBER TO GROUP
    // =====================================================
    const addMemberToGroup = async (groupId: string, memberId: string, role: string = 'Membro') => {
        try {
            const { error: insertError } = await supabase
                .from('group_members')
                .insert({
                    group_id: groupId,
                    member_id: memberId,
                    role: role
                });

            if (insertError) throw insertError;
            await fetchGroups(); // Refresh cache counts
            return true;
        } catch (err) {
            console.error('Error adding member to group:', err);
            setError('Erro ao adicionar membro ao grupo');
            return false;
        }
    };

    // =====================================================
    // REMOVE MEMBER FROM GROUP
    // =====================================================
    const removeMemberFromGroup = async (groupMemberId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('group_members')
                .update({ left_at: new Date().toISOString() })
                .eq('id', groupMemberId);

            if (updateError) throw updateError;
            await fetchGroups(); // Refresh cache counts
            return true;
        } catch (err) {
            console.error('Error removing member from group:', err);
            setError('Erro ao remover membro do grupo');
            return false;
        }
    };

    // =====================================================
    // UPDATE MEMBER ROLE
    // =====================================================
    const updateMemberRole = async (groupMemberId: string, newRole: string) => {
        try {
            const { error: updateError } = await supabase
                .from('group_members')
                .update({ role: newRole })
                .eq('id', groupMemberId);

            if (updateError) throw updateError;
            await fetchGroups(); // Refresh cache to ensure consistency
            return true;
        } catch (err) {
            console.error('Error updating member role:', err);
            setError('Erro ao atualizar papel do membro');
            return false;
        }
    };

    useEffect(() => {
        if (user?.churchId) {
            if (cacheChurchId !== user.churchId) {
                updateCache([]);
                cacheChurchId = user.churchId;
                fetchGroups();
            } else if (cachedGroups.length === 0 && !activeFetchPromise) {
                fetchGroups();
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [user?.churchId]);

    return {
        groups,
        loading,
        error,
        addGroup,
        updateGroup,
        deleteGroup,
        getGroupById,
        getGroupMembers,
        addMemberToGroup,
        removeMemberFromGroup,
        updateMemberRole,
        refetch: fetchGroups
    };
};
