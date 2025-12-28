package com.poscl.marketing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "customers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Customer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(unique = true)
    private String email;
    
    private String phone;
    
    @Column(name = "document_number")
    private String documentNumber; // RUT
    
    private String address;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CustomerSegment segment = CustomerSegment.NEW;
    
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal clv = BigDecimal.ZERO; // Customer Lifetime Value
    
    @Column(name = "total_purchases")
    @Builder.Default
    private Integer totalPurchases = 0;
    
    @Column(name = "total_spent", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;
    
    @Column(name = "average_ticket", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal averageTicket = BigDecimal.ZERO;
    
    @Column(name = "last_purchase_date")
    private LocalDate lastPurchaseDate;
    
    @Column(name = "first_purchase_date")
    private LocalDate firstPurchaseDate;
    
    @Column(name = "birth_date")
    private LocalDate birthDate;
    
    @Column(name = "loyalty_points")
    @Builder.Default
    private Integer loyaltyPoints = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "loyalty_tier")
    @Builder.Default
    private LoyaltyTier loyaltyTier = LoyaltyTier.BRONZE;
    
    @Column(name = "score")
    @Builder.Default
    private Integer score = 0; // 0-100 customer scoring
    
    @Column(name = "email_opt_in")
    @Builder.Default
    private Boolean emailOptIn = true;
    
    @Column(name = "sms_opt_in")
    @Builder.Default
    private Boolean smsOptIn = true;
    
    @Column(name = "whatsapp_opt_in")
    @Builder.Default
    private Boolean whatsappOptIn = true;
    
    private String notes;
    
    @Column(name = "referral_code", unique = true)
    private String referralCode;
    
    @Column(name = "referred_by")
    private UUID referredBy;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CustomerTag> tags = new ArrayList<>();
    
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CustomerInteraction> interactions = new ArrayList<>();
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum CustomerSegment {
        VIP,        // Alto valor, frecuente
        REGULAR,    // Compras regulares
        NEW,        // Nuevo cliente
        AT_RISK,    // Sin compras recientes
        LOST        // Inactivo por mucho tiempo
    }
    
    public enum LoyaltyTier {
        BRONZE, SILVER, GOLD, PLATINUM
    }
}
