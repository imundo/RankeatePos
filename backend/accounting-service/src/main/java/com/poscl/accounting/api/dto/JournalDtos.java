package com.poscl.accounting.api.dto;

import com.poscl.accounting.domain.entity.JournalEntry;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class JournalDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateJournalEntryRequest {
        @NotNull(message = "La fecha es requerida")
        private LocalDate entryDate;

        @NotNull(message = "El tipo es requerido")
        private JournalEntry.JournalType type;

        @NotBlank(message = "La descripción es requerida")
        @Size(max = 500)
        private String description;

        private String referenceType;
        private UUID referenceId;
        private String referenceNumber;
        private UUID branchId;

        @NotEmpty(message = "Debe incluir al menos una línea")
        @Valid
        private List<JournalLineRequest> lines;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JournalLineRequest {
        @NotNull(message = "La cuenta es requerida")
        private UUID accountId;

        @NotNull(message = "El monto al debe es requerido")
        @DecimalMin(value = "0", message = "El monto debe ser mayor o igual a 0")
        private BigDecimal debit;

        @NotNull(message = "El monto al haber es requerido")
        @DecimalMin(value = "0", message = "El monto debe ser mayor o igual a 0")
        private BigDecimal credit;

        @Size(max = 300)
        private String description;

        private UUID costCenterId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JournalEntryResponse {
        private UUID id;
        private Long entryNumber;
        private LocalDate entryDate;
        private JournalEntry.JournalType type;
        private String description;
        private String referenceType;
        private UUID referenceId;
        private String referenceNumber;
        private BigDecimal totalDebit;
        private BigDecimal totalCredit;
        private JournalEntry.JournalStatus status;
        private Boolean isAutomatic;
        private LocalDateTime postedAt;
        private LocalDateTime createdAt;
        private List<JournalLineResponse> lines;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JournalLineResponse {
        private UUID id;
        private UUID accountId;
        private String accountCode;
        private String accountName;
        private BigDecimal debit;
        private BigDecimal credit;
        private String description;
        private Integer lineOrder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PostJournalEntryRequest {
        private UUID postedBy;
    }
}
