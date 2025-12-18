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
 * Sesión de caja (turno)
 */
@Entity
@Table(name = "cash_sessions")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashSession {
    
    public enum Estado {
        ABIERTA, CERRADA
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "register_id", nullable = false)
    private CashRegister register;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "monto_inicial", nullable = false)
    @Builder.Default
    private Integer montoInicial = 0;
    
    @Column(name = "monto_final")
    private Integer montoFinal;
    
    @Column(name = "monto_teorico")
    private Integer montoTeorico;
    
    @Column
    private Integer diferencia;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Estado estado = Estado.ABIERTA;
    
    @Column(name = "apertura_at", nullable = false)
    @Builder.Default
    private Instant aperturaAt = Instant.now();
    
    @Column(name = "cierre_at")
    private Instant cierreAt;
    
    @Column(name = "cierre_nota", columnDefinition = "TEXT")
    private String cierreNota;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Sale> sales = new ArrayList<>();
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    // Helpers
    public boolean isOpen() {
        return estado == Estado.ABIERTA;
    }
    
    public UUID getRegisterId() {
        return register != null ? register.getId() : null;
    }
    
    /**
     * Cierra la sesión calculando el monto teórico
     */
    public void close(Integer montoFinalActual, String nota) {
        this.montoFinal = montoFinalActual;
        this.cierreAt = Instant.now();
        this.cierreNota = nota;
        this.estado = Estado.CERRADA;
        
        // Calcular monto teórico (inicial + ventas efectivo)
        int totalEfectivo = sales.stream()
            .filter(s -> s.getEstado() == Sale.Estado.COMPLETADA)
            .flatMap(s -> s.getPayments().stream())
            .filter(p -> "EFECTIVO".equals(p.getMedio()))
            .mapToInt(SalePayment::getMonto)
            .sum();
        
        this.montoTeorico = montoInicial + totalEfectivo;
        this.diferencia = montoFinal - montoTeorico;
    }
}
