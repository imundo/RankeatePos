package com.poscl.marketing.domain.repository;

import com.poscl.marketing.domain.entity.Review;
import com.poscl.marketing.domain.entity.Review.ReviewStatus;
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
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    
    Page<Review> findByTenantId(UUID tenantId, Pageable pageable);
    
    Optional<Review> findByIdAndTenantId(UUID id, UUID tenantId);
    
    List<Review> findByTenantIdAndStatus(UUID tenantId, ReviewStatus status);
    
    List<Review> findByCustomerId(UUID customerId);
    
    Page<Review> findByTenantIdAndIsPublicTrueAndStatus(UUID tenantId, ReviewStatus status, Pageable pageable);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.tenantId = :tenantId AND r.status = 'APPROVED'")
    Double averageRating(@Param("tenantId") UUID tenantId);
    
    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.tenantId = :tenantId AND r.status = 'APPROVED' GROUP BY r.rating")
    List<Object[]> countByRating(@Param("tenantId") UUID tenantId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.tenantId = :tenantId AND r.response IS NULL AND r.status = 'APPROVED'")
    long countUnresponded(@Param("tenantId") UUID tenantId);
    
    // NPS: (Promoters - Detractors) / Total * 100
    // Promoters: rating 5, Detractors: rating 1-2
    @Query("SELECT " +
           "(SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) - SUM(CASE WHEN r.rating <= 2 THEN 1 ELSE 0 END)) * 100.0 / COUNT(r) " +
           "FROM Review r WHERE r.tenantId = :tenantId AND r.status = 'APPROVED'")
    Double calculateNPS(@Param("tenantId") UUID tenantId);
}
