package com.poscl.marketing.domain.repository;

import com.poscl.marketing.domain.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    
    Optional<Coupon> findByCode(String code);
    
    List<Coupon> findByPromotionId(UUID promotionId);
    
    List<Coupon> findByAssignedTo(UUID customerId);
    
    @Query("SELECT c FROM Coupon c WHERE c.code = :code AND c.active = true " +
           "AND c.currentUses < c.maxUses " +
           "AND (c.expiresAt IS NULL OR c.expiresAt > CURRENT_TIMESTAMP)")
    Optional<Coupon> findValidCoupon(@Param("code") String code);
    
    @Query("SELECT COUNT(c) FROM Coupon c WHERE c.promotion.id = :promotionId AND c.currentUses > 0")
    long countUsedCoupons(@Param("promotionId") UUID promotionId);
}
