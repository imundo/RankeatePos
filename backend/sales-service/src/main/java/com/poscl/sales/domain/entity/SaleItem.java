package com.poscl.sales.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Línea de venta
 */
@Entity
@Table(name = "sale_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;
    
    @Column(name = "variant_id", nullable = false)
    private UUID variantId;
    
    @Column(name = "product_sku", nullable = false, length = 50)
    private String productSku;
    
    @Column(name = "product_nombre", nullable = false, length = 200)
    private String productNombre;
    
    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal cantidad;
    
    @Column(name = "precio_unitario", nullable = false)
    private Integer precioUnitario;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer descuento = 0;
    
    @Column(name = "impuesto_porcentaje", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal impuestoPorcentaje = BigDecimal.ZERO;
    
    @Column(name = "impuesto_monto", nullable = false)
    @Builder.Default
    private Integer impuestoMonto = 0;
    
    @Column(nullable = false)
    private Integer subtotal;
    
    @Column(nullable = false)
    private Integer total;
    
    // Helpers
    public void calculateTotals() {
        // En POS-Chile, el precioUnitario viene como Precio Bruto (con impuestos incluidos)
        int bruto = cantidad.multiply(BigDecimal.valueOf(precioUnitario)).intValue();
        this.total = bruto - descuento; // Total a pagar por la línea
        
        // Impuesto (extraer del total bruto)
        if (impuestoPorcentaje != null && impuestoPorcentaje.compareTo(BigDecimal.ZERO) > 0) {
            double rate = 1 + (impuestoPorcentaje.doubleValue() / 100);
            this.subtotal = (int) Math.round(this.total / rate);
            this.impuestoMonto = this.total - this.subtotal;
        } else {
            this.subtotal = this.total;
            this.impuestoMonto = 0;
        }
    }
}
