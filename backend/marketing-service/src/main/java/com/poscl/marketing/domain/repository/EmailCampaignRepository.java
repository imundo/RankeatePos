package com.poscl.marketing.domain.repository;

import com.poscl.marketing.domain.entity.EmailCampaign;
import com.poscl.marketing.domain.entity.EmailCampaign.CampaignStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, UUID> {
    
    Page<EmailCampaign> findByTenantId(UUID tenantId, Pageable pageable);
    
    Optional<EmailCampaign> findByIdAndTenantId(UUID id, UUID tenantId);
    
    List<EmailCampaign> findByTenantIdAndStatus(UUID tenantId, CampaignStatus status);
    
    @Query("SELECT c FROM EmailCampaign c WHERE c.status = 'SCHEDULED' AND c.scheduledAt <= :now")
    List<EmailCampaign> findScheduledToSend(@Param("now") LocalDateTime now);
    
    @Query("SELECT SUM(c.totalSent) FROM EmailCampaign c WHERE c.tenantId = :tenantId AND c.status = 'SENT'")
    Long totalEmailsSent(@Param("tenantId") UUID tenantId);
}
