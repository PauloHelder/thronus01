-- Migration: Add WhatsApp Integration (Evolution API)
-- Creates tables for church-specific configuration and message logging

-- 1. Table for Church WhatsApp Configuration
CREATE TABLE church_whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    instance_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(church_id) -- One config per church
);

-- RLS for church_whatsapp_config
ALTER TABLE church_whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superusers can manage all whatsapp configs" 
    ON church_whatsapp_config 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'superuser'
        )
    );

CREATE POLICY "Church admins can manage their own whatsapp config" 
    ON church_whatsapp_config 
    FOR ALL 
    USING (
        church_id IN (
            SELECT church_id FROM user_churches 
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

CREATE POLICY "Users can view their church's whatsapp config" 
    ON church_whatsapp_config 
    FOR SELECT 
    USING (
        church_id IN (
            SELECT church_id FROM user_churches 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );


-- 2. Table for WhatsApp Message Logs
CREATE TABLE whatsapp_message_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    phones TEXT[] NOT NULL,
    message TEXT NOT NULL,
    context_type TEXT, -- e.g., 'service', 'event', 'department', 'discipleship', 'finance', 'teaching', 'manual'
    context_id TEXT, -- Use TEXT to support different ID types if needed (though usually UUID)
    status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'partial'
    response_data JSONB, -- Store Evolution API response for debugging
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for whatsapp_message_log
ALTER TABLE whatsapp_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superusers can view all whatsapp logs" 
    ON whatsapp_message_log 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'superuser'
        )
    );

CREATE POLICY "Users can view their church's whatsapp logs" 
    ON whatsapp_message_log 
    FOR SELECT 
    USING (
        church_id IN (
            SELECT church_id FROM user_churches 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can insert whatsapp logs for their church" 
    ON whatsapp_message_log 
    FOR INSERT 
    WITH CHECK (
        church_id IN (
            SELECT church_id FROM user_churches 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Create a generic function to update the updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for church_whatsapp_config
CREATE TRIGGER update_church_whatsapp_config_updated_at
    BEFORE UPDATE ON church_whatsapp_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
