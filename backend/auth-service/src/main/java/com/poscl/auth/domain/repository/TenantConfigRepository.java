package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.TenantConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantConfigRepository extends JpaRepository<TenantConfig, UUID> {
    List<TenantConfig> findByTenantId(UUID tenantId);

    Optional<TenantConfig> findByTenantIdAndKey(UUID tenantId, String key);

    void deleteByTenantIdAndKey(UUID tenantId, String key);
}
