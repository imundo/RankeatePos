-- =====================================================
-- V5: Add missing signature column to CAF table
-- Fixes mismatch between Caf Entity and Schema
-- =====================================================

ALTER TABLE caf 
ADD COLUMN IF NOT EXISTS signature TEXT;
