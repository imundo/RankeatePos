package com.poscl.auth.api.controller;

import com.poscl.auth.application.service.AuditLogService;
import com.poscl.auth.domain.entity.AuditLog;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("hasRole('SAAS_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLogDto>> getByTenant(
            @PathVariable UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(
                auditLogService.findByTenant(tenantId, pageable).map(this::toDto));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('SAAS_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLogDto>> getByUser(
            @PathVariable UUID userId,
            Pageable pageable) {
        return ResponseEntity.ok(
                auditLogService.findByUser(userId, pageable).map(this::toDto));
    }

    @GetMapping("/recent/{tenantId}")
    @PreAuthorize("hasRole('SAAS_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLogDto>> getRecent(
            @PathVariable UUID tenantId,
            @RequestParam(defaultValue = "7") int days,
            Pageable pageable) {
        return ResponseEntity.ok(
                auditLogService.findRecent(tenantId, days, pageable).map(this::toDto));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("hasRole('SAAS_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<List<AuditLogDto>> getByEntity(
            @PathVariable String entityType,
            @PathVariable UUID entityId) {
        return ResponseEntity.ok(
                auditLogService.findByEntity(entityType, entityId).stream()
                        .map(this::toDto)
                        .collect(Collectors.toList()));
    }

    private AuditLogDto toDto(AuditLog log) {
        return new AuditLogDto(
                log.getId(),
                log.getTenantId(),
                log.getUserId(),
                log.getUserEmail(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDescription(),
                log.getOldValue(),
                log.getNewValue(),
                log.getIpAddress(),
                log.getCreatedAt());
    }

    public record AuditLogDto(
            UUID id,
            UUID tenantId,
            UUID userId,
            String userEmail,
            String action,
            String entityType,
            UUID entityId,
            String description,
            String oldValue,
            String newValue,
            String ipAddress,
            Instant createdAt) {
    }
}
