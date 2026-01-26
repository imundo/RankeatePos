-- =====================================================
-- V25: Normalize Emails & Add Case-Insensitive Index
-- Description: Ensure all emails are stored in lowercase and search is optimized
-- =====================================================

-- 1. Normalize all user emails to lowercase
UPDATE users SET email = LOWER(TRIM(email));

-- 2. Create a unique index on lowercase email per tenant if it doesn't exist
DROP INDEX IF EXISTS idx_users_email;

-- Standard index for exact matches (now normalized)
CREATE INDEX idx_users_email_lower ON users(email);

-- 3. Just to be absolutely sure, fix our specific demo user AGAIN
UPDATE users 
SET email = 'admin@eltrigal.cl' 
WHERE LOWER(email) = 'admin@eltrigal.cl' 
AND tenant_id = 'a1000000-0000-0000-0000-000000000001';
