-- =====================================================
-- Catalog Service - Demo Seed Data for Panadería
-- Business: El Trigal Bakery
-- =====================================================

-- Get tenant ID for El Trigal (from auth-service seed)
-- Assuming tenant: a1000000-0000-0000-0000-000000000001

-- =====================================================
-- More realistic products for Chilean Panadería
-- =====================================================

-- Insert additional bakery products
INSERT INTO products (id, tenant_id, sku, nombre, descripcion, category_id, unit_id, activo, created_at)
VALUES
    -- Panes
    ('b1001000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 
     'PAN-004', 'Pan Amasado', 'Pan casero tradicional chileno', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    ('b1001000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 
     'PAN-005', 'Pan Francés', 'Baguette estilo francés', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    ('b1001000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 
     'PAN-006', 'Pan de Molde', 'Pan blanco de molde 500g', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    
    -- Pasteles
    ('b1002000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 
     'PAS-003', 'Berlín', 'Donut relleno con crema', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    ('b1002000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 
     'PAS-004', 'Empanada Pino', 'Empanada de carne tradicional', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    ('b1002000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 
     'PAS-005', 'Empanada Queso', 'Empanada de queso', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    ('b1002000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 
     'PAS-006', 'Croissant', 'Croissant de mantequilla', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    ('b1002000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 
     'PAS-007', 'Pan de Pascua', 'Pan de pascua tradicional 500g', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    
    -- Bebidas
    ('b1003000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 
     'BEB-003', 'Cappuccino', 'Cappuccino espresso con espuma', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    ('b1003000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 
     'BEB-004', 'Chocolate Caliente', 'Chocolate caliente con leche', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    ('b1003000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 
     'BEB-005', 'Coca-Cola 350ml', 'Bebida gaseosa', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW()),
    ('b1003000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 
     'BEB-006', 'Agua Mineral 500ml', 'Agua mineral sin gas', NULL, 'a0000000-0000-0000-0000-000000000001', true, NOW());

-- Insert variants with prices (Chilean Pesos)
INSERT INTO product_variants (id, product_id, tenant_id, sku, precio_neto, precio_bruto, costo, stock_minimo, activo, es_default, created_at)
VALUES
    -- Pan Amasado
    ('c1001000-0000-0000-0000-000000000001', 'b1001000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000001', 'PAN-004', 210, 250, 120, 20, true, true, NOW()),
    -- Pan Francés
    ('c1001000-0000-0000-0000-000000000002', 'b1001000-0000-0000-0000-000000000002', 
     'a1000000-0000-0000-0000-000000000001', 'PAN-005', 420, 500, 250, 15, true, true, NOW()),
    -- Pan de Molde
    ('c1001000-0000-0000-0000-000000000003', 'b1001000-0000-0000-0000-000000000003', 
     'a1000000-0000-0000-0000-000000000001', 'PAN-006', 1681, 2000, 1200, 10, true, true, NOW()),
    -- Berlín
    ('c1002000-0000-0000-0000-000000000001', 'b1002000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000001', 'PAS-003', 504, 600, 300, 30, true, true, NOW()),
    -- Empanada Pino
    ('c1002000-0000-0000-0000-000000000002', 'b1002000-0000-0000-0000-000000000002', 
     'a1000000-0000-0000-0000-000000000001', 'PAS-004', 1681, 2000, 1000, 25, true, true, NOW()),
    -- Empanada Queso
    ('c1002000-0000-0000-0000-000000000003', 'b1002000-0000-0000-0000-000000000003', 
     'a1000000-0000-0000-0000-000000000001', 'PAS-005', 1261, 1500, 700, 25, true, true, NOW()),
    -- Croissant
    ('c1002000-0000-0000-0000-000000000004', 'b1002000-0000-0000-0000-000000000004', 
     'a1000000-0000-0000-0000-000000000001', 'PAS-006', 840, 1000, 500, 20, true, true, NOW()),
    -- Pan de Pascua
    ('c1002000-0000-0000-0000-000000000005', 'b1002000-0000-0000-0000-000000000005', 
     'a1000000-0000-0000-0000-000000000001', 'PAS-007', 4202, 5000, 2800, 5, true, true, NOW()),
    -- Cappuccino
    ('c1003000-0000-0000-0000-000000000001', 'b1003000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000001', 'BEB-003', 1681, 2000, 600, 0, true, true, NOW()),
    -- Chocolate Caliente
    ('c1003000-0000-0000-0000-000000000002', 'b1003000-0000-0000-0000-000000000002', 
     'a1000000-0000-0000-0000-000000000001', 'BEB-004', 1261, 1500, 400, 0, true, true, NOW()),
    -- Coca-Cola
    ('c1003000-0000-0000-0000-000000000003', 'b1003000-0000-0000-0000-000000000003', 
     'a1000000-0000-0000-0000-000000000001', 'BEB-005', 840, 1000, 600, 24, true, true, NOW()),
    -- Agua Mineral
    ('c1003000-0000-0000-0000-000000000004', 'b1003000-0000-0000-0000-000000000004', 
     'a1000000-0000-0000-0000-000000000001', 'BEB-006', 504, 600, 300, 24, true, true, NOW());

-- =====================================================
-- Initial stock for demo (branch from auth-service)
-- Assuming branch: a2000000-0000-0000-0000-000000000001
-- =====================================================

-- Note: Stock will be managed via StockController API
-- This is just initial seed data

INSERT INTO stock (id, tenant_id, variant_id, branch_id, cantidad_actual, cantidad_reservada, created_at)
SELECT 
    uuid_generate_v4(),
    'a1000000-0000-0000-0000-000000000001',
    pv.id,
    'a2000000-0000-0000-0000-000000000001',
    CASE 
        WHEN pv.sku LIKE 'PAN%' THEN floor(random() * 50 + 30)::int
        WHEN pv.sku LIKE 'PAS%' THEN floor(random() * 30 + 10)::int
        WHEN pv.sku LIKE 'BEB%' THEN floor(random() * 40 + 20)::int
        ELSE 25
    END,
    0,
    NOW()
FROM product_variants pv
WHERE pv.tenant_id = 'a1000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;
