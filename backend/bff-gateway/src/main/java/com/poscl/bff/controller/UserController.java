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

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Users Proxy", description = "Proxy for User Management endpoints")
public class UserController {

    private final WebClient authWebClient;
    private static final Duration PROXY_TIMEOUT = Duration.ofSeconds(30);

    @GetMapping
    @Operation(summary = "Proxy: Listar usuarios")
    public Mono<ResponseEntity<Map<String, Object>>> listUsers(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String uri = String.format("/api/users?page=%d&size=%d", page, size);
        if (search != null)
            uri += "&search=" + search;

        log.info("BFF: GET {}", uri);
        return authWebClient.get()
                .uri(uri)
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId) // Pass tenant context
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                })
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Proxy: Obtener usuario")
    public Mono<ResponseEntity<Map<String, Object>>> getUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
            @PathVariable UUID id) {

        log.info("BFF: GET /api/users/{}", id);
        return authWebClient.get()
                .uri("/api/users/" + id)
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                })
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @PostMapping
    @Operation(summary = "Proxy: Crear usuario")
    public Mono<ResponseEntity<Map<String, Object>>> createUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody Map<String, Object> request) {

        log.info("BFF: POST /api/users");
        return authWebClient.post()
                .uri("/api/users")
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                })
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response))
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Proxy: Actualizar usuario")
    public Mono<ResponseEntity<Map<String, Object>>> updateUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {

        log.info("BFF: PUT /api/users/{}", id);
        return authWebClient.put()
                .uri("/api/users/" + id)
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                })
                .map(ResponseEntity::ok)
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(this::handleProxyError);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Proxy: Eliminar usuario")
    public Mono<ResponseEntity<Void>> deleteUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable UUID id) {

        log.info("BFF: DELETE /api/users/{}", id);
        return authWebClient.delete()
                .uri("/api/users/" + id)
                .header("Authorization", authHeader)
                .header("X-Tenant-Id", tenantId)
                .header("X-User-Id", userId)
                .retrieve()
                .toBodilessEntity()
                .timeout(PROXY_TIMEOUT)
                .onErrorResume(e -> {
                    log.error("Error deleting user: {}", e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
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
