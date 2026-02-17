package com.poscl.operations.api.controller;

import com.poscl.operations.api.dto.AddPointsRequest;
import com.poscl.operations.api.dto.CreateCustomerRequest;
import com.poscl.operations.api.dto.LoyaltyCustomerDto;
import com.poscl.operations.application.service.LoyaltyService;
import com.poscl.operations.domain.entity.LoyaltyCustomer;
import com.poscl.operations.domain.entity.LoyaltyTransaction;
import com.poscl.operations.domain.entity.Reward;
import com.poscl.shared.event.SaleCompletedEvent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Loyalty", description = "Programa de lealtad - clientes, puntos y recompensas")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    // ==================== CUSTOMERS ====================

    @GetMapping("/customers")
    @Operation(summary = "Listar clientes de lealtad")
    public ResponseEntity<Page<LoyaltyCustomerDto>> getCustomers(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            Pageable pageable) {
        Page<LoyaltyCustomer> customers = loyaltyService.getCustomers(tenantId, pageable);
        return ResponseEntity.ok(customers.map(this::toDto));
    }

    @GetMapping("/customers/{id}")
    @Operation(summary = "Obtener cliente por ID")
    public ResponseEntity<LoyaltyCustomerDto> getCustomer(@PathVariable UUID id) {
        return loyaltyService.getCustomerById(id)
                .map(c -> ResponseEntity.ok(toDto(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customers/search")
    @Operation(summary = "Buscar clientes por nombre, email o teléfono")
    public ResponseEntity<List<LoyaltyCustomerDto>> searchCustomers(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam String q) {
        List<LoyaltyCustomer> customers = loyaltyService.searchCustomers(tenantId, q);
        return ResponseEntity.ok(customers.stream().map(this::toDto).toList());
    }

    @PostMapping("/customers")
    @Operation(summary = "Crear nuevo cliente de lealtad")
    public ResponseEntity<LoyaltyCustomerDto> createCustomer(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @Valid @RequestBody CreateCustomerRequest request) {
        LoyaltyCustomer customer = loyaltyService.createCustomer(
                tenantId, request.getNombre(), request.getEmail(), request.getTelefono());
        return ResponseEntity.ok(toDto(customer));
    }

    @PutMapping("/customers/{id}")
    @Operation(summary = "Actualizar cliente")
    public ResponseEntity<LoyaltyCustomerDto> updateCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCustomerRequest request) {
        LoyaltyCustomer customer = loyaltyService.updateCustomer(
                id, request.getNombre(), request.getEmail(), request.getTelefono());
        return ResponseEntity.ok(toDto(customer));
    }

    // ==================== POINTS ====================

    @PostMapping("/customers/{id}/points")
    @Operation(summary = "Agregar puntos a cliente")
    public ResponseEntity<LoyaltyTransaction> addPoints(
            @PathVariable UUID id,
            @Valid @RequestBody AddPointsRequest request) {
        LoyaltyTransaction transaction = loyaltyService.addPoints(
                id, request.getPuntos(), request.getDescripcion(), request.getVentaId());
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/customers/{id}/redeem")
    @Operation(summary = "Canjear puntos del cliente")
    public ResponseEntity<?> redeemPoints(
            @PathVariable UUID id,
            @Valid @RequestBody AddPointsRequest request) {
        var result = loyaltyService.redeemPoints(id, request.getPuntos(), request.getDescripcion());
        if (result.isPresent()) {
            return ResponseEntity.ok(result.get());
        }
        return ResponseEntity.badRequest().body("Puntos insuficientes");
    }

    @GetMapping("/customers/{id}/transactions")
    @Operation(summary = "Historial de transacciones del cliente")
    public ResponseEntity<List<LoyaltyTransaction>> getTransactions(@PathVariable UUID id) {
        return ResponseEntity.ok(loyaltyService.getTransactionHistory(id));
    }

    // ==================== REWARDS ====================

    @GetMapping("/rewards")
    @Operation(summary = "Listar recompensas activas")
    public ResponseEntity<List<Reward>> getRewards(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(loyaltyService.getActiveRewards(tenantId));
    }

    @PatchMapping("/rewards/{id}/toggle")
    @Operation(summary = "Activar/desactivar recompensa")
    public ResponseEntity<Reward> toggleReward(@PathVariable UUID id) {
        return ResponseEntity.ok(loyaltyService.toggleRewardActive(id));
    }

    // ==================== STATS ====================

    @GetMapping("/stats")
    @Operation(summary = "Estadísticas del programa de lealtad")
    public ResponseEntity<LoyaltyService.LoyaltyStats> getStats(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(loyaltyService.getStats(tenantId));
    }

    // ==================== SALE COMPLETED (inter-service) ====================

    @PostMapping("/sale-completed")
    @Operation(summary = "Procesar venta completada para acumular puntos")
    public ResponseEntity<?> saleCompleted(@RequestBody SaleCompletedEvent event) {
        try {
            if (event.getCustomerId() == null) {
                log.debug("Venta {} sin cliente, omitiendo puntos", event.getSaleId());
                return ResponseEntity.ok().build();
            }
            // 1 punto por cada $1000 de compra
            int points = event.getTotalAmount().intValue() / 1000;
            if (points > 0) {
                loyaltyService.addPoints(
                        event.getCustomerId(), points,
                        "Compra #" + event.getSaleId(), event.getSaleId());
                log.info("Agregados {} puntos al cliente {} por venta {}",
                        points, event.getCustomerId(), event.getSaleId());
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.warn("Error procesando puntos de venta {}: {}", event.getSaleId(), e.getMessage());
            return ResponseEntity.ok().build(); // No fallar la venta
        }
    }

    // ==================== MAPPER ====================

    private LoyaltyCustomerDto toDto(LoyaltyCustomer customer) {
        return LoyaltyCustomerDto.builder()
                .id(customer.getId())
                .nombre(customer.getNombre())
                .email(customer.getEmail())
                .telefono(customer.getTelefono())
                .puntosActuales(customer.getPuntosActuales())
                .puntosTotales(customer.getPuntosTotales())
                .nivel(customer.getNivel())
                .fechaRegistro(customer.getFechaRegistro())
                .ultimaCompra(customer.getUltimaCompra())
                .activo(customer.getActivo())
                .build();
    }
}
