package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for Employee Management
 * Proxies requests to the operations-service
 */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final RestTemplate restTemplate;
    private final String operationsServiceUrl;

    public EmployeeController(
            RestTemplate restTemplate,
            @Value("${services.operations.url}") String operationsServiceUrl) {
        this.restTemplate = restTemplate;
        this.operationsServiceUrl = operationsServiceUrl;
    }

    // ==================== EMPLOYEES CRUD ====================

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "true") boolean activeOnly) {

        String url = operationsServiceUrl + "/api/employees?page=" + page + "&size=" + size + "&activeOnly="
                + activeOnly;
        if (search != null) {
            url += "&search=" + search;
        }
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/list")
    public ResponseEntity<?> getAllActive(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = operationsServiceUrl + "/api/employees/list";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = operationsServiceUrl + "/api/employees/" + id;
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        String url = operationsServiceUrl + "/api/employees";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        String url = operationsServiceUrl + "/api/employees/" + id;
        return restTemplate.exchange(url, HttpMethod.PUT,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivate(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestParam(required = false) String reason) {
        String url = operationsServiceUrl + "/api/employees/" + id + (reason != null ? "?reason=" + reason : "");
        return restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/{id}/regenerate-pin")
    public ResponseEntity<?> regeneratePin(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = operationsServiceUrl + "/api/employees/" + id + "/regenerate-pin";
        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(null, createHeaders(authHeader, tenantId)),
                Object.class);
    }

    // ==================== RELATED DATA ====================

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = operationsServiceUrl + "/api/employees/stats";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/{id}/payroll-config")
    public ResponseEntity<?> getPayrollConfig(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = operationsServiceUrl + "/api/employees/" + id + "/payroll-config";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PutMapping("/{id}/payroll-config")
    public ResponseEntity<?> updatePayrollConfig(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        String url = operationsServiceUrl + "/api/employees/" + id + "/payroll-config";
        return restTemplate.exchange(url, HttpMethod.PUT,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    @GetMapping("/{id}/documents")
    public ResponseEntity<?> getDocuments(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = operationsServiceUrl + "/api/employees/" + id + "/documents";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/{id}/documents")
    public ResponseEntity<?> addDocument(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        String url = operationsServiceUrl + "/api/employees/" + id + "/documents";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    @DeleteMapping("/documents/{docId}")
    public ResponseEntity<?> deleteDocument(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String docId) {
        String url = operationsServiceUrl + "/api/employees/documents/" + docId;
        return restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = operationsServiceUrl + "/api/employees/" + id + "/history";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/{id}/leave-balance")
    public ResponseEntity<?> getLeaveBalance(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = operationsServiceUrl + "/api/employees/" + id + "/leave-balance";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    private HttpHeaders createHeaders(String authHeader, String tenantId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authHeader != null)
            headers.set("Authorization", authHeader);
        if (tenantId != null)
            headers.set("X-Tenant-ID", tenantId);
        return headers;
    }
}
