-- =====================================================
-- V31: Seed HR Data
-- Demo data for El Trigal
-- =====================================================

-- 0. Ensure all required columns exist and have proper defaults
-- First add columns if they don't exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10);

-- Set defaults for existing columns (is_active is the actual column name in Railway)
ALTER TABLE employees ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE employees ALTER COLUMN is_active SET DEFAULT true;

-- Update any existing NULL values before inserting new data
UPDATE employees SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE employees SET is_active = true WHERE is_active IS NULL;

-- 1. Employees (using is_active which is the actual column name in Railway)
INSERT INTO employees (id, tenant_id, first_name, last_name, rut, email, position, pin_code, base_salary, hire_date, is_active, created_at) VALUES 
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Juan', 'Pérez', '12.345.678-9', 'juan@eltrigal.cl', 'Panadero Jefe', '1234', 850000, '2023-01-15', true, CURRENT_TIMESTAMP),
('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Maria', 'Soto', '13.456.789-0', 'maria@eltrigal.cl', 'Cajera', '5678', 550000, '2023-06-01', true, CURRENT_TIMESTAMP),
('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Pedro', 'Lagos', '14.567.890-1', 'pedro@eltrigal.cl', 'Repartidor', '9090', 500000, '2023-08-10', true, CURRENT_TIMESTAMP),
('e1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Ana', 'Rojas', '15.678.901-2', 'ana@eltrigal.cl', 'Ayudante Cocina', '1111', 480000, '2023-11-20', true, CURRENT_TIMESTAMP),
('e1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Luis', 'Toro', '16.789.012-3', 'luis@eltrigal.cl', 'Supervisor', '2222', 950000, '2022-05-05', true, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- 2. Attendance (Last 3 days)
INSERT INTO attendance_records (tenant_id, employee_id, clock_in_time, clock_out_time, check_in_method, status) VALUES
-- Juan (Presente ayer y hoy)
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day' + INTERVAL '8 hours', NOW() - INTERVAL '1 day' + INTERVAL '17 hours', 'PIN', 'COMPLETED'),
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '0 day' + INTERVAL '8 hours', NULL, 'PIN', 'PRESENT'),

-- Maria (Llegó tarde hoy)
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day' + INTERVAL '9 hours', NOW() - INTERVAL '1 day' + INTERVAL '18 hours', 'QR', 'COMPLETED'),
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '0 day' + INTERVAL '9 hours 15 minutes', NULL, 'QR', 'LATE');
