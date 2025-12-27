package com.poscl.accounting.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Proyección de Flujo de Caja
 */
@Entity
@Table(name = "cash_flow_projections", indexes = {
    @Index(name = "idx_cfp_tenant_date", columnList = "tenant_id, projection_date")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class CashFlowProjection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "projection_date", nullable = false)
    private LocalDate projectionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CashFlowType type;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private CashFlowCategory category;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(name = "projected_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal projectedAmount;

    @Column(name = "actual_amount", precision = 18, scale = 2)
    private BigDecimal actualAmount;

    @Column(name = "is_recurring")
    @Builder.Default
    private Boolean isRecurring = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_frequency", length = 20)
    private RecurrenceFrequency recurrenceFrequency;

    @Column(name = "reference_id")
    private UUID referenceId; // ID de documento relacionado

    @Column(name = "reference_type", length = 30)
    private String referenceType; // RECEIVABLE, PAYABLE, LOAN, etc.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProjectionStatus status = ProjectionStatus.PROJECTED;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum CashFlowType {
        INFLOW,   // Ingreso
        OUTFLOW   // Egreso
    }

    public enum CashFlowCategory {
        SALES,          // Ventas
        COLLECTIONS,    // Cobros
        PURCHASES,      // Compras
        PAYROLL,        // Nómina
        TAXES,          // Impuestos
        RENT,           // Arriendos
        UTILITIES,      // Servicios
        LOANS,          // Préstamos
        INVESTMENTS,    // Inversiones
        OTHER           // Otros
    }

    public enum RecurrenceFrequency {
        DAILY,
        WEEKLY,
        BIWEEKLY,
        MONTHLY,
        QUARTERLY,
        YEARLY
    }

    public enum ProjectionStatus {
        PROJECTED,  // Proyectado
        CONFIRMED,  // Confirmado
        REALIZED,   // Realizado
        CANCELLED   // Cancelado
    }
}
