package com.poscl.marketing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reviews")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Review {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "customer_id", nullable = false)
    private UUID customerId;
    
    @Column(name = "sale_id")
    private UUID saleId;
    
    @Column(nullable = false)
    private Integer rating; // 1-5 stars
    
    @Column(columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = true;
    
    @Column(columnDefinition = "TEXT")
    private String response; // Business response
    
    @Column(name = "responded_at")
    private LocalDateTime respondedAt;
    
    @Column(name = "responded_by")
    private UUID respondedBy;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.PENDING;
    
    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false; // Verified purchase
    
    @Column(name = "helpful_count")
    @Builder.Default
    private Integer helpfulCount = 0;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public enum ReviewStatus {
        PENDING,    // Pendiente de revisión
        APPROVED,   // Aprobado y visible
        REJECTED,   // Rechazado
        FLAGGED     // Marcado para revisar
    }
}
