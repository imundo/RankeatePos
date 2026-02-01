package com.poscl.billing.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Línea de detalle de un DTE
 */
@Entity
@Table(name = "dte_detalle")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DteDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dte_id", nullable = false)
    private Dte dte;

    @Column(name = "numero_linea", nullable = false)
    private Integer numeroLinea;

    // --- Identificación del item ---
    @Column(name = "tipo_codigo", length = 10)
    private String tipoCodigo; // INT1, EAN13, PLU

    @Column(name = "codigo", length = 35)
    private String codigo;

    @Column(name = "indicador_exento")
    private Integer indicadorExento; // 1 = exento, null = afecto

    // --- Descripción del item ---
    @Column(name = "nombre_item", nullable = false, length = 80)
    private String nombreItem;

    @Column(name = "descripcion_item", columnDefinition = "TEXT")
    private String descripcionItem;

    // --- Cantidades y precios ---
    @Column(name = "cantidad", nullable = false, precision = 18, scale = 6)
    private BigDecimal cantidad;

    @Column(name = "unidad_medida", length = 4)
    private String unidadMedida;

    @Column(name = "precio_unitario", nullable = false, precision = 18, scale = 6)
    private BigDecimal precioUnitario;

    @Column(name = "descuento_porcentaje", precision = 5, scale = 2)
    private BigDecimal descuentoPorcentaje;

    @Column(name = "descuento_monto", precision = 18, scale = 2)
    private BigDecimal descuentoMonto;

    @Column(name = "monto_item", nullable = false, precision = 18, scale = 2)
    private BigDecimal montoItem;

    // --- Referencia a producto original ---
    @Column(name = "producto_id")
    private UUID productoId;

    // --- Métodos helper ---
    public BigDecimal calcularMontoItem() {
        BigDecimal subtotal = cantidad.multiply(precioUnitario);
        if (descuentoMonto != null && descuentoMonto.compareTo(BigDecimal.ZERO) > 0) {
            subtotal = subtotal.subtract(descuentoMonto);
        } else if (descuentoPorcentaje != null && descuentoPorcentaje.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal descuento = subtotal.multiply(descuentoPorcentaje).divide(BigDecimal.valueOf(100));
            subtotal = subtotal.subtract(descuento);
        }
        return subtotal;
    }

    public boolean isExento() {
        return indicadorExento != null && indicadorExento == 1;
    }

    // --- Alias methods for compatibility ---
    public String getNombre() {
        return nombreItem;
    }

    public void setNombre(String nombre) {
        this.nombreItem = nombre;
    }

    public String getDescripcion() {
        return descripcionItem;
    }

    public void setDescripcion(String descripcion) {
        this.descripcionItem = descripcion;
    }

    public BigDecimal getMontoTotal() {
        return montoItem;
    }

    public void setMontoTotal(BigDecimal montoTotal) {
        this.montoItem = montoTotal;
    }
}
