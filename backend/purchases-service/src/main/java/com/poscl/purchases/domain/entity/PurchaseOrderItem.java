package com.poscl.purchases.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Ítem de Orden de Compra
 */
@Entity
@Table(name = "purchase_order_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PurchaseOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_sku", length = 50)
    private String productSku;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal quantity;

    @Column(length = 20)
    @Builder.Default
    private String unit = "UN";

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(precision = 18, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "quantity_received", precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal quantityReceived = BigDecimal.ZERO;

    @Column(name = "line_order")
    @Builder.Default
    private Integer lineOrder = 0;

    @PrePersist
    @PreUpdate
    public void calculateSubtotal() {
        this.subtotal = this.quantity.multiply(this.unitPrice);
    }
}
