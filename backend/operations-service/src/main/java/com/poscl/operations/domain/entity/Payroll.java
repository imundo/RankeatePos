package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "payrolls")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payroll {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private UUID payrollRunId;

    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private LocalDate periodEnd;

    private BigDecimal baseSalary;
    private BigDecimal taxableIncome; // Imponible
    private BigDecimal totalBonuses;
    private BigDecimal totalDiscounts; // Descuentos totales
    private BigDecimal totalPaid; // Líquido

    private String status; // DRAFT, PAID, APPROVED
    private Instant paymentDate;

    @OneToMany(mappedBy = "payroll", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<PayrollDetail> details = new java.util.ArrayList<>();

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
}
