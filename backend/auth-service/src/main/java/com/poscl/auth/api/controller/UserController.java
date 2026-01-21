package com.poscl.auth.api.controller;

import com.poscl.auth.api.dto.UserDto;
import com.poscl.auth.api.dto.CreateUserRequest;
import com.poscl.auth.api.dto.UpdateUserRequest;
import com.poscl.auth.application.service.UserService;
import com.poscl.shared.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controlador de usuarios - CRUD completo
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Gestión de usuarios del tenant")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Listar usuarios", description = "Lista usuarios del tenant con paginación")
    public ResponseEntity<PageResponse<UserDto>> findAll(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(required = false) String search,
            Pageable pageable) {

        log.info("GET /api/users - TenantId: {}", tenantId);
        Page<UserDto> page = userService.findAll(tenantId, search, pageable);
        return ResponseEntity.ok(PageResponse.of(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener usuario", description = "Obtiene un usuario por ID")
    public ResponseEntity<UserDto> findById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        log.info("GET /api/users/{}", id);
        return ResponseEntity.ok(userService.findById(tenantId, id));
    }

    @PostMapping
    @Operation(summary = "Crear usuario", description = "Crea un nuevo usuario en el tenant")
    public ResponseEntity<UserDto> create(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CreateUserRequest request) {

        log.info("POST /api/users - Email: {}", request.getEmail());
        UserDto user = userService.create(tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar usuario", description = "Actualiza un usuario existente")
    public ResponseEntity<UserDto> update(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {

        log.info("PUT /api/users/{}", id);
        return ResponseEntity.ok(userService.update(tenantId, id, userId, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar usuario", description = "Desactiva un usuario (soft delete)")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id) {

        log.info("DELETE /api/users/{}", id);
        userService.delete(tenantId, id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/roles")
    @Operation(summary = "Listar roles", description = "Lista los roles disponibles")
    public ResponseEntity<List<String>> getRoles() {
        return ResponseEntity.ok(userService.getAvailableRoles());
    }

    @PutMapping("/{id}/roles")
    @Operation(summary = "Asignar roles", description = "Asigna roles a un usuario")
    public ResponseEntity<UserDto> assignRoles(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @RequestBody List<String> roles) {

        log.info("PUT /api/users/{}/roles - Roles: {}", id, roles);
        return ResponseEntity.ok(userService.assignRoles(tenantId, id, userId, roles));
    }

    @PutMapping("/{id}/toggle-active")
    @Operation(summary = "Activar/Desactivar usuario", description = "Cambia el estado activo de un usuario")
    public ResponseEntity<UserDto> toggleActive(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id) {

        log.info("PUT /api/users/{}/toggle-active", id);
        return ResponseEntity.ok(userService.toggleActive(tenantId, id, userId));
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Reset contraseña", description = "Admin reinicia la contraseña del usuario")
    public ResponseEntity<Void> resetPassword(
            @PathVariable UUID id,
            @RequestBody ResetPasswordRequest request) {

        log.info("POST /api/users/{}/reset-password", id);
        userService.adminResetPassword(id, request.newPassword());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/branches")
    @Operation(summary = "Asignar sucursales", description = "Asigna sucursales a un usuario")
    public ResponseEntity<UserDto> assignBranches(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @RequestBody BranchAssignmentRequest request) {

        log.info("PUT /api/users/{}/branches - Branches: {}", id, request.branchIds());
        var user = userService.assignBranches(id, request.branchIds());
        return ResponseEntity.ok(userService.findById(tenantId, id));
    }

    @GetMapping("/{id}/branches")
    @Operation(summary = "Obtener sucursales", description = "Obtiene las sucursales asignadas al usuario")
    public ResponseEntity<List<UUID>> getUserBranches(@PathVariable UUID id) {
        log.info("GET /api/users/{}/branches", id);
        var user = userService.findByIdWithBranches(id);
        var branchIds = user.getBranches().stream()
                .map(b -> b.getId())
                .toList();
        return ResponseEntity.ok(branchIds);
    }

    // ============ Request DTOs ============
    public record ResetPasswordRequest(String newPassword) {
    }

    public record BranchAssignmentRequest(java.util.Set<UUID> branchIds) {
    }
}
