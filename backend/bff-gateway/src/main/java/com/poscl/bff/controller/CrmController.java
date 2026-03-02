package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for CRM Service (Accounts Receivable, RFM)
 * Proxies requests to the crm-service microservice
 */
@SuppressWarnings("null")
@RestController
@RequestMapping("/api/crm")
public class CrmController {

    private final RestTemplate restTemplate;
    private final String crmServiceUrl;

    public CrmController(
            RestTemplate restTemplate,
            @Value("${services.crm.url:http://crm-service:8088}") String crmServiceUrl) {
        this.restTemplate = restTemplate;
        this.crmServiceUrl = crmServiceUrl;
    }

    // ==================== CUSTOMER PROFILES / RFM ====================

    @GetMapping("/profiles")
    public ResponseEntity<?> getProfiles(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String url = crmServiceUrl + "/api/crm/profiles?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, (org.springframework.http.HttpMethod) HttpMethod.GET,
                    new HttpEntity<>((org.springframework.util.MultiValueMap<String, String>) headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting CRM profiles: " + e.getMessage());
        }
    }

    @GetMapping("/profiles/search")
    public ResponseEntity<?> searchProfiles(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String q) {
        try {
            String url = crmServiceUrl + "/api/crm/profiles/search?q=" + q;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, (org.springframework.http.HttpMethod) HttpMethod.GET,
                    new HttpEntity<>((org.springframework.util.MultiValueMap<String, String>) headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error searching CRM profiles: " + e.getMessage());
        }
    }

    @GetMapping("/profiles/{id}")
    public ResponseEntity<?> getProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = crmServiceUrl + "/api/crm/profiles/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, (org.springframework.http.HttpMethod) HttpMethod.GET,
                    new HttpEntity<>((org.springframework.util.MultiValueMap<String, String>) headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting Profile 360: " + e.getMessage());
        }
    }

    @PostMapping("/profiles")
    public ResponseEntity<?> createProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> body) {
        try {
            String url = crmServiceUrl + "/api/crm/profiles";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error creating profile: " + e.getMessage());
        }
    }

    @PutMapping("/profiles/{id}/limit")
    public ResponseEntity<?> updateCreditLimit(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            String url = crmServiceUrl + "/api/crm/profiles/" + id + "/limit";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, (org.springframework.http.HttpMethod) HttpMethod.PUT,
                    new HttpEntity<>(body, (org.springframework.util.MultiValueMap<String, String>) headers),
                    Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error updating credit limit: " + e.getMessage());
        }
    }

    // ==================== CREDIT (FIADO) ====================

    @GetMapping("/credit/debtors")
    public ResponseEntity<?> getDebtors(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String url = crmServiceUrl + "/api/crm/credit/debtors?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, (org.springframework.http.HttpMethod) HttpMethod.GET,
                    new HttpEntity<>((org.springframework.util.MultiValueMap<String, String>) headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting Debtors: " + e.getMessage());
        }
    }

    // Charge and Pay are accessed by frontend for adjusting or registering offline
    // payments
    @PostMapping("/credit/{id}/pay")
    public ResponseEntity<?> payCredit(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            String url = crmServiceUrl + "/api/crm/credit/" + id + "/pay";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error registering payment: " + e.getMessage());
        }
    }

    @GetMapping("/credit/{id}/history")
    public ResponseEntity<?> getHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = crmServiceUrl + "/api/crm/credit/" + id + "/history";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, (org.springframework.http.HttpMethod) HttpMethod.GET,
                    new HttpEntity<>((org.springframework.util.MultiValueMap<String, String>) headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting credit history: " + e.getMessage());
        }
    }

    private HttpHeaders createHeaders(String authHeader, String tenantId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        headers.set("X-Tenant-ID", tenantId);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
