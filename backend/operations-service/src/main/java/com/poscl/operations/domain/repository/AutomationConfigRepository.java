package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.AutomationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AutomationConfigRepository extends JpaRepository<AutomationConfig, UUID> {
    Optional<AutomationConfig> findByTenantId(UUID tenantId);
}
