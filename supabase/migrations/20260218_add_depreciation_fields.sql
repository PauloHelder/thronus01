-- Add depreciation fields to asset_categories and assets
ALTER TABLE asset_categories 
ADD COLUMN IF NOT EXISTS useful_life_years INTEGER DEFAULT 5;

ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS useful_life_years INTEGER,
ADD COLUMN IF NOT EXISTS salvage_value DECIMAL(12,2) DEFAULT 0;

-- Comment on columns for clarity
COMMENT ON COLUMN asset_categories.useful_life_years IS 'Default useful life in years for assets in this category';
COMMENT ON COLUMN assets.useful_life_years IS 'Override for useful life in years';
COMMENT ON COLUMN assets.salvage_value IS 'Estimated value at the end of useful life';
