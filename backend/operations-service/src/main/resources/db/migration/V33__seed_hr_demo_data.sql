-- =====================================================
-- V33: Seed HR Demo Data for All Industries
-- Complete data for 7 demo tenants
-- =====================================================

-- ============================
-- TENANT IDs Reference:
-- a1000000-0000-0000-0000-000000000001 = Panadería El Trigal
-- a2000000-0000-0000-0000-000000000002 = Minimarket Don Pedro
-- a3000000-0000-0000-0000-000000000003 = Academia Pro
-- a4000000-0000-0000-0000-000000000004 = Editorial Creativa
-- a5000000-0000-0000-0000-000000000005 = Charcutería La Selecta
-- 11111111-1111-1111-1111-111111111111 = Barbería El Bigote
-- 22222222-2222-2222-2222-222222222222 = Centro Mente Sana
-- ============================

-- =============================================
-- 1. EMPLOYEES FOR ALL TENANTS (extending V31)
-- =============================================

-- Minimarket Don Pedro
INSERT INTO employees (id, tenant_id, first_name, last_name, rut, email, position, pin_code, base_salary, hire_date, country_code) VALUES 
('e2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Carlos', 'Mendoza', '17.890.123-4', 'carlos@donpedro.cl', 'Cajero Senior', '3456', 620000, '2022-03-15', 'CL'),
('e2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Patricia', 'Vidal', '18.901.234-5', 'patricia@donpedro.cl', 'Reponedora', '7890', 520000, '2023-02-01', 'CL'),
('e2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'Roberto', 'Fuentes', '19.012.345-6', 'roberto@donpedro.cl', 'Bodeguero', '1357', 580000, '2023-05-20', 'CL')
ON CONFLICT DO NOTHING;

-- Academia Pro
INSERT INTO employees (id, tenant_id, first_name, last_name, rut, email, position, pin_code, base_salary, hire_date, country_code) VALUES 
('e3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Valentina', 'Núñez', '20.123.456-7', 'valentina@aprende.cl', 'Coordinadora Cursos', '2468', 1100000, '2021-08-01', 'CL'),
('e3000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', 'Felipe', 'Contreras', '21.234.567-8', 'felipe@aprende.cl', 'Instructor Senior', '3579', 950000, '2022-01-15', 'CL'),
('e3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'Catalina', 'Morales', '22.345.678-9', 'catalina@aprende.cl', 'Ejecutiva Comercial', '4680', 800000, '2022-06-01', 'CL'),
('e3000000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000003', 'Diego', 'Paredes', '23.456.789-0', 'diego@aprende.cl', 'Soporte Técnico', '5791', 650000, '2023-03-10', 'CL')
ON CONFLICT DO NOTHING;

-- Editorial Creativa
INSERT INTO employees (id, tenant_id, first_name, last_name, rut, email, position, pin_code, base_salary, hire_date, country_code) VALUES 
('e4000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Roberto', 'Vega', '24.567.890-1', 'roberto@imprenta.cl', 'Gerente Producción', '6802', 1300000, '2020-05-15', 'CL'),
('e4000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', 'Francisca', 'Araya', '25.678.901-2', 'francisca@imprenta.cl', 'Operadora Prensa', '7913', 750000, '2021-09-01', 'CL'),
('e4000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000004', 'Andrés', 'Silva', '26.789.012-3', 'andres@imprenta.cl', 'Diseñador Gráfico', '8024', 880000, '2022-02-20', 'CL'),
('e4000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 'Lorena', 'Pinto', '27.890.123-4', 'lorena@imprenta.cl', 'Atención Cliente', '9135', 600000, '2023-01-10', 'CL')
ON CONFLICT DO NOTHING;

-- Charcutería La Selecta
INSERT INTO employees (id, tenant_id, first_name, last_name, rut, email, position, pin_code, base_salary, hire_date, country_code) VALUES 
('e5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Miguel', 'Bravo', '28.901.234-5', 'miguel@laselecta.cl', 'Maestro Fiambrero', '4321', 920000, '2021-03-01', 'CL'),
('e5000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000005', 'Claudia', 'Reyes', '29.012.345-6', 'claudia@laselecta.cl', 'Vendedora', '5432', 580000, '2022-07-15', 'CL'),
('e5000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000005', 'Jorge', 'Espinoza', '30.123.456-7', 'jorge@laselecta.cl', 'Ayudante Producción', '6543', 520000, '2023-02-01', 'CL')
ON CONFLICT DO NOTHING;

-- Barbería El Bigote
INSERT INTO employees (id, tenant_id, first_name, last_name, rut, email, position, pin_code, base_salary, hire_date, country_code) VALUES 
('e6000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Sebastián', 'Cortés', '31.234.567-8', 'sebastian@elbigote.cl', 'Barbero Principal', '1122', 850000, '2021-06-01', 'CL'),
('e6000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Matías', 'Herrera', '32.345.678-9', 'matias@elbigote.cl', 'Barbero', '3344', 700000, '2022-04-15', 'CL'),
('e6000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Camila', 'Vera', '33.456.789-0', 'camila@elbigote.cl', 'Recepcionista', '5566', 550000, '2023-01-20', 'CL')
ON CONFLICT DO NOTHING;

-- Centro Mente Sana
INSERT INTO employees (id, tenant_id, first_name, last_name, rut, email, position, pin_code, base_salary, hire_date, country_code) VALUES 
('e7000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Dra. Marcela', 'Gómez', '34.567.890-1', 'marcela@mentesana.cl', 'Directora Clínica', '7788', 2200000, '2019-01-01', 'CL'),
('e7000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Dr. Alejandro', 'Miranda', '35.678.901-2', 'alejandro@mentesana.cl', 'Psicólogo', '9900', 1600000, '2020-06-15', 'CL'),
('e7000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Paula', 'Saavedra', '36.789.012-3', 'paula@mentesana.cl', 'Secretaria Médica', '1100', 650000, '2021-03-01', 'CL'),
('e7000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Dra. Carla', 'Riquelme', '37.890.123-4', 'carla@mentesana.cl', 'Terapeuta', '2200', 1400000, '2022-01-10', 'CL')
ON CONFLICT DO NOTHING;

-- =============================================
-- 2. LEAVE BALANCES (Current Year)
-- =============================================

-- El Trigal
INSERT INTO leave_balances (employee_id, year, days_entitled, days_accrued, days_taken, days_remaining, last_accrual_date) VALUES 
('e1000000-0000-0000-0000-000000000001', 2026, 15, 15, 5, 10, CURRENT_DATE),
('e1000000-0000-0000-0000-000000000002', 2026, 15, 9, 2, 7, CURRENT_DATE),
('e1000000-0000-0000-0000-000000000003', 2026, 15, 6, 0, 6, CURRENT_DATE),
('e1000000-0000-0000-0000-000000000004', 2026, 15, 3, 0, 3, CURRENT_DATE),
('e1000000-0000-0000-0000-000000000005', 2026, 16, 16, 8, 8, CURRENT_DATE)
ON CONFLICT (employee_id, year) DO NOTHING;

-- Minimarket Don Pedro
INSERT INTO leave_balances (employee_id, year, days_entitled, days_accrued, days_taken, days_remaining, last_accrual_date) VALUES 
('e2000000-0000-0000-0000-000000000001', 2026, 16, 16, 3, 13, CURRENT_DATE),
('e2000000-0000-0000-0000-000000000002', 2026, 15, 12, 0, 12, CURRENT_DATE),
('e2000000-0000-0000-0000-000000000003', 2026, 15, 9, 2, 7, CURRENT_DATE)
ON CONFLICT (employee_id, year) DO NOTHING;

-- Academia Pro
INSERT INTO leave_balances (employee_id, year, days_entitled, days_accrued, days_taken, days_remaining, last_accrual_date) VALUES 
('e3000000-0000-0000-0000-000000000001', 2026, 16, 16, 10, 6, CURRENT_DATE),
('e3000000-0000-0000-0000-000000000002', 2026, 15, 15, 5, 10, CURRENT_DATE),
('e3000000-0000-0000-0000-000000000003', 2026, 15, 9, 0, 9, CURRENT_DATE),
('e3000000-0000-0000-0000-000000000004', 2026, 15, 6, 0, 6, CURRENT_DATE)
ON CONFLICT (employee_id, year) DO NOTHING;

-- Editorial Creativa
INSERT INTO leave_balances (employee_id, year, days_entitled, days_accrued, days_taken, days_remaining, last_accrual_date) VALUES 
('e4000000-0000-0000-0000-000000000001', 2026, 17, 17, 7, 10, CURRENT_DATE),
('e4000000-0000-0000-0000-000000000002', 2026, 15, 15, 3, 12, CURRENT_DATE),
('e4000000-0000-0000-0000-000000000003', 2026, 15, 12, 0, 12, CURRENT_DATE),
('e4000000-0000-0000-0000-000000000004', 2026, 15, 6, 0, 6, CURRENT_DATE)
ON CONFLICT (employee_id, year) DO NOTHING;

-- Charcutería La Selecta
INSERT INTO leave_balances (employee_id, year, days_entitled, days_accrued, days_taken, days_remaining, last_accrual_date) VALUES 
('e5000000-0000-0000-0000-000000000001', 2026, 16, 16, 4, 12, CURRENT_DATE),
('e5000000-0000-0000-0000-000000000002', 2026, 15, 9, 2, 7, CURRENT_DATE),
('e5000000-0000-0000-0000-000000000003', 2026, 15, 6, 0, 6, CURRENT_DATE)
ON CONFLICT (employee_id, year) DO NOTHING;

-- Barbería El Bigote
INSERT INTO leave_balances (employee_id, year, days_entitled, days_accrued, days_taken, days_remaining, last_accrual_date) VALUES 
('e6000000-0000-0000-0000-000000000001', 2026, 16, 16, 5, 11, CURRENT_DATE),
('e6000000-0000-0000-0000-000000000002', 2026, 15, 12, 0, 12, CURRENT_DATE),
('e6000000-0000-0000-0000-000000000003', 2026, 15, 6, 0, 6, CURRENT_DATE)
ON CONFLICT (employee_id, year) DO NOTHING;

-- Centro Mente Sana
INSERT INTO leave_balances (employee_id, year, days_entitled, days_accrued, days_taken, days_remaining, last_accrual_date) VALUES 
('e7000000-0000-0000-0000-000000000001', 2026, 18, 18, 10, 8, CURRENT_DATE),
('e7000000-0000-0000-0000-000000000002', 2026, 17, 17, 6, 11, CURRENT_DATE),
('e7000000-0000-0000-0000-000000000003', 2026, 15, 15, 3, 12, CURRENT_DATE),
('e7000000-0000-0000-0000-000000000004', 2026, 15, 12, 0, 12, CURRENT_DATE)
ON CONFLICT (employee_id, year) DO NOTHING;

-- =============================================
-- 3. LEAVE REQUESTS (Sample pending/approved)
-- =============================================

-- El Trigal - Pending vacation request
INSERT INTO leave_requests (tenant_id, employee_id, type, status, start_date, end_date, days_requested, reason, created_at) VALUES 
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 'VACATION', 'PENDING', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '20 days', 5, 'Vacaciones de verano', NOW() - INTERVAL '2 days'),
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 'ADMINISTRATIVE_DAY', 'PENDING', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 days', 1, 'Trámites bancarios', NOW() - INTERVAL '1 day');

-- Academia Pro - Approved vacation
INSERT INTO leave_requests (tenant_id, employee_id, type, status, start_date, end_date, days_requested, reason, approved_by, approved_at, created_at) VALUES 
('a3000000-0000-0000-0000-000000000003', 'e3000000-0000-0000-0000-000000000002', 'VACATION', 'APPROVED', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '40 days', 8, 'Viaje familiar', 'admin@aprende.cl', NOW() - INTERVAL '3 days', NOW() - INTERVAL '7 days');

-- Barbería - Salary advance pending
INSERT INTO leave_requests (tenant_id, employee_id, type, status, amount_requested, reason, created_at) VALUES 
('11111111-1111-1111-1111-111111111111', 'e6000000-0000-0000-0000-000000000002', 'SALARY_ADVANCE', 'PENDING', 350000, 'Emergencia familiar', NOW() - INTERVAL '1 day');

-- Centro Mente Sana - Approved medical leave
INSERT INTO leave_requests (tenant_id, employee_id, type, status, start_date, end_date, days_requested, reason, approved_by, approved_at, created_at) VALUES 
('22222222-2222-2222-2222-222222222222', 'e7000000-0000-0000-0000-000000000003', 'MEDICAL_LEAVE', 'APPROVED', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '2 days', 4, 'Licencia médica por gripe', 'admin@mentesana.cl', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days');

-- =============================================
-- 4. PAYROLL CONFIGS (Sample)
-- =============================================

-- El Trigal employees
INSERT INTO employee_payroll_configs (employee_id, health_system, afp_name, afp_rate, has_lunch_allowance, lunch_allowance_amount, country_code) VALUES 
('e1000000-0000-0000-0000-000000000001', 'FONASA', 'Habitat', 11.44, true, 50000, 'CL'),
('e1000000-0000-0000-0000-000000000002', 'FONASA', 'Provida', 11.45, true, 40000, 'CL'),
('e1000000-0000-0000-0000-000000000003', 'FONASA', 'Capital', 11.44, false, NULL, 'CL'),
('e1000000-0000-0000-0000-000000000004', 'FONASA', 'Modelo', 10.58, false, NULL, 'CL'),
('e1000000-0000-0000-0000-000000000005', 'ISAPRE', 'Consalud', 11.44, true, 60000, 'CL')
ON CONFLICT (employee_id) DO NOTHING;

-- Centro Mente Sana (Higher salaries)
INSERT INTO employee_payroll_configs (employee_id, health_system, isapre_name, afp_name, afp_rate, has_apv, apv_monthly_amount, country_code) VALUES 
('e7000000-0000-0000-0000-000000000001', 'ISAPRE', 'Banmedica', 'Cuprum', 11.48, true, 200000, 'CL'),
('e7000000-0000-0000-0000-000000000002', 'ISAPRE', 'Colmena', 'Habitat', 11.44, true, 150000, 'CL'),
('e7000000-0000-0000-0000-000000000003', 'FONASA', NULL, 'Provida', 11.45, false, NULL, 'CL'),
('e7000000-0000-0000-0000-000000000004', 'ISAPRE', 'Cruz Blanca', 'Cuprum', 11.48, false, NULL, 'CL')
ON CONFLICT (employee_id) DO NOTHING;

-- =============================================
-- 5. PUBLIC ATTENDANCE LINKS
-- =============================================

INSERT INTO public_attendance_links (id, tenant_id, name, token, active, clock_in_count, clock_out_count) VALUES 
('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'El Trigal - Entrada Principal', 'eltrigal-entrada-2026', true, 245, 230),
('f2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Don Pedro - Local Ñuñoa', 'donpedro-nunoa-2026', true, 180, 175),
('f3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'Academia - Oficina Central', 'academia-central-2026', true, 320, 315),
('f4000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 'Editorial - Taller', 'editorial-taller-2026', true, 210, 205),
('f5000000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000005', 'La Selecta - Local', 'laselecta-entrada-2026', true, 150, 145),
('f6000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'El Bigote - Salón', 'elbigote-salon-2026', true, 190, 185),
('f7000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'Mente Sana - Clínica', 'mentesana-clinica-2026', true, 280, 275)
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. EMPLOYEE HISTORY (Sample events)
-- =============================================

INSERT INTO employee_histories (employee_id, event_type, event_date, description, created_by) VALUES 
('e1000000-0000-0000-0000-000000000001', 'HIRED', '2023-01-15', 'Contratación inicial como Panadero Jefe', 'admin@eltrigal.cl'),
('e1000000-0000-0000-0000-000000000005', 'SALARY_CHANGE', '2024-03-01', 'Aumento de sueldo por desempeño', 'admin@eltrigal.cl'),
('e7000000-0000-0000-0000-000000000001', 'HIRED', '2019-01-01', 'Contratación como Directora Clínica', 'sistema'),
('e7000000-0000-0000-0000-000000000002', 'PROMOTED', '2023-06-01', 'Ascenso a Psicólogo Senior', 'admin@mentesana.cl'),
('e3000000-0000-0000-0000-000000000001', 'HIRED', '2021-08-01', 'Contratación inicial', 'admin@aprende.cl'),
('e6000000-0000-0000-0000-000000000001', 'HIRED', '2021-06-01', 'Fundador de la barbería', 'admin@elbigote.cl');

-- =============================================
-- 7. ATTENDANCE RECENT RECORDS (Sample)
-- =============================================

-- El Trigal additional attendance
INSERT INTO attendance_records (tenant_id, employee_id, clock_in_time, clock_out_time, check_in_method, status) VALUES
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 day' + INTERVAL '7 hours 30 minutes', NOW() - INTERVAL '1 day' + INTERVAL '16 hours', 'PIN', 'COMPLETED'),
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 day' + INTERVAL '8 hours', NOW() - INTERVAL '1 day' + INTERVAL '17 hours 30 minutes', 'PIN', 'COMPLETED'),
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000005', NOW() - INTERVAL '1 day' + INTERVAL '7 hours', NOW() - INTERVAL '1 day' + INTERVAL '18 hours', 'PIN', 'COMPLETED');

-- Academia Pro - Today
INSERT INTO attendance_records (tenant_id, employee_id, clock_in_time, clock_out_time, check_in_method, status) VALUES
('a3000000-0000-0000-0000-000000000003', 'e3000000-0000-0000-0000-000000000001', NOW() - INTERVAL '0 day' + INTERVAL '8 hours 30 minutes', NULL, 'PIN', 'PRESENT'),
('a3000000-0000-0000-0000-000000000003', 'e3000000-0000-0000-0000-000000000002', NOW() - INTERVAL '0 day' + INTERVAL '9 hours', NULL, 'QR', 'PRESENT'),
('a3000000-0000-0000-0000-000000000003', 'e3000000-0000-0000-0000-000000000003', NOW() - INTERVAL '0 day' + INTERVAL '9 hours 15 minutes', NULL, 'PIN', 'LATE');

-- Barbería - Today
INSERT INTO attendance_records (tenant_id, employee_id, clock_in_time, clock_out_time, check_in_method, status) VALUES
('11111111-1111-1111-1111-111111111111', 'e6000000-0000-0000-0000-000000000001', NOW() - INTERVAL '0 day' + INTERVAL '10 hours', NULL, 'PIN', 'PRESENT'),
('11111111-1111-1111-1111-111111111111', 'e6000000-0000-0000-0000-000000000002', NOW() - INTERVAL '0 day' + INTERVAL '10 hours 5 minutes', NULL, 'PIN', 'PRESENT');

-- Centro Mente Sana - Today
INSERT INTO attendance_records (tenant_id, employee_id, clock_in_time, clock_out_time, check_in_method, status) VALUES
('22222222-2222-2222-2222-222222222222', 'e7000000-0000-0000-0000-000000000001', NOW() - INTERVAL '0 day' + INTERVAL '8 hours', NULL, 'PIN', 'PRESENT'),
('22222222-2222-2222-2222-222222222222', 'e7000000-0000-0000-0000-000000000002', NOW() - INTERVAL '0 day' + INTERVAL '9 hours', NULL, 'PIN', 'PRESENT'),
('22222222-2222-2222-2222-222222222222', 'e7000000-0000-0000-0000-000000000004', NOW() - INTERVAL '0 day' + INTERVAL '14 hours', NULL, 'PIN', 'PRESENT');
