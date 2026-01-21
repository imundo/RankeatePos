-- =====================================================
-- V15: Create Plans Table
-- Membership/Subscription plans with module bundles
-- =====================================================

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'CLP',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    included_modules JSONB DEFAULT '[]'::jsonb,
    max_users INTEGER DEFAULT 5,
    max_branches INTEGER DEFAULT 1,
    max_products INTEGER DEFAULT 500,
    features JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Seed default plans
INSERT INTO plans (code, name, description, price, included_modules, max_users, max_branches, max_products, sort_order) VALUES
(
    'FREE',
    'Plan Gratis',
    'Ideal para probar la plataforma',
    0,
    '["pos", "products"]'::jsonb,
    2,
    1,
    100,
    1
),
(
    'STARTER',
    'Plan Starter',
    'Para pequeños negocios que inician',
    19990,
    '["pos", "products", "inventory", "customers"]'::jsonb,
    3,
    1,
    500,
    2
),
(
    'PRO',
    'Plan Pro',
    'Gestión completa para negocios en crecimiento',
    39990,
    '["pos", "products", "inventory", "customers", "reservations", "marketing", "reports"]'::jsonb,
    10,
    3,
    2000,
    3
),
(
    'BUSINESS',
    'Plan Business',
    'Potencia total para empresas establecidas',
    79990,
    '["pos", "products", "inventory", "customers", "reservations", "marketing", "reports", "users", "billing"]'::jsonb,
    25,
    10,
    10000,
    4
),
(
    'ENTERPRISE',
    'Plan Enterprise',
    'Solución personalizada para grandes cadenas',
    0,
    '["pos", "products", "inventory", "customers", "reservations", "marketing", "reports", "users", "billing", "settings", "integrations"]'::jsonb,
    999,
    100,
    999999,
    5
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    included_modules = EXCLUDED.included_modules,
    max_users = EXCLUDED.max_users,
    max_branches = EXCLUDED.max_branches,
    max_products = EXCLUDED.max_products;

CREATE INDEX idx_plans_code ON plans(code);
CREATE INDEX idx_plans_active ON plans(active);
