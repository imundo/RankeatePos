package com.poscl.auth.application.service;

import com.poscl.auth.domain.entity.AuditLog;
import com.poscl.auth.domain.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    // ================== Logging Actions ==================

    @Async
    @Transactional
    public void logAction(UUID tenantId, UUID userId, String userEmail, String action,
            String entityType, UUID entityId, String description) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .userEmail(userEmail)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(description)
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit log saved: {} by {} on {}", action, userEmail, entityType);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    @Async
    @Transactional
    public void logChange(UUID tenantId, UUID userId, String userEmail, String action,
            String entityType, UUID entityId, String description,
            String oldValue, String newValue) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .userEmail(userEmail)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(description)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log with changes: {}", e.getMessage());
        }
    }

    @Async
    @Transactional
    public void logLogin(UUID tenantId, UUID userId, String userEmail, String ipAddress, String userAgent) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .userEmail(userEmail)
                    .action("LOGIN")
                    .description("Usuario inició sesión")
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to log login: {}", e.getMessage());
        }
    }

    // ================== Query Actions ==================

    @Transactional(readOnly = true)
    public Page<AuditLog> findByTenant(UUID tenantId, Pageable pageable) {
        return auditLogRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> findByUser(UUID userId, Pageable pageable) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> findByEntity(String entityType, UUID entityId) {
        return auditLogRepository.findByEntity(entityType, entityId);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> findRecent(UUID tenantId, int days, Pageable pageable) {
        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        return auditLogRepository.findByTenantIdAndCreatedAtAfter(tenantId, from, pageable);
    }

    // ================== Cleanup ==================

    @Transactional
    public long deleteOldLogs(int retentionDays) {
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        // Would need custom delete query for production
        log.info("Would delete logs older than: {}", cutoff);
        return 0; // Placeholder
    }
}
