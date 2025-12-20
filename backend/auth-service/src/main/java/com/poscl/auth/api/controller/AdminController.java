package com.poscl.auth.api.controller;

import com.poscl.auth.api.dto.*;
import com.poscl.auth.application.service.TenantService;
import com.poscl.auth.application.service.UserService;
import com.poscl.auth.domain.entity.Tenant;
import com.poscl.auth.domain.entity.User;
import com.poscl.shared.dto.BusinessType;
import com.poscl.shared.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * AdminController - Endpoints para Super Admin (gestión de plataforma)
 * Solo accesible por usuarios con rol SAAS_ADMIN
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Gestión de la plataforma SmartPos (Super Admin)")
@SecurityRequirement(name = "bearer-key")
@PreAuthorize("hasRole('SAAS_ADMIN')")
public class AdminController {

    private final TenantService tenantService;
    private final UserService userService;

    // ==================== Platform Stats ====================

    @GetMapping("/stats")
    @Operation(summary = "Estadísticas de plataforma", description = "KPIs globales de SmartPos")
    public ResponseEntity<Map<String, Object>> getStats() {
        log.info("GET /api/admin/stats - Fetching platform stats");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTenants", tenantService.countAll());
        stats.put("activeTenants", tenantService.countActive());
        stats.put("totalUsers", userService.countAll());
        // TODO: Add MRR, churn, etc. when billing is implemented
        stats.put("mrr", 0);
        stats.put("churnRate", 0.0);

        return ResponseEntity.ok(stats);
    }

    // ==================== Tenant Management ====================

    @GetMapping("/tenants")
    @Operation(summary = "Listar todos los tenants", description = "Lista paginada de todos los clientes")
    public ResponseEntity<PageResponse<TenantDto>> listTenants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            Pageable pageable) {

        log.info("GET /api/admin/tenants - search: {}, status: {}", search, status);
        Page<Tenant> page = tenantService.findAll(search, status, pageable);

        Page<TenantDto> dtoPage = page.map(this::toDto);
        return ResponseEntity.ok(PageResponse.of(
                dtoPage.getContent(),
                dtoPage.getNumber(),
                dtoPage.getSize(),
                dtoPage.getTotalElements()));
    }

    @GetMapping("/tenants/{id}")
    @Operation(summary = "Detalle de tenant", description = "Información completa de un cliente")
    public ResponseEntity<TenantDto> getTenant(@PathVariable UUID id) {
        log.info("GET /api/admin/tenants/{}", id);
        Tenant tenant = tenantService.findById(id);
        return ResponseEntity.ok(toDto(tenant));
    }

    @PostMapping("/tenants/wizard")
    @Operation(summary = "Crear tenant con wizard", description = "Crea tenant + usuario admin en un solo paso")
    public ResponseEntity<WizardResultDto> createTenantWithWizard(@Valid @RequestBody TenantWizardRequest request) {
        log.info("POST /api/admin/tenants/wizard - Creating tenant: {}", request.getRazonSocial());

        // Parse businessType from String to enum
        BusinessType businessType = BusinessType.OTRO;
        try {
            if (request.getBusinessType() != null && !request.getBusinessType().isBlank()) {
                businessType = BusinessType.valueOf(request.getBusinessType().toUpperCase());
            }
        } catch (IllegalArgumentException e) {
            log.warn("BusinessType inválido: {}, usando OTRO", request.getBusinessType());
        }

        // Create tenant
        Tenant tenant = tenantService.create(TenantRequest.builder()
                .rut(request.getRut())
                .razonSocial(request.getRazonSocial())
                .nombreFantasia(request.getNombreFantasia())
                .giro(request.getGiro())
                .direccion(request.getDireccion())
                .comuna(request.getComuna())
                .region(request.getRegion())
                .businessType(businessType)
                .plan(request.getPlan())
                .build());

        // Create admin user for this tenant
        User adminUser = userService.createForTenant(
                tenant.getId(),
                UserRequest.builder()
                        .email(request.getAdminEmail())
                        .password(request.getAdminPassword())
                        .nombre(request.getAdminNombre())
                        .apellido(request.getAdminApellido())
                        .telefono(request.getAdminTelefono())
                        .roleName("OWNER_ADMIN")
                        .build());

        // TODO: Send welcome email with credentials

        WizardResultDto result = WizardResultDto.builder()
                .tenantId(tenant.getId())
                .tenantName(tenant.getRazonSocial())
                .userId(adminUser.getId())
                .userEmail(adminUser.getEmail())
                .message("Tenant y usuario creados exitosamente")
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/tenants/{id}/status")
    @Operation(summary = "Cambiar estado de tenant", description = "Activar/Suspender un cliente")
    public ResponseEntity<TenantDto> updateTenantStatus(
            @PathVariable UUID id,
            @RequestBody TenantStatusRequest request) {

        log.info("PUT /api/admin/tenants/{}/status - activo: {}", id, request.isActivo());
        Tenant tenant = tenantService.updateStatus(id, request.isActivo());
        return ResponseEntity.ok(toDto(tenant));
    }

    // ==================== User Management ====================

    @GetMapping("/users")
    @Operation(summary = "Listar todos los usuarios", description = "Lista global de usuarios de la plataforma")
    public ResponseEntity<PageResponse<UserDto>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID tenantId,
            Pageable pageable) {

        log.info("GET /api/admin/users - search: {}, tenantId: {}", search, tenantId);
        Page<User> page = userService.findAll(search, tenantId, pageable);

        Page<UserDto> dtoPage = page.map(this::toUserDto);
        return ResponseEntity.ok(PageResponse.of(
                dtoPage.getContent(),
                dtoPage.getNumber(),
                dtoPage.getSize(),
                dtoPage.getTotalElements()));
    }

    // ==================== DTOs ====================

    private TenantDto toDto(Tenant tenant) {
        return TenantDto.builder()
                .id(tenant.getId())
                .rut(tenant.getRut())
                .razonSocial(tenant.getRazonSocial())
                .nombreFantasia(tenant.getNombreFantasia())
                .businessType(tenant.getBusinessType())
                .plan(tenant.getPlan())
                .activo(tenant.getActivo())
                .createdAt(tenant.getCreatedAt())
                .build();
    }

    private UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nombre(user.getNombre())
                .apellido(user.getApellido())
                .activo(user.getActivo())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
