package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "subscriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private SubscriptionPlan plan;

    @Column(name = "cliente_nombre", nullable = false, length = 100)
    private String clienteNombre;

    @Column(name = "cliente_telefono", length = 20)
    private String clienteTelefono;

    @Column(name = "cliente_email", length = 100)
    private String clienteEmail;

    @Column(name = "direccion_entrega", nullable = false)
    private String direccionEntrega;

    @Column(length = 50)
    private String comuna;

    @Column(name = "notas_entrega")
    private String notasEntrega;

    @Column(length = 20)
    @Builder.Default
    private String estado = "ACTIVA"; // ACTIVA, PAUSADA, CANCELADA

    @Column(name = "proxima_entrega")
    private LocalDate proximaEntrega;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_pausa")
    private LocalDate fechaPausa;

    @Column(name = "fecha_cancelacion")
    private LocalDate fechaCancelacion;

    @Column(name = "total_entregas")
    @Builder.Default
    private Integer totalEntregas = 0;

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

    public void pause() {
        this.estado = "PAUSADA";
        this.fechaPausa = LocalDate.now();
    }

    public void resume() {
        this.estado = "ACTIVA";
        this.fechaPausa = null;
    }

    public void cancel() {
        this.estado = "CANCELADA";
        this.fechaCancelacion = LocalDate.now();
    }

    public boolean isActive() {
        return "ACTIVA".equals(this.estado);
    }
}
