package com.poscl.marketing.api.controller;

import com.poscl.marketing.application.service.PromotionService;
import com.poscl.marketing.application.service.PromotionService.CouponValidationResult;
import com.poscl.marketing.domain.entity.Coupon;
import com.poscl.marketing.domain.entity.Customer;
import com.poscl.marketing.domain.entity.Promotion;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PromotionController {
    
    private final PromotionService promotionService;
    
    @GetMapping
    public ResponseEntity<Page<Promotion>> findAll(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(promotionService.findAll(tenantId, pageable));
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Promotion>> findActive(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(promotionService.findActive(tenantId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Promotion> findById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return promotionService.findById(tenantId, id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Promotion> create(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody Promotion promotion) {
        return ResponseEntity.ok(promotionService.create(tenantId, promotion));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Promotion> update(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @RequestBody Promotion promotion) {
        return ResponseEntity.ok(promotionService.update(tenantId, id, promotion));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        promotionService.delete(tenantId, id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/toggle")
    public ResponseEntity<Promotion> toggleActive(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(promotionService.toggleActive(tenantId, id));
    }
    
    // ========== Coupons ==========
    
    @PostMapping("/{id}/coupons")
    public ResponseEntity<Coupon> createCoupon(
            @PathVariable UUID id,
            @RequestParam String code,
            @RequestParam(required = false) Integer maxUses,
            @RequestParam(required = false) LocalDateTime expiresAt) {
        return ResponseEntity.ok(promotionService.createCoupon(id, code, maxUses, expiresAt));
    }
    
    @PostMapping("/{id}/coupons/generate")
    public ResponseEntity<List<Coupon>> generateCoupons(
            @PathVariable UUID id,
            @RequestParam int quantity,
            @RequestParam(defaultValue = "PROMO") String prefix) {
        return ResponseEntity.ok(promotionService.generateCoupons(id, quantity, prefix));
    }
    
    @GetMapping("/{id}/coupons")
    public ResponseEntity<List<Coupon>> getCoupons(@PathVariable UUID id) {
        return ResponseEntity.ok(promotionService.getCoupons(id));
    }
    
    // ========== Validation ==========
    
    @GetMapping("/validate/{code}")
    public ResponseEntity<CouponValidationResult> validateCoupon(
            @PathVariable String code,
            @RequestParam BigDecimal cartTotal,
            @RequestParam(required = false) Customer.CustomerSegment segment,
            @RequestParam(required = false) Customer.LoyaltyTier tier) {
        return ResponseEntity.ok(promotionService.validateCouponForCart(
            code, cartTotal, segment, tier));
    }
    
    @PostMapping("/redeem/{code}")
    public ResponseEntity<Void> redeemCoupon(@PathVariable String code) {
        promotionService.redeemCoupon(code);
        return ResponseEntity.ok().build();
    }
    
    // ========== Analytics ==========
    
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(promotionService.getAnalytics(tenantId));
    }
}
