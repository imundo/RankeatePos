package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.ReservationsService;
import com.poscl.operations.domain.entity.Reservation;
import com.poscl.operations.domain.entity.RestaurantTable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservations", description = "Gestión de reservas y mesas")
public class ReservationsController {

    private final ReservationsService reservationsService;

    // ==================== RESERVATIONS ====================

    @GetMapping
    @Operation(summary = "Listar reservas por fecha")
    public ResponseEntity<List<Reservation>> getReservations(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(required = false) LocalDate date) {

        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(reservationsService.getReservationsForDate(tenantId, targetDate));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener reserva por ID")
    public ResponseEntity<Reservation> getReservation(@PathVariable UUID id) {
        return reservationsService.getReservationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Crear nueva reserva")
    public ResponseEntity<Reservation> createReservation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Map<String, Object> request) {

        // Use tenantId as branchId if not provided
        UUID branchId = request.containsKey("branchId")
                ? UUID.fromString(request.get("branchId").toString())
                : tenantId;

        String clienteNombre = (String) request.get("clienteNombre");
        String clienteTelefono = (String) request.get("clienteTelefono");
        LocalDate fecha = LocalDate.parse((String) request.get("fecha"));
        LocalTime hora = LocalTime.parse((String) request.get("hora"));
        int personas = (Integer) request.get("personas");
        UUID tableId = request.containsKey("tableId") && request.get("tableId") != null
                ? UUID.fromString(request.get("tableId").toString())
                : null;
        String notas = (String) request.getOrDefault("notas", "");
        String serviceType = (String) request.getOrDefault("serviceType", "MESA");

        Reservation reservation = reservationsService.createReservation(
                tenantId, branchId, clienteNombre, clienteTelefono, fecha, hora, personas, tableId, notas, serviceType);

        return ResponseEntity.ok(reservation);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Actualizar estado de reserva")
    public ResponseEntity<Reservation> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {

        String newStatus = request.get("estado");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(reservationsService.updateStatus(id, newStatus));
    }

    @PutMapping("/{id}/table")
    @Operation(summary = "Asignar mesa a reserva")
    public ResponseEntity<Reservation> assignTable(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {

        UUID tableId = UUID.fromString(request.get("tableId"));
        return ResponseEntity.ok(reservationsService.assignTable(id, tableId));
    }

    // ==================== TABLES ====================

    @GetMapping("/tables")
    @Operation(summary = "Listar mesas")
    public ResponseEntity<List<RestaurantTable>> getTables(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) UUID branchId) {

        UUID effectiveBranchId = branchId != null ? branchId : tenantId;
        return ResponseEntity.ok(reservationsService.getTables(tenantId, effectiveBranchId));
    }

    @GetMapping("/tables/available")
    @Operation(summary = "Listar mesas disponibles")
    public ResponseEntity<List<RestaurantTable>> getAvailableTables(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) UUID branchId,
            @RequestParam(defaultValue = "1") int minCapacity) {

        UUID effectiveBranchId = branchId != null ? branchId : tenantId;
        return ResponseEntity.ok(reservationsService.getAvailableTables(tenantId, effectiveBranchId, minCapacity));
    }

    @PutMapping("/tables/{id}/status")
    @Operation(summary = "Actualizar estado de mesa")
    public ResponseEntity<RestaurantTable> updateTableStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {

        String newStatus = request.get("estado");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(reservationsService.updateTableStatus(id, newStatus));
    }

    // ==================== STATS ====================

    @GetMapping("/stats")
    @Operation(summary = "Estadísticas de reservas")
    public ResponseEntity<ReservationsService.ReservationStats> getStats(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(required = false) LocalDate date) {

        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(reservationsService.getStats(tenantId, targetDate));
    }
}
