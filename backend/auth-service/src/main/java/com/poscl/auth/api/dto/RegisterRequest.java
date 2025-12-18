package com.poscl.auth.api.dto;

import com.poscl.shared.dto.BusinessType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request para registrar una nueva empresa + usuario admin
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    
    // Datos empresa
    @NotBlank(message = "El RUT es obligatorio")
    @Size(max = 12, message = "El RUT no puede exceder 12 caracteres")
    private String rut;
    
    @NotBlank(message = "La razón social es obligatoria")
    @Size(max = 200, message = "La razón social no puede exceder 200 caracteres")
    private String razonSocial;
    
    @Size(max = 100, message = "El nombre de fantasía no puede exceder 100 caracteres")
    private String nombreFantasia;
    
    @Size(max = 200)
    private String giro;
    
    private String direccion;
    private String comuna;
    private String region;
    
    private BusinessType businessType;
    
    // Datos usuario admin
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe ser válido")
    private String email;
    
    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;
    
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100)
    private String nombre;
    
    @Size(max = 100)
    private String apellido;
    
    private String telefono;
}
