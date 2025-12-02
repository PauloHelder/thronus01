-- =====================================================
-- THRONUS V5 - INITIAL SCHEMA
-- Multi-tenant Church Management System
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Churches (Tenants)
CREATE TABLE churches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    logo_url TEXT,
    
    -- Address
    address TEXT,
    neighborhood VARCHAR(100),
    district VARCHAR(100),
    municipality VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Angola',
    postal_code VARCHAR(20),
    
    -- Subscription & Plan
    plan_id UUID,
    subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Supervision (for multi-church networks)
    parent_church_id UUID REFERENCES churches(id),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_churches_slug ON churches(slug);
CREATE INDEX idx_churches_parent ON churches(parent_church_id);
CREATE INDEX idx_churches_plan ON churches(plan_id);

-- Plans
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('Free', 'Profissional', 'Premium')),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    billing_period VARCHAR(20) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'quarterly', 'semiannual', 'annual')),
    
    -- Features (stored as JSONB for flexibility)
    features JSONB NOT NULL DEFAULT '{
        "canLinkToSupervision": false,
        "canBeLinked": 0,
        "customBranding": false,
        "maxMembers": 50,
        "maxGroups": 5,
        "serviceStatistics": false,
        "exportStatistics": false,
        "exportFinances": false,
        "maxLeaders": 5,
        "maxDisciples": 10,
        "maxDepartments": 3,
        "maxClasses": 3,
        "maxEvents": 10
    }',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    
    duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 3, 6, 12)),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    total_amount DECIMAL(10, 2) NOT NULL,
    
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_church ON subscriptions(church_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- MEMBERS & USERS
-- =====================================================

-- Members (Church members)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    -- Basic Info
    member_code VARCHAR(20), -- Short code per church (e.g., M001)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Personal Info
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female')),
    birth_date DATE,
    marital_status VARCHAR(20) CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
    
    -- Address
    address TEXT,
    neighborhood VARCHAR(100),
    district VARCHAR(100),
    municipality VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Angola',
    
    -- Church Info
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Visitor')),
    church_role VARCHAR(50), -- Líder, Membro, Visitante, etc.
    
    -- Baptism
    is_baptized BOOLEAN DEFAULT false,
    baptism_date DATE,
    baptism_place VARCHAR(255),
    
    -- Additional Info
    occupation VARCHAR(100),
    education_level VARCHAR(50),
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_members_church ON members(church_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_member_code ON members(church_id, member_code);
CREATE UNIQUE INDEX idx_members_unique_code ON members(church_id, member_code) WHERE deleted_at IS NULL;

-- Users (System authentication - links to Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'leader', 'member')),
    
    -- Permissions (JSONB for flexibility)
    permissions JSONB DEFAULT '{}',
    
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_church ON users(church_id);
CREATE INDEX idx_users_member ON users(member_id);
CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- GROUPS (CÉLULAS)
-- =====================================================

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Leadership
    leader_id UUID REFERENCES members(id) ON DELETE SET NULL,
    co_leader_id UUID REFERENCES members(id) ON DELETE SET NULL,
    
    -- Meeting Info
    meeting_day VARCHAR(20), -- Segunda, Terça, etc.
    meeting_time TIME,
    
    -- Location
    meeting_place VARCHAR(255),
    address TEXT,
    neighborhood VARCHAR(100),
    district VARCHAR(100),
    municipality VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Angola',
    
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Full', 'Inactive')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_groups_church ON groups(church_id);
CREATE INDEX idx_groups_leader ON groups(leader_id);
CREATE INDEX idx_groups_status ON groups(status);

-- Group Members (Many-to-Many with roles)
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    role VARCHAR(50) DEFAULT 'Membro' CHECK (role IN ('Líder', 'Co-líder', 'Membro', 'Secretário', 'Visitante')),
    joined_at DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(group_id, member_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_member ON group_members(member_id);

-- Group Meetings
CREATE TABLE group_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_group_meetings_group ON group_meetings(group_id);
CREATE INDEX idx_group_meetings_date ON group_meetings(date);

-- Group Meeting Attendance
CREATE TABLE group_meeting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    present BOOLEAN DEFAULT true,
    
    UNIQUE(meeting_id, member_id)
);

CREATE INDEX idx_group_meeting_attendance_meeting ON group_meeting_attendance(meeting_id);

-- =====================================================
-- SERVICES (CULTOS)
-- =====================================================

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'Culto de Domingo',
        'Culto de Meio da Semana',
        'Culto Jovem',
        'Reunião de Oração',
        'Estudo Bíblico',
        'Culto Especial',
        'Conferência'
    )),
    
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    
    preacher_id UUID REFERENCES members(id) ON DELETE SET NULL,
    leader_id UUID REFERENCES members(id) ON DELETE SET NULL,
    
    location VARCHAR(255),
    description TEXT,
    
    status VARCHAR(20) DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Concluído', 'Cancelado')),
    
    -- Statistics
    stats_adults_men INTEGER DEFAULT 0,
    stats_adults_women INTEGER DEFAULT 0,
    stats_children_boys INTEGER DEFAULT 0,
    stats_children_girls INTEGER DEFAULT 0,
    stats_visitors_men INTEGER DEFAULT 0,
    stats_visitors_women INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_services_church ON services(church_id);
