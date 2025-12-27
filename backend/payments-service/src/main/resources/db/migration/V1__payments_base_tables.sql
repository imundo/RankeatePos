-- V1__payments_base_tables.sql

CREATE TABLE receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID,
    customer_id UUID,
    customer_name VARCHAR(200),
    customer_rut VARCHAR(20),
    document_type VARCHAR(20),
    document_id UUID,
    document_number VARCHAR(50),
    document_date DATE,
    due_date DATE NOT NULL,
    original_amount DECIMAL(18,2) NOT NULL,
    paid_amount DECIMAL(18,2) DEFAULT 0,
    balance DECIMAL(18,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    days_overdue INTEGER DEFAULT 0,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_receivable_tenant ON receivables(tenant_id);
CREATE INDEX idx_receivable_customer ON receivables(customer_id);
CREATE INDEX idx_receivable_due_date ON receivables(due_date);
CREATE INDEX idx_receivable_status ON receivables(status);

CREATE TABLE payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID,
    supplier_id UUID,
    supplier_name VARCHAR(200),
    supplier_rut VARCHAR(20),
    document_type VARCHAR(20),
    document_id UUID,
    document_number VARCHAR(50),
    document_date DATE,
    due_date DATE NOT NULL,
    original_amount DECIMAL(18,2) NOT NULL,
    paid_amount DECIMAL(18,2) DEFAULT 0,
    balance DECIMAL(18,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    days_overdue INTEGER DEFAULT 0,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_payable_tenant ON payables(tenant_id);
CREATE INDEX idx_payable_supplier ON payables(supplier_id);
CREATE INDEX idx_payable_due_date ON payables(due_date);
CREATE INDEX idx_payable_status ON payables(status);

CREATE TABLE payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    receipt_number BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    receivable_id UUID REFERENCES receivables(id),
    customer_id UUID,
    customer_name VARCHAR(200),
    amount DECIMAL(18,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    reference_number VARCHAR(100),
    bank_account_id UUID,
    notes VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipt_tenant ON payment_receipts(tenant_id);
CREATE INDEX idx_receipt_date ON payment_receipts(payment_date);
CREATE INDEX idx_receipt_number ON payment_receipts(receipt_number);

CREATE TABLE payment_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    voucher_number BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    payable_id UUID REFERENCES payables(id),
    supplier_id UUID,
    supplier_name VARCHAR(200),
    amount DECIMAL(18,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    reference_number VARCHAR(100),
    bank_account_id UUID,
    notes VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voucher_tenant ON payment_vouchers(tenant_id);
CREATE INDEX idx_voucher_date ON payment_vouchers(payment_date);
CREATE INDEX idx_voucher_number ON payment_vouchers(voucher_number);

CREATE TABLE collection_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    receivable_id UUID NOT NULL REFERENCES receivables(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    sent_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    contact_info VARCHAR(200),
    message TEXT,
    response_notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminder_receivable ON collection_reminders(receivable_id);
CREATE INDEX idx_reminder_scheduled ON collection_reminders(scheduled_date);
