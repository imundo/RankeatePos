package com.poscl.marketing.api.controller;

import com.poscl.marketing.application.service.ReferralService;
import com.poscl.marketing.domain.entity.Referral;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/referrals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReferralController {
    
    private final ReferralService referralService;
    
    @GetMapping
    public ResponseEntity<Page<Referral>> findAll(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(referralService.findAll(tenantId, pageable));
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<Referral>> findPending(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(referralService.findPending(tenantId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Referral> findById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return referralService.findById(tenantId, id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/referrer/{referrerId}")
    public ResponseEntity<List<Referral>> findByReferrer(@PathVariable UUID referrerId) {
        return ResponseEntity.ok(referralService.findByReferrer(referrerId));
    }
    
    // ========== Create Referral ==========
    
    @PostMapping
    public ResponseEntity<Referral> createReferral(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam UUID referrerId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {
        return ResponseEntity.ok(referralService.createReferral(tenantId, referrerId, email, phone));
    }
    
    // ========== Process Referral ==========
    
    @PostMapping("/register")
    public ResponseEntity<Referral> processRegistration(
            @RequestParam String referralCode,
            @RequestParam UUID referredCustomerId) {
        return ResponseEntity.ok(referralService.processReferralRegistration(referralCode, referredCustomerId));
    }
    
    @PostMapping("/convert")
    public ResponseEntity<Referral> processConversion(
            @RequestParam UUID referredCustomerId,
            @RequestParam BigDecimal purchaseAmount) {
        Referral result = referralService.processReferralConversion(referredCustomerId, purchaseAmount);
        return result != null ? ResponseEntity.ok(result) : ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{id}/reward")
    public ResponseEntity<Referral> rewardReferrer(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(referralService.rewardReferrer(tenantId, id));
    }
    
    // ========== Leaderboard ==========
    
    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(referralService.getLeaderboard(tenantId, limit));
    }
    
    // ========== Analytics ==========
    
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(referralService.getAnalytics(tenantId));
    }
    
    // ========== Link Generation ==========
    
    @GetMapping("/link/{referralCode}")
    public ResponseEntity<String> getReferralLink(
            @PathVariable String referralCode,
            @RequestParam(defaultValue = "https://rankeate.cl") String baseUrl) {
        return ResponseEntity.ok(referralService.getReferralLink(referralCode, baseUrl));
    }
}