CREATE INDEX idx_services_date ON services(date);
CREATE INDEX idx_services_status ON services(status);

-- =====================================================
-- DEPARTMENTS (MINISTÉRIOS)
-- =====================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50), -- Icon name/identifier
    description TEXT,
    
    leader_id UUID REFERENCES members(id) ON DELETE SET NULL,
    co_leader_id UUID REFERENCES members(id) ON DELETE SET NULL,
    
    is_default BOOLEAN DEFAULT false, -- For default departments (Secretaria, Finanças, Louvor)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_departments_church ON departments(church_id);
CREATE INDEX idx_departments_is_default ON departments(is_default);

-- Department Members
CREATE TABLE department_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    joined_at DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(department_id, member_id)
);

CREATE INDEX idx_department_members_dept ON department_members(department_id);
CREATE INDEX idx_department_members_member ON department_members(member_id);

-- Department Schedules
CREATE TABLE department_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    
    type VARCHAR(20) NOT NULL CHECK (type IN ('Service', 'Event')),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    event_id UUID, -- Will reference events table
    
    date DATE NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_department_schedules_dept ON department_schedules(department_id);
CREATE INDEX idx_department_schedules_date ON department_schedules(date);

-- Department Schedule Assignments
CREATE TABLE department_schedule_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES department_schedules(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    UNIQUE(schedule_id, member_id)
);

CREATE INDEX idx_dept_schedule_assignments_schedule ON department_schedule_assignments(schedule_id);

-- =====================================================
-- EVENTS
-- =====================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    type VARCHAR(50) CHECK (type IN ('Service', 'Meeting', 'Social', 'Youth', 'Conference', 'Other')),
    
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    location VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_events_church ON events(church_id);
CREATE INDEX idx_events_date ON events(date);

-- Event Attendees
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    UNIQUE(event_id, member_id)
);

CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);

-- =====================================================
-- TEACHING (ENSINO)
-- =====================================================

-- Christian Stages (Configurable)
CREATE TABLE christian_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_christian_stages_church ON christian_stages(church_id);

-- Teaching Categories (Configurable)
CREATE TABLE teaching_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_teaching_categories_church ON teaching_categories(church_id);

-- Teaching Classes
CREATE TABLE teaching_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    teacher_id UUID REFERENCES members(id) ON DELETE SET NULL,
    
    stage_id UUID REFERENCES christian_stages(id) ON DELETE SET NULL,
    category_id UUID REFERENCES teaching_categories(id) ON DELETE SET NULL,
    
    day_of_week VARCHAR(20), -- Segunda, Terça, etc.
    time TIME,
    room VARCHAR(100),
    
    start_date DATE NOT NULL,
    end_date DATE,
    
    status VARCHAR(20) DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Agendada', 'Em Andamento', 'Concluído', 'Concluída', 'Cancelado', 'Cancelada')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_teaching_classes_church ON teaching_classes(church_id);
