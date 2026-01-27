package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Variable deductions configurable per employee.
 * Examples: salary advance, loan installments, union fees.
 */
@Entity
@Table(name = "employee_deductions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDeduction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_config_id", nullable = false)
    private EmployeePayrollConfig payrollConfig;

    private String code; // ANTICIPO, PRESTAMO, SINDICATO, CAJA_COMP
    private String name;
    private String description;

    @Enumerated(EnumType.STRING)
    private DeductionType type;

    private BigDecimal amount;
    private BigDecimal rate;

    // For installment-based deductions (loans)
    private Integer totalInstallments;
    private Integer currentInstallment;
    private BigDecimal originalAmount;
    private BigDecimal remainingBalance;

    @Builder.Default
    private boolean active = true;

    private LocalDate validFrom;
    private LocalDate validUntil;

    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public enum DeductionType {
        FIXED, // Fixed monthly amount
        PERCENTAGE, // Percentage of salary
        INSTALLMENT // Loan with fixed number of payments
    }
}
