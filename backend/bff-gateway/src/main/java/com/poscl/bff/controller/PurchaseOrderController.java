package com.poscl.bff.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Purchase Orders", description = "Purchase Order management")
public class PurchaseOrderController {

    private final WebClient catalogWebClient;

    @GetMapping
    @Operation(summary = "Get purchase orders")
    public Mono<Map> getPurchaseOrders(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return catalogWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/orders")
                        .queryParam("page", page)
                        .queryParam("size", size)
                        .build())
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorReturn(Collections.emptyMap());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase order")
    public Mono<Map> getPurchaseOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {

        return catalogWebClient.get()
                .uri("/api/orders/" + id)
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Map.class);
    }

    @PostMapping
    @Operation(summary = "Create purchase order")
    public Mono<Map> createPurchaseOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Object> request) {

        return catalogWebClient.post()
                .uri("/api/orders")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete purchase order")
    public Mono<Void> deletePurchaseOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {

        return catalogWebClient.delete()
                .uri("/api/orders/" + id)
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Void.class);
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit purchase order")
    public Mono<Map> submitPurchaseOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {

        return catalogWebClient.post()
                .uri("/api/orders/" + id + "/submit")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Map.class);
    }

    @PostMapping("/{id}/receive")
    @Operation(summary = "Receive purchase order")
    public Mono<Map> receivePurchaseOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {

        return catalogWebClient.post()
                .uri("/api/orders/" + id + "/receive")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Map.class);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel purchase order")
    public Mono<Map> cancelPurchaseOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {

        return catalogWebClient.post()
                .uri("/api/orders/" + id + "/cancel")
                .header("Authorization", authHeader != null ? authHeader : "")
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(Map.class);
    }
}
