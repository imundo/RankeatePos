package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.ServiceCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalog, UUID> {

    List<ServiceCatalog> findByTenantIdAndActivoTrueOrderByOrdenAsc(UUID tenantId);

    List<ServiceCatalog> findByTenantIdOrderByOrdenAsc(UUID tenantId);

    List<ServiceCatalog> findByTenantIdAndCategoriaOrderByOrdenAsc(UUID tenantId, String categoria);

    Optional<ServiceCatalog> findByIdAndTenantId(UUID id, UUID tenantId);

    List<ServiceCatalog> findByTenantIdAndBranchIdAndActivoTrueOrderByOrdenAsc(UUID tenantId, UUID branchId);
}
