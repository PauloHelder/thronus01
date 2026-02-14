-- =====================================================
-- DEPARTMENT GOALS - Database Schema
-- =====================================================

CREATE TABLE IF NOT EXISTS department_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value DECIMAL(15, 2),
    current_value DECIMAL(15, 2) DEFAULT 0,
    deadline DATE,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'pending', 'in_progress', 'completed', 'delayed'
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dept_goals_church ON department_goals(church_id);
CREATE INDEX IF NOT EXISTS idx_dept_goals_department ON department_goals(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_goals_status ON department_goals(status);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_department_goals_modtime
    BEFORE UPDATE ON department_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE department_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goals from their own church"
    ON department_goals FOR SELECT
    USING (church_id = get_user_church_id());

CREATE POLICY "Users can create goals for their departments"
    ON department_goals FOR INSERT
    WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "Users can update their own church's goals"
    ON department_goals FOR UPDATE
    USING (church_id = get_user_church_id());

CREATE POLICY "Users can delete their own church's goals"
    ON department_goals FOR DELETE
    USING (church_id = get_user_church_id());
