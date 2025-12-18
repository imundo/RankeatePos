package com.poscl.sales.api.controller;

import com.poscl.sales.api.dto.*;
import com.poscl.sales.application.service.CashSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controlador de Sesiones de Caja
 */
@Slf4j
@RestController
@RequestMapping("/api/cash-sessions")
@RequiredArgsConstructor
@Tag(name = "Sesiones de Caja", description = "Gestión de turnos y cierres de caja")
public class CashSessionController {

    private final CashSessionService sessionService;

    @PostMapping("/open")
    @Operation(summary = "Abrir caja", description = "Abre una nueva sesión de caja")
    public ResponseEntity<CashSessionDto> open(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody OpenCashSessionRequest request) {

        log.info("POST /api/cash-sessions/open - user={}, register={}", userId, request.getRegisterId());
        CashSessionDto session = sessionService.openSession(tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Cerrar caja", description = "Cierra una sesión de caja con arqueo")
    public ResponseEntity<CashSessionDto> close(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody CloseCashSessionRequest request) {

        log.info("POST /api/cash-sessions/{}/close - montoFinal={}", id, request.getMontoFinal());
        CashSessionDto session = sessionService.closeSession(tenantId, userId, id, request);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/current")
    @Operation(summary = "Sesión actual", description = "Obtiene la sesión de caja abierta del usuario")
    public ResponseEntity<CashSessionDto> current(
            @RequestHeader("X-User-Id") UUID userId) {

        return ResponseEntity.ok(sessionService.getCurrentSession(userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener sesión", description = "Obtiene una sesión por ID")
    public ResponseEntity<CashSessionDto> findById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {

        return ResponseEntity.ok(sessionService.findById(tenantId, id));
    }

    @GetMapping
    @Operation(summary = "Listar sesiones", description = "Lista todas las sesiones del tenant")
    public ResponseEntity<List<CashSessionDto>> findAll(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {

        return ResponseEntity.ok(sessionService.findByTenant(tenantId));
    }
}
