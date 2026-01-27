package com.poscl.operations.api.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class LeaveBalanceDto {
    private UUID id;
    private UUID employeeId;
    private int year;
    private String countryCode;
    private BigDecimal daysEntitled;
    private BigDecimal daysAccrued;
    private BigDecimal daysTaken;
    private BigDecimal daysRemaining;
    private BigDecimal monthlyAccrualRate;
    private BigDecimal seniorityBonusDays;
    private BigDecimal carryoverDays;
    private Integer lastAccruedMonth;
}
