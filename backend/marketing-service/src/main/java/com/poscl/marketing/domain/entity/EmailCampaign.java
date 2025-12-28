package com.poscl.marketing.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_campaigns")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EmailCampaign {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false)
    private String name;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private EmailTemplate template;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CampaignStatus status = CampaignStatus.DRAFT;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "target_segment")
    private Customer.CustomerSegment targetSegment;
    
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @Column(name = "total_sent")
    @Builder.Default
    private Integer totalSent = 0;
    
    @Column(name = "total_opened")
    @Builder.Default
    private Integer totalOpened = 0;
    
    @Column(name = "total_clicked")
    @Builder.Default
    private Integer totalClicked = 0;
    
    @Column(name = "total_bounced")
    @Builder.Default
    private Integer totalBounced = 0;
    
    @Column(name = "total_unsubscribed")
    @Builder.Default
    private Integer totalUnsubscribed = 0;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public enum CampaignStatus {
        DRAFT,      // Borrador
        SCHEDULED,  // Programada
        SENDING,    // Enviando
        SENT,       // Enviada
        CANCELLED   // Cancelada
    }
    
    public double getOpenRate() {
        return totalSent > 0 ? (double) totalOpened / totalSent * 100 : 0;
    }
    
    public double getClickRate() {
        return totalOpened > 0 ? (double) totalClicked / totalOpened * 100 : 0;
    }
}
