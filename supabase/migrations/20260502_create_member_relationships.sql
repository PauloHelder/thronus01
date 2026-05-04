CREATE TABLE IF NOT EXISTS member_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    related_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, related_member_id)
);

CREATE INDEX idx_member_relationships_member_id ON member_relationships(member_id);
CREATE INDEX idx_member_relationships_related_member_id ON member_relationships(related_member_id);

ALTER TABLE member_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relationships for their church" ON member_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.id = member_relationships.member_id
            AND members.church_id = get_user_church_id()
        )
    );

CREATE POLICY "Users can manage relationships for their church" ON member_relationships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.id = member_relationships.member_id
            AND members.church_id = get_user_church_id()
        )
    );
