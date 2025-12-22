-- =====================================================
-- V10: Demo Data - Charcutería Premium Tenant
-- Tenant ID: a5000000-0000-0000-0000-000000000005
-- Industry: Charcutería/Delicatessen
-- =====================================================

-- Tenant: Charcutería "La Selecta"
INSERT INTO tenants (id, nombre, rut, plan, activo, created_at)
VALUES (
    'a5000000-0000-0000-0000-000000000005',
    'Charcutería La Selecta',
    '77.888.999-5',
    'PROFESSIONAL',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Branches for Charcutería
INSERT INTO branches (id, tenant_id, nombre, codigo, direccion, comuna, ciudad, telefono, email, es_principal, activa, created_at)
VALUES
('b5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Local Providencia', 'CHA-001', 'Av. Providencia 1200', 'Providencia', 'Santiago', '+56977771111', 'providencia@laselecta.cl', true, true, CURRENT_TIMESTAMP),
('b5000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000005', 'Local Las Condes', 'CHA-002', 'Isidora Goyenechea 2800', 'Las Condes', 'Santiago', '+56977771112', 'lascondes@laselecta.cl', false, true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Users for Charcutería (password: Test123!)
INSERT INTO users (id, tenant_id, email, password, nombre, apellido, telefono, activo, email_verified, created_at)
VALUES
('c5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'admin@laselecta.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Martín', 'Fernández', '+56977771110', true, true, CURRENT_TIMESTAMP),
('c5000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000005', 'cajero@laselecta.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Carolina', 'Muñoz', '+56977771113', true, true, CURRENT_TIMESTAMP),
('c5000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000005', 'encargado@laselecta.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Pedro', 'Soto', '+56977771114', true, true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Assign roles (assuming roles exist from V2)
INSERT INTO user_roles (user_id, role_id)
SELECT 'c5000000-0000-0000-0000-000000000001', id FROM roles WHERE nombre = 'ADMIN' ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT 'c5000000-0000-0000-0000-000000000002', id FROM roles WHERE nombre = 'CASHIER' ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT 'c5000000-0000-0000-0000-000000000003', id FROM roles WHERE nombre = 'MANAGER' ON CONFLICT DO NOTHING;

-- Assign users to branches
INSERT INTO user_branches (user_id, branch_id)
VALUES
('c5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001'),
('c5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000002'),
('c5000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000001'),
('c5000000-0000-0000-0000-000000000003', 'b5000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;
