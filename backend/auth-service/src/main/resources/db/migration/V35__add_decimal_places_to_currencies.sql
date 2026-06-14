-- =====================================================
-- V35: Fix missing decimal_places in currencies table
-- =====================================================

ALTER TABLE currencies ADD COLUMN IF NOT EXISTS decimal_places INTEGER NOT NULL DEFAULT 0;
