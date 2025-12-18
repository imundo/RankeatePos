-- =====================================================
-- Sales Service - Demo Seed Data
-- =====================================================
-- Cajas registradoras, sesiones y ventas de demostración
-- UUIDs corregidos con formato hexadecimal válido
-- =====================================================

-- =====================================================
-- TENANT 1: El Trigal - Cajas Registradoras
-- UUIDs: ca100000 (cash registers for tenant 1)
-- =====================================================
INSERT INTO cash_registers (id, tenant_id, branch_id, nombre, codigo, activa, created_at) VALUES
-- Providencia (2 cajas)
('ca100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'Caja 1 Principal', 'CAJA-01', true, NOW()),
('ca100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'Caja 2 Express', 'CAJA-02', true, NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TENANT 2: Don Pedro - Cajas Registradoras
-- =====================================================
INSERT INTO cash_registers (id, tenant_id, branch_id, nombre, codigo, activa, created_at) VALUES
('ca200000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Caja Principal', 'CAJA-01', true, NOW())
ON CONFLICT DO NOTHING;
