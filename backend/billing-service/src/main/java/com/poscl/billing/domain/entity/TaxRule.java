package com.poscl.billing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Regla de Impuesto parametrizable por país (Ej: IVA 19%, ILA, Retención Honorarios)
 */
@Entity
@Table(name = "tax_rules")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "country_iso_code", nullable = false, length = 2)
    private String countryIsoCode;

    @Column(nullable = false, length = 20)
    private String code; // Ej: "IVA", "ILA_BEBIDAS", "RET_HON"

    @Column(nullable = false, length = 100)
    private String name; // Ej: "IVA 19%"

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal rate; // Ej: 0.1900

    @Column(name = "is_retention", nullable = false)
    @Builder.Default
    private Boolean isRetention = false; // Si resta del neto en vez de sumar

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false; // Si se aplica por defecto a nuevos productos

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
