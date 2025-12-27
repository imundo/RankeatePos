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
 * Representa una cuenta bancaria de la empresa.
 */
@Entity
@Table(name = "bank_accounts", indexes = {
    @Index(name = "idx_bank_account_tenant", columnList = "tenant_id"),
    @Index(name = "idx_bank_account_number", columnList = "account_number")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName; // Banco de Chile, Santander, BCI, etc.

    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 20)
    private BankAccountType accountType;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "CLP";

    @Column(length = 200)
    private String alias; // Nombre amigable

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_account_id")
    private Account linkedAccount; // Cuenta contable vinculada

    @Column(name = "current_balance", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Column(name = "last_reconciled_balance", precision = 18, scale = 2)
    private BigDecimal lastReconciledBalance;

    @Column(name = "last_reconciled_date")
    private LocalDateTime lastReconciledDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum BankAccountType {
        CHECKING,   // Cuenta corriente
        SAVINGS,    // Cuenta de ahorro
        VISTA,      // Cuenta vista
        CREDIT_LINE // Línea de crédito
    }
}
