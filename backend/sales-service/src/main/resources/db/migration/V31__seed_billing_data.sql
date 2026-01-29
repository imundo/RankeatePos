-- =====================================================
-- V31: Seed Billing Data
-- Demo Invoices
-- =====================================================

INSERT INTO invoices (id, tenant_id, folio, type, emission_date, client_rut, client_name, total_amount, status) VALUES
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1001, 'BOLETA', NOW() - INTERVAL '1 hour', '66.666.666-6', 'Cliente Boleta', 5000, 'ACCEPTED_SII'),
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 2505, 'FACTURA', NOW() - INTERVAL '1 day', '77.777.777-7', 'Empresa Cliente SpA', 150000, 'ACCEPTED_SII'),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 2506, 'FACTURA', NOW() - INTERVAL '2 days', '88.888.888-8', 'Constructora S.A.', 2300000, 'ISSUED');

INSERT INTO invoice_items (invoice_id, product_name, quantity, total) VALUES
('b1000000-0000-0000-0000-000000000001', 'Pan Hallulla kg', 2, 5000),
('b1000000-0000-0000-0000-000000000002', 'Catering Evento', 1, 150000);
