import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Member } from '../types';

export const useMembers = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper to transform DB data (snake_case) to App data (camelCase)
    const transformFromDB = (data: any): Member => ({
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

    // Helper to transform App data (camelCase) to DB data (snake_case)
    const transformToDB = (data: Partial<Member>) => {
        const dbData: any = { ...data };

        // Map fields
        if (data.avatar !== undefined) { dbData.avatar_url = data.avatar; delete dbData.avatar; }
        if (data.maritalStatus !== undefined) { dbData.marital_status = data.maritalStatus; delete dbData.maritalStatus; }
        if (data.birthDate !== undefined) { dbData.birth_date = data.birthDate; delete dbData.birthDate; }
        if (data.churchRole !== undefined) { dbData.church_role = data.churchRole; delete dbData.churchRole; }
        if (data.isBaptized !== undefined) { dbData.is_baptized = data.isBaptized; delete dbData.isBaptized; }
        if (data.baptismDate !== undefined) { dbData.baptism_date = data.baptismDate; delete dbData.baptismDate; }
        if (data.groupId !== undefined) { dbData.group_id = data.groupId; delete dbData.groupId; }

        return dbData;
    };

    const fetchMembers = async () => {
        if (!user?.churchId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('members')
                .select('*')
                .eq('church_id', user.churchId)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            setMembers((data || []).map(transformFromDB));
            setError(null);
        } catch (err) {
            console.error('Error fetching members:', err);
            setError('Erro ao carregar membros');
        } finally {
            setLoading(false);
        }
    };

    const addMember = async (memberData: Omit<Member, 'id'>) => {
        console.log('=== INÍCIO DO CADASTRO ===');
        console.log('1. User completo:', user);
        console.log('2. Church ID:', user?.churchId);

        if (!user?.churchId) {
            console.error('ERRO: Usuário sem churchId');
            return false;
        }

        try {
            const dbData = transformToDB(memberData);
            // Remove campos undefined/null para evitar erros de tipo
            Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);

            console.log('3. Dados originais (camelCase):', memberData);
            console.log('4. Dados transformados (snake_case):', dbData);
            console.log('5. Dados que serão enviados ao Supabase:', {
                ...dbData,
                church_id: user.churchId
            });

            const { data, error: insertError } = await supabase
                .from('members')
                .insert({
                    ...dbData,
                    church_id: user.churchId
                })
                .select();

            console.log('6. Resposta do Supabase:');
            console.log('   - data:', data);
            console.log('   - error:', insertError);
            console.log('   - data é array?', Array.isArray(data));
            console.log('   - data.length:', data?.length);

            if (insertError) {
                console.error('ERRO DO SUPABASE:', insertError);
                throw insertError;
            }

            if (data && data.length > 0) {
                console.log('✅ SUCESSO: Membro retornado pelo Supabase:', data[0]);
                const newMember = transformFromDB(data[0]);
                console.log('✅ Membro transformado para camelCase:', newMember);
                setMembers(prev => [...prev, newMember]);
            } else {
                console.warn('⚠️ AVISO: Inserção bem-sucedida, mas sem dados retornados.');
                console.warn('   Isso pode indicar um problema com .select() ou RLS no retorno.');
                console.log('   Recarregando lista completa...');
                await fetchMembers();
            }

            console.log('=== FIM DO CADASTRO (SUCESSO) ===');
            return true;
        } catch (err) {
            console.error('=== FIM DO CADASTRO (ERRO) ===');
            console.error('Erro capturado:', err);
            console.error('Tipo do erro:', typeof err);
            console.error('Erro completo:', JSON.stringify(err, null, 2));
            setError('Erro ao adicionar membro: ' + (err as any).message);
            return false;
        }
    };

    const updateMember = async (id: string, memberData: Partial<Member>) => {
        try {
            const dbData = transformToDB(memberData);
            // Remove campos undefined para evitar sobrescrever com null se não for intencional
            Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);

            const { data, error: updateError } = await supabase
                .from('members')
                .update(dbData)
                .eq('id', id)
                .eq('church_id', user?.churchId)
                .select();

            if (updateError) throw updateError;

            if (data && data.length > 0) {
                const updatedMember = transformFromDB(data[0]);
                setMembers(prev => prev.map(m => m.id === id ? updatedMember : m));
            } else {
                // Sucesso na atualização, mas sem retorno de dados.
                console.log('Membro atualizado. Sincronizando dados...');
                // Atualiza otimisticamente enquanto recarrega
                setMembers(prev => prev.map(m => m.id === id ? { ...m, ...memberData } : m));
                await fetchMembers();
            }

            return true;
        } catch (err) {
            console.error('Error updating member:', err);
            setError('Erro ao atualizar membro');
            return false;
        }
    };

    const deleteMember = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('members')
                .delete()
                .eq('id', id)
                .eq('church_id', user?.churchId);

            if (deleteError) throw deleteError;

            setMembers(prev => prev.filter(m => m.id !== id));
            return true;
        } catch (err) {
            console.error('Error deleting member:', err);
            setError('Erro ao excluir membro');
            return false;
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [user?.churchId]);

    return {
        members,
        loading,
        error,
        addMember,
        updateMember,
        deleteMember,
        refetch: fetchMembers
    };
};
