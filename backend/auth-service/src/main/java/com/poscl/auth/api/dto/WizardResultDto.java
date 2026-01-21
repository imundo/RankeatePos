package com.poscl.auth.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Response DTO del wizard de creación de tenant + usuario
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WizardResultDto {
    private UUID tenantId;
    private String tenantName;
    private String rut;
    private String razonSocial;
    private UUID userId;
    private String userEmail;
    private String message;
}
