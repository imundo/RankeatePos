-- =====================================================
-- V9: Create Super Admin User for Platform Management
-- =====================================================

-- Create a system tenant for SmartPos platform (id=0 for super admin)
INSERT INTO tenants (id, rut, razon_social, nombre_fantasia, business_type, plan, activo, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00.000.000-0',
    'SmartPos Platform',
    'SmartPos',
    'OTRO',
    'ENTERPRISE',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Create Super Admin user
-- Password: superadmin123 (BCrypt hash)
INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, activo, email_verificado, created_at)
VALUES (
    'ad000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'superadmin@smartpos.cl',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqwvsC2W6X3NvN6kN4yP3/.Y6LR7nha',
    'Super',
    'Admin',
    true,
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Assign SAAS_ADMIN role to super admin user
INSERT INTO user_roles (user_id, role_id)
SELECT 
    'ad000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000006'
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = 'ad000000-0000-0000-0000-000000000001' 
    AND role_id = 'a0000000-0000-0000-0000-000000000006'
);

-- Also give them OWNER_ADMIN role for full access
INSERT INTO user_roles (user_id, role_id)
SELECT 
    'ad000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = 'ad000000-0000-0000-0000-000000000001' 
    AND role_id = 'a0000000-0000-0000-0000-000000000001'
);
