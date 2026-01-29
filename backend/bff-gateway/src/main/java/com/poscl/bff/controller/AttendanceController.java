package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for Attendance (Control de Asistencia)
 * Proxies requests to the operations-service
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final RestTemplate restTemplate;
    private final String operationsServiceUrl;

    public AttendanceController(
            RestTemplate restTemplate,
            @Value("${services.operations.url}") String operationsServiceUrl) {
        this.restTemplate = restTemplate;
        this.operationsServiceUrl = operationsServiceUrl;
    }

    @PostMapping("/clock-in")
    public ResponseEntity<?> clockIn(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, String> payload) {
        // Backend handles both clock-in and clock-out toggling logic
        String url = operationsServiceUrl + "/api/operations/attendance/clock-in";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(payload, createHeaders(authHeader, tenantId)), Object.class);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam int year,
            @RequestParam int month) {
        String url = operationsServiceUrl + "/api/operations/attendance/monthly?year=" + year + "&month=" + month;
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    // Alias for frontend compatibility if needed
    @GetMapping("/today")
    public ResponseEntity<?> getToday(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        // Ideally getting today's logs, but for now reuse history or return empty
        // Sending empty object for now as placeholder or redirect to history logic in
        // frontend
        return ResponseEntity.ok(Map.of("message", "Use /history endpoint"));
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
