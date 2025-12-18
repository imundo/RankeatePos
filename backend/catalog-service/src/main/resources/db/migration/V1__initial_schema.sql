-- =====================================================
-- Catalog Service - Initial Schema
-- =====================================================

-- Using gen_random_uuid() - native in PostgreSQL 13+

-- =====================================================
-- CATEGORY (Categoría de productos)
-- =====================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    parent_id UUID REFERENCES categories(id),
    orden INT NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    
    UNIQUE(tenant_id, nombre, parent_id)
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- =====================================================
-- TAX (Impuesto)
-- =====================================================
CREATE TABLE taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    nombre VARCHAR(50) NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    es_default BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(tenant_id, nombre)
);

CREATE INDEX idx_taxes_tenant ON taxes(tenant_id);

-- =====================================================
-- UNIT (Unidad de medida)
-- =====================================================
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- NULL = unidad global del sistema
    
    codigo VARCHAR(10) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    permite_decimales BOOLEAN NOT NULL DEFAULT false,
    
    UNIQUE(tenant_id, codigo)
);

-- Unidades globales del sistema
INSERT INTO units (id, tenant_id, codigo, nombre, permite_decimales) VALUES
('a0000000-0000-0000-0000-000000000001', NULL, 'UN', 'Unidad', false),
('a0000000-0000-0000-0000-000000000002', NULL, 'KG', 'Kilogramo', true),
('a0000000-0000-0000-0000-000000000003', NULL, 'GR', 'Gramo', true),
('a0000000-0000-0000-0000-000000000004', NULL, 'LT', 'Litro', true),
('a0000000-0000-0000-0000-000000000005', NULL, 'ML', 'Mililitro', true),
('a0000000-0000-0000-0000-000000000006', NULL, 'MT', 'Metro', true),
('a0000000-0000-0000-0000-000000000007', NULL, 'CM', 'Centímetro', true),
('a0000000-0000-0000-0000-000000000008', NULL, 'PK', 'Pack', false),
('a0000000-0000-0000-0000-000000000009', NULL, 'CJ', 'Caja', false),
('a0000000-0000-0000-0000-00000000000a', NULL, 'DOC', 'Docena', false);

-- =====================================================
-- PRODUCT (Producto base)
-- =====================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    sku VARCHAR(50) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    category_id UUID REFERENCES categories(id),
    unit_id UUID NOT NULL REFERENCES units(id),
    
    -- Flags
    activo BOOLEAN NOT NULL DEFAULT true,
    requiere_variantes BOOLEAN NOT NULL DEFAULT false,
    permite_venta_fraccionada BOOLEAN NOT NULL DEFAULT false,
    
    -- Imagen
    imagen_url VARCHAR(500),
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    
    UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(tenant_id, sku);
CREATE INDEX idx_products_nombre ON products(tenant_id, nombre);
CREATE INDEX idx_products_activo ON products(tenant_id, activo) WHERE activo = true;

-- =====================================================
-- PRODUCT_VARIANT (Variante de producto)
-- =====================================================
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    sku VARCHAR(50) NOT NULL,
    nombre VARCHAR(100), -- ej: "Grande", "500g", "Chocolate"
    barcode VARCHAR(50),
    
    -- Precios (en CLP, sin decimales)
    costo INT NOT NULL DEFAULT 0,
    precio_neto INT NOT NULL,
    precio_bruto INT NOT NULL,
    
    -- Impuesto
    tax_id UUID REFERENCES taxes(id),
    
    -- Stock
    stock_minimo INT NOT NULL DEFAULT 0,
    
    -- Estado
    activo BOOLEAN NOT NULL DEFAULT true,
    es_default BOOLEAN NOT NULL DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(tenant_id, sku),
    UNIQUE(tenant_id, barcode)
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_tenant ON product_variants(tenant_id);
CREATE INDEX idx_variants_sku ON product_variants(tenant_id, sku);
CREATE INDEX idx_variants_barcode ON product_variants(tenant_id, barcode);
CREATE INDEX idx_variants_activo ON product_variants(tenant_id, activo) WHERE activo = true;

-- =====================================================
-- PRICE_HISTORY (Historial de precios)
-- =====================================================
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    
    costo_anterior INT,
    costo_nuevo INT,
    precio_neto_anterior INT,
    precio_neto_nuevo INT,
    precio_bruto_anterior INT,
    precio_bruto_nuevo INT,
    
    motivo VARCHAR(200),
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_variant ON price_history(variant_id);
CREATE INDEX idx_price_history_date ON price_history(changed_at);
