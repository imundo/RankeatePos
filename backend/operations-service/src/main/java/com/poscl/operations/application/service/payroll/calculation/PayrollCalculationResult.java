package com.poscl.operations.application.service.payroll.calculation;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class PayrollCalculationResult {
    private BigDecimal baseSalary;
    private BigDecimal taxableIncome; // Imponible
    private BigDecimal totalBonuses;
    private BigDecimal totalDiscounts;
    private BigDecimal totalPaid; // Líquido

    private List<CalculatedItem> items;

    @Data
    @Builder
    public static class CalculatedItem {
        private String code;
        private String name;
        private String type; // INCOME, DEDUCTION, INFO
        private BigDecimal amount;
        private BigDecimal rate;
    }
}
