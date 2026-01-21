-- =====================================================
-- V14: Create User Module Access
-- Granular ON/OFF permissions per user per module
-- =====================================================

CREATE TABLE IF NOT EXISTS user_module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    updated_at TIMESTAMP,
    UNIQUE(user_id, module_id)
);

CREATE INDEX idx_user_module_user ON user_module_access(user_id);
CREATE INDEX idx_user_module_module ON user_module_access(module_id);
CREATE INDEX idx_user_module_enabled ON user_module_access(enabled);

-- Function to auto-grant modules based on tenant plan
CREATE OR REPLACE FUNCTION grant_default_modules()
RETURNS TRIGGER AS $$
DECLARE
    tenant_modules TEXT;
    module_record RECORD;
BEGIN
    -- Get tenant's modules JSON
    SELECT modules INTO tenant_modules FROM tenants WHERE id = NEW.tenant_id;
    
    -- If tenant has modules defined, grant them to the new user
    IF tenant_modules IS NOT NULL AND tenant_modules != '' THEN
        FOR module_record IN 
            SELECT m.id FROM modules m 
            WHERE m.code = ANY(ARRAY(SELECT jsonb_array_elements_text(tenant_modules::jsonb)))
        LOOP
            INSERT INTO user_module_access (user_id, module_id, enabled)
            VALUES (NEW.id, module_record.id, true)
            ON CONFLICT (user_id, module_id) DO NOTHING;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-grant modules when user is created
DROP TRIGGER IF EXISTS trigger_grant_default_modules ON users;
CREATE TRIGGER trigger_grant_default_modules
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION grant_default_modules();
