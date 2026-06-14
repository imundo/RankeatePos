-- =====================================================
-- V36: Ensure accounting modules exist
-- =====================================================

INSERT INTO modules (id, code, name, description, icon, category, sort_order, active) 
VALUES
(gen_random_uuid(), 'accounting', 'Contabilidad', 'Asientos, libro diario y mayores', '📓', 'Finanzas', 43, true),
(gen_random_uuid(), 'treasury', 'Tesorería', 'Control de cajas y cuentas bancarias', '💰', 'Finanzas', 44, true)
ON CONFLICT (code) DO NOTHING;
