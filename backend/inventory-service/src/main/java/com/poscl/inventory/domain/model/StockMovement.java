package com.poscl.inventory.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stock_movements")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovement {

    public enum TipoMovimiento {
        ENTRADA,
        SALIDA,
        AJUSTE_POSITIVO,
        AJUSTE_NEGATIVO,
        TRANSFERENCIA_ENTRADA,
        TRANSFERENCIA_SALIDA,
        DEVOLUCION,
        MERMA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "variant_id", nullable = false)
    private UUID variantId;

    @Column(name = "variant_sku")
    private String variantSku;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoMovimiento tipo;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "stock_anterior", nullable = false)
    private Integer stockAnterior;

    @Column(name = "stock_nuevo", nullable = false)
    private Integer stockNuevo;

    @Column(name = "costo_unitario")
    private Integer costoUnitario;

    @Column(length = 500)
    private String motivo;

    @Column(name = "documento_referencia", length = 100)
    private String documentoReferencia;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
