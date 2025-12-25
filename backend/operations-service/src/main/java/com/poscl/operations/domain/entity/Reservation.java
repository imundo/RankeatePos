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
@Table(name = "reservations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(name = "cliente_nombre", nullable = false, length = 100)
    private String clienteNombre;

    @Column(name = "cliente_telefono", length = 20)
    private String clienteTelefono;

    @Column(name = "cliente_email", length = 100)
    private String clienteEmail;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private LocalTime hora;

    @Column(nullable = false)
    private Integer personas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    @Column(length = 20)
    @Builder.Default
    private String estado = "PENDIENTE"; // PENDIENTE, CONFIRMADA, EN_CURSO, COMPLETADA, CANCELADA, NO_SHOW

    private String notas;

    @Column(name = "recordatorio_enviado")
    @Builder.Default
    private Boolean recordatorioEnviado = false;

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

    public void confirm() {
        this.estado = "CONFIRMADA";
        if (this.table != null) {
            this.table.reserve();
        }
    }

    public void start() {
        this.estado = "EN_CURSO";
        if (this.table != null) {
            this.table.occupy();
        }
    }

    public void complete() {
        this.estado = "COMPLETADA";
        if (this.table != null) {
            this.table.release();
        }
    }

    public void cancel() {
        this.estado = "CANCELADA";
        if (this.table != null) {
            this.table.release();
        }
    }

    public void markNoShow() {
        this.estado = "NO_SHOW";
        if (this.table != null) {
            this.table.release();
        }
    }
}
