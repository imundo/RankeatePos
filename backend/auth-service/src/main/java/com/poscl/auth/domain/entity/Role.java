package com.poscl.auth.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.*;

/**
 * Role - Rol del sistema con permisos
 */
@Entity
@Table(name = "roles")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId; // NULL = rol global del sistema

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(length = 200)
    private String descripcion;

    @Column(name = "permisos", columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private String[] permisos;

    @Column(name = "es_sistema", nullable = false)
    @Builder.Default
    private Boolean esSistema = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    // Auditoría
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // Helpers
    public boolean hasPermission(String permission) {
        if (permisos == null)
            return false;
        for (String p : permisos) {
            if (p.equals(permission))
                return true;
        }
        return false;
    }

    public boolean isSystemRole() {
        return Boolean.TRUE.equals(esSistema);
    }

    public boolean isGlobalRole() {
        return tenantId == null;
    }
}
