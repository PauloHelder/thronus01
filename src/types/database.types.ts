/**
 * Database Types - Auto-generated from Supabase Schema
 * 
 * These types correspond to the database schema defined in:
 * - supabase/migrations/20241202_001_initial_schema.sql
 * 
 * Last updated: 2024-12-02
 */

// =====================================================
// CORE TYPES
// =====================================================

export interface Database {
    public: {
        Tables: {
            churches: Church;
            plans: Plan;
            subscriptions: Subscription;
            members: Member;
            users: User;
            groups: Group;
            group_members: GroupMember;
            group_meetings: GroupMeeting;
            group_meeting_attendance: GroupMeetingAttendance;
            services: Service;
            departments: Department;
            department_members: DepartmentMember;
            department_schedules: DepartmentSchedule;
            department_schedule_assignments: DepartmentScheduleAssignment;
            events: Event;
            event_attendees: EventAttendee;
            christian_stages: ChristianStage;
            teaching_categories: TeachingCategory;
            teaching_classes: TeachingClass;
            teaching_class_students: TeachingClassStudent;
            teaching_lessons: TeachingLesson;
            teaching_lesson_attendance: TeachingLessonAttendance;
            discipleship_leaders: DiscipleshipLeader;
            discipleship_relationships: DiscipleshipRelationship;
            discipleship_meetings: DiscipleshipMeeting;
            discipleship_meeting_attendance: DiscipleshipMeetingAttendance;
            transaction_categories: TransactionCategory;
            transactions: Transaction;
            audit_logs: AuditLog;
        };
    };
}

// =====================================================
// CHURCHES & PLANS
// =====================================================

export interface Church {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    logo_url: string | null;

    // Address
    address: string | null;
    neighborhood: string | null;
    district: string | null;
    municipality: string | null;
    province: string | null;
    country: string | null;
    postal_code: string | null;

    // Subscription
    plan_id: string | null;
    subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
    trial_ends_at: string | null;

    // Supervision
    parent_church_id: string | null;

    // Settings
    settings: Record<string, any>;

    // Metadata
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Plan {
    id: string;
    name: 'Free' | 'Profissional' | 'Premium';
    price: number;
    billing_period: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
    features: {
        canLinkToSupervision: boolean;
        canBeLinked: number | 'unlimited';
        customBranding: boolean;
        maxMembers: number | 'unlimited';
        maxGroups: number | 'unlimited';
        serviceStatistics: boolean;
        exportStatistics: boolean;
        exportFinances: boolean;
        maxLeaders: number | 'unlimited';
        maxDisciples: number | 'unlimited';
        maxDepartments: number | 'unlimited';
        maxClasses: number | 'unlimited';
        maxEvents: number | 'unlimited';
    };
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: string;
    church_id: string;
    plan_id: string;
    duration_months: 1 | 3 | 6 | 12;
    start_date: string;
    end_date: string;
    status: 'active' | 'expired' | 'cancelled';
    total_amount: number;
    payment_method: string | null;
    payment_reference: string | null;
    created_at: string;
    updated_at: string;
}

// =====================================================
// MEMBERS & USERS
// =====================================================

export interface Member {
    id: string;
    church_id: string;
    member_code: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;

    // Personal Info
    gender: 'Male' | 'Female' | null;
    birth_date: string | null;
    marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed' | null;

    // Address
    address: string | null;
    neighborhood: string | null;
    district: string | null;
    municipality: string | null;
    province: string | null;
    country: string | null;

    // Church Info
    status: 'Active' | 'Inactive' | 'Visitor';
    church_role: string | null;

    // Baptism
    is_baptized: boolean;
    baptism_date: string | null;
    baptism_place: string | null;

    // Additional
    occupation: string | null;
    education_level: string | null;
    notes: string | null;

