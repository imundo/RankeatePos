package com.poscl.inventory.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.UUID;

/**
 * Read-only mirror of ProductVariant for shared DB access
 */
@Entity
@Table(name = "product_variants") // Maps to existing table
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant implements Serializable {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "tenant_id")
    private UUID tenantId;

    private String sku;

    private String nombre; // e.g. "small"

    @Column(name = "stock_minimo")
    private Integer stockMinimo;

    // Helper to get full name
    public String getFullName() {
        if (product == null)
            return nombre;
        if (nombre != null && !nombre.isEmpty()) {
            return product.getNombre() + " - " + nombre;
        }
        return product.getNombre();
    }
}
