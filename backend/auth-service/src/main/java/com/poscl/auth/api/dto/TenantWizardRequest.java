package com.poscl.auth.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO para el wizard de creación de tenant con usuario admin
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantWizardRequest {

    // Paso 1: Datos del negocio
    @NotBlank(message = "RUT es requerido")
    private String rut;

    @NotBlank(message = "Razón social es requerida")
    private String razonSocial;

    private String nombreFantasia;

    @NotBlank(message = "Giro es requerido")
    private String giro;

    @NotBlank(message = "Tipo de negocio es requerido")
    private String businessType;

    // Paso 2: Ubicación
    private String direccion;
    private String comuna;
    private String region;
    private String ciudad;
    private String telefono;

    // Paso 3: Plan
    @Builder.Default
    private String plan = "FREE";

    // Paso 4: Usuario administrador
    @NotBlank(message = "Email del admin es requerido")
    @Email(message = "Email inválido")
    private String adminEmail;

    @NotBlank(message = "Contraseña del admin es requerida")
    @Size(min = 6, message = "Contraseña debe tener al menos 6 caracteres")
    private String adminPassword;

    @NotBlank(message = "Nombre del admin es requerido")
    private String adminNombre;

    private String adminApellido;
    private String adminTelefono;

    // Paso 5: Módulos (Opcional, si se seleccionan en el wizard)
    private java.util.Map<String, Boolean> modules;
}
