-- ============================================================
-- Operations Service - Initial Schema
-- Modules: Loyalty, KDS, Reservations, Subscriptions
-- ============================================================

-- ================== LOYALTY ==================

CREATE TABLE loyalty_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    puntos_actuales INTEGER DEFAULT 0,
    puntos_totales INTEGER DEFAULT 0,
    nivel VARCHAR(20) DEFAULT 'BRONCE',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_compra TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_loyalty_customers_tenant_email 
    ON loyalty_customers(tenant_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_loyalty_customers_tenant ON loyalty_customers(tenant_id);
CREATE INDEX idx_loyalty_customers_nivel ON loyalty_customers(tenant_id, nivel);

CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES loyalty_customers(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL, -- EARN, REDEEM, ADJUSTMENT
    puntos INTEGER NOT NULL,
    descripcion VARCHAR(200),
    venta_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_transactions_date ON loyalty_transactions(created_at);

CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    puntos_requeridos INTEGER NOT NULL,
    tipo VARCHAR(30) NOT NULL, -- DESCUENTO_PORCENTAJE, DESCUENTO_MONTO, PRODUCTO_GRATIS
    valor DECIMAL(10,2),
    producto_id UUID, -- If PRODUCTO_GRATIS
    max_canjes INTEGER, -- Limit per customer
    fecha_inicio DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rewards_tenant ON rewards(tenant_id);
CREATE INDEX idx_rewards_active ON rewards(tenant_id, activo);

CREATE TABLE reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID NOT NULL REFERENCES rewards(id),
    customer_id UUID NOT NULL REFERENCES loyalty_customers(id),
    puntos_usados INTEGER NOT NULL,
    venta_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reward_redemptions_customer ON reward_redemptions(customer_id);

-- ================== KDS (Kitchen Display System) ==================

CREATE TABLE kitchen_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    numero VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- LOCAL, DELIVERY, PICKUP
    mesa VARCHAR(10),
    cliente_nombre VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PREPARANDO, LISTO, ENTREGADO, CANCELADO
    prioridad VARCHAR(20) DEFAULT 'NORMAL', -- BAJA, NORMAL, ALTA, URGENTE
    notas TEXT,
    tiempo_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tiempo_inicio_preparacion TIMESTAMP,
    tiempo_completado TIMESTAMP,
    tiempo_entregado TIMESTAMP,
    venta_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kitchen_orders_tenant_branch ON kitchen_orders(tenant_id, branch_id);
CREATE INDEX idx_kitchen_orders_estado ON kitchen_orders(tenant_id, branch_id, estado);
CREATE INDEX idx_kitchen_orders_fecha ON kitchen_orders(tenant_id, tiempo_ingreso);

CREATE TABLE kitchen_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES kitchen_orders(id) ON DELETE CASCADE,
    producto_nombre VARCHAR(100) NOT NULL,
    producto_id UUID,
    cantidad INTEGER NOT NULL DEFAULT 1,
    modificadores TEXT, -- JSON array of modifiers
    notas TEXT,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PREPARANDO, LISTO
    completado_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kitchen_order_items_order ON kitchen_order_items(order_id);

-- ================== RESERVATIONS ==================

CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    numero VARCHAR(10) NOT NULL,
    capacidad INTEGER NOT NULL,
    ubicacion VARCHAR(50), -- interior, terraza, privado
    estado VARCHAR(20) DEFAULT 'DISPONIBLE', -- DISPONIBLE, OCUPADA, RESERVADA, NO_DISPONIBLE
    descripcion VARCHAR(200),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, branch_id, numero)
);

CREATE INDEX idx_tables_tenant_branch ON tables(tenant_id, branch_id);
CREATE INDEX idx_tables_estado ON tables(tenant_id, branch_id, estado);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_email VARCHAR(100),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    personas INTEGER NOT NULL,
    table_id UUID REFERENCES tables(id),
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, CONFIRMADA, EN_CURSO, COMPLETADA, CANCELADA, NO_SHOW
    notas TEXT,
    recordatorio_enviado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_tenant_fecha ON reservations(tenant_id, fecha);
CREATE INDEX idx_reservations_branch_fecha ON reservations(tenant_id, branch_id, fecha);
CREATE INDEX idx_reservations_estado ON reservations(tenant_id, estado);
CREATE INDEX idx_reservations_table ON reservations(table_id, fecha);

-- ================== SUBSCRIPTIONS ==================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    frecuencia VARCHAR(20) NOT NULL, -- DIARIA, SEMANAL, QUINCENAL, MENSUAL
    precio DECIMAL(10,2) NOT NULL,
    productos JSONB, -- Array of {productoId, cantidad, nombre}
    dias_entrega INTEGER[], -- Array of days (1=Monday, 7=Sunday) for weekly
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_plans_tenant ON subscription_plans(tenant_id);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(tenant_id, activo);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id),
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_email VARCHAR(100),
    direccion_entrega TEXT NOT NULL,
    comuna VARCHAR(50),
    notas_entrega TEXT,
    estado VARCHAR(20) DEFAULT 'ACTIVA', -- ACTIVA, PAUSADA, CANCELADA
    proxima_entrega DATE,
    fecha_inicio DATE NOT NULL,
    fecha_pausa DATE,
    fecha_cancelacion DATE,
    total_entregas INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_estado ON subscriptions(tenant_id, estado);
CREATE INDEX idx_subscriptions_proxima ON subscriptions(tenant_id, proxima_entrega);

CREATE TABLE subscription_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_programada TIME,
    hora_entrega TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, EN_RUTA, ENTREGADO, FALLIDO, REPROGRAMADO
    direccion TEXT,
    notas TEXT,
    repartidor_id UUID,
    venta_id UUID, -- Link to generated sale
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_deliveries_subscription ON subscription_deliveries(subscription_id);
CREATE INDEX idx_subscription_deliveries_fecha ON subscription_deliveries(fecha);
CREATE INDEX idx_subscription_deliveries_estado ON subscription_deliveries(fecha, estado);
