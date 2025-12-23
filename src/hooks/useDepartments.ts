import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Department, DepartmentSchedule } from '../types';

export const useDepartments = () => {
    const { user } = useAuth();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDepartments = useCallback(async () => {
        if (!user?.churchId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('departments' as any)
                .select(`
                    *,
                    leader:members!leader_id(id, name, avatar_url),
                    co_leader:members!co_leader_id(id, name, avatar_url),
                    members:department_members(count),
                    schedules:department_schedules(count)
                `)
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            const formattedDepartments: Department[] = data.map((d: any) => ({
                id: d.id,
                name: d.name,
                description: d.description,
                icon: d.icon,
                leaderId: d.leader_id,
                coLeaderId: d.co_leader_id,
                leader: d.leader ? { ...d.leader, avatar: d.leader.avatar_url } : undefined,
                coLeader: d.co_leader ? { ...d.co_leader, avatar: d.co_leader.avatar_url } : undefined,
                members: Array(d.members[0]?.count || 0).fill({} as any),
                schedules: Array(d.schedules[0]?.count || 0).fill({} as any),
                isDefault: d.is_default
            }));

            setDepartments(formattedDepartments);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching departments:', JSON.stringify(err, null, 2));
            setError('Erro ao carregar departamentos');
        } finally {
            setLoading(false);
        }
    }, [user?.churchId]);

    const fetchDepartmentDetails = useCallback(async (id: string) => {
        setLoading(true);
        try {
            // 1. Dept Info + Leader + CoLeader
            const { data: deptResponse, error: errorResponse } = await supabase
                .from('departments' as any)
                .select(`
                    *,
                    leader:members!leader_id(id, name, email, avatar_url),
                    co_leader:members!co_leader_id(id, name, email, avatar_url)
                `)
                .eq('id', id)
                .maybeSingle();

            const dept = deptResponse as any;
            const deptError = errorResponse;

            if (deptError) throw deptError;
            if (!dept) throw new Error('Departamento não encontrado');

            // 2. Members
            const { data: membersRel, error: memError } = await supabase
                .from('department_members' as any)
                .select(`
                    member:members!inner(id, name, email, avatar_url)
                `)
                .eq('department_id', id);

            if (memError) throw memError;

            const members = membersRel.map((r: any) => ({
                id: r.member.id,
                name: r.member.name,
                email: r.member.email,
                avatar: r.member.avatar_url
            }));

            // 3. Schedules + Assignments
            const { data: schedulesData, error: schedError } = await supabase
                .from('department_schedules' as any)
                .select(`
                    *,
                    assignments:department_schedule_assignments(member_id)
                `)
                .eq('department_id', id)
                .order('date', { ascending: false });

            if (schedError) throw schedError;

            const schedules: DepartmentSchedule[] = schedulesData.map((s: any) => ({
                id: s.id,
                departmentId: s.department_id,
                type: s.type,
                serviceId: s.service_id,
                eventId: s.event_id,
                date: s.date,
                notes: s.notes,
                assignedMembers: s.assignments ? s.assignments.map((a: any) => a.member_id) : []
            }));

            setSelectedDepartment({
                id: dept.id,
                name: dept.name,
                description: dept.description,
                icon: dept.icon,
                leaderId: dept.leader_id,
                coLeaderId: dept.co_leader_id,
                leader: dept.leader ? { ...dept.leader, avatar: dept.leader.avatar_url } : undefined,
                coLeader: dept.co_leader ? { ...dept.co_leader, avatar: dept.co_leader.avatar_url } : undefined,
                members,
                schedules: schedules as any[], // Casting to match generic Department type expectation
                isDefault: dept.is_default
            });
            setError(null);
        } catch (err: any) {
            console.error('Error fetching department details:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addDepartment = async (deptData: Partial<Department>) => {
        if (!user?.churchId) return false;

        try {
            const { error: insertError } = await supabase
                .from('departments' as any)
                .insert({
                    church_id: user.churchId,
                    name: deptData.name,
                    description: deptData.description,
                    icon: deptData.icon,
                    leader_id: deptData.leaderId,
                    co_leader_id: deptData.coLeaderId,
                    is_default: false
                });

            if (insertError) throw insertError;

            await fetchDepartments();
            return true;
        } catch (err: any) {
            console.error('Error adding department:', err);
            setError(err.message);
            return false;
        }
    };

    const updateDepartment = async (id: string, deptData: Partial<Department>) => {
        try {
            const { error: updateError } = await supabase
                .from('departments' as any)
                .update({
                    name: deptData.name,
                    description: deptData.description,
                    icon: deptData.icon,
                    leader_id: deptData.leaderId,
                    co_leader_id: deptData.coLeaderId
                })
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchDepartments();
            return true;
        } catch (err: any) {
            console.error('Error updating department:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteDepartment = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('departments' as any)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchDepartments();
            return true;
        } catch (err: any) {
            console.error('Error deleting department:', err);
            setError(err.message);
            return false;
        }
    };

    const addDepartmentMembers = async (departmentId: string, memberIds: string[]) => {
        try {
            const rows = memberIds.map(id => ({
                department_id: departmentId,
                member_id: id
            }));
            const { error } = await supabase.from('department_members' as any).insert(rows);
            if (error) throw error;
            await fetchDepartmentDetails(departmentId);
            return true;
        } catch (err: any) {
            console.error('Error adding members:', err);
            setError(err.message);
            return false;
        }
    };

    const removeDepartmentMember = async (departmentId: string, memberId: string) => {
        try {
            const { error } = await supabase.from('department_members' as any)
                .delete()
                .eq('department_id', departmentId)
                .eq('member_id', memberId);
            if (error) throw error;
            await fetchDepartmentDetails(departmentId);
            return true;
        } catch (err: any) {
            console.error('Error removing member:', err);
            setError(err.message);
            return false;
        }
    };

    const addSchedule = async (schedule: Omit<DepartmentSchedule, 'id'>) => {
        try {
            const { data: newSched, error: sErr } = await supabase
                .from('department_schedules' as any)
                .insert({
                    department_id: schedule.departmentId,
                    type: schedule.type,
                    service_id: schedule.serviceId || null,
                    event_id: schedule.eventId || null,
                    date: schedule.date,
                    notes: schedule.notes
                })
                .select()
                .single();

            if (sErr) throw sErr;

            if (schedule.assignedMembers?.length > 0) {
                const rows = schedule.assignedMembers.map((mid: string) => ({
                    schedule_id: newSched.id,
                    member_id: mid
                }));
                const { error: aErr } = await supabase.from('department_schedule_assignments' as any).insert(rows);
                if (aErr) throw aErr;
            }

            await fetchDepartmentDetails(schedule.departmentId);
            return true;
        } catch (err: any) {
            console.error('Error adding schedule:', err);
            setError(err.message);
            return false;
        }
    };

    const updateSchedule = async (schedule: DepartmentSchedule) => {
        try {
            const { error: sErr } = await supabase
                .from('department_schedules' as any)
                .update({
                    type: schedule.type,
                    service_id: schedule.serviceId || null,
                    event_id: schedule.eventId || null,
                    date: schedule.date,
                    notes: schedule.notes
                })
                .eq('id', schedule.id);

            if (sErr) throw sErr;

            // Update assignments - delete all and re-insert
            const { error: delErr } = await supabase
                .from('department_schedule_assignments' as any)
                .delete()
                .eq('schedule_id', schedule.id);
            if (delErr) throw delErr;

            if (schedule.assignedMembers?.length > 0) {
                const rows = schedule.assignedMembers.map((mid: string) => ({
                    schedule_id: schedule.id,
                    member_id: mid
                }));
                const { error: aErr } = await supabase.from('department_schedule_assignments' as any).insert(rows);
                if (aErr) throw aErr;
            }

            await fetchDepartmentDetails(schedule.departmentId);
            return true;
        } catch (err: any) {
            console.error('Error updating schedule:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteSchedule = async (departmentId: string, scheduleId: string) => {
        try {
            const { error } = await supabase.from('department_schedules' as any).delete().eq('id', scheduleId);
            if (error) throw error;
            await fetchDepartmentDetails(departmentId);
            return true;
        } catch (err: any) {
            console.error('Error deleting schedule:', err);
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    return {
        departments,
        selectedDepartment,
        loading,
        error,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        fetchDepartmentDetails,
        addDepartmentMembers,
        removeDepartmentMember,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        refresh: fetchDepartments
    };
};
