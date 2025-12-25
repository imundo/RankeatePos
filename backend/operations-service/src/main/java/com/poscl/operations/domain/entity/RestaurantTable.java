package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tables")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(nullable = false, length = 10)
    private String numero;

    @Column(nullable = false)
    private Integer capacidad;

    @Column(length = 50)
    private String ubicacion; // interior, terraza, privado

    @Column(length = 20)
    @Builder.Default
    private String estado = "DISPONIBLE"; // DISPONIBLE, OCUPADA, RESERVADA, NO_DISPONIBLE

    @Column(length = 200)
    private String descripcion;

    @Builder.Default
    private Boolean activo = true;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isAvailable() {
        return "DISPONIBLE".equals(estado) && activo;
    }

    public void occupy() {
        this.estado = "OCUPADA";
    }

    public void reserve() {
        this.estado = "RESERVADA";
    }

    public void release() {
        this.estado = "DISPONIBLE";
    }
}
