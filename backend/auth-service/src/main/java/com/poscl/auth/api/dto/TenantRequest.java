package com.poscl.auth.api.dto;

import com.poscl.shared.dto.BusinessType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO para crear un tenant
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantRequest {
    private String rut;
    private String razonSocial;
    private String nombreFantasia;
    private String giro;
    private String direccion;
    private String comuna;
    private String region;
    private String ciudad;
    private String telefono;
    private BusinessType businessType;
    private String plan;
}
