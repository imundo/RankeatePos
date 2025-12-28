package com.poscl.marketing.domain.repository;

import com.poscl.marketing.domain.entity.Promotion;
import com.poscl.marketing.domain.entity.Promotion.PromotionType;
import com.poscl.marketing.domain.entity.Customer.CustomerSegment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, UUID> {
    
    Page<Promotion> findByTenantId(UUID tenantId, Pageable pageable);
    
    Optional<Promotion> findByIdAndTenantId(UUID id, UUID tenantId);
    
    List<Promotion> findByTenantIdAndActiveTrue(UUID tenantId);
    
    List<Promotion> findByTenantIdAndType(UUID tenantId, PromotionType type);
    
    @Query("SELECT p FROM Promotion p WHERE p.tenantId = :tenantId AND p.active = true " +
           "AND (p.startDate IS NULL OR p.startDate <= :now) " +
           "AND (p.endDate IS NULL OR p.endDate >= :now)")
    List<Promotion> findActivePromotions(@Param("tenantId") UUID tenantId, 
                                          @Param("now") LocalDateTime now);
    
    @Query("SELECT p FROM Promotion p WHERE p.tenantId = :tenantId AND p.active = true " +
           "AND (p.targetSegment IS NULL OR p.targetSegment = :segment)")
    List<Promotion> findPromotionsForSegment(@Param("tenantId") UUID tenantId, 
                                              @Param("segment") CustomerSegment segment);
}
