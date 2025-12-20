-- =====================================================
-- V8: Fix passwords for new demo tenants
-- BCrypt hash for password: demo1234
-- Applies to Academia Online Pro and Editorial Creativa users
-- =====================================================

-- Update all new demo users with correct BCrypt hash for "demo1234"
UPDATE users 
SET password_hash = '$2a$10$5ljXdm1W4iDg/DTzKa35x.jbDFx/S7rWsTiDOqLsciitlq1vi8Ska'
WHERE email IN (
    'admin@aprende.cl',
    'instructor@aprende.cl',
    'ventas@aprende.cl',
    'admin@imprenta.cl',
    'produccion@imprenta.cl',
    'diseño@imprenta.cl'
);
