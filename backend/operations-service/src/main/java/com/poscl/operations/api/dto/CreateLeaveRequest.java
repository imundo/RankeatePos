package com.poscl.operations.api.dto;

import com.poscl.operations.domain.entity.LeaveRequest;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateLeaveRequest {
    @NotNull(message = "El empleado es requerido")
    private UUID employeeId;

    @NotNull(message = "El tipo de solicitud es requerido")
    private LeaveRequest.RequestType type;

    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal daysRequested;

    // For salary advance
    private BigDecimal amountRequested;

    // For benefits
    private String benefitCode;

    private String reason;
    private String notes;
    private String attachmentUrl;
    private String attachmentFileName;
}
