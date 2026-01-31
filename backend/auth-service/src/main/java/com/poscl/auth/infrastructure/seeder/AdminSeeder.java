package com.poscl.auth.infrastructure.seeder;

import com.poscl.auth.domain.entity.Branch;
import com.poscl.auth.domain.entity.Module;
import com.poscl.auth.domain.entity.Tenant;
import com.poscl.auth.domain.entity.TenantModule;
import com.poscl.auth.domain.repository.*;
import com.poscl.shared.dto.BusinessType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final ModuleRepository moduleRepository;
    private final TenantRepository tenantRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserModuleAccessRepository userModuleAccessRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting Admin Seeder...");
        seedModules();
        seedDemoTenant();
        log.info("Admin Seeder completed.");
    }

    private void seedModules() {
        if (moduleRepository.count() > 0) {
            log.info("Modules already seeded, skipping.");
            return;
        }

        log.info("Creating modules...");
        List<Module> modules = Arrays.asList(
                createModule("pos", "Punto de Venta", "Operación de caja y ventas", "pos", "ventas", 1),
                createModule("inventory", "Inventario", "Gestión de stock y almacenes", "inventory", "operaciones", 2),
                createModule("recipes", "Recetas y Costos", "Fichas técnicas y mermas", "menu_book", "operaciones", 3),
                createModule("crm", "CRM Clientes", "Fidelización y base de datos", "groups", "marketing", 4),
                createModule("hrm", "Recursos Humanos", "Personal y turnos", "badge", "rrhh", 5),
                createModule("accounting", "Contabilidad", "Libros y reportes SII", "account_balance", "finanzas", 6));

        moduleRepository.saveAll(modules);
        log.info("Seeded {} modules.", modules.size());
    }

    private Module createModule(String code, String name, String desc, String icon, String cat, int order) {
        return Module.builder()
                .code(code)
                .name(name)
                .description(desc)
                .icon(icon)
                .category(cat)
                .sortOrder(order)
                .active(true)
                .build();
    }

    private void seedDemoTenant() {
        log.info("Seeding Demo Tenant...");
        java.util.Optional<Tenant> existingTenantOpt = tenantRepository.findByRut("76.123.456-7");
        if (existingTenantOpt.isPresent()) {
            repairTenantModules(existingTenantOpt.get());
            return;
        }

        // Create Tenant
        Tenant tenant = Tenant.builder()
                .rut("76.123.456-7")
                .razonSocial("Restaurante Demo SpA")
                .nombreFantasia("La Sazón del Dev")
                .giro("Restaurante y Comidas")
                .direccion("Av. Providencia 1234")
                .comuna("Providencia")
                .region("Metropolitana")
                .businessType(BusinessType.RESTAURANT)
                .plan("PREMIUM")
                .activo(true)
                .createdAt(Instant.now())
                .build();

        // Assign all modules
        List<Module> allModules = moduleRepository.findAll();
        for (Module m : allModules) {
            TenantModule tm = TenantModule.builder()
                    .tenant(tenant)
                    .module(m)
                    .active(true)
                    .build();
            tenant.addModule(tm);
        }

        // Add 2 Branches
        tenant.addBranch(Branch.builder()
                .nombre("Casa Matriz")
                .codigo("CM01")
                .direccion("Av. Providencia 1234")
                .telefono("+56911112222")
                .activa(true)
                .build());

        tenant.addBranch(Branch.builder()
                .nombre("Sucursal Norte")
                .codigo("SN02")
                .direccion("Av. Vitacura 5678")
                .telefono("+56933334444")
                .activa(true)
                .build());

        tenantRepository.save(tenant);
        log.info("Seeded Demo Tenant: La Sazón del Dev");
        repairUserModuleAccess(tenant);
        log.info("Demo Tenant seeding finished.");
    }

    private void repairTenantModules(Tenant tenant) {
        List<Module> allModules = moduleRepository.findAll();
        boolean changed = false;

        for (Module m : allModules) {
            boolean hasModule = tenant.getTenantModules().stream()
                    .anyMatch(tm -> tm.getModule().getId().equals(m.getId()));

            if (!hasModule) {
                TenantModule tm = TenantModule.builder()
                        .tenant(tenant)
                        .module(m)
                        .active(true)
                        .build();
                tenant.addModule(tm);
                changed = true;
                log.info("Repairing Demo Tenant: Added module {}", m.getCode());
            }
        }

        if (changed) {
            tenantRepository.save(tenant);
            log.info("Repaired Demo Tenant modules.");
        } else {
            log.info("Demo Tenant already has all modules.");
        }

        repairUserModuleAccess(tenant);
    }

    private void repairUserModuleAccess(Tenant tenant) {
        java.util.Optional<com.poscl.auth.domain.entity.User> adminOpt = userRepository
                .findByEmailAndTenantIdWithRoles("admin@eltrigal.cl", tenant.getId());

        com.poscl.auth.domain.entity.User admin = null;

        if (adminOpt.isPresent()) {
            admin = adminOpt.get();
        } else {
            java.util.Optional<com.poscl.auth.domain.entity.User> globalAdmin = userRepository
                    .findByEmailWithRolesAndBranches("admin@eltrigal.cl");

            if (globalAdmin.isPresent()) {
                admin = globalAdmin.get();
                // ONLY update tenant if the current tenant is clearly wrong (e.g. mismatched
                // ID)
                // AND we are sure 'tenant' passed here is the correct target (El Trigal).
                // In this case, we prefer NOT to move the user if they are already assigned to
                // a valid tenant.
                // We only grant modules.
                if (admin.getTenant() == null) {
                    log.info("Found detached admin@eltrigal.cl. Repairing linkage to tenant {}", tenant.getId());
                    admin.setTenant(tenant);
                    admin.setActivo(true);
                    admin.setDeletedAt(null);
                    admin = userRepository.save(admin);
                } else if (!admin.getTenant().getId().equals(tenant.getId())) {
                    // If user is on a different tenant, LOG WARNING but DO NOT Force Move to avoid
                    // flip-flopping
                    // unless the current tenant is 'La Sazón del Dev (Ghost)'
                    if (admin.getTenant().getNombreFantasia() != null
                            && admin.getTenant().getNombreFantasia().contains("(Ghost)")) {
                        log.info("Rescuing admin@eltrigal.cl from Ghost tenant to {}", tenant.getNombreFantasia());
                        admin.setTenant(tenant);
                        admin.setActivo(true);
                        admin = userRepository.save(admin);
                    } else {
                        log.warn("admin@eltrigal.cl found on tenant '{}' ({}) - Skipping forced move to '{}'",
                                admin.getTenant().getNombreFantasia(), admin.getTenant().getId(),
                                tenant.getNombreFantasia());
                    }
                }
            }
        }

        if (admin != null) {
            List<Module> allModules = moduleRepository.findAll();
            int grantedCount = 0;

            for (Module m : allModules) {
                if (!userModuleAccessRepository.existsByUserIdAndModuleIdAndEnabledTrue(admin.getId(), m.getId())) {
                    com.poscl.auth.domain.entity.UserModuleAccess access = com.poscl.auth.domain.entity.UserModuleAccess
                            .builder()
                            .userId(admin.getId())
                            .moduleId(m.getId())
                            .enabled(true)
                            .grantedAt(Instant.now())
                            .build();
                    userModuleAccessRepository.save(access);
                    grantedCount++;
                }
            }
            if (grantedCount > 0) {
                log.info("Repaired User Module Access: Granted {} modules to admin@eltrigal.cl", grantedCount);
            }
        }
    }
}
