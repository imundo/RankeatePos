-- =====================================================
-- V32: Extend HR Schema with Complete Module Tables
-- Employee config, leave management, public attendance
-- =====================================================

-- Add country_code to employees if not exists
ALTER TABLE employees ADD COLUMN IF NOT EXISTS country_code VARCHAR(3) DEFAULT 'CL';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nationality VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(30);

-- Employee Payroll Configuration
CREATE TABLE IF NOT EXISTS employee_payroll_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL UNIQUE,
    health_system VARCHAR(50) DEFAULT 'FONASA',
    isapre_name VARCHAR(100),
    health_rate DECIMAL(5, 2) DEFAULT 7.0,
    afp_name VARCHAR(100) DEFAULT 'Habitat',
    afp_rate DECIMAL(5, 2) DEFAULT 11.44,
    has_apv BOOLEAN DEFAULT FALSE,
    apv_monthly_amount DECIMAL(19, 2),
    has_lunch_allowance BOOLEAN DEFAULT FALSE,
    lunch_allowance_amount DECIMAL(19, 2),
    has_transport_allowance BOOLEAN DEFAULT FALSE,
    transport_allowance_amount DECIMAL(19, 2),
    gratification_type VARCHAR(50) DEFAULT 'LEGAL_MONTHLY',
    country_code VARCHAR(3) DEFAULT 'CL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_payroll_config_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Employee Bonuses
CREATE TABLE IF NOT EXISTS employee_bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(30) DEFAULT 'MONTHLY',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bonus_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Employee Deductions
CREATE TABLE IF NOT EXISTS employee_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    deduction_type VARCHAR(50) DEFAULT 'LOAN',
    remaining_installments INTEGER,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deduction_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    mime_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_document_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Employee History
CREATE TABLE IF NOT EXISTS employee_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    previous_value VARCHAR(255),
    new_value VARCHAR(255),
    created_by VARCHAR(100),
    CONSTRAINT fk_history_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Leave Balance (Vacation tracking)
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    year INTEGER NOT NULL,
    days_entitled INTEGER DEFAULT 15,
    days_accrued DECIMAL(5, 2) DEFAULT 0,
    days_taken DECIMAL(5, 2) DEFAULT 0,
    days_remaining DECIMAL(5, 2) DEFAULT 0,
    carryover_days DECIMAL(5, 2) DEFAULT 0,
    last_accrual_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(employee_id, year),
    CONSTRAINT fk_leave_balance_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Leave Requests (All types of requests)
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    start_date DATE,
    end_date DATE,
    days_requested DECIMAL(5, 2),
    amount_requested DECIMAL(19, 2),
    reason TEXT,
    rejected_reason TEXT,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_leave_request_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Generated Documents
CREATE TABLE IF NOT EXISTS generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID,
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    file_path VARCHAR(500),
    generated_by VARCHAR(100),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_by_email BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP
);

-- Public Attendance Links
CREATE TABLE IF NOT EXISTS public_attendance_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    clock_in_count INTEGER DEFAULT 0,
    clock_out_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Attendance Statistics (Monthly aggregates)
CREATE TABLE IF NOT EXISTS attendance_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_present_days INTEGER DEFAULT 0,
    total_absent_days INTEGER DEFAULT 0,
    total_late_count INTEGER DEFAULT 0,
    total_overtime_hours DECIMAL(10, 2) DEFAULT 0,
    avg_arrival_time TIME,
    avg_departure_time TIME,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, year, month),
    CONSTRAINT fk_stats_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_config_employee ON employee_payroll_configs(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_employee ON leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_public_link_token ON public_attendance_links(token);
CREATE INDEX IF NOT EXISTS idx_attendance_stats_employee ON attendance_statistics(employee_id, year, month);