    // Metadata
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface User {
    id: string;
    church_id: string;
    member_id: string | null;
    email: string;
    role: 'admin' | 'leader' | 'member';
    permissions: Record<string, boolean>;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

// =====================================================
// GROUPS
// =====================================================

export interface Group {
    id: string;
    church_id: string;
    name: string;
    description: string | null;
    leader_id: string | null;
    co_leader_id: string | null;
    meeting_day: string | null;
    meeting_time: string | null;
    meeting_place: string | null;
    address: string | null;
    neighborhood: string | null;
    district: string | null;
    municipality: string | null;
    province: string | null;
    country: string | null;
    status: 'Active' | 'Full' | 'Inactive';
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface GroupMember {
    id: string;
    group_id: string;
    member_id: string;
    role: 'Líder' | 'Co-líder' | 'Membro' | 'Secretário' | 'Visitante';
    joined_at: string;
    created_at: string;
}

export interface GroupMeeting {
    id: string;
    group_id: string;
    date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface GroupMeetingAttendance {
    id: string;
    meeting_id: string;
    member_id: string;
    present: boolean;
}

// =====================================================
// SERVICES
// =====================================================

export interface Service {
    id: string;
    church_id: string;
    name: string;
    type: 'Culto de Domingo' | 'Culto de Meio da Semana' | 'Culto Jovem' | 'Reunião de Oração' | 'Estudo Bíblico' | 'Culto Especial' | 'Conferência';
    date: string;
    start_time: string;
    end_time: string | null;
    preacher_id: string | null;
    leader_id: string | null;
    location: string | null;
    description: string | null;
    status: 'Agendado' | 'Concluído' | 'Cancelado';

    // Statistics
    stats_adults_men: number;
    stats_adults_women: number;
    stats_children_boys: number;
    stats_children_girls: number;
    stats_visitors_men: number;
    stats_visitors_women: number;

    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

// =====================================================
// DEPARTMENTS
// =====================================================

export interface Department {
    id: string;
    church_id: string;
    name: string;
    icon: string | null;
    description: string | null;
    leader_id: string | null;
    co_leader_id: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface DepartmentMember {
    id: string;
    department_id: string;
    member_id: string;
    joined_at: string;
    created_at: string;
}

export interface DepartmentSchedule {
    id: string;
    department_id: string;
    type: 'Service' | 'Event';
    service_id: string | null;
    event_id: string | null;
    date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface DepartmentScheduleAssignment {
    id: string;
    schedule_id: string;
    member_id: string;
}

// =====================================================
// EVENTS
// =====================================================

export interface Event {
    id: string;
    church_id: string;
    title: string;
    description: string | null;
    type: 'Service' | 'Meeting' | 'Social' | 'Youth' | 'Conference' | 'Other' | null;
    date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    cover_url: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface EventAttendee {
    id: string;
    event_id: string;
    member_id: string;
}

// =====================================================
// TEACHING
// =====================================================

export interface ChristianStage {
    id: string;
    church_id: string;
    name: string;
    description: string | null;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface TeachingCategory {
    id: string;
    church_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface TeachingClass {
    id: string;
    church_id: string;
    name: string;
    teacher_id: string | null;
    stage_id: string | null;
    category_id: string | null;
    day_of_week: string | null;
    time: string | null;
    room: string | null;
    start_date: string;
    end_date: string | null;
    status: 'Agendado' | 'Agendada' | 'Em Andamento' | 'Concluído' | 'Concluída' | 'Cancelado' | 'Cancelada';
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface TeachingClassStudent {
    id: string;
    class_id: string;
    member_id: string;
    enrolled_at: string;
}

export interface TeachingLesson {
    id: string;
    class_id: string;
    date: string;
    title: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface TeachingLessonAttendance {
    id: string;
    lesson_id: string;
    member_id: string;
    present: boolean;
}

// =====================================================
// DISCIPLESHIP
// =====================================================

export interface DiscipleshipLeader {
    id: string;
    church_id: string;
    member_id: string;
    start_date: string;
    created_at: string;
    updated_at: string;
}

export interface DiscipleshipRelationship {
    id: string;
    leader_id: string;
    disciple_id: string;
    start_date: string;
    end_date: string | null;
    created_at: string;
}

export interface DiscipleshipMeeting {
    id: string;
    leader_id: string;
    date: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface DiscipleshipMeetingAttendance {
    id: string;
    meeting_id: string;
    disciple_id: string;
    present: boolean;
}

// =====================================================
// FINANCE
// =====================================================

export interface TransactionCategory {
    id: string;
    church_id: string;
    name: string;
    type: 'Income' | 'Expense';
    is_system: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Transaction {
    id: string;
    church_id: string;
    type: 'Income' | 'Expense';
    category_id: string;
    amount: number;
    date: string;
    source: 'Service' | 'Member' | 'Other' | null;
    source_id: string | null;
    source_name: string | null;
    receipt_number: string | null;
    reference_number: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

// =====================================================
// AUDIT
// =====================================================

export interface AuditLog {
    id: string;
    church_id: string;
    user_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

// =====================================================
// HELPER TYPES
// =====================================================

export type Tables = Database['public']['Tables'];

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;
export type DbResultErr = { error: { message: string } };
