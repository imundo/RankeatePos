-- =====================================================
-- V9: Demo Data - New Industry Tenants
-- Academia Online Pro + Editorial Creativa
-- =====================================================

-- =====================================================
-- TENANT 3: Academia Online Pro (Cursos/Capacitaciones)
-- Tenant ID: a3000000-0000-0000-0000-000000000003
-- =====================================================

-- Categories for Academia (using hex digits only: 0-9, a-f)
INSERT INTO categories (id, tenant_id, nombre, descripcion, orden, activa, created_at)
VALUES
    ('a3010000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Desarrollo Web', 'Cursos de programación y desarrollo web', 1, true, NOW()),
    ('a3010000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', 'Marketing Digital', 'Publicidad y redes sociales', 2, true, NOW()),
    ('a3010000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'Diseño UX/UI', 'Experiencia de usuario e interfaces', 3, true, NOW()),
    ('a3010000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000003', 'Liderazgo', 'Habilidades de gestión y liderazgo', 4, true, NOW()),
    ('a3010000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000003', 'Finanzas', 'Educación financiera e inversiones', 5, true, NOW());

-- Products for Academia (Cursos)
INSERT INTO products (id, tenant_id, sku, nombre, descripcion, category_id, unit_id, activo, created_at)
VALUES
    -- Desarrollo Web
    ('a3020000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 
     'CUR-001', 'HTML, CSS y JavaScript desde Cero', 'Aprende las bases del desarrollo web frontend. 40 horas de contenido con certificado.', 
     'a3010000-0000-0000-0000-000000000001', NULL, true, NOW()),
    ('a3020000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', 
     'CUR-002', 'React.js Avanzado', 'Domina React con hooks, context y Redux. 60 horas con proyectos reales.', 
     'a3010000-0000-0000-0000-000000000001', NULL, true, NOW()),
    ('a3020000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 
     'CUR-003', 'Node.js y Express', 'Backend con JavaScript. APIs REST y bases de datos. 45 horas.', 
     'a3010000-0000-0000-0000-000000000001', NULL, true, NOW()),
    -- Marketing Digital
    ('a3020000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000003', 
     'CUR-004', 'Meta Ads y Google Ads', 'Publicidad digital efectiva. 25 horas + certificación oficial.', 
     'a3010000-0000-0000-0000-000000000002', NULL, true, NOW()),
    ('a3020000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000003', 
     'CUR-005', 'Redes Sociales para Negocios', 'Instagram, TikTok, LinkedIn para empresas. 20 horas.', 
     'a3010000-0000-0000-0000-000000000002', NULL, true, NOW()),
    -- Diseño UX/UI
    ('a3020000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000003', 
     'CUR-006', 'Diseño UX con Figma', 'Prototipado profesional. 35 horas + proyecto final.', 
     'a3010000-0000-0000-0000-000000000003', NULL, true, NOW()),
    ('a3020000-0000-0000-0000-000000000007', 'a3000000-0000-0000-0000-000000000003', 
     'CUR-007', 'UI Design Systems', 'Crea sistemas de diseño escalables. 30 horas.', 
     'a3010000-0000-0000-0000-000000000003', NULL, true, NOW()),
    -- Liderazgo
    ('a3020000-0000-0000-0000-000000000008', 'a3000000-0000-0000-0000-000000000003', 
     'CUR-008', 'Liderazgo Transformacional', 'Lidera equipos de alto rendimiento. 15 horas.', 
     'a3010000-0000-0000-0000-000000000004', NULL, true, NOW()),
    -- Finanzas
    ('a3020000-0000-0000-0000-000000000009', 'a3000000-0000-0000-0000-000000000003', 
     'CUR-009', 'Inversiones para Principiantes', 'Fondos, acciones y cripto. 20 horas.', 
     'a3010000-0000-0000-0000-000000000005', NULL, true, NOW()),
    ('a3020000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-000000000003', 
     'CUR-010', 'Excel Financiero', 'Domina Excel para finanzas y reportes. 25 horas.', 
     'a3010000-0000-0000-0000-000000000005', NULL, true, NOW());

-- Variants with prices for Academia (Chilean Pesos)
INSERT INTO product_variants (id, product_id, tenant_id, sku, precio_neto, precio_bruto, costo, stock_minimo, activo, es_default, created_at)
VALUES
    ('a3030000-0000-0000-0000-000000000001', 'a3020000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'CUR-001', 75622, 89990, 10000, 0, true, true, NOW()),
    ('a3030000-0000-0000-0000-000000000002', 'a3020000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', 'CUR-002', 109235, 129990, 15000, 0, true, true, NOW()),
    ('a3030000-0000-0000-0000-000000000003', 'a3020000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'CUR-003', 84025, 99990, 12000, 0, true, true, NOW()),
    ('a3030000-0000-0000-0000-000000000004', 'a3020000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000003', 'CUR-004', 67218, 79990, 8000, 0, true, true, NOW()),
    ('a3030000-0000-0000-0000-000000000005', 'a3020000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000003', 'CUR-005', 50412, 59990, 6000, 0, true, true, NOW()),
    ('a3030000-0000-0000-0000-000000000006', 'a3020000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000003', 'CUR-006', 84025, 99990, 12000, 0, true, true, NOW()),
    ('a3030000-0000-0000-0000-000000000007', 'a3020000-0000-0000-0000-000000000007', 'a3000000-0000-0000-0000-000000000003', 'CUR-007', 75622, 89990, 10000, 0, true, true, NOW()),
    ('a3030000-0000-0000-0000-000000000008', 'a3020000-0000-0000-0000-000000000008', 'a3000000-0000-0000-0000-000000000003', 'CUR-008', 58815, 69990, 7000, 0, true, true, NOW()),
    ('a3030000-0000-0000-0000-000000000009', 'a3020000-0000-0000-0000-000000000009', 'a3000000-0000-0000-0000-000000000003', 'CUR-009', 42008, 49990, 5000, 0, true, true, NOW()),
    ('a3030000-0000-0000-0000-00000000000a', 'a3020000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-000000000003', 'CUR-010', 50412, 59990, 6000, 0, true, true, NOW());

-- =====================================================
-- TENANT 4: Editorial Creativa (Imprenta/Editorial)
-- Tenant ID: a4000000-0000-0000-0000-000000000004
-- =====================================================

-- Categories for Editorial
INSERT INTO categories (id, tenant_id, nombre, descripcion, orden, activa, created_at)
VALUES
    ('a4010000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Libros Impresos', 'Libros físicos encuadernados', 1, true, NOW()),
    ('a4010000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', 'Revistas', 'Publicaciones periódicas', 2, true, NOW()),
    ('a4010000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000004', 'Catálogos', 'Catálogos corporativos', 3, true, NOW()),
    ('a4010000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 'Folletos', 'Material promocional', 4, true, NOW()),
    ('a4010000-0000-0000-0000-000000000005', 'a4000000-0000-0000-0000-000000000004', 'Tarjetas', 'Tarjetas de presentación', 5, true, NOW());

-- Products for Editorial
INSERT INTO products (id, tenant_id, sku, nombre, descripcion, category_id, unit_id, activo, created_at)
VALUES
    -- Libros
    ('a4020000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 
     'LIB-001', 'Libro 100 páginas - Rústica', 'Impresión offset, tapa blanda, pegado perfecto.', 
     'a4010000-0000-0000-0000-000000000001', NULL, true, NOW()),
    ('a4020000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', 
     'LIB-002', 'Libro 200 páginas - Tapa Dura', 'Encuadernación premium con lomo reforzado.', 
     'a4010000-0000-0000-0000-000000000001', NULL, true, NOW()),
    ('a4020000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000004', 
     'LIB-003', 'Libro 300 páginas - Premium', 'Tapa dura, papel ahuesado 90gr, laminado mate.', 
     'a4010000-0000-0000-0000-000000000001', NULL, true, NOW()),
    -- Revistas
    ('a4020000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 
     'REV-001', 'Revista A4 - 32 páginas', 'Papel couché brillante 150gr, grapado.', 
     'a4010000-0000-0000-0000-000000000002', NULL, true, NOW()),
    ('a4020000-0000-0000-0000-000000000005', 'a4000000-0000-0000-0000-000000000004', 
     'REV-002', 'Revista A4 - 64 páginas', 'Papel couché mate 150gr, lomo cuadrado.', 
     'a4010000-0000-0000-0000-000000000002', NULL, true, NOW()),
    -- Catálogos
    ('a4020000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000004', 
     'CAT-001', 'Catálogo Corporativo 24 pág', '24 páginas full color A4, laminado brillante.', 
     'a4010000-0000-0000-0000-000000000003', NULL, true, NOW()),
    -- Folletos
    ('a4020000-0000-0000-0000-000000000007', 'a4000000-0000-0000-0000-000000000004', 
     'FOL-001', 'Tríptico Promocional', 'Papel couché 200gr, laminado, formato A4.', 
     'a4010000-0000-0000-0000-000000000004', NULL, true, NOW()),
    ('a4020000-0000-0000-0000-000000000008', 'a4000000-0000-0000-0000-000000000004', 
     'FOL-002', 'Díptico Institucional', 'A4 doblado, full color ambos lados.', 
     'a4010000-0000-0000-0000-000000000004', NULL, true, NOW()),
    ('a4020000-0000-0000-0000-000000000009', 'a4000000-0000-0000-0000-000000000004', 
     'FOL-003', 'Flyer A5 Full Color', 'Impresión digital 300gr, ambos lados.', 
     'a4010000-0000-0000-0000-000000000004', NULL, true, NOW()),
    -- Tarjetas
    ('a4020000-0000-0000-0000-00000000000a', 'a4000000-0000-0000-0000-000000000004', 
     'TAR-001', 'Tarjetas de Visita x100', 'Papel 350gr, laminado mate, esquinas rectas.', 
     'a4010000-0000-0000-0000-000000000005', NULL, true, NOW()),
    ('a4020000-0000-0000-0000-00000000000b', 'a4000000-0000-0000-0000-000000000004', 
     'TAR-002', 'Tarjetas Premium x100', 'Hot stamping dorado + relieve, papel 400gr.', 
     'a4010000-0000-0000-0000-000000000005', NULL, true, NOW()),
    ('a4020000-0000-0000-0000-00000000000c', 'a4000000-0000-0000-0000-000000000004', 
     'TAR-003', 'Tarjetas Plásticas x100', 'PVC 0.76mm, full color, chip NFC opcional.', 
     'a4010000-0000-0000-0000-000000000005', NULL, true, NOW());

-- Variants with prices for Editorial
INSERT INTO product_variants (id, product_id, tenant_id, sku, precio_neto, precio_bruto, costo, stock_minimo, activo, es_default, created_at)
VALUES
    ('a4030000-0000-0000-0000-000000000001', 'a4020000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'LIB-001', 13437, 15990, 8000, 20, true, true, NOW()),
    ('a4030000-0000-0000-0000-000000000002', 'a4020000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', 'LIB-002', 25202, 29990, 15000, 15, true, true, NOW()),
    ('a4030000-0000-0000-0000-000000000003', 'a4020000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000004', 'LIB-003', 41168, 48990, 25000, 10, true, true, NOW()),
    ('a4030000-0000-0000-0000-000000000004', 'a4020000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 'REV-001', 7554, 8990, 4500, 50, true, true, NOW()),
    ('a4030000-0000-0000-0000-000000000005', 'a4020000-0000-0000-0000-000000000005', 'a4000000-0000-0000-0000-000000000004', 'REV-002', 11756, 13990, 7000, 30, true, true, NOW()),
    ('a4030000-0000-0000-0000-000000000006', 'a4020000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000004', 'CAT-001', 10916, 12990, 6500, 30, true, true, NOW()),
    ('a4030000-0000-0000-0000-000000000007', 'a4020000-0000-0000-0000-000000000007', 'a4000000-0000-0000-0000-000000000004', 'FOL-001', 748, 890, 400, 100, true, true, NOW()),
    ('a4030000-0000-0000-0000-000000000008', 'a4020000-0000-0000-0000-000000000008', 'a4000000-0000-0000-0000-000000000004', 'FOL-002', 496, 590, 250, 100, true, true, NOW()),
    ('a4030000-0000-0000-0000-000000000009', 'a4020000-0000-0000-0000-000000000009', 'a4000000-0000-0000-0000-000000000004', 'FOL-003', 244, 290, 120, 200, true, true, NOW()),
    ('a4030000-0000-0000-0000-00000000000a', 'a4020000-0000-0000-0000-00000000000a', 'a4000000-0000-0000-0000-000000000004', 'TAR-001', 5034, 5990, 2500, 50, true, true, NOW()),
    ('a4030000-0000-0000-0000-00000000000b', 'a4020000-0000-0000-0000-00000000000b', 'a4000000-0000-0000-0000-000000000004', 'TAR-002', 12597, 14990, 7000, 20, true, true, NOW()),
    ('a4030000-0000-0000-0000-00000000000c', 'a4020000-0000-0000-0000-00000000000c', 'a4000000-0000-0000-0000-000000000004', 'TAR-003', 20160, 23990, 12000, 20, true, true, NOW());

-- Initial stock for Academia (branch: b3000000-0000-0000-0000-000000000001)
INSERT INTO stock (id, tenant_id, variant_id, branch_id, cantidad_actual, cantidad_reservada, created_at)
SELECT 
    gen_random_uuid(),
    'a3000000-0000-0000-0000-000000000003',
    pv.id,
    'b3000000-0000-0000-0000-000000000001',
    999, -- Cursos have unlimited availability
    0,
    NOW()
FROM product_variants pv
WHERE pv.tenant_id = 'a3000000-0000-0000-0000-000000000003'
ON CONFLICT DO NOTHING;

-- Initial stock for Editorial (branch: b4000000-0000-0000-0000-000000000001)
INSERT INTO stock (id, tenant_id, variant_id, branch_id, cantidad_actual, cantidad_reservada, created_at)
SELECT 
    gen_random_uuid(),
    'a4000000-0000-0000-0000-000000000004',
    pv.id,
    'b4000000-0000-0000-0000-000000000001',
    CASE 
        WHEN pv.sku LIKE 'LIB%' THEN floor(random() * 100 + 50)::int
        WHEN pv.sku LIKE 'REV%' THEN floor(random() * 200 + 100)::int
        WHEN pv.sku LIKE 'CAT%' THEN floor(random() * 150 + 50)::int
        WHEN pv.sku LIKE 'FOL%' THEN floor(random() * 500 + 200)::int
        WHEN pv.sku LIKE 'TAR%' THEN floor(random() * 300 + 100)::int
        ELSE 100
    END,
    0,
    NOW()
FROM product_variants pv
WHERE pv.tenant_id = 'a4000000-0000-0000-0000-000000000004'
ON CONFLICT DO NOTHING;
