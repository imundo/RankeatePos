package com.poscl.accounting.domain.repository;

import com.poscl.accounting.domain.entity.CashFlowProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CashFlowProjectionRepository extends JpaRepository<CashFlowProjection, UUID> {
    
    List<CashFlowProjection> findByTenantIdAndProjectionDateBetweenOrderByProjectionDate(
        UUID tenantId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT SUM(cfp.projectedAmount) FROM CashFlowProjection cfp WHERE cfp.tenantId = :tenantId AND cfp.projectionDate BETWEEN :start AND :end AND cfp.type = 'INFLOW' AND cfp.status != 'CANCELLED'")
    BigDecimal getTotalInflowProjected(UUID tenantId, LocalDate start, LocalDate end);

    @Query("SELECT SUM(cfp.projectedAmount) FROM CashFlowProjection cfp WHERE cfp.tenantId = :tenantId AND cfp.projectionDate BETWEEN :start AND :end AND cfp.type = 'OUTFLOW' AND cfp.status != 'CANCELLED'")
    BigDecimal getTotalOutflowProjected(UUID tenantId, LocalDate start, LocalDate end);
}
