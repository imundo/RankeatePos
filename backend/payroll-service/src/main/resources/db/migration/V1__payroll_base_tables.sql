-- V1__payroll_base_tables.sql

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    rut VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50),
    address VARCHAR(300),
    birth_date DATE,
    hire_date DATE NOT NULL,
    termination_date DATE,
    contract_type VARCHAR(30),
    position VARCHAR(100),
    department VARCHAR(100),
    base_salary DECIMAL(18,2),
    afp_code VARCHAR(10),
    health_insurance_code VARCHAR(10),
    health_plan_uf DECIMAL(10,4),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_employee_tenant ON employees(tenant_id);
CREATE INDEX idx_employee_rut ON employees(rut);
CREATE UNIQUE INDEX idx_employee_tenant_rut ON employees(tenant_id, rut);

CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    payment_date DATE,
    total_gross DECIMAL(18,2) DEFAULT 0,
    total_deductions DECIMAL(18,2) DEFAULT 0,
    total_net DECIMAL(18,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    closed_at TIMESTAMP,
    closed_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payroll_tenant ON payroll_periods(tenant_id);
CREATE INDEX idx_payroll_period ON payroll_periods(period_year, period_month);
CREATE UNIQUE INDEX idx_payroll_unique ON payroll_periods(tenant_id, period_year, period_month);

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    days_worked INTEGER DEFAULT 30,
    base_salary DECIMAL(18,2),
    overtime_amount DECIMAL(18,2) DEFAULT 0,
    bonus_amount DECIMAL(18,2) DEFAULT 0,
    commission_amount DECIMAL(18,2) DEFAULT 0,
    other_income DECIMAL(18,2) DEFAULT 0,
    gross_salary DECIMAL(18,2),
    afp_amount DECIMAL(18,2) DEFAULT 0,
    health_amount DECIMAL(18,2) DEFAULT 0,
    unemployment_amount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    other_deductions DECIMAL(18,2) DEFAULT 0,
    total_deductions DECIMAL(18,2),
    net_salary DECIMAL(18,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payslip_period ON payslips(payroll_period_id);
CREATE INDEX idx_payslip_employee ON payslips(employee_id);
CREATE UNIQUE INDEX idx_payslip_unique ON payslips(payroll_period_id, employee_id);
