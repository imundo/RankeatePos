package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "appointments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id")
    private UUID branchId;

    // --- Customer info (denormalized from marketing-service for performance) ---
    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "customer_nombre", length = 100)
    private String customerNombre;

    @Column(name = "customer_telefono", length = 20)
    private String customerTelefono;

    @Column(name = "customer_email", length = 100)
    private String customerEmail;

    // --- Staff/Professional ---
    @Column(name = "staff_id")
    private UUID staffId;

    @Column(name = "staff_nombre", length = 100)
    private String staffNombre;

    // --- Service ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id")
    private ServiceCatalog service;

    @Column(name = "service_nombre", length = 100)
    private String serviceNombre;

    // --- Schedule ---
    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    // --- Status ---
    @Column(length = 20)
    @Builder.Default
    private String estado = "PROGRAMADA";
    // PROGRAMADA, CONFIRMADA, EN_PROGRESO, COMPLETADA, CANCELADA, NO_SHOW,
    // REPROGRAMADA

    private String notas;

    @Column(name = "notas_internas")
    private String notasInternas;

    // --- Pricing ---
    @Column(name = "precio_estimado")
    private BigDecimal precioEstimado;

    @Column(name = "precio_final")
    private BigDecimal precioFinal;

    // --- Channel ---
    @Column(name = "canal_reserva", length = 20)
    @Builder.Default
    private String canalReserva = "MANUAL";
    // MANUAL, WEB, WHATSAPP, APP, TELEFONO

    @Column(name = "recordatorio_enviado")
    @Builder.Default
    private Boolean recordatorioEnviado = false;

    // --- Recurrence ---
    @Builder.Default
    private Boolean recurrente = false;

    @Column(name = "recurrencia_patron", length = 20)
    private String recurrenciaPatron; // SEMANAL, QUINCENAL, MENSUAL

    @Column(name = "recurrencia_parent_id")
    private UUID recurrenciaParentId;

    @Column(length = 7)
    private String color;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // --- Business logic ---

    public void confirm() {
        this.estado = "CONFIRMADA";
    }

    public void start() {
        this.estado = "EN_PROGRESO";
    }

    public void complete(BigDecimal finalPrice) {
        this.estado = "COMPLETADA";
        if (finalPrice != null) {
            this.precioFinal = finalPrice;
        }
    }

    public void cancel() {
        this.estado = "CANCELADA";
    }

    public void markNoShow() {
        this.estado = "NO_SHOW";
    }

    public void reschedule(LocalDate newFecha, LocalTime newHoraInicio, LocalTime newHoraFin) {
        this.estado = "REPROGRAMADA";
        this.fecha = newFecha;
        this.horaInicio = newHoraInicio;
        this.horaFin = newHoraFin;
    }

    public boolean hasConflict(Appointment other) {
        if (!this.fecha.equals(other.getFecha()))
            return false;
        if (this.staffId != null && !this.staffId.equals(other.getStaffId()))
            return false;
        return this.horaInicio.isBefore(other.getHoraFin()) && other.getHoraInicio().isBefore(this.horaFin);
    }
}
