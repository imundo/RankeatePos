package com.poscl.purchases.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Proveedor — Entidad completa con ranking, categoría, entregas y condiciones comerciales.
 */
@Entity
@Table(name = "suppliers", indexes = {
    @Index(name = "idx_supplier_tenant", columnList = "tenant_id"),
    @Index(name = "idx_supplier_rut", columnList = "rut"),
    @Index(name = "idx_supplier_category", columnList = "category"),
    @Index(name = "idx_supplier_rating", columnList = "trust_rating")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 20)
    private String rut;

    @Column(name = "business_name", nullable = false, length = 200)
    private String businessName;

    @Column(name = "fantasy_name", length = 200)
    private String fantasyName;

    @Column(length = 100)
    private String giro;

    @Column(length = 300)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 50)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 200)
    private String website;

    @Column(name = "contact_name", length = 100)
    private String contactName;

    // === Condiciones Comerciales ===

    @Column(name = "payment_terms")
    @Builder.Default
    private Integer paymentTerms = 30; // días de pago

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO; // descuento por pronto pago

    @Column(length = 3)
    @Builder.Default
    private String currency = "CLP";

    @Column(name = "bank_account", length = 100)
    private String bankAccount;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    // === Categoría y Tipo ===

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private SupplierCategory category = SupplierCategory.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_type", length = 30)
    @Builder.Default
    private DeliveryType deliveryType = DeliveryType.DELIVERY;

    @Column(name = "avg_delivery_days")
    @Builder.Default
    private Integer avgDeliveryDays = 3;

    // === Ranking de Confianza ===

    @Column(name = "trust_rating", precision = 3, scale = 1)
    @Builder.Default
    private BigDecimal trustRating = BigDecimal.valueOf(3.0); // 1.0 a 5.0

    @Column(name = "total_orders")
    @Builder.Default
    private Integer totalOrders = 0;

    @Column(name = "on_time_deliveries")
    @Builder.Default
    private Integer onTimeDeliveries = 0;

    @Column(name = "total_spent", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;

    // === Estado ===

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private SupplierStatus status = SupplierStatus.ACTIVE;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // === Enums ===

    public enum SupplierCategory {
        GENERAL,
        RAW_MATERIALS,    // Materias primas
        SERVICES,         // Servicios
        TECHNOLOGY,       // Tecnología
        LOGISTICS,        // Logística
        PACKAGING,        // Empaques
        FOOD,             // Alimentos
        BEVERAGES,        // Bebidas
        CLEANING,         // Limpieza
        OFFICE            // Oficina
    }

    public enum DeliveryType {
        PICKUP,           // Retiro en local
        DELIVERY,         // Despacho a domicilio
        COURIER,          // Envío por courier
        DIGITAL,          // Entrega digital
        MIXED             // Mixto
    }

    public enum SupplierStatus {
        ACTIVE,
        INACTIVE,
        BLOCKED,
        PENDING_APPROVAL
    }
}
