package com.poscl.sales.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Pago de venta
 */
@Entity
@Table(name = "sale_payments")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalePayment {
    
    public enum Medio {
        EFECTIVO,
        DEBITO,
        CREDITO,
        TRANSFERENCIA
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;
    
    @Column(nullable = false, length = 30)
    private String medio;
    
    @Column(nullable = false)
    private Integer monto;
    
    @Column(length = 100)
    private String referencia;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
