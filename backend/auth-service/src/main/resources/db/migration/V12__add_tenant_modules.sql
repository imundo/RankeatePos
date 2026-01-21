-- =====================================================
-- V12: Add modules column to tenants table
-- Stores JSON array of enabled feature modules
-- =====================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS modules TEXT;

-- Set default modules based on existing plans
UPDATE tenants SET modules = '["pos", "products"]' WHERE plan IN ('FREE', 'STARTER', 'BASIC') AND modules IS NULL;
UPDATE tenants SET modules = '["pos", "products", "marketing", "crm", "admin"]' WHERE plan = 'PRO' AND modules IS NULL;
UPDATE tenants SET modules = '["pos", "products", "marketing", "crm", "admin", "reports", "users", "inventory"]' WHERE plan IN ('BUSINESS', 'PREMIUM', 'ENTERPRISE') AND modules IS NULL;

-- Default for any remaining nulls
UPDATE tenants SET modules = '["pos", "products"]' WHERE modules IS NULL;
