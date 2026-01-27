package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Individual payroll configuration per employee.
 * Allows customization of health system, pension, bonuses, deductions, etc.
 */
@Entity
@Table(name = "employee_payroll_config")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeePayrollConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    // === Health System (Chile: FONASA / Isapre) ===
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private HealthSystemType healthSystem = HealthSystemType.FONASA;

    private String isapreName; // Name if ISAPRE
    @Builder.Default
    private BigDecimal healthRate = new BigDecimal("7.00"); // 7% default, can be higher for Isapre
    private BigDecimal isapreAdditionalUf; // Additional UF amount for Isapre

    // === Pension System (Chile: AFP) ===
    private String afpName;
    @Builder.Default
    private BigDecimal afpRate = new BigDecimal("12.50"); // 10% + ~2.5% commission

    // === Voluntary Pension Savings (APV) ===
    @Builder.Default
    private boolean hasApv = false;
    private BigDecimal apvMonthlyAmount;

    // === Gratification ===
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private GratificationType gratificationType = GratificationType.MONTHLY;
    private BigDecimal gratificationAmount;

    // === Allowances (non-taxable) ===
    @Builder.Default
    private boolean hasLunchAllowance = false;
    private BigDecimal lunchAllowanceAmount;

    @Builder.Default
    private boolean hasTransportAllowance = false;
    private BigDecimal transportAllowanceAmount;

    // === Overtime configuration ===
    @Builder.Default
    private boolean exemptFromOvertime = false;
    @Builder.Default
    private BigDecimal overtimeMultiplier = new BigDecimal("1.50"); // 50% extra

    // === Variable Bonuses ===
    @OneToMany(mappedBy = "payrollConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EmployeeBonus> bonuses = new ArrayList<>();

    // === Variable Deductions ===
    @OneToMany(mappedBy = "payrollConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EmployeeDeduction> deductions = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public enum HealthSystemType {
        FONASA, ISAPRE
    }

    public enum GratificationType {
        MONTHLY, ANNUAL, NONE
    }
}
