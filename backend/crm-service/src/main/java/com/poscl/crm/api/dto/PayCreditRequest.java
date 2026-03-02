package com.poscl.crm.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayCreditRequest {
    @NotNull(message = "El amount es obligatorio")
    @DecimalMin(value = "0.01", message = "El amount debe ser mayor a 0")
    private BigDecimal amount;

    @NotBlank(message = "El method de pago es obligatorio")
    private String method; // e.g. EFECTIVO, TRANSFERENCIA

    private String reference;
    private String description;
}
