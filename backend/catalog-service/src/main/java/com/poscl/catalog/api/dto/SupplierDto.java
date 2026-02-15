package com.poscl.catalog.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDto {
    private UUID id;
    private String nombre;
    private String rut;
    private String email;
    private String telefono;
    private String direccion;
    private String contacto;
    private String plazoPago;
    private Boolean activo;
}
