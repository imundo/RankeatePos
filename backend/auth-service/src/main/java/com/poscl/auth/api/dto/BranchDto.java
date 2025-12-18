package com.poscl.auth.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO de Branch para respuestas API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchDto {

    private UUID id;
    private String nombre;
    private String codigo;
    private String direccion;
    private String comuna;
    private String ciudad;
    private String telefono;
    private String email;
    private Boolean esPrincipal;
    private Boolean activa;
}
