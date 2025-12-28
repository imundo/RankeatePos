package com.poscl.marketing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "customer_interactions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CustomerInteraction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InteractionType type;
    
    @Column(nullable = false)
    private String title;
    
    private String description;
    
    @Column(name = "reference_id")
    private String referenceId; // Sale ID, Email Campaign ID, etc.
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public enum InteractionType {
        PURCHASE,           // Compra realizada
        EMAIL_SENT,         // Email enviado
        EMAIL_OPENED,       // Email abierto
        EMAIL_CLICKED,      // Click en email
        WHATSAPP_SENT,      // WhatsApp enviado
        WHATSAPP_REPLIED,   // Respuesta de cliente
        COUPON_USED,        // Cupón utilizado
        REVIEW_LEFT,        // Review dejado
        REFERRAL_MADE,      // Referido realizado
        LOYALTY_POINTS,     // Puntos de lealtad
        REWARD_REDEEMED,    // Recompensa canjeada
        NOTE,               // Nota manual
        RESERVATION,        // Reserva realizada
        COMPLAINT,          // Queja/reclamo
        SUPPORT             // Soporte
    }
}
