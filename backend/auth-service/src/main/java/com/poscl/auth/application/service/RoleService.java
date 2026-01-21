package com.poscl.auth.application.service;

import com.poscl.auth.domain.entity.Role;
import com.poscl.auth.domain.repository.RoleRepository;
import com.poscl.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Role> findGlobalRoles() {
        return roleRepository.findGlobalRoles();
    }

    @Transactional(readOnly = true)
    public List<Role> findAvailableForTenant(UUID tenantId) {
        return roleRepository.findAvailableRolesForTenant(tenantId);
    }

    @Transactional(readOnly = true)
    public Role findById(UUID id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new DomainException("ROLE_NOT_FOUND", "Rol no encontrado", HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Role findByNombre(String nombre) {
        return roleRepository.findByNombre(nombre)
                .orElseThrow(() -> new DomainException("ROLE_NOT_FOUND", "Rol no encontrado: " + nombre,
                        HttpStatus.NOT_FOUND));
    }

    public Role create(Role roleData, UUID tenantId) {
        // Check for duplicate name within scope
        String nombre = roleData.getNombre();
        if (nombre != null && roleRepository.findByNombre(nombre).isPresent()) {
            throw new DomainException("DUPLICATE_ROLE", "Ya existe un rol con ese nombre", HttpStatus.CONFLICT);
        }

        Role role = Role.builder()
                .tenantId(tenantId) // null = global role (only super admin can create)
                .nombre(roleData.getNombre())
                .descripcion(roleData.getDescripcion())
                .permisos(roleData.getPermisos())
                .esSistema(false) // User-created roles are never system roles
                .activo(true)
                .build();

        log.info("Creating role: {} for tenant: {}", role.getNombre(), tenantId);
        return roleRepository.save(role);
    }

    public Role update(UUID id, Role roleUpdates) {
        Role role = findById(id);

        // Prevent editing system roles
        if (role.isSystemRole()) {
            throw new DomainException("SYSTEM_ROLE", "No se pueden modificar roles del sistema", HttpStatus.FORBIDDEN);
        }

        if (roleUpdates.getNombre() != null) {
            role.setNombre(roleUpdates.getNombre());
        }
        if (roleUpdates.getDescripcion() != null) {
            role.setDescripcion(roleUpdates.getDescripcion());
        }
        if (roleUpdates.getPermisos() != null) {
            role.setPermisos(roleUpdates.getPermisos());
        }

        log.info("Updated role: {}", role.getNombre());
        return roleRepository.save(role);
    }

    public Role updatePermissions(UUID id, String[] permissions) {
        Role role = findById(id);

        if (role.isSystemRole()) {
            throw new DomainException("SYSTEM_ROLE", "No se pueden modificar permisos de roles del sistema",
                    HttpStatus.FORBIDDEN);
        }

        role.setPermisos(permissions);
        log.info("Updated permissions for role: {} -> {}", role.getNombre(), Arrays.toString(permissions));
        return roleRepository.save(role);
    }

    public void delete(UUID id) {
        Role role = findById(id);

        if (role.isSystemRole()) {
            throw new DomainException("SYSTEM_ROLE", "No se pueden eliminar roles del sistema", HttpStatus.FORBIDDEN);
        }

        // Soft delete
        role.setActivo(false);
        roleRepository.save(role);
        log.info("Soft-deleted role: {}", role.getNombre());
    }

    public void hardDelete(UUID id) {
        Role role = findById(id);

        if (role.isSystemRole()) {
            throw new DomainException("SYSTEM_ROLE", "No se pueden eliminar roles del sistema", HttpStatus.FORBIDDEN);
        }

        roleRepository.delete(role);
        log.info("Hard-deleted role: {}", role.getNombre());
    }
}
