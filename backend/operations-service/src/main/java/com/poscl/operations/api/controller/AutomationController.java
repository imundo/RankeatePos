package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.AutomationService;
import com.poscl.operations.application.service.EmailService;
import com.poscl.operations.application.service.MercadoPagoService;
import com.poscl.operations.application.service.WhatsAppService;
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
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final MercadoPagoService mercadoPagoService;

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

    @PutMapping("/{id}/toggle")
    @Operation(summary = "Activar/Desactivar automatización")
    public ResponseEntity<Automation> toggleAutomation(@PathVariable UUID id) {
        return ResponseEntity.ok(automationService.toggleAutomation(id));
    }

    @GetMapping("/{id}/logs")
    @Operation(summary = "Obtener historial de envíos por automatización")
    public ResponseEntity<List<AutomationLog>> getLogs(@PathVariable UUID id) {
        return ResponseEntity.ok(automationService.getLogs(id));
    }

    @GetMapping("/logs")
    @Operation(summary = "Obtener historial general de envíos")
    public ResponseEntity<List<AutomationLog>> getAllLogs(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(automationService.getAllLogs(tenantId, limit));
    }

    @PostMapping("/config")
    @Operation(summary = "Guardar configuración global (MP, Twilio, SendGrid)")
    public ResponseEntity<com.poscl.operations.domain.entity.AutomationConfig> saveConfig(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody com.poscl.operations.domain.entity.AutomationConfig config) {
        config.setTenantId(tenantId);
        return ResponseEntity.ok(automationService.saveAutomationConfig(config));
    }

    @GetMapping("/config")
    @Operation(summary = "Obtener configuración global")
    public ResponseEntity<com.poscl.operations.domain.entity.AutomationConfig> getConfig(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(automationService.getAutomationConfig(tenantId));
    }

    @PostMapping("/test/email")
    @Operation(summary = "Probar conexión Email")
    public ResponseEntity<Map<String, String>> testEmail(@RequestBody Map<String, String> config) {
        String email = config.getOrDefault("testEmail", "test@rankeate.cl");
        boolean success = emailService.sendSimple(email, "Test de Conexión Rankeate",
                "Tu configuración de email está funcionando correctamente.");

        if (success) {
            return ResponseEntity.ok(Map.of("status", "success", "message", "Email enviado correctamente"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Fallo el envío de email"));
        }
    }

    @PostMapping("/test/whatsapp")
    @Operation(summary = "Probar conexión WhatsApp")
    public ResponseEntity<Map<String, String>> testWhatsApp(@RequestBody Map<String, String> config) {
        String phone = config.getOrDefault("testPhone", "+56912345678");
        boolean success = whatsAppService.send(phone,
                "Test de conexión WhatsApp Rankeate. Tu configuración funciona! 🚀");

        if (success) {
            return ResponseEntity.ok(Map.of("status", "success", "message", "WhatsApp enviado correctamente"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Fallo el envío de WhatsApp"));
        }
    }

    @PostMapping("/test/mercadopago")
    @Operation(summary = "Probar conexión Mercado Pago")
    public ResponseEntity<Map<String, String>> testMercadoPago(@RequestBody Map<String, String> config) {
        // We can check if token works by trying to get payment methods or simplified
        // check
        if (mercadoPagoService.isConfigured()) {
            return ResponseEntity.ok(Map.of("status", "success", "message", "Token configurado correctamente"));
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "error", "message", "Token inválido o no configurado"));
        }
    }
}
