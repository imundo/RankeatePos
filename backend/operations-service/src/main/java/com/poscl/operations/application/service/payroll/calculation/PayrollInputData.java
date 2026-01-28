package com.poscl.operations.application.service.payroll.calculation;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PayrollInputData {
    private BigDecimal workedDays;
    private BigDecimal vacationDays;
    private BigDecimal sickLeaveDays;
    private BigDecimal unjustifiedAbsences;
}
