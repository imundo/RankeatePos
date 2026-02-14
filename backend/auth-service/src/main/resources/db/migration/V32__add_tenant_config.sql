-- Add country to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'Chile';

-- Update existing tenants to have 'Chile' as country
UPDATE tenants SET country = 'Chile' WHERE country IS NULL;

-- Create tenant_configs table
CREATE TABLE IF NOT EXISTS tenant_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_config_key UNIQUE (tenant_id, config_key)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_configs_tenant_id ON tenant_configs(tenant_id);
