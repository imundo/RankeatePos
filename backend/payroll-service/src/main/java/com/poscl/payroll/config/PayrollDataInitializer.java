package com.poscl.payroll.config;

import com.poscl.payroll.domain.entity.Employee;
import com.poscl.payroll.domain.entity.PayrollPeriod;
import com.poscl.payroll.domain.repository.EmployeeRepository;
import com.poscl.payroll.domain.repository.PayrollPeriodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PayrollDataInitializer implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final PayrollPeriodRepository periodRepository;
    
    // Demo tenant ID
    private static final UUID DEMO_TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Override
    public void run(String... args) {
        if (employeeRepository.count() == 0) {
            log.info("Initializing demo payroll data...");
            initializeEmployees();
            initializePeriods();
            log.info("Demo payroll data initialized successfully");
        }
    }

    private void initializeEmployees() {
        createEmployee("12.345.678-9", "María", "González", "Gerente General", 2800000, "033", "FNS");
        createEmployee("11.222.333-4", "Juan", "Pérez", "Desarrollador Senior", 2200000, "033", "FNS");
        createEmployee("10.111.222-3", "Ana", "López", "Contadora", 2000000, "005", "FNS");
        createEmployee("9.888.777-6", "Pedro", "Martínez", "Vendedor", 1200000, "033", "FNS");
        createEmployee("8.777.666-5", "Carmen", "Torres", "Administrativa", 950000, "029", "FNS");
    }

    private void createEmployee(String rut, String firstName, String lastName, 
                                 String position, int baseSalary, String afpCode, String healthCode) {
        Employee emp = Employee.builder()
                .tenantId(DEMO_TENANT_ID)
                .rut(rut)
                .firstName(firstName)
                .lastName(lastName)
                .position(position)
                .department("General")
                .baseSalary(BigDecimal.valueOf(baseSalary))
                .afpCode(afpCode)
                .healthInsuranceCode(healthCode)
                .contractType(Employee.ContractType.INDEFINIDO)
                .hireDate(LocalDate.now().minusYears(1))
                .isActive(true)
                .build();
        employeeRepository.save(emp);
    }

    private void initializePeriods() {
        LocalDate now = LocalDate.now();
        
        // Current period
        PayrollPeriod currentPeriod = PayrollPeriod.builder()
                .tenantId(DEMO_TENANT_ID)
                .year(now.getYear())
                .month(now.getMonthValue())
                .status(PayrollPeriod.PeriodStatus.DRAFT)
                .totalGrossSalary(BigDecimal.valueOf(9150000))
                .totalNetSalary(BigDecimal.valueOf(7320000))
                .build();
        periodRepository.save(currentPeriod);
        
        // Previous period (closed)
        PayrollPeriod previousPeriod = PayrollPeriod.builder()
                .tenantId(DEMO_TENANT_ID)
                .year(now.minusMonths(1).getYear())
                .month(now.minusMonths(1).getMonthValue())
                .status(PayrollPeriod.PeriodStatus.PAID)
                .totalGrossSalary(BigDecimal.valueOf(9150000))
                .totalNetSalary(BigDecimal.valueOf(7320000))
                .build();
        periodRepository.save(previousPeriod);
    }
}
