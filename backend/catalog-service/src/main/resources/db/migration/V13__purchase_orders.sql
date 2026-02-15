CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    order_number BIGINT NOT NULL,
    supplier_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL, -- DRAFT, SENT, RECEIVED, CANCELLED
    expected_delivery_date TIMESTAMP,
    total_amount INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE INDEX idx_po_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY,
    purchase_order_id UUID NOT NULL,
    product_variant_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    CONSTRAINT fk_poi_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    CONSTRAINT fk_poi_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

CREATE INDEX idx_poi_order ON purchase_order_items(purchase_order_id);
