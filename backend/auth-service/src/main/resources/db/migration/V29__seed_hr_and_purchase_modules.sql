-- =====================================================
-- V29: Seed HR and Advanced Purchasing Modules
-- Adds requested RRHH and detailed Purchasing options
-- =====================================================

-- 1. Insert new modules
INSERT INTO modules (code, name, description, icon, category, sort_order) VALUES
-- RRHH (Recursos Humanos)
('staff', 'Personal', 'Fichas de empleados y contratos', '📇', 'RRHH', 70),
('attendance', 'Asistencia', 'Control de turnos y marcaje', '⏰', 'RRHH', 71),
('payroll', 'Remuneraciones', 'Liquidaciones y pagos de sueldo', '💰', 'RRHH', 72),

-- Compras (Advanced)
('purchase-requests', 'Solicitudes Compra', 'Requerimientos internos de stock', '📋', 'Compras', 33),
('reception', 'Recepción', 'Ingreso de mercadería y control de calidad', '📦', 'Compras', 34)

ON CONFLICT (code) DO NOTHING;

-- 2. Move existing modules to 'Compras' category for consistency
UPDATE modules SET category = 'Compras' WHERE code IN ('purchases', 'suppliers');
