package com.poscl.bff.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Admin Controller - Proxy to Auth Service Admin Endpoints
 * Handles admin requests and forwards them to auth-service
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin Proxy Endpoints")
public class AdminController {

    private final WebClient authWebClient;

    // Timeout for requests (Render cold start mitigation)
    private static final Duration PROXY_TIMEOUT = Duration.ofSeconds(60);

    // ==================== Platform Stats ====================

    @GetMapping("/stats")
    @Operation(summary = "Proxy: Estadísticas de plataforma")
    public Mono<ResponseEntity<Map<String, Object>>> getStats(@RequestHeader("Authorization") String authHeader) {
        log.info("BFF: GET /api/admin/stats");
        return forwardGetRequest("/api/admin/stats", authHeader);
    }

    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> getSystemHealth(
            @RequestHeader("Authorization") String authHeader) {
        return forwardGetRequest("/api/admin/health", authHeader);
    }

    // ==================== Tenant Management ====================

    @GetMapping("/tenants")
    @Operation(summary = "Proxy: Listar todos los tenants")
    public Mono<ResponseEntity<Map<String, Object>>> listTenants(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "10") int size,
            @RequestParam(required = false) String sort) {

        String uri = String.format("/api/admin/tenants?page=%d&size=%d", page, size);
        if (search != null)
            uri += "&search=" + search;
        if (status != null)
            uri += "&status=" + status;
        if (sort != null)
            uri += "&sort=" + sort;

        log.info("BFF: GET {}", uri);
        return forwardGetRequest(uri, authHeader);
    }

    @GetMapping("/tenants/{id}")
    @Operation(summary = "Proxy: Detalle de tenant")
    public Mono<ResponseEntity<Map<String, Object>>> getTenant(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id) {
        log.info("BFF: GET /api/admin/tenants/{}", id);
        return forwardGetRequest("/api/admin/tenants/" + id, authHeader);
    }

    @PostMapping("/tenants/wizard")
    @Operation(summary = "Proxy: Crear tenant con wizard")
    public Mono<ResponseEntity<Map<String, Object>>> createTenantWithWizard(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> request) {
        log.info("BFF: POST /api/admin/tenants/wizard");
        return forwardPostRequest("/api/admin/tenants/wizard", authHeader, request);
    }

    @PutMapping("/tenants/{id}")
    @Operation(summary = "Proxy: Actualizar tenant")
    public Mono<ResponseEntity<Map<String, Object>>> updateTenant(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        log.info("BFF: PUT /api/admin/tenants/{}", id);
        return forwardPutRequest("/api/admin/tenants/" + id, authHeader, request);
    }

    @PutMapping("/tenants/{id}/modules")
    @Operation(summary = "Proxy: Actualizar módulos de tenant")
    public Mono<ResponseEntity<Object>> updateTenantModules(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> modules) {
        log.info("BFF: PUT /api/admin/tenants/{}/modules", id);
        return authWebClient.put()
                .uri("/api/admin/tenants/" + id + "/modules")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(modules)
                .retrieve()
                .toEntity(Object.class) // Expecting List<String> but Object is safer for proxy
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(e -> handleProxyError(e, "Error updating tenant modules"));
    }

    @PutMapping("/tenants/{id}/status")
    @Operation(summary = "Proxy: Cambiar estado de tenant")
    public Mono<ResponseEntity<Map<String, Object>>> updateTenantStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        log.info("BFF: PUT /api/admin/tenants/{}/status", id);
        return forwardPutRequest("/api/admin/tenants/" + id + "/status", authHeader, request);
    }

    // ==================== Modules & Plans ====================

    @GetMapping("/modules")
    @Operation(summary = "Proxy: Listar módulos")
    public Mono<ResponseEntity<Object>> listModules(@RequestHeader("Authorization") String authHeader) {
        return authWebClient.get()
                .uri("/api/admin/modules")
                .header("Authorization", authHeader)
                .retrieve()
                .toEntity(Object.class)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(e -> handleProxyError(e, "Error fetching modules"));
    }

    @GetMapping("/modules/grouped")
    @Operation(summary = "Proxy: Listar módulos agrupados")
    public Mono<ResponseEntity<Map<String, Object>>> listModulesGrouped(
            @RequestHeader("Authorization") String authHeader) {
        return forwardGetRequest("/api/admin/modules/grouped", authHeader);
    }

    @GetMapping("/plans")
    @Operation(summary = "Proxy: Listar planes")
    public Mono<ResponseEntity<Object>> listPlans(@RequestHeader("Authorization") String authHeader) {
        return authWebClient.get()
                .uri("/api/admin/plans")
                .header("Authorization", authHeader)
                .retrieve()
                .toEntity(Object.class)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(e -> handleProxyError(e, "Error fetching plans"));
    }

    // ==================== User Management Proxy ====================

    @GetMapping("/users")
    public Mono<ResponseEntity<Map<String, Object>>> listUsers(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tenantId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "10") int size) {

        String uri = String.format("/api/admin/users?page=%d&size=%d", page, size);
        if (search != null)
            uri += "&search=" + search;
        if (tenantId != null)
            uri += "&tenantId=" + tenantId;

        return forwardGetRequest(uri, authHeader);
    }

    // ==================== Private Helpers ====================

    private Mono<ResponseEntity<Map<String, Object>>> forwardGetRequest(String uri, String authHeader) {
        return authWebClient.get()
                .uri(uri)
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                })
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(e -> handleProxyMapError(e, "Error finding resource"));
    }

    private Mono<ResponseEntity<Map<String, Object>>> forwardPostRequest(String uri, String authHeader, Object body) {
        return authWebClient.post()
                .uri(uri)
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                })
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(e -> handleProxyMapError(e, "Error creating resource"));
    }

    private Mono<ResponseEntity<Map<String, Object>>> forwardPutRequest(String uri, String authHeader, Object body) {
        return authWebClient.put()
                .uri(uri)
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                })
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(e -> handleProxyMapError(e, "Error updating resource"));
    }

    private Mono<ResponseEntity<Object>> handleProxyError(Throwable e, String defaultMessage) { // Generic Object
        return handleProxyErrorInternal(e, defaultMessage)
                .map(response -> (ResponseEntity<Object>) (ResponseEntity<?>) response);
    }

    // Helper to return Map for methods expecting Map
    private Mono<ResponseEntity<Map<String, Object>>> handleProxyMapError(Throwable e, String defaultMessage) {
        return handleProxyErrorInternal(e, defaultMessage);
    }

    private Mono<ResponseEntity<Map<String, Object>>> handleProxyErrorInternal(Throwable e, String defaultMessage) {
        log.error("BFF Proxy Error: {}", e.getMessage());
        if (e instanceof WebClientResponseException wcre) {
            return Mono.just(ResponseEntity
                    .status(wcre.getStatusCode())
                    .body(Map.of("error", wcre.getStatusText(), "message",
                            extractMessage(wcre.getResponseBodyAsString()))));
        }
        return Mono.just(ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Service Unavailable", "message", defaultMessage)));
    }

    private String extractMessage(String responseBody) {
        try {
            if (responseBody != null && responseBody.contains("\"message\":\"")) {
                int start = responseBody.indexOf("\"message\":\"") + 11;
                int end = responseBody.indexOf("\"", start);
                if (start > 10 && end > start) {
                    return responseBody.substring(start, end);
                }
            }
        } catch (Exception ignored) {
        }
        return "Error en servicio remoto";
    }
}
