-- Restore missing tables from V1 that were likely skipped
-- Using IF NOT EXISTS to prevent errors if they already exist

-- ================== LOYALTY (Remaining) ==================

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- EARN, REDEEM, ADJUSTMENT
    puntos INTEGER NOT NULL,
    descripcion VARCHAR(200),
    venta_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_date ON loyalty_transactions(created_at);

CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    puntos_requeridos INTEGER NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    valor DECIMAL(10,2),
    producto_id UUID,
    max_canjes INTEGER,
    fecha_inicio DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rewards_tenant ON rewards(tenant_id);

CREATE TABLE IF NOT EXISTS reward_redemptions (
    id UUID PRIMARY KEY,
    reward_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    puntos_usados INTEGER NOT NULL,
    venta_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_customer ON reward_redemptions(customer_id);

-- ================== TABLES (Restaurant Tables) ==================
-- Note: Entity RestaurantTable maps to "tables"

CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    numero VARCHAR(10) NOT NULL,
    capacidad INTEGER NOT NULL,
    ubicacion VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'DISPONIBLE',
    descripcion VARCHAR(200),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, branch_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_tables_tenant_branch ON tables(tenant_id, branch_id);

-- ================== KDS (Kitchen) ==================

CREATE TABLE IF NOT EXISTS kitchen_orders (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    numero VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    mesa VARCHAR(10),
    cliente_nombre VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    prioridad VARCHAR(20) DEFAULT 'NORMAL',
    notas TEXT,
    tiempo_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tiempo_inicio_preparacion TIMESTAMP,
    tiempo_completado TIMESTAMP,
    tiempo_entregado TIMESTAMP,
    venta_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kitchen_orders_tenant_branch ON kitchen_orders(tenant_id, branch_id);

CREATE TABLE IF NOT EXISTS kitchen_order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    producto_nombre VARCHAR(100) NOT NULL,
    producto_id UUID,
    cantidad INTEGER NOT NULL DEFAULT 1,
    modificadores TEXT,
    notas TEXT,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    completado_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kitchen_order_items_order ON kitchen_order_items(order_id);

-- ================== SUBSCRIPTIONS ==================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    frecuencia VARCHAR(20) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    productos TEXT, -- JSON structure
    dias_entrega INTEGER[], -- Array support depends on DB, using standard types? TEXT if arrays not supported? Postgres supports INT[]
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_tenant ON subscription_plans(tenant_id);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan_id UUID,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_email VARCHAR(100),
    direccion_entrega TEXT NOT NULL,
    comuna VARCHAR(50),
    notas_entrega TEXT,
    estado VARCHAR(20) DEFAULT 'ACTIVA',
    proxima_entrega DATE,
    fecha_inicio DATE NOT NULL,
    fecha_pausa DATE,
    fecha_cancelacion DATE,
    total_entregas INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);

CREATE TABLE IF NOT EXISTS subscription_deliveries (
    id UUID PRIMARY KEY,
    subscription_id UUID NOT NULL,
    fecha DATE NOT NULL,
    hora_programada TIME,
    hora_entrega TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    direccion TEXT,
    notas TEXT,
    repartidor_id UUID,
    venta_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_subscription ON subscription_deliveries(subscription_id);
