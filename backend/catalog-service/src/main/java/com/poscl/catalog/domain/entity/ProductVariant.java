package com.poscl.catalog.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Variante de producto (con precio y stock mínimo)
 */
@Entity
@Table(name = "product_variants")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false, length = 50)
    private String sku;
    
    @Column(length = 100)
    private String nombre; // ej: "Grande", "500g"
    
    @Column(length = 50)
    private String barcode;
    
    // Precios en CLP (sin decimales)
    @Column(nullable = false)
    @Builder.Default
    private Integer costo = 0;
    
    @Column(name = "precio_neto", nullable = false)
    private Integer precioNeto;
    
    @Column(name = "precio_bruto", nullable = false)
    private Integer precioBruto;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tax_id")
    private Tax tax;
    
    @Column(name = "stock_minimo", nullable = false)
    @Builder.Default
    private Integer stockMinimo = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
    
    @Column(name = "es_default", nullable = false)
    @Builder.Default
    private Boolean esDefault = false;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    // Helpers
    public UUID getProductId() {
        return product != null ? product.getId() : null;
    }
    
    public String getProductName() {
        return product != null ? product.getNombre() : null;
    }
    
    public String getFullName() {
        String productName = getProductName();
        if (nombre != null && !nombre.isEmpty()) {
            return productName + " - " + nombre;
        }
        return productName;
    }
    
    public Integer getTaxPercentage() {
        return tax != null ? tax.getPorcentaje().intValue() : 0;
    }
    
    /**
     * Calcula el margen en porcentaje
     */
    public Double getMarginPercentage() {
        if (costo == null || costo == 0 || precioNeto == null || precioNeto == 0) {
            return 0.0;
        }
        return ((double)(precioNeto - costo) / costo) * 100;
    }
    
    /**
     * Calcula el margen absoluto
     */
    public Integer getMarginAbsolute() {
        if (costo == null || precioNeto == null) {
            return 0;
        }
        return precioNeto - costo;
    }
}
