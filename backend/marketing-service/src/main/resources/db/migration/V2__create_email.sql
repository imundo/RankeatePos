-- V2__create_email.sql
-- Email Marketing tables

CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    type VARCHAR(30) NOT NULL,
    trigger VARCHAR(30),
    preview_text VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_trigger ON email_templates(tenant_id, trigger);

CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    status VARCHAR(20) DEFAULT 'DRAFT',
    target_segment VARCHAR(20),
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_unsubscribed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_campaigns_tenant ON email_campaigns(tenant_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
