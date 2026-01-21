-- =====================================================
-- V16: Seed existing users with module access
-- Retroactively grant modules to existing users
-- =====================================================

-- Grant modules to all existing users based on their tenant's plan
INSERT INTO user_module_access (user_id, module_id, enabled)
SELECT 
    u.id as user_id,
    m.id as module_id,
    true as enabled
FROM users u
CROSS JOIN modules m
JOIN tenants t ON u.tenant_id = t.id
WHERE t.modules IS NOT NULL 
  AND m.code = ANY(ARRAY(SELECT jsonb_array_elements_text(t.modules::jsonb)))
ON CONFLICT (user_id, module_id) DO NOTHING;

-- For users without explicit modules, grant basic ones
INSERT INTO user_module_access (user_id, module_id, enabled)
SELECT 
    u.id as user_id,
    m.id as module_id,
    true as enabled
FROM users u
CROSS JOIN modules m
WHERE m.code IN ('pos', 'products')
  AND NOT EXISTS (
    SELECT 1 FROM user_module_access uma 
    WHERE uma.user_id = u.id AND uma.module_id = m.id
  )
ON CONFLICT (user_id, module_id) DO NOTHING;

-- Update tenants to reference plan table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);

-- Link existing tenants to plans
UPDATE tenants SET plan_id = (SELECT id FROM plans WHERE code = tenants.plan)
WHERE plan_id IS NULL AND plan IS NOT NULL;
