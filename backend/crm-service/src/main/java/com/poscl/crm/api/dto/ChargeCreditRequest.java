package com.poscl.crm.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChargeCreditRequest {
    @NotNull(message = "El amount es obligatorio")
    @DecimalMin(value = "0.01", message = "El amount debe ser mayor a 0")
    private BigDecimal amount;

    @NotNull(message = "El saleId es obligatorio")
    private UUID saleId;

    private String description;
}
