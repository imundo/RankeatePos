package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, UUID> {
    List<Payroll> findByTenantIdAndPeriodStartBetween(UUID tenantId, LocalDate start, LocalDate end);

    List<Payroll> findByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);
}
