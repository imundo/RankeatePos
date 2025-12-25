package com.poscl.operations.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AddPointsRequest {
    
    @NotNull(message = "Puntos es requerido")
    @Min(value = 1, message = "Puntos debe ser mayor a 0")
    private Integer puntos;
    
    private String descripcion;
    
    private UUID ventaId;
}
