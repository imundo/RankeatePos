CREATE TABLE automations (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    channels TEXT,
    template_content TEXT,
    condiciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_automations_tenant_id ON automations(tenant_id);
