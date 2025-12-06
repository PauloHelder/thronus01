-- =====================================================
-- ADD DEFAULT_START_TIME TO SERVICE_TYPES
-- Adiciona coluna de horário padrão à tabela existente
-- =====================================================

-- Add default_start_time column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_types' AND column_name = 'default_start_time'
    ) THEN
        ALTER TABLE service_types ADD COLUMN default_start_time TIME;
    END IF;
END
$$;

-- Update existing default service types with default times
UPDATE service_types 
SET default_start_time = '10:00:00' 
WHERE name = 'Culto de Domingo' AND default_start_time IS NULL;

UPDATE service_types 
SET default_start_time = '19:30:00' 
WHERE name = 'Culto de Meio da Semana' AND default_start_time IS NULL;

UPDATE service_types 
SET default_start_time = '19:00:00' 
WHERE name = 'Culto Jovem' AND default_start_time IS NULL;

UPDATE service_types 
SET default_start_time = '19:30:00' 
WHERE name = 'Reunião de Oração' AND default_start_time IS NULL;

UPDATE service_types 
SET default_start_time = '19:30:00' 
WHERE name = 'Estudo Bíblico' AND default_start_time IS NULL;

-- Add comment
COMMENT ON COLUMN service_types.default_start_time IS 'Horário padrão de início para este tipo de culto';
