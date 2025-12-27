package com.poscl.accounting.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Representa un asiento contable (Journal Entry).
 * Agrupa múltiples líneas que deben cuadrar (debe = haber).
 */
@Entity
@Table(name = "journal_entries", indexes = {
    @Index(name = "idx_journal_tenant_date", columnList = "tenant_id, entry_date"),
    @Index(name = "idx_journal_number", columnList = "tenant_id, entry_number")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(name = "entry_number", nullable = false)
    private Long entryNumber; // Número correlativo del asiento

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JournalType type;

    @Column(nullable = false, length = 500)
    private String description; // Glosa del asiento

    @Column(name = "reference_type", length = 50)
    private String referenceType; // SALE, PURCHASE, PAYMENT, DTE, MANUAL

    @Column(name = "reference_id")
    private UUID referenceId; // ID del documento origen

    @Column(name = "reference_number", length = 50)
    private String referenceNumber; // Número de factura, boleta, etc.

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<JournalLine> lines = new ArrayList<>();

    @Column(name = "total_debit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalDebit = BigDecimal.ZERO;

    @Column(name = "total_credit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalCredit = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private JournalStatus status = JournalStatus.DRAFT;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @Column(name = "posted_by")
    private UUID postedBy;

    @Column(name = "reversed_by")
    private UUID reversedByEntryId; // Si fue revertido, referencia al asiento de reversión

    @Column(name = "is_automatic", nullable = false)
    @Builder.Default
    private Boolean isAutomatic = false; // true si fue generado automáticamente

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    public void addLine(JournalLine line) {
        lines.add(line);
        line.setJournalEntry(this);
        recalculateTotals();
    }

    public void removeLine(JournalLine line) {
        lines.remove(line);
        line.setJournalEntry(null);
        recalculateTotals();
    }

    public void recalculateTotals() {
        this.totalDebit = lines.stream()
            .map(JournalLine::getDebit)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.totalCredit = lines.stream()
            .map(JournalLine::getCredit)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public boolean isBalanced() {
        return totalDebit.compareTo(totalCredit) == 0;
    }

    public enum JournalType {
        OPENING,    // Asiento de apertura
        STANDARD,   // Asiento normal
        ADJUSTMENT, // Asiento de ajuste
        CLOSING,    // Asiento de cierre
        REVERSAL    // Asiento de reversión
    }

    public enum JournalStatus {
        DRAFT,      // Borrador
        POSTED,     // Contabilizado
        REVERSED    // Revertido
    }
}
