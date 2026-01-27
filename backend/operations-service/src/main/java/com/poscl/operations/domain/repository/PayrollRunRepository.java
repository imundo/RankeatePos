package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.PayrollRun;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface PayrollRunRepository extends JpaRepository<PayrollRun, UUID> {
    List<PayrollRun> findByTenantIdOrderByPeriodStartDesc(UUID tenantId);
}
