import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Ordination, Member } from '../types';

export const useOrdinations = () => {
    const { user } = useAuth();
    const [ordinations, setOrdinations] = useState<Ordination[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrdinations = async () => {
        if (!user?.churchId) return;

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('ordinations')
                .select(`
                    *,
                    ordination_members(
                        member:members(*)
                    )
                `)
                .eq('church_id', user.churchId)
                .order('date', { ascending: false });

            if (fetchError) throw fetchError;

            const transformed = data.map((ord: any) => ({
                id: ord.id,
                churchId: ord.church_id,
                date: ord.date,
                category: ord.category,
                celebrant: ord.celebrant,
                notes: ord.notes,
                members: ord.ordination_members.map((om: any) => ({
                    id: om.member.id,
                    name: om.member.name,
                    avatar: om.member.avatar_url,
                    churchRole: om.member.church_role
                })),
                memberCount: ord.ordination_members.length
            }));

            setOrdinations(transformed);
        } catch (err) {
            console.error('Error fetching ordinations:', err);
            setError('Erro ao carregar consagrações');
        } finally {
            setLoading(false);
        }
    };

    const addOrdination = async (ordinationData: { date: string, category: string, celebrant: string, notes?: string, memberIds: string[] }) => {
        if (!user?.churchId) return false;

        try {
            // 1. Create ordination event
            const { data: ordination, error: ordError } = await supabase
                .from('ordinations')
                .insert({
                    church_id: user.churchId,
                    date: ordinationData.date,
                    category: ordinationData.category,
                    celebrant: ordinationData.celebrant,
                    notes: ordinationData.notes
                })
                .select()
                .single();

            if (ordError) throw ordError;

            // 2. Link members
            const memberLinks = ordinationData.memberIds.map(memberId => ({
                ordination_id: ordination.id,
                member_id: memberId
            }));

            const { error: linksError } = await supabase
                .from('ordination_members')
                .insert(memberLinks);

            if (linksError) throw linksError;

            // 3. Update members' roles and ordination info
            const { error: membersUpdateError } = await supabase
                .from('members')
                .update({
                    church_role: ordinationData.category,
                    ordination_date: ordinationData.date,
                    ordination_celebrant: ordinationData.celebrant
                })
                .in('id', ordinationData.memberIds)
                .eq('church_id', user.churchId);

            if (membersUpdateError) throw membersUpdateError;

            await fetchOrdinations();
            return true;
        } catch (err) {
            console.error('Error adding ordination:', err);
            return false;
        }
    };

    const deleteOrdination = async (id: string) => {
        try {
            const { error: delError } = await supabase
                .from('ordinations')
                .delete()
                .eq('id', id);

            if (delError) throw delError;

            setOrdinations(prev => prev.filter(o => o.id !== id));
            return true;
        } catch (err) {
            console.error('Error deleting ordination:', err);
            return false;
        }
    };

    useEffect(() => {
        fetchOrdinations();
    }, [user?.churchId]);

    return { ordinations, loading, error, addOrdination, deleteOrdination, refresh: fetchOrdinations };
};
