package com.poscl.operations.api.dto;

import com.poscl.operations.domain.entity.LeaveRequest;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class LeaveRequestDto {
    private UUID id;
    private UUID tenantId;
    private UUID employeeId;
    private String employeeName;
    private LeaveRequest.RequestType type;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal daysRequested;
    private BigDecimal amountRequested;
    private String benefitCode;
    private String reason;
    private String notes;
    private String attachmentUrl;
    private String attachmentFileName;
    private LeaveRequest.RequestStatus status;
    private UUID approvedBy;
    private String approverName;
    private String rejectionReason;
    private Instant approvedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
