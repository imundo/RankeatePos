package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {
    Optional<LeaveBalance> findByEmployeeIdAndYear(UUID employeeId, int year);

    List<LeaveBalance> findByEmployeeIdOrderByYearDesc(UUID employeeId);

    @Query("SELECT lb FROM LeaveBalance lb WHERE lb.employee.tenantId = :tenantId AND lb.year = :year")
    List<LeaveBalance> findByTenantIdAndYear(UUID tenantId, int year);

    @Query("SELECT lb FROM LeaveBalance lb WHERE lb.year = :year AND (lb.lastAccruedMonth IS NULL OR lb.lastAccruedMonth < :month)")
    List<LeaveBalance> findBalancesNeedingAccrual(int year, int month);
}
