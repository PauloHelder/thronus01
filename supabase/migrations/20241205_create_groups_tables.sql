-- =====================================================
-- GROUPS MODULE - Database Schema
-- Criação de tabelas para o módulo de Grupos/Células
-- =====================================================

-- =====================================================
-- TABLE: groups
-- =====================================================
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) DEFAULT 'Célula',
    leader_id UUID REFERENCES members(id) ON DELETE SET NULL,
    co_leader_id UUID REFERENCES members(id) ON DELETE SET NULL,
    meeting_day VARCHAR(50),
    meeting_time TIME,
    location TEXT,
    address TEXT,
    neighborhood VARCHAR(255),
    district VARCHAR(255),
    province VARCHAR(255),
    country VARCHAR(100) DEFAULT 'Angola',
    municipality VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Ativo',
    max_members INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT groups_church_id_fkey FOREIGN KEY (church_id) REFERENCES churches(id),
    CONSTRAINT groups_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES members(id),
    CONSTRAINT groups_co_leader_id_fkey FOREIGN KEY (co_leader_id) REFERENCES members(id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_groups_church_id ON groups(church_id);
CREATE INDEX IF NOT EXISTS idx_groups_leader_id ON groups(leader_id);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups(deleted_at);

-- =====================================================
-- TABLE: group_members
-- =====================================================
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Membro',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id),
    CONSTRAINT group_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Create a partial unique index for active members only (where left_at IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_group_member 
ON group_members(group_id, member_id) 
WHERE left_at IS NULL;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_member_id ON group_members(member_id);
CREATE INDEX IF NOT EXISTS idx_group_members_left_at ON group_members(left_at);

-- =====================================================
-- TABLE: group_meetings
-- =====================================================
CREATE TABLE IF NOT EXISTS group_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    topic VARCHAR(255),
    notes TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT group_meetings_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_group_meetings_group_id ON group_meetings(group_id);
CREATE INDEX IF NOT EXISTS idx_group_meetings_date ON group_meetings(date);

-- =====================================================
-- TABLE: group_meeting_attendance
-- =====================================================
CREATE TABLE IF NOT EXISTS group_meeting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Presente',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT group_meeting_attendance_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES group_meetings(id),
    CONSTRAINT group_meeting_attendance_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT unique_meeting_attendance UNIQUE (meeting_id, member_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_group_meeting_attendance_meeting_id ON group_meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_group_meeting_attendance_member_id ON group_meeting_attendance(member_id);

-- =====================================================
-- TRIGGER: Update updated_at on groups
-- =====================================================
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_groups_updated_at();

-- =====================================================
-- TRIGGER: Update updated_at on group_meetings
-- =====================================================
CREATE TRIGGER trigger_update_group_meetings_updated_at
    BEFORE UPDATE ON group_meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_groups_updated_at();

-- =====================================================
-- FUNCTION: Get group member count
-- =====================================================
CREATE OR REPLACE FUNCTION get_group_member_count(group_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM group_members
        WHERE group_id = group_uuid
        AND left_at IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE groups IS 'Grupos/Células da igreja';
COMMENT ON TABLE group_members IS 'Membros dos grupos';
COMMENT ON TABLE group_meetings IS 'Reuniões dos grupos';
COMMENT ON TABLE group_meeting_attendance IS 'Presença nas reuniões dos grupos';
