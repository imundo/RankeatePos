package com.poscl.bff.controller;

import com.poscl.bff.service.WarmupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Health and warmup endpoints for monitoring and cold start handling.
 */
@RestController
@RequiredArgsConstructor
public class HealthController {

    private final WarmupService warmupService;

    /**
     * Simple health check for the BFF itself.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "bff-gateway"));
    }

    /**
     * Warmup endpoint - triggers parallel warmup of all downstream services.
     * Useful for the frontend to call after login to pre-warm services.
     */
    @GetMapping("/api/warmup")
    public Mono<ResponseEntity<Map<String, String>>> warmup() {
        return warmupService.triggerWarmup()
                .map(result -> ResponseEntity.ok(Map.of(
                        "status", "completed",
                        "result", result)));
    }

    /**
     * Ping endpoint for Render.com keep-alive or external health checkers.
     */
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
}
