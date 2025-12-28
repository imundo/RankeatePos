package com.poscl.marketing.domain.repository;

import com.poscl.marketing.domain.entity.Referral;
import com.poscl.marketing.domain.entity.Referral.ReferralStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReferralRepository extends JpaRepository<Referral, UUID> {
    
    Page<Referral> findByTenantId(UUID tenantId, Pageable pageable);
    
    Optional<Referral> findByIdAndTenantId(UUID id, UUID tenantId);
    
    List<Referral> findByReferrerId(UUID referrerId);
    
    Optional<Referral> findByReferralCode(String referralCode);
    
    Optional<Referral> findByReferredId(UUID referredId);
    
    List<Referral> findByTenantIdAndStatus(UUID tenantId, ReferralStatus status);
    
    @Query("SELECT COUNT(r) FROM Referral r WHERE r.referrerId = :referrerId AND r.status IN ('CONVERTED', 'REWARDED')")
    long countSuccessfulReferrals(@Param("referrerId") UUID referrerId);
    
    @Query("SELECT r.referrerId, COUNT(r) as cnt FROM Referral r " +
           "WHERE r.tenantId = :tenantId AND r.status IN ('CONVERTED', 'REWARDED') " +
           "GROUP BY r.referrerId ORDER BY cnt DESC")
    List<Object[]> getLeaderboard(@Param("tenantId") UUID tenantId, Pageable pageable);
    
    @Query("SELECT COUNT(r) FROM Referral r WHERE r.tenantId = :tenantId AND r.status = 'CONVERTED'")
    long countConversions(@Param("tenantId") UUID tenantId);
    
    @Query("SELECT SUM(r.firstPurchaseAmount) FROM Referral r WHERE r.tenantId = :tenantId AND r.status IN ('CONVERTED', 'REWARDED')")
    Double totalRevenueFromReferrals(@Param("tenantId") UUID tenantId);
}
