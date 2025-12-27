package com.poscl.payroll.application.service;

import com.poscl.payroll.domain.entity.Employee;
import com.poscl.payroll.domain.entity.PayrollPeriod;
import com.poscl.payroll.domain.entity.Payslip;
import com.poscl.payroll.domain.repository.PayrollPeriodRepository;
import com.poscl.payroll.domain.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollPeriodService {

    private final PayrollPeriodRepository periodRepository;
    private final PayslipRepository payslipRepository;
    private final EmployeeService employeeService;

    @Transactional(readOnly = true)
    public List<PayrollPeriod> findAll(UUID tenantId) {
        return periodRepository.findByTenantIdOrderByYearDescMonthDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<PayrollPeriod> findById(UUID tenantId, UUID id) {
        return periodRepository.findByIdAndTenantId(id, tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<PayrollPeriod> getCurrentPeriod(UUID tenantId) {
        return periodRepository.findFirstByTenantIdOrderByYearDescMonthDesc(tenantId);
    }

    @Transactional
    public PayrollPeriod create(UUID tenantId, int year, int month) {
        if (periodRepository.findByTenantIdAndYearAndMonth(tenantId, year, month).isPresent()) {
            throw new IllegalArgumentException("Ya existe un período para " + month + "/" + year);
        }
        
        PayrollPeriod period = PayrollPeriod.builder()
                .tenantId(tenantId)
                .year(year)
                .month(month)
                .status(PayrollPeriod.PeriodStatus.DRAFT)
                .build();
        
        return periodRepository.save(period);
    }

    @Transactional
    public PayrollPeriod process(UUID tenantId, UUID periodId) {
        PayrollPeriod period = periodRepository.findByIdAndTenantId(periodId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Período no encontrado"));
        
        if (period.getStatus() != PayrollPeriod.PeriodStatus.DRAFT) {
            throw new IllegalStateException("Solo se pueden procesar períodos en estado DRAFT");
        }
        
        // Get active employees and generate payslips
        List<Employee> employees = employeeService.findActive(tenantId);
        for (Employee emp : employees) {
            generatePayslip(period, emp);
        }
        
        // Update period totals
        BigDecimal totalGross = payslipRepository.sumGrossSalaryByPeriodId(periodId);
        BigDecimal totalNet = payslipRepository.sumNetSalaryByPeriodId(periodId);
        period.setTotalGrossSalary(totalGross != null ? totalGross : BigDecimal.ZERO);
        period.setTotalNetSalary(totalNet != null ? totalNet : BigDecimal.ZERO);
        period.setStatus(PayrollPeriod.PeriodStatus.PROCESSED);
        
        log.info("Processed payroll period: {}/{} with {} employees", period.getMonth(), period.getYear(), employees.size());
        return periodRepository.save(period);
    }

    private void generatePayslip(PayrollPeriod period, Employee employee) {
        if (payslipRepository.findByPeriodIdAndEmployeeId(period.getId(), employee.getId()).isPresent()) {
            return; // Already exists
        }
        
        BigDecimal baseSalary = employee.getBaseSalary() != null ? employee.getBaseSalary() : BigDecimal.ZERO;
        
        // Chilean payroll calculations
        BigDecimal afpRate = new BigDecimal("0.1025");
        BigDecimal healthRate = new BigDecimal("0.07");
        BigDecimal unemploymentRate = new BigDecimal("0.006");
        
        BigDecimal afpAmount = baseSalary.multiply(afpRate).setScale(0, RoundingMode.HALF_UP);
        BigDecimal healthAmount = baseSalary.multiply(healthRate).setScale(0, RoundingMode.HALF_UP);
        BigDecimal unemploymentAmount = baseSalary.multiply(unemploymentRate).setScale(0, RoundingMode.HALF_UP);
        
        BigDecimal taxableIncome = baseSalary.subtract(afpAmount).subtract(healthAmount);
        BigDecimal taxAmount = calculateTax(taxableIncome);
        
        BigDecimal totalDeductions = afpAmount.add(healthAmount).add(unemploymentAmount).add(taxAmount);
        BigDecimal netSalary = baseSalary.subtract(totalDeductions);
        
        Payslip payslip = Payslip.builder()
                .periodId(period.getId())
                .employeeId(employee.getId())
                .baseSalary(baseSalary)
                .grossSalary(baseSalary)
                .afpAmount(afpAmount)
                .afpCode(employee.getAfpCode())
                .healthAmount(healthAmount)
                .healthCode(employee.getHealthInsuranceCode())
                .unemploymentAmount(unemploymentAmount)
                .taxAmount(taxAmount)
                .totalDeductions(totalDeductions)
                .netSalary(netSalary)
                .daysWorked(30)
                .build();
        
        payslipRepository.save(payslip);
    }

    private BigDecimal calculateTax(BigDecimal taxableIncome) {
        // Simplified Chilean tax calculation
        int income = taxableIncome.intValue();
        if (income <= 800000) return BigDecimal.ZERO;
        if (income <= 1600000) return BigDecimal.valueOf((income - 800000) * 0.04);
        if (income <= 2400000) return BigDecimal.valueOf(32000 + (income - 1600000) * 0.08);
        if (income <= 3200000) return BigDecimal.valueOf(96000 + (income - 2400000) * 0.135);
        return BigDecimal.valueOf(204000 + (income - 3200000) * 0.23);
    }

    @Transactional(readOnly = true)
    public List<Payslip> getPayslips(UUID periodId) {
        return payslipRepository.findByPeriodId(periodId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPeriodSummary(UUID tenantId, UUID periodId) {
        PayrollPeriod period = periodRepository.findByIdAndTenantId(periodId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Período no encontrado"));
        
        return Map.of(
            "id", period.getId(),
            "year", period.getYear(),
            "month", period.getMonth(),
            "status", period.getStatus(),
            "totalGross", period.getTotalGrossSalary() != null ? period.getTotalGrossSalary() : BigDecimal.ZERO,
            "totalNet", period.getTotalNetSalary() != null ? period.getTotalNetSalary() : BigDecimal.ZERO,
            "employeeCount", payslipRepository.countByPeriodId(periodId)
        );
    }
}
