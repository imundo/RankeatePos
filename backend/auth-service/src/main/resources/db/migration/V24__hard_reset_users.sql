-- =====================================================
-- V24: Hard Reset for admin@eltrigal.cl
-- Description: Unconditional delete and re-insert to guarantee clean state
-- =====================================================

-- 1. Hard Delete ALL references to this email, even distinct cases
DELETE FROM user_roles 
WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = 'admin@eltrigal.cl');

DELETE FROM user_branches 
WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = 'admin@eltrigal.cl');

DELETE FROM user_module_access 
WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = 'admin@eltrigal.cl');

DELETE FROM refresh_tokens 
WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = 'admin@eltrigal.cl');

DELETE FROM users 
WHERE LOWER(email) = 'admin@eltrigal.cl';

-- 2. Re-insert cleanly
INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, telefono, activo, email_verificado, created_at, deleted_at)
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
    CURRENT_TIMESTAMP,
    NULL -- Ensure not deleted
);

-- 3. Restore Role and Branch access
INSERT INTO user_roles (user_id, role_id)
VALUES ('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');

INSERT INTO user_branches (user_id, branch_id)
VALUES 
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001');
