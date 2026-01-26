-- =====================================================
-- V23: Emergency Fix - Force Delete Conflicts
-- Description: Delete any user claiming to be admin@eltrigal.cl 
-- that is NOT in the official tenant.
-- =====================================================

-- 1. Delete impostors directly. No renaming.
DELETE FROM users 
WHERE LOWER(TRIM(email)) = 'admin@eltrigal.cl'
AND tenant_id != 'a1000000-0000-0000-0000-000000000001';

-- 2. Ensure official user is clean and active
UPDATE users
SET 
  activo = true,
  deleted_at = NULL,
  email_verificado = true
WHERE id = 'c1000000-0000-0000-0000-000000000001';

-- 3. Update Official Tenant Name just in case
UPDATE tenants
SET razon_social = 'Panadería y Pastelería El Trigal SpA', nombre_fantasia = 'El Trigal'
WHERE id = 'a1000000-0000-0000-0000-000000000001';

-- 4. Just in case "La Sazón del Dev" stole our products, 
-- let's try to identify it and rename it to avoid confusion
UPDATE tenants
SET nombre_fantasia = Concat(nombre_fantasia, ' (Ghost)')
WHERE nombre_fantasia = 'La Sazón del Dev'
AND id != 'a1000000-0000-0000-0000-000000000001';
