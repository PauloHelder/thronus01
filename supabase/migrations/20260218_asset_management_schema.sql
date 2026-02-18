-- Create asset categories table
CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for asset_categories
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    category_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES members(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    serial_number TEXT,
    purchase_date DATE,
    purchase_price NUMERIC(15, 2) DEFAULT 0,
    condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'poor', 'broken')),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'under_maintenance', 'disposed')),
    location TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Indexing for performance
CREATE INDEX idx_assets_church_id ON assets(church_id);
CREATE INDEX idx_assets_category_id ON assets(category_id);
CREATE INDEX idx_assets_department_id ON assets(department_id);

-- Enable RLS for assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Asset maintenance history
CREATE TABLE IF NOT EXISTS asset_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    cost NUMERIC(15, 2) DEFAULT 0,
    performed_by TEXT,
    next_maintenance DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for asset_maintenance
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (Basic church scope)
-- Policies for asset_categories
CREATE POLICY "Users can view their church asset categories" ON asset_categories
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their church asset categories" ON asset_categories
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

-- Policies for assets
CREATE POLICY "Users can view their church assets" ON assets
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their church assets" ON assets
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their church assets" ON assets
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their church assets" ON assets
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

-- Policies for asset_maintenance
CREATE POLICY "Users can view their church asset maintenance" ON asset_maintenance
    FOR SELECT USING (asset_id IN (SELECT id FROM assets WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can insert their church asset maintenance" ON asset_maintenance
    FOR INSERT WITH CHECK (asset_id IN (SELECT id FROM assets WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid())));
