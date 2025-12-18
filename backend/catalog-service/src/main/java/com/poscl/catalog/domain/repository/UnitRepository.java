package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<Unit, UUID> {
    
    @Query("SELECT u FROM Unit u WHERE u.tenantId IS NULL OR u.tenantId = :tenantId ORDER BY u.nombre")
    List<Unit> findAvailableForTenant(UUID tenantId);
    
    @Query("SELECT u FROM Unit u WHERE u.tenantId IS NULL")
    List<Unit> findGlobalUnits();
    
    Optional<Unit> findByCodigo(String codigo);
}
