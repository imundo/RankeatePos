package com.poscl.billing.domain.entity;

import com.poscl.billing.domain.enums.TipoDte;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Código de Autorización de Folios (CAF) del SII
 * Contiene el rango de folios autorizados para emitir DTEs
 */
@Entity
@Table(name = "caf", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "tipo_dte", "folio_desde"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Caf {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_dte", nullable = false)
    private TipoDte tipoDte;

    @Column(name = "folio_desde", nullable = false)
    private Integer folioDesde;

    @Column(name = "folio_hasta", nullable = false)
    private Integer folioHasta;

    @Column(name = "folio_actual", nullable = false)
    private Integer folioActual;

    @Column(name = "fecha_autorizacion", nullable = false)
    private LocalDate fechaAutorizacion;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    // --- Datos del CAF encriptados ---
    @Column(name = "xml_caf", nullable = false, columnDefinition = "TEXT")
    private String xmlCaf;

    @Column(name = "rsa_private_key", columnDefinition = "TEXT")
    private String rsaPrivateKey;

    @Column(name = "rsa_public_key", columnDefinition = "TEXT")
    private String rsaPublicKey;

    @Column(name = "rsa_modulus", columnDefinition = "TEXT")
    private String rsaModulus;

    @Column(name = "rsa_exponent", columnDefinition = "TEXT")
    private String rsaExponent;

    // --- Estado ---
    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "agotado")
    @Builder.Default
    private Boolean agotado = false;

    // --- Auditoría ---
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by")
    private UUID createdBy;

    // --- Métodos helper ---
    public boolean tieneFoliosDisponibles() {
        return activo && !agotado && folioActual <= folioHasta;
    }

    public int foliosDisponibles() {
        if (!tieneFoliosDisponibles()) return 0;
        return folioHasta - folioActual + 1;
    }

    public Integer siguienteFolio() {
        if (!tieneFoliosDisponibles()) {
            throw new IllegalStateException("No hay folios disponibles en este CAF");
        }
        int folio = folioActual;
        folioActual++;
        if (folioActual > folioHasta) {
            agotado = true;
        }
        return folio;
    }

    public boolean isVencido() {
        return fechaVencimiento != null && LocalDate.now().isAfter(fechaVencimiento);
    }

    public double porcentajeUso() {
        int total = folioHasta - folioDesde + 1;
        int usados = folioActual - folioDesde;
        return (double) usados / total * 100;
    }
}
