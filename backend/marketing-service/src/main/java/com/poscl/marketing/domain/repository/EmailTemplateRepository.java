package com.poscl.marketing.domain.repository;

import com.poscl.marketing.domain.entity.EmailTemplate;
import com.poscl.marketing.domain.entity.EmailTemplate.AutomationTrigger;
import com.poscl.marketing.domain.entity.EmailTemplate.TemplateType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID> {
    
    List<EmailTemplate> findByTenantIdAndActiveTrue(UUID tenantId);
    
    List<EmailTemplate> findByTenantIdAndType(UUID tenantId, TemplateType type);
    
    Optional<EmailTemplate> findByTenantIdAndTrigger(UUID tenantId, AutomationTrigger trigger);
    
    Optional<EmailTemplate> findByIdAndTenantId(UUID id, UUID tenantId);
}
