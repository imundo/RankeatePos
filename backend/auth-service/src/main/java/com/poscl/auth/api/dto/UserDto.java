package com.poscl.auth.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * DTO de User para respuestas API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private UUID id;
    private String email;
    private String nombre;
    private String apellido;
    private String telefono;
    private Boolean activo;
    private Boolean emailVerificado;
    private Instant ultimoLogin;
    private Set<String> roles;
    private Set<String> permissions;
    private List<BranchInfo> branches;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BranchInfo {
        private UUID id;
        private String nombre;
        private String codigo;
    }
}
