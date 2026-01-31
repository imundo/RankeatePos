-- =====================================================
-- V6: Add missing emisor_logo_url column to DTE table
-- Fixes mismatch between Entity and Schema
-- =====================================================

ALTER TABLE dte 
ADD COLUMN IF NOT EXISTS emisor_logo_url VARCHAR(500);
