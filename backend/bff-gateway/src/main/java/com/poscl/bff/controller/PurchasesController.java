package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for Purchases Service (Compras)
 */
@RestController
@RequestMapping("/api/purchases")
public class PurchasesController {

    private final RestTemplate restTemplate;
    private final String purchasesServiceUrl;

    public PurchasesController(
            RestTemplate restTemplate,
            @Value("${services.purchases.url}") String purchasesServiceUrl) {
        this.restTemplate = restTemplate;
        this.purchasesServiceUrl = purchasesServiceUrl;
    }

    // ==================== SUPPLIERS ====================

    @GetMapping("/suppliers")
    public ResponseEntity<?> getSuppliers(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = purchasesServiceUrl + "/api/v1/suppliers";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/suppliers")
    public ResponseEntity<?> createSupplier(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        String url = purchasesServiceUrl + "/api/v1/suppliers";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    @GetMapping("/suppliers/{id}")
    public ResponseEntity<?> getSupplier(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = purchasesServiceUrl + "/api/v1/suppliers/" + id;
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    // ==================== PURCHASE ORDERS ====================

    @GetMapping("/orders")
    public ResponseEntity<?> getPurchaseOrders(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String status) {
        String url = purchasesServiceUrl + "/api/v1/purchase-orders" + (status != null ? "?status=" + status : "");
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createPurchaseOrder(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        String url = purchasesServiceUrl + "/api/v1/purchase-orders";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getPurchaseOrder(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = purchasesServiceUrl + "/api/v1/purchase-orders/" + id;
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/orders/{id}/approve")
    public ResponseEntity<?> approvePurchaseOrder(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = purchasesServiceUrl + "/api/v1/purchase-orders/" + id + "/approve";
        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    private HttpHeaders createHeaders(String authHeader, String tenantId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authHeader != null)
            headers.set("Authorization", authHeader);
        if (tenantId != null)
            headers.set("X-Tenant-Id", tenantId);
        return headers;
    }
}
