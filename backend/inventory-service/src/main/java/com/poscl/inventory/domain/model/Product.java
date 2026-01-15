package com.poscl.inventory.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.UUID;

/**
 * Read-only mirror of Product for shared DB access
 */
@Entity
@Table(name = "products") // Maps to existing table
@Getter
@Setter // Setter only to satisfy JPA
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product implements Serializable {

    @Id
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    private String sku;

    private String nombre;

    @Column(name = "imagen_url")
    private String imagenUrl;
}
