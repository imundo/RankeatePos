package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
    Page<Supplier> findByTenantId(UUID tenantId, Pageable pageable);

    List<Supplier> findByTenantIdAndActivoTrue(UUID tenantId);

    // Search by name or email
    Page<Supplier> findByTenantIdAndNombreContainingIgnoreCaseOrEmailContainingIgnoreCase(
            UUID tenantId, String nombre, String email, Pageable pageable);
}
