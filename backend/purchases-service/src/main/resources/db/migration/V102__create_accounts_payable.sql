-- V102__create_accounts_payable.sql

CREATE TABLE IF NOT EXISTS accounts_payable (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    purchase_order_id UUID,
    document_number VARCHAR(100),
    document_type VARCHAR(50),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT fk_ap_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_ap_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
);

CREATE INDEX IF NOT EXISTS idx_ap_tenant ON accounts_payable(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ap_supplier ON accounts_payable(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ap_po ON accounts_payable(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_ap_status ON accounts_payable(status);
