package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "loyalty_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private LoyaltyCustomer customer;

    @Column(nullable = false, length = 20)
    private String tipo; // EARN, REDEEM, ADJUSTMENT

    @Column(nullable = false)
    private Integer puntos;

    @Column(length = 200)
    private String descripcion;

    @Column(name = "venta_id")
    private UUID ventaId;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public static LoyaltyTransaction earn(LoyaltyCustomer customer, int points, String description, UUID saleId) {
        return LoyaltyTransaction.builder()
                .customer(customer)
                .tipo("EARN")
                .puntos(points)
                .descripcion(description)
                .ventaId(saleId)
                .build();
    }

    public static LoyaltyTransaction redeem(LoyaltyCustomer customer, int points, String description) {
        return LoyaltyTransaction.builder()
                .customer(customer)
                .tipo("REDEEM")
                .puntos(-points)
                .descripcion(description)
                .build();
    }
}
