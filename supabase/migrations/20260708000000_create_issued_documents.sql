-- =====================================================
-- ISSUED DOCUMENTS - Database Schema
-- =====================================================

CREATE TABLE IF NOT EXISTS public.issued_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    document_type VARCHAR(50) NOT NULL, -- 'member_card', 'recommendation', 'baptism_cert', 'presentation_cert', 'course_cert'
    title VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_details JSONB DEFAULT '{}'::jsonb,
    issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hash_code VARCHAR(100) UNIQUE NOT NULL, -- Unique code for verification
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issued_documents_church ON public.issued_documents(church_id);
CREATE INDEX IF NOT EXISTS idx_issued_documents_member ON public.issued_documents(member_id);
CREATE INDEX IF NOT EXISTS idx_issued_documents_hash ON public.issued_documents(hash_code);

-- Trigger for auto updated_at
CREATE OR REPLACE TRIGGER update_issued_documents_modtime
    BEFORE UPDATE ON public.issued_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.issued_documents ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view issued documents from their own church" ON public.issued_documents;
CREATE POLICY "Users can view issued documents from their own church"
    ON public.issued_documents FOR SELECT
    USING (church_id = get_user_church_id());

DROP POLICY IF EXISTS "Users can create issued documents for their church" ON public.issued_documents;
CREATE POLICY "Users can create issued documents for their church"
    ON public.issued_documents FOR INSERT
    WITH CHECK (church_id = get_user_church_id());

DROP POLICY IF EXISTS "Users can update issued documents of their church" ON public.issued_documents;
CREATE POLICY "Users can update issued documents of their church"
    ON public.issued_documents FOR UPDATE
    USING (church_id = get_user_church_id());

DROP POLICY IF EXISTS "Users can delete issued documents of their church" ON public.issued_documents;
CREATE POLICY "Users can delete issued documents of their church"
    ON public.issued_documents FOR DELETE
    USING (church_id = get_user_church_id());
