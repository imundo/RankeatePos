package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rewards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Column(name = "puntos_requeridos", nullable = false)
    private Integer puntosRequeridos;

    @Column(nullable = false, length = 30)
    private String tipo; // DESCUENTO_PORCENTAJE, DESCUENTO_MONTO, PRODUCTO_GRATIS

    private BigDecimal valor;

    @Column(name = "producto_id")
    private UUID productoId;

    @Column(name = "max_canjes")
    private Integer maxCanjes;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Builder.Default
    private Boolean activo = true;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isValid() {
        if (!activo) return false;
        LocalDate today = LocalDate.now();
        if (fechaInicio != null && today.isBefore(fechaInicio)) return false;
        if (fechaFin != null && today.isAfter(fechaFin)) return false;
        return true;
    }
}
