package com.poscl.marketing.api.controller;

import com.poscl.marketing.application.service.ReviewService;
import com.poscl.marketing.domain.entity.Review;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {
    
    private final ReviewService reviewService;
    
    @GetMapping
    public ResponseEntity<Page<Review>> findAll(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(reviewService.findAll(tenantId, pageable));
    }
    
    @GetMapping("/public")
    public ResponseEntity<Page<Review>> findPublic(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(reviewService.findPublic(tenantId, pageable));
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<Review>> findPending(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(reviewService.findPending(tenantId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Review> findById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return reviewService.findById(tenantId, id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Review>> findByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(reviewService.findByCustomer(customerId));
    }
    
    @PostMapping
    public ResponseEntity<Review> create(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody Review review) {
        return ResponseEntity.ok(reviewService.create(tenantId, review));
    }
    
    // ========== Moderation ==========
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<Review> approve(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(reviewService.approve(tenantId, id));
    }
    
    @PostMapping("/{id}/reject")
    public ResponseEntity<Review> reject(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(reviewService.reject(tenantId, id));
    }
    
    @PostMapping("/{id}/flag")
    public ResponseEntity<Review> flag(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(reviewService.flag(tenantId, id));
    }
    
    // ========== Response ==========
    
    @PostMapping("/{id}/respond")
    public ResponseEntity<Review> respond(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @RequestBody String response) {
        return ResponseEntity.ok(reviewService.respond(tenantId, id, response, userId));
    }
    
    // ========== Helpful ==========
    
    @PostMapping("/{id}/helpful")
    public ResponseEntity<Void> markHelpful(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        reviewService.markHelpful(tenantId, id);
        return ResponseEntity.ok().build();
    }
    
    // ========== Analytics ==========
    
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(reviewService.getAnalytics(tenantId));
    }
}
