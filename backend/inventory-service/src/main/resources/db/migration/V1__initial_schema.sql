-- =====================================================
-- Inventory Service - Initial Schema
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STOCK (Stock actual por variante y sucursal)
-- =====================================================
CREATE TABLE stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    variant_id UUID NOT NULL,
    
    cantidad DECIMAL(12,3) NOT NULL DEFAULT 0,
    cantidad_reservada DECIMAL(12,3) NOT NULL DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, branch_id, variant_id)
);

CREATE INDEX idx_stock_tenant ON stock(tenant_id);
CREATE INDEX idx_stock_branch ON stock(branch_id);
CREATE INDEX idx_stock_variant ON stock(variant_id);

-- =====================================================
-- STOCK_MOVEMENT (Movimiento de inventario)
-- =====================================================
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    variant_id UUID NOT NULL,
    
    tipo VARCHAR(30) NOT NULL, -- ENTRADA, SALIDA, AJUSTE, VENTA, DEVOLUCION, TRANSFERENCIA_IN, TRANSFERENCIA_OUT
    cantidad DECIMAL(12,3) NOT NULL,
    stock_anterior DECIMAL(12,3) NOT NULL,
    stock_nuevo DECIMAL(12,3) NOT NULL,
    
    -- Referencia
    reference_type VARCHAR(30), -- SALE, PURCHASE, ADJUSTMENT, TRANSFER
    reference_id UUID,
    
    nota TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL
);

CREATE INDEX idx_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX idx_movements_branch ON stock_movements(branch_id);
CREATE INDEX idx_movements_variant ON stock_movements(variant_id);
CREATE INDEX idx_movements_date ON stock_movements(created_at);
CREATE INDEX idx_movements_reference ON stock_movements(reference_type, reference_id);

-- =====================================================
-- STOCK_ADJUSTMENT (Ajuste de inventario)
-- =====================================================
CREATE TABLE stock_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    numero VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- CONTEO, MERMA, DEVOLUCION, OTRO
    motivo TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR', -- BORRADOR, APLICADO, CANCELADO
    
    aplicado_at TIMESTAMP WITH TIME ZONE,
    aplicado_por UUID,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    UNIQUE(tenant_id, numero)
);

CREATE INDEX idx_adjustments_tenant ON stock_adjustments(tenant_id);

-- =====================================================
-- STOCK_ADJUSTMENT_ITEM (Línea de ajuste)
-- =====================================================
CREATE TABLE stock_adjustment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_id UUID NOT NULL REFERENCES stock_adjustments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL,
    
    cantidad_sistema DECIMAL(12,3) NOT NULL,
    cantidad_real DECIMAL(12,3) NOT NULL,
    diferencia DECIMAL(12,3) NOT NULL,
    
    nota TEXT
);

CREATE INDEX idx_adjustment_items_adjustment ON stock_adjustment_items(adjustment_id);

-- =====================================================
-- STOCK_ALERT (Alertas de stock bajo)
-- =====================================================
CREATE TABLE stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    variant_id UUID NOT NULL,
    
    tipo VARCHAR(20) NOT NULL, -- BAJO, AGOTADO
    cantidad_actual DECIMAL(12,3) NOT NULL,
    stock_minimo DECIMAL(12,3) NOT NULL,
    
    notificado BOOLEAN NOT NULL DEFAULT false,
    resuelto BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_alerts_tenant ON stock_alerts(tenant_id);
CREATE INDEX idx_alerts_pending ON stock_alerts(tenant_id, resuelto) WHERE resuelto = false;
