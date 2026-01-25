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
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Branches Proxy", description = "Proxy for Branch Management endpoints")
public class BranchController {

        private final WebClient authWebClient;
        private static final Duration PROXY_TIMEOUT = Duration.ofSeconds(30);

        @GetMapping
        @Operation(summary = "Proxy: Listar sucursales")
        public Mono<ResponseEntity<List<Object>>> getAllBranches(
                        @RequestHeader("Authorization") String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId) {

                log.info("BFF: GET /api/branches - TenantId: {}", tenantId);
                return authWebClient.get()
                                .uri("/api/branches")
                                .header("Authorization", authHeader)
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<List<Object>>() {
                                })
                                .map(ResponseEntity::ok)
                                .timeout(PROXY_TIMEOUT)
                                .onErrorResume(e -> {
                                        log.error("Error fetching branches: {}", e.getMessage());
                                        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
                                });
        }

        @GetMapping("/{id}")
        @Operation(summary = "Proxy: Obtener sucursal")
        public Mono<ResponseEntity<Map<String, Object>>> getBranchById(
                        @RequestHeader("Authorization") String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @PathVariable UUID id) {

                log.info("BFF: GET /api/branches/{}", id);
                return authWebClient.get()
                                .uri("/api/branches/" + id)
                                .header("Authorization", authHeader)
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                                })
                                .map(ResponseEntity::ok)
                                .timeout(PROXY_TIMEOUT)
                                .onErrorResume(this::handleProxyMapError);
        }

        @PostMapping
        @Operation(summary = "Proxy: Crear sucursal")
        public Mono<ResponseEntity<Map<String, Object>>> createBranch(
                        @RequestHeader("Authorization") String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @RequestBody Map<String, Object> request) {

                log.info("BFF: POST /api/branches");
                return authWebClient.post()
                                .uri("/api/branches")
                                .header("Authorization", authHeader)
                                .header("X-Tenant-Id", tenantId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(request)
                                .retrieve()
                                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                                })
                                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response))
                                .timeout(PROXY_TIMEOUT)
                                .onErrorResume(this::handleProxyMapError);
        }

        @PutMapping("/{id}")
        @Operation(summary = "Proxy: Actualizar sucursal")
        public Mono<ResponseEntity<Map<String, Object>>> updateBranch(
                        @RequestHeader("Authorization") String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @PathVariable UUID id,
                        @RequestBody Map<String, Object> request) {

                log.info("BFF: PUT /api/branches/{}", id);
                return authWebClient.put()
                                .uri("/api/branches/" + id)
                                .header("Authorization", authHeader)
                                .header("X-Tenant-Id", tenantId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(request)
                                .retrieve()
                                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                                })
                                .map(ResponseEntity::ok)
                                .timeout(PROXY_TIMEOUT)
                                .onErrorResume(this::handleProxyMapError);
        }

        @DeleteMapping("/{id}")
        @Operation(summary = "Proxy: Eliminar sucursal")
        public Mono<ResponseEntity<Void>> deleteBranch(
                        @RequestHeader("Authorization") String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @PathVariable UUID id) {

                log.info("BFF: DELETE /api/branches/{}", id);
                return authWebClient.delete()
                                .uri("/api/branches/" + id)
                                .header("Authorization", authHeader)
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .toBodilessEntity()
                                .timeout(PROXY_TIMEOUT)
                                .onErrorResume(e -> Mono
                                                .just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build()));
        }

        @PostMapping("/{id}/principal")
        @Operation(summary = "Proxy: Establecer sucursal principal")
        public Mono<ResponseEntity<Map<String, Object>>> setPrincipal(
                        @RequestHeader("Authorization") String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @PathVariable UUID id) {

                log.info("BFF: POST /api/branches/{}/principal", id);
                return authWebClient.post()
                                .uri("/api/branches/" + id + "/principal")
                                .header("Authorization", authHeader)
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                                })
                                .map(ResponseEntity::ok)
                                .timeout(PROXY_TIMEOUT)
                                .onErrorResume(this::handleProxyMapError);
        }

        private Mono<ResponseEntity<Map<String, Object>>> handleProxyMapError(Throwable e) {
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
