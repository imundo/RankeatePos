-- =====================================================
-- V5: Demo Data - Tenants, Users, Branches
-- Panadería El Trigal + Minimarket Don Pedro
-- =====================================================

-- =====================================================
-- TENANT 1: Panadería El Trigal
-- =====================================================
INSERT INTO tenants (
    id, rut, razon_social, nombre_fantasia, giro, 
    direccion, comuna, region, ciudad, telefono, email,
    business_type, plan, activo, currency, timezone, precio_con_iva,
    created_at
) VALUES (
    'a1000000-0000-0000-0000-000000000001',
    '76.123.456-7',
    'Panadería y Pastelería El Trigal SpA',
    'El Trigal',
    'Fabricación y venta de pan y pasteles',
    'Av. Principal 1234',
    'Providencia',
    'Metropolitana',
    'Santiago',
    '+56912345678',
    'contacto@eltrigal.cl',
    'PANADERIA',
    'PREMIUM',
    true,
    'CLP',
    'America/Santiago',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Sucursales El Trigal
INSERT INTO branches (id, tenant_id, nombre, codigo, direccion, comuna, ciudad, telefono, email, es_principal, activa, created_at) VALUES
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Casa Matriz Providencia', 'PRO-001', 'Av. Principal 1234', 'Providencia', 'Santiago', '+56912345678', 'providencia@eltrigal.cl', true, true, CURRENT_TIMESTAMP),
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Sucursal Las Condes', 'LCO-001', 'Av. Apoquindo 5678', 'Las Condes', 'Santiago', '+56912345679', 'lascondes@eltrigal.cl', false, true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Usuarios El Trigal
-- Password: demo123 (BCrypt hash)
INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, telefono, activo, email_verificado, created_at) VALUES
('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'admin@eltrigal.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Carlos', 'González', '+56912345670', true, true, CURRENT_TIMESTAMP),
('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'supervisor@eltrigal.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'María', 'Rodríguez', '+56912345671', true, true, CURRENT_TIMESTAMP),
('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'cajero1@eltrigal.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Juan', 'Pérez', '+56912345672', true, true, CURRENT_TIMESTAMP),
('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'cajero2@eltrigal.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Ana', 'López', '+56912345673', true, true, CURRENT_TIMESTAMP),
('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'bodega@eltrigal.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Pedro', 'Martínez', '+56912345674', true, true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Asignación de usuarios a sucursales El Trigal
INSERT INTO user_branches (user_id, branch_id) VALUES
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Asignación de roles El Trigal
INSERT INTO user_roles (user_id, role_id) VALUES
('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- =====================================================
-- TENANT 2: Minimarket Don Pedro
-- =====================================================
INSERT INTO tenants (
    id, rut, razon_social, nombre_fantasia, giro, 
    direccion, comuna, region, ciudad, telefono, email,
    business_type, plan, activo, currency, timezone, precio_con_iva,
    created_at
) VALUES (
    'a2000000-0000-0000-0000-000000000002',
    '76.789.012-3',
    'Comercial Don Pedro Limitada',
    'Minimarket Don Pedro',
    'Venta al por menor de abarrotes',
    'Calle Los Aromos 567',
    'Ñuñoa',
    'Metropolitana',
    'Santiago',
    '+56987654321',
    'contacto@donpedro.cl',
    'MINIMARKET',
    'PREMIUM',
    true,
    'CLP',
    'America/Santiago',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Sucursales Don Pedro
INSERT INTO branches (id, tenant_id, nombre, codigo, direccion, comuna, ciudad, telefono, email, es_principal, activa, created_at) VALUES
('b2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Local Principal Ñuñoa', 'NUN-001', 'Calle Los Aromos 567', 'Ñuñoa', 'Santiago', '+56987654321', 'nunoa@donpedro.cl', true, true, CURRENT_TIMESTAMP),
('b2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Sucursal Macul', 'MAC-001', 'Av. Macul 1234', 'Macul', 'Santiago', '+56987654322', 'macul@donpedro.cl', false, true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Usuarios Don Pedro
INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, telefono, activo, email_verificado, created_at) VALUES
('c2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'admin@donpedro.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Pedro', 'Sánchez', '+56987654320', true, true, CURRENT_TIMESTAMP),
('c2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'supervisor@donpedro.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Rosa', 'Fernández', '+56987654323', true, true, CURRENT_TIMESTAMP),
('c2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'cajero1@donpedro.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Diego', 'Muñoz', '+56987654324', true, true, CURRENT_TIMESTAMP),
('c2000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 'cajero2@donpedro.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Camila', 'Torres', '+56987654325', true, true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Asignación de usuarios a sucursales Don Pedro
INSERT INTO user_branches (user_id, branch_id) VALUES
('c2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001'),
('c2000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001'),
('c2000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000001'),
('c2000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- Asignación de roles Don Pedro
INSERT INTO user_roles (user_id, role_id) VALUES
('c2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
('c2000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
('c2000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'),
('c2000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
