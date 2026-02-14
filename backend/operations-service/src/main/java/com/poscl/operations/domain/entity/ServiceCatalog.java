package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "service_catalog")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCatalog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(nullable = false, length = 100)
    private String nombre;

    private String descripcion;

    @Column(name = "duracion_minutos", nullable = false)
    @Builder.Default
    private Integer duracionMinutos = 60;

    private BigDecimal precio;

    @Column(length = 7)
    @Builder.Default
    private String color = "#6366f1";

    @Column(length = 50)
    @Builder.Default
    private String icono = "calendar";

    @Column(length = 50)
    private String categoria;

    @Column(name = "requiere_profesional")
    @Builder.Default
    private Boolean requiereProfesional = true;

    @Column(name = "max_reservas_simultaneas")
    @Builder.Default
    private Integer maxReservasSimultaneas = 1;

    @Builder.Default
    private Boolean activo = true;

    @Builder.Default
    private Integer orden = 0;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
