-- =====================================================
-- El Trigal - Complete Product Images & Categories Fix
-- V7: Update ALL products with images from assets
-- =====================================================

-- Assign images based on product type (using wildcard patterns)
-- Panes
UPDATE products SET imagen_url = '/assets/products/pan_marraqueta.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' 
AND nombre ILIKE '%marraqueta%';

UPDATE products SET imagen_url = '/assets/products/pan_hallulla.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' 
AND (nombre ILIKE '%hallulla%' OR sku LIKE 'PAN-002%' OR sku LIKE 'PAN-008%');

-- Tortas y Pasteles
UPDATE products SET imagen_url = '/assets/products/torta_chocolate.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' 
AND (nombre ILIKE '%torta%' OR nombre ILIKE '%chocolate%' OR nombre ILIKE '%kuchen%');

-- Empanadas
UPDATE products SET imagen_url = '/assets/products/empanada_pino.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' 
AND (nombre ILIKE '%empanada%' OR sku LIKE 'EMP%');

-- Cafetería
UPDATE products SET imagen_url = '/assets/products/cafe_espresso.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' 
AND (nombre ILIKE '%café%' OR nombre ILIKE '%cafe%' OR nombre ILIKE '%espresso%' 
     OR nombre ILIKE '%cortado%' OR nombre ILIKE '%milo%' OR nombre ILIKE '%té%' OR sku LIKE 'CAF%');

-- Galletas
UPDATE products SET imagen_url = '/assets/products/galletas_avena.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' 
AND (nombre ILIKE '%galleta%' OR sku LIKE 'GAL%');

-- Default image for products without specific images (generic bread icon)
UPDATE products SET imagen_url = '/assets/products/pan_marraqueta.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' 
AND imagen_url IS NULL AND sku LIKE 'PAN%';

-- Bebidas without specific image get cafe
UPDATE products SET imagen_url = '/assets/products/cafe_espresso.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' 
AND imagen_url IS NULL AND sku LIKE 'BEB%';

-- Pastelería without specific image get torta
UPDATE products SET imagen_url = '/assets/products/torta_chocolate.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' 
AND imagen_url IS NULL AND sku LIKE 'PAS%';
