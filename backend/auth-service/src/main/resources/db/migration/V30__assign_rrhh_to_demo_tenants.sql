-- =====================================================
-- V30: Assign RRHH Module to All Demo Tenants
-- Enables staff, attendance, payroll for all demos
-- =====================================================

-- 1. Ensure RRHH modules exist and add 'leaves' module
INSERT INTO modules (code, name, description, icon, category, sort_order) VALUES
('leaves', 'Vacaciones y Permisos', 'Solicitudes, aprobaciones y balance de vacaciones', '🏖️', 'RRHH', 73)
ON CONFLICT (code) DO NOTHING;

-- 2. Get all demo tenant IDs
-- a1000000-0000-0000-0000-000000000001 = Panadería El Trigal
-- a2000000-0000-0000-0000-000000000002 = Minimarket Don Pedro
-- a3000000-0000-0000-0000-000000000003 = Academia Pro
-- a4000000-0000-0000-0000-000000000004 = Editorial Creativa
-- a5000000-0000-0000-0000-000000000005 = Charcutería La Selecta
-- 11111111-1111-1111-1111-111111111111 = Barbería El Bigote
-- 22222222-2222-2222-2222-222222222222 = Centro Mente Sana

-- 3. Assign RRHH modules to all demo tenants
-- El Trigal
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT 'a1000000-0000-0000-0000-000000000001', m.id, true
FROM modules m
WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- Don Pedro
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT 'a2000000-0000-0000-0000-000000000002', m.id, true
FROM modules m
WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- Academia Pro
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT 'a3000000-0000-0000-0000-000000000003', m.id, true
FROM modules m
WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- Editorial Creativa
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT 'a4000000-0000-0000-0000-000000000004', m.id, true
FROM modules m
WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- Charcutería La Selecta
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT 'a5000000-0000-0000-0000-000000000005', m.id, true
FROM modules m
WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- Barbería El Bigote
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT '11111111-1111-1111-1111-111111111111', m.id, true
FROM modules m
WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- Centro Mente Sana
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT '22222222-2222-2222-2222-222222222222', m.id, true
FROM modules m
WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- 4. Grant module access to all admin users of these tenants
INSERT INTO user_module_access (user_id, module_id, enabled, granted_at)
SELECT u.id, m.id, true, CURRENT_TIMESTAMP
FROM users u
JOIN tenant_modules tm ON u.tenant_id = tm.tenant_id
JOIN modules m ON tm.module_id = m.id
WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
AND u.tenant_id IN (
    'a1000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000002',
    'a3000000-0000-0000-0000-000000000003',
    'a4000000-0000-0000-0000-000000000004',
    'a5000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
)
ON CONFLICT (user_id, module_id) DO NOTHING;
