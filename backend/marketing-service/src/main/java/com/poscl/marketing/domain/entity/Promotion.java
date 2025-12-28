package com.poscl.marketing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "promotions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Promotion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromotionType type;
    
    @Column(name = "discount_value", precision = 15, scale = 2)
    private BigDecimal discountValue;
    
    @Column(name = "min_purchase", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal minPurchase = BigDecimal.ZERO;
    
    @Column(name = "max_discount", precision = 15, scale = 2)
    private BigDecimal maxDiscount;
    
    @Column(name = "start_date")
    private LocalDateTime startDate;
    
    @Column(name = "end_date")
    private LocalDateTime endDate;
    
    @Column(name = "max_uses")
    private Integer maxUses;
    
    @Column(name = "current_uses")
    @Builder.Default
    private Integer currentUses = 0;
    
    @Column(name = "uses_per_customer")
    @Builder.Default
    private Integer usesPerCustomer = 1;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "target_segment")
    private Customer.CustomerSegment targetSegment;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "target_tier")
    private Customer.LoyaltyTier targetTier;
    
    @Builder.Default
    private Boolean active = true;
    
    @Builder.Default
    private Boolean stackable = false; // Can combine with other promos
    
    @Column(name = "product_ids")
    private String productIds; // Comma-separated if applies to specific products
    
    @Column(name = "category_ids")
    private String categoryIds; // Comma-separated if applies to specific categories
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @OneToMany(mappedBy = "promotion", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Coupon> coupons = new ArrayList<>();
    
    public enum PromotionType {
        PERCENTAGE,     // X% de descuento
        FIXED_AMOUNT,   // $X de descuento
        BOGO,           // Buy One Get One
        FREE_PRODUCT,   // Producto gratis
        FREE_SHIPPING,  // Envío gratis
        BUNDLE          // Pack / combo
    }
    
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        boolean dateValid = (startDate == null || !now.isBefore(startDate)) && 
                           (endDate == null || !now.isAfter(endDate));
        boolean usesValid = maxUses == null || currentUses < maxUses;
        return active && dateValid && usesValid;
    }
}
