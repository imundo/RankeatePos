-- =====================================================
-- V4: Add missing columns to DTE table
-- Fixes mismatch between Entity and Schema
-- =====================================================

ALTER TABLE dte 
ADD COLUMN IF NOT EXISTS anulacion_motivo VARCHAR(200);

ALTER TABLE dte 
ADD COLUMN IF NOT EXISTS anulada_at TIMESTAMP;

ALTER TABLE dte 
ADD COLUMN IF NOT EXISTS anulada_por UUID;
