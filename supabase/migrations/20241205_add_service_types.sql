-- =====================================================
-- ADD SERVICE TYPES TABLE
-- Permite que cada igreja configure seus próprios tipos de culto
-- =====================================================

-- Add service_types table for configurable service types
CREATE TABLE IF NOT EXISTS service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    default_start_time TIME,
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_service_type_per_church UNIQUE(church_id, name)
);

-- Create indexes for faster queries (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_types_church') THEN
        CREATE INDEX idx_service_types_church ON service_types(church_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_types_order') THEN
        CREATE INDEX idx_service_types_order ON service_types(church_id, display_order);
    END IF;
END
$$;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_service_types_updated_at ON service_types;
CREATE TRIGGER update_service_types_updated_at 
BEFORE UPDATE ON service_types 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Alter services table to use service_type_id instead of type string
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'service_type_id'
    ) THEN
        ALTER TABLE services ADD COLUMN service_type_id UUID REFERENCES service_types(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Create index for better performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_type') THEN
        CREATE INDEX idx_services_type ON services(service_type_id);
    END IF;
END
$$;

-- Function to create default service types when a church is created
CREATE OR REPLACE FUNCTION create_default_service_types()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default service types with default times
    INSERT INTO service_types (church_id, name, default_start_time, is_default, display_order)
    VALUES 
        (NEW.id, 'Culto de Domingo', '10:00:00', true, 1),
        (NEW.id, 'Culto de Meio da Semana', '19:30:00', true, 2),
        (NEW.id, 'Culto Jovem', '19:00:00', true, 3),
        (NEW.id, 'Reunião de Oração', '19:30:00', true, 4),
        (NEW.id, 'Estudo Bíblico', '19:30:00', true, 5)
    ON CONFLICT (church_id, name) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default types when creating a church
DROP TRIGGER IF EXISTS create_default_service_types_trigger ON churches;
CREATE TRIGGER create_default_service_types_trigger
AFTER INSERT ON churches
FOR EACH ROW
EXECUTE FUNCTION create_default_service_types();

-- Documentation comments
COMMENT ON TABLE service_types IS 'Tipos de culto configuráveis por igreja';
COMMENT ON COLUMN service_types.name IS 'Nome do tipo de culto';
COMMENT ON COLUMN service_types.default_start_time IS 'Horário padrão de início para este tipo de culto';
COMMENT ON COLUMN service_types.is_default IS 'Indica se é um tipo padrão do sistema (não pode ser deletado)';
COMMENT ON COLUMN service_types.display_order IS 'Ordem de exibição nos dropdowns';
