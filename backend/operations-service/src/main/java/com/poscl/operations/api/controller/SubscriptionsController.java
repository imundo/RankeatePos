package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.SubscriptionsService;
import com.poscl.operations.domain.entity.Subscription;
import com.poscl.operations.domain.entity.SubscriptionDelivery;
import com.poscl.operations.domain.entity.SubscriptionPlan;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "Gestión de suscripciones recurrentes")
public class SubscriptionsController {

    private final SubscriptionsService subscriptionsService;

    // ==================== PLANS ====================

    @GetMapping("/plans")
    @Operation(summary = "Listar planes de suscripción")
    public ResponseEntity<List<SubscriptionPlan>> getPlans(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        
        if (activeOnly) {
            return ResponseEntity.ok(subscriptionsService.getActivePlans(tenantId));
        }
        return ResponseEntity.ok(subscriptionsService.getAllPlans(tenantId));
    }

    @PostMapping("/plans")
    @Operation(summary = "Crear plan de suscripción")
    public ResponseEntity<SubscriptionPlan> createPlan(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Map<String, Object> request) {
        
        String nombre = (String) request.get("nombre");
        String descripcion = (String) request.get("descripcion");
        String frecuencia = (String) request.get("frecuencia");
        BigDecimal precio = new BigDecimal(request.get("precio").toString());
        String productos = request.containsKey("productos") 
                ? request.get("productos").toString() 
                : "[]";

        SubscriptionPlan plan = subscriptionsService.createPlan(
                tenantId, nombre, descripcion, frecuencia, precio, productos);
        
        return ResponseEntity.ok(plan);
    }

    // ==================== SUBSCRIPTIONS ====================

    @GetMapping
    @Operation(summary = "Listar suscripciones")
    public ResponseEntity<List<Subscription>> getSubscriptions(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        
        if (activeOnly) {
            return ResponseEntity.ok(subscriptionsService.getActiveSubscriptions(tenantId));
        }
        return ResponseEntity.ok(subscriptionsService.getSubscriptions(tenantId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener suscripción por ID")
    public ResponseEntity<Subscription> getSubscription(@PathVariable UUID id) {
        return subscriptionsService.getSubscriptionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Crear suscripción")
    public ResponseEntity<Subscription> createSubscription(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Map<String, Object> request) {
        
        UUID planId = UUID.fromString(request.get("planId").toString());
        String clienteNombre = (String) request.get("clienteNombre");
        String clienteTelefono = (String) request.get("clienteTelefono");
        String direccionEntrega = (String) request.get("direccionEntrega");
        String comuna = (String) request.getOrDefault("comuna", "");
        LocalDate fechaInicio = request.containsKey("fechaInicio")
                ? LocalDate.parse(request.get("fechaInicio").toString())
                : LocalDate.now();

        Subscription subscription = subscriptionsService.createSubscription(
                tenantId, planId, clienteNombre, clienteTelefono, direccionEntrega, comuna, fechaInicio);
        
        return ResponseEntity.ok(subscription);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Actualizar estado de suscripción")
    public ResponseEntity<Subscription> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        
        String newStatus = request.get("estado");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(subscriptionsService.updateStatus(id, newStatus));
    }

    // ==================== DELIVERIES ====================

    @GetMapping("/deliveries")
    @Operation(summary = "Listar entregas del día")
    public ResponseEntity<List<SubscriptionDelivery>> getDeliveries(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(defaultValue = "false") boolean pendingOnly) {
        
        LocalDate targetDate = date != null ? date : LocalDate.now();
        
        if (pendingOnly) {
            return ResponseEntity.ok(subscriptionsService.getPendingDeliveries(targetDate));
        }
        return ResponseEntity.ok(subscriptionsService.getDeliveriesForDate(targetDate));
    }

    @PutMapping("/deliveries/{id}/status")
    @Operation(summary = "Actualizar estado de entrega")
    public ResponseEntity<SubscriptionDelivery> updateDeliveryStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        
        String newStatus = request.get("estado");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(subscriptionsService.updateDeliveryStatus(id, newStatus));
    }

    // ==================== STATS ====================

    @GetMapping("/stats")
    @Operation(summary = "Estadísticas de suscripciones")
    public ResponseEntity<SubscriptionsService.SubscriptionStats> getStats(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(subscriptionsService.getStats(tenantId));
    }
}
