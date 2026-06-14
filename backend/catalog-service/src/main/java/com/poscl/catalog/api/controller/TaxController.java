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

    @PostMapping
    @Operation(summary = "Crear impuesto", description = "Crea un nuevo impuesto")
    public ResponseEntity<Tax> create(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody Tax request) {
        log.info("POST /api/taxes - TenantId: {}", tenantId);
        request.setTenantId(tenantId);
        request.setId(null);
        if (request.getActivo() == null) request.setActivo(true);
        if (request.getEsDefault() == null) request.setEsDefault(false);
        
        if (request.getEsDefault()) {
            resetDefaultTaxes(tenantId);
        }
        
        return ResponseEntity.ok(taxRepository.save(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar impuesto", description = "Actualiza un impuesto existente")
    public ResponseEntity<Tax> update(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @RequestBody Tax request) {
        log.info("PUT /api/taxes/{} - TenantId: {}", id, tenantId);
        Tax existing = taxRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Impuesto no encontrado"));
                
        existing.setNombre(request.getNombre());
        existing.setPorcentaje(request.getPorcentaje());
        
        if (request.getEsDefault() != null && request.getEsDefault() && !existing.getEsDefault()) {
            resetDefaultTaxes(tenantId);
            existing.setEsDefault(true);
        } else if (request.getEsDefault() != null) {
            existing.setEsDefault(request.getEsDefault());
        }
        
        if (request.getActivo() != null) {
            existing.setActivo(request.getActivo());
        }
        
        return ResponseEntity.ok(taxRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar impuesto", description = "Eliminación lógica de un impuesto")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        log.info("DELETE /api/taxes/{} - TenantId: {}", id, tenantId);
        Tax existing = taxRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Impuesto no encontrado"));
                
        existing.setActivo(false);
        taxRepository.save(existing);
        return ResponseEntity.noContent().build();
    }
    
    private void resetDefaultTaxes(UUID tenantId) {
        taxRepository.findActiveByTenantId(tenantId).stream()
            .filter(Tax::getEsDefault)
            .forEach(t -> {
                t.setEsDefault(false);
                taxRepository.save(t);
            });
    }
}
