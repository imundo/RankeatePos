-- =====================================================
-- V2: Multi-country support for billing
-- Adds pais column to config_facturacion
-- =====================================================

-- Add pais column to config_facturacion
ALTER TABLE config_facturacion 
ADD COLUMN IF NOT EXISTS pais VARCHAR(2) NOT NULL DEFAULT 'CL';

-- Add country-specific configuration columns

-- Peru (SUNAT) specific
ALTER TABLE config_facturacion 
ADD COLUMN IF NOT EXISTS ruc VARCHAR(11);

ALTER TABLE config_facturacion 
ADD COLUMN IF NOT EXISTS ose_codigo VARCHAR(20);

ALTER TABLE config_facturacion 
ADD COLUMN IF NOT EXISTS ose_url VARCHAR(500);

-- Venezuela (SENIAT) specific
ALTER TABLE config_facturacion 
ADD COLUMN IF NOT EXISTS rif VARCHAR(12);

ALTER TABLE config_facturacion 
ADD COLUMN IF NOT EXISTS imprenta_digital_id VARCHAR(50);

ALTER TABLE config_facturacion 
ADD COLUMN IF NOT EXISTS software_homologado BOOLEAN DEFAULT false;

-- Update CAF table to support multi-country folios
ALTER TABLE caf 
ADD COLUMN IF NOT EXISTS pais VARCHAR(2) NOT NULL DEFAULT 'CL';

-- Peru uses series + correlativo instead of CAF
CREATE TABLE IF NOT EXISTS serie_correlativo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    pais VARCHAR(2) NOT NULL DEFAULT 'PE',
    
    tipo_documento VARCHAR(30) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    ultimo_correlativo INTEGER NOT NULL DEFAULT 0,
    
    activo BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    UNIQUE(tenant_id, tipo_documento, serie)
);

CREATE INDEX IF NOT EXISTS idx_serie_correlativo_tenant ON serie_correlativo(tenant_id);

-- Venezuela uses control numbers from authorized printers
CREATE TABLE IF NOT EXISTS numero_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    imprenta_id VARCHAR(50) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    desde INTEGER NOT NULL,
    hasta INTEGER NOT NULL,
    actual INTEGER NOT NULL,
    
    fecha_autorizacion DATE NOT NULL,
    
    activo BOOLEAN NOT NULL DEFAULT true,
    agotado BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, imprenta_id, serie, desde)
);

CREATE INDEX IF NOT EXISTS idx_numero_control_tenant ON numero_control(tenant_id);

COMMENT ON TABLE serie_correlativo IS 'Series y correlativos para Perú (SUNAT)';
COMMENT ON TABLE numero_control IS 'Números de control autorizados para Venezuela (SENIAT)';
