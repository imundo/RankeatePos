package com.poscl.catalog.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "suppliers")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 20)
    private String rut;

    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String telefono;

    @Column(length = 200)
    private String direccion;

    @Column(length = 100)
    private String contacto;

    @Column(name = "plazo_pago", length = 50)
    private String plazoPago;

    @Column(name = "fantasy_name", length = 100)
    private String fantasyName;

    @Column(length = 100)
    private String giro;

    @Column(length = 150)
    private String website;

    @Column(length = 100)
    private String city;

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private java.math.BigDecimal discountPercentage;

    @Column(length = 10)
    private String currency;

    @Column(name = "bank_account", length = 50)
    private String bankAccount;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(length = 50)
    private String category;

    @Column(name = "delivery_type", length = 50)
    private String deliveryType;

    @Column(name = "avg_delivery_days")
    private Integer avgDeliveryDays;

    @Column(name = "payment_terms")
    private Integer paymentTerms;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    // Auditoría
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by")
    private UUID createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private UUID updatedBy;
}
