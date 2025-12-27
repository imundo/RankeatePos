package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for Payroll Service (Remuneraciones)
 */
@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final RestTemplate restTemplate;
    private final String payrollServiceUrl;

    public PayrollController(
            RestTemplate restTemplate,
            @Value("${services.payroll.url}") String payrollServiceUrl) {
        this.restTemplate = restTemplate;
        this.payrollServiceUrl = payrollServiceUrl;
    }

    // ==================== EMPLOYEES ====================

    @GetMapping("/employees")
    public ResponseEntity<?> getEmployees(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) Boolean active) {
        String url = payrollServiceUrl + "/api/v1/employees" + (active != null ? "?active=" + active : "");
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/employees")
    public ResponseEntity<?> createEmployee(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        String url = payrollServiceUrl + "/api/v1/employees";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<?> getEmployee(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = payrollServiceUrl + "/api/v1/employees/" + id;
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    // ==================== PAYROLL PERIODS ====================

    @GetMapping("/periods")
    public ResponseEntity<?> getPayrollPeriods(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = payrollServiceUrl + "/api/v1/payroll-periods";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/periods")
    public ResponseEntity<?> createPayrollPeriod(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        String url = payrollServiceUrl + "/api/v1/payroll-periods";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    @PostMapping("/periods/{id}/process")
    public ResponseEntity<?> processPayroll(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = payrollServiceUrl + "/api/v1/payroll-periods/" + id + "/process";
        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    // ==================== PAYSLIPS ====================

    @GetMapping("/periods/{periodId}/payslips")
    public ResponseEntity<?> getPayslips(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String periodId) {
        String url = payrollServiceUrl + "/api/v1/payroll-periods/" + periodId + "/payslips";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    // ==================== PREVIRED EXPORT ====================

    @GetMapping("/previred/{periodId}")
    public ResponseEntity<?> exportPrevired(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String periodId) {
        String url = payrollServiceUrl + "/api/v1/payroll/previred/" + periodId;
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                byte[].class);
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
