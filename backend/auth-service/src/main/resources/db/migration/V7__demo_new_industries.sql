-- =====================================================
-- V7: Demo Data - New Industry Tenants
-- Academia Online Pro + Editorial Creativa
-- Password: demo1234 -> BCrypt $2a$10$...
-- =====================================================

-- =====================================================
-- TENANT 3: Academia Online Pro (Cursos/Capacitaciones)
-- =====================================================
INSERT INTO tenants (
    id, rut, razon_social, nombre_fantasia, giro, 
    direccion, comuna, region, ciudad, telefono, email,
    business_type, plan, activo, currency, timezone, precio_con_iva,
    created_at
) VALUES (
    'a3000000-0000-0000-0000-000000000003',
    '76.555.111-K',
    'Academia Online Pro SpA',
    'AcademiaOnline Pro',
    'Servicios de capacitación y cursos online',
    'Av. Apoquindo 3000, Of. 501',
    'Las Condes',
    'Metropolitana',
    'Santiago',
    '+56955551111',
    'contacto@aprende.cl',
    'SERVICIOS',
    'PREMIUM',
    true,
    'CLP',
    'America/Santiago',
    true,
    CURRENT_TIMESTAMP
);

-- Sucursales Academia Online
INSERT INTO branches (id, tenant_id, nombre, codigo, direccion, comuna, ciudad, telefono, email, es_principal, activa, created_at) VALUES
('b3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Oficina Central', 'OFC-001', 'Av. Apoquindo 3000, Of. 501', 'Las Condes', 'Santiago', '+56955551111', 'central@aprende.cl', true, true, CURRENT_TIMESTAMP),
('b3000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', 'Centro de Capacitación', 'CAP-001', 'Av. Providencia 1234', 'Providencia', 'Santiago', '+56955551112', 'capacitacion@aprende.cl', false, true, CURRENT_TIMESTAMP);

-- Usuarios Academia Online
-- Password: demo1234 (BCrypt hash)
INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, telefono, activo, email_verificado, created_at) VALUES
('c3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'admin@aprende.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Valentina', 'Núñez', '+56955551110', true, true, CURRENT_TIMESTAMP),
('c3000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', 'instructor@aprende.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Felipe', 'Contreras', '+56955551113', true, true, CURRENT_TIMESTAMP),
('c3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'ventas@aprende.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Catalina', 'Morales', '+56955551114', true, true, CURRENT_TIMESTAMP);

-- Asignación de usuarios a sucursales Academia
INSERT INTO user_branches (user_id, branch_id) VALUES
('c3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001'), -- Valentina en Oficina Central
('c3000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000002'), -- Felipe en Centro Capacitación
('c3000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000001'); -- Catalina en Oficina Central

-- Asignación de roles Academia
INSERT INTO user_roles (user_id, role_id) VALUES
('c3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'), -- Valentina = OWNER_ADMIN
('c3000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'), -- Felipe = MANAGER
('c3000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'); -- Catalina = CASHIER

-- =====================================================
-- TENANT 4: Editorial Creativa (Imprenta/Editorial)
-- =====================================================
INSERT INTO tenants (
    id, rut, razon_social, nombre_fantasia, giro, 
    direccion, comuna, region, ciudad, telefono, email,
    business_type, plan, activo, currency, timezone, precio_con_iva,
    created_at
) VALUES (
    'a4000000-0000-0000-0000-000000000004',
    '76.666.222-1',
    'Editorial Creativa Ltda',
    'Editorial Creativa',
    'Servicios de imprenta y editorial',
    'Calle Moneda 920',
    'Santiago Centro',
    'Metropolitana',
    'Santiago',
    '+56966662222',
    'contacto@imprenta.cl',
    'SERVICIOS',
    'PREMIUM',
    true,
    'CLP',
    'America/Santiago',
    true,
    CURRENT_TIMESTAMP
);

-- Sucursales Editorial Creativa
INSERT INTO branches (id, tenant_id, nombre, codigo, direccion, comuna, ciudad, telefono, email, es_principal, activa, created_at) VALUES
('b4000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Casa Editorial', 'EDI-001', 'Calle Moneda 920', 'Santiago Centro', 'Santiago', '+56966662222', 'editorial@imprenta.cl', true, true, CURRENT_TIMESTAMP),
('b4000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', 'Taller de Impresión', 'IMP-001', 'Av. Matta 1500', 'San Joaquín', 'Santiago', '+56966662223', 'taller@imprenta.cl', false, true, CURRENT_TIMESTAMP);

-- Usuarios Editorial Creativa
INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, telefono, activo, email_verificado, created_at) VALUES
('c4000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'admin@imprenta.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Roberto', 'Vega', '+56966662220', true, true, CURRENT_TIMESTAMP),
('c4000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', 'produccion@imprenta.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Francisca', 'Araya', '+56966662224', true, true, CURRENT_TIMESTAMP),
('c4000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000004', 'diseño@imprenta.cl', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqLBcOhDK9ym7XAMCsxqkEpDvEZS.', 'Andrés', 'Silva', '+56966662225', true, true, CURRENT_TIMESTAMP);

-- Asignación de usuarios a sucursales Editorial
INSERT INTO user_branches (user_id, branch_id) VALUES
('c4000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000001'), -- Roberto en Casa Editorial
('c4000000-0000-0000-0000-000000000002', 'b4000000-0000-0000-0000-000000000002'), -- Francisca en Taller
('c4000000-0000-0000-0000-000000000003', 'b4000000-0000-0000-0000-000000000001'); -- Andrés en Casa Editorial

-- Asignación de roles Editorial
INSERT INTO user_roles (user_id, role_id) VALUES
('c4000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'), -- Roberto = OWNER_ADMIN
('c4000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'), -- Francisca = MANAGER
('c4000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'); -- Andrés = CASHIER
