-- =====================================================
-- Auth Service - Default Roles and Permissions
-- =====================================================

-- Roles del sistema (globales, sin tenant)
INSERT INTO roles (id, tenant_id, nombre, descripcion, permisos, es_sistema) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    NULL,
    'OWNER_ADMIN',
    'Dueño/Administrador del negocio',
    ARRAY[
        'catalog:read', 'catalog:write', 'catalog:delete',
        'inventory:read', 'inventory:write', 'inventory:adjust',
        'sales:create', 'sales:read', 'sales:cancel', 'sales:discount', 'sales:discount:unlimited',
        'cash:open', 'cash:close', 'cash:read',
        'partners:read', 'partners:write',
        'purchase:create', 'purchase:receive',
        'reports:read', 'reports:export',
        'config:read', 'config:write',
        'users:read', 'users:write'
    ],
    true
),
(
    'a0000000-0000-0000-0000-000000000002',
    NULL,
    'MANAGER',
    'Supervisor/Encargado',
    ARRAY[
        'catalog:read', 'catalog:write',
        'inventory:read', 'inventory:write', 'inventory:adjust',
        'sales:create', 'sales:read', 'sales:cancel', 'sales:discount', 'sales:discount:unlimited',
        'cash:open', 'cash:close', 'cash:read',
        'partners:read', 'partners:write',
        'purchase:create', 'purchase:receive',
        'reports:read'
    ],
    true
),
(
    'a0000000-0000-0000-0000-000000000003',
    NULL,
    'CASHIER',
    'Cajero',
    ARRAY[
        'catalog:read',
        'sales:create', 'sales:read', 'sales:discount',
        'cash:open', 'cash:close', 'cash:read',
        'partners:read'
    ],
    true
),
(
    'a0000000-0000-0000-0000-000000000004',
    NULL,
    'STOCKKEEPER',
    'Bodeguero/Inventario',
    ARRAY[
        'catalog:read',
        'inventory:read', 'inventory:write', 'inventory:adjust',
        'partners:read',
        'purchase:receive'
    ],
    true
),
(
    'a0000000-0000-0000-0000-000000000005',
    NULL,
    'ACCOUNTANT',
    'Contabilidad',
    ARRAY[
        'catalog:read',
        'inventory:read',
        'sales:read',
        'partners:read',
        'reports:read', 'reports:export'
    ],
    true
),
(
    'a0000000-0000-0000-0000-000000000006',
    NULL,
    'SAAS_ADMIN',
    'Administrador de la plataforma SaaS',
    ARRAY[
        'saas:tenants:read', 'saas:tenants:write',
        'saas:plans:read', 'saas:plans:write',
        'saas:support:read', 'saas:audit:read'
    ],
    true
)
ON CONFLICT (id) DO NOTHING;
