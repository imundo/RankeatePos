-- V3__budget_cashflow_tables.sql

CREATE TABLE budget_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    fiscal_period_id UUID NOT NULL REFERENCES fiscal_periods(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    budgeted_amount DECIMAL(18,2) NOT NULL,
    actual_amount DECIMAL(18,2) DEFAULT 0,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_budget_tenant_period ON budget_lines(tenant_id, fiscal_period_id);
CREATE UNIQUE INDEX idx_budget_unique ON budget_lines(tenant_id, fiscal_period_id, account_id);

CREATE TABLE cash_flow_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    projection_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(30),
    description VARCHAR(200) NOT NULL,
    projected_amount DECIMAL(18,2) NOT NULL,
    actual_amount DECIMAL(18,2),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_frequency VARCHAR(20),
    reference_id UUID,
    reference_type VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'PROJECTED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cfp_tenant_date ON cash_flow_projections(tenant_id, projection_date);
CREATE INDEX idx_cfp_status ON cash_flow_projections(tenant_id, status);
