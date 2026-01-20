package com.poscl.auth.domain.entity;

import com.poscl.shared.dto.BusinessType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Tenant (Empresa) - Entidad raíz para multi-tenancy
 */
@Entity
@Table(name = "tenants")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Datos empresa Chile
    @Column(nullable = false, unique = true, length = 12)
    private String rut;

    @Column(name = "razon_social", nullable = false, length = 200)
    private String razonSocial;

    @Column(name = "nombre_fantasia", length = 100)
    private String nombreFantasia;

    @Column(length = 200)
    private String giro;

    // Dirección
    @Column(length = 300)
    private String direccion;

    @Column(length = 100)
    private String comuna;

    @Column(length = 100)
    private String region;

    @Column(length = 100)
    private String ciudad;

    @Column(length = 20)
    private String telefono;

    @Column(length = 200)
    private String email;

    @Column(name = "sitio_web", length = 300)
    private String sitioWeb;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    // Configuración
    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", nullable = false, length = 50)
    @Builder.Default
    private BusinessType businessType = BusinessType.OTRO;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "CLP";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String timezone = "America/Santiago";

    @Column(name = "precio_con_iva", nullable = false)
    @Builder.Default
    private Boolean precioConIva = true;

    // Estado
    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String plan = "FREE";

    @Column(columnDefinition = "text")
    private String modules; // JSON array of enabled modules: ["pos", "inventory", "reservations"]

    // Relaciones
    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Branch> branches = new ArrayList<>();

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL)
    @Builder.Default
    private List<User> users = new ArrayList<>();

    // Auditoría
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // Helpers
    public void addBranch(Branch branch) {
        branches.add(branch);
        branch.setTenant(this);
    }

    public void addUser(User user) {
        users.add(user);
        user.setTenant(this);
    }

    public String getDisplayName() {
        return nombreFantasia != null ? nombreFantasia : razonSocial;
    }
}
