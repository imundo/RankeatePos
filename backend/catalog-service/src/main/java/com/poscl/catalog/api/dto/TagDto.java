package com.poscl.catalog.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TagDto {
    private UUID id;

    @NotBlank(message = "El nombre es requerido")
    @Size(max = 50, message = "El nombre no puede exceder 50 caracteres")
    private String nombre;

    @Size(max = 7, message = "El color debe ser un código hexadecimal")
    private String color;

    @Size(max = 10)
    private String icono;

    @Size(max = 200)
    private String descripcion;

    private Boolean activo;

    private Integer productCount;
}
