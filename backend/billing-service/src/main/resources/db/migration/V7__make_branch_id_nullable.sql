-- =====================================================
-- V7: Make branch_id nullable in DTE table
-- Fixes mismatch: Controller allows optional branchId, but DB enforces NOT NULL
-- =====================================================

ALTER TABLE dte 
ALTER COLUMN branch_id DROP NOT NULL;
