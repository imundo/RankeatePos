package com.poscl.sales.domain.repository;

import com.poscl.sales.domain.entity.CashSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CashSessionRepository extends JpaRepository<CashSession, UUID> {

    @Query("SELECT cs FROM CashSession cs WHERE cs.register.id = :registerId AND cs.estado = 'ABIERTA'")
    Optional<CashSession> findOpenByRegisterId(UUID registerId);

    @Query("SELECT cs FROM CashSession cs WHERE cs.userId = :userId AND cs.estado = 'ABIERTA'")
    Optional<CashSession> findOpenByUserId(UUID userId);

    @Query("SELECT cs FROM CashSession cs LEFT JOIN FETCH cs.sales WHERE cs.id = :id AND cs.tenantId = :tenantId")
    Optional<CashSession> findByIdAndTenantIdWithSales(UUID id, UUID tenantId);

    @Query("SELECT cs FROM CashSession cs WHERE cs.id = :id AND cs.tenantId = :tenantId")
    Optional<CashSession> findByIdAndTenantId(UUID id, UUID tenantId);

    List<CashSession> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    // Find any open session for the tenant (cierreAt is null means open)
    Optional<CashSession> findFirstByTenantIdAndCierreAtIsNullOrderByAperturaAtDesc(UUID tenantId);
}
