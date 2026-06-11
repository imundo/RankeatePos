package com.poscl.catalog.api.controller;

import com.poscl.catalog.domain.entity.Tax;
import com.poscl.catalog.domain.repository.TaxRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controlador de impuestos - Listado de impuestos activos
 */
@Slf4j
@RestController
@RequestMapping("/api/taxes")
@RequiredArgsConstructor
@Tag(name = "Impuestos", description = "Gestión de impuestos")
public class TaxController {

    private final TaxRepository taxRepository;

    @GetMapping
    @Operation(summary = "Listar impuestos", description = "Lista todos los impuestos activos del tenant")
    public ResponseEntity<List<Tax>> findAll(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        log.info("GET /api/taxes - TenantId: {}", tenantId);
        return ResponseEntity.ok(taxRepository.findActiveByTenantId(tenantId));
    }
}
