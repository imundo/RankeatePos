package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface PayrollRepository extends JpaRepository<Payroll, UUID> {
    List<Payroll> findByPayrollRunId(UUID payrollRunId);

    List<Payroll> findByTenantIdOrderByPeriodStartDesc(UUID tenantId);

    List<Payroll> findByEmployee_IdOrderByPeriodStartDesc(UUID employeeId);
}
