-- =====================================================
-- V1: Initial Billing Service Schema
-- Facturación Electrónica SII Chile
-- =====================================================

CREATE SCHEMA IF NOT EXISTS billing;
SET search_path TO billing;

-- Tabla principal de Documentos Tributarios Electrónicos
CREATE TABLE dte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    -- Identificación DTE
    tipo_dte VARCHAR(30) NOT NULL,
    folio INTEGER NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    
    -- Emisor
    emisor_rut VARCHAR(12) NOT NULL,
    emisor_razon_social VARCHAR(100) NOT NULL,
    emisor_giro VARCHAR(80),
    emisor_direccion VARCHAR(70),
    emisor_comuna VARCHAR(20),
    emisor_ciudad VARCHAR(20),
    
    -- Receptor
    receptor_rut VARCHAR(12),
    receptor_razon_social VARCHAR(100),
    receptor_giro VARCHAR(80),
    receptor_direccion VARCHAR(70),
    receptor_comuna VARCHAR(20),
    receptor_ciudad VARCHAR(20),
    receptor_email VARCHAR(80),
    
    -- Montos
    monto_neto DECIMAL(18,2),
    monto_exento DECIMAL(18,2),
    tasa_iva INTEGER,
    monto_iva DECIMAL(18,2),
    monto_total DECIMAL(18,2) NOT NULL,
    
    -- Estado SII
    estado VARCHAR(30) NOT NULL DEFAULT 'BORRADOR',
    track_id VARCHAR(20),
    glosa_estado VARCHAR(500),
    fecha_envio TIMESTAMP,
    fecha_respuesta TIMESTAMP,
    
    -- Archivos
    xml_content TEXT,
    xml_firmado TEXT,
    pdf_url VARCHAR(500),
    timbre_ted TEXT,
    
    -- Referencias
    venta_id UUID,
    dte_referencia_id UUID,
    tipo_referencia VARCHAR(30),
    razon_referencia VARCHAR(90),
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    
    UNIQUE(tenant_id, tipo_dte, folio)
);

CREATE INDEX idx_dte_tenant_id ON dte(tenant_id);
CREATE INDEX idx_dte_tenant_fecha ON dte(tenant_id, fecha_emision);
CREATE INDEX idx_dte_estado ON dte(tenant_id, estado);
CREATE INDEX idx_dte_tipo ON dte(tenant_id, tipo_dte);
CREATE INDEX idx_dte_venta_id ON dte(venta_id);

-- Tabla de detalle de items del DTE
CREATE TABLE dte_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dte_id UUID NOT NULL REFERENCES dte(id) ON DELETE CASCADE,
    
    numero_linea INTEGER NOT NULL,
    
    -- Identificación del item
    tipo_codigo VARCHAR(10),
    codigo VARCHAR(35),
    indicador_exento INTEGER,
    
    -- Descripción
    nombre_item VARCHAR(80) NOT NULL,
    descripcion_item TEXT,
    
    -- Cantidades y precios
    cantidad DECIMAL(18,6) NOT NULL,
    unidad_medida VARCHAR(4),
    precio_unitario DECIMAL(18,6) NOT NULL,
    descuento_porcentaje DECIMAL(5,2),
    descuento_monto DECIMAL(18,2),
    monto_item DECIMAL(18,2) NOT NULL,
    
    -- Referencia a producto
    producto_id UUID
);

CREATE INDEX idx_dte_detalle_dte_id ON dte_detalle(dte_id);

-- Tabla de Códigos de Autorización de Folios (CAF)
CREATE TABLE caf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    tipo_dte VARCHAR(30) NOT NULL,
    folio_desde INTEGER NOT NULL,
    folio_hasta INTEGER NOT NULL,
    folio_actual INTEGER NOT NULL,
    
    fecha_autorizacion DATE NOT NULL,
    fecha_vencimiento DATE,
    
    -- Datos CAF encriptados
    xml_caf TEXT NOT NULL,
    rsa_private_key TEXT,
    rsa_public_key TEXT,
    rsa_modulus TEXT,
    rsa_exponent TEXT,
    
    -- Estado
    activo BOOLEAN NOT NULL DEFAULT true,
    agotado BOOLEAN NOT NULL DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    UNIQUE(tenant_id, tipo_dte, folio_desde)
);

CREATE INDEX idx_caf_tenant_id ON caf(tenant_id);
CREATE INDEX idx_caf_tenant_tipo ON caf(tenant_id, tipo_dte);
CREATE INDEX idx_caf_disponible ON caf(tenant_id, tipo_dte, activo, agotado);

-- Tabla de certificados digitales por tenant
CREATE TABLE certificado_digital (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,
    
    -- Datos del certificado
    nombre VARCHAR(100) NOT NULL,
    rut_titular VARCHAR(12) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    
    -- Archivo encriptado
    pfx_data BYTEA NOT NULL,
    pfx_password_encrypted VARCHAR(500) NOT NULL,
    
    -- Estado
    activo BOOLEAN NOT NULL DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_certificado_tenant ON certificado_digital(tenant_id);

-- Tabla de configuración de facturación por tenant
CREATE TABLE config_facturacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,
    
    -- Configuración general
    ambiente VARCHAR(20) NOT NULL DEFAULT 'certificacion', -- certificacion | produccion
    auto_enviar_sii BOOLEAN NOT NULL DEFAULT true,
    auto_enviar_email BOOLEAN NOT NULL DEFAULT true,
    
    -- Datos por defecto
    giro_default VARCHAR(80),
    acteco_default INTEGER, -- Código actividad económica
    
    -- Resolución SII
    resolucion_numero INTEGER,
    resolucion_fecha DATE,
    
    -- Configuración de envío
    email_copia VARCHAR(320),
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_config_facturacion_tenant ON config_facturacion(tenant_id);

COMMENT ON TABLE dte IS 'Documentos Tributarios Electrónicos emitidos';
COMMENT ON TABLE caf IS 'Códigos de Autorización de Folios del SII';
COMMENT ON TABLE certificado_digital IS 'Certificados digitales para firma electrónica';
COMMENT ON TABLE config_facturacion IS 'Configuración de facturación por tenant';
