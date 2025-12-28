package com.poscl.marketing.api.controller;

import com.poscl.marketing.application.service.CustomerService;
import com.poscl.marketing.domain.entity.Customer;
import com.poscl.marketing.domain.entity.CustomerInteraction;
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
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomerController {
    
    private final CustomerService customerService;
    
    @GetMapping
    public ResponseEntity<Page<Customer>> findAll(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(customerService.findAll(tenantId, pageable));
    }
    
    @GetMapping("/search")
    public ResponseEntity<Page<Customer>> search(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam String query,
            Pageable pageable) {
        return ResponseEntity.ok(customerService.search(tenantId, query, pageable));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Customer> findById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return customerService.findById(tenantId, id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Customer> create(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody Customer customer) {
        return ResponseEntity.ok(customerService.create(tenantId, customer));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Customer> update(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @RequestBody Customer customer) {
        return ResponseEntity.ok(customerService.update(tenantId, id, customer));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        customerService.delete(tenantId, id);
        return ResponseEntity.noContent().build();
    }
    
    // ========== Loyalty ==========
    
    @PostMapping("/{id}/points")
    public ResponseEntity<Customer> addPoints(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @RequestParam int points,
            @RequestParam(required = false) String description) {
        return ResponseEntity.ok(customerService.addPoints(id, points, 
            description != null ? description : "Puntos manuales", userId));
    }
    
    @PostMapping("/{id}/redeem")
    public ResponseEntity<Customer> redeemPoints(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @RequestParam int points,
            @RequestParam String rewardName) {
        return ResponseEntity.ok(customerService.redeemPoints(id, points, rewardName, userId));
    }
    
    // ========== Purchase ==========
    
    @PostMapping("/{id}/purchase")
    public ResponseEntity<Void> recordPurchase(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @RequestParam BigDecimal amount,
            @RequestParam String saleId) {
        customerService.recordPurchase(id, amount, saleId, userId);
        return ResponseEntity.ok().build();
    }
    
    // ========== Tags ==========
    
    @PostMapping("/{id}/tags")
    public ResponseEntity<Customer> addTag(
            @PathVariable UUID id,
            @RequestParam String name,
            @RequestParam(defaultValue = "#6366F1") String color) {
        return ResponseEntity.ok(customerService.addTag(id, name, color));
    }
    
    @DeleteMapping("/{id}/tags/{tagId}")
    public ResponseEntity<Customer> removeTag(
            @PathVariable UUID id,
            @PathVariable UUID tagId) {
        return ResponseEntity.ok(customerService.removeTag(id, tagId));
    }
    
    // ========== Timeline ==========
    
    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<CustomerInteraction>> getTimeline(@PathVariable UUID id) {
        return ResponseEntity.ok(customerService.getTimeline(id));
    }
    
    // ========== Segments ==========
    
    @GetMapping("/birthdays")
    public ResponseEntity<List<Customer>> findBirthdaysToday(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(customerService.findBirthdaysToday(tenantId));
    }
    
    @GetMapping("/at-risk")
    public ResponseEntity<List<Customer>> findAtRisk(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(customerService.findAtRiskCustomers(tenantId));
    }
    
    @PostMapping("/update-segments")
    public ResponseEntity<Void> updateAllSegments(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        customerService.updateAllSegments(tenantId);
        return ResponseEntity.ok().build();
    }
    
    // ========== Stats ==========
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(customerService.getStats(tenantId));
    }
    
    @GetMapping("/{id}/score")
    public ResponseEntity<Integer> getScore(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return customerService.findById(tenantId, id)
            .map(customer -> ResponseEntity.ok(customerService.calculateScore(customer)))
            .orElse(ResponseEntity.notFound().build());
    }
}
