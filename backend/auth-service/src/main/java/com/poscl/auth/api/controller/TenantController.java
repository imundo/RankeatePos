package com.poscl.auth.api.controller;

import com.poscl.auth.domain.entity.Tenant;
import com.poscl.auth.domain.repository.TenantRepository;
import jakarta.validation.Valid;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller para gestión de datos de empresa/tenant
 * Usado en módulo de Gestión de Empresa y Configuración
 */
@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TenantController {

    private final TenantRepository tenantRepository;
    private final com.poscl.auth.application.service.TenantConfigService tenantConfigService;
    private final com.poscl.auth.application.service.TenantService tenantService;

    /**
     * Obtiene los datos del tenant actual
     */
    @GetMapping("/current")
    public ResponseEntity<TenantDto> getCurrentTenant(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {

        log.info("GET /api/tenants/current - TenantId: {}", tenantId);
        return tenantRepository.findById(tenantId)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Actualiza los datos del tenant
     */
    @PutMapping("/current")
    public ResponseEntity<TenantDto> updateTenant(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @Valid @RequestBody UpdateTenantRequest request) {

        log.info("PUT /api/tenants/current - TenantId: {}", tenantId);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant no encontrado"));

        if (request.getNombreFantasia() != null)
            tenant.setNombreFantasia(request.getNombreFantasia());
        if (request.getRazonSocial() != null)
            tenant.setRazonSocial(request.getRazonSocial());
        if (request.getRut() != null)
            tenant.setRut(request.getRut());
        if (request.getGiro() != null)
            tenant.setGiro(request.getGiro());
        if (request.getDireccion() != null)
            tenant.setDireccion(request.getDireccion());
        if (request.getComuna() != null)
            tenant.setComuna(request.getComuna());
        if (request.getCiudad() != null)
            tenant.setCiudad(request.getCiudad());
        if (request.getTelefono() != null)
            tenant.setTelefono(request.getTelefono());
        if (request.getEmail() != null)
            tenant.setEmail(request.getEmail());
        if (request.getSitioWeb() != null)
            tenant.setSitioWeb(request.getSitioWeb());
        if (request.getLogoUrl() != null)
            tenant.setLogoUrl(request.getLogoUrl());
        if (request.getCountry() != null)
            tenant.setCountry(request.getCountry());

        tenant = tenantRepository.save(tenant);
        log.info("Tenant actualizado: {}", tenant.getDisplayName());

        return ResponseEntity.ok(toDto(tenant));
    }

    /**
     * Actualiza el logo del tenant
     */
    @PutMapping("/current/logo")
    public ResponseEntity<TenantDto> updateLogo(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody UpdateLogoRequest request) {

        log.info("PUT /api/tenants/current/logo - TenantId: {}", tenantId);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant no encontrado"));

        tenant.setLogoUrl(request.getLogoUrl());
        tenant = tenantRepository.save(tenant);

        return ResponseEntity.ok(toDto(tenant));
    }

    /**
     * Obtiene las configuraciones del tenant
     */
    @GetMapping("/current/configs")
    public ResponseEntity<java.util.Map<String, String>> getTenantConfigs(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(tenantConfigService.getConfigs(tenantId));
    }

    /**
     * Actualiza las configuraciones del tenant
     */
    @PutMapping("/current/configs")
    public ResponseEntity<java.util.Map<String, String>> updateTenantConfigs(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody java.util.Map<String, String> configs) {

        tenantConfigService.updateConfigs(tenantId, configs);
        return ResponseEntity.ok(tenantConfigService.getConfigs(tenantId));
    }

    private TenantDto toDto(Tenant tenant) {
        return TenantDto.builder()
                .id(tenant.getId())
                .rut(tenant.getRut())
                .razonSocial(tenant.getRazonSocial())
                .nombreFantasia(tenant.getNombreFantasia())
                .giro(tenant.getGiro())
                .direccion(tenant.getDireccion())
                .comuna(tenant.getComuna())
                .ciudad(tenant.getCiudad())
                .telefono(tenant.getTelefono())
                .email(tenant.getEmail())
                .sitioWeb(tenant.getSitioWeb())
                .logoUrl(tenant.getLogoUrl())
                .activo(tenant.getActivo())
                .country(tenant.getCountry())
                .primaryColor(tenant.getPrimaryColor())
                .secondaryColor(tenant.getSecondaryColor())
                .accentColor(tenant.getAccentColor())
                .build();
    }

    /**
     * Actualiza el branding
     */
    @PutMapping("/current/branding")
    public ResponseEntity<TenantDto> updateBranding(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody UpdateBrandingRequest request) {
        Tenant updated = tenantService.updateBranding(tenantId, request.getLogoUrl(), request.getPrimaryColor(), request.getSecondaryColor(), request.getAccentColor());
        return ResponseEntity.ok(toDto(updated));
    }

    /**
     * Documentos
     */
    @GetMapping("/current/documents")
    public ResponseEntity<java.util.List<com.poscl.auth.api.dto.TenantDocumentDto>> getDocuments(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(tenantService.getDocuments(tenantId).stream()
                .map(doc -> new com.poscl.auth.api.dto.TenantDocumentDto(
                        doc.getId(), doc.getNombre(), doc.getTipo(), doc.getFechaVencimiento(), doc.getArchivoUrl(), doc.getEstado()
                )).toList());
    }

    @PostMapping("/current/documents")
    public ResponseEntity<com.poscl.auth.api.dto.TenantDocumentDto> addDocument(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody com.poscl.auth.api.dto.TenantDocumentDto dto) {
        com.poscl.auth.domain.entity.TenantDocument doc = tenantService.addDocument(tenantId, dto);
        return ResponseEntity.ok(new com.poscl.auth.api.dto.TenantDocumentDto(
                doc.getId(), doc.getNombre(), doc.getTipo(), doc.getFechaVencimiento(), doc.getArchivoUrl(), doc.getEstado()
        ));
    }

    @DeleteMapping("/current/documents/{id}")
    public ResponseEntity<Void> deleteDocument(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        tenantService.deleteDocument(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TenantDto {
        private UUID id;
        private String rut;
        private String razonSocial;
        private String nombreFantasia;
        private String giro;
        private String direccion;
        private String comuna;
        private String ciudad;
        private String telefono;
        private String email;
        private String sitioWeb;
        private String logoUrl;
        private Boolean activo;
        private String country;
        private String primaryColor;
        private String secondaryColor;
        private String accentColor;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateBrandingRequest {
        private String logoUrl;
        private String primaryColor;
        private String secondaryColor;
        private String accentColor;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateTenantRequest {
        private String razonSocial;
        private String nombreFantasia;
        private String rut;
        private String giro;
        private String direccion;
        private String comuna;
        private String ciudad;
        private String telefono;
        private String email;
        private String sitioWeb;
        private String logoUrl;
        private String country;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateLogoRequest {
        private String logoUrl;
    }
}
