package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for Accounting Service
 */
@RestController
@RequestMapping("/api/accounting")
public class AccountingController {

    private final RestTemplate restTemplate;
    private final String accountingServiceUrl;

    public AccountingController(
            RestTemplate restTemplate,
            @Value("${services.accounting.url}") String accountingServiceUrl) {
        this.restTemplate = restTemplate;
        this.accountingServiceUrl = accountingServiceUrl;
    }

    // ==================== ACCOUNTS ====================

    @GetMapping("/accounts")
    public ResponseEntity<?> getAccounts(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = accountingServiceUrl + "/api/v1/accounts";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @GetMapping("/accounts/tree")
    public ResponseEntity<?> getAccountsTree(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = accountingServiceUrl + "/api/v1/accounts/tree";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/accounts")
    public ResponseEntity<?> createAccount(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        String url = accountingServiceUrl + "/api/v1/accounts";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    // ==================== JOURNAL ENTRIES ====================

    @GetMapping("/journal")
    public ResponseEntity<?> getJournalEntries(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String url = accountingServiceUrl + "/api/v1/journal?page=" + page + "&size=" + size;
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                Object.class);
    }

    @PostMapping("/journal")
    public ResponseEntity<?> createJournalEntry(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        String url = accountingServiceUrl + "/api/v1/journal";
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(request, createHeaders(authHeader, tenantId)), Object.class);
    }

    @PostMapping("/journal/{id}/post")
    public ResponseEntity<?> postJournalEntry(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        String url = accountingServiceUrl + "/api/v1/journal/" + id + "/post";
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
