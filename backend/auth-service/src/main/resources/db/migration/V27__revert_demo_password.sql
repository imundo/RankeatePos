-- =====================================================
-- V27: Revert Password to 'demo123' (Known Working)
-- Description: 
-- 1. Revert admin@eltrigal.cl hash to '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.'
-- 2. Create a backup user admin2@eltrigal.cl just in case
-- =====================================================

-- 1. Revert main user password to demo123
UPDATE users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.'
WHERE LOWER(email) = 'admin@eltrigal.cl';

-- 2. Create Backup User (admin2@eltrigal.cl / demo123)
INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, telefono, activo, email_verificado, created_at)
VALUES (
    gen_random_uuid(), -- New ID
    'a1000000-0000-0000-0000-000000000001', -- Correct Tenant
    'admin2@eltrigal.cl',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', -- demo123
    'Backup', 'Admin', '+56900000000', true, true, CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- 3. Grant OWNER Role to Backup User
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin2@eltrigal.cl'
AND r.nombre = 'OWNER_ADMIN'
ON CONFLICT DO NOTHING;

-- 4. Grant Modules to Backup User
INSERT INTO user_module_access (user_id, module_id, enabled)
SELECT u.id, m.id, true
FROM users u, modules m
WHERE u.email = 'admin2@eltrigal.cl'
ON CONFLICT DO NOTHING;
