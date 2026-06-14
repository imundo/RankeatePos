-- V32__add_supplier_extended_fields.sql

ALTER TABLE suppliers
ADD COLUMN website VARCHAR(200),
ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN currency VARCHAR(3) DEFAULT 'CLP',
ADD COLUMN bank_account VARCHAR(100),
ADD COLUMN bank_name VARCHAR(100),
ADD COLUMN category VARCHAR(30) DEFAULT 'GENERAL',
ADD COLUMN delivery_type VARCHAR(30) DEFAULT 'DELIVERY',
ADD COLUMN avg_delivery_days INTEGER DEFAULT 3,
ADD COLUMN trust_rating DECIMAL(3,1) DEFAULT 3.0,
ADD COLUMN total_orders INTEGER DEFAULT 0,
ADD COLUMN on_time_deliveries INTEGER DEFAULT 0,
ADD COLUMN total_spent DECIMAL(18,2) DEFAULT 0.00,
ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';

-- Make status NOT NULL after setting the default for existing records
UPDATE suppliers SET status = 'ACTIVE' WHERE status IS NULL;
ALTER TABLE suppliers ALTER COLUMN status SET NOT NULL;

CREATE INDEX idx_supplier_category ON suppliers(category);
CREATE INDEX idx_supplier_rating ON suppliers(trust_rating);
