package com.poscl.sales.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

/**
 * Request para abrir caja
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenCashSessionRequest {
    
    @NotNull(message = "El registerId es obligatorio")
    private UUID registerId;
    
    @NotNull(message = "El monto inicial es obligatorio")
    @Min(value = 0, message = "El monto inicial no puede ser negativo")
    private Integer montoInicial;
}
