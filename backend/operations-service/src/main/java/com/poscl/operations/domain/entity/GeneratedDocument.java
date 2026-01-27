package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Generated documents history (payslips, certificates, etc.)
 * Tracks all PDFs generated and sent to employees.
 */
@Entity
@Table(name = "generated_documents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType documentType;

    private String fileName;
    private String fileUrl;
    private Long fileSizeBytes;

    // For payslips and monthly documents
    private Integer year;
    private Integer month;
    private String period; // "2026-01" format

    // Email sending tracking
    @Builder.Default
    private boolean sentByEmail = false;
    private Instant sentAt;
    private String sentTo;
    private String emailStatus; // SENT, FAILED, BOUNCED

    private String generatedBy;
    private Instant generatedAt;

    @PrePersist
    void onCreate() {
        generatedAt = Instant.now();
    }

    public enum DocumentType {
        PAYSLIP, // Liquidación de sueldo
        SENIORITY_CERT, // Certificado de antigüedad
        INCOME_CERT, // Certificado de renta
        WORK_CERT, // Certificado de trabajo
        VACATION_CERT, // Comprobante de vacaciones
        TERMINATION, // Finiquito
        CONTRACT, // Contrato de trabajo
        SALARY_ADVANCE, // Comprobante de anticipo
        CUSTOM // Custom document
    }
}
