-- =====================================================
-- V34: Add Accounting Modules
-- =====================================================

INSERT INTO modules (code, name, description, icon, category, sort_order) VALUES
('accounting', 'Contabilidad', 'Asientos, libro diario y mayores', '📓', 'Finanzas', 43),
('treasury', 'Tesorería', 'Control de cajas y cuentas bancarias', '💰', 'Finanzas', 44)
ON CONFLICT (code) DO NOTHING;
