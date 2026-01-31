package com.poscl.bff.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
@Slf4j
public class ConnectivityController {

    private final RestTemplate restTemplate;

    // Executor for parallel checks to avoid blocking on timeouts
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @Value("${services.auth.url}")
    private String authUrl;
    @Value("${services.catalog.url}")
    private String catalogUrl;
    @Value("${services.sales.url}")
    private String salesUrl;
    @Value("${services.billing.url}")
    private String billingUrl;
    @Value("${services.inventory.url}")
    private String inventoryUrl;
    @Value("${services.operations.url}")
    private String operationsUrl;
    @Value("${services.accounting.url}")
    private String accountingUrl;
    @Value("${services.payments.url}")
    private String paymentsUrl;
    @Value("${services.purchases.url}")
    private String purchasesUrl;
    @Value("${services.payroll.url}")
    private String payrollUrl;
    @Value("${services.marketing.url}")
    private String marketingUrl;

    @GetMapping("/connectivity")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> checkConnectivity() {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, String> services = new HashMap<>();
            services.put("auth-service", authUrl);
            services.put("catalog-service", catalogUrl);
            services.put("sales-service", salesUrl);
            services.put("billing-service", billingUrl);
            services.put("inventory-service", inventoryUrl);
            services.put("operations-service", operationsUrl);
            services.put("accounting-service", accountingUrl);
            services.put("payments-service", paymentsUrl);
            services.put("purchases-service", purchasesUrl);
            services.put("payroll-service", payrollUrl);
            services.put("marketing-service", marketingUrl);

            List<CompletableFuture<Map<String, Object>>> futures = new ArrayList<>();

            for (Map.Entry<String, String> entry : services.entrySet()) {
                futures.add(checkService(entry.getKey(), entry.getValue()));
            }

            // Wait for all checks
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            // Aggregate results
            Map<String, Object> results = new HashMap<>();
            results.put("bff-gateway", Map.of("status", "UP", "message", "pong"));

            // Map services to final result
            Map<String, Object> serviceStatuses = futures.stream()
                    .map(CompletableFuture::join)
                    .collect(Collectors.toMap(
                            m -> (String) m.get("service"),
                            m -> m));

            results.put("services", serviceStatuses);

            return ResponseEntity.ok(results);
        }, executor);
    }

    private CompletableFuture<Map<String, Object>> checkService(String serviceName, String baseUrl) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> status = new HashMap<>();
            status.put("service", serviceName);
            status.put("url", baseUrl);

            try {
                // Try /actuator/health first (std spring boot)
                String healthUrl = baseUrl + "/actuator/health";
                try {
                    ResponseEntity<String> response = restTemplate.getForEntity(healthUrl, String.class);
                    if (response.getStatusCode().is2xxSuccessful()) {
                        status.put("status", "UP");
                        status.put("response", "pong (via actuator)");
                        return status;
                    }
                } catch (Exception e) {
                    // Fallback to /health (custom controller)
                    String legacyHealthUrl = baseUrl + "/health";
                    try {
                        ResponseEntity<String> response = restTemplate.getForEntity(legacyHealthUrl, String.class);
                        if (response.getStatusCode().is2xxSuccessful()) {
                            status.put("status", "UP");
                            status.put("response", "pong (via /health)");
                            return status;
                        }
                    } catch (Exception ex2) {
                        // Fallback to /api/{service}/ping if known specific path?
                        // For now, failure here means DOWN
                        throw ex2;
                    }
                }

                status.put("status", "DOWN");
                status.put("error", "Non-200 response");
            } catch (Exception e) {
                status.put("status", "DOWN");
                status.put("error", e.getMessage());
            }
            return status;
        }, executor);
    }
}
