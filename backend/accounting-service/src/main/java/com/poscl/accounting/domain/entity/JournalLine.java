package com.poscl.accounting.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Representa una línea de un asiento contable.
 * Cada línea afecta una cuenta con un monto al debe o al haber.
 */
@Entity
@Table(name = "journal_lines", indexes = {
    @Index(name = "idx_journal_line_account", columnList = "account_id"),
    @Index(name = "idx_journal_line_entry", columnList = "journal_entry_id")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class JournalLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    private JournalEntry journalEntry;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal debit = BigDecimal.ZERO;

    @Column(nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal credit = BigDecimal.ZERO;

    @Column(length = 300)
    private String description; // Glosa específica de la línea

    @Column(name = "cost_center_id")
    private UUID costCenterId; // Centro de costo (opcional)

    @Column(name = "line_order", nullable = false)
    @Builder.Default
    private Integer lineOrder = 0;

    /**
     * Obtiene el saldo neto de la línea.
     * Positivo = Debe, Negativo = Haber
     */
    public BigDecimal getNetAmount() {
        return debit.subtract(credit);
    }
}
