-- Calculate Payroll Tables

-- 1. Payroll Runs (Lotes de proceso de sueldos)
CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    name VARCHAR(100), -- e.g. "Sueldos Enero 2026"
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PROCESSED, APPROVED, PAID
    total_employees INTEGER DEFAULT 0,
    total_amount DECIMAL(19, 2) DEFAULT 0,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Payrolls (Liquidaciones individuales, la entidad Java ya existía pero la tabla no)
CREATE TABLE IF NOT EXISTS payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    payroll_run_id UUID REFERENCES payroll_runs(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Totales Cabecera
    base_salary DECIMAL(19, 2) DEFAULT 0,
    taxable_income DECIMAL(19, 2) DEFAULT 0, -- Sueldo Imponible
    total_bonuses DECIMAL(19, 2) DEFAULT 0,
    total_discounts DECIMAL(19, 2) DEFAULT 0,
    total_paid DECIMAL(19, 2) DEFAULT 0, -- Líquido a Pagar
    
    status VARCHAR(50) DEFAULT 'DRAFT',
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- 3. Payroll Details (Desglose línea a línea: AFP, Salud, Bono, etc.)
CREATE TABLE IF NOT EXISTS payroll_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES payrolls(id),
    
    concept_code VARCHAR(50) NOT NULL, -- e.g. 'BASE_SALARY', 'AFP_HABITAT', 'HEALTH_FONASA'
    concept_name VARCHAR(100) NOT NULL,
    concept_type VARCHAR(20) NOT NULL, -- 'INCOME', 'DEDUCTION', 'INFORMATION'
    
    amount DECIMAL(19, 2) DEFAULT 0,
    rate DECIMAL(5, 4), -- Porcentaje aplicado si aplica
    
    sort_order INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_run_tenant ON payroll_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payrolls(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_run_id ON payrolls(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_detail_payroll ON payroll_details(payroll_id);
