package com.poscl.operations.api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class PublicAttendanceLinkDto {
    private UUID id;
    private UUID tenantId;
    private UUID branchId;
    private String token;
    private String name;
    private String description;
    private boolean active;
    private Instant deactivatedAt;
    private String deactivatedBy;
    private String deactivationReason;
    private long totalClockIns;
    private long totalClockOuts;
    private LocalDate lastUsedDate;
    private Instant lastUsedAt;
    private String createdBy;
    private Instant createdAt;

    // Computed field for full URL
    private String publicUrl;
}
