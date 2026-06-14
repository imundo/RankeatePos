ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7);

-- Ensure logo_url is TEXT if it was previously VARCHAR
ALTER TABLE tenants ALTER COLUMN logo_url TYPE TEXT;

CREATE TABLE IF NOT EXISTS tenant_documents (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    fecha_vencimiento DATE,
    archivo_url TEXT,
    estado VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT fk_tenant_document_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Ensure archivo_url is TEXT if table already existed
ALTER TABLE tenant_documents ALTER COLUMN archivo_url TYPE TEXT;
