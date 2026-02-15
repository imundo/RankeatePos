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

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Suppliers", description = "Supplier management")
public class SupplierController {

        private final WebClient catalogWebClient;

        @GetMapping
        @Operation(summary = "Get suppliers", description = "Get paginated list of suppliers")
        public Mono<Map> getSuppliers(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @RequestParam(required = false) String filter,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                log.debug("BFF: GET /api/suppliers");

                return catalogWebClient.get()
                                .uri(uriBuilder -> uriBuilder
                                                .path("/api/suppliers")
                                                .queryParam("page", page)
                                                .queryParam("size", size)
                                                .queryParamIfPresent("filter", java.util.Optional.ofNullable(filter))
                                                .build())
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(Map.class)
                                .onErrorReturn(Collections.emptyMap());
        }

        @GetMapping("/active")
        @Operation(summary = "Get all active suppliers", description = "Get list of all active suppliers for dropdowns")
        public Mono<List> getAllActiveSuppliers(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId) {

                return catalogWebClient.get()
                                .uri("/api/suppliers/active")
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(List.class)
                                .onErrorReturn(Collections.emptyList());
        }

        @GetMapping("/{id}")
        @Operation(summary = "Get supplier", description = "Get supplier by ID")
        public Mono<Map> getSupplier(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @PathVariable String id) {

                return catalogWebClient.get()
                                .uri("/api/suppliers/" + id)
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(Map.class);
        }

        @PostMapping
        @Operation(summary = "Create supplier", description = "Create a new supplier")
        public Mono<Map> createSupplier(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @RequestBody Map<String, Object> supplierDto) {

                return catalogWebClient.post()
                                .uri("/api/suppliers")
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .bodyValue(supplierDto)
                                .retrieve()
                                .bodyToMono(Map.class);
        }

        @PutMapping("/{id}")
        @Operation(summary = "Update supplier", description = "Update an existing supplier")
        public Mono<Map> updateSupplier(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @PathVariable String id,
                        @RequestBody Map<String, Object> supplierDto) {

                return catalogWebClient.put()
                                .uri("/api/suppliers/" + id)
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .bodyValue(supplierDto)
                                .retrieve()
                                .bodyToMono(Map.class);
        }

        @DeleteMapping("/{id}")
        @Operation(summary = "Delete supplier", description = "Soft delete a supplier")
        public Mono<Void> deleteSupplier(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @PathVariable String id) {

                return catalogWebClient.delete()
                                .uri("/api/suppliers/" + id)
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(Void.class);
        }

        @GetMapping("/{id}/products")
        @Operation(summary = "Get supplier products", description = "Get products assigned to a supplier")
        public Mono<List> getSupplierProducts(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @PathVariable String id) {

                return catalogWebClient.get()
                                .uri("/api/suppliers/" + id + "/products")
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(List.class)
                                .onErrorReturn(Collections.emptyList());
        }

        @PostMapping("/{id}/products")
        @Operation(summary = "Add supplier product", description = "Assign product to supplier")
        public Mono<Void> addSupplierProduct(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @PathVariable String id,
                        @RequestBody Map<String, Object> dto) {

                return catalogWebClient.post()
                                .uri("/api/suppliers/" + id + "/products")
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .bodyValue(dto)
                                .retrieve()
                                .bodyToMono(Void.class);
        }

        @DeleteMapping("/{id}/products/{variantId}")
        @Operation(summary = "Remove supplier product", description = "Remove product assignment from supplier")
        public Mono<Void> removeSupplierProduct(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @PathVariable String id,
                        @PathVariable String variantId) {

                return catalogWebClient.delete()
                                .uri("/api/suppliers/" + id + "/products/" + variantId)
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(Void.class);
        }
}
