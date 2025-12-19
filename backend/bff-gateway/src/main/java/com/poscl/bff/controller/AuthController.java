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

/**
 * Auth Controller - Proxy to Auth Service
 * Handles authentication requests with proper error handling for Render cold
 * starts
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication endpoints")
public class AuthController {

    private final WebClient authWebClient;

    // Timeout for auth requests (Render cold start can take up to 60s)
    private static final Duration AUTH_TIMEOUT = Duration.ofSeconds(65);

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate user and get JWT token")
    public Mono<ResponseEntity<Map>> login(@RequestBody Map<String, Object> request) {
        log.info("BFF: POST /api/auth/login - email: {}", request.get("email"));

        return authWebClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(AUTH_TIMEOUT)
                .map(response -> {
                    log.info("Login successful for: {}", request.get("email"));
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(WebClientResponseException.class, e -> {
                    log.error("Auth service error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .body(Map.of(
                                    "error", e.getStatusText(),
                                    "message", extractMessage(e.getResponseBodyAsString()))));
                })
                .onErrorResume(Exception.class, e -> {
                    log.error("BFF error during login: {}", e.getMessage(), e);
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(Map.of(
                                    "error", "Service Unavailable",
                                    "message",
                                    "El servicio de autenticación no está disponible. Por favor intente nuevamente en unos segundos.")));
                });
    }

    @PostMapping("/register")
    @Operation(summary = "Register", description = "Register new company")
    public Mono<ResponseEntity<Map>> register(@RequestBody Map<String, Object> request) {
        log.info("BFF: POST /api/auth/register");

        return authWebClient.post()
                .uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(AUTH_TIMEOUT)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    log.error("Auth service error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .body(Map.of(
                                    "error", e.getStatusText(),
                                    "message", extractMessage(e.getResponseBodyAsString()))));
                })
                .onErrorResume(Exception.class, e -> {
                    log.error("BFF error during register: {}", e.getMessage(), e);
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(Map.of(
                                    "error", "Service Unavailable",
                                    "message",
                                    "El servicio de autenticación no está disponible. Por favor intente nuevamente.")));
                });
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token")
    public Mono<ResponseEntity<Map>> refresh(@RequestHeader("Authorization") String authHeader) {
        log.debug("BFF: POST /api/auth/refresh");

        return authWebClient.post()
                .uri("/api/auth/refresh")
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(30))
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, e -> {
                    log.error("Refresh token error: {}", e.getStatusCode());
                    return Mono.just(ResponseEntity
                            .status(e.getStatusCode())
                            .body(Map.of("error", "Token refresh failed")));
                })
                .onErrorResume(Exception.class, e -> {
                    log.error("BFF error during refresh: {}", e.getMessage());
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(Map.of("error", "Service Unavailable")));
                });
    }

    private String extractMessage(String responseBody) {
        try {
            // Try to extract message from JSON error response
            if (responseBody != null && responseBody.contains("message")) {
                int start = responseBody.indexOf("\"message\":\"") + 11;
                int end = responseBody.indexOf("\"", start);
                if (start > 10 && end > start) {
                    return responseBody.substring(start, end);
                }
            }
        } catch (Exception ignored) {
        }
        return "Error de autenticación";
    }
}
