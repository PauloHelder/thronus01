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
        groupId: data.group_id,
        biNumber: data.bi_number
    });

    // Helper to transform App data (camelCase) to DB data (snake_case)
    const transformToDB = (data: Partial<Member>) => {
        const dbData: any = { ...data };

        // Map fields
        if (data.avatar !== undefined) { dbData.avatar_url = data.avatar; delete dbData.avatar; }
        if (data.maritalStatus !== undefined) { dbData.marital_status = data.maritalStatus; delete dbData.maritalStatus; }
        if (data.birthDate !== undefined) {
            dbData.birth_date = data.birthDate === '' ? null : data.birthDate;
            delete dbData.birthDate;
        }
        if (data.churchRole !== undefined) { dbData.church_role = data.churchRole; delete dbData.churchRole; }
        if (data.isBaptized !== undefined) { dbData.is_baptized = data.isBaptized; delete dbData.isBaptized; }
        if (data.baptismDate !== undefined) {
            dbData.baptism_date = data.baptismDate === '' ? null : data.baptismDate;
            delete dbData.baptismDate;
        }
        if (data.groupId !== undefined) { dbData.group_id = data.groupId; delete dbData.groupId; }
        if (data.biNumber !== undefined) { dbData.bi_number = data.biNumber; delete dbData.biNumber; }



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
                // Check for unique code collision (common when soft-deleted members exist)
                if (insertError.message.includes('idx_members_unique_code') ||
                    insertError.message.includes('members_member_code_key')) {

                    console.log('⚠️ Colisão de código detectada. Tentando resolver automaticamente...');

                    // 1. Get current max Visible code to start guessing
                    const { data: maxCodeData } = await supabase
                        .from('members')
                        .select('member_code')
                        .eq('church_id', user.churchId)
                        .order('created_at', { ascending: false })
                        .limit(1);

                    let nextNum = 1;
                    if (maxCodeData && maxCodeData.length > 0 && maxCodeData[0].member_code) {
                        const lastCode = maxCodeData[0].member_code;
                        const match = lastCode.match(/^M(\d+)$/);
                        if (match) {
                            nextNum = parseInt(match[1], 10) + 1;
                        }
                    }

                    // 2. Retry loop (try next 10 numbers)
                    for (let i = 0; i < 10; i++) {
                        const tryCode = `M${String(nextNum + i).padStart(3, '0')}`;
                        console.log(`   Tentativa ${i + 1}: Usando código manual ${tryCode}`);

                        const retryData = { ...dbData, member_code: tryCode, church_id: user.churchId };

                        const { data: retryResult, error: retryError } = await supabase
                            .from('members')
                            .insert(retryData)
                            .select();

                        if (!retryError && retryResult && retryResult.length > 0) {
                            console.log('✅ SUCESSO na recuperação automática:', retryResult[0]);
                            const newMember = transformFromDB(retryResult[0]);
                            setMembers(prev => [...prev, newMember]);
                            return true;
                        }

                        // If error is NOT about unique code, abort
                        if (retryError && !retryError.message.includes('idx_members_unique_code') &&
                            !retryError.message.includes('members_member_code_key')) {
                            throw retryError;
                        }
                        // If it IS unique code error, loop continues to next number
                    }
                    // If we get here, we failed 10 times
                    throw new Error("Não foi possível gerar um código único para o membro. Contate o suporte.");
                }

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
            console.error('Error updating member:', JSON.stringify(err, null, 2));
            const msg = (err as any)?.message || 'Erro desconhecido';
            setError(`Erro ao atualizar membro: ${msg}`);
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



    const importMembers = async (membersData: any[]) => {
        if (!user?.churchId) return false;

        try {
            setLoading(true);
            // Helper to parse dates safely (handles Excel serial numbers and strings)
            const parseDate = (value: any): string | null => {
                if (!value) return null;

                try {
                    // Excel serial number
                    if (typeof value === 'number') {
                        // Excel dates start from Dec 30 1899
                        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
                        return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
                    }

                    // String date
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        return date.toISOString().split('T')[0];
                    }
                    return null;
                } catch {
                    return null;
                }
            };

            // Helper to map values to DB constraints
            const mapMaritalStatus = (value: string): string | null => {
                if (!value) return null;
                const v = value.toLowerCase().trim();
                // Map Portuguese to English
                if (v.includes('solteir')) return 'Single';
                if (v.includes('casad')) return 'Married';
                if (v.includes('divorciad')) return 'Divorced';
                if (v.includes('viuv')) return 'Widowed';

                // Check if valid English allowed
                if (['single', 'married', 'divorced', 'widowed'].includes(v)) {
                    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                }
                return null;
            };

            const mapGender = (value: string): string | null => {
                if (!value) return null;
                const v = value.toLowerCase().trim();
                if (v === 'masculino' || v === 'male' || v === 'm') return 'Male';
                if (v === 'feminino' || v === 'female' || v === 'f') return 'Female';
                return null;
            };

            const dbData = membersData.map(m => {
                return {
                    church_id: user.churchId,
                    name: m.name,
                    email: m.email || null,
                    phone: m.phone || null,
                    bi_number: m.biNumber || null,
                    gender: mapGender(m.gender),
                    birth_date: parseDate(m.birthDate),
                    marital_status: mapMaritalStatus(m.maritalStatus),
                    address: m.address || null,
                    neighborhood: m.neighborhood || null,
                    district: m.district || null,
                    province: m.province || null,
                    municipality: m.municipality || null,
                    is_baptized: m.isBaptized === 'Sim' || m.isBaptized === true,
                    baptism_date: parseDate(m.baptismDate),
                    church_role: m.churchRole || 'Membro',
                    status: m.status || 'Active'
                };
            });

            // Insert sequentially to ensure trigger calculates unique codes correctly without collision
            for (const member of dbData) {
                const { error: insertError } = await supabase
                    .from('members')
                    .insert(member);

                if (insertError) {
                    console.error("Error importing specific member:", member.name, insertError);
                    // Optionally continue or throw? Throwing stops the batch.
                    // For now, let's catch and maybe report? But user wants success.
                    // If we throw, we abort partially?
                    // Ideally we should throw to show error.
                    throw insertError;
                }
            }

            await fetchMembers();
            return true;
        } catch (err: any) {
            console.error('Error importing members:', err);
            setError('Erro ao importar membros: ' + err.message);
            return false;
        } finally {
            setLoading(false);
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
        importMembers,
        refetch: fetchMembers
    };
};
