-- V1__create_customers.sql
-- Customer CRM tables

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    document_number VARCHAR(20),
    address TEXT,
    segment VARCHAR(20) DEFAULT 'NEW',
    clv DECIMAL(15, 2) DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    total_spent DECIMAL(15, 2) DEFAULT 0,
    average_ticket DECIMAL(15, 2) DEFAULT 0,
    last_purchase_date DATE,
    first_purchase_date DATE,
    birth_date DATE,
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier VARCHAR(20) DEFAULT 'BRONZE',
    score INTEGER DEFAULT 0,
    email_opt_in BOOLEAN DEFAULT TRUE,
    sms_opt_in BOOLEAN DEFAULT TRUE,
    whatsapp_opt_in BOOLEAN DEFAULT TRUE,
    notes TEXT,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_customer_email_tenant UNIQUE (email, tenant_id)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_segment ON customers(tenant_id, segment);
CREATE INDEX idx_customers_loyalty_tier ON customers(tenant_id, loyalty_tier);
CREATE INDEX idx_customers_email ON customers(email);

CREATE TABLE customer_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_tags_customer ON customer_tags(customer_id);

CREATE TABLE customer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reference_id VARCHAR(100),
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX idx_customer_interactions_type ON customer_interactions(customer_id, type);
