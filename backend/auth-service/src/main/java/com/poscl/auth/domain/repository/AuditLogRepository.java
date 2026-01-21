package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId AND a.action = :action ORDER BY a.createdAt DESC")
    List<AuditLog> findByTenantIdAndAction(UUID tenantId, String action);

    @Query("SELECT a FROM AuditLog a WHERE a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.createdAt DESC")
    List<AuditLog> findByEntity(String entityType, UUID entityId);

    @Query("SELECT a FROM AuditLog a WHERE a.createdAt >= :from AND a.createdAt <= :to ORDER BY a.createdAt DESC")
    Page<AuditLog> findByDateRange(Instant from, Instant to, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId AND a.createdAt >= :from ORDER BY a.createdAt DESC")
    Page<AuditLog> findByTenantIdAndCreatedAtAfter(UUID tenantId, Instant from, Pageable pageable);
}
