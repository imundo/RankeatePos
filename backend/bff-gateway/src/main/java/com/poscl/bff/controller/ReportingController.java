package com.poscl.bff.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reports", description = "Reporting and Analytics endpoints")
public class ReportingController {

        private final WebClient salesWebClient;

        @GetMapping("/sales/trend")
        @Operation(summary = "Get sales trend", description = "Get daily sales trend for a date range")
        public Mono<List> getSalesTrend(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

                log.debug("BFF: GET /api/reports/sales/trend");

                return salesWebClient.get()
                                .uri(uriBuilder -> uriBuilder
                                                .path("/api/reports/sales/trend")
                                                .queryParam("startDate", startDate)
                                                .queryParam("endDate", endDate)
                                                .build())
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(List.class)
                                .onErrorReturn(Collections.emptyList());
        }

        @GetMapping("/products/top")
        @Operation(summary = "Get top products", description = "Get top selling products for a date range")
        public Mono<List> getTopProducts(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
                        @RequestParam(defaultValue = "5") int limit) {

                log.debug("BFF: GET /api/reports/products/top");

                return salesWebClient.get()
                                .uri(uriBuilder -> uriBuilder
                                                .path("/api/reports/products/top")
                                                .queryParam("startDate", startDate)
                                                .queryParam("endDate", endDate)
                                                .queryParam("limit", limit)
                                                .build())
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(List.class)
                                .onErrorReturn(Collections.emptyList());
        }

        @GetMapping("/customers/metrics")
        @Operation(summary = "Get customer metrics", description = "Get customer RFM metrics for a date range")
        public Mono<List> getCustomerMetrics(
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        @RequestHeader("X-Tenant-Id") String tenantId,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
                        @RequestParam(defaultValue = "10") int limit) {

                log.debug("BFF: GET /api/reports/customers/metrics");

                return salesWebClient.get()
                                .uri(uriBuilder -> uriBuilder
                                                .path("/api/reports/customers/metrics")
                                                .queryParam("startDate", startDate)
                                                .queryParam("endDate", endDate)
                                                .queryParam("limit", limit)
                                                .build())
                                .header("Authorization", authHeader != null ? authHeader : "")
                                .header("X-Tenant-Id", tenantId)
                                .retrieve()
                                .bodyToMono(List.class)
                                .onErrorReturn(Collections.emptyList());
        }
}
