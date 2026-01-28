package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for Leave Management (Vacaciones y Permisos)
 * Proxies requests to the operations-service
 */
@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final RestTemplate restTemplate;
    private final String operationsServiceUrl;

    public LeaveController(
            RestTemplate restTemplate,
            @Value("${services.operations.url}") String operationsServiceUrl) {
        this.restTemplate = restTemplate;
        this.operationsServiceUrl = operationsServiceUrl;
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String url = operationsServiceUrl + "/api/leaves?page=" + page + "&size=" + size;
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPending(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = operationsServiceUrl + "/api/leaves/pending";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getByEmployee(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String url = operationsServiceUrl + "/api/leaves/employee/" + employeeId + "?page=" + page + "&size=" + size;
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        String url = operationsServiceUrl + "/api/leaves";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = operationsServiceUrl + "/api/leaves/" + id + "/approve";
        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(null, createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestParam String reason) {
        String url = operationsServiceUrl + "/api/leaves/" + id + "/reject?reason=" + reason;
        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(null, createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = operationsServiceUrl + "/api/leaves/" + id + "/cancel";
        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(null, createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = operationsServiceUrl + "/api/leaves/stats";
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
