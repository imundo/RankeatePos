-- =====================================================
-- V26: Fix Password & Ghost Tenants
-- Description: 
-- 1. Update admin@eltrigal.cl password to 'demo1234' (hash used in V20)
-- 2. Delete the 'La Sazón del Dev (Ghost)' tenant if it exists
-- =====================================================

-- 1. Update password to demo1234 ($2a$10$5ljXdm1W4iDg/DTzKa35x.jbDFx/S7rWsTiDOqLsciitlq1vi8Ska)
UPDATE users 
SET password_hash = '$2a$10$5ljXdm1W4iDg/DTzKa35x.jbDFx/S7rWsTiDOqLsciitlq1vi8Ska'
WHERE LOWER(email) = 'admin@eltrigal.cl';

-- 2. Identify Ghost Tenant ID (if exists) and delete references
DO $$
DECLARE
    ghost_tenant_id UUID;
BEGIN
    SELECT id INTO ghost_tenant_id FROM tenants WHERE nombre_fantasia LIKE '%(Ghost)';
    
    IF ghost_tenant_id IS NOT NULL THEN
        -- Delete dependent data
        DELETE FROM user_branches WHERE branch_id IN (SELECT id FROM branches WHERE tenant_id = ghost_tenant_id);
        DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE tenant_id = ghost_tenant_id);
        DELETE FROM user_module_access WHERE user_id IN (SELECT id FROM users WHERE tenant_id = ghost_tenant_id);
        DELETE FROM branches WHERE tenant_id = ghost_tenant_id;
        DELETE FROM users WHERE tenant_id = ghost_tenant_id;
        DELETE FROM tenant_modules WHERE tenant_id = ghost_tenant_id;
        DELETE FROM tenants WHERE id = ghost_tenant_id;
    END IF;
END $$;
