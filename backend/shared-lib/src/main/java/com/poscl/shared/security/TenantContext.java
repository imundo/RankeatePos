package com.poscl.shared.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

/**
 * Contexto del tenant actual. Se propaga en cada request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantContext {
    
    private UUID tenantId;
    private String tenantName;
    private UUID branchId;
    private String branchName;
    private UUID userId;
    private String userEmail;
    private Set<String> roles;
    private Set<String> permissions;
    
    /**
     * Verifica si el usuario tiene un rol específico
     */
    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }
    
    /**
     * Verifica si el usuario tiene un permiso específico
     */
    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }
    
    /**
     * Verifica si es owner/admin del tenant
     */
    public boolean isOwnerAdmin() {
        return hasRole(Roles.OWNER_ADMIN);
    }
    
    /**
     * Verifica si es manager
     */
    public boolean isManager() {
        return hasRole(Roles.MANAGER);
    }
}
