package com.poscl.purchases.domain.repository;

import com.poscl.purchases.domain.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
    Page<Supplier> findByTenantIdAndIsActiveOrderByBusinessName(UUID tenantId, Boolean isActive, Pageable pageable);
    Optional<Supplier> findByTenantIdAndRut(UUID tenantId, String rut);
    boolean existsByTenantIdAndRut(UUID tenantId, String rut);
}
