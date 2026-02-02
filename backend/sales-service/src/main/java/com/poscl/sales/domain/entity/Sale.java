package com.poscl.sales.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Venta
 */
@Entity
@Table(name = "sales")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {

    public enum Estado {
        PENDIENTE, COMPLETADA, ANULADA
    }

    public enum DteStatus {
        NONE, PENDING, SENT, ERROR
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private CashSession session;

    // Idempotencia para offline sync
    @Column(name = "command_id", unique = true)
    private UUID commandId;

    @Column(nullable = false, length = 20)
    private String numero;

    // Cliente opcional
    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "customer_nombre", length = 200)
    private String customerNombre;

    // Totales en CLP
    @Column(nullable = false)
    @Builder.Default
    private Integer subtotal = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer descuento = 0;

    @Column(name = "descuento_porcentaje")
    private java.math.BigDecimal descuentoPorcentaje;

    @Column(nullable = false)
    @Builder.Default
    private Integer impuestos = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer total = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Estado estado = Estado.COMPLETADA;

    // Anulación
    @Column(name = "anulada_at")
    private Instant anuladaAt;

    @Column(name = "anulada_por")
    private UUID anuladaPor;

    @Column(name = "anulacion_motivo", columnDefinition = "TEXT")
    private String anulacionMotivo;

    // Aprobación
    @Column(name = "aprobada_at")
    private Instant aprobadaAt;

    @Column(name = "aprobada_por")
    private UUID aprobadaPor;

    // Billing Integration (Queue)
    @Enumerated(EnumType.STRING)
    @Column(name = "dte_status", length = 20)
    @Builder.Default
    private DteStatus dteStatus = DteStatus.NONE;

    @Column(name = "dte_error", columnDefinition = "TEXT")
    private String dteError;

    // Items y pagos
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SalePayment> payments = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    // Helpers
    public void addItem(SaleItem item) {
        items.add(item);
        item.setSale(this);
    }

    public void addPayment(SalePayment payment) {
        payments.add(payment);
        payment.setSale(this);
    }

    public void calculateTotals() {
        this.subtotal = items.stream()
                .mapToInt(SaleItem::getSubtotal)
                .sum();

        this.impuestos = items.stream()
                .mapToInt(SaleItem::getImpuestoMonto)
                .sum();

        int totalBruto = items.stream()
                .mapToInt(SaleItem::getTotal)
                .sum();

        this.total = totalBruto - this.descuento;
    }

    public void cancel(UUID cancelledBy, String motivo) {
        this.estado = Estado.ANULADA;
        this.anuladaAt = Instant.now();
        this.anuladaPor = cancelledBy;
        this.anulacionMotivo = motivo;
    }

    public boolean isCompleted() {
        return estado == Estado.COMPLETADA;
    }

    public boolean isCancelled() {
        return estado == Estado.ANULADA;
    }

    public UUID getSessionId() {
        return session != null ? session.getId() : null;
    }
}
