package com.poscl.payments.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Recordatorio de Cobranza
 */
@Entity
@Table(name = "collection_reminders", indexes = {
    @Index(name = "idx_reminder_receivable", columnList = "receivable_id"),
    @Index(name = "idx_reminder_scheduled", columnList = "scheduled_date")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class CollectionReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receivable_id", nullable = false)
    private Receivable receivable;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReminderType type;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDateTime scheduledDate;

    @Column(name = "sent_date")
    private LocalDateTime sentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReminderStatus status = ReminderStatus.PENDING;

    @Column(name = "contact_info", length = 200)
    private String contactInfo; // Email o teléfono

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "response_notes", length = 500)
    private String responseNotes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum ReminderType {
        EMAIL,
        WHATSAPP,
        SMS,
        PHONE_CALL
    }

    public enum ReminderStatus {
        PENDING,    // Pendiente
        SENT,       // Enviado
        DELIVERED,  // Entregado
        FAILED,     // Fallido
        CANCELLED   // Cancelado
    }
}
