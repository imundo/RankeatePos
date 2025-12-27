package com.poscl.payments.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Recibo de Cobro - registro de cobranza
 */
@Entity
@Table(name = "payment_receipts", indexes = {
    @Index(name = "idx_receipt_tenant", columnList = "tenant_id"),
    @Index(name = "idx_receipt_date", columnList = "payment_date"),
    @Index(name = "idx_receipt_number", columnList = "receipt_number")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PaymentReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "receipt_number", nullable = false)
    private Long receiptNumber;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receivable_id")
    private Receivable receivable;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber; // Número de transferencia, cheque, etc.

    @Column(name = "bank_account_id")
    private UUID bankAccountId;

    @Column(length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReceiptStatus status = ReceiptStatus.CONFIRMED;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum PaymentMethod {
        CASH,           // Efectivo
        TRANSFER,       // Transferencia
        CHECK,          // Cheque
        CREDIT_CARD,    // Tarjeta crédito
        DEBIT_CARD,     // Tarjeta débito
        WEBPAY,         // Webpay
        OTHER           // Otro
    }

    public enum ReceiptStatus {
        CONFIRMED,  // Confirmado
        CANCELLED   // Anulado
    }
}
