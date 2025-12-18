package com.poscl.bff.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Catalog Controller - Proxy to Catalog Service
 * Routes /api/products/* and /api/categories/* to catalog-service
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Catalog", description = "Catalog proxy endpoints")
public class CatalogController {

    private final WebClient catalogWebClient;

    // =====================================================
    // PRODUCTS ENDPOINTS
    // =====================================================

    @GetMapping("/api/products/sync")
    @Operation(summary = "Sync products", description = "Get all products for POS sync")
    public Mono<List> syncProducts(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId) {
        
        log.info("BFF: GET /api/products/sync - tenant={}", tenantId);
        
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("X-Tenant-Id header is missing");
            return Mono.just(Collections.emptyList());
        }
        
        return catalogWebClient.get()
                .uri("/api/products/sync")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(List.class)
                .doOnError(e -> log.error("Error fetching products: {}", e.getMessage()))
                .onErrorReturn(Collections.emptyList());
    }

    @GetMapping("/api/products")
    @Operation(summary = "List products", description = "List products with pagination")
    public Mono<Map> listProducts(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.debug("BFF: GET /api/products - search={}", search);
        
        return catalogWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/products")
                        .queryParam("page", page)
                        .queryParam("size", size)
                        .queryParamIfPresent("search", java.util.Optional.ofNullable(search))
                        .build())
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorReturn(Collections.emptyMap());
    }

    @GetMapping("/api/products/{id}")
    @Operation(summary = "Get product", description = "Get product by ID")
    public Mono<Map> getProduct(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {
        
        return catalogWebClient.get()
                .uri("/api/products/" + id)
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Map.class);
    }

    // =====================================================
    // CATEGORIES ENDPOINTS
    // =====================================================

    @GetMapping("/api/categories")
    @Operation(summary = "List categories", description = "Get all categories")
    public Mono<List> listCategories(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId) {
        
        log.debug("BFF: GET /api/categories - tenant={}", tenantId);
        
        if (tenantId == null || tenantId.isEmpty()) {
            return Mono.just(Collections.emptyList());
        }
        
        return catalogWebClient.get()
                .uri("/api/categories")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(List.class)
                .onErrorReturn(Collections.emptyList());
    }

    @GetMapping("/api/categories/{id}")
    @Operation(summary = "Get category", description = "Get category by ID")
    public Mono<Map> getCategory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {
        
        return catalogWebClient.get()
                .uri("/api/categories/" + id)
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Map.class);
    }

    // =====================================================
    // STOCK ENDPOINTS
    // =====================================================

    @GetMapping("/api/stock")
    @Operation(summary = "Get stock", description = "Get stock for branch")
    public Mono<Map> getStock(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader(value = "X-Branch-Id", required = false) String branchId) {
        
        return catalogWebClient.get()
                .uri("/api/stock")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .header("X-Branch-Id", branchId != null ? branchId : "")
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorReturn(Collections.emptyMap());
    }
}
