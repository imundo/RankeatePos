package com.poscl.auth.api.dto;

import com.poscl.shared.dto.BusinessType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO de Tenant para respuestas API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDto {
    
    private UUID id;
    private String rut;
    private String razonSocial;
    private String nombreFantasia;
    private String giro;
    private String direccion;
    private String comuna;
    private String region;
    private BusinessType businessType;
    private String currency;
    private String timezone;
    private Boolean precioConIva;
    private Boolean activo;
    private String plan;
    private Instant createdAt;
    
    private List<BranchDto> branches;
}
