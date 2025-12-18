-- V4: Add new columns to branches and tenants for company management
-- Added for Docker deployment - missing columns from entity updates

-- Add new columns to branches table
ALTER TABLE branches ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS email VARCHAR(200);

-- Add new columns to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sitio_web VARCHAR(300);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
