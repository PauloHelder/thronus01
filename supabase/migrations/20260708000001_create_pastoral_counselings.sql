-- =====================================================
-- PASTORAL COUNSELING - Database Schema
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pastoral_counselings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    pastor_id UUID REFERENCES public.members(id) ON DELETE SET NULL, -- The counselor (pastor/bishop/presbyter)
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL, -- The counselee member
    counseling_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
    subject VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pastoral_counselings_church ON public.pastoral_counselings(church_id);
CREATE INDEX IF NOT EXISTS idx_pastoral_counselings_pastor ON public.pastoral_counselings(pastor_id);
CREATE INDEX IF NOT EXISTS idx_pastoral_counselings_member ON public.pastoral_counselings(member_id);

-- Trigger for auto updated_at
CREATE OR REPLACE TRIGGER update_pastoral_counselings_modtime
    BEFORE UPDATE ON public.pastoral_counselings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.pastoral_counselings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "View pastoral counselings" ON public.pastoral_counselings;
CREATE POLICY "View pastoral counselings"
    ON public.pastoral_counselings FOR SELECT
    USING (
        church_id = get_user_church_id()
        AND (
            is_admin()
            OR
            pastor_id IN (SELECT id FROM public.members WHERE email = auth.jwt()->>'email')
        )
    );

DROP POLICY IF EXISTS "Insert pastoral counselings" ON public.pastoral_counselings;
CREATE POLICY "Insert pastoral counselings"
    ON public.pastoral_counselings FOR INSERT
    WITH CHECK (
        church_id = get_user_church_id()
        AND (
            is_admin()
            OR
            EXISTS (
                SELECT 1 FROM public.members 
                WHERE email = auth.jwt()->>'email' 
                  AND church_id = public.pastoral_counselings.church_id
                  AND (church_role ILIKE '%Pastor%' OR church_role ILIKE '%Bispo%' OR church_role ILIKE '%Presbítero%')
            )
        )
    );

DROP POLICY IF EXISTS "Update pastoral counselings" ON public.pastoral_counselings;
CREATE POLICY "Update pastoral counselings"
    ON public.pastoral_counselings FOR UPDATE
    USING (
        church_id = get_user_church_id()
        AND (
            is_admin()
            OR
            pastor_id IN (SELECT id FROM public.members WHERE email = auth.jwt()->>'email')
        )
    );

DROP POLICY IF EXISTS "Delete pastoral counselings" ON public.pastoral_counselings;
CREATE POLICY "Delete pastoral counselings"
    ON public.pastoral_counselings FOR DELETE
    USING (
        church_id = get_user_church_id()
        AND (
            is_admin()
            OR
            pastor_id IN (SELECT id FROM public.members WHERE email = auth.jwt()->>'email')
        )
    );
