-- =====================================================
-- V20: Add Missing Demo Tenants (Barber & Health)
-- Recovery migration for manual seeding
-- =====================================================

-- 1. Create Barber Tenant
INSERT INTO tenants (id, rut, razon_social, nombre_fantasia, business_type, plan, activo, created_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '76.888.999-0',
    'Barbería El Bigote SpA',
    'El Bigote Barber Shop',
    'BARBERIA',
    'PREMIUM',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE 
SET business_type = 'BARBERIA';

-- 2. Create Health Tenant
INSERT INTO tenants (id, rut, razon_social, nombre_fantasia, business_type, plan, activo, created_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '76.777.888-K',
    'Centro de Salud Mente Sana Ltda',
    'Mente Sana',
    'SALUD',
    'PREMIUM',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE 
SET business_type = 'SALUD';

-- 3. Create Users with known hash (demo1234)
-- Hash: $2a$10$5ljXdm1W4iDg/DTzKa35x.jbDFx/S7rWsTiDOqLsciitlq1vi8Ska
INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, activo, email_verificado, created_at)
VALUES
(
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'admin@elbigote.cl',
    '$2a$10$5ljXdm1W4iDg/DTzKa35x.jbDFx/S7rWsTiDOqLsciitlq1vi8Ska',
    'Admin', 'Barbería', true, true, CURRENT_TIMESTAMP
),
(
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    'admin@mentesana.cl',
    '$2a$10$5ljXdm1W4iDg/DTzKa35x.jbDFx/S7rWsTiDOqLsciitlq1vi8Ska',
    'Admin', 'Salud', true, true, CURRENT_TIMESTAMP
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- 4. Assign OWNER_ADMIN Role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email IN ('admin@elbigote.cl', 'admin@mentesana.cl')
AND r.nombre = 'OWNER_ADMIN'
ON CONFLICT DO NOTHING;

-- 5. Assign Modules to Barber
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT '11111111-1111-1111-1111-111111111111', m.id, true
FROM modules m
WHERE m.code IN ('pos', 'products', 'reservations', 'customers', 'marketing', 'settings', 'users')
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- 6. Assign Modules to Health
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT '22222222-2222-2222-2222-222222222222', m.id, true
FROM modules m
WHERE m.code IN ('pos', 'products', 'reservations', 'customers', 'reports', 'settings', 'users')
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- 7. Grant User Permissions (User Module Access)
INSERT INTO user_module_access (user_id, module_id, enabled, granted_at)
SELECT u.id, tm.module_id, true, CURRENT_TIMESTAMP
FROM users u
JOIN tenant_modules tm ON u.tenant_id = tm.tenant_id
WHERE u.email IN ('admin@elbigote.cl', 'admin@mentesana.cl')
ON CONFLICT (user_id, module_id) DO NOTHING;

-- 8. Emergency: Reset SuperAdmin password to demo1234 to rule out hash issues
UPDATE users 
SET password_hash = '$2a$10$5ljXdm1W4iDg/DTzKa35x.jbDFx/S7rWsTiDOqLsciitlq1vi8Ska'
WHERE email = 'superadmin@smartpos.cl';
