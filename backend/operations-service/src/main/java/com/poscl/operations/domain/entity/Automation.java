package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "automations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Automation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String tipo; // AUTO_RESPONSE, REMINDER, CAMPAIGN

    @Column(name = "trigger_event", nullable = false, length = 50)
    private String triggerEvent; // NEW_RESERVATION, 24H_BEFORE, etc.

    @Builder.Default
    private Boolean active = true;

    @Column(columnDefinition = "text")
    private String channels; // JSON array: ["email", "whatsapp"]

    @Column(name = "template_content", columnDefinition = "text")
    private String templateContent; // JSON with content and subject

    @Column(columnDefinition = "text")
    private String condiciones; // JSON with conditions

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
