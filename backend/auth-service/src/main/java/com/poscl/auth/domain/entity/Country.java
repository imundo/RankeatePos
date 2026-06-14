package com.poscl.auth.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad País para configuración regional y tributaria
 */
@Entity
@Table(name = "countries")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Country {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 2)
    private String isoCode; // e.g., "CL", "PE", "MX"

    @Column(nullable = false, length = 100)
    private String name; // e.g., "Chile", "Perú", "México"

    @Column(name = "tax_id_format", length = 50)
    private String taxIdFormat; // e.g., "XX.XXX.XXX-X" for Chile

    @Column(name = "tax_id_name", length = 20)
    private String taxIdName; // e.g., "RUT", "RUC", "RFC"

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
