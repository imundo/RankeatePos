package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    
    Optional<Tenant> findByRut(String rut);
    
    boolean existsByRut(String rut);
    
    @Query("SELECT t FROM Tenant t WHERE t.id = :id AND t.activo = true AND t.deletedAt IS NULL")
    Optional<Tenant> findActiveById(UUID id);
    
    @Query("SELECT t FROM Tenant t LEFT JOIN FETCH t.branches WHERE t.id = :id")
    Optional<Tenant> findByIdWithBranches(UUID id);
}
