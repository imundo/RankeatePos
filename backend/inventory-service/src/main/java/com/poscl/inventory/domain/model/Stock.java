package com.poscl.inventory.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

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

    @ManyToOne(fetch = FetchType.EAGER) // Eager fetch to get SKU/Name easily
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

    public Integer getCantidadDisponible() {
        return cantidadActual - cantidadReservada;
    }

    // Logic proxy to variant defaults
    public Integer getStockMinimo() {
        return variant != null ? variant.getStockMinimo() : 0;
    }

    public boolean isStockBajo() {
        Integer min = getStockMinimo();
        return min != null && cantidadActual <= min;
    }

    // Helpers for DTO mapping
    public UUID getVariantId() {
        return variant != null ? variant.getId() : null;
    }

    public String getVariantSku() {
        return variant != null ? variant.getSku() : null;
    }

    public String getProductName() {
        return variant != null ? variant.getFullName() : null;
    }
}
