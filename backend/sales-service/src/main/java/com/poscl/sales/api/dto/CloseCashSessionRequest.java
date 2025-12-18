package com.poscl.sales.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Request para cerrar caja
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloseCashSessionRequest {
    
    @NotNull(message = "El monto final es obligatorio")
    @Min(value = 0, message = "El monto final no puede ser negativo")
    private Integer montoFinal;
    
    private String nota;
}
