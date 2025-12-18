-- =====================================================
-- V8: Tags System and Multi-Business Support
-- Sistema de etiquetas para productos y soporte multi-negocio
-- NOTE: tenant_id is NOT a FK since tenants table is in auth_db
-- =====================================================

-- Tabla de Tags para productos
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- No FK: tenants is in auth_db
    nombre VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366F1', -- Color hexadecimal
    icono VARCHAR(10) DEFAULT '🏷️',
    descripcion VARCHAR(200),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, nombre)
);

-- Relación many-to-many productos-tags
CREATE TABLE product_tags (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, tag_id)
);

-- Índices para rendimiento
CREATE INDEX idx_tags_tenant ON tags(tenant_id);
CREATE INDEX idx_tags_activo ON tags(tenant_id, activo);
CREATE INDEX idx_product_tags_product ON product_tags(product_id);
CREATE INDEX idx_product_tags_tag ON product_tags(tag_id);

-- =====================================================
-- Tags predefinidos por tipo de negocio
-- =====================================================

-- Tags universales (aplican a todos los negocios)
INSERT INTO tags (id, tenant_id, nombre, color, icono, descripcion) VALUES
-- Para tenant demo El Trigal
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Destacado', '#F59E0B', '⭐', 'Producto destacado/promoción'),
('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Nuevo', '#10B981', '🆕', 'Producto nuevo'),
('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Oferta', '#EF4444', '🔥', 'En oferta/descuento'),
('e1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Popular', '#8B5CF6', '👍', 'Más vendido'),

-- Tags para Panadería/Pastelería
('e1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Sin Gluten', '#06B6D4', '🌾', 'Apto para celíacos'),
('e1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'Vegano', '#22C55E', '🌱', 'Sin productos animales'),
('e1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'Integral', '#A16207', '🥖', 'Con harina integral'),
('e1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'Artesanal', '#D97706', '👨‍🍳', 'Elaboración artesanal'),
('e1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'Light', '#14B8A6', '💚', 'Bajo en calorías'),

-- Tags para Minimarket/Abarrotes
('e100000a-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 'Importado', '#3B82F6', '🌍', 'Producto importado'),
('e100000b-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000001', 'Nacional', '#16A34A', '🇨🇱', 'Producto nacional'),
('e100000c-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000001', 'Orgánico', '#84CC16', '🌿', 'Producto orgánico certificado'),

-- Tags para Charcutería/Carnicería
('e100000d-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000001', 'Fresco', '#0EA5E9', '❄️', 'Producto fresco del día'),
('e100000e-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000001', 'Premium', '#A855F7', '💎', 'Calidad premium'),
('e100000f-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000001', 'Congelado', '#60A5FA', '🧊', 'Producto congelado');

-- =====================================================
-- Tabla de configuración por país LATAM
-- =====================================================

CREATE TABLE country_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_pais CHAR(2) NOT NULL UNIQUE, -- ISO 3166-1 alpha-2
    nombre_pais VARCHAR(100) NOT NULL,
    moneda_codigo CHAR(3) NOT NULL, -- ISO 4217
    moneda_simbolo VARCHAR(5) NOT NULL,
    moneda_nombre VARCHAR(50) NOT NULL,
    formato_numero VARCHAR(20) DEFAULT '#.###,##', -- Formato miles y decimales
    formato_fecha VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    impuesto_nombre VARCHAR(20) NOT NULL, -- IVA, IGV, IVU, etc.
    impuesto_porcentaje DECIMAL(5,2) NOT NULL,
    impuesto_incluido BOOLEAN DEFAULT TRUE, -- Si precios incluyen impuesto
    prefijo_telefono VARCHAR(5) NOT NULL,
    formato_rut VARCHAR(50), -- Formato del identificador fiscal
    nombre_rut VARCHAR(30), -- RUT, RUC, RFC, NIT, etc.
    zona_horaria VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Países LATAM con configuración tributaria actualizada 2024
INSERT INTO country_config (codigo_pais, nombre_pais, moneda_codigo, moneda_simbolo, moneda_nombre, 
    impuesto_nombre, impuesto_porcentaje, prefijo_telefono, formato_rut, nombre_rut, zona_horaria) VALUES
('CL', 'Chile', 'CLP', '$', 'Peso Chileno', 'IVA', 19.00, '+56', '##.###.###-#', 'RUT', 'America/Santiago'),
('AR', 'Argentina', 'ARS', '$', 'Peso Argentino', 'IVA', 21.00, '+54', '##-########-#', 'CUIT', 'America/Buenos_Aires'),
('PE', 'Perú', 'PEN', 'S/', 'Sol Peruano', 'IGV', 18.00, '+51', '##########-#', 'RUC', 'America/Lima'),
('CO', 'Colombia', 'COP', '$', 'Peso Colombiano', 'IVA', 19.00, '+57', '###.###.###-#', 'NIT', 'America/Bogota'),
('MX', 'México', 'MXN', '$', 'Peso Mexicano', 'IVA', 16.00, '+52', '####-######-###', 'RFC', 'America/Mexico_City'),
('EC', 'Ecuador', 'USD', '$', 'Dólar Estadounidense', 'IVA', 12.00, '+593', '#############', 'RUC', 'America/Guayaquil'),
('BO', 'Bolivia', 'BOB', 'Bs', 'Boliviano', 'IVA', 13.00, '+591', '##########', 'NIT', 'America/La_Paz'),
('PY', 'Paraguay', 'PYG', '₲', 'Guaraní', 'IVA', 10.00, '+595', '########-#', 'RUC', 'America/Asuncion'),
('UY', 'Uruguay', 'UYU', '$U', 'Peso Uruguayo', 'IVA', 22.00, '+598', '############', 'RUT', 'America/Montevideo'),
('VE', 'Venezuela', 'VES', 'Bs', 'Bolívar', 'IVA', 16.00, '+58', 'J-########-#', 'RIF', 'America/Caracas'),
('PA', 'Panamá', 'PAB', 'B/.', 'Balboa', 'ITBMS', 7.00, '+507', '##-###-####', 'RUC', 'America/Panama'),
('CR', 'Costa Rica', 'CRC', '₡', 'Colón', 'IVA', 13.00, '+506', '#-###-######', 'Cédula', 'America/Costa_Rica'),
('GT', 'Guatemala', 'GTQ', 'Q', 'Quetzal', 'IVA', 12.00, '+502', '########-#', 'NIT', 'America/Guatemala'),
('DO', 'República Dominicana', 'DOP', 'RD$', 'Peso Dominicano', 'ITBIS', 18.00, '+1809', '###-#######-#', 'RNC', 'America/Santo_Domingo'),
('PR', 'Puerto Rico', 'USD', '$', 'Dólar Estadounidense', 'IVU', 11.50, '+1787', '##-#######', 'EIN', 'America/Puerto_Rico');

-- NOTE: tenant_documents table removed as it references tenants table in auth_db
-- If needed, create it in auth-service migration instead
