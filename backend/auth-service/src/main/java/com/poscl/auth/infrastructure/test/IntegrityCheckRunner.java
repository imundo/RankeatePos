package com.poscl.auth.infrastructure.test;

import com.poscl.auth.api.dto.CreateUserRequest;
import com.poscl.auth.application.service.TenantService;
import com.poscl.auth.application.service.UserService;
import com.poscl.auth.domain.entity.Tenant;
import com.poscl.auth.domain.entity.User;
import com.poscl.auth.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class IntegrityCheckRunner implements CommandLineRunner {

    private final UserService userService;
    private final TenantService tenantService;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("========================================");
        log.info("🔍 STARTING DATABASE INTEGRITY CHECK...");
        log.info("========================================");

        try {
            // 1. Verify Tenant Read
            long tenantCount = tenantService.countAll();
            log.info("✅ REQUESTED TENANT COUNT. Result: {}", tenantCount);

            if (tenantCount == 0) {
                log.warn("⚠️ No tenants found. Skipping user creation test.");
                return;
            }

            Pageable firstOne = org.springframework.data.domain.PageRequest.of(0, 1);
            Tenant tenant = tenantService.findAll(null, null, firstOne).getContent().get(0);
            log.info("✅ TENANT READ SUCCESS. Using Tenant: {}", tenant.getRazonSocial());

            // 2. Verify User Write (Persistence)
            String testEmail = "integrity_test_" + System.currentTimeMillis() + "@smartpos.cl";
            log.info("🔄 ATTEMPTING TO PERSIST TEST USER: {}", testEmail);

            CreateUserRequest request = CreateUserRequest.builder()
                    .email(testEmail)
                    .password("Test1234!")
                    .nombre("Integrity")
                    .apellido("Test")
                    .roles(List.of("TENANT_USER")) // Assuming this role exists or will be mapped
                    .build();

            // We use a try-catch to avoid breaking startup if this specific part fails,
            // but we want to log the result clearly.
            try {
                // Use a 'system' creator ID (all zeros)
                UUID systemId = UUID.fromString("00000000-0000-0000-0000-000000000000");
                userService.create(tenant.getId(), systemId, request);
                log.info("✅ USER CREATION METHOD EXECUTION: SUCCESS");

                // 3. Verify User Read (Consistency)
                boolean exists = userRepository.existsByEmail(testEmail);
                if (exists) {
                    log.info("✅ PERSISTENCE VERIFIED: User '{}' was found in DB immediately after save.", testEmail);
                    log.info("🎉 INTEGRITY CHECK PASSED: API-DB connection is HEALTHY and WRITABLE.");
                } else {
                    log.error("❌ PERSISTENCE FAILED: User '{}' NOT found in DB after save.", testEmail);
                }

                // Cleanup (Optional - to keep DB clean)
                userRepository.findByEmail(testEmail).ifPresent(u -> {
                    u.setDeletedAt(Instant.now());
                    userRepository.save(u);
                    log.info("🧹 Cleanup: Test user soft-deleted.");
                });

            } catch (Exception e) {
                log.error("❌ WRITE TEST FAILED: {}", e.getMessage(), e);
            }

        } catch (Exception e) {
            log.error("❌ INTEGRITY CHECK FAILED: Service did not respond correctly.", e);
        }

        log.info("========================================");
    }
}
