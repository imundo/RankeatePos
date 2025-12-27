-- V2__chilean_chart_of_accounts.sql
-- Plan de cuentas base para Chile

-- Esta migración inserta el plan de cuentas estándar chileno
-- Se ejecuta para cada tenant nuevo

-- Nota: Este archivo solo crea la estructura base.
-- Los tenants reciben su propio plan de cuentas al registrarse.

-- Plan de cuentas chileno simplificado (template)
-- Se copia a cada tenant cuando se registra

-- Función para crear plan de cuentas para un tenant
CREATE OR REPLACE FUNCTION create_chart_of_accounts_for_tenant(p_tenant_id UUID)
RETURNS void AS $$
DECLARE
    v_activo_id UUID;
    v_activo_corriente_id UUID;
    v_activo_fijo_id UUID;
    v_pasivo_id UUID;
    v_pasivo_corriente_id UUID;
    v_patrimonio_id UUID;
    v_ingresos_id UUID;
    v_costos_id UUID;
    v_gastos_id UUID;
BEGIN
    -- 1. ACTIVO
    INSERT INTO accounts (id, tenant_id, code, name, type, nature, level, is_system_account, allows_movements)
    VALUES (gen_random_uuid(), p_tenant_id, '1', 'ACTIVO', 'ASSET', 'DEBIT', 1, true, false)
    RETURNING id INTO v_activo_id;

    -- 1.1 Activo Corriente
    INSERT INTO accounts (id, tenant_id, code, name, type, nature, level, parent_id, is_system_account, allows_movements)
    VALUES (gen_random_uuid(), p_tenant_id, '1.1', 'Activo Corriente', 'ASSET', 'DEBIT', 2, v_activo_id, true, false)
    RETURNING id INTO v_activo_corriente_id;

    -- 1.1.1 Caja
    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '1.1.1', 'Caja', 'ASSET', 'DEBIT', 3, v_activo_corriente_id, true);

    -- 1.1.2 Bancos
    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '1.1.2', 'Bancos', 'ASSET', 'DEBIT', 3, v_activo_corriente_id, true);

    -- 1.1.3 Clientes (Cuentas por Cobrar)
    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '1.1.3', 'Clientes', 'ASSET', 'DEBIT', 3, v_activo_corriente_id, true);

    -- 1.1.4 Inventario
    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '1.1.4', 'Inventario', 'ASSET', 'DEBIT', 3, v_activo_corriente_id, true);

    -- 1.1.5 IVA Crédito Fiscal
    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '1.1.5', 'IVA Crédito Fiscal', 'ASSET', 'DEBIT', 3, v_activo_corriente_id, true);

    -- 1.2 Activo Fijo
    INSERT INTO accounts (id, tenant_id, code, name, type, nature, level, parent_id, is_system_account, allows_movements)
    VALUES (gen_random_uuid(), p_tenant_id, '1.2', 'Activo Fijo', 'ASSET', 'DEBIT', 2, v_activo_id, true, false)
    RETURNING id INTO v_activo_fijo_id;

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '1.2.1', 'Maquinaria y Equipos', 'ASSET', 'DEBIT', 3, v_activo_fijo_id, true);

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '1.2.2', 'Deprec. Acum. Maquinaria', 'ASSET', 'CREDIT', 3, v_activo_fijo_id, true);

    -- 2. PASIVO
    INSERT INTO accounts (id, tenant_id, code, name, type, nature, level, is_system_account, allows_movements)
    VALUES (gen_random_uuid(), p_tenant_id, '2', 'PASIVO', 'LIABILITY', 'CREDIT', 1, true, false)
    RETURNING id INTO v_pasivo_id;

    -- 2.1 Pasivo Corriente
    INSERT INTO accounts (id, tenant_id, code, name, type, nature, level, parent_id, is_system_account, allows_movements)
    VALUES (gen_random_uuid(), p_tenant_id, '2.1', 'Pasivo Corriente', 'LIABILITY', 'CREDIT', 2, v_pasivo_id, true, false)
    RETURNING id INTO v_pasivo_corriente_id;

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '2.1.1', 'Proveedores', 'LIABILITY', 'CREDIT', 3, v_pasivo_corriente_id, true);

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '2.1.2', 'IVA Débito Fiscal', 'LIABILITY', 'CREDIT', 3, v_pasivo_corriente_id, true);

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '2.1.3', 'Retenciones por Pagar', 'LIABILITY', 'CREDIT', 3, v_pasivo_corriente_id, true);

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '2.1.4', 'Sueldos por Pagar', 'LIABILITY', 'CREDIT', 3, v_pasivo_corriente_id, true);

    -- 3. PATRIMONIO
    INSERT INTO accounts (id, tenant_id, code, name, type, nature, level, is_system_account, allows_movements)
    VALUES (gen_random_uuid(), p_tenant_id, '3', 'PATRIMONIO', 'EQUITY', 'CREDIT', 1, true, false)
    RETURNING id INTO v_patrimonio_id;

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '3.1', 'Capital', 'EQUITY', 'CREDIT', 2, v_patrimonio_id, true);

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '3.2', 'Resultado del Ejercicio', 'EQUITY', 'CREDIT', 2, v_patrimonio_id, true);

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '3.3', 'Resultados Acumulados', 'EQUITY', 'CREDIT', 2, v_patrimonio_id, true);

    -- 4. INGRESOS
    INSERT INTO accounts (id, tenant_id, code, name, type, nature, level, is_system_account, allows_movements)
    VALUES (gen_random_uuid(), p_tenant_id, '4', 'INGRESOS', 'INCOME', 'CREDIT', 1, true, false)
    RETURNING id INTO v_ingresos_id;

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '4.1', 'Ingresos por Ventas', 'INCOME', 'CREDIT', 2, v_ingresos_id, true);

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '4.2', 'Otros Ingresos', 'INCOME', 'CREDIT', 2, v_ingresos_id, true);

    -- 5. COSTOS
    INSERT INTO accounts (id, tenant_id, code, name, type, nature, level, is_system_account, allows_movements)
    VALUES (gen_random_uuid(), p_tenant_id, '5', 'COSTOS', 'COST', 'DEBIT', 1, true, false)
    RETURNING id INTO v_costos_id;

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '5.1', 'Costo de Ventas', 'COST', 'DEBIT', 2, v_costos_id, true);

    -- 6. GASTOS
    INSERT INTO accounts (id, tenant_id, code, name, type, nature, level, is_system_account, allows_movements)
    VALUES (gen_random_uuid(), p_tenant_id, '6', 'GASTOS', 'EXPENSE', 'DEBIT', 1, true, false)
    RETURNING id INTO v_gastos_id;

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '6.1', 'Gastos de Administración', 'EXPENSE', 'DEBIT', 2, v_gastos_id, true);

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '6.2', 'Gastos de Ventas', 'EXPENSE', 'DEBIT', 2, v_gastos_id, true);

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '6.3', 'Gastos Financieros', 'EXPENSE', 'DEBIT', 2, v_gastos_id, true);

    INSERT INTO accounts (tenant_id, code, name, type, nature, level, parent_id, is_system_account)
    VALUES (p_tenant_id, '6.4', 'Remuneraciones', 'EXPENSE', 'DEBIT', 2, v_gastos_id, true);

END;
$$ LANGUAGE plpgsql;
