package com.poscl.operations.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyCustomerDto {
    private UUID id;
    private String nombre;
    private String email;
    private String telefono;
    private Integer puntosActuales;
    private Integer puntosTotales;
    private String nivel;
    private LocalDateTime fechaRegistro;
    private LocalDateTime ultimaCompra;
    private Boolean activo;
}
