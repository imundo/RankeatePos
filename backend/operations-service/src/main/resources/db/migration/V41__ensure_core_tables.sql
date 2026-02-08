-- Ensure critical tables exist (Recovering from V39 failure)
-- Includes tables from V39 since V39 is now deleted/ignored

CREATE TABLE IF NOT EXISTS automation_configs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL UNIQUE,
    whatsapp_config TEXT,
    email_config TEXT,
    mercado_pago_config TEXT,
    business_info TEXT,
    templates TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automation_configs_tenant_id ON automation_configs(tenant_id);

CREATE TABLE IF NOT EXISTS loyalty_customers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    puntos_actuales INTEGER DEFAULT 0,
    puntos_totales INTEGER DEFAULT 0,
    nivel VARCHAR(20) DEFAULT 'BRONCE',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_compra TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_customers_tenant_id ON loyalty_customers(tenant_id);
