package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "payroll_runs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollRun {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private LocalDate periodEnd;

    private String name; // e.g. "Sueldos Enero 2026"
    private String status; // DRAFT, PROCESSED, APPROVED, PAID

    @Builder.Default
    private Integer totalEmployees = 0;

    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    private Instant processedAt;
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
