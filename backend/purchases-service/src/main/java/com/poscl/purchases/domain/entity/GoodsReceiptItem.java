package com.poscl.purchases.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "goods_receipt_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GoodsReceiptItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goods_receipt_id", nullable = false)
    private GoodsReceipt goodsReceipt;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_sku", length = 50)
    private String productSku;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "quantity_expected", precision = 18, scale = 4)
    private BigDecimal quantityExpected;

    @Column(name = "quantity_received", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantityReceived;

    @Column(name = "unit_cost", precision = 18, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "warehouse_location", length = 50)
    private String warehouseLocation;

    @Column(length = 200)
    private String notes;
}
