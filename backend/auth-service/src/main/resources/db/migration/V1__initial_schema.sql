-- =====================================================
-- Auth Service - Initial Schema
-- POS Chile - Sistema de Punto de Venta
-- =====================================================

-- Using gen_random_uuid() - native in PostgreSQL 13+ (no extension needed)

-- =====================================================
-- TENANT (Empresa)
-- =====================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Datos empresa Chile
    rut VARCHAR(12) NOT NULL UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    nombre_fantasia VARCHAR(100),
    giro VARCHAR(200),
    
    -- Dirección
    direccion VARCHAR(300),
    comuna VARCHAR(100),
    region VARCHAR(100),
    
    -- Configuración
    business_type VARCHAR(50) NOT NULL DEFAULT 'OTRO',
    currency VARCHAR(3) NOT NULL DEFAULT 'CLP',
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Santiago',
    precio_con_iva BOOLEAN NOT NULL DEFAULT true,
    
    -- Estado
    activo BOOLEAN NOT NULL DEFAULT true,
    plan VARCHAR(50) NOT NULL DEFAULT 'FREE',
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tenants_rut ON tenants(rut);
CREATE INDEX idx_tenants_activo ON tenants(activo) WHERE activo = true;

-- =====================================================
-- BRANCH (Sucursal)
-- =====================================================
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20),
    direccion VARCHAR(300),
    comuna VARCHAR(100),
    telefono VARCHAR(20),
    
    es_principal BOOLEAN NOT NULL DEFAULT false,
    activa BOOLEAN NOT NULL DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(tenant_id, codigo)
);

CREATE INDEX idx_branches_tenant ON branches(tenant_id);
CREATE INDEX idx_branches_activa ON branches(tenant_id, activa) WHERE activa = true;

-- =====================================================
-- ROLE (Rol del sistema)
-- =====================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- NULL = rol global del sistema
    
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200),
    permisos TEXT[] NOT NULL DEFAULT '{}',
    
    es_sistema BOOLEAN NOT NULL DEFAULT false, -- true = no editable
    activo BOOLEAN NOT NULL DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(tenant_id, nombre)
);

CREATE INDEX idx_roles_tenant ON roles(tenant_id);

-- =====================================================
-- USER (Usuario)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    telefono VARCHAR(20),
    
    activo BOOLEAN NOT NULL DEFAULT true,
    email_verificado BOOLEAN NOT NULL DEFAULT false,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_activo ON users(tenant_id, activo) WHERE activo = true;

-- =====================================================
-- USER_ROLES (Relación usuarios-roles)
-- =====================================================
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- =====================================================
-- USER_BRANCHES (Usuarios asignados a sucursales)
-- =====================================================
CREATE TABLE user_branches (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    
    PRIMARY KEY (user_id, branch_id)
);

CREATE INDEX idx_user_branches_user ON user_branches(user_id);
CREATE INDEX idx_user_branches_branch ON user_branches(branch_id);

-- =====================================================
-- REFRESH_TOKEN
-- =====================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

