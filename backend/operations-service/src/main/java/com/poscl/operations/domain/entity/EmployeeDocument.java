package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Documents uploaded for an employee.
 * Examples: contracts, ID copies, certificates, medical licenses.
 */
@Entity
@Table(name = "employee_documents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    private DocumentCategory category;

    private String documentType; // CONTRATO, CEDULA, CERTIFICADO, LICENCIA_MEDICA, FINIQUITO
    private String fileName;
    private String fileUrl;
    private Long fileSizeBytes;
    private String mimeType;

    private LocalDate documentDate;
    private LocalDate expirationDate;

    private String notes;
    private String uploadedBy;

    private Instant uploadedAt;

    @PrePersist
    void onCreate() {
        uploadedAt = Instant.now();
    }

    public enum DocumentCategory {
        CONTRACT, // Employment contracts
        IDENTIFICATION, // ID copies
        CERTIFICATE, // Various certificates
        MEDICAL, // Medical documents
        TERMINATION, // Termination documents
        OTHER
    }
}
