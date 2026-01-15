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

    @Column(name = "variant_id", nullable = false)
    private UUID variantId;

    @Column(name = "variant_sku")
    private String variantSku;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(name = "cantidad_actual", nullable = false)
    @Builder.Default
    private Integer cantidadActual = 0;

    @Column(name = "cantidad_reservada", nullable = false)
    @Builder.Default
    private Integer cantidadReservada = 0;

    @Column(name = "stock_minimo")
    private Integer stockMinimo;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public Integer getCantidadDisponible() {
        return cantidadActual - cantidadReservada;
    }

    public boolean isStockBajo() {
        return stockMinimo != null && cantidadActual <= stockMinimo;
    }
}
