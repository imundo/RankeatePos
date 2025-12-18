package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.Tax;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxRepository extends JpaRepository<Tax, UUID> {
    
    @Query("SELECT t FROM Tax t WHERE t.tenantId = :tenantId AND t.activo = true")
    List<Tax> findActiveByTenantId(UUID tenantId);
    
    @Query("SELECT t FROM Tax t WHERE t.tenantId = :tenantId AND t.esDefault = true")
    Optional<Tax> findDefaultByTenantId(UUID tenantId);
    
    @Query("SELECT t FROM Tax t WHERE t.id = :id AND t.tenantId = :tenantId")
    Optional<Tax> findByIdAndTenantId(UUID id, UUID tenantId);
}
