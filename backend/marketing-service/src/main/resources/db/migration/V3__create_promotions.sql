-- V3__create_promotions.sql
-- Promotions and Coupons tables

CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL,
    discount_value DECIMAL(15, 2),
    min_purchase DECIMAL(15, 2) DEFAULT 0,
    max_discount DECIMAL(15, 2),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    uses_per_customer INTEGER DEFAULT 1,
    target_segment VARCHAR(20),
    target_tier VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    stackable BOOLEAN DEFAULT FALSE,
    product_ids TEXT,
    category_ids TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promotions_tenant ON promotions(tenant_id);
CREATE INDEX idx_promotions_active ON promotions(tenant_id, active);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    qr_code TEXT,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    assigned_to UUID,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_promotion ON coupons(promotion_id);
CREATE INDEX idx_coupons_assigned ON coupons(assigned_to);
