-- =====================================================
-- V31: Seed Procurement Data
-- =====================================================

-- 1. Suppliers (Ensure some exist)
INSERT INTO suppliers (id, tenant_id, name, rut, email, phone, created_at) VALUES 
('s1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Distribuidora Central', '77.888.999-0', 'ventas@central.cl', '+5622334455', NOW()),
('s1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Insignia Supplies', '77.111.222-3', 'contacto@insignia.cl', '+5622998877', NOW())
ON CONFLICT DO NOTHING;

-- 2. Purchase Requests
INSERT INTO purchase_requests (id, tenant_id, requested_by, status, notes, created_at) VALUES
('r1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'PENDING', 'Reposición semanal harinas', NOW() - INTERVAL '2 days'),
('r1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'APPROVED', 'Urgente: Bebidas', NOW() - INTERVAL '5 days');

-- 3. Purchase Request Items
INSERT INTO purchase_request_items (request_id, product_name, quantity) VALUES
('r1000000-0000-0000-0000-000000000001', 'Harina 25kg', 10),
('r1000000-0000-0000-0000-000000000001', 'Levadura Fresca', 50),
('r1000000-0000-0000-0000-000000000002', 'Coca Cola 3L', 20);
