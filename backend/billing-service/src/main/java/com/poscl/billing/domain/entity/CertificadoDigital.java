package com.poscl.billing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Certificado digital para firma electrónica
 */
@Entity
@Table(name = "certificado_digital")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificadoDigital {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(name = "rut_titular", nullable = false, length = 12)
    private String rutTitular;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Lob
    @Column(name = "pfx_data", nullable = false)
    private byte[] pfxData;

    @Column(name = "pfx_password_encrypted", nullable = false, length = 500)
    private String pfxPasswordEncrypted;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    public boolean isVencido() {
        return LocalDate.now().isAfter(fechaVencimiento);
    }

    public boolean isPorVencer(int dias) {
        return LocalDate.now().plusDays(dias).isAfter(fechaVencimiento);
    }
}
