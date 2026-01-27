package com.poscl.operations.api.dto;

import com.poscl.operations.domain.entity.EmployeePayrollConfig;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class PayrollConfigDto {
    private UUID id;
    private UUID employeeId;

    // Health
    private EmployeePayrollConfig.HealthSystemType healthSystem;
    private String isapreName;
    private BigDecimal healthRate;
    private BigDecimal isapreAdditionalUf;

    // Pension
    private String afpName;
    private BigDecimal afpRate;
    private boolean hasApv;
    private BigDecimal apvMonthlyAmount;

    // Gratification
    private EmployeePayrollConfig.GratificationType gratificationType;
    private BigDecimal gratificationAmount;

    // Allowances
    private boolean hasLunchAllowance;
    private BigDecimal lunchAllowanceAmount;
    private boolean hasTransportAllowance;
    private BigDecimal transportAllowanceAmount;

    // Overtime
    private boolean exemptFromOvertime;
    private BigDecimal overtimeMultiplier;
}
