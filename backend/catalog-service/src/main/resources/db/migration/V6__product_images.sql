-- =====================================================
-- El Trigal - Product Image URLs 
-- Add image URLs to products for demo
-- =====================================================

-- Update products with image URLs (local assets)
UPDATE products SET imagen_url = '/assets/products/pan_marraqueta.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' AND sku = 'PAN-001';

UPDATE products SET imagen_url = '/assets/products/pan_hallulla.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' AND sku = 'PAN-002';

UPDATE products SET imagen_url = '/assets/products/torta_chocolate.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' AND sku = 'PAS-008';

UPDATE products SET imagen_url = '/assets/products/cafe_espresso.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' AND sku = 'CAF-001';

UPDATE products SET imagen_url = '/assets/products/empanada_pino.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' AND sku = 'PAS-004';

UPDATE products SET imagen_url = '/assets/products/galletas_avena.png' 
WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001' AND sku = 'GAL-001';
