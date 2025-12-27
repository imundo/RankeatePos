-- V1__purchases_base_tables.sql

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    rut VARCHAR(20) NOT NULL,
    business_name VARCHAR(200) NOT NULL,
    fantasy_name VARCHAR(200),
    giro VARCHAR(100),
    address VARCHAR(300),
    city VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    contact_name VARCHAR(100),
    payment_terms INTEGER DEFAULT 30,
    notes VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_supplier_tenant ON suppliers(tenant_id);
CREATE INDEX idx_supplier_rut ON suppliers(rut);
CREATE UNIQUE INDEX idx_supplier_tenant_rut ON suppliers(tenant_id, rut);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID,
    order_number BIGINT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    subtotal DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes VARCHAR(500),
    approved_at TIMESTAMP,
    approved_by UUID,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_po_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_number ON purchase_orders(order_number);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID,
    product_sku VARCHAR(50),
    product_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(18,4) NOT NULL,
    unit VARCHAR(20) DEFAULT 'UN',
    unit_price DECIMAL(18,2) NOT NULL,
    subtotal DECIMAL(18,2),
    quantity_received DECIMAL(18,4) DEFAULT 0,
    line_order INTEGER DEFAULT 0
);

CREATE INDEX idx_poi_po ON purchase_order_items(purchase_order_id);

CREATE TABLE goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    receipt_number BIGINT NOT NULL,
    purchase_order_id UUID REFERENCES purchase_orders(id),
    supplier_id UUID,
    supplier_name VARCHAR(200),
    receipt_date DATE NOT NULL,
    supplier_invoice_number VARCHAR(50),
    total DECIMAL(18,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes VARCHAR(500),
    received_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gr_tenant ON goods_receipts(tenant_id);
CREATE INDEX idx_gr_po ON goods_receipts(purchase_order_id);

CREATE TABLE goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    product_id UUID,
    product_sku VARCHAR(50),
    product_name VARCHAR(200) NOT NULL,
    quantity_expected DECIMAL(18,4),
    quantity_received DECIMAL(18,4) NOT NULL,
    unit_cost DECIMAL(18,2),
    warehouse_location VARCHAR(50),
    notes VARCHAR(200)
);

CREATE INDEX idx_gri_gr ON goods_receipt_items(goods_receipt_id);
