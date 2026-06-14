package com.poscl.billing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Tipo de Documento parametrizable por país (Ej: Factura, Boleta, Nota de Crédito)
 */
@Entity
@Table(name = "document_types")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "country_iso_code", nullable = false, length = 2)
    private String countryIsoCode;

    @Column(nullable = false, length = 10)
    private String code; // Ej: "33" para Factura Electrónica en Chile

    @Column(nullable = false, length = 100)
    private String name; // Ej: "Factura Electrónica"

    @Column(name = "is_taxable", nullable = false)
    @Builder.Default
    private Boolean isTaxable = true; // Si genera impuestos

    @Column(name = "is_credit_note", nullable = false)
    @Builder.Default
    private Boolean isCreditNote = false; // Si resta valor

    @Column(name = "is_electronic", nullable = false)
    @Builder.Default
    private Boolean isElectronic = true; // Si se debe emitir electrónicamente

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
