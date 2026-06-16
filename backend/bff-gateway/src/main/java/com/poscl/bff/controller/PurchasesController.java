package com.poscl.bff.controller;

import lombok.extern.slf4j.Slf4j;

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
@CrossOrigin(origins = "*", maxAge = 3600)
@Slf4j
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
        log.info("BFF: GET /api/purchases/suppliers");
        String url = purchasesServiceUrl + "/api/v1/suppliers";
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)), Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @PostMapping("/suppliers")
    public ResponseEntity<?> createSupplier(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        log.info("BFF: POST /api/purchases/suppliers");
        String url = purchasesServiceUrl + "/api/v1/suppliers";
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @GetMapping("/suppliers/{id}")
    public ResponseEntity<?> getSupplier(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = purchasesServiceUrl + "/api/v1/suppliers/" + id;
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)), Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @PutMapping("/suppliers/{id}/rating")
    public ResponseEntity<?> updateRating(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        String url = purchasesServiceUrl + "/api/v1/suppliers/" + id + "/rating";
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.PUT,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    // ==================== PURCHASE ORDERS ====================

    @GetMapping("/orders")
    public ResponseEntity<?> getPurchaseOrders(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String status) {
        String url = purchasesServiceUrl + "/api/v1/purchase-orders" + (status != null ? "?status=" + status : "");
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @GetMapping("/orders/supplier/{supplierId}")
    public ResponseEntity<?> getOrdersBySupplier(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String supplierId) {
        String url = purchasesServiceUrl + "/api/v1/purchase-orders/supplier/" + supplierId;
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createPurchaseOrder(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        String url = purchasesServiceUrl + "/api/v1/purchase-orders";
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getPurchaseOrder(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = purchasesServiceUrl + "/api/v1/purchase-orders/" + id;
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @PostMapping("/orders/{id}/approve")
    public ResponseEntity<?> approvePurchaseOrder(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = purchasesServiceUrl + "/api/v1/purchase-orders/" + id + "/approve";
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @GetMapping("/orders/summary")
    public ResponseEntity<?> getOrdersSummary(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = purchasesServiceUrl + "/api/v1/purchase-orders/summary";
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    // ==================== ACCOUNTS PAYABLE ====================

    @GetMapping("/payables/supplier/{supplierId}")
    public ResponseEntity<?> getPayablesBySupplier(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String supplierId) {
        log.info("BFF: GET /api/purchases/payables/supplier/{}", supplierId);
        String url = purchasesServiceUrl + "/api/v1/accounts-payable/supplier/" + supplierId;
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)), Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @PostMapping("/payables")
    public ResponseEntity<?> createPayable(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        log.info("BFF: POST /api/purchases/payables. Payload: {}", request);
        String url = purchasesServiceUrl + "/api/v1/accounts-payable";
        try {
            ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.POST,
                    new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
            log.info("BFF: POST /api/purchases/payables SUCCESS. Status: {}", response.getStatusCode());
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            log.error("BFF: POST /api/purchases/payables ERROR. Type: {}, Msg: {}", e.getClass().getName(), e.getMessage());
            throw e;
        }
    }

    @PostMapping("/payables/{id}/pay")
    public ResponseEntity<?> payAccountPayable(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = purchasesServiceUrl + "/api/v1/accounts-payable/" + id + "/pay";
        ResponseEntity<?> response = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(createHeaders(authHeader, tenantId)), Object.class);
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
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
