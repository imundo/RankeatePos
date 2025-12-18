package com.poscl.bff.controller;

import com.poscl.bff.dto.LoginRequest;
import com.poscl.bff.dto.LoginResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Auth Controller - Proxy to Auth Service
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication endpoints")
public class AuthController {

    private final WebClient authWebClient;

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate user and get JWT token")
    public Mono<Map> login(@RequestBody Map<String, Object> request) {
        log.info("BFF: POST /api/auth/login");
        
        return authWebClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class);
    }

    @PostMapping("/register")
    @Operation(summary = "Register", description = "Register new company")
    public Mono<Map> register(@RequestBody Map<String, Object> request) {
        log.info("BFF: POST /api/auth/register");
        
        return authWebClient.post()
                .uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token")
    public Mono<Map> refresh(@RequestHeader("Authorization") String authHeader) {
        log.info("BFF: POST /api/auth/refresh");
        
        return authWebClient.post()
                .uri("/api/auth/refresh")
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(Map.class);
    }
}