CREATE INDEX idx_teaching_classes_teacher ON teaching_classes(teacher_id);

-- Teaching Class Students
CREATE TABLE teaching_class_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    enrolled_at DATE DEFAULT CURRENT_DATE,
    
    UNIQUE(class_id, member_id)
);

CREATE INDEX idx_teaching_class_students_class ON teaching_class_students(class_id);

-- Teaching Lessons
CREATE TABLE teaching_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_teaching_lessons_class ON teaching_lessons(class_id);

-- Teaching Lesson Attendance
CREATE TABLE teaching_lesson_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES teaching_lessons(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    present BOOLEAN DEFAULT true,
    
    UNIQUE(lesson_id, member_id)
);

CREATE INDEX idx_teaching_lesson_attendance_lesson ON teaching_lesson_attendance(lesson_id);

-- =====================================================
-- DISCIPLESHIP (DISCIPULADO)
-- =====================================================

CREATE TABLE discipleship_leaders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    start_date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(church_id, member_id)
);

CREATE INDEX idx_discipleship_leaders_church ON discipleship_leaders(church_id);
CREATE INDEX idx_discipleship_leaders_member ON discipleship_leaders(member_id);

-- Discipleship Relationships
CREATE TABLE discipleship_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES discipleship_leaders(id) ON DELETE CASCADE,
    disciple_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(leader_id, disciple_id)
);

CREATE INDEX idx_discipleship_relationships_leader ON discipleship_relationships(leader_id);
CREATE INDEX idx_discipleship_relationships_disciple ON discipleship_relationships(disciple_id);

-- Discipleship Meetings
CREATE TABLE discipleship_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES discipleship_leaders(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_discipleship_meetings_leader ON discipleship_meetings(leader_id);

-- Discipleship Meeting Attendance
CREATE TABLE discipleship_meeting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES discipleship_meetings(id) ON DELETE CASCADE,
    disciple_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    present BOOLEAN DEFAULT true,
    
    UNIQUE(meeting_id, disciple_id)
);

CREATE INDEX idx_discipleship_meeting_attendance_meeting ON discipleship_meeting_attendance(meeting_id);

-- =====================================================
-- FINANCE
-- =====================================================

-- Transaction Categories
CREATE TABLE transaction_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Income', 'Expense')),
    is_system BOOLEAN DEFAULT false, -- System categories cannot be deleted
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transaction_categories_church ON transaction_categories(church_id);
CREATE INDEX idx_transaction_categories_type ON transaction_categories(type);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    
    type VARCHAR(20) NOT NULL CHECK (type IN ('Income', 'Expense')),
    category_id UUID NOT NULL REFERENCES transaction_categories(id),
    
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    
    source VARCHAR(50) CHECK (source IN ('Service', 'Member', 'Other')),
    source_id UUID, -- Can reference services, members, etc.
    source_name VARCHAR(255),
    
    receipt_number VARCHAR(100),
    reference_number VARCHAR(100),
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_church ON transactions(church_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category_id);

-- =====================================================
-- AUDIT LOG
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type VARCHAR(50) NOT NULL, -- members, groups, services, etc.
    entity_id UUID,
    
    old_values JSONB,
    new_values JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_church ON audit_logs(church_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON churches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teaching_classes_updated_at BEFORE UPDATE ON teaching_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate member code
CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS TRIGGER AS $$
DECLARE
    next_code INTEGER;
    new_code VARCHAR(20);
BEGIN
    IF NEW.member_code IS NULL THEN
        -- Get the next available code for this church
        SELECT COALESCE(MAX(CAST(SUBSTRING(member_code FROM 2) AS INTEGER)), 0) + 1
        INTO next_code
        FROM members
        WHERE church_id = NEW.church_id
        AND member_code ~ '^M[0-9]+$'
        AND deleted_at IS NULL;
        
        -- Format as M001, M002, etc.
        new_code := 'M' || LPAD(next_code::TEXT, 3, '0');
        NEW.member_code := new_code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_member_code_trigger
BEFORE INSERT ON members
FOR EACH ROW
EXECUTE FUNCTION generate_member_code();
