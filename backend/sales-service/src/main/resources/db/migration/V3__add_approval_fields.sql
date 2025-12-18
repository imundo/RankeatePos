-- V3: Add approval fields to sales table for sales approval workflow
-- Added for Docker deployment - sale entity updated with approval fields

ALTER TABLE sales ADD COLUMN IF NOT EXISTS aprobada_at TIMESTAMP;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS aprobada_por UUID;
