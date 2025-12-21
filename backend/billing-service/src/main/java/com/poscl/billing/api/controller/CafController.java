package com.poscl.billing.api.controller;

import com.poscl.billing.api.dto.CafResponse;
import com.poscl.billing.application.service.CafService;
import com.poscl.billing.domain.enums.TipoDte;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller para gestión de CAF (Código de Autorización de Folios)
 */
@Slf4j
@RestController
@RequestMapping("/api/billing/caf")
@RequiredArgsConstructor
@Tag(name = "CAF", description = "Gestión de Códigos de Autorización de Folios")
public class CafController {

    private final CafService cafService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Subir nuevo CAF")
    public ResponseEntity<CafResponse> subirCaf(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestParam("file") MultipartFile file) {
        
        log.info("POST /api/billing/caf - Subiendo CAF para tenant {}", tenantId);
        
        try {
            String xmlContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            CafResponse response = cafService.subirCaf(tenantId, xmlContent, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error al subir CAF: {}", e.getMessage());
            throw new RuntimeException("Error al procesar el archivo CAF", e);
        }
    }

    @PostMapping(value = "/xml", consumes = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Subir CAF como XML")
    public ResponseEntity<CafResponse> subirCafXml(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestBody String xmlContent) {
        
        log.info("POST /api/billing/caf/xml - Subiendo CAF XML para tenant {}", tenantId);
        
        CafResponse response = cafService.subirCaf(tenantId, xmlContent, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Listar CAFs activos")
    public ResponseEntity<List<CafResponse>> listarCafs(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(required = false) TipoDte tipoDte) {
        
        log.info("GET /api/billing/caf - Tenant: {}, Tipo: {}", tenantId, tipoDte);
        
        List<CafResponse> cafs;
        if (tipoDte != null) {
            cafs = cafService.listarCafsPorTipo(tenantId, tipoDte);
        } else {
            cafs = cafService.listarCafs(tenantId);
        }
        
        return ResponseEntity.ok(cafs);
    }

    @GetMapping("/disponibles")
    @Operation(summary = "Obtener folios disponibles por tipo")
    public ResponseEntity<Map<TipoDte, Integer>> getFoliosDisponibles(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        
        log.info("GET /api/billing/caf/disponibles - Tenant: {}", tenantId);
        
        Map<TipoDte, Integer> folios = cafService.getFoliosDisponibles(tenantId);
        return ResponseEntity.ok(folios);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar CAF")
    public ResponseEntity<Void> desactivarCaf(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        
        log.info("DELETE /api/billing/caf/{} - Tenant: {}", id, tenantId);
        
        cafService.desactivarCaf(tenantId, id);
        return ResponseEntity.noContent().build();
    }
}
