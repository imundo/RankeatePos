-- =====================================================
-- V11: Actualizar Datos Reales de Empresas Demo
-- Fecha: 2026-01-16
-- Descripción: Agrega datos completos (RUT, dirección, logo, etc.)
--              a todas las empresas demo para emisión de DTEs
-- =====================================================

-- IMPORTANTE: Este script actualiza los TENANTS y BRANCHES existentes
-- con datos realistas para la emisión de Documentos Tributarios

-- =====================================================
-- 1. AGREGAR COLUMNAS FALTANTES A TENANT
-- =====================================================
-- Ya existen en V1: rut, razon_social, nombre_fantasia, giro, direccion, comuna, region
-- Agregar solo si no existen:
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='tenants' AND column_name='ciudad') THEN
        ALTER TABLE tenants ADD COLUMN ciudad VARCHAR(100);
    END IF;
   
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='tenants' AND column_name='telefono') THEN
        ALTER TABLE tenants ADD COLUMN telefono VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='tenants' AND column_name='email') THEN
        ALTER TABLE tenants ADD COLUMN email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='tenants' AND column_name='logo_url') THEN
        ALTER TABLE tenants ADD COLUMN logo_url VARCHAR(500);
    END IF;
END $$;

-- =====================================================
-- 2. AGREGAR COLUMNAS FALTANTES A BRANCH
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='branches' AND column_name='ciudad') THEN
        ALTER TABLE branches ADD COLUMN ciudad VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='branches' AND column_name='email') THEN
        ALTER TABLE branches ADD COLUMN email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='branches' AND column_name='logo_url') THEN
        ALTER TABLE branches ADD COLUMN logo_url VARCHAR(500);
    END IF;
END $$;

-- =====================================================
-- 3. ACTUALIZAR PANADERÍA EL TRIGAL
-- =====================================================
UPDATE tenants SET
    rut = '76.543.210-5',
    razon_social = 'Panadería y Pastelería El Trigal SpA',
    nombre_fantasia = 'El Trigal',
    giro = 'Panadería y Pastelería Artesanal',
    direccion = 'Av. Grecia 8735',
    comuna = 'Peñalolén',
    region = 'Metropolitana',
    ciudad = 'Santiago',
    telefono = '+56 2 2274 5678',
    email = 'contacto@eltrigal.cl',
    logo_url = 'https://i.postimg.cc/76rL8yMN/panaderia.png',
    updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000001';

UPDATE branches SET
    nombre = 'Panadería El Trigal - Casa Matriz',
    direccion = 'Av. Grecia 8735',
    comuna = 'Peñalolén',
    ciudad = 'Santiago',
    telefono = '+56 2 2274 5678',
    email = 'casamatriz@eltrigal.cl',
    logo_url = 'https://i.postimg.cc/76rL8yMN/panaderia.png',
    updated_at = NOW()
WHERE id = 'b1000000-0000-0000-0000-000000000001';

-- =====================================================
-- 4. AGREGAR/ACTUALIZAR ACADEMIA PRO
-- =====================================================
-- Buscar si existe
DO $$
BEGIN
    -- Si el tenant de Academia Pro existe, actualizar
    IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@aprepro.cl') THEN
        UPDATE tenants SET
            rut = '77.234.567-8',
            razon_social = 'Academia Profesional de Capacitación Ltda.',
            nombre_fantasia = 'Academia Pro',
            giro = 'Educación y Capacitación Profesional',
            direccion = 'Av. Libertador Bernardo O''Higgins 1234',
           comuna = 'Santiago Centro',
            region = 'Metropolitana',
            ciudad = 'Santiago',
            telefono = '+56 2 2356 7890',
            email = 'info@academiapro.cl',
            logo_url = 'https://i.postimg.cc/QCq4hT3D/academia.png',
            updated_at = NOW()
        WHERE id = (SELECT tenant_id FROM users WHERE email = 'admin@aprepro.cl' LIMIT 1);
    END IF;
END $$;

-- =====================================================
-- 5. AGREGAR/ACTUALIZAR EDITORIAL CREATIVA
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@imprenta.cl') THEN
        UPDATE tenants SET
            rut = '78.901.234-K',
            razon_social = 'Editorial e Imprenta Creativa S.A.',
            nombre_fantasia = 'Editorial Creativa',
            giro = 'Servicios de Imprenta y Editorial',
            direccion = 'Calle San Diego 567',
            comuna = 'Santiago Centro',
            region = 'Metropolitana',
            ciudad = 'Santiago',
            telefono = '+56 2 2789 4567',
            email = 'contacto@editorialcreativa.cl',
            logo_url = 'https://i.postimg.cc/T3wZZ0pF/editorial.png',
            updated_at = NOW()
        WHERE id = (SELECT tenant_id FROM users WHERE email = 'admin@imprenta.cl' LIMIT 1);
    END IF;
END $$;

-- =====================================================
-- 6. ACTUALIZAR MINIMARKET (ya existe como Don Pedro)
-- =====================================================
UPDATE tenants SET
    rut = '79.456.789-3',
    razon_social = 'Comercial El Vecino Ltda.',
    nombre_fantasia = 'Minimarket El Vecino',
    giro = 'Comercio al por Menor de Abarrotes',
    direccion = 'Av. Vicuña Mackenna 4567',
    comuna = 'La Florida',
    region = 'Metropolitana',
    ciudad = 'Santiago',
    telefono = '+56 2 2345 6789',
    email = 'contacto@minimarketvecino.cl',
    logo_url = 'https://i.postimg.cc/Jhgjsx6Z/minimarket.png',
    updated_at = NOW()
WHERE id = 'a2000000-0000-0000-0000-000000000002';

-- =====================================================
-- 7. ACTUALIZAR CHARCUTERÍA LA SELECTA
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@laselecta.cl') THEN
        UPDATE tenants SET
            rut = '80.123.456-7',
            razon_social = 'Charcutería y Fiambrería La Selecta SpA',
            nombre_fantasia = 'Charcutería La Selecta',
            giro = 'Venta de Productos Cárnicos y Fiambres',
            direccion = 'Av. Apoquindo 3456',
            comuna = 'Las Condes',
            region = 'Metropolitana',
            ciudad = 'Santiago',
            telefono = '+56 2 2567 8901',
            email = 'contacto@laselecta.cl',
            logo_url = 'https://i.postimg.cc/G26p4D9R/charcuteria.png',
            updated_at = NOW()
        WHERE id = (SELECT tenant_id FROM users WHERE email = 'admin@laselecta.cl' LIMIT 1);
    END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
SELECT 
    t.nombre_fantasia AS "Nombre",
    t.rut AS "RUT",
    t.razon_social AS "Razón Social",
    t.giro AS "Giro",
    CONCAT(t.direccion, ', ', t.comuna) AS "Dirección",
    t.logo_url AS "Logo",
    u.email AS "Email Admin"
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.email LIKE 'admin%'
WHERE t.activo = true
ORDER BY t.nombre_fantasia;
