package com.poscl.bff.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.BodyInserters;
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

        @PostMapping("/api/products")
        @Operation(summary = "Create product", description = "Create a new product")
        public Mono<Map> createProduct(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
                        @RequestHeader(value = "X-User-Id", required = false) String userId,
                        @RequestBody Map<String, Object> request) {

                return catalogWebClient.post()
                                .uri("/api/products")
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                                .header("X-User-Id", userId != null ? userId : "")
                                .bodyValue(request)
                                .retrieve()
                                .bodyToMono(Map.class);
        }

        @PutMapping("/api/products/{id}")
        @Operation(summary = "Update product", description = "Update an existing product")
        public Mono<Map> updateProduct(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
                        @RequestHeader(value = "X-User-Id", required = false) String userId,
                        @PathVariable String id,
                        @RequestBody Map<String, Object> request) {

                return catalogWebClient.put()
                                .uri("/api/products/" + id)
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                                .header("X-User-Id", userId != null ? userId : "")
                                .bodyValue(request)
                                .retrieve()
                                .bodyToMono(Map.class);
        }

        @DeleteMapping("/api/products/{id}")
        @Operation(summary = "Delete product", description = "Delete a product by ID")
        public Mono<Void> deleteProduct(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
                        @RequestHeader(value = "X-User-Id", required = false) String userId,
                        @PathVariable String id) {

                return catalogWebClient.delete()
                                .uri("/api/products/" + id)
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                                .header("X-User-Id", userId != null ? userId : "")
                                .retrieve()
                                .bodyToMono(Void.class);
        }

        // =====================================================
        // IMAGES ENDPOINTS
        // =====================================================

        @PostMapping(value = "/api/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @Operation(summary = "Upload image", description = "Upload a product image")
        public Mono<Map> uploadImage(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
                        @RequestParam("file") MultipartFile file) {

                log.info("BFF: POST /api/images/upload - file={}, size={}", file.getOriginalFilename(), file.getSize());

                MultipartBodyBuilder builder = new MultipartBodyBuilder();
                try {
                        org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(file.getBytes()) {
                                @Override
                                public String getFilename() {
                                        return file.getOriginalFilename();
                                }
                        };
                        builder.part("file", resource)
                                .filename(file.getOriginalFilename())
                                .header("Content-Type", file.getContentType());
                } catch (java.io.IOException e) {
                        log.error("Error reading file", e);
                        return Mono.error(new RuntimeException("Error reading file", e));
                }

                return catalogWebClient.post()
                                .uri("/api/images/upload")
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                                .body(BodyInserters.fromMultipartData(builder.build()))
                                .retrieve()
                                .bodyToMono(Map.class)
                                .map(response -> {
                                        String fileName = (String) response.get("fileName");
                                        if (fileName != null) {
                                                // Create a public URL pointing to the BFF
                                                String publicUrl = "https://pos-bff-gateway-production.up.railway.app/api/images/" + fileName;
                                                response.put("url", publicUrl);
                                        }
                                        return response;
                                })
                                .onErrorResume(org.springframework.web.reactive.function.client.WebClientResponseException.class, ex -> {
                                        log.error("Error from catalog-service: {}", ex.getResponseBodyAsString());
                                        return Mono.error(new RuntimeException("Catalog Error: " + ex.getResponseBodyAsString()));
                                });
        }

        @GetMapping("/api/images/{fileName}")
        @Operation(summary = "Get image", description = "Get a product image")
        public Mono<org.springframework.http.ResponseEntity<org.springframework.core.io.Resource>> getImage(@PathVariable String fileName) {
                return catalogWebClient.get()
                                .uri("/api/images/" + fileName)
                                .retrieve()
                                .toEntity(org.springframework.core.io.Resource.class);
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

        @PostMapping("/api/categories")
        @Operation(summary = "Create category", description = "Create a new category")
        public Mono<Map> createCategory(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
                        @RequestHeader(value = "X-User-Id", required = false) String userId,
                        @RequestBody Map<String, Object> request) {

                return catalogWebClient.post()
                                .uri("/api/categories")
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                                .header("X-User-Id", userId != null ? userId : "")
                                .bodyValue(request)
                                .retrieve()
                                .bodyToMono(Map.class);
        }

        @PutMapping("/api/categories/{id}")
        @Operation(summary = "Update category", description = "Update an existing category")
        public Mono<Map> updateCategory(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
                        @RequestHeader(value = "X-User-Id", required = false) String userId,
                        @PathVariable String id,
                        @RequestBody Map<String, Object> request) {

                return catalogWebClient.put()
                                .uri("/api/categories/" + id)
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                                .header("X-User-Id", userId != null ? userId : "")
                                .bodyValue(request)
                                .retrieve()
                                .bodyToMono(Map.class);
        }

        @DeleteMapping("/api/categories/{id}")
        @Operation(summary = "Delete category", description = "Delete a category")
        public Mono<Void> deleteCategory(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
                        @RequestHeader(value = "X-User-Id", required = false) String userId,
                        @PathVariable String id) {

                return catalogWebClient.delete()
                                .uri("/api/categories/" + id)
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                                .header("X-User-Id", userId != null ? userId : "")
                                .retrieve()
                                .bodyToMono(Void.class);
        }

        @GetMapping("/api/taxes")
        @Operation(summary = "List taxes", description = "Get all taxes for tenant")
        public Mono<List> listTaxes(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId) {

                if (tenantId == null) {
                        return Mono.just(Collections.emptyList());
                }

                return catalogWebClient.get()
                                .uri("/api/taxes")
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(List.class)
                                .doOnError(e -> log.error("Error fetching taxes: {}", e.getMessage()))
                                .onErrorReturn(Collections.emptyList());
        }

        @PostMapping("/api/taxes")
        @Operation(summary = "Create tax", description = "Create a new tax")
        public Mono<Map> createTax(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
                        @RequestHeader(value = "X-User-Id", required = false) String userId,
                        @RequestBody Map<String, Object> request) {

                return catalogWebClient.post()
                                .uri("/api/taxes")
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                                .header("X-User-Id", userId != null ? userId : "")
                                .bodyValue(request)
                                .retrieve()
                                .bodyToMono(Map.class);
        }

        @PutMapping("/api/taxes/{id}")
        @Operation(summary = "Update tax", description = "Update an existing tax")
        public Mono<Map> updateTax(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
                        @RequestHeader(value = "X-User-Id", required = false) String userId,
                        @PathVariable String id,
                        @RequestBody Map<String, Object> request) {

                return catalogWebClient.put()
                                .uri("/api/taxes/" + id)
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                                .header("X-User-Id", userId != null ? userId : "")
                                .bodyValue(request)
                                .retrieve()
                                .bodyToMono(Map.class);
        }

        @DeleteMapping("/api/taxes/{id}")
        @Operation(summary = "Delete tax", description = "Delete a tax")
        public Mono<Void> deleteTax(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
                        @RequestHeader(value = "X-User-Id", required = false) String userId,
                        @PathVariable String id) {

                return catalogWebClient.delete()
                                .uri("/api/taxes/" + id)
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId != null ? tenantId : "")
                                .header("X-User-Id", userId != null ? userId : "")
                                .retrieve()
                                .bodyToMono(Void.class);
        }
}
