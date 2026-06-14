package com.poscl.auth.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad Moneda para configuración financiera
 */
@Entity
@Table(name = "currencies")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Currency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 3)
    private String code; // e.g., "CLP", "USD", "PEN"

    @Column(nullable = false, length = 50)
    private String name; // e.g., "Peso Chileno", "US Dollar"

    @Column(nullable = false, length = 5)
    private String symbol; // e.g., "$", "US$"

    @Column(name = "decimal_places", nullable = false)
    @Builder.Default
    private Integer decimalPlaces = 0; // e.g., 0 for CLP, 2 for USD

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
