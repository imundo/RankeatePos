package com.poscl.payroll.domain.repository;

import com.poscl.payroll.domain.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, UUID> {
    
    List<Payslip> findByPeriodId(UUID periodId);
    
    List<Payslip> findByEmployeeId(UUID employeeId);
    
    Optional<Payslip> findByPeriodIdAndEmployeeId(UUID periodId, UUID employeeId);
    
    @Query("SELECT SUM(p.grossSalary) FROM Payslip p WHERE p.periodId = :periodId")
    BigDecimal sumGrossSalaryByPeriodId(UUID periodId);
    
    @Query("SELECT SUM(p.netSalary) FROM Payslip p WHERE p.periodId = :periodId")
    BigDecimal sumNetSalaryByPeriodId(UUID periodId);
    
    long countByPeriodId(UUID periodId);
}
