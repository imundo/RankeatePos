package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointment_reminders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Appointment appointment;

    @Column(nullable = false, length = 20)
    private String canal; // EMAIL, WHATSAPP, SMS, PUSH

    @Column(length = 20)
    @Builder.Default
    private String estado = "PENDIENTE"; // PENDIENTE, ENVIADO, FALLIDO, ENTREGADO

    @Column(name = "fecha_programada")
    private LocalDateTime fechaProgramada;

    @Column(name = "fecha_envio")
    private LocalDateTime fechaEnvio;

    private String contenido;

    @Column(name = "error_detalle")
    private String errorDetalle;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public void markSent() {
        this.estado = "ENVIADO";
        this.fechaEnvio = LocalDateTime.now();
    }

    public void markFailed(String error) {
        this.estado = "FALLIDO";
        this.errorDetalle = error;
    }
}
