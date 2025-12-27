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

    // ==================== REPORTS ====================

    @GetMapping("/reports/balance-sheet")
    public ResponseEntity<?> getBalanceSheet(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String asOfDate) {
        String url = accountingServiceUrl + "/api/v1/reports/balance-sheet"
                + (asOfDate != null ? "?asOfDate=" + asOfDate : "");
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
                byte[].class);
    }

    @GetMapping("/reports/income-statement")
    public ResponseEntity<?> getIncomeStatement(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        StringBuilder urlBuilder = new StringBuilder(accountingServiceUrl + "/api/v1/reports/income-statement");
        if (fromDate != null || toDate != null) {
            urlBuilder.append("?");
            if (fromDate != null)
                urlBuilder.append("fromDate=").append(fromDate);
            if (fromDate != null && toDate != null)
                urlBuilder.append("&");
            if (toDate != null)
                urlBuilder.append("toDate=").append(toDate);
        }
        return restTemplate.exchange(urlBuilder.toString(), HttpMethod.GET,
                new HttpEntity<>(createHeaders(authHeader, tenantId)),
                byte[].class);
    }

    @GetMapping("/accounts/balances")
    public ResponseEntity<?> getAccountBalances(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        String url = accountingServiceUrl + "/api/v1/accounts/balances";
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(createHeaders(authHeader, tenantId)),
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
