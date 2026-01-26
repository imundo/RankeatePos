-- =====================================================
-- V30: Create Billing Schema
-- Invoices linked to Sales
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    sale_id UUID,
    folio INTEGER,
    type VARCHAR(50) NOT NULL, -- BOLETA, FACTURA
    emission_date TIMESTAMP NOT NULL,
    client_rut VARCHAR(20),
    client_name VARCHAR(200),
    client_address VARCHAR(255),
    client_giro VARCHAR(200),
    net_amount DECIMAL(19,2),
    tax_amount DECIMAL(19,2),
    total_amount DECIMAL(19,2),
    sii_track_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ISSUED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_sale FOREIGN KEY (sale_id) REFERENCES sales(id)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    product_name VARCHAR(200),
    unit_price DECIMAL(19,2),
    quantity INTEGER,
    total DECIMAL(19,2),
    CONSTRAINT fk_inv_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_folio ON invoices(folio);
