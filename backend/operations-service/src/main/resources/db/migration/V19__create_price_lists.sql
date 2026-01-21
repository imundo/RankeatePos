-- V19: Create price_lists and price_list_items tables

CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('GENERAL', 'SUCURSAL', 'CLIENTE', 'TEMPORAL')),
    sucursal_id UUID,
    cliente_id UUID,
    fecha_inicio DATE,
    fecha_fin DATE,
    prioridad INTEGER DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,
    precio DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(5,2),
    precio_minimo DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(price_list_id, producto_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_price_lists_tenant ON price_lists(tenant_id);
CREATE INDEX idx_price_lists_tipo ON price_lists(tenant_id, tipo);
CREATE INDEX idx_price_lists_sucursal ON price_lists(tenant_id, sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX idx_price_lists_cliente ON price_lists(tenant_id, cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX idx_price_lists_temporal ON price_lists(tenant_id, fecha_inicio, fecha_fin) WHERE tipo = 'TEMPORAL';
CREATE INDEX idx_price_list_items_producto ON price_list_items(producto_id);
CREATE INDEX idx_price_list_items_list ON price_list_items(price_list_id);
