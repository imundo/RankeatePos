package com.poscl.marketing.application.service;

import com.poscl.marketing.domain.entity.Customer;
import com.poscl.marketing.domain.entity.Referral;
import com.poscl.marketing.domain.entity.Referral.ReferralStatus;
import com.poscl.marketing.domain.entity.Referral.RewardType;
import com.poscl.marketing.domain.repository.CustomerRepository;
import com.poscl.marketing.domain.repository.ReferralRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReferralService {
    
    private final ReferralRepository referralRepository;
    private final CustomerRepository customerRepository;
    
    // Default rewards
    private static final BigDecimal DEFAULT_REFERRER_REWARD = BigDecimal.valueOf(5000); // $5000 CLP
    private static final BigDecimal DEFAULT_REFERRED_REWARD = BigDecimal.valueOf(3000); // $3000 CLP
    
    // ========== CRUD ==========
    
    public Page<Referral> findAll(UUID tenantId, Pageable pageable) {
        return referralRepository.findByTenantId(tenantId, pageable);
    }
    
    public Optional<Referral> findById(UUID tenantId, UUID id) {
        return referralRepository.findByIdAndTenantId(id, tenantId);
    }
    
    public List<Referral> findByReferrer(UUID referrerId) {
        return referralRepository.findByReferrerId(referrerId);
    }
    
    public List<Referral> findPending(UUID tenantId) {
        return referralRepository.findByTenantIdAndStatus(tenantId, ReferralStatus.PENDING);
    }
    
    // ========== Create Referral ==========
    
    @Transactional
    public Referral createReferral(UUID tenantId, UUID referrerId, String referredEmail, String referredPhone) {
        Customer referrer = customerRepository.findById(referrerId)
            .orElseThrow(() -> new RuntimeException("Referrer not found"));
        
        // Use customer's referral code or generate one
        String referralCode = referrer.getReferralCode();
        if (referralCode == null) {
            referralCode = generateReferralCode();
            referrer.setReferralCode(referralCode);
            customerRepository.save(referrer);
        }
        
        Referral referral = Referral.builder()
            .tenantId(tenantId)
            .referrerId(referrerId)
            .referralCode(referralCode)
            .referredEmail(referredEmail)
            .referredPhone(referredPhone)
            .status(ReferralStatus.PENDING)
            .referrerReward(DEFAULT_REFERRER_REWARD)
            .referredReward(DEFAULT_REFERRED_REWARD)
            .referrerRewardType(RewardType.DISCOUNT)
            .referredRewardType(RewardType.DISCOUNT)
            .build();
        
        return referralRepository.save(referral);
    }
    
    // ========== Process Referral ==========
    
    @Transactional
    public Referral processReferralRegistration(String referralCode, UUID referredCustomerId) {
        Referral referral = referralRepository.findByReferralCode(referralCode)
            .orElseThrow(() -> new RuntimeException("Invalid referral code"));
        
        if (referral.getStatus() != ReferralStatus.PENDING) {
            throw new RuntimeException("Referral already processed");
        }
        
        referral.setReferredId(referredCustomerId);
        referral.setStatus(ReferralStatus.REGISTERED);
        
        // Update referred customer
        customerRepository.findById(referredCustomerId).ifPresent(customer -> {
            customer.setReferredBy(referral.getReferrerId());
            customerRepository.save(customer);
        });
        
        return referralRepository.save(referral);
    }
    
    @Transactional
    public Referral processReferralConversion(UUID referredCustomerId, BigDecimal purchaseAmount) {
        Referral referral = referralRepository.findByReferredId(referredCustomerId)
            .orElse(null);
        
        if (referral == null || referral.getStatus() == ReferralStatus.CONVERTED) {
            return null; // No referral or already converted
        }
        
        referral.setStatus(ReferralStatus.CONVERTED);
        referral.setFirstPurchaseAmount(purchaseAmount);
        referral.setConvertedAt(LocalDateTime.now());
        
        // Award referred customer immediately
        if (!referral.getReferredRewarded()) {
            applyReward(referral.getReferredId(), referral.getReferredReward(), referral.getReferredRewardType());
            referral.setReferredRewarded(true);
        }
        
        return referralRepository.save(referral);
    }
    
    @Transactional
    public Referral rewardReferrer(UUID tenantId, UUID referralId) {
        Referral referral = referralRepository.findByIdAndTenantId(referralId, tenantId)
            .orElseThrow(() -> new RuntimeException("Referral not found"));
        
        if (referral.getStatus() != ReferralStatus.CONVERTED) {
            throw new RuntimeException("Referral not converted yet");
        }
        
        if (referral.getReferrerRewarded()) {
            throw new RuntimeException("Referrer already rewarded");
        }
        
        applyReward(referral.getReferrerId(), referral.getReferrerReward(), referral.getReferrerRewardType());
        referral.setReferrerRewarded(true);
        referral.setStatus(ReferralStatus.REWARDED);
        
        return referralRepository.save(referral);
    }
    
    private void applyReward(UUID customerId, BigDecimal amount, RewardType type) {
        customerRepository.findById(customerId).ifPresent(customer -> {
            switch (type) {
                case POINTS:
                    customer.setLoyaltyPoints(customer.getLoyaltyPoints() + amount.intValue());
                    break;
                case DISCOUNT:
                    // In production, this would create a coupon for the customer
                    break;
                case CASH:
                    // In production, this would trigger a refund/credit
                    break;
                default:
                    break;
            }
            customerRepository.save(customer);
        });
    }
    
    // ========== Leaderboard ==========
    
    public List<Map<String, Object>> getLeaderboard(UUID tenantId, int limit) {
        List<Object[]> results = referralRepository.getLeaderboard(tenantId, Pageable.ofSize(limit));
        List<Map<String, Object>> leaderboard = new ArrayList<>();
        
        int rank = 1;
        for (Object[] row : results) {
            UUID referrerId = (UUID) row[0];
            Long count = (Long) row[1];
            
            Customer customer = customerRepository.findById(referrerId).orElse(null);
            if (customer != null) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("rank", rank++);
                entry.put("customerId", referrerId);
                entry.put("name", customer.getName());
                entry.put("referralCount", count);
                entry.put("loyaltyTier", customer.getLoyaltyTier());
                leaderboard.add(entry);
            }
        }
        
        return leaderboard;
    }
    
    // ========== Analytics ==========
    
    public Map<String, Object> getAnalytics(UUID tenantId) {
        Map<String, Object> analytics = new HashMap<>();
        
        long totalConversions = referralRepository.countConversions(tenantId);
        analytics.put("totalConversions", totalConversions);
        
        Double revenue = referralRepository.totalRevenueFromReferrals(tenantId);
        analytics.put("totalRevenue", revenue != null ? revenue : 0);
        
        List<Referral> pending = findPending(tenantId);
        analytics.put("pendingReferrals", pending.size());
        
        analytics.put("leaderboard", getLeaderboard(tenantId, 5));
        
        // Conversion rate
        long totalReferrals = referralRepository.findByTenantId(tenantId, Pageable.unpaged()).getTotalElements();
        double conversionRate = totalReferrals > 0 ? (double) totalConversions / totalReferrals * 100 : 0;
        analytics.put("conversionRate", conversionRate);
        
        return analytics;
    }
    
    // ========== Helpers ==========
    
    private String generateReferralCode() {
        return "REF" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    public String getReferralLink(String referralCode, String baseUrl) {
        return baseUrl + "/register?ref=" + referralCode;
    }
}
