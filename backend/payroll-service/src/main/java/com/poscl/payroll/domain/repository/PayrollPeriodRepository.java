package com.poscl.payroll.domain.repository;

import com.poscl.payroll.domain.entity.PayrollPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriod, UUID> {

    List<PayrollPeriod> findByTenantIdOrderByPeriodYearDescPeriodMonthDesc(UUID tenantId);

    Optional<PayrollPeriod> findByTenantIdAndPeriodYearAndPeriodMonth(UUID tenantId, int periodYear, int periodMonth);

    Optional<PayrollPeriod> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<PayrollPeriod> findFirstByTenantIdOrderByPeriodYearDescPeriodMonthDesc(UUID tenantId);
}
