package com.poscl.auth.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO para cambiar estado de un tenant (activo/suspendido)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantStatusRequest {
    private boolean activo;
    private String motivo; // Razón del cambio (opcional)
}
