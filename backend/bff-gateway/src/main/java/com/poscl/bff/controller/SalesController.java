package com.poscl.bff.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Sales Controller - Proxy to Sales Service
 * Routes /api/sales/* to sales-service
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Sales", description = "Sales proxy endpoints")
public class SalesController {

    private final WebClient salesWebClient;

    // =====================================================
    // SALES ENDPOINTS
    // =====================================================

    @GetMapping("/api/sales")
    @Operation(summary = "List sales", description = "Get sales with pagination")
    public Mono<Map> listSales(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.debug("BFF: GET /api/sales");
        
        return salesWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/sales")
                        .queryParam("page", page)
                        .queryParam("size", size)
                        .build())
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorReturn(Collections.emptyMap());
    }

    @PostMapping("/api/sales")
    @Operation(summary = "Create sale", description = "Create a new sale")
    public Mono<Map> createSale(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, Object> saleRequest) {
        
        log.info("BFF: POST /api/sales");
        
        return salesWebClient.post()
                .uri("/api/sales")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(saleRequest)
                .retrieve()
                .bodyToMono(Map.class);
    }

    @GetMapping("/api/sales/{id}")
    @Operation(summary = "Get sale", description = "Get sale by ID")
    public Mono<Map> getSale(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {
        
        return salesWebClient.get()
                .uri("/api/sales/" + id)
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Map.class);
    }

    // =====================================================
    // CASH SESSION ENDPOINTS
    // =====================================================

    @GetMapping("/api/cash-sessions/current")
    @Operation(summary = "Get current session", description = "Get current open cash session")
    public Mono<Map> getCurrentSession(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        
        log.debug("BFF: GET /api/cash-sessions/current");
        
        return salesWebClient.get()
                .uri("/api/cash-sessions/current")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId != null ? userId : "")
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorReturn(Collections.emptyMap());
    }

    @PostMapping("/api/cash-sessions/open")
    @Operation(summary = "Open session", description = "Open a new cash session")
    public Mono<Map> openSession(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, Object> request) {
        
        log.info("BFF: POST /api/cash-sessions/open");
        
        return salesWebClient.post()
                .uri("/api/cash-sessions/open")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class);
    }

    @PostMapping("/api/cash-sessions/{id}/close")
    @Operation(summary = "Close session", description = "Close a cash session")
    public Mono<Map> closeSession(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        
        log.info("BFF: POST /api/cash-sessions/{}/close", id);
        
        return salesWebClient.post()
                .uri("/api/cash-sessions/" + id + "/close")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class);
    }

    // =====================================================
    // DASHBOARD STATS
    // =====================================================

    @GetMapping("/api/dashboard/stats")
    @Operation(summary = "Dashboard stats", description = "Get dashboard statistics")
    public Mono<Map> getDashboardStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        log.debug("BFF: GET /api/dashboard/stats");
        
        // For now return mock data - later integrate with sales-service
        return Mono.just(Map.of(
            "ventasHoy", 125400,
            "transacciones", 23,
            "topProducto", "Pan Marraqueta",
            "stockBajo", 3
        ));
    }
}
