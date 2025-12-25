package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "subscription_deliveries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_programada")
    private LocalTime horaProgramada;

    @Column(name = "hora_entrega")
    private LocalDateTime horaEntrega;

    @Column(length = 20)
    @Builder.Default
    private String estado = "PENDIENTE"; // PENDIENTE, EN_RUTA, ENTREGADO, FALLIDO, REPROGRAMADO

    private String direccion;

    private String notas;

    @Column(name = "repartidor_id")
    private UUID repartidorId;

    @Column(name = "venta_id")
    private UUID ventaId;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public void startDelivery() {
        this.estado = "EN_RUTA";
    }

    public void markDelivered() {
        this.estado = "ENTREGADO";
        this.horaEntrega = LocalDateTime.now();
    }

    public void markFailed(String reason) {
        this.estado = "FALLIDO";
        this.notas = reason;
    }

    public void reschedule(LocalDate newDate) {
        this.estado = "REPROGRAMADO";
        this.fecha = newDate;
    }
}
