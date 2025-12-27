package com.poscl.payments.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Cuenta por Pagar - generada desde facturas de compra
 */
@Entity
@Table(name = "payables", indexes = {
    @Index(name = "idx_payable_tenant", columnList = "tenant_id"),
    @Index(name = "idx_payable_supplier", columnList = "supplier_id"),
    @Index(name = "idx_payable_due_date", columnList = "due_date"),
    @Index(name = "idx_payable_status", columnList = "status")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Payable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(name = "supplier_id")
    private UUID supplierId;

    @Column(name = "supplier_name", length = 200)
    private String supplierName;

    @Column(name = "supplier_rut", length = 20)
    private String supplierRut;

    @Column(name = "document_type", length = 20)
    private String documentType; // FACTURA_COMPRA, BOLETA_HONORARIOS

    @Column(name = "document_id")
    private UUID documentId;

    @Column(name = "document_number", length = 50)
    private String documentNumber;

    @Column(name = "document_date")
    private LocalDate documentDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "original_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal originalAmount;

    @Column(name = "paid_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "balance", precision = 18, scale = 2, nullable = false)
    private BigDecimal balance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PayableStatus status = PayableStatus.PENDING;

    @Column(name = "days_overdue")
    @Builder.Default
    private Integer daysOverdue = 0;

    @Column(length = 500)
    private String notes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void recalculateBalance() {
        this.balance = this.originalAmount.subtract(this.paidAmount);
        if (this.balance.compareTo(BigDecimal.ZERO) <= 0) {
            this.status = PayableStatus.PAID;
        } else if (this.paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.status = PayableStatus.PARTIAL;
        }
    }

    public enum PayableStatus {
        PENDING,
        PARTIAL,
        PAID,
        OVERDUE,
        CANCELLED
    }
}
