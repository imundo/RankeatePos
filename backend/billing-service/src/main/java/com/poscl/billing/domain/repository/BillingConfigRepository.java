package com.poscl.billing.domain.repository;

import com.poscl.billing.domain.entity.BillingConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillingConfigRepository extends JpaRepository<BillingConfig, UUID> {
    Optional<BillingConfig> findByTenantId(UUID tenantId);
}
