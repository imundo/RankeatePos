package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BranchRepository extends JpaRepository<Branch, UUID> {

    List<Branch> findByTenant_IdAndActivaTrue(UUID tenantId);

    Optional<Branch> findByTenant_IdAndCodigo(UUID tenantId, String codigo);

    @Query("SELECT b FROM Branch b WHERE b.tenant.id = :tenantId AND b.esPrincipal = true")
    Optional<Branch> findPrincipalByTenantId(UUID tenantId);

    boolean existsByTenant_IdAndCodigo(UUID tenantId, String codigo);

    @Query("SELECT b FROM Branch b WHERE b.id = :id AND b.tenant.id = :tenantId")
    Optional<Branch> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Branch> findByIdAndTenant_Id(UUID id, UUID tenantId);
}
