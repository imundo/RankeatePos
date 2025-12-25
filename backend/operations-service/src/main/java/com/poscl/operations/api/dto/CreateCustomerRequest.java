package com.poscl.operations.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCustomerRequest {
    
    @NotBlank(message = "Nombre es requerido")
    @Size(max = 100, message = "Nombre no puede exceder 100 caracteres")
    private String nombre;
    
    @Size(max = 100, message = "Email no puede exceder 100 caracteres")
    private String email;
    
    @Size(max = 20, message = "Teléfono no puede exceder 20 caracteres")
    private String telefono;
}
