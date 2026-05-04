CREATE TABLE IF NOT EXISTS ordinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    celebrant TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ordination_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ordination_id UUID REFERENCES ordinations(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE(ordination_id, member_id)
);

-- Enable RLS
ALTER TABLE ordinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordination_members ENABLE ROW LEVEL SECURITY;

-- Policies for ordinations
DROP POLICY IF EXISTS "Users can view ordinations in their church" ON ordinations;
CREATE POLICY "Users can view ordinations in their church"
    ON ordinations FOR SELECT
    USING (church_id = get_user_church_id());

DROP POLICY IF EXISTS "Users can create ordinations in their church" ON ordinations;
CREATE POLICY "Users can create ordinations in their church"
    ON ordinations FOR INSERT
    WITH CHECK (church_id = get_user_church_id());

DROP POLICY IF EXISTS "Users can delete ordinations in their church" ON ordinations;
CREATE POLICY "Users can delete ordinations in their church"
    ON ordinations FOR DELETE
    USING (church_id = get_user_church_id());

-- Policies for ordination_members
DROP POLICY IF EXISTS "Users can view ordination_members in their church" ON ordination_members;
CREATE POLICY "Users can view ordination_members in their church"
    ON ordination_members FOR SELECT
    USING (ordination_id IN (SELECT id FROM ordinations));

DROP POLICY IF EXISTS "Users can add members to ordinations" ON ordination_members;
CREATE POLICY "Users can add members to ordinations"
    ON ordination_members FOR INSERT
    WITH CHECK (ordination_id IN (SELECT id FROM ordinations));

DROP POLICY IF EXISTS "Users can remove members from ordinations" ON ordination_members;
CREATE POLICY "Users can remove members from ordinations"
    ON ordination_members FOR DELETE
    USING (ordination_id IN (SELECT id FROM ordinations));
