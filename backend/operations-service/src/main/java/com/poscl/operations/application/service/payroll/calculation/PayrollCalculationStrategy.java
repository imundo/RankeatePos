package com.poscl.operations.application.service.payroll.calculation;

import com.poscl.operations.domain.entity.Employee;
import java.time.LocalDate;

public interface PayrollCalculationStrategy {
    boolean supports(String countryCode);

    PayrollCalculationResult calculate(Employee employee, LocalDate periodStart, LocalDate periodEnd,
            PayrollInputData inputData);
}
