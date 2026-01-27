package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Leave balance tracking with automatic monthly accrual.
 * Supports different accrual rules per country.
 */
@Entity
@Table(name = "leave_balances", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "employee_id", "year" })
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalance {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private int year;

    // Days entitled by law for the full year
    @Builder.Default
    private BigDecimal daysEntitled = BigDecimal.ZERO;

    // Days accrued so far (increases monthly)
    @Builder.Default
    private BigDecimal daysAccrued = BigDecimal.ZERO;

    // Days already taken
    @Builder.Default
    private BigDecimal daysTaken = BigDecimal.ZERO;

    // Available balance (accrued - taken)
    @Builder.Default
    private BigDecimal daysRemaining = BigDecimal.ZERO;

    // Country-specific configuration
    private String countryCode;

    // Monthly accrual rate (e.g., 1.25 for Chile = 15 days/12 months)
    @Builder.Default
    private BigDecimal monthlyAccrualRate = new BigDecimal("1.25");

    // Bonus days from seniority
    @Builder.Default
    private BigDecimal seniorityBonusDays = BigDecimal.ZERO;

    // Carryover from previous year (if allowed)
    @Builder.Default
    private BigDecimal carryoverDays = BigDecimal.ZERO;

    // Last month that was calculated
    private Integer lastAccruedMonth;

    private Instant lastCalculatedAt;
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    /**
     * Recalculate remaining days
     */
    public void recalculateRemaining() {
        this.daysRemaining = this.daysAccrued
                .add(this.carryoverDays)
                .subtract(this.daysTaken);
    }

    /**
     * Accrue days for a given month
     */
    public void accrueMonth(int month) {
        if (lastAccruedMonth == null || month > lastAccruedMonth) {
            this.daysAccrued = this.daysAccrued.add(this.monthlyAccrualRate);
            this.lastAccruedMonth = month;
            this.lastCalculatedAt = Instant.now();
            recalculateRemaining();
        }
    }
}
