package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Variable bonuses configurable per employee.
 * Examples: production bonus, sales commission, punctuality bonus.
 */
@Entity
@Table(name = "employee_bonuses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeBonus {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_config_id", nullable = false)
    private EmployeePayrollConfig payrollConfig;

    private String code; // BONO_PRODUCCION, COMISION_VENTAS, BONO_PUNTUALIDAD
    private String name;
    private String description;

    @Enumerated(EnumType.STRING)
    private BonusType type;

    private BigDecimal amount; // Fixed amount or base for calculation
    private BigDecimal rate; // Percentage if type is PERCENTAGE

    @Builder.Default
    private boolean taxable = true; // Is it subject to taxes?

    @Builder.Default
    private boolean active = true;

    private LocalDate validFrom;
    private LocalDate validUntil; // null = permanent

    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public enum BonusType {
        FIXED, // Fixed monthly amount
        PERCENTAGE, // Percentage of base salary
        VARIABLE // Entered manually each month
    }
}
