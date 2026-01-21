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

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting Admin Seeder...");
        seedModules();
        seedDemoTenant();
        log.info("Admin Seeder completed.");
    }

    private void seedModules() {
        if (moduleRepository.count() > 0)
            return;

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
        if (tenantRepository.findByRut("76.123.456-7").isPresent())
            return;

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
                .activo(true)
                .build());

        tenant.addBranch(Branch.builder()
                .nombre("Sucursal Norte")
                .codigo("SN02")
                .direccion("Av. Vitacura 5678")
                .telefono("+56933334444")
                .activo(true)
                .build());

        tenantRepository.save(tenant);
        log.info("Seeded Demo Tenant: La Sazón del Dev");
    }
}
