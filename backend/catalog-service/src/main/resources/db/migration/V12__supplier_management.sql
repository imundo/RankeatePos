CREATE TABLE suppliers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rut VARCHAR(20),
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion VARCHAR(200),
    contacto VARCHAR(100),
    plazo_pago VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);

CREATE TABLE supplier_products (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    product_variant_id UUID NOT NULL,
    supplier_sku VARCHAR(50),
    last_cost INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT fk_sp_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_sp_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

CREATE INDEX idx_sp_tenant ON supplier_products(tenant_id);
CREATE INDEX idx_sp_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_sp_variant ON supplier_products(product_variant_id);
