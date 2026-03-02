-- V5__create_referrals.sql
-- Referral Program table

CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    referrer_id UUID NOT NULL,
    referred_id UUID,
    referral_code VARCHAR(20) NOT NULL,
    referred_email VARCHAR(255),
    referred_phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING',
    referrer_reward DECIMAL(15, 2),
    referred_reward DECIMAL(15, 2),
    referrer_reward_type VARCHAR(20),
    referred_reward_type VARCHAR(20),
    referrer_rewarded BOOLEAN DEFAULT FALSE,
    referred_rewarded BOOLEAN DEFAULT FALSE,
    first_purchase_amount DECIMAL(15, 2),
    converted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referrals_tenant ON referrals(tenant_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(tenant_id, status);
