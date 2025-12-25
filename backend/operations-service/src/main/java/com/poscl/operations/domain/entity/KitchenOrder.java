package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "kitchen_orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KitchenOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(nullable = false, length = 20)
    private String numero;

    @Column(nullable = false, length = 20)
    private String tipo; // LOCAL, DELIVERY, PICKUP

    @Column(length = 10)
    private String mesa;

    @Column(name = "cliente_nombre", length = 100)
    private String clienteNombre;

    @Column(length = 20)
    @Builder.Default
    private String estado = "PENDIENTE"; // PENDIENTE, PREPARANDO, LISTO, ENTREGADO, CANCELADO

    @Column(length = 20)
    @Builder.Default
    private String prioridad = "NORMAL"; // BAJA, NORMAL, ALTA, URGENTE

    private String notas;

    @Column(name = "tiempo_ingreso")
    @Builder.Default
    private LocalDateTime tiempoIngreso = LocalDateTime.now();

    @Column(name = "tiempo_inicio_preparacion")
    private LocalDateTime tiempoInicioPreparacion;

    @Column(name = "tiempo_completado")
    private LocalDateTime tiempoCompletado;

    @Column(name = "tiempo_entregado")
    private LocalDateTime tiempoEntregado;

    @Column(name = "venta_id")
    private UUID ventaId;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<KitchenOrderItem> items = new ArrayList<>();

    public void startPreparing() {
        this.estado = "PREPARANDO";
        this.tiempoInicioPreparacion = LocalDateTime.now();
    }

    public void markReady() {
        this.estado = "LISTO";
        this.tiempoCompletado = LocalDateTime.now();
    }

    public void markDelivered() {
        this.estado = "ENTREGADO";
        this.tiempoEntregado = LocalDateTime.now();
    }

    public void cancel() {
        this.estado = "CANCELADO";
    }

    public long getMinutesElapsed() {
        return java.time.Duration.between(tiempoIngreso, LocalDateTime.now()).toMinutes();
    }
}
