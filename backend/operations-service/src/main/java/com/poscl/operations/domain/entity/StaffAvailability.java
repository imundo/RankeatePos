package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "staff_availability")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(name = "staff_id", nullable = false)
    private UUID staffId;

    @Column(name = "staff_nombre", length = 100)
    private String staffNombre;

    @Column(name = "dia_semana", nullable = false)
    private Integer diaSemana; // 0=DOM, 6=SAB

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Builder.Default
    private Boolean activo = true;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
