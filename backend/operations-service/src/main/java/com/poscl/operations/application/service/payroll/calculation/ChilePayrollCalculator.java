package com.poscl.operations.application.service.payroll.calculation;

import com.poscl.operations.domain.entity.Employee;
import com.poscl.operations.domain.entity.EmployeePayrollConfig;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class ChilePayrollCalculator implements PayrollCalculationStrategy {

    // Constants 2024 (Should be in DB/Config)
    private static final BigDecimal IMM = new BigDecimal("500000"); // Ingreso Mínimo Mensual
    private static final BigDecimal TOPE_GRATIFICACION = IMM.multiply(new BigDecimal("4.75"))
            .divide(new BigDecimal("12"), 0, RoundingMode.DOWN);
    private static final BigDecimal TOPE_IMPONIBLE_AFP = new BigDecimal("84.3").multiply(new BigDecimal("36000")); // UF
                                                                                                                   // aprox
    private static final BigDecimal SEGURO_CESANTIA_RATE = new BigDecimal("0.006"); // 0.6% contrato indefinido

    @Override
    public boolean supports(String countryCode) {
        return "CL".equalsIgnoreCase(countryCode);
    }

    @Override
    public PayrollCalculationResult calculate(Employee employee, LocalDate periodStart, LocalDate periodEnd) {
        EmployeePayrollConfig config = employee.getPayrollConfig();
        if (config == null) {
            throw new IllegalStateException("Employee " + employee.getFullName() + " has no payroll config");
        }

        BigDecimal baseSalary = employee.getBaseSalary() != null ? employee.getBaseSalary() : BigDecimal.ZERO;
        List<PayrollCalculationResult.CalculatedItem> items = new ArrayList<>();

        // 1. Haberes Imponibles
        addIncome(items, "SUELDO_BASE", "Sueldo Base", baseSalary);

        // Gratificación
        BigDecimal gratification = BigDecimal.ZERO;
        if (EmployeePayrollConfig.GratificationType.MONTHLY.equals(config.getGratificationType())) {
            gratification = baseSalary.multiply(new BigDecimal("0.25"));
            if (gratification.compareTo(TOPE_GRATIFICACION) > 0) {
                gratification = TOPE_GRATIFICACION;
            }
            addIncome(items, "GRATIFICACION", "Gratificación Legal", gratification);
        }

        // Bonos (Imponibles por defecto para simplificar MVP)
        // TODO: Load bonuses from employee_bonuses table (simulated here if linked, but
        // for MVP we assume base fixed bonuses?)
        // Let's assume passed via calculation context in future versions.

        BigDecimal totalImponible = baseSalary.add(gratification);
        // Apply Cap
        BigDecimal imponibleParaPrevisional = totalImponible.min(TOPE_IMPONIBLE_AFP);

        // 2. Descuentos Previsionales (AFP, Salud, Cesantía)

        // AFP
        BigDecimal afpRate = config.getAfpRate().divide(new BigDecimal("100"));
        BigDecimal afpAmount = imponibleParaPrevisional.multiply(afpRate).setScale(0, RoundingMode.HALF_UP);
        addDeduction(items, "AFP_" + (config.getAfpName() != null ? config.getAfpName().toUpperCase() : "UNKNOWN"),
                "AFP " + (config.getAfpName() != null ? config.getAfpName() : ""), afpAmount, afpRate);

        // Salud
        BigDecimal healthAmount;
        if (EmployeePayrollConfig.HealthSystemType.FONASA.equals(config.getHealthSystem())) {
            BigDecimal healthRate = new BigDecimal("0.07");
            healthAmount = imponibleParaPrevisional.multiply(healthRate).setScale(0, RoundingMode.HALF_UP);
            addDeduction(items, "SALUD_FONASA", "Salud FONASA (7%)", healthAmount, healthRate);
        } else {
            // Isapre
            BigDecimal isapreRate = config.getHealthRate().divide(new BigDecimal("100"));
            healthAmount = imponibleParaPrevisional.multiply(isapreRate).setScale(0, RoundingMode.HALF_UP);
            addDeduction(items, "SALUD_ISAPRE", "Isapre " + config.getIsapreName(), healthAmount, isapreRate);
        }

        // Seguro Cesantía
        BigDecimal cesantiaAmount = imponibleParaPrevisional.multiply(SEGURO_CESANTIA_RATE).setScale(0,
                RoundingMode.HALF_UP);
        addDeduction(items, "E_CESANTIA", "Seguro Cesantía (0.6%)", cesantiaAmount, SEGURO_CESANTIA_RATE);

        BigDecimal totalPrevisional = afpAmount.add(healthAmount).add(cesantiaAmount);

        // 3. Impuesto Único (Tributable)
        BigDecimal baseTributable = totalImponible.subtract(totalPrevisional);
        BigDecimal impuesto = calculateIncomeTax(baseTributable);
        if (impuesto.compareTo(BigDecimal.ZERO) > 0) {
            addDeduction(items, "IMPUESTO_UNICO", "Impuesto Único 2da Cat", impuesto, null);
        }

        // 4. Haberes No Imponibles (Colación, Movilización)
        BigDecimal colacion = BigDecimal.ZERO;
        if (config.isHasLunchAllowance() && config.getLunchAllowanceAmount() != null) {
            colacion = config.getLunchAllowanceAmount();
            addNonTaxable(items, "COLACION", "Asignación Colación", colacion);
        }

        BigDecimal movilizacion = BigDecimal.ZERO;
        if (config.isHasTransportAllowance() && config.getTransportAllowanceAmount() != null) {
            movilizacion = config.getTransportAllowanceAmount();
            addNonTaxable(items, "MOVILIZACION", "Asignación Movilización", movilizacion);
        }

        BigDecimal totalNoImponible = colacion.add(movilizacion);

        // 5. Totales
        BigDecimal totalDiscounts = totalPrevisional.add(impuesto);
        BigDecimal totalLiquido = totalImponible.subtract(totalDiscounts).add(totalNoImponible);

        return PayrollCalculationResult.builder()
                .baseSalary(baseSalary)
                .taxableIncome(totalImponible)
                .totalBonuses(gratification) // Only gratification for now
                .totalDiscounts(totalDiscounts)
                .totalPaid(totalLiquido)
                .items(items)
                .build();
    }

    private BigDecimal calculateIncomeTax(BigDecimal amount) {
        // Simplified Table 2024 (Monthly)
        // 0 - 879.802: Exento
        // ... (This should be a service but hardcoded for MVP speed)
        double taxable = amount.doubleValue();
        double tax = 0;

        if (taxable <= 900000)
            return BigDecimal.ZERO; // Aprox exento

        // Very rough bracket for demo purposes
        if (taxable > 900000 && taxable <= 2000000) {
            tax = (taxable * 0.04) - 36000;
        } else if (taxable > 2000000) {
            tax = (taxable * 0.08) - 116000;
        }

        return BigDecimal.valueOf(Math.max(0, tax)).setScale(0, RoundingMode.HALF_UP);
    }

    private void addIncome(List<PayrollCalculationResult.CalculatedItem> items, String code, String name,
            BigDecimal amount) {
        items.add(PayrollCalculationResult.CalculatedItem.builder()
                .code(code).name(name).type("INCOME").amount(amount).build());
    }

    private void addDeduction(List<PayrollCalculationResult.CalculatedItem> items, String code, String name,
            BigDecimal amount, BigDecimal rate) {
        items.add(PayrollCalculationResult.CalculatedItem.builder()
                .code(code).name(name).type("DEDUCTION").amount(amount).rate(rate).build());
    }

    private void addNonTaxable(List<PayrollCalculationResult.CalculatedItem> items, String code, String name,
            BigDecimal amount) {
        items.add(PayrollCalculationResult.CalculatedItem.builder()
                .code(code).name(name).type("NON_TAXABLE").amount(amount).build());
    }
}
