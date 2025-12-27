package com.poscl.accounting.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Representa un período fiscal (mensual o anual).
 */
@Entity
@Table(name = "fiscal_periods", indexes = {
    @Index(name = "idx_fiscal_period_tenant", columnList = "tenant_id"),
    @Index(name = "idx_fiscal_period_dates", columnList = "start_date, end_date")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class FiscalPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String name; // "Enero 2025", "Año 2025"

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", nullable = false, length = 20)
    private PeriodType periodType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Integer year;

    @Column
    private Integer month; // Null para períodos anuales

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PeriodStatus status = PeriodStatus.OPEN;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by")
    private UUID closedBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum PeriodType {
        MONTHLY,
        QUARTERLY,
        YEARLY
    }

    public enum PeriodStatus {
        OPEN,       // Abierto - permite movimientos
        CLOSED,     // Cerrado - no permite movimientos
        LOCKED      // Bloqueado - cerrado definitivamente
    }
}
