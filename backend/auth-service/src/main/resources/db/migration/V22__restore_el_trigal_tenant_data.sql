-- =====================================================
-- V22: Aggressive Fix for Demo User & Tenant Data
-- Handles case-insensitive email conflicts and restores El Trigal metadata
-- =====================================================

-- 1. Rename ANY user with email 'admin@eltrigal.cl' (case-insensitive)
-- that is NOT part of the official El Trigal tenant (a100...)
UPDATE users
SET email = CONCAT(email, '.conflict', SUBSTRING(id::text, 1, 4))
WHERE LOWER(email) = 'admin@eltrigal.cl'
AND tenant_id != 'a1000000-0000-0000-0000-000000000001';

-- 2. Restore/Reset Metadata for El Trigal Tenant (a100...)
-- This ensures that if a100... was renamed to "La Sazón del Dev", it gets restored.
UPDATE tenants
SET
    razon_social = 'Panadería y Pastelería El Trigal SpA',
    nombre_fantasia = 'El Trigal',
    giro = 'Fabricación y venta de pan y pasteles',
    direccion = 'Av. Principal 1234',
    comuna = 'Providencia',
    region = 'Metropolitana',
    ciudad = 'Santiago',
    email = 'contacto@eltrigal.cl',
    telefono = '+56912345678',
    business_type = 'PANADERIA',
    plan = 'PREMIUM',
    activo = true
WHERE id = 'a1000000-0000-0000-0000-000000000001';

-- 3. Ensure the official demo user exists and points to a100...
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

-- 4. Ensure user-role assignment
INSERT INTO user_roles (user_id, role_id)
VALUES ('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
