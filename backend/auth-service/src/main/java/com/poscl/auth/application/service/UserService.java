package com.poscl.auth.application.service;

import com.poscl.auth.api.dto.CreateUserRequest;
import com.poscl.auth.api.dto.UpdateUserRequest;
import com.poscl.auth.api.dto.UserDto;
import com.poscl.auth.domain.entity.Branch;
import com.poscl.auth.domain.entity.Role;
import com.poscl.auth.domain.entity.Tenant;
import com.poscl.auth.domain.entity.User;
import com.poscl.auth.domain.repository.BranchRepository;
import com.poscl.auth.domain.repository.RoleRepository;
import com.poscl.auth.domain.repository.TenantRepository;
import com.poscl.auth.domain.repository.UserRepository;
import com.poscl.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio de usuarios - CRUD completo
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

        private final UserRepository userRepository;
        private final TenantRepository tenantRepository;
        private final RoleRepository roleRepository;
        private final BranchRepository branchRepository;
        private final com.poscl.auth.domain.repository.UserModuleAccessRepository userModuleAccessRepository;
        private final PasswordEncoder passwordEncoder;

        /**
         * Lista usuarios del tenant con paginación
         */
        @Transactional(readOnly = true)
        public Page<UserDto> findAll(UUID tenantId, String search, Pageable pageable) {
                Page<User> users;
                if (search != null && !search.isBlank()) {
                        users = userRepository.searchByTenantId(tenantId, search.toLowerCase(), pageable);
                } else {
                        users = userRepository.findByTenant_IdAndDeletedAtIsNull(tenantId, pageable);
                }
                return users.map(this::toDto);
        }

        /**
         * Obtiene un usuario por ID
         */
        @Transactional(readOnly = true)
        public UserDto findById(UUID tenantId, UUID id) {
                User user = userRepository.findByIdAndTenant_Id(id, tenantId)
                                .orElseThrow(() -> new DomainException("USER_NOT_FOUND",
                                                "Usuario no encontrado", HttpStatus.NOT_FOUND));
                return toDto(user);
        }

        /**
         * Crea un nuevo usuario
         */
        public UserDto create(UUID tenantId, UUID creatorId, CreateUserRequest request) {
                // Verificar email único
                if (userRepository.existsByEmailAndTenant_Id(request.getEmail(), tenantId)) {
                        throw new DomainException("EMAIL_EXISTS",
                                        "Ya existe un usuario con ese email", HttpStatus.CONFLICT);
                }

                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new DomainException("TENANT_NOT_FOUND",
                                                "Tenant no encontrado", HttpStatus.NOT_FOUND));

                // Obtener roles
                Set<Role> roles = new HashSet<>();
                if (request.getRoles() != null && !request.getRoles().isEmpty()) {
                        roles = request.getRoles().stream()
                                        .map(roleName -> roleRepository.findByNombre(roleName)
                                                        .orElseThrow(() -> new DomainException("ROLE_NOT_FOUND",
                                                                        "Rol no encontrado: " + roleName,
                                                                        HttpStatus.NOT_FOUND)))
                                        .collect(Collectors.toSet());
                }

                // Obtener branches
                Set<Branch> branches = new HashSet<>();
                if (request.getBranchIds() != null) {
                        branches = request.getBranchIds().stream()
                                        .map(branchId -> branchRepository.findByIdAndTenant_Id(branchId, tenantId)
                                                        .orElseThrow(() -> new DomainException("BRANCH_NOT_FOUND",
                                                                        "Sucursal no encontrada",
                                                                        HttpStatus.NOT_FOUND)))
                                        .collect(Collectors.toSet());
                }

                User user = User.builder()
                                .tenant(tenant)
                                .email(request.getEmail())
                                .passwordHash(passwordEncoder.encode(request.getPassword()))
                                .nombre(request.getNombre())
                                .apellido(request.getApellido())
                                .telefono(request.getTelefono())
                                .activo(true)
                                .emailVerificado(false)
                                .roles(roles)
                                .branches(branches)
                                .createdBy(creatorId)
                                .createdAt(Instant.now())
                                .build();

                user = userRepository.save(user);
                log.info("Usuario creado: {} - TenantId: {}", user.getEmail(), tenantId);

                return toDto(user);
        }

        /**
         * Actualiza un usuario existente
         */
        public UserDto update(UUID tenantId, UUID id, UUID updaterId, UpdateUserRequest request) {
                User user = userRepository.findByIdAndTenant_Id(id, tenantId)
                                .orElseThrow(() -> new DomainException("USER_NOT_FOUND",
                                                "Usuario no encontrado", HttpStatus.NOT_FOUND));

                if (request.getNombre() != null)
                        user.setNombre(request.getNombre());
                if (request.getApellido() != null)
                        user.setApellido(request.getApellido());
                if (request.getTelefono() != null)
                        user.setTelefono(request.getTelefono());
                if (request.getActivo() != null)
                        user.setActivo(request.getActivo());

                if (request.getRoles() != null) {
                        Set<Role> roles = request.getRoles().stream()
                                        .map(roleName -> roleRepository.findByNombre(roleName)
                                                        .orElseThrow(() -> new DomainException("ROLE_NOT_FOUND",
                                                                        "Rol no encontrado: " + roleName,
                                                                        HttpStatus.NOT_FOUND)))
                                        .collect(Collectors.toSet());
                        user.setRoles(roles);
                }

                if (request.getBranchIds() != null) {
                        Set<Branch> branches = request.getBranchIds().stream()
                                        .map(branchId -> branchRepository.findByIdAndTenant_Id(branchId, tenantId)
                                                        .orElseThrow(() -> new DomainException("BRANCH_NOT_FOUND",
                                                                        "Sucursal no encontrada",
                                                                        HttpStatus.NOT_FOUND)))
                                        .collect(Collectors.toSet());
                        user.setBranches(branches);
                }

                user.setUpdatedBy(updaterId);
                user.setUpdatedAt(Instant.now());

                user = userRepository.save(user);
                log.info("Usuario actualizado: {} - ID: {}", user.getEmail(), id);

                return toDto(user);
        }

        /**
         * Elimina (soft delete) un usuario
         */
        public void delete(UUID tenantId, UUID id, UUID deleterId) {
                User user = userRepository.findByIdAndTenant_Id(id, tenantId)
                                .orElseThrow(() -> new DomainException("USER_NOT_FOUND",
                                                "Usuario no encontrado", HttpStatus.NOT_FOUND));

                user.setActivo(false);
                user.setDeletedAt(Instant.now());
                user.setUpdatedBy(deleterId);
                userRepository.save(user);

                log.info("Usuario eliminado: {} - ID: {}", user.getEmail(), id);
        }

        /**
         * Lista los roles disponibles
         */
        @Transactional(readOnly = true)
        public List<String> getAvailableRoles() {
                return roleRepository.findAll().stream()
                                .map(Role::getNombre)
                                .collect(Collectors.toList());
        }

        /**
         * Asigna roles a un usuario
         */
        public UserDto assignRoles(UUID tenantId, UUID id, UUID updaterId, List<String> roleNames) {
                User user = userRepository.findByIdAndTenant_Id(id, tenantId)
                                .orElseThrow(() -> new DomainException("USER_NOT_FOUND",
                                                "Usuario no encontrado", HttpStatus.NOT_FOUND));

                Set<Role> roles = roleNames.stream()
                                .map(roleName -> roleRepository.findByNombre(roleName)
                                                .orElseThrow(() -> new DomainException("ROLE_NOT_FOUND",
                                                                "Rol no encontrado: " + roleName,
                                                                HttpStatus.NOT_FOUND)))
                                .collect(Collectors.toSet());

                user.setRoles(roles);
                user.setUpdatedBy(updaterId);
                user.setUpdatedAt(Instant.now());

                user = userRepository.save(user);
                return toDto(user);
        }

        /**
         * Activa/Desactiva un usuario
         */
        public UserDto toggleActive(UUID tenantId, UUID id, UUID updaterId) {
                User user = userRepository.findByIdAndTenant_Id(id, tenantId)
                                .orElseThrow(() -> new DomainException("USER_NOT_FOUND",
                                                "Usuario no encontrado", HttpStatus.NOT_FOUND));

                user.setActivo(!user.getActivo());
                user.setUpdatedBy(updaterId);
                user.setUpdatedAt(Instant.now());

                user = userRepository.save(user);
                return toDto(user);
        }

        // Mapper
        private UserDto toDto(User user) {
                Set<String> permissions = user.getRoles().stream()
                                .flatMap(r -> r.getPermisos() != null ? Arrays.stream(r.getPermisos())
                                                : java.util.stream.Stream.empty())
                                .collect(Collectors.toSet());

                // Add enabled modules as permissions
                try {
                        List<String> userModules = userModuleAccessRepository
                                        .findEnabledModuleCodesByUserId(user.getId());
                        if (userModules != null) {
                                permissions.addAll(userModules);
                        }
                } catch (Exception e) {
                        log.error("Error loading user modules for user {}: {}", user.getId(), e.getMessage());
                }

                return UserDto.builder()
                                .id(user.getId())
                                .email(user.getEmail())
                                .nombre(user.getNombre())
                                .apellido(user.getApellido())
                                .telefono(user.getTelefono())
                                .activo(user.getActivo())
                                .emailVerificado(user.getEmailVerificado())
                                .ultimoLogin(user.getUltimoLogin())
                                .roles(user.getRoles().stream().map(Role::getNombre).collect(Collectors.toSet()))
                                .permissions(permissions)
                                .branches(user.getBranches().stream()
                                                .map(b -> UserDto.BranchInfo.builder()
                                                                .id(b.getId())
                                                                .nombre(b.getNombre())
                                                                .codigo(b.getCodigo())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .createdAt(user.getCreatedAt())
                                .build();
        }

        // ==================== Admin API Methods ====================

        /**
         * Cuenta total de usuarios en la plataforma (Super Admin)
         */
        public long countAll() {
                return userRepository.count();
        }

        /**
         * Lista usuarios globalmente con búsqueda y filtro por tenant (Super Admin)
         */
        @Transactional(readOnly = true)
        public Page<User> findAll(String search, UUID tenantId, Pageable pageable) {
                if (tenantId != null) {
                        if (search != null && !search.isBlank()) {
                                return userRepository.searchByTenantId(tenantId, search.toLowerCase(), pageable);
                        }
                        return userRepository.findByTenant_IdAndDeletedAtIsNull(tenantId, pageable);
                }

                if (search != null && !search.isBlank()) {
                        return userRepository.findByEmailContainingIgnoreCaseOrNombreContainingIgnoreCase(search,
                                        search, pageable);
                }

                return userRepository.findAll(pageable);
        }

        /**
         * Crea un usuario para un tenant específico (usado por Admin Wizard)
         */
        public User createForTenant(UUID tenantId, com.poscl.auth.api.dto.UserRequest request) {
                log.info("Creando usuario admin para tenant {}: {}", tenantId, request.getEmail());

                // Verificar email único globalmente
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new DomainException("EMAIL_EXISTS",
                                        "Ya existe un usuario con ese email", HttpStatus.CONFLICT);
                }

                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new DomainException("TENANT_NOT_FOUND",
                                                "Tenant no encontrado", HttpStatus.NOT_FOUND));

                // Obtener rol
                Set<Role> roles = new HashSet<>();
                if (request.getRoleName() != null) {
                        Role role = roleRepository.findByNombre(request.getRoleName())
                                        .orElseThrow(() -> new DomainException("ROLE_NOT_FOUND",
                                                        "Rol no encontrado: " + request.getRoleName(),
                                                        HttpStatus.NOT_FOUND));
                        roles.add(role);
                }

                User user = User.builder()
                                .tenant(tenant)
                                .email(request.getEmail())
                                .passwordHash(passwordEncoder.encode(request.getPassword()))
                                .nombre(request.getNombre())
                                .apellido(request.getApellido())
                                .telefono(request.getTelefono())
                                .activo(true)
                                .emailVerificado(false)
                                .roles(roles)
                                .branches(new HashSet<>())
                                .createdAt(Instant.now())
                                .build();

                user = userRepository.save(user);
                log.info("Usuario admin creado: {} - ID: {}", user.getEmail(), user.getId());

                return user;
        }

        /**
         * Actualiza un usuario (Super Admin)
         */
        public User updateForAdmin(UUID id, UpdateUserRequest request) {
                User user = userRepository.findById(id)
                                .orElseThrow(() -> new DomainException("USER_NOT_FOUND",
                                                "Usuario no encontrado", HttpStatus.NOT_FOUND));

                if (request.getNombre() != null)
                        user.setNombre(request.getNombre());
                if (request.getApellido() != null)
                        user.setApellido(request.getApellido());
                if (request.getTelefono() != null)
                        user.setTelefono(request.getTelefono());
                if (request.getActivo() != null)
                        user.setActivo(request.getActivo());

                if (request.getRoles() != null) {
                        Set<Role> roles = request.getRoles().stream()
                                        .map(roleName -> roleRepository.findByNombre(roleName)
                                                        .orElseThrow(() -> new DomainException("ROLE_NOT_FOUND",
                                                                        "Rol no encontrado: " + roleName,
                                                                        HttpStatus.NOT_FOUND)))
                                        .collect(Collectors.toSet());
                        user.setRoles(roles);
                }

                user.setUpdatedAt(Instant.now());
                return userRepository.save(user);
        }

        // ================== ADMIN ACTIONS ==================

        /**
         * Admin resets user password
         */
        public void adminResetPassword(UUID userId, String newPassword) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new DomainException("USER_NOT_FOUND",
                                                "Usuario no encontrado", HttpStatus.NOT_FOUND));

                user.setPasswordHash(passwordEncoder.encode(newPassword));
                user.setUpdatedAt(Instant.now());
                userRepository.save(user);
                log.info("Admin reset password for user: {}", user.getEmail());
        }

        /**
         * Toggle user active status
         */
        public User toggleStatus(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new DomainException("USER_NOT_FOUND",
                                                "Usuario no encontrado", HttpStatus.NOT_FOUND));

                user.setActivo(!Boolean.TRUE.equals(user.getActivo()));
                user.setUpdatedAt(Instant.now());
                log.info("Toggled user {} status to: {}", user.getEmail(), user.getActivo());
                return userRepository.save(user);
        }

        /**
         * Assign branches to user
         */
        public User assignBranches(UUID userId, Set<UUID> branchIds) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new DomainException("USER_NOT_FOUND",
                                                "Usuario no encontrado", HttpStatus.NOT_FOUND));

                Set<Branch> branches = branchIds.stream()
                                .map(id -> branchRepository.findById(id)
                                                .orElseThrow(() -> new DomainException("BRANCH_NOT_FOUND",
                                                                "Sucursal no encontrada: " + id, HttpStatus.NOT_FOUND)))
                                .collect(Collectors.toSet());

                user.setBranches(branches);
                user.setUpdatedAt(Instant.now());
                log.info("Assigned {} branches to user: {}", branches.size(), user.getEmail());
                return userRepository.save(user);
        }

        /**
         * Get user with branches
         */
        @Transactional(readOnly = true)
        public User findByIdWithBranches(UUID userId) {
                return userRepository.findById(userId)
                                .orElseThrow(() -> new DomainException("USER_NOT_FOUND",
                                                "Usuario no encontrado", HttpStatus.NOT_FOUND));
        }
}
