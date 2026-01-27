package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Unified leave/request system.
 * Handles vacations, unpaid leave, medical leave, salary advances, etc.
 */
@Entity
@Table(name = "leave_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequest {
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
    private RequestType type;

    // Date range for leave
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal daysRequested;

    // For salary advance requests
    private BigDecimal amountRequested;

    // For benefit requests
    private String benefitCode;

    private String reason;
    private String notes;

    // Attachment for medical leaves, etc.
    private String attachmentUrl;
    private String attachmentFileName;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    // Approval workflow
    private UUID approvedBy;
    private String approverName;
    private String rejectionReason;
    private Instant approvedAt;

    // For multi-level approval
    private Integer approvalLevel;
    private Integer requiredApprovalLevel;

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public enum RequestType {
        VACATION, // Paid vacation
        LEAVE_WITHOUT_PAY, // Unpaid leave
        MEDICAL_LEAVE, // Sick leave (with attachment)
        SALARY_ADVANCE, // Money advance
        ADMINISTRATIVE_DAY, // Administrative leave
        COMPENSATORY, // Compensatory time off
        BENEFIT // Flexible benefit request
    }

    public enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED,
        CANCELLED,
        EXPIRED
    }
}
