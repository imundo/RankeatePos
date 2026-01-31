package com.poscl.billing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "billing_configs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Country country;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Environment environment; // CERTIFICATION, PRODUCTION

    @Column(name = "api_key")
    private String apiKey;

    @Column(name = "certificate_password")
    private String certificatePassword;

    // Store certificate content base64 or path. For simplicity now, we assume it's
    // stored securely via other means or ignored in mock.
    // In a real scenario, we might upload a .p12 file.
    @Column(name = "certificate_storage_path")
    private String certificateStoragePath;

    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum Country {
        CHILE, PERU, ARGENTINA, VENEZUELA, GENERIC_MOCK
    }

    public enum Environment {
        CERTIFICATION, PRODUCTION
    }

    @PrePersist
    @PreUpdate
    public void prePersist() {
        this.updatedAt = Instant.now();
    }
}
