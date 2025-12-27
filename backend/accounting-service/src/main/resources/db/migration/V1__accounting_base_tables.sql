-- V1__accounting_base_tables.sql
-- Flyway migration for accounting-service base tables

-- Tabla de cuentas contables (Plan de Cuentas)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    type VARCHAR(20) NOT NULL,
    nature VARCHAR(20) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    parent_id UUID REFERENCES accounts(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    allows_movements BOOLEAN NOT NULL DEFAULT true,
    is_system_account BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uk_accounts_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_account_tenant_code ON accounts(tenant_id, code);
CREATE INDEX idx_account_parent ON accounts(parent_id);

-- Tabla de períodos fiscales
CREATE TABLE fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    closed_at TIMESTAMP,
    closed_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fiscal_period_tenant ON fiscal_periods(tenant_id);
CREATE INDEX idx_fiscal_period_dates ON fiscal_periods(start_date, end_date);

-- Tabla de asientos contables (Libro Diario)
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID,
    entry_number BIGINT NOT NULL,
    entry_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL,
    description VARCHAR(500) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    reference_number VARCHAR(50),
    total_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    posted_at TIMESTAMP,
    posted_by UUID,
    reversed_by UUID,
    is_automatic BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_journal_tenant_date ON journal_entries(tenant_id, entry_date);
CREATE INDEX idx_journal_number ON journal_entries(tenant_id, entry_number);
CREATE INDEX idx_journal_reference ON journal_entries(tenant_id, reference_type, reference_id);

-- Tabla de líneas de asientos
CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    description VARCHAR(300),
    cost_center_id UUID,
    line_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_journal_line_account ON journal_lines(account_id);
CREATE INDEX idx_journal_line_entry ON journal_lines(journal_entry_id);

-- Tabla de cuentas bancarias
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CLP',
    alias VARCHAR(200),
    linked_account_id UUID REFERENCES accounts(id),
    current_balance DECIMAL(18,2) DEFAULT 0,
    last_reconciled_balance DECIMAL(18,2),
    last_reconciled_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_bank_account_tenant ON bank_accounts(tenant_id);
CREATE INDEX idx_bank_account_number ON bank_accounts(account_number);

-- Tabla de transacciones bancarias (cartola)
CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    value_date DATE,
    description VARCHAR(500) NOT NULL,
    reference_number VARCHAR(50),
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    running_balance DECIMAL(18,2),
    transaction_type VARCHAR(30),
    reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reconciled_journal_line_id UUID REFERENCES journal_lines(id),
    reconciled_at TIMESTAMP,
    reconciled_by UUID,
    import_batch_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_tx_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_tx_date ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_tx_status ON bank_transactions(reconciliation_status);
