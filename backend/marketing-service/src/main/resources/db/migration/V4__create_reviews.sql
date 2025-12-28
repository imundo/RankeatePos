-- V4__create_reviews.sql
-- Reviews and Feedback table

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    sale_id UUID,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    response TEXT,
    responded_at TIMESTAMP,
    responded_by UUID,
    status VARCHAR(20) DEFAULT 'PENDING',
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_tenant ON reviews(tenant_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_status ON reviews(tenant_id, status);
CREATE INDEX idx_reviews_rating ON reviews(tenant_id, rating);
