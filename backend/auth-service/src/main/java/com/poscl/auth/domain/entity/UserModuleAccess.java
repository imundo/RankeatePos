package com.poscl.auth.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * UserModuleAccess - Permisos granulares ON/OFF por usuario
 */
@Entity
@Table(name = "user_module_access")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserModuleAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "module_id", nullable = false)
    private UUID moduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", insertable = false, updatable = false)
    private Module module;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @CreatedDate
    @Column(name = "granted_at", updatable = false)
    private Instant grantedAt;

    @Column(name = "granted_by")
    private UUID grantedBy;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
