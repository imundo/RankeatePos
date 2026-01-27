package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Monthly attendance statistics per employee.
 * Pre-calculated metrics for dashboards and reports.
 */
@Entity
@Table(name = "attendance_statistics", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "tenant_id", "employee_id", "year", "month" })
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceStatistics {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    private int year;
    private int month;

    // Work days in period
    @Builder.Default
    private int totalWorkDays = 0;

    // Attendance metrics
    @Builder.Default
    private int daysPresent = 0;

    @Builder.Default
    private int daysAbsent = 0;

    @Builder.Default
    private int daysLate = 0;

    @Builder.Default
    private int daysEarlyLeave = 0;

    // Time metrics (in minutes)
    @Builder.Default
    private int totalWorkedMinutes = 0;

    @Builder.Default
    private int totalOvertimeMinutes = 0;

    @Builder.Default
    private int totalLateMinutes = 0;

    // Calculated percentages
    @Builder.Default
    private BigDecimal attendancePercentage = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal punctualityPercentage = BigDecimal.ZERO;

    private Instant calculatedAt;

    @PrePersist
    void onCreate() {
        calculatedAt = Instant.now();
    }

    /**
     * Recalculate percentages based on current values
     */
    public void recalculatePercentages() {
        if (totalWorkDays > 0) {
            this.attendancePercentage = BigDecimal.valueOf(daysPresent)
                    .divide(BigDecimal.valueOf(totalWorkDays), 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            int punctualDays = daysPresent - daysLate;
            this.punctualityPercentage = BigDecimal.valueOf(punctualDays)
                    .divide(BigDecimal.valueOf(daysPresent > 0 ? daysPresent : 1), 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        this.calculatedAt = Instant.now();
    }
}
