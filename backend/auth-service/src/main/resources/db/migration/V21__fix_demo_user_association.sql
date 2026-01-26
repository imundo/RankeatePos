-- =====================================================
-- V21: Fix Demo User Association
-- Ensures admin@eltrigal.cl is associated with the correct demo tenant
-- =====================================================

-- 1. Identify if 'admin@eltrigal.cl' is used by a user that is NOT the official demo user
-- We rename conflict users to avoid unique constraint violations
UPDATE users
SET email = CONCAT(email, '.conflict', SUBSTRING(id::text, 1, 4))
WHERE email = 'admin@eltrigal.cl'
AND id != 'c1000000-0000-0000-0000-000000000001';

-- 2. Ensure the official demo user exists and has the correct email
INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, telefono, activo, email_verificado, created_at)
VALUES (
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'admin@eltrigal.cl',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', -- demo123
    'Carlos',
    'González',
    '+56912345670',
    true,
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE
SET 
    email = 'admin@eltrigal.cl', 
    tenant_id = 'a1000000-0000-0000-0000-000000000001',
    activo = true;

-- 3. Ensure role assignment for the demo user
INSERT INTO user_roles (user_id, role_id)
VALUES ('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 4. Ensure tenant is active
UPDATE tenants SET activo = true WHERE id = 'a1000000-0000-0000-0000-000000000001';
