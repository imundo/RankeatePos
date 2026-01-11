package com.poscl.sales.api.controller;

import com.poscl.sales.api.dto.DailyStatsDto;
import com.poscl.sales.application.service.SaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Dashboard Controller - Provides aggregated stats for the dashboard view
 */
@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard statistics endpoints")
public class DashboardController {

    private final SaleService saleService;

    @GetMapping("/stats")
    @Operation(summary = "Dashboard stats", description = "Get aggregated dashboard statistics")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantIdStr) {

        log.info("GET /api/dashboard/stats - TenantId: {}", tenantIdStr);

        Map<String, Object> stats = new HashMap<>();

        try {
            UUID tenantId = tenantIdStr != null ? UUID.fromString(tenantIdStr) : null;

            if (tenantId != null) {
                // Use Chile timezone for date (server runs in UTC but business is in Chile)
                LocalDate today = LocalDate.now(java.time.ZoneId.of("America/Santiago"));
                log.info("Fetching stats for tenant {} on date {} (Chile timezone)", tenantId, today);

                DailyStatsDto dailyStats = saleService.getDailyStats(tenantId, today);
                log.info("Stats result - Ventas: {}, Transacciones: {}",
                        dailyStats.getTotalVentas(), dailyStats.getTotalTransacciones());

                stats.put("ventasHoy", dailyStats.getTotalVentas());
                stats.put("transacciones", dailyStats.getTotalTransacciones());
                stats.put("topProducto", getTopProductName(dailyStats));
                stats.put("stockBajo", 0); // TODO: integrate with catalog-service
            } else {
                log.warn("No tenantId provided, returning empty stats");
                stats.put("ventasHoy", 0);
                stats.put("transacciones", 0);
                stats.put("topProducto", "--");
                stats.put("stockBajo", 0);
            }
        } catch (Exception e) {
            log.error("Error getting dashboard stats", e);
            stats.put("ventasHoy", 0);
            stats.put("transacciones", 0);
            stats.put("topProducto", "--");
            stats.put("stockBajo", 0);
        }

        return ResponseEntity.ok(stats);
    }

    private String getTopProductName(DailyStatsDto stats) {
        if (stats.getTopProductos() != null && !stats.getTopProductos().isEmpty()) {
            return stats.getTopProductos().get(0).getNombre();
        }
        return "--";
    }
}
