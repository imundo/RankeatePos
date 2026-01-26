-- =====================================================
-- V28: Clone Password from 'admin@aprende.cl'
-- Description: 
-- User confirmed 'admin@aprende.cl' works. We copy its hash to 'admin@eltrigal.cl'.
-- This guarantees matched credentials without knowing the actual password.
-- =====================================================

DO $$
DECLARE
    source_hash VARCHAR(255);
BEGIN
    -- 1. Fetch hash from admin@aprende.cl
    SELECT password_hash INTO source_hash 
    FROM users 
    WHERE LOWER(email) = 'admin@aprende.cl' 
    LIMIT 1;

    -- 2. If source exists, update target users
    IF source_hash IS NOT NULL THEN
        UPDATE users 
        SET password_hash = source_hash 
        WHERE LOWER(email) IN ('admin@eltrigal.cl', 'admin2@eltrigal.cl');
        
        RAISE NOTICE 'Password cloned from admin@aprende.cl to eltrigal users.';
    ELSE
        RAISE NOTICE 'WARNING: admin@aprende.cl NOT FOUND. Password update skipped.';
    END IF;
END $$;
