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

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Stock", description = "Stock proxy endpoints (Inventory Service)")
public class StockController {

    private final WebClient inventoryWebClient;

    @GetMapping("/api/stock")
    @Operation(summary = "List stock", description = "List stock for branch")
    public Mono<List> getStockByBranch(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam String branchId) {

        return inventoryWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/stock")
                        .queryParam("branchId", branchId)
                        .build())
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(List.class)
                .onErrorReturn(Collections.emptyList());
    }

    @GetMapping("/api/stock/low")
    @Operation(summary = "Low stock", description = "List low stock products")
    public Mono<List> getLowStock(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam String branchId) {

        return inventoryWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/stock/low")
                        .queryParam("branchId", branchId)
                        .build())
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(List.class)
                .onErrorReturn(Collections.emptyList());
    }

    @GetMapping("/api/stock/low/count")
    @Operation(summary = "Count low stock", description = "Count products with low stock")
    public Mono<Long> countLowStock(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        return inventoryWebClient.get()
                .uri("/api/stock/low/count")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Long.class)
                .onErrorReturn(0L);
    }

    @GetMapping("/api/stock/{variantId}")
    @Operation(summary = "Get stock", description = "Get stock for variant")
    public Mono<Map> getStock(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String variantId,
            @RequestParam String branchId) {

        return inventoryWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/stock/" + variantId)
                        .queryParam("branchId", branchId)
                        .build())
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Map.class);
    }

    @PostMapping("/api/stock/adjust")
    @Operation(summary = "Adjust stock", description = "Adjust stock level")
    public Mono<Map> adjustStock(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, Object> request) {

        log.info("BFF: POST /api/stock/adjust");

        return inventoryWebClient.post()
                .uri("/api/stock/adjust")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class);
    }

    @GetMapping("/api/stock/movements")
    @Operation(summary = "Get movements", description = "Get stock movements")
    public Mono<Map> getMovements(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam String branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return inventoryWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/stock/movements")
                        .queryParam("branchId", branchId)
                        .queryParam("page", page)
                        .queryParam("size", size)
                        .build())
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorReturn(Collections.emptyMap());
    }

    @GetMapping("/api/stock/kardex/{variantId}")
    @Operation(summary = "Get kardex", description = "Get kardex for variant")
    public Mono<List> getKardex(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String variantId) {

        return inventoryWebClient.get()
                .uri("/api/stock/kardex/" + variantId)
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(List.class)
                .onErrorReturn(Collections.emptyList());
    }
}
