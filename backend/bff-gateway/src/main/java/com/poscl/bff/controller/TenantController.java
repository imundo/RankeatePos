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

@Slf4j
@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Tenants Proxy", description = "Proxy for Tenant endpoints")
public class TenantController {

    private final WebClient authWebClient;
    private static final Duration PROXY_TIMEOUT = Duration.ofSeconds(30);

    @GetMapping("/current")
    @Operation(summary = "Proxy: Obtener tenant actual")
    public Mono<ResponseEntity<Map<String, Object>>> getCurrentTenant(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        log.info("BFF: GET /api/tenants/current");
        return authWebClient.get()
                .uri("/api/tenants/current")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @PutMapping("/current")
    @Operation(summary = "Proxy: Actualizar tenant actual")
    public Mono<ResponseEntity<Map<String, Object>>> updateTenant(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Object> request) {

        log.info("BFF: PUT /api/tenants/current");
        return authWebClient.put()
                .uri("/api/tenants/current")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @PutMapping("/current/logo")
    @Operation(summary = "Proxy: Actualizar logo tenant actual")
    public Mono<ResponseEntity<Map<String, Object>>> updateLogo(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Object> request) {

        log.info("BFF: PUT /api/tenants/current/logo");
        return authWebClient.put()
                .uri("/api/tenants/current/logo")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @GetMapping("/current/configs")
    @Operation(summary = "Proxy: Obtener configs tenant actual")
    public Mono<ResponseEntity<Map<String, Object>>> getTenantConfigs(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        log.info("BFF: GET /api/tenants/current/configs");
        return authWebClient.get()
                .uri("/api/tenants/current/configs")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @PutMapping("/current/configs")
    @Operation(summary = "Proxy: Actualizar configs tenant actual")
    public Mono<ResponseEntity<Map<String, Object>>> updateTenantConfigs(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Object> request) {

        log.info("BFF: PUT /api/tenants/current/configs");
        return authWebClient.put()
                .uri("/api/tenants/current/configs")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @PutMapping("/current/branding")
    @Operation(summary = "Proxy: Actualizar branding tenant actual")
    public Mono<ResponseEntity<Map<String, Object>>> updateBranding(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Object> request) {

        log.info("BFF: PUT /api/tenants/current/branding");
        return authWebClient.put()
                .uri("/api/tenants/current/branding")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @GetMapping("/current/documents")
    @Operation(summary = "Proxy: Obtener documentos tenant actual")
    public Mono<ResponseEntity<java.util.List<Map<String, Object>>>> getDocuments(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        log.info("BFF: GET /api/tenants/current/documents");
        return authWebClient.get()
                .uri("/api/tenants/current/documents")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<java.util.List<Map<String, Object>>>() {})
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(e -> {
                    log.error("BFF Proxy Error: {}", e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(java.util.List.of()));
                });
    }

    @PostMapping("/current/documents")
    @Operation(summary = "Proxy: Agregar documento tenant actual")
    public Mono<ResponseEntity<Map<String, Object>>> addDocument(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Object> request) {

        log.info("BFF: POST /api/tenants/current/documents");
        return authWebClient.post()
                .uri("/api/tenants/current/documents")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @DeleteMapping("/current/documents/{id}")
    @Operation(summary = "Proxy: Eliminar documento tenant actual")
    public Mono<ResponseEntity<Void>> deleteDocument(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id) {

        log.info("BFF: DELETE /api/tenants/current/documents/{}", id);
        return authWebClient.delete()
                .uri("/api/tenants/current/documents/" + id)
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .toBodilessEntity()
                .map(res -> ResponseEntity.noContent().<Void>build())
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(e -> {
                    log.error("BFF Proxy Error: {}", e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
                });
    }

    // Helper for error handling
    private Mono<ResponseEntity<Map<String, Object>>> handleProxyError(Throwable e) {
        log.error("BFF Proxy Error: {}", e.getMessage());
        if (e instanceof WebClientResponseException wcre) {
            return Mono.just(ResponseEntity
                    .status(wcre.getStatusCode())
                    .body(Map.of("error", wcre.getStatusText(), "message", "Error remoto")));
        }
        return Mono.just(ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Service Unavailable", "message", "El servicio no responde")));
    }
}
