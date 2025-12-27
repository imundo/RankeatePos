package com.poscl.accounting.domain.repository;

import com.poscl.accounting.domain.entity.BudgetLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BudgetLineRepository extends JpaRepository<BudgetLine, UUID> {
    
    List<BudgetLine> findByTenantIdAndFiscalPeriodId(UUID tenantId, UUID fiscalPeriodId);

    @Query("SELECT bl FROM BudgetLine bl JOIN FETCH bl.account WHERE bl.tenantId = :tenantId AND bl.fiscalPeriod.id = :periodId ORDER BY bl.account.code")
    List<BudgetLine> findByTenantIdAndPeriodWithAccount(UUID tenantId, UUID periodId);
}
