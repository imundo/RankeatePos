package com.poscl.marketing.api.controller;

import com.poscl.marketing.application.service.EmailService;
import com.poscl.marketing.domain.entity.EmailCampaign;
import com.poscl.marketing.domain.entity.EmailTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmailController {
    
    private final EmailService emailService;
    
    // ========== Templates ==========
    
    @GetMapping("/templates")
    public ResponseEntity<List<EmailTemplate>> findAllTemplates(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(emailService.findAllTemplates(tenantId));
    }
    
    @GetMapping("/templates/{id}")
    public ResponseEntity<EmailTemplate> findTemplateById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return emailService.findTemplateById(tenantId, id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/templates")
    public ResponseEntity<EmailTemplate> createTemplate(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody EmailTemplate template) {
        return ResponseEntity.ok(emailService.createTemplate(tenantId, template));
    }
    
    @PutMapping("/templates/{id}")
    public ResponseEntity<EmailTemplate> updateTemplate(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @RequestBody EmailTemplate template) {
        return ResponseEntity.ok(emailService.updateTemplate(tenantId, id, template));
    }
    
    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Void> deleteTemplate(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        emailService.deleteTemplate(tenantId, id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/templates/{id}/preview")
    public ResponseEntity<String> previewTemplate(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @RequestParam(required = false) UUID customerId) {
        return ResponseEntity.ok(emailService.previewTemplate(tenantId, id, customerId));
    }
    
    // ========== Campaigns ==========
    
    @GetMapping("/campaigns")
    public ResponseEntity<Page<EmailCampaign>> findAllCampaigns(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(emailService.findAllCampaigns(tenantId, pageable));
    }
    
    @GetMapping("/campaigns/{id}")
    public ResponseEntity<EmailCampaign> findCampaignById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return emailService.findCampaignById(tenantId, id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/campaigns")
    public ResponseEntity<EmailCampaign> createCampaign(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody EmailCampaign campaign) {
        return ResponseEntity.ok(emailService.createCampaign(tenantId, campaign));
    }
    
    @PostMapping("/campaigns/{id}/schedule")
    public ResponseEntity<EmailCampaign> scheduleCampaign(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @RequestParam LocalDateTime scheduledAt) {
        return ResponseEntity.ok(emailService.scheduleCampaign(tenantId, id, scheduledAt));
    }
    
    @PostMapping("/campaigns/{id}/send")
    public ResponseEntity<EmailCampaign> sendCampaignNow(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(emailService.sendCampaignNow(tenantId, id));
    }
    
    @PostMapping("/campaigns/{id}/cancel")
    public ResponseEntity<EmailCampaign> cancelCampaign(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(emailService.cancelCampaign(tenantId, id));
    }
    
    // ========== Automations ==========
    
    @PostMapping("/automations/birthday")
    public ResponseEntity<Void> sendBirthdayEmails(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        emailService.sendBirthdayEmails(tenantId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/automations/re-engagement")
    public ResponseEntity<Void> sendReEngagementEmails(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(defaultValue = "60") int daysInactive) {
        emailService.sendReEngagementEmails(tenantId, daysInactive);
        return ResponseEntity.ok().build();
    }
    
    // ========== Analytics ==========
    
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(emailService.getAnalytics(tenantId));
    }
}
