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

export const useGroups = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // =====================================================
    // FETCH ALL GROUPS
    // =====================================================
    const fetchGroups = async () => {
        if (!user?.churchId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('groups')
                .select(`
                    *,
                    leader:members!leader_id(name),
                    co_leader:members!co_leader_id(name)
                `)
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            // Get member count for each group
            const groupsWithCount = await Promise.all(
                (data || []).map(async (group) => {
                    const { count } = await supabase
                        .from('group_members')
                        .select('*', { count: 'exact', head: true })
                        .eq('group_id', group.id)
                        .is('left_at', null);

                    return {
                        ...group,
                        member_count: count || 0,
                        leader_name: group.leader?.name,
                        co_leader_name: group.co_leader?.name
                    };
                })
            );

            setGroups(groupsWithCount);
            setError(null);
        } catch (err) {
            console.error('Error fetching groups:', err);
            setError('Erro ao carregar grupos');
        } finally {
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
                    co_leader:members!co_leader_id(name, email, phone)
                `)
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (fetchError) throw fetchError;

            // Get member count
            const { count } = await supabase
                .from('group_members')
                .select('*', { count: 'exact', head: true })
                .eq('group_id', id)
                .is('left_at', null);

            return {
                ...data,
                member_count: count || 0,
                leader_name: data.leader?.name,
                co_leader_name: data.co_leader?.name
            };
        } catch (err) {
            console.error('Error fetching group:', err);
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
            // Sanitize data: convert empty strings to null for UUID fields
            const sanitizedData = {
                ...groupData,
                leader_id: groupData.leader_id || null,
                co_leader_id: groupData.co_leader_id || null,
                church_id: user.churchId
            };

            console.log('Enviando dados para criação de grupo:', sanitizedData);

            const { data, error: insertError } = await supabase
                .from('groups')
                .insert(sanitizedData)
                .select()
                .single();

            if (insertError) {
                console.error('Detalhes do erro Supabase:', {
                    message: insertError.message,
                    code: insertError.code,
                    details: insertError.details,
                    hint: insertError.hint
                });
                throw insertError;
            }

            console.log('Grupo criado com sucesso:', data);

            // Automatically add Leader and Co-leader as members
            if (data) {
                const membersToAdd: { group_id: string; member_id: string; role: string }[] = [];

                console.log('Verificando líderes para adicionar como membros:', {
                    leader: sanitizedData.leader_id,
                    co_leader: sanitizedData.co_leader_id
                });

                // Add Leader
                if (sanitizedData.leader_id) {
                    membersToAdd.push({
                        group_id: data.id,
                        member_id: sanitizedData.leader_id,
                        role: 'Líder'
                    });
                }

                // Add Co-leader
                if (sanitizedData.co_leader_id) {
                    membersToAdd.push({
                        group_id: data.id,
                        member_id: sanitizedData.co_leader_id,
                        role: 'Co-líder'
                    });
                }

                if (membersToAdd.length > 0) {
                    console.log('Tentando adicionar membros:', membersToAdd);
                    const { error: membersError } = await supabase
                        .from('group_members')
                        .insert(membersToAdd);

                    if (membersError) {
                        console.error('ERRO CRÍTICO ao adicionar líder/co-líder:', membersError);
                    } else {
                        console.log('SUCESSO: Líder e Co-líder adicionados como membros.');
                    }
                } else {
                    console.log('Nenhum líder/co-líder para adicionar.');
                }
            }

            await fetchGroups(); // Refresh list
            return true;
        } catch (err) {
            console.error('Erro completo ao adicionar grupo:', err);
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

            await fetchGroups(); // Refresh list
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

            setGroups(prev => prev.filter(g => g.id !== id));
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
            return true;
        } catch (err) {
            console.error('Error updating member role:', err);
            setError('Erro ao atualizar papel do membro');
            return false;
        }
    };

    useEffect(() => {
        fetchGroups();
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
