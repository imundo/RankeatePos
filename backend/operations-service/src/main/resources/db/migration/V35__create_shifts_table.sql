-- Shifts Management
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    type VARCHAR(30) DEFAULT 'CUSTOM',
    status VARCHAR(30) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shift_employee_time ON shifts(employee_id, start_time);
CREATE INDEX IF NOT EXISTS idx_shift_tenant_time ON shifts(tenant_id, start_time);
