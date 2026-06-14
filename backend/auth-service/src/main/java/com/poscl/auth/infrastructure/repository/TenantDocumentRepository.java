package com.poscl.auth.infrastructure.repository;

import com.poscl.auth.domain.entity.TenantDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantDocumentRepository extends JpaRepository<TenantDocument, UUID> {
    List<TenantDocument> findByTenantId(UUID tenantId);
}
