package com.poscl.operations.application.service;

import com.poscl.operations.application.service.payroll.calculation.PayrollCalculationResult;
import com.poscl.operations.application.service.payroll.calculation.PayrollCalculationStrategy;
import com.poscl.operations.domain.entity.*;
import com.poscl.operations.domain.repository.EmployeeRepository;
import com.poscl.operations.domain.repository.PayrollRepository;
import com.poscl.operations.domain.repository.PayrollRunRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayrollRunRepository payrollRunRepository;
    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    private final List<PayrollCalculationStrategy> calculators;

    @Transactional
    public PayrollRun createMonthlyRun(UUID tenantId, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        // 1. Create Run Header
        PayrollRun run = PayrollRun.builder()
                .tenantId(tenantId)
                .periodStart(start)
                .periodEnd(end)
                .name("Nómina " + getMonthName(month) + " " + year)
                .status("DRAFT")
                .totalEmployees(0)
                .totalAmount(BigDecimal.ZERO)
                .build();

        run = payrollRunRepository.save(run);

        // 2. Fetch Active Employees
        // Note: Using findAll for simplicity, should filter by tenant and active status
        // properly
        List<Employee> employees = employeeRepository.findByTenantId(tenantId).stream()
                .filter(Employee::isActive)
                .toList();

        List<Payroll> payrolls = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Employee employee : employees) {
            // Find Strategy (Defaulting to CL as we don't have country config in tenant yet
            // everywhere)
            String country = employee.getCountryCode() != null ? employee.getCountryCode() : "CL";
            PayrollCalculationStrategy strategy = calculators.stream()
                    .filter(s -> s.supports(country))
                    .findFirst()
                    .orElseThrow(
                            () -> new IllegalStateException("No payroll calculator found for country: " + country));

            // Calculate
            // Ensure employee has config, skip if not? Or fail? Let's skip safely for MVP
            if (employee.getPayrollConfig() == null) {
                continue;
            }

            PayrollCalculationResult result = strategy.calculate(employee, start, end);

            // Mapper
            Payroll payroll = Payroll.builder()
                    .payrollRunId(run.getId())
                    .employee(employee)
                    .periodStart(start)
                    .periodEnd(end)
                    .baseSalary(result.getBaseSalary())
                    .taxableIncome(result.getTaxableIncome())
                    .totalBonuses(result.getTotalBonuses())
                    .totalDiscounts(result.getTotalDiscounts())
                    .totalPaid(result.getTotalPaid())
                    .status("DRAFT")
                    .build();

            // Map Details
            List<PayrollDetail> details = result.getItems().stream()
                    .map(item -> PayrollDetail.builder()
                            .payroll(payroll)
                            .conceptCode(item.getCode())
                            .conceptName(item.getName())
                            .conceptType(item.getType())
                            .amount(item.getAmount())
                            .rate(item.getRate())
                            .build())
                    .toList();

            payroll.setDetails(details);
            payrolls.add(payroll);

            totalAmount = totalAmount.add(result.getTotalPaid());
        }

        payrollRepository.saveAll(payrolls);

        // Update Run Totals
        run.setTotalEmployees(payrolls.size());
        run.setTotalAmount(totalAmount);
        return payrollRunRepository.save(run);
    }

    public List<Payroll> getLastPayrolls(UUID tenantId) {
        return payrollRepository.findByTenantIdOrderByPeriodStartDesc(tenantId);
    }

    private String getMonthName(int month) {
        String[] months = { "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre",
                "Octubre", "Noviembre", "Diciembre" };
        return (month >= 1 && month <= 12) ? months[month] : "Mes " + month;
    }
}
