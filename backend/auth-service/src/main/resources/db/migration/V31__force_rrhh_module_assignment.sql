-- =====================================================
-- V31: Force RRHH Module Assignment (Repair)
-- Ensures all modules are created and assigned
-- =====================================================

-- 1. Ensure all RRHH modules exist
INSERT INTO modules (code, name, description, icon, category, sort_order) VALUES
('staff', 'Personal', 'Fichas de empleados y contratos', '📇', 'RRHH', 70),
('attendance', 'Asistencia', 'Control de turnos y marcaje', '⏰', 'RRHH', 71),
('payroll', 'Remuneraciones', 'Liquidaciones y pagos de sueldo', '💰', 'RRHH', 72),
('leaves', 'Vacaciones y Permisos', 'Solicitudes, aprobaciones y balance de vacaciones', '🏖️', 'RRHH', 73)
ON CONFLICT (code) DO NOTHING;

-- 2. Get module IDs and assign to ALL demo tenants
-- Use a more robust approach that handles all tenants

-- Assign to El Trigal
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT 'a1000000-0000-0000-0000-000000000001'::uuid, m.id, true
FROM modules m WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO UPDATE SET active = true;

-- Assign to Don Pedro
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT 'a2000000-0000-0000-0000-000000000002'::uuid, m.id, true
FROM modules m WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO UPDATE SET active = true;

-- Assign to Academia Pro
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT 'a3000000-0000-0000-0000-000000000003'::uuid, m.id, true
FROM modules m WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO UPDATE SET active = true;

-- Assign to Editorial Creativa
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT 'a4000000-0000-0000-0000-000000000004'::uuid, m.id, true
FROM modules m WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO UPDATE SET active = true;

-- Assign to Charcutería La Selecta
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT 'a5000000-0000-0000-0000-000000000005'::uuid, m.id, true
FROM modules m WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO UPDATE SET active = true;

-- Assign to Barbería El Bigote
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT '11111111-1111-1111-1111-111111111111'::uuid, m.id, true
FROM modules m WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO UPDATE SET active = true;

-- Assign to Centro Mente Sana
INSERT INTO tenant_modules (tenant_id, module_id, active)
SELECT '22222222-2222-2222-2222-222222222222'::uuid, m.id, true
FROM modules m WHERE m.code IN ('staff', 'attendance', 'payroll', 'leaves')
ON CONFLICT (tenant_id, module_id) DO UPDATE SET active = true;

-- 3. Grant module access to ALL users in these tenants (not just admins)
INSERT INTO user_module_access (user_id, module_id, enabled, granted_at)
SELECT u.id, m.id, true, CURRENT_TIMESTAMP
FROM users u
CROSS JOIN modules m
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
ON CONFLICT (user_id, module_id) DO UPDATE SET enabled = true;
