package com.poscl.billing.api.controller;

import com.poscl.billing.domain.entity.BillingConfig;
import com.poscl.billing.domain.repository.BillingConfigRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/billing/config")
@RequiredArgsConstructor
@Tag(name = "Configuración Facturación", description = "Gestionar conexión con SII/Entes Fiscales")
public class BillingConfigController {

    private final BillingConfigRepository repository;

    @GetMapping
    @Operation(summary = "Obtener configuración actual")
    public ResponseEntity<BillingConfig> getConfig(@RequestHeader("X-Tenant-Id") UUID tenantId) {
        return repository.findByTenantId(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping
    @Operation(summary = "Guardar configuración")
    public ResponseEntity<BillingConfig> saveConfig(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody BillingConfig config) {

        log.info("Guardando configuración de facturación para Tenant {}", tenantId);

        // Ensure tenantId match
        config.setTenantId(tenantId);

        // Check existance
        BillingConfig existing = repository.findByTenantId(tenantId).orElse(null);
        if (existing != null) {
            config.setId(existing.getId());
        }

        return ResponseEntity.ok(repository.save(config));
    }
}
