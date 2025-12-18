package com.poscl.catalog.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Unidad de medida
 */
@Entity
@Table(name = "units")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Unit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "tenant_id")
    private UUID tenantId; // NULL = unidad global
    
    @Column(nullable = false, length = 10)
    private String codigo;
    
    @Column(nullable = false, length = 50)
    private String nombre;
    
    @Column(name = "permite_decimales", nullable = false)
    @Builder.Default
    private Boolean permiteDecimales = false;
    
    // Helpers
    public boolean isGlobal() {
        return tenantId == null;
    }
}
