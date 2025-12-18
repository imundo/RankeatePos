package com.poscl.bff.controller;

import com.poscl.bff.dto.PosSyncResponse;
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
 * POS Controller - Aggregated endpoints for POS Frontend
 * This is the main BFF pattern implementation
 */
@Slf4j
@RestController
@RequestMapping("/api/pos")
@RequiredArgsConstructor
@Tag(name = "POS", description = "Aggregated POS endpoints")
public class PosController {

    private final WebClient catalogWebClient;
    private final WebClient salesWebClient;

    /**
     * Main sync endpoint - aggregates products, categories, and current session
     * This is the KEY BFF endpoint that consolidates multiple service calls
     */
    @GetMapping("/sync")
    @Operation(summary = "Sync POS data", description = "Get all data needed for POS in a single call")
    public Mono<PosSyncResponse> syncPosData(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-Branch-Id", required = false) String branchId) {
        
        log.info("BFF: GET /api/pos/sync - tenant={}", tenantId);
        
        // Parallel calls to catalog and sales services
        Mono<List> productsMono = catalogWebClient.get()
                .uri("/api/products/sync")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(List.class)
                .onErrorReturn(Collections.emptyList());
        
        Mono<List> categoriesMono = catalogWebClient.get()
                .uri("/api/categories")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(List.class)
                .onErrorReturn(Collections.emptyList());
        
        Mono<Map> sessionMono = Mono.empty();
        if (userId != null) {
            sessionMono = salesWebClient.get()
                    .uri("/api/cash-sessions/current")
                    .header("Authorization", authHeader)
                    .header("X-Tenant-Id", tenantId)
                    .header("X-User-Id", userId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .onErrorReturn(Collections.emptyMap());
        }
        
        // Combine all results
        return Mono.zip(productsMono, categoriesMono, sessionMono.defaultIfEmpty(Collections.emptyMap()))
                .map(tuple -> PosSyncResponse.builder()
                        .products(tuple.getT1())
                        .categories(tuple.getT2())
                        .currentSession(tuple.getT3().isEmpty() ? null : tuple.getT3())
                        .build());
    }

    /**
     * Get products only (for catalog views)
     */
    @GetMapping("/products")
    @Operation(summary = "Get products", description = "Get all products for the tenant")
    public Mono<List> getProducts(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        log.debug("BFF: GET /api/pos/products");
        
        return catalogWebClient.get()
                .uri("/api/products/sync")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(List.class)
                .onErrorReturn(Collections.emptyList());
    }

    /**
     * Get categories
     */
    @GetMapping("/categories")
    @Operation(summary = "Get categories", description = "Get all categories for the tenant")
    public Mono<List> getCategories(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        log.debug("BFF: GET /api/pos/categories");
        
        return catalogWebClient.get()
                .uri("/api/categories")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(List.class)
                .onErrorReturn(Collections.emptyList());
    }

    /**
     * Create sale
     */
    @PostMapping("/sales")
    @Operation(summary = "Create sale", description = "Create a new sale")
    public Mono<Map> createSale(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, Object> saleRequest) {
        
        log.info("BFF: POST /api/pos/sales");
        
        return salesWebClient.post()
                .uri("/api/sales")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(saleRequest)
                .retrieve()
                .bodyToMono(Map.class);
    }
}
