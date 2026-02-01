package com.poscl.billing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "config_facturacion")
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
    @Column(name = "pais", nullable = false)
    private Country country;

    @Enumerated(EnumType.STRING)
    @Column(name = "ambiente", nullable = false)
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

    // Emisor Info (Fallback/Default)
    @Column(name = "emisor_rut", length = 20)
    private String emisorRut;

    @Column(name = "emisor_razon_social", length = 200)
    private String emisorRazonSocial;

    @Column(name = "emisor_giro", length = 200)
    private String emisorGiro;

    @Column(name = "emisor_direccion", length = 200)
    private String emisorDireccion;

    @Column(name = "emisor_comuna", length = 100)
    private String emisorComuna;

    @Column(name = "emisor_ciudad", length = 100)
    private String emisorCiudad;

    @Column(name = "emisor_logo_url", length = 500)
    private String emisorLogoUrl;

    @Column(name = "emisor_actividad_economica")
    private Integer emisorActividadEconomica;

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
