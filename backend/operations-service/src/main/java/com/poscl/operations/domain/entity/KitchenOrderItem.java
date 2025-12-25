package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "kitchen_order_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KitchenOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private KitchenOrder order;

    @Column(name = "producto_nombre", nullable = false, length = 100)
    private String productoNombre;

    @Column(name = "producto_id")
    private UUID productoId;

    @Builder.Default
    private Integer cantidad = 1;

    private String modificadores; // JSON array

    private String notas;

    @Column(length = 20)
    @Builder.Default
    private String estado = "PENDIENTE"; // PENDIENTE, PREPARANDO, LISTO

    @Column(name = "completado_at")
    private LocalDateTime completadoAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public void startPreparing() {
        this.estado = "PREPARANDO";
    }

    public void markReady() {
        this.estado = "LISTO";
        this.completadoAt = LocalDateTime.now();
    }
}
