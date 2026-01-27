package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.EmployeeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, UUID> {
    List<EmployeeDocument> findByEmployeeIdOrderByUploadedAtDesc(UUID employeeId);

    List<EmployeeDocument> findByEmployeeIdAndCategory(UUID employeeId, EmployeeDocument.DocumentCategory category);

    long countByEmployeeId(UUID employeeId);
}
