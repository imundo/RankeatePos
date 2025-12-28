package com.poscl.marketing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "coupons")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Coupon {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;
    
    @Column(nullable = false, unique = true)
    private String code;
    
    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCode; // Base64 encoded QR image
    
    @Column(name = "max_uses")
    @Builder.Default
    private Integer maxUses = 1;
    
    @Column(name = "current_uses")
    @Builder.Default
    private Integer currentUses = 0;
    
    @Column(name = "assigned_to")
    private UUID assignedTo; // Specific customer ID if personal coupon
    
    @Builder.Default
    private Boolean active = true;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    public boolean isValid() {
        boolean dateValid = expiresAt == null || !LocalDateTime.now().isAfter(expiresAt);
        boolean usesValid = currentUses < maxUses;
        return active && dateValid && usesValid && promotion.isValid();
    }
}
