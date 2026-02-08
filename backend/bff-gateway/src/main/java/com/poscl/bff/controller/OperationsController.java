package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for Operations Service (Loyalty, KDS, Reservations,
 * Subscriptions)
 * Proxies requests to the operations-service microservice
 */
@RestController
@RequestMapping("/api")
public class OperationsController {

    private final RestTemplate restTemplate;
    private final String operationsServiceUrl;

    public OperationsController(
            RestTemplate restTemplate,
            @Value("${services.operations.url}") String operationsServiceUrl) {
        this.restTemplate = restTemplate;
        this.operationsServiceUrl = operationsServiceUrl;
    }

    // ==================== LOYALTY ====================

    @GetMapping("/loyalty/customers")
    public ResponseEntity<?> getLoyaltyCustomers(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        try {
            String url = operationsServiceUrl + "/api/loyalty/customers?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting loyalty customers: " + e.getMessage());
        }
    }

    @GetMapping("/loyalty/customers/search")
    public ResponseEntity<?> searchLoyaltyCustomers(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String q) {

        try {
            String url = operationsServiceUrl + "/api/loyalty/customers/search?q=" + q;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error searching loyalty customers: " + e.getMessage());
        }
    }

    @GetMapping("/loyalty/customers/{id}")
    public ResponseEntity<?> getLoyaltyCustomer(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {

        String url = operationsServiceUrl + "/api/loyalty/customers/" + id;
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @PostMapping("/loyalty/customers")
    public ResponseEntity<?> createLoyaltyCustomer(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/loyalty/customers";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PutMapping("/loyalty/customers/{id}")
    public ResponseEntity<?> updateLoyaltyCustomer(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/loyalty/customers/" + id;
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
    }

    @PostMapping("/loyalty/customers/{id}/points")
    public ResponseEntity<?> addPoints(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/loyalty/customers/" + id + "/points";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PostMapping("/loyalty/customers/{id}/redeem")
    public ResponseEntity<?> redeemPoints(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/loyalty/customers/" + id + "/redeem";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @GetMapping("/loyalty/customers/{id}/transactions")
    public ResponseEntity<?> getTransactions(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {

        String url = operationsServiceUrl + "/api/loyalty/customers/" + id + "/transactions";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/loyalty/rewards")
    public ResponseEntity<?> getRewards(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/loyalty/rewards";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/loyalty/stats")
    public ResponseEntity<?> getLoyaltyStats(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/loyalty/stats";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== KDS ====================

    @GetMapping("/kds/orders")
    public ResponseEntity<?> getKdsOrders(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId) {

        String url = operationsServiceUrl + "/api/kds/orders";
        HttpHeaders headers = createHeaders(authHeader, tenantId);
        if (branchId != null) {
            headers.set("X-Branch-ID", branchId);
        }

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @PutMapping("/kds/orders/{id}/status")
    public ResponseEntity<?> updateKdsOrderStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/kds/orders/" + id + "/status";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
    }

    @GetMapping("/kds/stats")
    public ResponseEntity<?> getKdsStats(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/kds/stats";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== RESERVATIONS ====================

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        try {
            String url = operationsServiceUrl + "/actuator/health";
            return restTemplate.getForEntity(url, Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Pong Error: " + e.getMessage());
        }
    }

    @GetMapping("/reservations")
    public ResponseEntity<?> getReservations(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String date) {

        try {
            String url = operationsServiceUrl + "/api/reservations" + (date != null ? "?date=" + date : "");
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting reservations: " + e.getMessage());
        }
    }

    @PostMapping("/reservations")
    public ResponseEntity<?> createReservation(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/reservations";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PutMapping("/reservations/{id}/status")
    public ResponseEntity<?> updateReservationStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/reservations/" + id + "/status";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
    }

    @GetMapping("/reservations/tables")
    public ResponseEntity<?> getTables(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/reservations/tables";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== SUBSCRIPTIONS ====================

    @GetMapping("/subscriptions")
    public ResponseEntity<?> getSubscriptions(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/subscriptions";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/subscriptions/plans")
    public ResponseEntity<?> getSubscriptionPlans(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/subscriptions/plans";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/subscriptions/deliveries")
    public ResponseEntity<?> getDeliveries(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String date) {

        String url = operationsServiceUrl + "/api/subscriptions/deliveries" + (date != null ? "?date=" + date : "");
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @PutMapping("/subscriptions/deliveries/{id}/status")
    public ResponseEntity<?> updateDeliveryStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/subscriptions/deliveries/" + id + "/status";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
    }

    // ==================== AUTOMATIONS ====================

    @GetMapping("/automations")
    public ResponseEntity<?> getAutomations(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        try {
            String url = operationsServiceUrl + "/api/automations";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting automations: " + e.getMessage());
        }
    }

    @PostMapping("/automations/{id}/toggle")
    public ResponseEntity<?> toggleAutomation(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {

        String url = operationsServiceUrl + "/api/automations/" + id + "/toggle";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/automations/config")
    public ResponseEntity<?> getAutomationConfig(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/automations/config";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @PostMapping("/automations/config")
    public ResponseEntity<?> saveAutomationConfig(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/automations/config";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @GetMapping("/automations/logs")
    public ResponseEntity<?> getAutomationLogs(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String automationId) {

        String url = operationsServiceUrl + "/api/automations/logs"
                + (automationId != null ? "?automationId=" + automationId : "");
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== HELPER ====================

    private HttpHeaders createHeaders(String authHeader, String tenantId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }
        if (tenantId != null) {
            headers.set("X-Tenant-ID", tenantId);
        }
        return headers;
    }
}
