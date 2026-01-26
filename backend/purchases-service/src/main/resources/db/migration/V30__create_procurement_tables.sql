-- =====================================================
-- V30: Create Procurement Schema
-- Requests, Receptions
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    requested_by UUID NOT NULL,
    generated_purchase_order_id UUID,
    status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL,
    product_id UUID,
    product_name VARCHAR(200),
    quantity INTEGER,
    CONSTRAINT fk_req_item_request FOREIGN KEY (request_id) REFERENCES purchase_requests(id)
);

CREATE TABLE IF NOT EXISTS receptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    purchase_order_id UUID NOT NULL,
    received_by UUID NOT NULL,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    document_number VARCHAR(100),
    comments TEXT,
    CONSTRAINT fk_reception_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
);

CREATE TABLE IF NOT EXISTS reception_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reception_id UUID NOT NULL,
    product_id UUID,
    quantity_received INTEGER,
    quantity_rejected INTEGER DEFAULT 0,
    rejection_reason VARCHAR(255),
    CONSTRAINT fk_rec_item_reception FOREIGN KEY (reception_id) REFERENCES receptions(id)
);
