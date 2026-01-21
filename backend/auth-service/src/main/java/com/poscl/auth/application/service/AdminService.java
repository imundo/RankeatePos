package com.poscl.auth.application.service;

import com.poscl.auth.domain.repository.TenantRepository;
import com.poscl.auth.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    // Inject other clients/services if needed for health checks

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalTenants = tenantRepository.count();
        long activeTenants = tenantRepository.countByActivoTrue();
        long totalUsers = userRepository.count();

        // MRR Calculation (simplified simulation based on plans)
        // In reality, this would query a Subscription/Billing entity
        double estimatedMrr = activeTenants * 29990.0; // Basic plan average

        stats.put("totalTenants", totalTenants);
        stats.put("activeTenants", activeTenants);
        stats.put("totalUsers", totalUsers);
        stats.put("mrr", estimatedMrr);

        return stats;
    }

    public Map<String, String> getSystemHealth() {
        Map<String, String> health = new HashMap<>();
        health.put("auth-service", "UP");
        health.put("database", "UP");
        // Add logic to ping other services via Feign/WebClient
        return health;
    }
}
