package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Lista de Precios - Precios diferenciados por sucursal, cliente o temporada
 */
@Entity
@Table(name = "price_lists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceList {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    /**
     * Tipo de lista: GENERAL, SUCURSAL, CLIENTE, TEMPORAL
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoPrecio tipo;

    /**
     * ID de sucursal si tipo = SUCURSAL
     */
    @Column(name = "sucursal_id")
    private UUID sucursalId;

    /**
     * ID de cliente si tipo = CLIENTE
     */
    @Column(name = "cliente_id")
    private UUID clienteId;

    /**
     * Fecha inicio para precios temporales
     */
    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    /**
     * Fecha fin para precios temporales
     */
    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    /**
     * Prioridad para resolver conflictos (mayor = más prioritario)
     */
    @Builder.Default
    private Integer prioridad = 0;

    @Builder.Default
    private Boolean activa = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum TipoPrecio {
        GENERAL,
        SUCURSAL,
        CLIENTE,
        TEMPORAL
    }

    /**
     * Verifica si la lista está vigente
     */
    public boolean isVigente(LocalDate fecha) {
        if (!Boolean.TRUE.equals(activa))
            return false;
        if (tipo != TipoPrecio.TEMPORAL)
            return true;

        boolean despuesDeInicio = fechaInicio == null || !fecha.isBefore(fechaInicio);
        boolean antesDeExpira = fechaFin == null || !fecha.isAfter(fechaFin);
        return despuesDeInicio && antesDeExpira;
    }
}
