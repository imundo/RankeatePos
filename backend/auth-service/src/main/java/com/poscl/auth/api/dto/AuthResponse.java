package com.poscl.auth.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

/**
 * Respuesta de autenticación exitosa
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;

    private UserInfo user;
    private TenantInfo tenant;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private UUID id;
        private String email;
        private String nombre;
        private String apellido;
        private Set<String> roles;
        private Set<String> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantInfo {
        private UUID id;
        private String rut;
        private String nombre; // nombre_fantasia or razon_social
        private String razonSocial;
        private String giro;
        private String direccion;
        private String comuna;
        private String ciudad;
        private String telefono;
        private String email;
        private String logoUrl;
        private String businessType;
        private String plan;
        private java.util.List<String> modules;
    }
}
