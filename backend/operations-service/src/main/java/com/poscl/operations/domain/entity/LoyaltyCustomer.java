package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "loyalty_customers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyCustomer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String telefono;

    @Column(name = "puntos_actuales")
    @Builder.Default
    private Integer puntosActuales = 0;

    @Column(name = "puntos_totales")
    @Builder.Default
    private Integer puntosTotales = 0;

    @Column(length = 20)
    @Builder.Default
    private String nivel = "BRONCE";

    @Column(name = "fecha_registro")
    @Builder.Default
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @Column(name = "ultima_compra")
    private LocalDateTime ultimaCompra;

    @Builder.Default
    private Boolean activo = true;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Calculates the customer level based on total points
     */
    public void recalculateLevel() {
        if (this.puntosTotales >= 3000) {
            this.nivel = "PLATINO";
        } else if (this.puntosTotales >= 2000) {
            this.nivel = "ORO";
        } else if (this.puntosTotales >= 1000) {
            this.nivel = "PLATA";
        } else {
            this.nivel = "BRONCE";
        }
    }

    /**
     * Adds points to the customer
     */
    public void addPoints(int points) {
        this.puntosActuales += points;
        this.puntosTotales += points;
        this.ultimaCompra = LocalDateTime.now();
        recalculateLevel();
    }

    /**
     * Redeems points from the customer
     */
    public boolean redeemPoints(int points) {
        if (this.puntosActuales >= points) {
            this.puntosActuales -= points;
            return true;
        }
        return false;
    }
}
