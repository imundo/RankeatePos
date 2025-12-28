package com.poscl.marketing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_templates")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EmailTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String subject;
    
    @Column(name = "body_html", columnDefinition = "TEXT")
    private String bodyHtml;
    
    @Column(name = "body_text", columnDefinition = "TEXT")
    private String bodyText;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TemplateType type;
    
    @Enumerated(EnumType.STRING)
    private AutomationTrigger trigger;
    
    @Column(name = "preview_text")
    private String previewText;
    
    @Builder.Default
    private Boolean active = true;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    public enum TemplateType {
        TRANSACTIONAL,  // Confirmación de pedido, recibos
        MARKETING,      // Promociones, newsletters
        AUTOMATED       // Automatizaciones
    }
    
    public enum AutomationTrigger {
        WELCOME,            // Bienvenida al registrarse
        BIRTHDAY,           // Cumpleaños
        RE_ENGAGEMENT,      // Re-engagement después de X días
        CART_ABANDONED,     // Carrito abandonado
        POST_PURCHASE,      // Después de compra
        LOYALTY_LEVEL_UP,   // Subida de nivel lealtad
        REFERRAL_SUCCESS    // Referido exitoso
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
