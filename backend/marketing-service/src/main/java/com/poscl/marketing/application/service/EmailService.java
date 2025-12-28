package com.poscl.marketing.application.service;

import com.poscl.marketing.domain.entity.Customer;
import com.poscl.marketing.domain.entity.EmailCampaign;
import com.poscl.marketing.domain.entity.EmailCampaign.CampaignStatus;
import com.poscl.marketing.domain.entity.EmailTemplate;
import com.poscl.marketing.domain.entity.EmailTemplate.AutomationTrigger;
import com.poscl.marketing.domain.repository.CustomerRepository;
import com.poscl.marketing.domain.repository.EmailCampaignRepository;
import com.poscl.marketing.domain.repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final EmailTemplateRepository templateRepository;
    private final EmailCampaignRepository campaignRepository;
    private final CustomerRepository customerRepository;
    
    // ========== Templates CRUD ==========
    
    public List<EmailTemplate> findAllTemplates(UUID tenantId) {
        return templateRepository.findByTenantIdAndActiveTrue(tenantId);
    }
    
    public Optional<EmailTemplate> findTemplateById(UUID tenantId, UUID id) {
        return templateRepository.findByIdAndTenantId(id, tenantId);
    }
    
    @Transactional
    public EmailTemplate createTemplate(UUID tenantId, EmailTemplate template) {
        template.setTenantId(tenantId);
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());
        return templateRepository.save(template);
    }
    
    @Transactional
    public EmailTemplate updateTemplate(UUID tenantId, UUID id, EmailTemplate updated) {
        return templateRepository.findByIdAndTenantId(id, tenantId)
            .map(existing -> {
                existing.setName(updated.getName());
                existing.setSubject(updated.getSubject());
                existing.setBodyHtml(updated.getBodyHtml());
                existing.setBodyText(updated.getBodyText());
                existing.setType(updated.getType());
                existing.setTrigger(updated.getTrigger());
                existing.setPreviewText(updated.getPreviewText());
                existing.setActive(updated.getActive());
                return templateRepository.save(existing);
            })
            .orElseThrow(() -> new RuntimeException("Template not found"));
    }
    
    @Transactional
    public void deleteTemplate(UUID tenantId, UUID id) {
        templateRepository.findByIdAndTenantId(id, tenantId)
            .ifPresent(templateRepository::delete);
    }
    
    // ========== Campaigns CRUD ==========
    
    public Page<EmailCampaign> findAllCampaigns(UUID tenantId, Pageable pageable) {
        return campaignRepository.findByTenantId(tenantId, pageable);
    }
    
    public Optional<EmailCampaign> findCampaignById(UUID tenantId, UUID id) {
        return campaignRepository.findByIdAndTenantId(id, tenantId);
    }
    
    @Transactional
    public EmailCampaign createCampaign(UUID tenantId, EmailCampaign campaign) {
        campaign.setTenantId(tenantId);
        campaign.setStatus(CampaignStatus.DRAFT);
        campaign.setCreatedAt(LocalDateTime.now());
        return campaignRepository.save(campaign);
    }
    
    @Transactional
    public EmailCampaign scheduleCampaign(UUID tenantId, UUID id, LocalDateTime scheduledAt) {
        return campaignRepository.findByIdAndTenantId(id, tenantId)
            .map(campaign -> {
                campaign.setScheduledAt(scheduledAt);
                campaign.setStatus(CampaignStatus.SCHEDULED);
                return campaignRepository.save(campaign);
            })
            .orElseThrow(() -> new RuntimeException("Campaign not found"));
    }
    
    @Transactional
    public EmailCampaign cancelCampaign(UUID tenantId, UUID id) {
        return campaignRepository.findByIdAndTenantId(id, tenantId)
            .map(campaign -> {
                campaign.setStatus(CampaignStatus.CANCELLED);
                return campaignRepository.save(campaign);
            })
            .orElseThrow(() -> new RuntimeException("Campaign not found"));
    }
    
    // ========== Campaign Sending (Simulated) ==========
    
    @Transactional
    public EmailCampaign sendCampaignNow(UUID tenantId, UUID campaignId) {
        EmailCampaign campaign = campaignRepository.findByIdAndTenantId(campaignId, tenantId)
            .orElseThrow(() -> new RuntimeException("Campaign not found"));
        
        if (campaign.getTemplate() == null) {
            throw new RuntimeException("Campaign must have a template");
        }
        
        // Get target customers
        List<Customer> recipients;
        if (campaign.getTargetSegment() != null) {
            recipients = customerRepository.findByTenantIdAndSegment(tenantId, campaign.getTargetSegment());
        } else {
            recipients = customerRepository.findEmailOptedIn(tenantId);
        }
        
        campaign.setStatus(CampaignStatus.SENDING);
        campaignRepository.save(campaign);
        
        // Simulate sending
        int sent = 0;
        for (Customer customer : recipients) {
            if (customer.getEmail() != null && customer.getEmailOptIn()) {
                // In production, this would integrate with SendGrid, Mailgun, etc.
                log.info("Sending email to: {} - Subject: {}", 
                    customer.getEmail(), campaign.getTemplate().getSubject());
                sent++;
            }
        }
        
        campaign.setTotalSent(sent);
        campaign.setSentAt(LocalDateTime.now());
        campaign.setStatus(CampaignStatus.SENT);
        
        return campaignRepository.save(campaign);
    }
    
    // ========== Automations ==========
    
    @Transactional
    public void sendBirthdayEmails(UUID tenantId) {
        Optional<EmailTemplate> templateOpt = templateRepository
            .findByTenantIdAndTrigger(tenantId, AutomationTrigger.BIRTHDAY);
        
        if (templateOpt.isEmpty()) {
            log.warn("No birthday template configured for tenant: {}", tenantId);
            return;
        }
        
        EmailTemplate template = templateOpt.get();
        List<Customer> birthdayCustomers = customerRepository.findBirthdaysToday(
            tenantId, 
            LocalDateTime.now().getMonthValue(), 
            LocalDateTime.now().getDayOfMonth()
        );
        
        for (Customer customer : birthdayCustomers) {
            if (customer.getEmail() != null && customer.getEmailOptIn()) {
                String personalizedSubject = template.getSubject()
                    .replace("{{name}}", customer.getName());
                String personalizedBody = template.getBodyHtml()
                    .replace("{{name}}", customer.getName());
                
                log.info("Sending birthday email to: {} - Subject: {}", 
                    customer.getEmail(), personalizedSubject);
            }
        }
    }
    
    @Transactional
    public void sendReEngagementEmails(UUID tenantId, int daysInactive) {
        Optional<EmailTemplate> templateOpt = templateRepository
            .findByTenantIdAndTrigger(tenantId, AutomationTrigger.RE_ENGAGEMENT);
        
        if (templateOpt.isEmpty()) {
            log.warn("No re-engagement template configured for tenant: {}", tenantId);
            return;
        }
        
        EmailTemplate template = templateOpt.get();
        List<Customer> atRiskCustomers = customerRepository.findAtRiskCustomers(
            tenantId, 
            java.time.LocalDate.now().minusDays(daysInactive)
        );
        
        for (Customer customer : atRiskCustomers) {
            if (customer.getEmail() != null && customer.getEmailOptIn()) {
                log.info("Sending re-engagement email to: {}", customer.getEmail());
            }
        }
    }
    
    // ========== Analytics ==========
    
    public Map<String, Object> getAnalytics(UUID tenantId) {
        Map<String, Object> analytics = new HashMap<>();
        
        Long totalSent = campaignRepository.totalEmailsSent(tenantId);
        analytics.put("totalEmailsSent", totalSent != null ? totalSent : 0);
        
        Page<EmailCampaign> recentCampaigns = campaignRepository.findByTenantId(tenantId, 
            Pageable.ofSize(10));
        
        double avgOpenRate = recentCampaigns.getContent().stream()
            .filter(c -> c.getTotalSent() > 0)
            .mapToDouble(EmailCampaign::getOpenRate)
            .average()
            .orElse(0);
        analytics.put("averageOpenRate", avgOpenRate);
        
        double avgClickRate = recentCampaigns.getContent().stream()
            .filter(c -> c.getTotalOpened() > 0)
            .mapToDouble(EmailCampaign::getClickRate)
            .average()
            .orElse(0);
        analytics.put("averageClickRate", avgClickRate);
        
        analytics.put("recentCampaigns", recentCampaigns.getContent());
        
        return analytics;
    }
    
    // ========== Template Preview ==========
    
    public String previewTemplate(UUID tenantId, UUID templateId, UUID customerId) {
        EmailTemplate template = templateRepository.findByIdAndTenantId(templateId, tenantId)
            .orElseThrow(() -> new RuntimeException("Template not found"));
        
        Customer customer = customerRepository.findById(customerId)
            .orElse(Customer.builder().name("Cliente").email("cliente@example.com").build());
        
        return template.getBodyHtml()
            .replace("{{name}}", customer.getName())
            .replace("{{email}}", customer.getEmail() != null ? customer.getEmail() : "")
            .replace("{{points}}", String.valueOf(customer.getLoyaltyPoints()));
    }
}
