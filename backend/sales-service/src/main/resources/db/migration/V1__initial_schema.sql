-- =====================================================
-- Sales Service - Initial Schema
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CASH_REGISTER (Caja registradora)
-- =====================================================
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(20),
    activa BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(tenant_id, branch_id, codigo)
);

CREATE INDEX idx_cash_registers_tenant ON cash_registers(tenant_id);
CREATE INDEX idx_cash_registers_branch ON cash_registers(branch_id);

-- =====================================================
-- CASH_SESSION (Sesión de caja / turno)
-- =====================================================
CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    register_id UUID NOT NULL REFERENCES cash_registers(id),
    user_id UUID NOT NULL,
    
    monto_inicial INT NOT NULL DEFAULT 0,
    monto_final INT,
    monto_teorico INT, -- calculado al cierre
    diferencia INT,    -- monto_final - monto_teorico
    
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA', -- ABIERTA, CERRADA
    
    apertura_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    cierre_at TIMESTAMP WITH TIME ZONE,
    cierre_nota TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cash_sessions_tenant ON cash_sessions(tenant_id);
CREATE INDEX idx_cash_sessions_register ON cash_sessions(register_id);
CREATE INDEX idx_cash_sessions_user ON cash_sessions(user_id);
CREATE INDEX idx_cash_sessions_estado ON cash_sessions(tenant_id, estado);

-- =====================================================
-- SALE (Venta)
-- =====================================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    session_id UUID NOT NULL REFERENCES cash_sessions(id),
    
    -- Idempotencia (para offline sync)
    command_id UUID UNIQUE,
    
    -- Numeración
    numero VARCHAR(20) NOT NULL,
    
    -- Cliente (opcional)
    customer_id UUID,
    customer_nombre VARCHAR(200),
    
    -- Totales (en CLP)
    subtotal INT NOT NULL DEFAULT 0,
    descuento INT NOT NULL DEFAULT 0,
    descuento_porcentaje DECIMAL(5,2),
    impuestos INT NOT NULL DEFAULT 0,
    total INT NOT NULL DEFAULT 0,
    
    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA', -- PENDIENTE, COMPLETADA, ANULADA
    
    -- Anulación
    anulada_at TIMESTAMP WITH TIME ZONE,
    anulada_por UUID,
    anulacion_motivo TEXT,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    UNIQUE(tenant_id, numero)
);

CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_sales_session ON sales(session_id);
CREATE INDEX idx_sales_command ON sales(command_id);
CREATE INDEX idx_sales_numero ON sales(tenant_id, numero);
CREATE INDEX idx_sales_fecha ON sales(tenant_id, created_at);
CREATE INDEX idx_sales_estado ON sales(tenant_id, estado);

-- =====================================================
-- SALE_ITEM (Línea de venta)
-- =====================================================
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    
    variant_id UUID NOT NULL,
    product_sku VARCHAR(50) NOT NULL,
    product_nombre VARCHAR(200) NOT NULL,
    
    cantidad DECIMAL(10,3) NOT NULL,
    precio_unitario INT NOT NULL,
    descuento INT NOT NULL DEFAULT 0,
    impuesto_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0,
    impuesto_monto INT NOT NULL DEFAULT 0,
    subtotal INT NOT NULL,
    total INT NOT NULL
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_variant ON sale_items(variant_id);

-- =====================================================
-- SALE_PAYMENT (Pago de venta)
-- =====================================================
CREATE TABLE sale_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    
    medio VARCHAR(30) NOT NULL, -- EFECTIVO, DEBITO, CREDITO, TRANSFERENCIA
    monto INT NOT NULL,
    referencia VARCHAR(100), -- número transacción, etc.
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sale_payments_sale ON sale_payments(sale_id);

-- =====================================================
-- OUTBOX (Eventos para integración)
-- =====================================================
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    aggregate_type VARCHAR(50) NOT NULL, -- Sale, CashSession
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- SaleCreated, SaleCancelled
    payload JSONB NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(aggregate_type, aggregate_id, event_type, created_at)
);

CREATE INDEX idx_outbox_pending ON outbox_events(processed_at) WHERE processed_at IS NULL;
