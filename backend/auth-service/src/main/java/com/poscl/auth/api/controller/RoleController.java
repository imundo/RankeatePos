package com.poscl.auth.api.controller;

import com.poscl.auth.application.service.RoleService;
import com.poscl.auth.domain.entity.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Slf4j
public class RoleController {

    private final RoleService roleService;

    // ================== List Roles ==================

    @GetMapping
    @PreAuthorize("hasRole('SAAS_ADMIN')")
    public ResponseEntity<List<RoleDto>> listAll() {
        return ResponseEntity.ok(
                roleService.findAll().stream()
                        .map(this::toDto)
                        .collect(Collectors.toList()));
    }

    @GetMapping("/global")
    @PreAuthorize("hasRole('SAAS_ADMIN')")
    public ResponseEntity<List<RoleDto>> listGlobal() {
        return ResponseEntity.ok(
                roleService.findGlobalRoles().stream()
                        .map(this::toDto)
                        .collect(Collectors.toList()));
    }

    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("hasRole('SAAS_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<List<RoleDto>> listForTenant(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(
                roleService.findAvailableForTenant(tenantId).stream()
                        .map(this::toDto)
                        .collect(Collectors.toList()));
    }

    // ================== CRUD ==================

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SAAS_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<RoleDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(toDto(roleService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('SAAS_ADMIN')")
    public ResponseEntity<RoleDto> createGlobal(@RequestBody CreateRoleRequest request) {
        Role role = Role.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .permisos(request.permisos())
                .build();

        Role created = roleService.create(role, null); // null = global
        return ResponseEntity.ok(toDto(created));
    }

    @PostMapping("/tenant/{tenantId}")
    @PreAuthorize("hasRole('SAAS_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<RoleDto> createForTenant(
            @PathVariable UUID tenantId,
            @RequestBody CreateRoleRequest request) {

        Role role = Role.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .permisos(request.permisos())
                .build();

        Role created = roleService.create(role, tenantId);
        return ResponseEntity.ok(toDto(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SAAS_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<RoleDto> update(
            @PathVariable UUID id,
            @RequestBody UpdateRoleRequest request) {

        Role updates = Role.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .permisos(request.permisos())
                .build();

        Role updated = roleService.update(id, updates);
        return ResponseEntity.ok(toDto(updated));
    }

    @PatchMapping("/{id}/permissions")
    @PreAuthorize("hasRole('SAAS_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<RoleDto> updatePermissions(
            @PathVariable UUID id,
            @RequestBody PermissionsRequest request) {

        Role updated = roleService.updatePermissions(id, request.permissions());
        return ResponseEntity.ok(toDto(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SAAS_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ================== DTOs ==================

    private RoleDto toDto(Role role) {
        return new RoleDto(
                role.getId(),
                role.getTenantId(),
                role.getNombre(),
                role.getDescripcion(),
                role.getPermisos(),
                role.getEsSistema(),
                role.getActivo(),
                role.getCreatedAt(),
                role.getUpdatedAt());
    }

    public record RoleDto(
            UUID id,
            UUID tenantId,
            String nombre,
            String descripcion,
            String[] permisos,
            Boolean esSistema,
            Boolean activo,
            java.time.Instant createdAt,
            java.time.Instant updatedAt) {
    }

    public record CreateRoleRequest(
            String nombre,
            String descripcion,
            String[] permisos) {
    }

    public record UpdateRoleRequest(
            String nombre,
            String descripcion,
            String[] permisos) {
    }

    public record PermissionsRequest(
            String[] permissions) {
    }
}
