package com.poscl.marketing.application.service;

import com.poscl.marketing.domain.entity.Review;
import com.poscl.marketing.domain.entity.Review.ReviewStatus;
import com.poscl.marketing.domain.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    
    // ========== CRUD ==========
    
    public Page<Review> findAll(UUID tenantId, Pageable pageable) {
        return reviewRepository.findByTenantId(tenantId, pageable);
    }
    
    public Page<Review> findPublic(UUID tenantId, Pageable pageable) {
        return reviewRepository.findByTenantIdAndIsPublicTrueAndStatus(tenantId, ReviewStatus.APPROVED, pageable);
    }
    
    public Optional<Review> findById(UUID tenantId, UUID id) {
        return reviewRepository.findByIdAndTenantId(id, tenantId);
    }
    
    public List<Review> findPending(UUID tenantId) {
        return reviewRepository.findByTenantIdAndStatus(tenantId, ReviewStatus.PENDING);
    }
    
    public List<Review> findByCustomer(UUID customerId) {
        return reviewRepository.findByCustomerId(customerId);
    }
    
    @Transactional
    public Review create(UUID tenantId, Review review) {
        review.setTenantId(tenantId);
        review.setStatus(ReviewStatus.PENDING);
        review.setCreatedAt(LocalDateTime.now());
        return reviewRepository.save(review);
    }
    
    // ========== Moderation ==========
    
    @Transactional
    public Review approve(UUID tenantId, UUID id) {
        return reviewRepository.findByIdAndTenantId(id, tenantId)
            .map(review -> {
                review.setStatus(ReviewStatus.APPROVED);
                return reviewRepository.save(review);
            })
            .orElseThrow(() -> new RuntimeException("Review not found"));
    }
    
    @Transactional
    public Review reject(UUID tenantId, UUID id) {
        return reviewRepository.findByIdAndTenantId(id, tenantId)
            .map(review -> {
                review.setStatus(ReviewStatus.REJECTED);
                return reviewRepository.save(review);
            })
            .orElseThrow(() -> new RuntimeException("Review not found"));
    }
    
    @Transactional
    public Review flag(UUID tenantId, UUID id) {
        return reviewRepository.findByIdAndTenantId(id, tenantId)
            .map(review -> {
                review.setStatus(ReviewStatus.FLAGGED);
                return reviewRepository.save(review);
            })
            .orElseThrow(() -> new RuntimeException("Review not found"));
    }
    
    // ========== Response ==========
    
    @Transactional
    public Review respond(UUID tenantId, UUID id, String response, UUID userId) {
        return reviewRepository.findByIdAndTenantId(id, tenantId)
            .map(review -> {
                review.setResponse(response);
                review.setRespondedAt(LocalDateTime.now());
                review.setRespondedBy(userId);
                return reviewRepository.save(review);
            })
            .orElseThrow(() -> new RuntimeException("Review not found"));
    }
    
    // ========== Analytics ==========
    
    public Map<String, Object> getAnalytics(UUID tenantId) {
        Map<String, Object> analytics = new HashMap<>();
        
        Double avgRating = reviewRepository.averageRating(tenantId);
        analytics.put("averageRating", avgRating != null ? avgRating : 0);
        
        Double nps = reviewRepository.calculateNPS(tenantId);
        analytics.put("npsScore", nps != null ? nps : 0);
        
        long unresponded = reviewRepository.countUnresponded(tenantId);
        analytics.put("unrespondedReviews", unresponded);
        
        List<Review> pending = findPending(tenantId);
        analytics.put("pendingReviews", pending.size());
        
        // Rating distribution
        List<Object[]> ratingCounts = reviewRepository.countByRating(tenantId);
        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(i, 0L);
        for (Object[] rc : ratingCounts) {
            distribution.put((Integer) rc[0], (Long) rc[1]);
        }
        analytics.put("ratingDistribution", distribution);
        
        // Calculate percentages
        long total = distribution.values().stream().mapToLong(Long::longValue).sum();
        Map<Integer, Double> percentages = new HashMap<>();
        if (total > 0) {
            for (int i = 1; i <= 5; i++) {
                percentages.put(i, distribution.get(i) * 100.0 / total);
            }
        }
        analytics.put("ratingPercentages", percentages);
        
        return analytics;
    }
    
    // ========== Helpers ==========
    
    @Transactional
    public void markHelpful(UUID tenantId, UUID id) {
        reviewRepository.findByIdAndTenantId(id, tenantId)
            .ifPresent(review -> {
                review.setHelpfulCount(review.getHelpfulCount() + 1);
                reviewRepository.save(review);
            });
    }
}
