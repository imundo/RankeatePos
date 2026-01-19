package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "automation_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "automation_id", nullable = false)
    private UUID automationId;

    @Column(name = "reservation_id")
    private UUID reservationId;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(nullable = false, length = 20)
    private String channel; // EMAIL, WHATSAPP

    @Column(nullable = false, length = 20)
    private String status; // SENT, FAILED, PENDING

    @Column(name = "sent_at")
    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;
}
