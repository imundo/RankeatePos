package com.poscl.bff.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;

/**
 * Service to warm up downstream microservices on BFF startup.
 * This helps with Render.com cold starts by waking all services in parallel
 * when the BFF receives its first request.
 */
@Slf4j
@Service
@EnableAsync
public class WarmupService {

    private final WebClient authWebClient;
    private final WebClient catalogWebClient;
    private final WebClient salesWebClient;

    public WarmupService(
            @Qualifier("authWebClient") WebClient authWebClient,
            @Qualifier("catalogWebClient") WebClient catalogWebClient,
            @Qualifier("salesWebClient") WebClient salesWebClient) {
        this.authWebClient = authWebClient;
        this.catalogWebClient = catalogWebClient;
        this.salesWebClient = salesWebClient;
    }

    /**
     * Called when the application is ready.
     * Starts warming up all services in parallel.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("BFF started - initiating parallel warmup of microservices...");
        warmupAllServices();
    }

    /**
     * Warms up all downstream services in parallel.
     * This is non-blocking and won't delay BFF startup.
     */
    @Async
    public CompletableFuture<Void> warmupAllServices() {
        long startTime = System.currentTimeMillis();

        // Ping all services in parallel
        Mono<String> authWarmup = pingService(authWebClient, "auth-service", "/actuator/health");
        Mono<String> catalogWarmup = pingService(catalogWebClient, "catalog-service", "/actuator/health");
        Mono<String> salesWarmup = pingService(salesWebClient, "sales-service", "/actuator/health");

        // Wait for all to complete (or timeout)
        Mono.zip(authWarmup, catalogWarmup, salesWarmup)
                .doOnSuccess(tuple -> {
                    long elapsed = System.currentTimeMillis() - startTime;
                    log.info("All microservices warmed up successfully in {}ms", elapsed);
                })
                .doOnError(e -> {
                    long elapsed = System.currentTimeMillis() - startTime;
                    log.warn("Warmup completed with some failures after {}ms: {}", elapsed, e.getMessage());
                })
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();

        return CompletableFuture.completedFuture(null);
    }

    /**
     * Pings a single service's health endpoint.
     * Returns quickly on success or continues with timeout.
     */
    private Mono<String> pingService(WebClient webClient, String serviceName, String healthPath) {
        log.info("Warming up {}...", serviceName);

        return webClient.get()
                .uri(healthPath)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(90)) // Extended timeout for cold start
                .doOnSuccess(response -> log.info("{} is awake and responding", serviceName))
                .doOnError(e -> log.warn("{} warmup failed: {}", serviceName, e.getMessage()))
                .onErrorResume(e -> Mono.just("failed"));
    }

    /**
     * Manual warmup trigger - can be called from a health check or scheduled job.
     */
    public Mono<String> triggerWarmup() {
        log.info("Manual warmup triggered");

        long startTime = System.currentTimeMillis();

        return Mono.zip(
                pingService(authWebClient, "auth-service", "/actuator/health"),
                pingService(catalogWebClient, "catalog-service", "/actuator/health"),
                pingService(salesWebClient, "sales-service", "/actuator/health"))
                .map(tuple -> {
                    long elapsed = System.currentTimeMillis() - startTime;
                    return String.format("Warmup complete in %dms. Auth: %s, Catalog: %s, Sales: %s",
                            elapsed,
                            "failed".equals(tuple.getT1()) ? "❌" : "✅",
                            "failed".equals(tuple.getT2()) ? "❌" : "✅",
                            "failed".equals(tuple.getT3()) ? "❌" : "✅");
                });
    }
}
