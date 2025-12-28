package com.poscl.marketing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "referrals")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Referral {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "referrer_id", nullable = false)
    private UUID referrerId; // Customer who refers
    
    @Column(name = "referred_id")
    private UUID referredId; // Customer who was referred (once registered)
    
    @Column(name = "referral_code", nullable = false)
    private String referralCode;
    
    @Column(name = "referred_email")
    private String referredEmail;
    
    @Column(name = "referred_phone")
    private String referredPhone;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReferralStatus status = ReferralStatus.PENDING;
    
    @Column(name = "referrer_reward", precision = 15, scale = 2)
    private BigDecimal referrerReward;
    
    @Column(name = "referred_reward", precision = 15, scale = 2)
    private BigDecimal referredReward;
    
    @Column(name = "referrer_reward_type")
    @Enumerated(EnumType.STRING)
    private RewardType referrerRewardType;
    
    @Column(name = "referred_reward_type")
    @Enumerated(EnumType.STRING)
    private RewardType referredRewardType;
    
    @Column(name = "referrer_rewarded")
    @Builder.Default
    private Boolean referrerRewarded = false;
    
    @Column(name = "referred_rewarded")
    @Builder.Default
    private Boolean referredRewarded = false;
    
    @Column(name = "first_purchase_amount", precision = 15, scale = 2)
    private BigDecimal firstPurchaseAmount;
    
    @Column(name = "converted_at")
    private LocalDateTime convertedAt;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public enum ReferralStatus {
        PENDING,    // Invitación enviada
        REGISTERED, // Referido se registró
        CONVERTED,  // Referido hizo primera compra
        REWARDED,   // Recompensas entregadas
        EXPIRED     // Expirado sin conversión
    }
    
    public enum RewardType {
        CASH,           // Dinero en efectivo
        POINTS,         // Puntos de lealtad
        DISCOUNT,       // Cupón de descuento
        FREE_PRODUCT    // Producto gratis
    }
}
