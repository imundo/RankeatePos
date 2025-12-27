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
 * Representa un movimiento bancario importado desde la cartola.
 */
@Entity
@Table(name = "bank_transactions", indexes = {
    @Index(name = "idx_bank_tx_account", columnList = "bank_account_id"),
    @Index(name = "idx_bank_tx_date", columnList = "transaction_date"),
    @Index(name = "idx_bank_tx_status", columnList = "reconciliation_status")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class BankTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bank_account_id", nullable = false)
    private BankAccount bankAccount;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "value_date")
    private LocalDate valueDate; // Fecha valor

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "reference_number", length = 50)
    private String referenceNumber; // Número de documento banco

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO; // Positivo = ingreso, Negativo = egreso

    @Column(name = "running_balance", precision = 18, scale = 2)
    private BigDecimal runningBalance; // Saldo después del movimiento

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", length = 30)
    private TransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "reconciliation_status", nullable = false, length = 20)
    @Builder.Default
    private ReconciliationStatus reconciliationStatus = ReconciliationStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reconciled_journal_line_id")
    private JournalLine reconciledJournalLine; // Línea conciliada

    @Column(name = "reconciled_at")
    private LocalDateTime reconciledAt;

    @Column(name = "reconciled_by")
    private UUID reconciledBy;

    @Column(name = "import_batch_id")
    private UUID importBatchId; // ID del lote de importación

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum TransactionType {
        DEPOSIT,        // Depósito
        WITHDRAWAL,     // Retiro
        TRANSFER_IN,    // Transferencia recibida
        TRANSFER_OUT,   // Transferencia enviada
        CHECK,          // Cheque
        INTEREST,       // Intereses
        FEE,            // Comisión
        OTHER           // Otro
    }

    public enum ReconciliationStatus {
        PENDING,        // Pendiente
        RECONCILED,     // Conciliado
        IGNORED,        // Ignorado (no requiere conciliación)
        PARTIAL         // Parcialmente conciliado
    }
}
