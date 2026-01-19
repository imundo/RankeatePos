package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.AutomationService;
import com.poscl.operations.domain.entity.Automation;
import com.poscl.operations.domain.entity.AutomationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/automations")
@RequiredArgsConstructor
@Tag(name = "Automations", description = "Gestión de automatizaciones y marketing")
public class AutomationController {

    private final AutomationService automationService;

    @GetMapping
    @Operation(summary = "Listar configuraciones de automatización")
    public ResponseEntity<List<Automation>> getAutomations(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(automationService.getAutomations(tenantId));
    }

    @PostMapping
    @Operation(summary = "Guardar configuración de automatización")
    public ResponseEntity<Automation> saveAutomation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Automation automation) {

        automation.setTenantId(tenantId);
        return ResponseEntity.ok(automationService.saveAutomation(automation));
    }

    @GetMapping("/{id}/logs")
    @Operation(summary = "Obtener historial de envíos")
    public ResponseEntity<List<AutomationLog>> getLogs(@PathVariable UUID id) {
        return ResponseEntity.ok(automationService.getLogs(id));
    }

    @PostMapping("/test")
    @Operation(summary = "Probar conexión de servicios")
    public ResponseEntity<Map<String, String>> testConnection(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Map<String, String> config) {

        // Simulating connection test
        boolean success = true;
        String message = "Conexión exitosa con " + config.getOrDefault("provider", "servicio");

        return ResponseEntity.ok(Map.of(
                "status", success ? "success" : "error",
                "message", message));
    }
}
