package com.poscl.catalog.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Stock actual por variante y sucursal
 */
@Entity
@Table(name = "stock", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "variant_id", "branch_id" })
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(name = "cantidad_actual", nullable = false)
    @Builder.Default
    private Integer cantidadActual = 0;

    @Column(name = "cantidad_reservada", nullable = false)
    @Builder.Default
    private Integer cantidadReservada = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // Stock disponible = actual - reservado
    public Integer getCantidadDisponible() {
        return cantidadActual - cantidadReservada;
    }

    // Verifica si hay stock bajo
    public boolean isStockBajo() {
        return variant != null &&
                variant.getStockMinimo() != null &&
                cantidadActual <= variant.getStockMinimo();
    }
}
