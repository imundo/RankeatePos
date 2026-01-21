package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Item de Lista de Precios - Precio específico de un producto en una lista
 */
@Entity
@Table(name = "price_list_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "price_list_id", "producto_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "price_list_id", nullable = false)
    private PriceList priceList;

    @Column(name = "producto_id", nullable = false)
    private UUID productoId;

    /**
     * Precio específico para esta lista
     */
    @Column(name = "precio", nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    /**
     * Descuento porcentual (0-100) aplicable si no hay precio fijo
     */
    @Column(precision = 5, scale = 2)
    private BigDecimal descuento;

    /**
     * Precio mínimo permitido
     */
    @Column(name = "precio_minimo", precision = 12, scale = 2)
    private BigDecimal precioMinimo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    /**
     * Calcula el precio final aplicando descuento si corresponde
     */
    public BigDecimal getPrecioFinal(BigDecimal precioBase) {
        if (precio != null && precio.compareTo(BigDecimal.ZERO) > 0) {
            return precio;
        }

        if (descuento != null && descuento.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal factor = BigDecimal.ONE.subtract(descuento.divide(BigDecimal.valueOf(100)));
            BigDecimal precioConDescuento = precioBase.multiply(factor);

            // Aplicar precio mínimo si existe
            if (precioMinimo != null && precioConDescuento.compareTo(precioMinimo) < 0) {
                return precioMinimo;
            }
            return precioConDescuento;
        }

        return precioBase;
    }
}
