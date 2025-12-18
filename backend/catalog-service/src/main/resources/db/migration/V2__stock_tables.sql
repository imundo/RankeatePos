-- =====================================================
-- Catalog Service - Stock Tables Migration
-- =====================================================

-- =====================================================
-- STOCK (Stock actual por variante/sucursal)
-- =====================================================
CREATE TABLE stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL,
    
    cantidad_actual INT NOT NULL DEFAULT 0,
    cantidad_reservada INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(variant_id, branch_id)
);

CREATE INDEX idx_stock_tenant ON stock(tenant_id);
CREATE INDEX idx_stock_branch ON stock(branch_id);
CREATE INDEX idx_stock_variant ON stock(variant_id);

-- =====================================================
-- STOCK_MOVEMENTS (Historial de movimientos)
-- =====================================================
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    branch_id UUID NOT NULL,
    
    tipo VARCHAR(30) NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    costo_unitario INT,
    
    motivo VARCHAR(500),
    documento_referencia VARCHAR(100),
    
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX idx_movements_branch ON stock_movements(branch_id);
CREATE INDEX idx_movements_variant ON stock_movements(variant_id);
CREATE INDEX idx_movements_date ON stock_movements(created_at);
CREATE INDEX idx_movements_tipo ON stock_movements(tipo);
