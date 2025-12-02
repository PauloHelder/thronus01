/**
 * Supabase Query Examples
 * 
 * This file contains example queries for common operations
 * using the Supabase client with TypeScript types.
 */

import { supabase, getCurrentUserChurchId } from './lib/supabase';
import type { Member, Group, Service, Department } from './types/database.types';

// =====================================================
// MEMBERS
// =====================================================

/**
 * Get all members from the current user's church
 */
export async function getMembers() {
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name');

    return { data, error };
}

/**
 * Get a single member by ID
 */
export async function getMemberById(id: string) {
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

    return { data, error };
}

/**
 * Create a new member
 */
export async function createMember(member: Partial<Member>) {
    const churchId = await getCurrentUserChurchId();

    if (!churchId) {
        return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('members')
        .insert({
            ...member,
            church_id: churchId,
        })
        .select()
        .single();

    return { data, error };
}

/**
 * Update a member
 */
export async function updateMember(id: string, updates: Partial<Member>) {
    const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    return { data, error };
}

/**
 * Soft delete a member
 */
export async function deleteMember(id: string) {
    const { data, error } = await supabase
        .from('members')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    return { data, error };
}

/**
 * Search members by name or email
 */
export async function searchMembers(query: string) {
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name');

    return { data, error };
}

// =====================================================
// GROUPS
// =====================================================

/**
 * Get all groups with leader information
 */
export async function getGroups() {
    const { data, error } = await supabase
        .from('groups')
        .select(`
            *,
            leader:leader_id(id, name, avatar_url),
            co_leader:co_leader_id(id, name, avatar_url)
        `)
        .order('name');

    return { data, error };
}

/**
 * Get group with members
 */
export async function getGroupWithMembers(groupId: string) {
    const { data, error } = await supabase
        .from('groups')
        .select(`
            *,
            leader:leader_id(*),
            co_leader:co_leader_id(*),
            group_members(
                id,
                role,
                joined_at,
                member:member_id(*)
            )
        `)
        .eq('id', groupId)
        .single();

    return { data, error };
}

/**
 * Create a new group
 */
export async function createGroup(group: Partial<Group>) {
    const churchId = await getCurrentUserChurchId();

    if (!churchId) {
        return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('groups')
        .insert({
            ...group,
            church_id: churchId,
        })
        .select()
        .single();

    return { data, error };
}

/**
 * Add member to group
 */
export async function addMemberToGroup(groupId: string, memberId: string, role: string = 'Membro') {
    const { data, error } = await supabase
        .from('group_members')
        .insert({
            group_id: groupId,
            member_id: memberId,
            role,
        })
        .select()
        .single();

    return { data, error };
}

// =====================================================
// SERVICES
// =====================================================

/**
 * Get upcoming services
 */
export async function getUpcomingServices() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('services')
        .select(`
            *,
            preacher:preacher_id(id, name),
            leader:leader_id(id, name)
        `)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

    return { data, error };
}

/**
 * Get service statistics for a date range
 */
export async function getServiceStatistics(startDate: string, endDate: string) {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'Concluído');

    if (error) return { data: null, error };

    // Calculate totals
    const totals = data.reduce((acc, service) => ({
        adults: acc.adults + (service.stats_adults_men || 0) + (service.stats_adults_women || 0),
        children: acc.children + (service.stats_children_boys || 0) + (service.stats_children_girls || 0),
        visitors: acc.visitors + (service.stats_visitors_men || 0) + (service.stats_visitors_women || 0),
    }), { adults: 0, children: 0, visitors: 0 });

    return { data: totals, error: null };
}

/**
 * Create a new service
 */
export async function createService(service: Partial<Service>) {
    const churchId = await getCurrentUserChurchId();

    if (!churchId) {
        return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('services')
        .insert({
            ...service,
            church_id: churchId,
        })
        .select()
        .single();

    return { data, error };
}

// =====================================================
// DEPARTMENTS
// =====================================================

/**
 * Get all departments with members
 */
export async function getDepartments() {
    const { data, error } = await supabase
        .from('departments')
        .select(`
            *,
            leader:leader_id(id, name, avatar_url),
            co_leader:co_leader_id(id, name, avatar_url),
            department_members(
                id,
                member:member_id(id, name, avatar_url)
            )
        `)
        .order('is_default', { ascending: false })
        .order('name');

    return { data, error };
}

/**
 * Create default departments for a new church
 */
export async function createDefaultDepartments(churchId: string) {
    const defaultDepartments = [
        { name: 'Secretaria', icon: 'FileText', is_default: true },
        { name: 'Finanças', icon: 'DollarSign', is_default: true },
        { name: 'Louvor', icon: 'Music', is_default: true },
    ];

    const { data, error } = await supabase
        .from('departments')
        .insert(
            defaultDepartments.map(dept => ({
                ...dept,
                church_id: churchId,
            }))
        )
        .select();

    return { data, error };
}

// =====================================================
// FINANCE
// =====================================================

/**
 * Get transactions for a date range
 */
export async function getTransactions(startDate: string, endDate: string) {
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            category:category_id(id, name, type)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

    return { data, error };
}

/**
 * Get financial summary
 */
export async function getFinancialSummary(startDate: string, endDate: string) {
    const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) return { data: null, error };

    const summary = data.reduce((acc, transaction) => {
        if (transaction.type === 'Income') {
            acc.income += Number(transaction.amount);
        } else {
            acc.expense += Number(transaction.amount);
        }
        return acc;
    }, { income: 0, expense: 0 });

    return {
        data: {
            ...summary,
            balance: summary.income - summary.expense,
        },
        error: null,
    };
}

// =====================================================
// TEACHING
// =====================================================

/**
 * Get all teaching classes with teacher info
 */
export async function getTeachingClasses() {
    const { data, error } = await supabase
        .from('teaching_classes')
        .select(`
            *,
            teacher:teacher_id(id, name, avatar_url),
            stage:stage_id(id, name),
            category:category_id(id, name),
            teaching_class_students(
                id,
                member:member_id(id, name, avatar_url)
            )
        `)
        .order('start_date', { ascending: false });

    return { data, error };
}

// =====================================================
// DISCIPLESHIP
// =====================================================

/**
 * Get discipleship leaders with their disciples
 */
export async function getDiscipleshipLeaders() {
    const { data, error } = await supabase
        .from('discipleship_leaders')
        .select(`
            *,
            member:member_id(id, name, avatar_url),
            discipleship_relationships(
                id,
                start_date,
                end_date,
                disciple:disciple_id(id, name, avatar_url)
            )
        `)
        .order('start_date', { ascending: false });

    return { data, error };
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to member changes
 */
export function subscribeToMembers(callback: (payload: any) => void) {
    return supabase
        .channel('members-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'members',
            },
            callback
        )
        .subscribe();
}

/**
 * Subscribe to service changes
 */
export function subscribeToServices(callback: (payload: any) => void) {
    return supabase
        .channel('services-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'services',
            },
            callback
        )
        .subscribe();
}

// =====================================================
// AUTHENTICATION
// =====================================================

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    return { data, error };
}

/**
 * Sign up new user
 */
export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    return { data, error };
}

/**
 * Sign out
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}

// =====================================================
// STORAGE (for avatars, logos, etc.)
// =====================================================

/**
 * Upload avatar
 */
export async function uploadAvatar(file: File, memberId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${memberId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (error) return { data: null, error };

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return { data: { path: filePath, url: publicUrl }, error: null };
}

/**
 * Delete avatar
 */
export async function deleteAvatar(filePath: string) {
    const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

    return { error };
}
