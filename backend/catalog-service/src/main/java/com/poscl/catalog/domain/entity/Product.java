package com.poscl.catalog.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Producto base
 */
@Entity
@Table(name = "products")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String sku;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "requiere_variantes", nullable = false)
    @Builder.Default
    private Boolean requiereVariantes = false;

    @Column(name = "permite_venta_fraccionada", nullable = false)
    @Builder.Default
    private Boolean permiteVentaFraccionada = false;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;

    // Variantes
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    // Tags
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "product_tags", joinColumns = @JoinColumn(name = "product_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    // Auditoría
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @CreatedBy
    @Column(name = "created_by")
    private UUID createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private UUID updatedBy;

    // Helpers
    public void addVariant(ProductVariant variant) {
        variants.add(variant);
        variant.setProduct(this);
        variant.setTenantId(this.tenantId);
    }

    public ProductVariant getDefaultVariant() {
        return variants.stream()
                .filter(ProductVariant::getEsDefault)
                .findFirst()
                .orElse(variants.isEmpty() ? null : variants.get(0));
    }

    public UUID getCategoryId() {
        return category != null ? category.getId() : null;
    }

    public String getCategoryName() {
        return category != null ? category.getNombre() : null;
    }

    public String getUnitCode() {
        return unit != null ? unit.getCodigo() : null;
    }
}
