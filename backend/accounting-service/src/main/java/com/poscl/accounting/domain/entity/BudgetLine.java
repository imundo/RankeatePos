package com.poscl.accounting.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Línea de Presupuesto por Cuenta y Período
 */
@Entity
@Table(name = "budget_lines", indexes = {
    @Index(name = "idx_budget_tenant_period", columnList = "tenant_id, fiscal_period_id")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class BudgetLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_period_id", nullable = false)
    private FiscalPeriod fiscalPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "budgeted_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal budgetedAmount;

    @Column(name = "actual_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualAmount = BigDecimal.ZERO;

    @Column(length = 500)
    private String notes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public BigDecimal getVariance() {
        return this.budgetedAmount.subtract(this.actualAmount);
    }

    public BigDecimal getVariancePercent() {
        if (this.budgetedAmount.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return this.getVariance().divide(this.budgetedAmount, 4, java.math.RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
    }
}
