package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.GeneratedDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GeneratedDocumentRepository extends JpaRepository<GeneratedDocument, UUID> {
    Page<GeneratedDocument> findByTenantIdOrderByGeneratedAtDesc(UUID tenantId, Pageable pageable);

    List<GeneratedDocument> findByEmployeeIdOrderByGeneratedAtDesc(UUID employeeId);

    List<GeneratedDocument> findByEmployeeIdAndDocumentType(UUID employeeId,
            GeneratedDocument.DocumentType documentType);

    Optional<GeneratedDocument> findByEmployeeIdAndDocumentTypeAndPeriod(
            UUID employeeId, GeneratedDocument.DocumentType documentType, String period);

    List<GeneratedDocument> findByTenantIdAndDocumentTypeAndPeriod(
            UUID tenantId, GeneratedDocument.DocumentType documentType, String period);
}
