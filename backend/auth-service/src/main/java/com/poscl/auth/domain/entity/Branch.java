package com.poscl.auth.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Branch (Sucursal) - Punto de venta físico
 */
@Entity
@Table(name = "branches")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 20)
    private String codigo;

    @Column(length = 300)
    private String direccion;

    @Column(length = 100)
    private String comuna;

    @Column(length = 20)
    private String telefono;

    @Column(length = 100)
    private String ciudad;

    @Column(length = 200)
    private String email;

    @Column(name = "es_principal", nullable = false)
    @Builder.Default
    private Boolean esPrincipal = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activa = true;

    // Auditoría
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // Helper para obtener tenant_id sin cargar lazy
    public UUID getTenantId() {
        return tenant != null ? tenant.getId() : null;
    }
}
