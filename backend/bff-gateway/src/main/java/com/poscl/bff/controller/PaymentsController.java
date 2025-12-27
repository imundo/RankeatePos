package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for Payments Service (Cobros y Pagos)
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentsController {

    private final RestTemplate restTemplate;
    private final String paymentsServiceUrl;

    public PaymentsController(
            RestTemplate restTemplate,
            @Value("${services.payments.url}") String paymentsServiceUrl) {
        this.restTemplate = restTemplate;
        this.paymentsServiceUrl = paymentsServiceUrl;
    }

    // ==================== RECEIVABLES (Cuentas por Cobrar) ====================

    @GetMapping("/receivables")
    public ResponseEntity<?> getReceivables(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String status) {
        String url = paymentsServiceUrl + "/api/v1/receivables" + (status != null ? "?status=" + status : "");
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/receivables/summary")
    public ResponseEntity<?> getReceivablesSummary(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = paymentsServiceUrl + "/api/v1/receivables/summary";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/receivables/{id}/collect")
    public ResponseEntity<?> collectPayment(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        String url = paymentsServiceUrl + "/api/v1/receivables/" + id + "/collect";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    // ==================== PAYABLES (Cuentas por Pagar) ====================

    @GetMapping("/payables")
    public ResponseEntity<?> getPayables(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String status) {
        String url = paymentsServiceUrl + "/api/v1/payables" + (status != null ? "?status=" + status : "");
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/payables/summary")
    public ResponseEntity<?> getPayablesSummary(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = paymentsServiceUrl + "/api/v1/payables/summary";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/payables/{id}/pay")
    public ResponseEntity<?> makePayment(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        String url = paymentsServiceUrl + "/api/v1/payables/" + id + "/pay";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
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
