package com.poscl.auth.api.controller;

import com.poscl.auth.api.dto.*;
import com.poscl.auth.application.service.AdminService;
import com.poscl.auth.application.service.TenantService;
import com.poscl.auth.application.service.UserService;
import com.poscl.auth.application.service.ModuleService;
import com.poscl.auth.application.service.PlanService;
import com.poscl.auth.application.service.UserAccessService;
import com.poscl.auth.domain.entity.Tenant;
import com.poscl.auth.domain.entity.User;
import com.poscl.auth.domain.entity.Module;
import com.poscl.auth.domain.entity.Plan;
import com.poscl.auth.domain.entity.UserModuleAccess;
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
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
    private final ModuleService moduleService;
    private final PlanService planService;
    private final UserAccessService userAccessService;

    private final AdminService adminService;

    // ==================== Platform Stats ====================

    @GetMapping("/stats")
    @Operation(summary = "Estadísticas de plataforma", description = "KPIs globales de SmartPos")
    public ResponseEntity<Map<String, Object>> getStats() {
        log.info("GET /api/admin/stats - Fetching platform stats");
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> getSystemHealth() {
        return ResponseEntity.ok(adminService.getSystemHealth());
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
        Tenant tenant = tenantService.findByIdWithModules(id);
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

        // Create tenant (without modules initially)
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

        // Assign modules
        if (request.getModules() != null && !request.getModules().isEmpty()) {
            tenantService.updateModules(tenant.getId(), request.getModules());
        } else {
            // Default modules based on plan (fallback)
            // For now, we enable standard modules for the demo
            // TODO: Use ModuleService or PlanService to get default modules
        }

        // Create Admin User
        try {
            CreateUserRequest userRequest = CreateUserRequest.builder()
                    .email(request.getAdminEmail())
                    .password(request.getAdminPassword())
                    .nombre(request.getAdminNombre())
                    .apellido(request.getAdminApellido())
                    .telefono(request.getAdminTelefono())
                    .roles(List.of("TENANT_ADMIN"))
                    .build();

            log.info("Creating admin user for tenant: {}", request.getAdminEmail());
            userService.create(tenant.getId(), null, userRequest);

        } catch (Exception e) {
            log.error("Error creating admin user: {}", e.getMessage());
            // We don't rollback tenant creation for now, but maybe we should?
            // For now just log it as the tenant is viable without user (can be added later)
        }

        return ResponseEntity.ok(WizardResultDto.builder()
                .tenantId(tenant.getId())
                .rut(tenant.getRut())
                .razonSocial(tenant.getRazonSocial())
                .message("Tenant creado exitosamente")
                .build());
    }

    @PutMapping("/tenants/{id}/modules")
    @Operation(summary = "Actualizar módulos de tenant", description = "Activar/Desactivar módulos para una empresa")
    public ResponseEntity<List<String>> updateTenantModules(@PathVariable UUID id,
            @RequestBody Map<String, Boolean> modules) {
        log.info("PUT /api/admin/tenants/{}/modules", id);
        tenantService.updateModules(id, modules);

        Tenant updatedTenant = tenantService.findById(id);
        return ResponseEntity.ok(updatedTenant.getTenantModules().stream()
                .filter(tm -> Boolean.TRUE.equals(tm.getActive()))
                .map(tm -> tm.getModule().getCode())
                .collect(Collectors.toList()));
    }

    @PutMapping("/tenants/{id}")
    @Operation(summary = "Actualizar tenant", description = "Permite editar datos comerciales y plan")
    public ResponseEntity<TenantDto> updateTenant(
            @PathVariable UUID id,
            @RequestBody TenantRequest request) {
        log.info("PUT /api/admin/tenants/{}", id);
        Tenant tenant = tenantService.update(id, request);
        return ResponseEntity.ok(toDto(tenant));
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

    @PostMapping("/tenants/{tenantId}/users")
    @Operation(summary = "Crear usuario para tenant", description = "Crea un usuario asociado a un tenant")
    public ResponseEntity<UserDto> createTenantUser(
            @PathVariable UUID tenantId,
            @RequestBody @Valid CreateUserRequest request) {
        log.info("POST /api/admin/tenants/{}/users - email: {}", tenantId, request.getEmail());
        UUID creatorId = null; // System/Admin
        UserDto user = userService.create(tenantId, creatorId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Actualizar usuario", description = "Actualiza datos y rol de un usuario")
    public ResponseEntity<UserDto> updateUser(@PathVariable UUID id, @RequestBody UpdateUserRequest request) {
        log.info("PUT /api/admin/users/{}", id);
        User user = userService.updateForAdmin(id, request);
        return ResponseEntity.ok(toUserDto(user));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Obtener usuario", description = "Obtiene datos de un usuario por ID")
    public ResponseEntity<UserDto> getUser(@PathVariable UUID id) {
        log.info("GET /api/admin/users/{}", id);
        User user = userService.findByIdWithBranches(id);
        return ResponseEntity.ok(toUserDto(user));
    }

    // ==================== Modules Management ====================

    @GetMapping("/modules")
    @Operation(summary = "Listar módulos", description = "Catálogo de funcionalidades del sistema")
    public ResponseEntity<List<ModuleDto>> listModules() {
        log.info("GET /api/admin/modules");
        List<ModuleDto> modules = moduleService.findAll().stream()
                .map(this::toModuleDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(modules);
    }

    @GetMapping("/modules/grouped")
    @Operation(summary = "Módulos agrupados por categoría", description = "Para UI de permisos")
    public ResponseEntity<Map<String, List<ModuleDto>>> listModulesGrouped() {
        log.info("GET /api/admin/modules/grouped");
        Map<String, List<ModuleDto>> grouped = moduleService.findAllGroupedByCategory()
                .entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().stream().map(this::toModuleDto).collect(Collectors.toList())));
        return ResponseEntity.ok(grouped);
    }

    @PostMapping("/modules")
    @Operation(summary = "Crear módulo", description = "Agrega un nuevo módulo al catálogo")
    public ResponseEntity<ModuleDto> createModule(@RequestBody Map<String, Object> request) {
        log.info("POST /api/admin/modules - creating: {}", request.get("code"));
        Module module = Module.builder()
                .code((String) request.get("code"))
                .name((String) request.get("name"))
                .description((String) request.get("description"))
                .icon((String) request.get("icon"))
                .category((String) request.getOrDefault("category", "Operaciones"))
                .sortOrder(request.get("sortOrder") != null ? ((Number) request.get("sortOrder")).intValue() : 0)
                .active(request.get("active") != null ? (Boolean) request.get("active") : true)
                .build();
        Module created = moduleService.create(module);
        return ResponseEntity.status(HttpStatus.CREATED).body(toModuleDto(created));
    }

    @PutMapping("/modules/{id}")
    @Operation(summary = "Actualizar módulo", description = "Edita nombre, icono, categoría, etc.")
    public ResponseEntity<ModuleDto> updateModule(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        log.info("PUT /api/admin/modules/{}", id);
        Module data = Module.builder()
                .name((String) request.get("name"))
                .description((String) request.get("description"))
                .icon((String) request.get("icon"))
                .category((String) request.get("category"))
                .sortOrder(request.get("sortOrder") != null ? ((Number) request.get("sortOrder")).intValue() : null)
                .active(request.get("active") != null ? (Boolean) request.get("active") : null)
                .build();
        Module updated = moduleService.update(id, data);
        return ResponseEntity.ok(toModuleDto(updated));
    }

    @DeleteMapping("/modules/{id}")
    @Operation(summary = "Eliminar módulo", description = "Elimina un módulo del catálogo")
    public ResponseEntity<Void> deleteModule(@PathVariable UUID id) {
        log.info("DELETE /api/admin/modules/{}", id);
        moduleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/modules/reorder")
    @Operation(summary = "Reordenar módulos", description = "Actualiza el orden de los módulos")
    public ResponseEntity<List<ModuleDto>> reorderModules(@RequestBody List<Map<String, Object>> items) {
        log.info("PUT /api/admin/modules/reorder - {} items", items.size());
        for (Map<String, Object> item : items) {
            UUID moduleId = UUID.fromString((String) item.get("id"));
            int sortOrder = ((Number) item.get("sortOrder")).intValue();
            moduleService.findById(moduleId).ifPresent(m -> {
                m.setSortOrder(sortOrder);
                moduleService.create(m); // save
            });
        }
        return ResponseEntity.ok(moduleService.findAll().stream().map(this::toModuleDto).collect(Collectors.toList()));
    }

    // ==================== Plans Management ====================

    @GetMapping("/plans")
    @Operation(summary = "Listar planes", description = "Planes de suscripción disponibles")
    public ResponseEntity<List<PlanDto>> listPlans() {
        log.info("GET /api/admin/plans");
        List<PlanDto> plans = planService.findAll().stream()
                .map(this::toPlanDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/plans/{code}")
    @Operation(summary = "Detalle de plan", description = "Información de un plan específico")
    public ResponseEntity<PlanDto> getPlan(@PathVariable String code) {
        log.info("GET /api/admin/plans/{}", code);
        return planService.findByCode(code)
                .map(plan -> ResponseEntity.ok(toPlanDto(plan)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/plans")
    @Operation(summary = "Crear plan", description = "Agrega un nuevo plan de suscripción")
    public ResponseEntity<PlanDto> createPlan(@RequestBody Map<String, Object> request) {
        log.info("POST /api/admin/plans - creating: {}", request.get("code"));
        Plan plan = Plan.builder()
                .code((String) request.get("code"))
                .name((String) request.get("name"))
                .description((String) request.get("description"))
                .price(request.get("price") != null ? new java.math.BigDecimal(request.get("price").toString())
                        : java.math.BigDecimal.ZERO)
                .currency((String) request.getOrDefault("currency", "CLP"))
                .billingCycle((String) request.getOrDefault("billingCycle", "monthly"))
                .includedModules(request.get("includedModules") != null ? (List<String>) request.get("includedModules")
                        : List.of("pos", "products"))
                .maxUsers(request.get("maxUsers") != null ? ((Number) request.get("maxUsers")).intValue() : 5)
                .maxBranches(request.get("maxBranches") != null ? ((Number) request.get("maxBranches")).intValue() : 1)
                .maxProducts(
                        request.get("maxProducts") != null ? ((Number) request.get("maxProducts")).intValue() : 500)
                .build();
        Plan created = planService.create(plan);
        return ResponseEntity.status(HttpStatus.CREATED).body(toPlanDto(created));
    }

    @PutMapping("/plans/{id}")
    @Operation(summary = "Actualizar plan", description = "Edita precio, módulos incluidos, límites")
    public ResponseEntity<PlanDto> updatePlan(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        log.info("PUT /api/admin/plans/{}", id);
        Plan data = Plan.builder()
                .name((String) request.get("name"))
                .description((String) request.get("description"))
                .price(request.get("price") != null ? new java.math.BigDecimal(request.get("price").toString()) : null)
                .includedModules(
                        request.get("includedModules") != null ? (List<String>) request.get("includedModules") : null)
                .maxUsers(request.get("maxUsers") != null ? ((Number) request.get("maxUsers")).intValue() : null)
                .maxBranches(
                        request.get("maxBranches") != null ? ((Number) request.get("maxBranches")).intValue() : null)
                .maxProducts(
                        request.get("maxProducts") != null ? ((Number) request.get("maxProducts")).intValue() : null)
                .active(request.get("active") != null ? (Boolean) request.get("active") : null)
                .build();
        Plan updated = planService.update(id, data);
        return ResponseEntity.ok(toPlanDto(updated));
    }

    @DeleteMapping("/plans/{id}")
    @Operation(summary = "Eliminar plan", description = "Elimina un plan de suscripción")
    public ResponseEntity<Void> deletePlan(@PathVariable UUID id) {
        log.info("DELETE /api/admin/plans/{}", id);
        planService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== User Permissions ====================

    @GetMapping("/users/{userId}/modules")
    @Operation(summary = "Permisos de usuario", description = "Lista de módulos habilitados para un usuario")
    public ResponseEntity<UserPermissionsDto> getUserPermissions(@PathVariable UUID userId) {
        log.info("GET /api/admin/users/{}/modules", userId);

        List<UserModuleAccess> access = userAccessService.getUserModules(userId);
        List<Module> allModules = moduleService.findAll();

        // Build complete permissions list
        Map<UUID, UserModuleAccess> accessMap = access.stream()
                .collect(Collectors.toMap(UserModuleAccess::getModuleId, a -> a));

        List<ModuleAccessDto> permissions = allModules.stream()
                .map(module -> {
                    UserModuleAccess a = accessMap.get(module.getId());
                    return ModuleAccessDto.builder()
                            .moduleId(module.getId())
                            .code(module.getCode())
                            .name(module.getName())
                            .icon(module.getIcon())
                            .category(module.getCategory())
                            .enabled(a != null && Boolean.TRUE.equals(a.getEnabled()))
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(UserPermissionsDto.builder()
                .userId(userId)
                .modules(permissions)
                .build());
    }

    @PutMapping("/users/{userId}/modules")
    @Operation(summary = "Actualizar permisos", description = "Actualiza todos los módulos de un usuario")
    public ResponseEntity<UserPermissionsDto> updateUserPermissions(
            @PathVariable UUID userId,
            @RequestBody Map<String, Boolean> moduleStates) {
        log.info("PUT /api/admin/users/{}/modules - {} modules", userId, moduleStates.size());

        // Convert module codes to IDs
        Map<UUID, Boolean> statesByIds = new HashMap<>();
        for (Map.Entry<String, Boolean> entry : moduleStates.entrySet()) {
            moduleService.findByCode(entry.getKey())
                    .ifPresent(module -> statesByIds.put(module.getId(), entry.getValue()));
        }

        userAccessService.updateUserModules(userId, statesByIds, null);

        return getUserPermissions(userId);
    }

    @PostMapping("/users/{userId}/modules/toggle")
    @Operation(summary = "Toggle módulo", description = "Habilita/deshabilita un módulo específico")
    public ResponseEntity<ModuleAccessDto> toggleUserModule(
            @PathVariable UUID userId,
            @RequestBody ToggleModuleRequest request) {
        log.info("POST /api/admin/users/{}/modules/toggle - {} = {}", userId, request.getModuleCode(),
                request.getEnabled());

        Module module = moduleService.findByCode(request.getModuleCode())
                .orElseThrow(() -> new RuntimeException("Module not found: " + request.getModuleCode()));

        UserModuleAccess access = userAccessService.toggleModule(userId, module.getId(), request.getEnabled(), null);

        return ResponseEntity.ok(ModuleAccessDto.builder()
                .moduleId(module.getId())
                .code(module.getCode())
                .name(module.getName())
                .icon(module.getIcon())
                .category(module.getCategory())
                .enabled(access.getEnabled())
                .build());
    }

    @PostMapping("/users/{userId}/modules/preset")
    @Operation(summary = "Aplicar preset", description = "Aplica un conjunto predefinido de permisos")
    public ResponseEntity<UserPermissionsDto> applyPreset(
            @PathVariable UUID userId,
            @RequestBody PresetRequest request) {
        log.info("POST /api/admin/users/{}/modules/preset - {}", userId, request.getPreset());

        userAccessService.applyPreset(userId, request.getPreset(), null);

        return getUserPermissions(userId);
    }

    @PostMapping("/users/{userId}/modules/copy-from/{sourceUserId}")
    @Operation(summary = "Copiar permisos", description = "Copia permisos de otro usuario")
    public ResponseEntity<UserPermissionsDto> copyPermissions(
            @PathVariable UUID userId,
            @PathVariable UUID sourceUserId) {
        log.info("POST /api/admin/users/{}/modules/copy-from/{}", userId, sourceUserId);

        userAccessService.copyPermissions(sourceUserId, userId, null);

        return getUserPermissions(userId);
    }

    // ==================== DTOs ====================

    private TenantDto toDto(Tenant tenant) {
        // Map active tenant modules to codes
        List<String> activeModules = tenant.getTenantModules() != null
                ? tenant.getTenantModules().stream()
                        .filter(tm -> Boolean.TRUE.equals(tm.getActive()))
                        .map(tm -> tm.getModule().getCode())
                        .collect(Collectors.toList())
                : List.of();

        return TenantDto.builder()
                .id(tenant.getId())
                .rut(tenant.getRut())
                .razonSocial(tenant.getRazonSocial())
                .nombreFantasia(tenant.getNombreFantasia())
                .businessType(tenant.getBusinessType())
                .plan(tenant.getPlan())
                .modules(activeModules)
                .activo(tenant.getActivo())
                .createdAt(tenant.getCreatedAt())
                .build();
    }

    private String getModulesForPlan(String plan) {
        return planService.findByCode(plan)
                .map(p -> p.getIncludedModules().toString().replace("[", "[\"").replace(", ", "\", \"").replace("]",
                        "\"]"))
                .orElse("[\"pos\", \"products\"]");
    }

    private UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nombre(user.getNombre())
                .apellido(user.getApellido())
                .activo(user.getActivo())
                .createdAt(user.getCreatedAt())
                .roles(user.getRoles() != null && !user.getRoles().isEmpty()
                        ? user.getRoles().stream().map(role -> role.getNombre()).collect(Collectors.toSet())
                        : new java.util.HashSet<>())
                .build();
    }

    private ModuleDto toModuleDto(Module module) {
        return ModuleDto.builder()
                .id(module.getId())
                .code(module.getCode())
                .name(module.getName())
                .description(module.getDescription())
                .icon(module.getIcon())
                .category(module.getCategory())
                .sortOrder(module.getSortOrder())
                .active(module.getActive())
                .build();
    }

    private PlanDto toPlanDto(Plan plan) {
        return PlanDto.builder()
                .id(plan.getId())
                .code(plan.getCode())
                .name(plan.getName())
                .description(plan.getDescription())
                .price(plan.getPrice())
                .currency(plan.getCurrency())
                .billingCycle(plan.getBillingCycle())
                .includedModules(plan.getIncludedModules())
                .maxUsers(plan.getMaxUsers())
                .maxBranches(plan.getMaxBranches())
                .maxProducts(plan.getMaxProducts())
                .active(plan.getActive())
                .build();
    }
}
