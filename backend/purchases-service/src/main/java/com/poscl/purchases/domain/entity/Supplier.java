package com.poscl.purchases.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Proveedor
 */
@Entity
@Table(name = "suppliers", indexes = {
    @Index(name = "idx_supplier_tenant", columnList = "tenant_id"),
    @Index(name = "idx_supplier_rut", columnList = "rut")
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

    @Column(name = "contact_name", length = 100)
    private String contactName;

    @Column(name = "payment_terms")
    @Builder.Default
    private Integer paymentTerms = 30; // días de pago

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
}
