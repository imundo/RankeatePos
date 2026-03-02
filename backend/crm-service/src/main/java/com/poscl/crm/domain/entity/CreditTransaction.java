package com.poscl.crm.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "credit_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_profile_id", nullable = false)
    private CustomerProfile customerProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column
    private UUID referenceSaleId; // Si es SALE_CREDIT

    @Column
    private String referencePaymentId; // Si es PAYMENT o ADJUSTMENT

    @Column
    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum TransactionType {
        SALE_CREDIT, // Aumento de deuda (compra a fiado)
        PAYMENT,     // Abono a la deuda
        ADJUSTMENT   // Ajuste manual
    }

    public static CreditTransaction charge(CustomerProfile customer, BigDecimal amount, UUID saleId, String description) {
        return CreditTransaction.builder()
                .tenantId(customer.getTenantId())
                .customerProfile(customer)
                .type(TransactionType.SALE_CREDIT)
                .amount(amount)
                .referenceSaleId(saleId)
                .description(description)
                .build();
    }

    public static CreditTransaction pay(CustomerProfile customer, BigDecimal amount, String paymentRef, String description) {
        return CreditTransaction.builder()
                .tenantId(customer.getTenantId())
                .customerProfile(customer)
                .type(TransactionType.PAYMENT)
                .amount(amount)
                .referencePaymentId(paymentRef)
                .description(description)
                .build();
    }
}
