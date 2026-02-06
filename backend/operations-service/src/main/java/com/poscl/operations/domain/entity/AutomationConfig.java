package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "automation_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    @Column(columnDefinition = "text")
    private String whatsappConfig; // JSON: { provider, accountSid, authToken, ... }

    @Column(columnDefinition = "text")
    private String emailConfig; // JSON: { provider, smtHost, apiKey, ... }

    @Column(columnDefinition = "text")
    private String mercadoPagoConfig; // JSON: { accessToken, ... }

    @Column(columnDefinition = "text")
    private String businessInfo; // JSON: { name, address, phone }

    @Column(columnDefinition = "text")
    private String templates; // JSON array of templates for simplicity

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
