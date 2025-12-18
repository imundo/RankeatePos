package com.poscl.auth.api.dto;

import jakarta.validation.constraints.Size;
import lombok.*;
import java.util.List;
import java.util.UUID;

/**
 * Request para actualizar usuario
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Size(max = 100)
    private String nombre;

    @Size(max = 100)
    private String apellido;

    private String telefono;

    private Boolean activo;

    private List<String> roles;

    private List<UUID> branchIds;
}
